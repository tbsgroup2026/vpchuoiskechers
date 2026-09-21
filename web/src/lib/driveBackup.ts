/**
 * TBS GROUP — REAL-TIME GOOGLE DRIVE BACKUP MODULE
 * Supports real-time webhook sync to Google Drive subfolders:
 * 00_Tong_Hop_Full_Database
 * 01_Nhat_Ky_Thao_Tac_Audit_Logs
 * 02_Tai_Khoan_Nguoi_Dung_Users
 * 03_Sang_Kien_Cai_Tien_Kaizen
 * 04_Quan_Ly_Gemba_Andon
 * 05_Dat_Phong_Hop_Rooms
 */

export type BackupCategory =
  | 'FULL_DATABASE'
  | 'AUDIT_LOGS'
  | 'USERS'
  | 'KAIZEN'
  | 'GEMBA'
  | 'ROOMS'
  | 'TASKS';

const FOLDER_MAP: Record<BackupCategory, string> = {
  FULL_DATABASE: '00_Tong_Hop_Full_Database',
  AUDIT_LOGS: '01_Nhat_Ky_Thao_Tac_Audit_Logs',
  USERS: '02_Tai_Khoan_Nguoi_Dung_Users',
  KAIZEN: '03_Sang_Kien_Cai_Tien_Kaizen',
  GEMBA: '04_Quan_Ly_Gemba_Andon',
  ROOMS: '05_Dat_Phong_Hop_Rooms',
  TASKS: '06_Quan_Ly_Cong_Viec_Tasks',
};

const DEFAULT_WEBHOOK_URL =
  process.env.BACKUP_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbyIpvFGkvd022GKMKRBzFUR11mvH7RIuKyh-hX7-ans-R296oIn9CNMyLCq4CmqNOm9zg/exec';

const WEBHOOK_SECRET =
  process.env.BACKUP_WEBHOOK_SECRET || 'tbs_backup_secret_2026';

/**
 * 🔒 SECURITY SANITIZATION GUARD:
 * Recursively strips passwords, hashes, tokens, and secrets from ANY payload before backup.
 */
export function sanitizeBackupPayload(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeBackupPayload(item));
  }

  const sanitized: Record<string, any> = {};
  const forbiddenKeys = new Set([
    'password',
    'password_hash',
    'passwordhash',
    'pass',
    'pwd',
    'secret',
    'jwt_secret',
    'pin_hash',
    'token',
    'auth_token',
  ]);

  for (const [key, value] of Object.entries(data)) {
    if (forbiddenKeys.has(key.toLowerCase())) {
      // Omit sensitive property entirely
      continue;
    }
    sanitized[key] = sanitizeBackupPayload(value);
  }

  return sanitized;
}

/**
 * Non-blocking real-time sync to Google Drive Webhook
 */
export async function syncBackupToDrive(
  category: BackupCategory,
  payload: any,
  actionName = 'REALTIME_SYNC'
): Promise<{ success: boolean; message?: string }> {
  try {
    const targetFolder = FOLDER_MAP[category] || FOLDER_MAP.FULL_DATABASE;
    const sanitizedData = sanitizeBackupPayload(payload);

    const bodyData = {
      secret_token: WEBHOOK_SECRET,
      category,
      folder_name: targetFolder,
      action: actionName,
      timestamp: new Date().toISOString(),
      data: sanitizedData,
    };

    // Asynchronous non-blocking fetch
    fetch(DEFAULT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Backup-Secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify(bodyData),
    }).catch((err) => {
      console.warn(`[DriveBackup] Background Webhook sync notice (${category}):`, err);
    });

    return { success: true, message: `Backup queued to ${targetFolder}` };
  } catch (error: any) {
    console.warn('[DriveBackup] Exception during sync request:', error);
    return { success: false, message: error.message };
  }
}
