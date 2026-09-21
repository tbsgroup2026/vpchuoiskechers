/**
 * Automated Google Drive Backup Engine for Cloudflare Workers & Next.js
 * Leverages native Web Crypto API for Google Service Account authentication
 * (Zero Node.js legacy dependencies).
 */

import { sanitizeDeep } from './auditLogger';
import { buildEmpCodeNameMap, resolveEmployeeName } from './userProfiles';

export interface BackupResult {
  success: boolean;
  backupId: string;
  backupType: 'MANUAL' | 'SCHEDULED';
  fileName: string;
  fileSizeBytes: number;
  gdriveFileId?: string;
  gdriveFolderId?: string;
  errorMessage?: string;
  timestamp: string;
}

export interface GDriveConfig {
  clientEmail?: string;
  privateKey?: string;
  folderId?: string;
}

/**
 * Encodes ArrayBuffer to Base64URL
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Converts String to Base64URL
 */
function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  return arrayBufferToBase64Url(encoder.encode(str).buffer);
}

/**
 * Converts PEM formatted PKCS#8 private key string to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  let cleanPem = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  while (cleanPem.length % 4 !== 0) {
    cleanPem += '=';
  }

  const raw = atob(cleanPem);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buffer[i] = raw.charCodeAt(i);
  }
  return buffer.buffer;
}

/**
 * Obtains an OAuth2 Access Token using a Google Service Account Private Key via Web Crypto API
 */
export async function getGoogleAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = stringToBase64Url(JSON.stringify(header));
  const encodedClaimSet = stringToBase64Url(JSON.stringify(claimSet));
  const unsignedJwt = `${encodedHeader}.${encodedClaimSet}`;

  const keyBuffer = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedJwt)
  );

  const signature = arrayBufferToBase64Url(signatureBuffer);
  const jwt = `${unsignedJwt}.${signature}`;

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenResp.ok) {
    const errorText = await tokenResp.text();
    throw new Error(`Failed to obtain Google access token: ${tokenResp.status} ${errorText}`);
  }

  const tokenData = await tokenResp.json() as { access_token: string };
  return tokenData.access_token;
}

/**
 * Resolves or creates folder path /Backup-TBS-System/{subFolder}/ in Google Drive
 */
export async function resolveGDriveFolder(
  accessToken: string,
  rootFolderName = 'Backup-TBS-System',
  subFolderName?: string
): Promise<string> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  // 1. Find or create root folder
  const rootQuery = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${rootFolderName}' and trashed=false`);
  const rootSearchResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${rootQuery}&fields=files(id,name)`, { headers });
  
  let rootFolderId = '';
  if (rootSearchResp.ok) {
    const rootData = await rootSearchResp.json() as { files: Array<{ id: string }> };
    if (rootData.files && rootData.files.length > 0) {
      rootFolderId = rootData.files[0].id;
    }
  }

  if (!rootFolderId) {
    const createRootResp = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: rootFolderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    if (!createRootResp.ok) {
      throw new Error(`Failed to create root folder '${rootFolderName}': ${createRootResp.statusText}`);
    }
    const rootCreated = await createRootResp.json() as { id: string };
    rootFolderId = rootCreated.id;
  }

  if (!subFolderName) {
    return rootFolderId;
  }

  // 2. Find or create subFolder inside root folder
  const subQuery = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${subFolderName}' and '${rootFolderId}' in parents and trashed=false`);
  const subSearchResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${subQuery}&fields=files(id,name)`, { headers });

  if (subSearchResp.ok) {
    const subData = await subSearchResp.json() as { files: Array<{ id: string }> };
    if (subData.files && subData.files.length > 0) {
      return subData.files[0].id;
    }
  }

  const createSubResp = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: subFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId]
    })
  });
  if (!createSubResp.ok) {
    throw new Error(`Failed to create subfolder '${subFolderName}': ${createSubResp.statusText}`);
  }
  const subCreated = await createSubResp.json() as { id: string };
  return subCreated.id;
}

/**
 * Uploads a JSON or text file to Google Drive using multipart upload
 */
export async function uploadFileToGDrive(
  accessToken: string,
  fileName: string,
  content: string,
  parentFolderId: string,
  mimeType = 'application/json'
): Promise<string> {
  const boundary = 'foo_bar_baz_boundary_' + Math.random().toString(36).substring(2);
  const metadata = {
    name: fileName,
    mimeType,
    parents: [parentFolderId]
  };

  const multipartRequestBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Upload to Google Drive failed: ${resp.status} ${errText}`);
  }

  const uploaded = await resp.json() as { id: string };
  return uploaded.id;
}

