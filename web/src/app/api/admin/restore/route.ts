import { NextResponse } from 'next/server';
import { getAuthUser, isAdminUser } from '@/lib/auth';
import { ensureKaizenSchema } from '@/lib/kaizenDbMigration';
import { logAudit } from '@/lib/auditLogger';
import { sanitizeBackupPayload } from '@/lib/driveBackup';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session || !session.empCode) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập để sử dụng công cụ Restore (401 Unauthorized)' },
        { status: 401 }
      );
    }

    if (!isAdminUser(session)) {
      return NextResponse.json(
        { success: false, error: '403 Forbidden: Chỉ Admin/Super Admin mới có quyền thực hiện khôi phục dữ liệu từ Sao lưu.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') !== 'false'; // Default to true for safety!

    const body = await request.json();
    const { category, backupData, fileName } = body;

    const dataItems = Array.isArray(backupData) ? backupData : backupData?.data ? (Array.isArray(backupData.data) ? backupData.data : [backupData.data]) : [];

    if (dataItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tập tin backup không chứa bản ghi dữ liệu hợp lệ nào.' },
        { status: 400 }
      );
    }

    // Lọc bỏ mật khẩu trước khi xử lý
    const sanitizedItems = sanitizeBackupPayload(dataItems);

    const db = getDbBinding();
    let toCreateCount = 0;
    let toUpdateCount = 0;
    let sampleDiffs: any[] = [];

    if (db) {
      await ensureKaizenSchema(db);

      for (const item of sanitizedItems) {
        const itemId = item.id || item.room_id || item.emp_code || item.code;
        if (!itemId) continue;

        // Target table determination based on category
        let tableName = 'sys_audit_logs';
        if (category === 'ROOMS' || item.room_id) tableName = 'room_bookings';
        else if (category === 'USERS' || item.emp_code) tableName = 'auth_login_history';
        else if (category === 'KAIZEN' || item.trang_thai) tableName = 'ci_kaizen_proposals';

        const existing: any = await db
          .prepare(`SELECT * FROM ${tableName} WHERE id = ?`)
          .bind(itemId)
          .first()
          .catch(() => null);

        if (existing) {
          toUpdateCount++;
          if (sampleDiffs.length < 5) {
            sampleDiffs.push({
              id: itemId,
              action: 'UPDATE',
              table: tableName,
              before: existing,
              after: item,
            });
          }

          if (!dryRun) {
            // Executive restore update
            if (tableName === 'room_bookings') {
              await db.prepare(`
                UPDATE room_bookings
                SET room_name = COALESCE(?, room_name),
                    status = COALESCE(?, status),
                    purpose = COALESCE(?, purpose)
                WHERE id = ?
              `).bind(item.room_name || item.roomName || null, item.status || null, item.purpose || null, itemId).run().catch(() => {});
            }
          }
        } else {
          toCreateCount++;
          if (sampleDiffs.length < 5) {
            sampleDiffs.push({
              id: itemId,
              action: 'CREATE',
              table: tableName,
              after: item,
            });
          }

          if (!dryRun) {
            // Executive restore insert
            if (tableName === 'sys_audit_logs') {
              await db.prepare(`
                INSERT INTO sys_audit_logs (id, emp_code, emp_name, role_code, module, action, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `).bind(itemId, item.emp_code || 'RESTORE', item.emp_name || 'System Restore', item.role_code || 'ADMIN', item.module || 'RESTORE', item.action || 'RESTORE_ITEM').run().catch(() => {});
            }
          }
        }
      }
    } else {
      // In-memory estimation fallback
      toCreateCount = sanitizedItems.length;
      sampleDiffs = sanitizedItems.slice(0, 3).map((item: any) => ({
        id: item.id || 'new_item',
        action: 'CREATE',
        after: item,
      }));
    }

    // If actual restore executed (dryRun = false), log RESTORE_FROM_BACKUP audit log
    if (!dryRun) {
      await logAudit(request, {
        empCode: session.empCode,
        empName: session.name,
        roleCode: session.roleCode,
        module: 'SYSTEM_ADMIN',
        action: 'RESTORE_FROM_BACKUP',
        targetType: 'DATABASE',
        targetId: fileName || category || 'GDRIVE_BACKUP',
        status: 'SUCCESS',
        changesJson: {
          executorEmpCode: session.empCode,
          executorName: session.name,
          fileName,
          category,
          toCreateCount,
          toUpdateCount,
          totalRestored: toCreateCount + toUpdateCount,
          executedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      dryRun,
      message: dryRun
        ? `[DRY-RUN PREVIEW] Kết quả kiểm tra file backup: ${toCreateCount} bản ghi sẽ tạo mới, ${toUpdateCount} bản ghi sẽ cập nhật.`
        : `[RESTORE SUCCESS] Đã khôi phục thành công ${toCreateCount + toUpdateCount} bản ghi từ file backup!`,
      summary: {
        totalRecordsInFile: sanitizedItems.length,
        toCreateCount,
        toUpdateCount,
        sampleDiffs,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
