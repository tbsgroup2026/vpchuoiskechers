const { SignJWT } = require('jose');

async function createToken(empCode, deptCode, roleLevel, roleCode = 'CBCNV') {
  const secret = new TextEncoder().encode('tbs_default_jwt_secret_key_2026');
  return new SignJWT({
    userId: Math.floor(Math.random() * 1000),
    empCode,
    name: `User ${empCode}`,
    roleId: roleLevel,
    roleCode,
    roleLevel,
    departmentId: Math.floor(Math.random() * 100),
    departmentCode: deptCode
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

async function run() {
  const tokenA = await createToken('202608001', 'IT_DIGITAL', 4);
  const tokenB = await createToken('202608003', 'HÀNH_CHÍNH', 4);
  
  console.log("Token A:", tokenA);
  console.log("Token B:", tokenB);
}

run().catch(console.error);
