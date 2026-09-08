const BASE_URL = "https://vpchuoiskechers.tbsgroup2026.workers.dev";

async function runFullE2ERegression() {
  console.log("=========================================================");
  console.log("=== REGRESSION CUỐI CÙNG: LUỒNG THẬT END-TO-END KAIZEN ===");
  console.log("=========================================================\n");

  // Step 1: Login
  console.log("[Luồng 1/5] Đăng nhập hệ thống...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empCode: "202608001" })
  });
  const loginStatus = loginRes.status;
  const loginData = await loginRes.json();
  console.log(`-> Status: ${loginStatus}`);
  console.log(`-> Logged in user: ${loginData.user?.name} (${loginData.user?.empCode})`);
  console.log(`-> JWT Token: ${loginData.token?.substring(0, 30)}...`);

  if (loginStatus !== 200 || !loginData.token) {
    console.error("❌ Bước 1 Thất bại: Đăng nhập lỗi");
    process.exit(1);
  }

  // Step 2: Employee lookup
  console.log("\n[Luồng 2/5] Tra cứu MSNV thật (202608001)...");
  const lookupRes = await fetch(`${BASE_URL}/api/employees/lookup?msnv=202608001`);
  const lookupStatus = lookupRes.status;
  const lookupData = await lookupRes.json();
  console.log(`-> Status: ${lookupStatus}`);
  console.log(`-> Data tra cứu:`, JSON.stringify(lookupData, null, 2));

  if (lookupStatus !== 200 || !lookupData.success || !lookupData.data) {
    console.error("❌ Bước 2 Thất bại: Tra cứu MSNV lỗi");
    process.exit(1);
  }

  // Step 3 & 4: Select Org & Submit Kaizen proposal
  console.log("\n[Luồng 3&4/5] Submit đề xuất Kaizen hợp lệ (Factory: Nhà Máy Miền Đông, Dept: Đầu Vào, Line: Line 01)...");
  const proposalPayload = {
    title: "REGRESSION TEST E2E KAIZEN PROPOSAL " + Date.now(),
    category: "PRODUCTIVITY",
    categoryLabel: "3.Tăng Năng suất",
    region: "Nhà Máy Miền Đông",
    factory: "Nhà Máy Miền Đông",
    department: "Đầu Vào",
    line: "Line 01",
    proposerName: lookupData.data.name,
    proposerEmpCode: lookupData.data.emp_code,
    proposerPosition: lookupData.data.vtcv || "Công nhân",
    beforeDescription: "Mô tả hiện trạng lãng phí trước cải tiến cho E2E Regression",
    afterSolution: "Giải pháp cải tiến đề xuất cho E2E Regression",
    registrationType: "THI_DUA",
    isPublicScan: true
  };

  const submitRes = await fetch(`${BASE_URL}/api/ci-kaizen`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${loginData.token}`
    },
    body: JSON.stringify(proposalPayload)
  });

  const submitStatus = submitRes.status;
  const submitData = await submitRes.json();
  console.log(`-> Status: ${submitStatus}`);
  console.log(`-> Submit Response:`, JSON.stringify(submitData, null, 2));

  if ((submitStatus !== 200 && submitStatus !== 201) || !submitData.success || !submitData.code) {
    console.error("❌ Bước 4 Thất bại: Submit đề xuất bị lỗi");
    process.exit(1);
  }

  console.log(`\n[Luồng 5/5] Mã Kaizen vừa sinh thành công: ${submitData.code}`);
  console.log("=========================================================");
  console.log("✅ KẾT QUẢ REGRESSION: TOÀN BỘ LUỒNG END-TO-END THÀNH CÔNG THỰC TẾ!");
  console.log("=========================================================");
  return submitData.code;
}

runFullE2ERegression().catch(err => {
  console.error("Lỗi chạy E2E Regression:", err);
  process.exit(1);
});
