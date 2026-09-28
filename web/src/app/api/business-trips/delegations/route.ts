import { NextResponse } from "next/server";
import { getAuthUser, isDepartmentHead } from "@/lib/auth";
import { ensureKaizenSchema } from "@/lib/kaizenDbMigration";

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

const MEMORY_DELEGATIONS = new Map<string, any>();

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = getDbBinding();
    let delegations: any[] = [];

    if (db) {
      await ensureKaizenSchema(db);
      const res = await db.prepare(`
        SELECT * FROM business_trip_delegations
        WHERE (delegator_emp_code = ? OR delegate_to_emp_code = ?) AND is_active = 1
        ORDER BY created_at DESC
      `).bind(session.empCode, session.empCode).all().catch(() => null);

      if (res && Array.isArray(res.results)) {
        delegations = res.results;
      }
    } else {
      delegations = Array.from(MEMORY_DELEGATIONS.values()).filter(
        (d) => (d.delegator_emp_code === session.empCode || d.delegate_to_emp_code === session.empCode) && d.is_active === 1
      );
    }

    return NextResponse.json({ success: true, data: delegations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isDepartmentHead(session)) {
      return NextResponse.json(
        { success: false, error: "Chỉ Trưởng phòng hoặc Ban Giám Đốc mới có quyền thiết lập ủy quyền duyệt!" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { delegateToEmpCode, delegateToName, startDate, endDate, scope } = body;

    if (!delegateToEmpCode || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Vui lòng nhập đầy đủ Người được ủy quyền và Khoảng ngày!" }, { status: 400 });
    }

    const delegatorEmpCode = session.empCode;

    // Rule 1: No self-delegation
    if (delegatorEmpCode.trim().toUpperCase() === delegateToEmpCode.trim().toUpperCase()) {
      return NextResponse.json({ success: false, error: "Không thể tự ủy quyền cho chính mình!" }, { status: 400 });
    }

    // Rule 2: Circular delegation check (Check if B has already delegated to A)
    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      const circularCheck = await db.prepare(`
        SELECT * FROM business_trip_delegations
        WHERE delegator_emp_code = ? AND delegate_to_emp_code = ? AND is_active = 1
      `).bind(delegateToEmpCode.trim().toUpperCase(), delegatorEmpCode.trim().toUpperCase()).first().catch(() => null);

      if (circularCheck) {
        return NextResponse.json(
          { success: false, error: `Cảnh báo ủy quyền vòng tròn: Nhân sự ${delegateToName || delegateToEmpCode} đã ủy quyền cho bạn từ trước!` },
          { status: 400 }
        );
      }
    }

    const id = `del_${Date.now()}`;
    const delegationObj = {
      id,
      delegator_emp_code: delegatorEmpCode,
      delegator_name: session.name || delegatorEmpCode,
      delegate_to_emp_code: delegateToEmpCode.trim().toUpperCase(),
      delegate_to_name: delegateToName || delegateToEmpCode,
      start_date: startDate,
      end_date: endDate,
      scope: scope || "ALL",
      department_id: session.departmentCode || "TBS",
      is_active: 1,
      created_at: new Date().toISOString(),
    };

    if (db) {
      await db.prepare(`
        INSERT INTO business_trip_delegations (
          id, delegator_emp_code, delegator_name, delegate_to_emp_code, delegate_to_name, start_date, end_date, scope, department_id, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(
        id,
        delegatorEmpCode,
        session.name || delegatorEmpCode,
        delegateToEmpCode.trim().toUpperCase(),
        delegateToName || delegateToEmpCode,
        startDate,
        endDate,
        scope || "ALL",
        session.departmentCode || "TBS"
      ).run();

      // Audit Log
      try {
        const logId = `log_${Date.now()}`;
        await db.prepare(`
          INSERT INTO sys_audit_logs (id, emp_code, emp_name, role_code, module, action, target_type, target_id, changes_json)
          VALUES (?, ?, ?, ?, 'BUSINESS_TRIP', 'CREATE_DELEGATION', 'DELEGATION', ?, ?)
        `).bind(
          logId,
          session.empCode,
          session.name,
          session.roleCode || "TRUONG_PHONG",
          id,
          JSON.stringify(delegationObj)
        ).run().catch(() => {});
      } catch (e) {}
    } else {
      MEMORY_DELEGATIONS.set(id, delegationObj);
    }

    return NextResponse.json({ success: true, message: "Đã thiết lập ủy quyền duyệt thành công!", data: delegationObj });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID ủy quyền là bắt buộc" }, { status: 400 });
    }

    const db = getDbBinding();
    if (db) {
      await ensureKaizenSchema(db);
      await db.prepare(`UPDATE business_trip_delegations SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND delegator_emp_code = ?`)
        .bind(id, session.empCode).run();

      // Audit Log
      try {
        const logId = `log_${Date.now()}`;
        await db.prepare(`
          INSERT INTO sys_audit_logs (id, emp_code, emp_name, role_code, module, action, target_type, target_id, changes_json)
          VALUES (?, ?, ?, ?, 'BUSINESS_TRIP', 'REVOKE_DELEGATION', 'DELEGATION', ?, ?)
        `).bind(
          logId,
          session.empCode,
          session.name,
          session.roleCode || "TRUONG_PHONG",
          id,
          JSON.stringify({ revoked_at: new Date().toISOString() })
        ).run().catch(() => {});
      } catch (e) {}
    } else {
      MEMORY_DELEGATIONS.delete(id);
    }

    return NextResponse.json({ success: true, message: "Đã thu hồi ủy quyền duyệt thành công!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