/**
 * Export D1 database contents into sanitized JSON structure
 */
export async function exportDatabaseData(db: any): Promise<Record<string, any>> {
  if (!db) return {};

  const tablesQuery = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
  const tables = (tablesQuery.results || []).map((r: any) => r.name);

  const backupData: Record<string, any> = {
    metadata: {
      exported_at: new Date().toISOString(),
      platform: 'TBS II Cloudflare D1',
      total_tables: tables.length
    },
    tables: {}
  };

  for (const tableName of tables) {
    try {
      const { results } = await db.prepare(`SELECT * FROM ${tableName} LIMIT 50000`).all();
      let rawRows = results || [];

      // Nếu xuất bảng audit log (sys_audit_logs / audit_logs), map Tên CBNV chuẩn bằng batch lookup
      if (tableName === 'sys_audit_logs' || tableName === 'audit_logs') {
        const empCodes = rawRows.map((r: any) => r.emp_code || r.user_id);
        const nameMap = buildEmpCodeNameMap(empCodes);

        rawRows = rawRows.map((r: any) => {
          const code = r.emp_code || r.user_id || 'SYSTEM';
          const resolvedName = nameMap[code] || resolveEmployeeName(code, r.emp_name);
          return {
            ...r,
            emp_name: resolvedName,
          };
        });
      }

      // Sanitize every row deep before outputting to backup file
      backupData.tables[tableName] = rawRows.map((row: any) => sanitizeDeep(row));
    } catch (e) {
      console.warn(`[Backup] Could not export table ${tableName}:`, e);
      backupData.tables[tableName] = { error: String(e) };
    }
  }

  return backupData;
}

/**
 * Delete backups older than retentionDays (default 90 days) from Google Drive & D1
 */
export async function pruneOldBackups(accessToken: string, parentFolderId: string, db: any, retentionDays = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffIso = cutoffDate.toISOString();

  let deletedCount = 0;

  // 1. Delete from Google Drive if access token available
  if (accessToken && parentFolderId) {
    try {
      const query = encodeURIComponent(`'${parentFolderId}' in parents and createdTime < '${cutoffIso}' and trashed=false`);
      const listResp = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (listResp.ok) {
        const data = await listResp.json() as { files: Array<{ id: string; name: string }> };
        for (const file of (data.files || [])) {
          const delResp = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (delResp.ok) {
            deletedCount++;
            console.log(`[Backup Prune] Deleted old Drive file: ${file.name} (${file.id})`);
          }
        }
      }
    } catch (err) {
      console.error('[Backup Prune] Error pruning Google Drive files:', err);
    }
  }

  // 2. Delete old system_backups records from D1
  if (db) {
    try {
      await db.prepare('DELETE FROM system_backups WHERE created_at < ?').bind(cutoffIso).run();
    } catch (err) {
      console.error('[Backup Prune] Error pruning D1 system_backups table:', err);
    }
  }

  return deletedCount;
}

/**
 * Main Backup Handler Function
 * Performs D1 dump, serializes, uploads to Google Drive, logs to D1, and prunes old backups.
 */
