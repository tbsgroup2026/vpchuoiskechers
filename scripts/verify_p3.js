const KAIZEN_URL = "https://vpchuoiskechers.tbsgroup2026.workers.dev/work/kaizen";
const REGISTER_URL = "https://vpchuoiskechers.tbsgroup2026.workers.dev/work/kaizen/register";

async function verifyAuthRoute() {
  console.log("=== TEST PRIORITY 3: AUTH ROUTES ===");

  // 1. GET /work/kaizen without cookie
  const resKaizen = await fetch(KAIZEN_URL, { redirect: "manual" });
  console.log("GET /work/kaizen (No Auth):");
  console.log("Status:", resKaizen.status);
  console.log("Location header:", resKaizen.headers.get("location"));

  // 2. GET /work/kaizen/register without cookie
  const resRegister = await fetch(REGISTER_URL, { redirect: "manual" });
  console.log("\nGET /work/kaizen/register (No Auth):");
  console.log("Status:", resRegister.status);

  if (resKaizen.status === 302 && resRegister.status === 200) {
    console.log("\n-> PRIORITY 3 PASSED! /work/kaizen redirects 302 to /login, /work/kaizen/register remains public 200.");
  } else {
    console.error("\n-> PRIORITY 3 FAILED!");
    process.exit(1);
  }
}

verifyAuthRoute().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
