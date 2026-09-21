import { NextResponse } from 'next/server';
import { sanitizeDeep } from '@/lib/auditLogger';

function getDbBinding(): any {
  return (process.env as any).DB || (globalThis as any).DB || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getDbBinding();
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown Browser';

    const eventType = body.eventType || 'GENERAL_AUDIT';
    const timestamp = new Date().toISOString();

    // Deep sanitize input body to guarantee zero password string leakage
    const sanitizedData = sanitizeDeep(body.data || {});

    // Strictly purge any password fields from sanitized payload if present
    if (sanitizedData.password) delete sanitizedData.password;
    if (sanitizedData.oldPassword) delete sanitizedData.oldPassword;
    if (sanitizedData.newPassword) delete sanitizedData.newPassword;
    if (sanitizedData.confirmPassword) delete sanitizedData.confirmPassword;
    if (sanitizedData.pass) delete sanitizedData.pass;

    if (db) {
      try {
        // 1. Log to login_logout_logs table if LOGIN / LOGOUT
        if (eventType === 'LOGIN_LOGOUT') {
          await db.prepare(`
            CREATE TABLE IF NOT EXISTS login_logout_logs (
              id TEXT PRIMARY KEY,
              emp_code TEXT,
              emp_name TEXT,
              action TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              ip_address TEXT,
              device_info TEXT,
              result TEXT
            )
          `).run().catch(() => {});

          await db.prepare(`
            INSERT INTO login_logout_logs (id, emp_code, emp_name, action, timestamp, ip_address, device_info, result)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            sanitizedData.emp_code || sanitizedData.empCode || 'GUEST',
            sanitizedData.emp_name || sanitizedData.empName || 'Khách / Vô danh',
            sanitizedData.action || 'Đăng nhập',
            timestamp,
            clientIp,
            userAgent,
            sanitizedData.result || 'SUCCESS'
          ).run().catch(() => {});
        }

        // 2. Log to password_change_logs table if PASSWORD_CHANGE
        else if (eventType === 'PASSWORD_CHANGE') {
          await db.prepare(`
            CREATE TABLE IF NOT EXISTS password_change_logs (
              id TEXT PRIMARY KEY,
              emp_code TEXT,
              emp_name TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              changed_by TEXT,
              result TEXT,
              reason TEXT
            )
          `).run().catch(() => {});

          await db.prepare(`
            INSERT INTO password_change_logs (id, emp_code, emp_name, timestamp, changed_by, result, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            `pwd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            sanitizedData.emp_code || sanitizedData.empCode || 'UNKNOWN',
            sanitizedData.emp_name || sanitizedData.empName || 'Cán Bộ Nhân Viên',
            timestamp,
            sanitizedData.changed_by || 'SELF',
            sanitizedData.result || 'SUCCESS',
            sanitizedData.reason || 'Đổi mật khẩu người dùng'
          ).run().catch(() => {});
        }

        // 3. Log to document_download_logs table if DOCUMENT_DOWNLOAD
        else if (eventType === 'DOCUMENT_DOWNLOAD') {
          await db.prepare(`
            CREATE TABLE IF NOT EXISTS document_download_logs (
              id TEXT PRIMARY KEY,
              emp_code TEXT,
              emp_name TEXT,
              document_name TEXT,
              file_path_or_id TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              ip_address TEXT
            )
          `).run().catch(() => {});

          await db.prepare(`
            INSERT INTO document_download_logs (id, emp_code, emp_name, document_name, file_path_or_id, timestamp, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            `dl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            sanitizedData.emp_code || sanitizedData.empCode || 'GUEST',
            sanitizedData.emp_name || sanitizedData.empName || 'N/A',
            sanitizedData.document_name || sanitizedData.documentName || 'Tài liệu không tên',
            sanitizedData.file_path_or_id || sanitizedData.filePathOrId || 'N/A',
            timestamp,
            clientIp
          ).run().catch(() => {});
        }

        // 4. Log to feature_access_logs table if FEATURE_ACCESS
        else if (eventType === 'FEATURE_ACCESS') {
          await db.prepare(`
            CREATE TABLE IF NOT EXISTS feature_access_logs (
              id TEXT PRIMARY KEY,
              emp_code TEXT,
              emp_name TEXT,
              module TEXT,
              feature_name TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
              result TEXT
            )
          `).run().catch(() => {});

          await db.prepare(`
            INSERT INTO feature_access_logs (id, emp_code, emp_name, module, feature_name, timestamp, result)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            sanitizedData.emp_code || sanitizedData.empCode || 'GUEST',
            sanitizedData.emp_name || sanitizedData.empName || 'N/A',
            sanitizedData.module || 'Hệ thống',
            sanitizedData.feature_name || sanitizedData.featureName || 'Menu Navigation',
            timestamp,
            sanitizedData.result || 'ALLOWED'
          ).run().catch(() => {});
        }

        // General audit log fallback
        await db.prepare(`
          INSERT INTO audit_logs (
            user_id, emp_code, role_code, module, action, record_id, 
            data_before, data_after, changes_json, ip_address, user_agent, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
          sanitizedData.emp_code || 'SYSTEM',
          sanitizedData.emp_code || null,
          sanitizedData.role_code || 'USER',
          sanitizedData.module || eventType,
          sanitizedData.action || eventType,
          sanitizedData.record_id || null,
          null,
          null,
          JSON.stringify(sanitizedData),
          clientIp,
          userAgent
        ).run().catch(() => {});
      } catch (dbErr) {
        console.warn('[AuditWebhook] D1 insert warning:', dbErr);
      }
    }

    // Forward to Google Apps Script doPost Webhook if GAS_WEBHOOK_URL is configured
    const gasWebhookUrl = (process.env as any).GAS_WEBHOOK_URL || (globalThis as any).GAS_WEBHOOK_URL || null;
    if (gasWebhookUrl) {
      try {
        const dateStr = timestamp.substring(0, 10);
        const webhookPayload = {
          root_folder: 'Backup-TBS-System',
          sub_folder: '01_Nhat_Ky_Thao_Tac_Audit_Logs',
          base_name: `tbs_audit_${dateStr}`,
          timestamp,
          tables: {
            login_logout_logs: eventType === 'LOGIN_LOGOUT' ? [{ ...sanitizedData, timestamp, ip_address: clientIp, device_info: userAgent }] : [],
            password_change_logs: eventType === 'PASSWORD_CHANGE' ? [{ ...sanitizedData, timestamp }] : [],
            document_download_logs: eventType === 'DOCUMENT_DOWNLOAD' ? [{ ...sanitizedData, timestamp, ip_address: clientIp }] : [],
            feature_access_logs: eventType === 'FEATURE_ACCESS' ? [{ ...sanitizedData, timestamp }] : [],
          }
        };

        fetch(gasWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        }).catch((e) => console.warn('[AuditWebhook] GAS webhook async dispatch notice:', e));
      } catch (gasErr) {
        console.warn('[AuditWebhook] GAS dispatch warning:', gasErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Audit log recorded successfully',
      eventType,
      timestamp
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
