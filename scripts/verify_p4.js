const API_URL = "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/ci-kaizen";

const samplePayload = (suffix) => ({
  title: `AUDIT TEST P4 RATE LIMIT ${suffix} ${Date.now()}`,
  category: "PRODUCTIVITY",
  categoryLabel: "3.Tăng Năng suất",
  region: "Kiên Giang 1",
  factory: "Kiên Giang 1",
  department: "MŨI - TỔ MAY 1",
  line: "Line 01",
  proposerName: "Nguyễn Văn A",
  proposerEmpCode: "202608001",
  beforeDescription: "Mô tả hiện trạng lãng phí test Rate Limit",
  afterSolution: "Giải pháp cải tiến test Rate Limit",
  registrationType: "THI_DUA",
  isPublicScan: true
});

async function main() {
  console.log("=== TEST PRIORITY 4: RATE LIMITING (5 Requests in < 2s) ===");
  
  const sendReq = (i) => fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(samplePayload(`REQ_${i}`))
  }).then(async res => ({ req: i, status: res.status, data: await res.json() }));

  // Send 5 requests rapidly (almost concurrently)
  const results = await Promise.all([
    sendReq(1),
    sendReq(2),
    sendReq(3),
    sendReq(4),
    sendReq(5)
  ]);

  // Sort by request index
  results.sort((a, b) => a.req - b.req);

  console.log("5 Rapid Requests Result Logs:");
  results.forEach(r => {
    console.log(`Request ${r.req}: HTTP ${r.status}`);
    console.log("Response:", JSON.stringify(r.data, null, 2));
    console.log("-----------------------------------------");
  });

  const passCount = results.filter(r => r.status === 200 || r.status === 201).length;
  const blockedCount = results.filter(r => r.status === 429).length;

  console.log(`Summary: ${passCount} succeeded (200/201), ${blockedCount} rate limited (429).`);

  if (passCount === 3 && blockedCount === 2) {
    console.log("-> 5 REQUEST RATE LIMIT TEST PASSED! Exactly 3 succeeded, 2 blocked with 429.");
  } else {
    console.error(`-> RATE LIMIT TEST FAILED! Expected 3 pass & 2 blocked, got ${passCount} pass & ${blockedCount} blocked.`);
    process.exit(1);
  }

  console.log("\n=== Waiting 11 seconds for Rate Limit window to reset ===");
  await new Promise(r => setTimeout(r, 11000));

  console.log("\n=== Testing 1 Request after window reset ===");
  const resetPayload = samplePayload("RESET_TEST");
  const resetRes = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resetPayload)
  });
  const resetStatus = resetRes.status;
  const resetData = await resetRes.json();
  console.log("HTTP Status:", resetStatus);
  console.log("Response:", JSON.stringify(resetData, null, 2));

  if ((resetStatus === 200 || resetStatus === 201) && resetData.success) {
    console.log("-> RESET WINDOW TEST PASSED! Request succeeded after 10s window reset.");
  } else {
    console.error("-> RESET WINDOW TEST FAILED!");
    process.exit(1);
  }

  console.log("\n=== Re-testing Priority 1 Test 2 (Race Condition) after Rate Limiter ===");
  console.log("Waiting 11 seconds for fresh window...");
  await new Promise(r => setTimeout(r, 11000));

  const payload1 = samplePayload("RACE_RETEST_1");
  const payload2 = samplePayload("RACE_RETEST_2");

  const submit = (payload, name) => fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(async res => ({ name, status: res.status, data: await res.json() }));

  const [race1, race2] = await Promise.all([
    submit(payload1, "Race 1"),
    submit(payload2, "Race 2")
  ]);

  console.log("Race 1 Result:", race1);
  console.log("Race 2 Result:", race2);

  const racePass1 = (race1.status === 200 || race1.status === 201) && race1.data.success;
  const racePass2 = (race2.status === 200 || race2.status === 201) && race2.data.success;
  const raceDiffCode = race1.data.code !== race2.data.code;

  if (racePass1 && racePass2 && raceDiffCode) {
    console.log(`-> RACE CONDITION RETEST PASSED! Code 1: ${race1.data.code}, Code 2: ${race2.data.code}`);
  } else {
    console.error("-> RACE CONDITION RETEST FAILED!");
    process.exit(1);
  }

  console.log("\nALL PRIORITY 4 TESTS PASSED!");
}

main().catch(err => {
  console.error("Error executing verify_p4:", err);
  process.exit(1);
});
