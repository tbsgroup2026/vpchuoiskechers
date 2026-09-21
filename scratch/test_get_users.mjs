async function testGetUsers() {
  const url = "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/users";
  console.log("Sending GET to live:", url);
  try {
    const res = await fetch(url);
    console.log("Status Code:", res.status);
    const json = await res.json();
    console.log("Total users count:", json.data ? json.data.length : 0);
    const found = json.data ? json.data.find(u => u.emp_code === "TEST_EMP_9999") : null;
    console.log("Found TEST_EMP_9999:", found ? "YES" : "NO");
    if (found) console.log("User details:", found);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testGetUsers();
