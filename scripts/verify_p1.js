const API_URL = "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen";

const samplePayload = (titleSuffix = "") => ({
  title: `AUDIT TEST KAIZEN P1 ${titleSuffix} ${Date.now()}`,
  category: "PRODUCTIVITY",
  categoryLabel: "3.Tăng Năng suất",
  region: "Kiên Giang 1",
  factory: "Kiên Giang 1",
  department: "MŨI - TỔ MAY 1",
  line: "Line 01",
  proposerName: "Nguyễn Văn A",
  proposerEmpCode: "202608001",
  proposerPosition: "Công nhân",
  beforeDescription: "Mô tả hiện trạng lãng phí trước cải tiến cho AUDIT TEST P1",
  afterSolution: "Giải pháp cải tiến đề xuất cho AUDIT TEST P1",
  registrationType: "THI_DUA",
  isPublicScan: true
});

async function runTest1() {
  console.log("=== TEST 1: Submit Single Valid Proposal ===");
  const payload = samplePayload("TEST1");
  console.log("Request Payload:", JSON.stringify(payload, null, 2));

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
    console.log("-> TEST 1 PASSED! Code:", data.code);
    return data.code;
  } else {
    console.error("-> TEST 1 FAILED!");
    process.exit(1);
  }
}

async function runTest2() {
  console.log("\n=== TEST 2: Race Condition (2 Concurrent Submits) ===");
  const payload1 = samplePayload("RACE_1");
  const payload2 = samplePayload("RACE_2");

  const submit = (payload, name) => fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(async res => {
    const data = await res.json();
    return { name, status: res.status, data };
  });

  const [res1, res2] = await Promise.all([
    submit(payload1, "Request 1"),
    submit(payload2, "Request 2")
  ]);

  console.log("Request 1 Result:", res1);
  console.log("Request 2 Result:", res2);

  const pass1 = (res1.status === 200 || res1.status === 201) && res1.data.success;
  const pass2 = (res2.status === 200 || res2.status === 201) && res2.data.success;
  const distinctCode = res1.data.code !== res2.data.code;

  if (pass1 && pass2 && distinctCode) {
    console.log(`-> TEST 2 PASSED! Code 1: ${res1.data.code}, Code 2: ${res2.data.code}`);
  } else {
    console.error("-> TEST 2 FAILED! Collision or Non-200 response!");
    process.exit(1);
  }
}

async function runTest3() {
  console.log("\n=== TEST 3: 10 Sequential Submits ===");
  const codes = new Set();
  const results = [];

  for (let i = 1; i <= 10; i++) {
    const payload = samplePayload(`SEQ_${i}`);
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const status = res.status;
    const data = await res.json();
    results.push({ req: i, status, code: data.code, success: data.success });
    if ((status === 200 || status === 201) && data.success && data.code) {
      codes.add(data.code);
    }
  }

  console.log("Sequential Results:", results);
  if (results.every(r => r.status === 200 || r.status === 201) && codes.size === 10) {
    console.log("-> TEST 3 PASSED! 10 distinct codes generated without errors.");
  } else {
    console.error("-> TEST 3 FAILED!");
    process.exit(1);
  }
}

async function main() {
  await runTest1();
  await runTest2();
  await runTest3();
  console.log("\nALL 3 TESTS PASSED FOR PRIORITY 1!");
}

main().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
