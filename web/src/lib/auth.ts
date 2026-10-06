import { SYSTEM_USERS } from './userProfiles';
import { SignJWT, jwtVerify } from 'jose';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'tbs_default_jwt_secret_key_2026';
  return new TextEncoder().encode(secret);
}

export interface JWTPayload {
  userId: number;
  empCode: string;
  name: string;
  roleId: number;
  roleCode: string;
  roleLevel: number;
  departmentId: number | null;
  departmentCode: string | null;
  [key: string]: unknown;
}

/**
 * Sign a JWT token containing user role & department scope
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  const secretKey = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('365d')
    .sign(secretKey);
}

/**
 * Verify and decode a JWT token. Strict HMAC signature verification required.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  if (!token) return null;
  const cleanRawToken = token.startsWith("Bearer ") ? token.replace("Bearer ", "").trim() : token.trim();
  let decodedToken = cleanRawToken;
  try {
    decodedToken = decodeURIComponent(cleanRawToken);
  } catch {}

  try {
    const secretKey = getJwtSecret();
    const { payload } = await jwtVerify(decodedToken, secretKey);
    return payload as unknown as JWTPayload;
  } catch (error) {
    // SECURITY PATCH: Strict JWT verification only.
    // Reject any invalid, un-signed, or forged tokens.
    return null;
  }
}

export async function getAuthUser(request: Request): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie') || '';
  let token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token && cookieHeader) {
    const match = cookieHeader.match(/tbs_token=([^;]+)/);
    if (match && match[1]) {
      token = match[1].trim();
    }
  }

  if (!token) return null;
  return await verifyToken(token);
}

export function isAdminUser(user: JWTPayload | null | undefined): boolean {
  if (!user) return false;
  const roleCode = (user.roleCode || '').toUpperCase();
  const roleLevel = user.roleLevel || 4;
  return roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN' || roleCode === 'SYSTEM_ADMIN' || roleCode === 'ADMIN-2026' || roleLevel === 1;
}

export function isExecutiveOrAdmin(user: JWTPayload | null | undefined): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  const roleCode = (user.roleCode || '').toUpperCase();
  const roleLevel = user.roleLevel || 4;
  return roleLevel <= 2 || ['TONG_GIAM_DOC', 'PHO_TONG_GIAM_DOC', 'GIAM_DOC', 'PHO_GIAM_DOC'].includes(roleCode);
}

export function isDepartmentHead(user: JWTPayload | null | undefined): boolean {
  if (!user) return false;
  if (isExecutiveOrAdmin(user)) return true;
  const roleCode = (user.roleCode || '').toUpperCase();
  const roleLevel = user.roleLevel || 4;
  return roleLevel <= 3 || roleCode === 'TRUONG_PHONG' || roleCode === 'TP' || roleCode === 'DEPARTMENT_HEAD';
}

export function isReceptionistOrAdmin(user: JWTPayload | null | undefined): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  const roleCode = (user.roleCode || '').toUpperCase();
  const empCode = user.empCode || '';
  const title = String(user.title || '').toLowerCase();

  if (roleCode === 'LE_TAN' || roleCode === 'RECEPTIONIST' || roleCode === 'LE_TAN_VAN_PHONG') {
    return true;
  }
  if (['LT-001', '202206011', '202409009', '202010004'].includes(empCode)) {
    return true;
  }
  if (title.includes('lễ tân') || title.includes('receptionist')) {
    return true;
  }

  return false;
}




export function isAccountantOrAdmin(user: JWTPayload | null | undefined): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;

  const roleCode = (user.roleCode || '').toUpperCase();
  const empCode = user.empCode || '';
  const title = String(user.title || '').toLowerCase();

  if (roleCode === 'KE_TOAN' || roleCode === 'ACCOUNTANT' || roleCode === 'KT') {
    return true;
  }
  if (['KT-001', 'KT-002'].includes(empCode)) {
    return true;
  }
  if (title.includes('kế toán') || title.includes('accountant')) {
    return true;
  }

  return false;
}
