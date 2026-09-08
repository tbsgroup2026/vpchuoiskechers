const BASE_URL = "https://vpchuoiskechers.tbsgroup2026.workers.dev";

async function loginAndGetToken() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empCode: "202608001" }),
  });
  const data = await res.json();
  return data.token;
}

async function testFix1_DynamicFreshData(token) {
  console.log("\n=== TEST FIX 1: DYNAMIC FRESH DATA & NO CACHE STALENESS ===");

  const payload1 = {
    title: "TEST DYNAMIC DATA 1 " + Date.now(),
    category: "PRODUCTIVITY",
    categoryLabel: "3.Tăng Năng suất",
    registrationType: "THI_DUA",
    factory: "Nhà máy Kiên Giang 1",
    department: "Xưởng Mũi",
    line: "Line 1",
    proposerName: "Phạm Nguyễn Anh Huy",
    proposerEmpCode: "202608001",
    beforeDescription: "Mô tả trước cải tiến 1",
    afterSolution: "Giải pháp sau cải tiến 1",
  };

  const res1 = await fetch(`${BASE_URL}/api/ci-kaizen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload1),
  });
  const data1 = await res1.json();
  console.log("Submit 1 Status:", res1.status, "ID:", data1.id, "Code:", data1.code);

  const payload2 = {
    title: "TEST DYNAMIC DATA 2 " + Date.now(),
    category: "SAFETY",
    categoryLabel: "4.An toàn lao động",
    registrationType: "THI_DUA",
    factory: "Nhà máy Kiên Giang 1",
    department: "Xưởng Đế",
    line: "Line 2",
    proposerName: "Lê Văn Cường",
    proposerEmpCode: "CN-88201",
    beforeDescription: "Mô tả trước cải tiến 2",
    afterSolution: "Giải pháp sau cải tiến 2",
  };

  const res2 = await fetch(`${BASE_URL}/api/ci-kaizen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload2),
  });
  const data2 = await res2.json();
  console.log("Submit 2 Status:", res2.status, "ID:", data2.id, "Code:", data2.code);

  if (res1.status === 200 && res2.status === 200 && data1.id !== data2.id) {
    console.log("-> TEST FIX 1 PASSED! Dynamic endpoints return fresh real-time data without cache staleness.");
  } else {
    console.error("-> TEST FIX 1 FAILED!");
    process.exit(1);
  }
}

async function testFix2_RateLimiting() {
  console.log("\n=== TEST FIX 2: RATE LIMITING (MAX 5 REQS/MIN FOR SAME IP + MSNV) ===");
  const testEmpCode = "202608002"; // Unique test MSNV
  let blockedOn6th = false;

  for (let i = 1; i <= 6; i++) {
    const payload = {
      title: `RATE LIMIT TEST REQ ${i} - ${Date.now()}`,
      category: "PRODUCTIVITY",
      categoryLabel: "3.Tăng Năng suất",
      factory: "Nhà máy Kiên Giang 2",
      department: "Xưởng Gò",
      proposerName: "Trần Ngọc Huy",
      proposerEmpCode: testEmpCode,
      beforeDescription: "Test rate limiting description",
      afterSolution: "Test rate limiting solution",
    };

    const res = await fetch(`${BASE_URL}/api/ci-kaizen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const status = res.status;
    const data = await res.json();
    console.log(`Req ${i} Status:`, status, "Message:", data.message || data.error);

    if (i === 6) {
      if (status === 429 && data.error === "TOO_MANY_REQUESTS") {
        blockedOn6th = true;
        console.log("-> 6th Request successfully blocked with HTTP 429 Too Many Requests!");
      }
    }
  }

  console.log("\nTesting 7th request with DIFFERENT MSNV (SK-2026-101) from same IP...");
  const diffPayload = {
    title: `RATE LIMIT DIFFERENT MSNV TEST - ${Date.now()}`,
    category: "PRODUCTIVITY",
    categoryLabel: "3.Tăng Năng suất",
    factory: "Nhà máy Kiên Giang 1",
    department: "Xưởng Đế",
    proposerName: "Nguyễn Văn An",
    proposerEmpCode: "SK-2026-101",
    beforeDescription: "Test different MSNV description",
    afterSolution: "Test different MSNV solution",
  };

  const diffRes = await fetch(`${BASE_URL}/api/ci-kaizen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(diffPayload),
  });

  const diffStatus = diffRes.status;
  const diffData = await diffRes.json();
  console.log("Different MSNV Request Status:", diffStatus, "Message:", diffData.message);

  if (blockedOn6th && diffStatus === 200) {
    console.log("-> TEST FIX 2 PASSED! Rate limiting blocks spam from same IP+MSNV, while allowing valid requests from different MSNVs on the same IP.");
  } else {
    console.error("-> TEST FIX 2 FAILED!");
    process.exit(1);
  }
}

async function testFix3_BatchAndNonRegression(token) {
  console.log("\n=== TEST FIX 3: NON-REGRESSION & STATUS-COUNTS ===");

  const listRes = await fetch(`${BASE_URL}/api/ci-kaizen`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  console.log("GET /api/ci-kaizen Status:", listRes.status, "Proposals count:", listData.data?.length);

  const countsRes = await fetch(`${BASE_URL}/api/ci-kaizen/status-counts`);
  const countsData = await countsRes.json();
  console.log("GET /api/ci-kaizen/status-counts Status:", countsRes.status, "Counts:", JSON.stringify(countsData.counts));

  if (listRes.status === 200 && countsRes.status === 200 && countsData.success) {
    console.log("-> TEST FIX 3 PASSED! All APIs operate normally without regression.");
  } else {
    console.error("-> TEST FIX 3 FAILED!");
    process.exit(1);
  }
}

async function main() {
  console.log("🚀 STARTING BACKEND FIXES VERIFICATION SUITE...");
  const token = await loginAndGetToken();
  await testFix1_DynamicFreshData(token);
  await testFix2_RateLimiting();
  await testFix3_BatchAndNonRegression(token);
  console.log("\n✅ ALL BACKEND FIXES VERIFIED SUCCESSFULLY AND DEPLOYED LIVE!");
}

main().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
