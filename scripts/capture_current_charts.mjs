import puppeteer from '../web/node_modules/puppeteer/lib/puppeteer/puppeteer.js';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('docs/screenshots');
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

  // 1. Main Dashboard
  console.log("📸 Capturing 01_work_main_dashboard...");
  await page.goto('http://127.0.0.1:8787/work', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(outDir, '01_work_main_dashboard.png'), fullPage: true });
  console.log("✅ Saved: 01_work_main_dashboard.png");

  // 1b. Main Dashboard Mobile Viewport
  console.log("📸 Capturing 01_work_main_dashboard_mobile...");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '01_work_main_dashboard_mobile.png'), fullPage: true });
  console.log("✅ Saved: 01_work_main_dashboard_mobile.png");

  // Restore desktop viewport
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // 2. Overview Multiplant
  console.log("📸 Capturing 02_work_overview_multiplant...");
  await page.goto('http://127.0.0.1:8787/work/overview', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '02_work_overview_multiplant.png'), fullPage: true });
  console.log("✅ Saved: 02_work_overview_multiplant.png");

  // 3. Kaizen Library
  console.log("📸 Capturing 03_work_kaizen...");
  await page.goto('http://127.0.0.1:8787/work/kaizen', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(outDir, '03_work_kaizen.png'), fullPage: true });
  console.log("✅ Saved: 03_work_kaizen.png");

  // 3b. Kaizen Dashboard View (Click Dashboard button)
  try {
    console.log("📸 Switching to Kaizen Dashboard Tab...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dbBtn = buttons.find(b => b.textContent && b.textContent.includes('Dashboard'));
      if (dbBtn) dbBtn.click();
    });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(outDir, '03_work_kaizen_dashboard.png'), fullPage: true });
    console.log("✅ Saved: 03_work_kaizen_dashboard.png");
  } catch (e) {
    console.warn("Could not switch to Kaizen Dashboard:", e.message);
  }

  // 4. Gemba Walk
  console.log("📸 Capturing 04_work_gemba...");
  await page.goto('http://127.0.0.1:8787/work/gemba', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outDir, '04_work_gemba.png'), fullPage: true });
  console.log("✅ Saved: 04_work_gemba.png");

  // 5. Dept Management
  console.log("📸 Capturing 05_work_dept_management...");
  await page.goto('http://127.0.0.1:8787/work/dept-management', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(outDir, '05_work_dept_management.png'), fullPage: true });
  console.log("✅ Saved: 05_work_dept_management.png");

  // 6. Maintenance KPI
  console.log("📸 Capturing 06_maintenance_kpi...");
  await page.goto('http://127.0.0.1:8787/maintenance/kpi', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(outDir, '06_maintenance_kpi.png'), fullPage: true });
  console.log("✅ Saved: 06_maintenance_kpi.png");

  await browser.close();
  console.log("🎉 All verification screenshots captured successfully!");
}

capture().catch(console.error);
