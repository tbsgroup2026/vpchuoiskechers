const { SignJWT } = require('jose');
const crypto = require('crypto');

async function main() {
  const secret = new TextEncoder().encode('tbs_ii_secure_jwt_secret_key_2026');
  const alg = 'HS256';

  const token = await new SignJWT({
    userId: 'test_user',
    empCode: 'TEST001',
    name: 'Test User',
    departmentCode: 'IT',
    roleCode: 'ADMIN'
  })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
    
  console.log(token);
}

main();
