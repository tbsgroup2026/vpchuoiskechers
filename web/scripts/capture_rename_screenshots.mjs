import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve('..');
const outDir = path.resolve(rootDir, 'docs/screenshots/rename_module');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const mockUser = {
  userId: 1,
  empCode: "202608001",
  name: "Phạm Nguyễn Anh Huy",
  title: "Trưởng Ban CI & Chuyển Đổi Số",
  department: "Khối IT & Chuyển đổi số",
  departmentCode: "IT",
  roleCode: "SUPER_ADMIN",
  roles: ["SUPER_ADMIN", "ADMIN"],
  roleLevel: 1,
  avatar: "/images/tbs-logo.png",
  email: "202608001@tbsgroup.vn"
};

async function capture() {
  console.log("🚀 Starting Puppeteer to capture screenshots for Rename Module...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Desktop 1920x1080 - Sidebar scroll down to show renamed card
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    
    await desktopPage.evaluateOnNewDocument((user) => {
      localStorage.setItem('tbs_current_user', JSON.stringify(user));
      sessionStorage.setItem('tbs_current_user', JSON.stringify(user));
      localStorage.setItem('tbs_token', 'mock_token');
    }, mockUser);

    console.log("📸 Navigating to Desktop /work...");
    await desktopPage.goto('http://127.0.0.1:3000/work', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll sidebar down to make logistics card visible
    await desktopPage.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('Kế hoạch chuẩn bị') || (b.getAttribute('title') || '').includes('Kế hoạch chuẩn bị')
      );
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise(r => setTimeout(r, 500));

    const cardPath = path.join(outDir, '01_desktop_sidebar_expanded.png');
    await desktopPage.screenshot({ path: cardPath, fullPage: false });
    console.log(`✅ Saved: ${cardPath}`);

    // 2. Desktop Click on Module / Direct URL /work?dept=logistics
    console.log("📸 Selecting module logistics on Desktop...");
    await desktopPage.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('Kế hoạch chuẩn bị') || (b.getAttribute('title') || '').includes('Kế hoạch chuẩn bị')
      );
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const routePath = path.join(outDir, '02_desktop_logistics_route.png');
    await desktopPage.screenshot({ path: routePath, fullPage: false });
    console.log(`✅ Saved: ${routePath}`);

    await desktopPage.close();

    // 3. Mobile 390x844 (iPhone 12/13/14)
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    
    await mobilePage.evaluateOnNewDocument((user) => {
      localStorage.setItem('tbs_current_user', JSON.stringify(user));
      sessionStorage.setItem('tbs_current_user', JSON.stringify(user));
      localStorage.setItem('tbs_token', 'mock_token');
    }, mockUser);

    console.log("📸 Navigating to Mobile /work?dept=logistics...");
    await mobilePage.goto('http://127.0.0.1:3000/work?dept=logistics', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const mobileRoutePath = path.join(outDir, '04_mobile_390px_logistics_view.png');
    await mobilePage.screenshot({ path: mobileRoutePath, fullPage: false });
    console.log(`✅ Saved: ${mobileRoutePath}`);

    // Open Mobile Drawer Menu
    console.log("📸 Opening Mobile Navigation Drawer to test module card wrapping on 390px...");
    const hamburgerBtn = await mobilePage.$('button[title="Mở danh mục phân hệ"]');
    if (hamburgerBtn) {
      await hamburgerBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    // Scroll menu down to logistics item inside drawer
    await mobilePage.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('Kế hoạch chuẩn bị')
      );
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 500));

    const mobileDrawerPath = path.join(outDir, '03_mobile_390px_menu_drawer.png');
    await mobilePage.screenshot({ path: mobileDrawerPath, fullPage: false });
    console.log(`✅ Saved: ${mobileDrawerPath}`);

    await mobilePage.close();

  } catch (err) {
    console.error("❌ Error capturing screenshots:", err);
  } finally {
    await browser.close();
    console.log("🎉 Puppeteer finished successfully.");
  }
}

capture();
