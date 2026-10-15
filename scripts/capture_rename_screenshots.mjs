import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('docs/screenshots/rename_module');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log("🚀 Starting Puppeteer to capture screenshots for Rename Module...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 1. Desktop 1920x1080 - Expanded Sidebar & Overview
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    
    // Set mock user in localStorage before loading
    await desktopPage.evaluateOnNewDocument(() => {
      localStorage.setItem('vpchuoiskechers_user', JSON.stringify({
        empCode: '202608001',
        name: 'Phạm Nguyễn Anh Huy',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        roleLevel: 1
      }));
    });

    console.log("📸 Navigating to Desktop /work...");
    await desktopPage.goto('http://127.0.0.1:3000/work', { waitUntil: 'networkidle0' });
    await desktopPage.waitForTimeout?.(2000) || new Promise(r => setTimeout(r, 2000));

    // Screenshot 1: Desktop Sidebar showing the renamed module card
    const cardPath = path.join(outDir, '01_desktop_sidebar_expanded.png');
    await desktopPage.screenshot({ path: cardPath, fullPage: false });
    console.log(`✅ Saved: ${cardPath}`);

    // Screenshot 2: Desktop visiting old URL /work?dept=logistics
    console.log("📸 Navigating to Desktop /work?dept=logistics (URL compatibility check)...");
    await desktopPage.goto('http://127.0.0.1:3000/work?dept=logistics', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const routePath = path.join(outDir, '02_desktop_logistics_route.png');
    await desktopPage.screenshot({ path: routePath, fullPage: false });
    console.log(`✅ Saved: ${routePath}`);

    await desktopPage.close();

    // 3. Mobile 390x844 (iPhone 12/13/14)
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    
    await mobilePage.evaluateOnNewDocument(() => {
      localStorage.setItem('vpchuoiskechers_user', JSON.stringify({
        empCode: '202608001',
        name: 'Phạm Nguyễn Anh Huy',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        roleLevel: 1
      }));
    });

    console.log("📸 Navigating to Mobile /work?dept=logistics...");
    await mobilePage.goto('http://127.0.0.1:3000/work?dept=logistics', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    const mobileRoutePath = path.join(outDir, '03_mobile_390px_logistics_view.png');
    await mobilePage.screenshot({ path: mobileRoutePath, fullPage: false });
    console.log(`✅ Saved: ${mobileRoutePath}`);

    // Click Mobile Menu button to open drawer showing 13 modules
    console.log("📸 Opening Mobile Navigation Drawer to test module card wrapping on 390px...");
    // Find menu toggle button (hamburger icon)
    const menuBtn = await mobilePage.$('button[title*="Menu"], button[aria-label*="Menu"], header button:has(svg)');
    if (menuBtn) {
      await menuBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    } else {
      // Trigger state directly if button selector fails
      await mobilePage.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.querySelector('svg') && !b.innerText.trim());
        if (target) target.click();
      });
      await new Promise(r => setTimeout(r, 1000));
    }

    const mobileDrawerPath = path.join(outDir, '04_mobile_390px_menu_drawer.png');
    await mobilePage.screenshot({ path: mobileDrawerPath, fullPage: false });
    console.log(`✅ Saved: ${mobileDrawerPath}`);

    await mobilePage.close();

  } catch (err) {
    console.error("❌ Error capturing screenshots:", err);
  } finally {
    await browser.close();
    console.log("🎉 Puppeteer finished.");
  }
}

capture();
