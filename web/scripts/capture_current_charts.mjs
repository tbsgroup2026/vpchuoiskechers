import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('../docs/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log("🚀 Launching Headless Chrome to capture real application screenshots...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
  await page.setExtraHTTPHeaders({ 'x-forwarded-proto': 'https' });

  // 1. Login via API to get valid token
  console.log("🔑 Logging in as 202608001...");
  const loginRes = await fetch('http://127.0.0.1:8787/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-proto': 'https' },
    body: JSON.stringify({ empCode: '202608001', password: 'Pilot@2026' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    console.error("❌ Login failed:", loginData);
    await browser.close();
    return;
  }
  const token = loginData.token;
  console.log("✅ Logged in successfully, token:", token.substring(0, 20) + "...");

  // Set cookie and navigate
  await page.setCookie({
    name: 'tbs_token',
    value: token,
    domain: '127.0.0.1',
    path: '/',
  });

  // Inject token in localStorage before navigation
  await page.goto('http://127.0.0.1:8787/login', { waitUntil: 'networkidle2' });
  await page.evaluate((t, u) => {
    localStorage.setItem('tbs_token', t);
    localStorage.setItem('tbs_current_user', JSON.stringify(u));
  }, token, loginData.user);

  const targets = [
    { name: '01_work_main_dashboard', url: 'http://127.0.0.1:8787/work' },
    { name: '02_work_overview_multiplant', url: 'http://127.0.0.1:8787/work/overview' },
    { name: '03_work_kaizen', url: 'http://127.0.0.1:8787/work/kaizen' },
    { name: '04_work_gemba', url: 'http://127.0.0.1:8787/work/gemba' },
    { name: '05_work_dept_management', url: 'http://127.0.0.1:8787/work/dept-management' },
    { name: '06_maintenance_kpi', url: 'http://127.0.0.1:8787/maintenance/kpi' },
    { name: '07_pph_view', url: 'http://127.0.0.1:8787/pph-view' },
  ];

  for (const target of targets) {
    try {
      console.log(`📸 Capturing ${target.name} from ${target.url}...`);
      await page.goto(target.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000)); // wait for charts/animations
      const dest = path.join(outDir, `${target.name}.png`);
      await page.screenshot({ path: dest, fullPage: true });
      console.log(`✅ Saved: ${dest}`);
    } catch (e) {
      console.error(`⚠️ Error capturing ${target.name}:`, e.message);
    }
  }

  await browser.close();
  console.log("🎉 All screenshots captured successfully!");
}

capture().catch(console.error);
