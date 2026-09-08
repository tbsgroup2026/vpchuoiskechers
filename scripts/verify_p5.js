const BASE_URL = "https://vpchuoiskechers.tbsgroup2026.workers.dev";

async function verifyJwtLogout() {
  console.log("=== TEST PRIORITY 5.2: JWT LOGOUT / TOKEN REVOCATION ===");

  // 1. Login to obtain token
  console.log("\nStep 1: Logging in...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empCode: "202608001" })
  });
  const loginStatus = loginRes.status;
  const loginData = await loginRes.json();
  console.log("Login HTTP Status:", loginStatus);
  console.log("Login Response:", JSON.stringify(loginData, null, 2));

  const token = loginData.token;
  if (!token) {
    console.error("-> FAILED to obtain token!");
    process.exit(1);
  }

  // 2. Call protected API with token
  console.log("\nStep 2: Accessing protected API (/api/users) with active token...");
  const protectedRes = await fetch(`${BASE_URL}/api/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const protectedStatus = protectedRes.status;
  const protectedData = await protectedRes.json();
  console.log("Protected API Status:", protectedStatus);
  console.log("Protected API Response sample:", JSON.stringify(protectedData).substring(0, 150) + "...");

  if (protectedStatus !== 200) {
    console.error("-> FAILED to access protected API with active token!");
    process.exit(1);
  }

  // 3. Logout to revoke token
  console.log("\nStep 3: Calling Logout (/api/auth/logout) to revoke token...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` }
  });
  const logoutStatus = logoutRes.status;
  const logoutData = await logoutRes.json();
  console.log("Logout Status:", logoutStatus);
  console.log("Logout Response:", JSON.stringify(logoutData, null, 2));

  // 4. Re-call protected API with the EXACT SAME revoked token
  console.log("\nStep 4: Re-calling protected API (/api/users) with REVOKED token...");
  const revokedRes = await fetch(`${BASE_URL}/api/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const revokedStatus = revokedRes.status;
  const revokedData = await revokedRes.json();
  console.log("Re-access Status:", revokedStatus);
  console.log("Re-access Response:", JSON.stringify(revokedData, null, 2));

  if (revokedStatus === 401 || revokedStatus === 403) {
    console.log("\n-> PRIORITY 5.2 PASSED! Revoked token was strictly rejected with HTTP", revokedStatus);
  } else {
    console.error("\n-> PRIORITY 5.2 FAILED! Token was NOT rejected post-logout.");
    process.exit(1);
  }
}

verifyJwtLogout().catch(err => {
  console.error("Error executing verify_p5:", err);
  process.exit(1);
});