export async function performSystemBackup(
  env: any,
  backupType: 'MANUAL' | 'SCHEDULED' = 'SCHEDULED'
): Promise<BackupResult> {
  const backupId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.substring(0, 10);
  const timeStr = timestamp.substring(11, 19).replace(/:/g, '-');
  const fileName = `tbs_backup_${backupType.toLowerCase()}_${dateStr}_${timeStr}.json`;

  const result: BackupResult = {
    success: false,
    backupId,
    backupType,
    fileName,
    fileSizeBytes: 0,
    timestamp
  };

  try {
    const db = env.DB;
    if (!db) {
      throw new Error('D1 Database binding (env.DB) is not available');
    }

    // 1. Gather database data & sanitize
    const databaseBackupData = await exportDatabaseData(db);
    const jsonContent = JSON.stringify(databaseBackupData, null, 2);
    result.fileSizeBytes = new TextEncoder().encode(jsonContent).length;

    // 2. Check Google Drive credentials
    const clientEmail = env.GDRIVE_CLIENT_EMAIL || env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = env.GDRIVE_PRIVATE_KEY || env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    const rootFolderId = env.GDRIVE_FOLDER_ID;

    if (!clientEmail || !privateKey) {
      console.warn('[Backup] Google Drive credentials not configured in env (GDRIVE_CLIENT_EMAIL / GDRIVE_PRIVATE_KEY missing). Storing local log only.');
      result.success = true;
      result.errorMessage = 'Skipped Google Drive upload: credentials not configured in environment variables.';

      // Save record in system_backups table
      await db.prepare(
        `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, status, error_message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).bind(backupId, backupType, fileName, result.fileSizeBytes, 'SKIPPED_NO_CREDS', result.errorMessage).run();

      return result;
    }

    // 3. Authenticate & Resolve Folder
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
    const databaseFolderId = await resolveGDriveFolder(accessToken, 'Backup-TBS-System', 'database');

    // 4. Upload database backup file to Google Drive
    const gdriveFileId = await uploadFileToGDrive(accessToken, fileName, jsonContent, databaseFolderId);
    result.gdriveFileId = gdriveFileId;
    result.gdriveFolderId = databaseFolderId;
    result.success = true;

    // 4b. Export standalone module_152_access_log.json file
    try {
      const { results: logRows } = await db.prepare("SELECT * FROM module_152_access_log ORDER BY accessed_at DESC LIMIT 50000").all();
      if (logRows && logRows.length > 0) {
        const logContent = JSON.stringify(logRows.map((r: any) => sanitizeDeep(r)), null, 2);
        const logFileName = `module_152_access_log_${dateStr}_${timeStr}.json`;
        await uploadFileToGDrive(accessToken, logFileName, logContent, databaseFolderId);
      }
    } catch (e) {
      console.warn('[Backup] Optional standalone module_152_access_log export skipped:', e);
    }

    // 5. Log success into D1
    await db.prepare(
      `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, gdrive_file_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).bind(backupId, backupType, fileName, result.fileSizeBytes, gdriveFileId, 'SUCCESS').run();

    // 6. Prune backups older than 90 days
    await pruneOldBackups(accessToken, databaseFolderId, db, 90);

    return result;

  } catch (err: any) {
    const errorMsg = err.message || String(err);
    console.error('[Backup] Backup operation failed:', err);

    result.success = false;
    result.errorMessage = errorMsg;

    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO system_backups (id, backup_type, file_name, file_size_bytes, status, error_message, created_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        ).bind(backupId, backupType, fileName, result.fileSizeBytes, 'FAILED', errorMsg).run();
      } catch (e) {
        console.error('[Backup] Failed to log failure to D1:', e);
      }
    }

    return result;
  }
}

/**
 * Perform Incremental Backup Engine (Runs every 2 minutes via cron)
 * Fetches new logs created since last_synced_at and uploads to Google Drive.
 */
