/**
 * Client & Server Audit Logging Helper for TBS II Platform
 * Dispatcher for:
 * 1. login_logout_logs
 * 2. password_change_logs (ZERO PASSWORD STRING POLICY)
 * 3. document_download_logs
 * 4. feature_access_logs
 */

export interface LoginLogoutLogData {
  emp_code: string;
  emp_name: string;
  action: 'Đăng nhập' | 'Đăng xuất';
  result?: 'Thành công' | 'Thất bại';
  device_info?: string;
}

export interface PasswordChangeLogData {
  emp_code: string;
  emp_name: string;
  changed_by: string; // 'Tự đổi' | 'Admin reset (MSNV)'
  result?: 'Thành công' | 'Thất bại';
  reason?: string;
}

export interface DocumentDownloadLogData {
  emp_code: string;
  emp_name: string;
  document_name: string;
  file_path_or_id: string;
}

export interface FeatureAccessLogData {
  emp_code: string;
  emp_name: string;
  module: string;
  feature_name: string;
  result?: 'Được phép' | 'Từ chối';
}

/**
 * Dispatch audit event payload to /api/audit/webhook endpoint
 */
async function dispatchAuditEvent(eventType: string, data: Record<string, any>): Promise<void> {
  try {
    // Sanitize any accidental password keys before making network request
    const safeData = { ...data };
    delete safeData.password;
    delete safeData.oldPassword;
    delete safeData.newPassword;
    delete safeData.confirmPassword;
    delete safeData.pass;

    if (typeof window !== 'undefined') {
      fetch('/api/audit/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          data: safeData
        })
      }).catch((err) => console.warn('[AuditClient] Non-blocking dispatch notice:', err));
    }
  } catch (e) {
    console.warn('[AuditClient] Dispatch error:', e);
  }
}

/**
 * 1. Log Login / Logout Event
 */
export function logLoginLogoutEvent(params: LoginLogoutLogData): void {
  dispatchAuditEvent('LOGIN_LOGOUT', {
    emp_code: params.emp_code,
    emp_name: params.emp_name,
    action: params.action,
    result: params.result || 'Thành công',
    device_info: params.device_info || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown')
  });
}

/**
 * 2. Log Password Change Event (STRICT SECURITY: ZERO PASSWORD STRINGS)
 */
export function logPasswordChangeEvent(params: PasswordChangeLogData): void {
  dispatchAuditEvent('PASSWORD_CHANGE', {
    emp_code: params.emp_code,
    emp_name: params.emp_name,
    changed_by: params.changed_by || 'Tự đổi',
    result: params.result || 'Thành công',
    reason: params.reason || 'Đổi mật khẩu người dùng'
  });
}

/**
 * 3. Log Document / File Download Event
 */
export function logDocumentDownloadEvent(params: DocumentDownloadLogData): void {
  dispatchAuditEvent('DOCUMENT_DOWNLOAD', {
    emp_code: params.emp_code,
    emp_name: params.emp_name,
    document_name: params.document_name,
    file_path_or_id: params.file_path_or_id
  });
}

/**
 * 4. Log Feature / Module Access Event
 */
export function logFeatureAccessEvent(params: FeatureAccessLogData): void {
  dispatchAuditEvent('FEATURE_ACCESS', {
    emp_code: params.emp_code,
    emp_name: params.emp_name,
    module: params.module,
    feature_name: params.feature_name,
    result: params.result || 'Được phép'
  });
}
