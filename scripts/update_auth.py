import re

auth_file = r"d:\Work\TBS II\web\src\lib\auth.ts"
with open(auth_file, "r", encoding="utf-8") as f:
    content = f.read()

# Add isAccountantOrAdmin
accountant_func = """
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
"""

if "isAccountantOrAdmin" not in content:
    content += accountant_func

with open(auth_file, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated lib/auth.ts")
