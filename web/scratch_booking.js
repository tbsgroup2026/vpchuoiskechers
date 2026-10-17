const { SignJWT } = require('jose');

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
    
  console.log("Token generated");
  
  const res = await fetch("https://vpchuoiskechers-staging.tbsgroup2026.workers.dev/api/rooms/booking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `tbs_auth_token=${token}`
    },
    body: JSON.stringify({
      roomId: "room_1",
      date: "2027-10-09",
      bookingDate: "2027-10-09",
      timeSlot: "09:00 - 10:00",
      title: "Test booking timezone"
    })
  });
  
  const data = await res.json();
  console.log("Response:", data);
}

main().catch(console.error);
