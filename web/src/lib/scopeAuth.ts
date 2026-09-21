import { NextResponse } from 'next/server';
import { EquipmentScope, EQUIPMENT_SCOPES, isScopeAllowed, SCOPE_KEYS } from './equipmentScope';
import { SYSTEM_USERS, UserProfile } from './userProfiles';

export interface AuditLogEntry {
  timestamp: string;
  empCode: string;
  userName: string;
  action: string;
  requestedScope: string;
  endpoint: string;
  status: 'DENIED_403' | 'ALLOWED';
  reason?: string;
}

// In-memory security audit log store (cho D1 / Worker logging)
const SECURITY_AUDIT_LOGS: AuditLogEntry[] = [];

export function getSecurityAuditLogs(): AuditLogEntry[] {
  return [...SECURITY_AUDIT_LOGS];
}

export function logSecurityAudit(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  SECURITY_AUDIT_LOGS.push(fullEntry);
  console.warn(`[SECURITY AUDIT LOG 403] ${fullEntry.timestamp} - User: ${fullEntry.empCode} (${fullEntry.userName}) - Requested Scope: ${fullEntry.requestedScope} on ${fullEntry.endpoint} - REASON: ${fullEntry.reason}`);
}

/**
 * Validates scope authorization for backend API handlers.
 * Enforces HTTP 403 Forbidden with audit logging for unauthorized scope requests.
 */
export function validateScopeAuthorization(
  request: Request,
  userOverride?: UserProfile | null
): {
  authorized: boolean;
  scope: EquipmentScope;
  response?: NextResponse;
  user?: UserProfile;
} {
  let searchParamsScope: string | null = null;
  let pathname = '/api/maintenance';

  try {
    const rawUrl = request?.url || 'http://localhost/api/maintenance';
    const url = new URL(rawUrl);
    searchParamsScope = url.searchParams.get('scope');
    pathname = url.pathname;
  } catch (err) {
    // Safe fallback cho build pre-rendering
  }

  // 1. Nếu không truyền scope, mặc định là ALL (nếu được phép) hoặc OFFICE
  let requestedScope: EquipmentScope = 'ALL';
  if (searchParamsScope) {
    const uppercaseParam = searchParamsScope.trim().toUpperCase() as EquipmentScope;
    if (SCOPE_KEYS.includes(uppercaseParam)) {
      requestedScope = uppercaseParam;
    }
  }

  // 2. Xác định User Session từ Cookie / Header / userOverride
  let user: UserProfile | undefined = userOverride || undefined;

  if (!user && request) {
    try {
      const cookieHeader = request.headers?.get('cookie') || '';
      const match = cookieHeader.match(/tbs_token=tbs_token_([^_]+)_/);
      if (match && match[1]) {
        const empCode = match[1];
        user = SYSTEM_USERS[empCode];
      }
    } catch (err) {
      // Safe fallback cho build static export prerendering
    }
  }

  // Nếu chưa có user từ userOverride hoặc Cookie, kiểm tra header x-test-user-code
  if (!user && request) {
    try {
      const testUserHeader = request.headers?.get('x-test-user-code');
      if (testUserHeader && SYSTEM_USERS[testUserHeader]) {
        user = SYSTEM_USERS[testUserHeader];
      }
    } catch (err) {
      // Safe fallback cho build static export prerendering
    }
  }

  if (!user) {
    return {
      authorized: false,
      scope: requestedScope,
      response: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  const allowedScopes: EquipmentScope[] = user?.allowedScopes || ['ALL', 'OFFICE', 'EAST', 'KIEN_GIANG'];
  const isExecutiveOrAdmin =
    user?.roleCode === 'SUPER_ADMIN' ||
    user?.roleCode === 'ADMIN' ||
    user?.roleCode === 'TONG_GIAM_DOC' ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('ceo') ||
    (user?.managementLevel && user.managementLevel <= 2);

  // 3. Kiểm tra Authorization cho scope ALL
  if (requestedScope === 'ALL') {
    const hasAllPermission = isExecutiveOrAdmin || allowedScopes.includes('ALL');
    if (!hasAllPermission) {
      logSecurityAudit({
        empCode: user?.empCode || 'UNKNOWN',
        userName: user?.name || 'Unknown User',
        action: 'ACCESS_SCOPE_ALL',
        requestedScope: 'ALL',
        endpoint: pathname,
        status: 'DENIED_403',
        reason: 'User does not have explicit ALL scope permission (MAINT_VIEW_ALL_SCOPES)',
      });

      return {
        authorized: false,
        scope: requestedScope,
        response: NextResponse.json(
          {
            success: false,
            error: 'Forbidden: Bạn không có quyền truy cập phạm vi Tổng Quan (ALL).',
            code: 'FORBIDDEN_SCOPE_ALL',
          },
          { status: 403 }
        ),
      };
    }
  } else {
    // 4. Kiểm tra Authorization cho 3 đơn vị (OFFICE, EAST, KIEN_GIANG)
    const isAllowed = isExecutiveOrAdmin || isScopeAllowed(requestedScope, allowedScopes);
    if (!isAllowed) {
      logSecurityAudit({
        empCode: user?.empCode || 'UNKNOWN',
        userName: user?.name || 'Unknown User',
        action: `ACCESS_SCOPE_${requestedScope}`,
        requestedScope,
        endpoint: pathname,
        status: 'DENIED_403',
        reason: `User is not authorized for scope ${requestedScope}. Allowed scopes: ${allowedScopes.join(', ')}`,
      });

      return {
        authorized: false,
        scope: requestedScope,
        response: NextResponse.json(
          {
            success: false,
            error: `Forbidden: Bạn không có quyền truy cập dữ liệu của đơn vị ${EQUIPMENT_SCOPES[requestedScope]?.label || requestedScope}.`,
            code: 'FORBIDDEN_SCOPE',
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    authorized: true,
    scope: requestedScope,
    user,
  };
}