export async function performIncrementalBackup(env: any): Promise<{ success: boolean; synced_count: number }> {
  try {
    const db = env.DB;
    if (!db) return { success: false, synced_count: 0 };

    const clientEmail = env.GDRIVE_CLIENT_EMAIL || env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = env.GDRIVE_PRIVATE_KEY || env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      return { success: false, synced_count: 0 };
    }

    const logTables = [
      { name: 'audit_logs', timeCol: 'created_at' },
      { name: 'auth_login_history', timeCol: 'timestamp' },
      { name: 'account_change_history', timeCol: 'timestamp' },
      { name: 'credential_change_history', timeCol: 'timestamp' },
      { name: 'module_152_access_log', timeCol: 'accessed_at' },
    ];

    let totalSyncedRows = 0;
    const dateStr = new Date().toISOString().substring(0, 10);
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);
    const backupFolderId = await resolveGDriveFolder(accessToken, 'Backup-TBS-System', dateStr);

    for (const tbl of logTables) {
      try {
        const stateRes: any = await db.prepare(
          'SELECT last_synced_at FROM incremental_backup_state WHERE table_name = ?'
        ).bind(tbl.name).first();

        const lastSyncedAt = stateRes?.last_synced_at || '1970-01-01T00:00:00.000Z';

        const sql = `SELECT * FROM ${tbl.name} WHERE ${tbl.timeCol} > ? ORDER BY ${tbl.timeCol} ASC LIMIT 5000`;
        const { results } = await db.prepare(sql).bind(lastSyncedAt).all();

        if (results && results.length > 0) {
          let rowsToProcess = results;
          if (tbl.name === 'sys_audit_logs' || tbl.name === 'audit_logs') {
            const empCodes = rowsToProcess.map((r: any) => r.emp_code || r.user_id);
            const nameMap = buildEmpCodeNameMap(empCodes);

            rowsToProcess = rowsToProcess.map((r: any) => {
              const code = r.emp_code || r.user_id || 'SYSTEM';
              const resolvedName = nameMap[code] || resolveEmployeeName(code, r.emp_name);
              return {
                ...r,
                emp_name: resolvedName,
              };
            });
          }

          const sanitizedRows = rowsToProcess.map((row: any) => sanitizeDeep(row));
          const fileName = `${tbl.name}_incremental_${Date.now()}.json`;
          const content = JSON.stringify({ table: tbl.name, count: results.length, rows: sanitizedRows }, null, 2);

          await uploadFileToGDrive(accessToken, fileName, content, backupFolderId);

          const newestTime = results[results.length - 1][tbl.timeCol] || new Date().toISOString();
          await db.prepare(
            `INSERT INTO incremental_backup_state (table_name, last_synced_at, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(table_name) DO UPDATE SET last_synced_at = excluded.last_synced_at, updated_at = CURRENT_TIMESTAMP`
          ).bind(tbl.name, newestTime).run();

          totalSyncedRows += results.length;
        }
      } catch (tableErr) {
        console.warn(`[Incremental Backup] Table ${tbl.name} warning:`, tableErr);
      }
    }

    return { success: true, synced_count: totalSyncedRows };
  } catch (err: any) {
    console.error('[Incremental Backup] Failed:', err);
    return { success: false, synced_count: 0 };
  }
}

/**
 * Định dạng mảng audit log thành cấu trúc Google Sheets / CSV tiêu chuẩn.
 * Các cột theo đúng thứ tự: Tên CBNV | Mã NV | Hành Động Thao Tác | Phân Hệ Hệ Thống | Thời Gian Tạo / Thao Tác
 * Bao gồm thông số định dạng ô: wrapText và minWidth cho các cột chữ dài.
 */
export function formatAuditLogsForGoogleSheets(rows: any[]) {
  const empCodes = rows.map((r) => r.emp_code || r.user_id);
  const nameMap = buildEmpCodeNameMap(empCodes);

  const formattedRows = rows.map((r) => {
    const code = r.emp_code || r.user_id || 'SYSTEM';
    const resolvedName = nameMap[code] || resolveEmployeeName(code, r.emp_name);
    return {
      'Tên CBNV': resolvedName,
      'Mã NV': code,
      'Hành Động Thao Tác': r.action || r.action_name || 'UNKNOWN_ACTION',
      'Phân Hệ Hệ Thống': r.module || 'SYSTEM',
      'Thời Gian Tạo / Thao Tác': r.created_at || r.timestamp || new Date().toISOString(),
    };
  });

  return {
    sheetName: 'Audit_Logs_Backup',
    formatting: {
      wrapText: true,
      columns: [
        { name: 'Tên CBNV', minWidth: 25, wrapText: true },
        { name: 'Mã NV', minWidth: 15, wrapText: false },
        { name: 'Hành Động Thao Tác', minWidth: 25, wrapText: true },
        { name: 'Phân Hệ Hệ Thống', minWidth: 20, wrapText: false },
        { name: 'Thời Gian Tạo / Thao Tác', minWidth: 22, wrapText: true },
      ],
    },
    rows: formattedRows,
  };
}

