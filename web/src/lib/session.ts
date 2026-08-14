import { cookies } from "next/headers";
import { verifyToken, JWTPayload } from "./auth";
import { ROLE_LEVELS } from "./rbac";

/** Đọc & verify JWT từ cookie tbs_token trong 1 Route Handler / Server Component */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("tbs_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function isAdminUser(user: JWTPayload | null): boolean {
  return !!user && user.roleLevel === ROLE_LEVELS.SUPER_ADMIN;
}
