async function testLiveSyncDiff() {
  const url = "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/users/sync-diff";
  const body = {
    newUsers: [
      {
        id: `emp_test_${Date.now()}_1`,
        empCode: "TEST_EMP_9999",
        name: "Test Import User 9999",
        email: "test9999@tbsgroup.vn",
        phone: "0900000999",
        title: "Test Officer",
        department: "Khối Sản Xuất SKECHERS",
        roleCode: "CBCNV",
        status: "ACTIVE"
      }
    ],
    sourceFileName: "Test_Live_Import.xlsx"
  };

  console.log("Sending POST to live:", url);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    console.log("Status Code:", res.status);
    const json = await res.json();
    console.log("Response JSON:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testLiveSyncDiff();
