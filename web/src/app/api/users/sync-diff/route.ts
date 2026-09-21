import { NextResponse } from "next/server";

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { newUsers = [], updatedUsers = [], deactivatedUsers = [], options = {}, sourceFileName = "File_Excel_Import.xlsx" } = body;

    const db = getDbBinding();
    let successCount = 0;
    let updatedCount = 0;
    let deactivatedCount = 0;

    if (db) {
      try {
        // Ensure table exists
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS sys_users (
            id TEXT PRIMARY KEY,
            emp_code TEXT UNIQUE,
            name TEXT,
            email TEXT,
            phone TEXT,
            title TEXT,
            department TEXT,
            role_code TEXT,
            status TEXT DEFAULT 'ACTIVE',
            ngay_vao TEXT,
            vtcv_hien_tai TEXT,
            phong_ban_hien_tai TEXT,
            vtcv_sap TEXT,
            vtcv_sap_xep TEXT,
            pb_sap_xep TEXT,
            bo_phan_moi TEXT,
            phong_ban_moi TEXT,
            ghi_chu TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run().catch(() => {});

        await db.prepare(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            action TEXT,
            user_email TEXT,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run().catch(() => {});

        await db.prepare(`
          DELETE FROM sys_users WHERE rowid NOT IN (
            SELECT MIN(rowid) FROM sys_users WHERE emp_code IS NOT NULL AND emp_code != '' GROUP BY emp_code
          )
        `).run().catch(() => {});

        await db.prepare(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_users_emp_code ON sys_users(emp_code)
        `).run().catch(() => {});

        const statements: any[] = [];

        // 1. Insert New Users
        for (const u of newUsers) {
          const empCodeStr = String(u.empCode || u.emp_code || "").trim();
          if (!empCodeStr) continue;

          statements.push(
            db.prepare(`
              INSERT INTO sys_users (
                id, emp_code, name, email, phone, title, department, role_code, status,
                ngay_vao, vtcv_hien_tai, phong_ban_hien_tai, vtcv_sap, vtcv_sap_xep,
                pb_sap_xep, bo_phan_moi, phong_ban_moi, ghi_chu
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(emp_code) DO UPDATE SET
                name = excluded.name,
                email = excluded.email,
                phone = excluded.phone,
                title = excluded.title,
                department = excluded.department,
                role_code = excluded.role_code,
                status = 'ACTIVE',
                ngay_vao = excluded.ngay_vao,
                vtcv_hien_tai = excluded.vtcv_hien_tai,
                phong_ban_hien_tai = excluded.phong_ban_hien_tai,
                vtcv_sap = excluded.vtcv_sap,
                vtcv_sap_xep = excluded.vtcv_sap_xep,
                pb_sap_xep = excluded.pb_sap_xep,
                bo_phan_moi = excluded.bo_phan_moi,
                phong_ban_moi = excluded.phong_ban_moi,
                ghi_chu = excluded.ghi_chu
            `).bind(
              String(u.id || `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`),
              empCodeStr,
              String(u.name || "").trim(),
              String(u.email || "").trim(),
              String(u.phone || "").trim(),
              String(u.title || "").trim(),
              String(u.department || "").trim(),
              String(u.roleCode || u.role_code || "CBCNV").trim(),
              String(u.ngayVao || u.ngay_vao || "").trim(),
              String(u.vtcvHienTai || u.vtcv_hien_tai || "").trim(),
              String(u.phongBanHienTai || u.phong_ban_hien_tai || "").trim(),
              String(u.vtcvSap || u.vtcv_sap || "").trim(),
              String(u.vtcvSapXep || u.vtcv_sap_xep || "").trim(),
              String(u.phongBanSapXep || u.pb_sap_xep || "").trim(),
              String(u.boPhoanMoi || u.bo_phan_moi || "").trim(),
              String(u.phongBanMoi || u.phong_ban_moi || "").trim(),
              String(u.ghiChu || u.ghi_chu || "").trim()
            )
          );
          successCount++;
        }

        // 2. Update Modified Users
        for (const item of updatedUsers) {
          const u = item.data || item;
          const empCodeStr = String(u.empCode || u.emp_code || "").trim();
          if (!empCodeStr) continue;

          if (options.preserveManualLock) {
            statements.push(
              db.prepare(`
                UPDATE sys_users SET
                  name = ?, email = ?, phone = ?, title = ?, department = ?, role_code = ?,
                  ngay_vao = ?, vtcv_hien_tai = ?, phong_ban_hien_tai = ?, vtcv_sap = ?,
                  vtcv_sap_xep = ?, pb_sap_xep = ?, bo_phan_moi = ?, phong_ban_moi = ?, ghi_chu = ?
                WHERE emp_code = ?
              `).bind(
                String(u.name || "").trim(),
                String(u.email || "").trim(),
                String(u.phone || "").trim(),
                String(u.title || "").trim(),
                String(u.department || "").trim(),
                String(u.roleCode || u.role_code || "CBCNV").trim(),
                String(u.ngayVao || u.ngay_vao || "").trim(),
                String(u.vtcvHienTai || u.vtcv_hien_tai || "").trim(),
                String(u.phongBanHienTai || u.phong_ban_hien_tai || "").trim(),
                String(u.vtcvSap || u.vtcv_sap || "").trim(),
                String(u.vtcvSapXep || u.vtcv_sap_xep || "").trim(),
                String(u.phongBanSapXep || u.pb_sap_xep || "").trim(),
                String(u.boPhoanMoi || u.bo_phan_moi || "").trim(),
                String(u.phongBanMoi || u.phong_ban_moi || "").trim(),
                String(u.ghiChu || u.ghi_chu || "").trim(),
                empCodeStr
              )
            );
          } else {
            statements.push(
              db.prepare(`
                UPDATE sys_users SET
                  name = ?, email = ?, phone = ?, title = ?, department = ?, role_code = ?, status = 'ACTIVE',
                  ngay_vao = ?, vtcv_hien_tai = ?, phong_ban_hien_tai = ?, vtcv_sap = ?,
                  vtcv_sap_xep = ?, pb_sap_xep = ?, bo_phan_moi = ?, phong_ban_moi = ?, ghi_chu = ?
                WHERE emp_code = ?
              `).bind(
                String(u.name || "").trim(),
                String(u.email || "").trim(),
                String(u.phone || "").trim(),
                String(u.title || "").trim(),
                String(u.department || "").trim(),
                String(u.roleCode || u.role_code || "CBCNV").trim(),
                String(u.ngayVao || u.ngay_vao || "").trim(),
                String(u.vtcvHienTai || u.vtcv_hien_tai || "").trim(),
                String(u.phongBanHienTai || u.phong_ban_hien_tai || "").trim(),
                String(u.vtcvSap || u.vtcv_sap || "").trim(),
                String(u.vtcvSapXep || u.vtcv_sap_xep || "").trim(),
                String(u.phongBanSapXep || u.pb_sap_xep || "").trim(),
                String(u.boPhoanMoi || u.bo_phan_moi || "").trim(),
                String(u.phongBanMoi || u.phong_ban_moi || "").trim(),
                String(u.ghiChu || u.ghi_chu || "").trim(),
                empCodeStr
              )
            );
          }
          updatedCount++;
        }

        // 3. Deactivate Removed Users
        for (const item of deactivatedUsers) {
          const empCodeStr = String(typeof item === "string" ? item : item.empCode || item.emp_code || "").trim();
          if (!empCodeStr) continue;
          statements.push(
            db.prepare(`UPDATE sys_users SET status = 'INACTIVE' WHERE emp_code = ?`).bind(empCodeStr)
          );
          deactivatedCount++;
        }

        // 4. Audit Log
        const auditDetail = `Diff Sync File: ${sourceFileName} | Added: ${successCount} | Updated: ${updatedCount} | Deactivated: ${deactivatedCount}`;
        statements.push(
          db.prepare(`
            INSERT INTO audit_logs (id, action, user_email, details)
            VALUES (?, 'PERSONNEL_DIFF_SYNC', 'admin@tbsgroup.vn', ?)
          `).bind(`log_${Date.now()}`, auditDetail)
        );

        if (statements.length > 0 && typeof db.batch === "function") {
          const CHUNK_SIZE = 50;
          for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
            const chunk = statements.slice(i, i + CHUNK_SIZE);
            try {
              await db.batch(chunk);
            } catch (batchErr) {
              console.warn("D1 batch failed, fallback individual inserts:", batchErr);
              for (const stmt of chunk) {
                await stmt.run().catch(() => {});
              }
            }
          }
        } else if (statements.length > 0) {
          for (const stmt of statements) {
            await stmt.run().catch(() => {});
          }
        }
      } catch (e: any) {
        console.warn("DB Diff Sync batch error:", e?.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        newUsersCount: newUsers.length,
        updatedUsersCount: updatedUsers.length,
        deactivatedUsersCount: deactivatedUsers.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
