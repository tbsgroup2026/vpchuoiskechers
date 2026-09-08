const API_URL = "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen";

async function runTest1() {
  console.log("=== TEST 1: MSNV không tồn tại (999999999) ===");
  const payload = {
    title: "AUDIT TEST P2 FAKE MSNV " + Date.now(),
    category: "PRODUCTIVITY",
    categoryLabel: "3.Tăng Năng suất",
    region: "Kiên Giang 1",
    factory: "Kiên Giang 1",
    department: "MŨI - TỔ MAY 1",
    line: "Line 01",
    proposerName: "Tên Bất Kỳ",
    proposerEmpCode: "999999999",
    beforeDescription: "Mô tả hiện trạng lãng phí test MSNV giả",
    afterSolution: "Giải pháp cải tiến test MSNV giả",
    registrationType: "THI_DUA",
    isPublicScan: true
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const status = res.status;
  const data = await res.json();
  console.log("HTTP Status:", status);
  console.log("Response Data:", JSON.stringify(data, null, 2));

  if ((status === 400 || status === 404) && !data.success) {
    console.log("-> TEST 1 PASSED! Server rejected non-existent MSNV with status", status);
  } else {
    console.error("-> TEST 1 FAILED!");
    process.exit(1);
  }
}

async function runTest2() {
  console.log("\n=== TEST 2: MSNV thật nhưng tên giả ===");
  const payload = {
    title: "AUDIT TEST P2 REAL MSNV FAKE NAME " + Date.now(),
    category: "PRODUCTIVITY",
    categoryLabel: "3.Tăng Năng suất",
    region: "Kiên Giang 1",
    factory: "Kiên Giang 1",
    department: "MŨI - TỔ MAY 1",
    line: "Line 01",
    proposerName: "TEN GIA",
    proposerEmpCode: "202608001",
    beforeDescription: "Mô tả hiện trạng test tên giả",
    afterSolution: "Giải pháp cải tiến test tên giả",
    registrationType: "THI_DUA",
    isPublicScan: true
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const status = res.status;
  const data = await res.json();
  console.log("HTTP Status:", status);
  console.log("Response Data:", JSON.stringify(data, null, 2));

  if ((status === 200 || status === 201) && data.success && data.code) {
    console.log("-> TEST 2 Submit succeeded! Code:", data.code);
    return data.code;
  } else {
    console.error("-> TEST 2 FAILED!");
    process.exit(1);
  }
}

async function main() {
  await runTest1();
  await runTest2();
}

main().catch(err => {
  console.error("Execution error:", err);
  process.exit(1);
});
