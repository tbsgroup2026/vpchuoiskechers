async function testClearAll() {
  const deleteUrl = "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/users?all=true";
  console.log("1. Sending DELETE all to live:", deleteUrl);
  const delRes = await fetch(deleteUrl, { method: "DELETE" });
  console.log("Delete status:", delRes.status, await delRes.json());

  const getUrl = "https://vpchuoiskechers.tbsgroup2026.workers.dev/api/users";
  console.log("2. Sending GET to live:", getUrl);
  const getRes = await fetch(getUrl);
  console.log("Get status:", getRes.status);
  const json = await getRes.json();
  console.log("Returned data length:", json.data ? json.data.length : 0);
  if (json.data && json.data.length > 0) {
    console.log("Sample returned users:", json.data.slice(0, 5));
  }
}

testClearAll();
