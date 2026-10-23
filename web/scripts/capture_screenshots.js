const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ASSETS_DIR = path.resolve(__dirname, '../../assets');
const BASE_URL = 'http://localhost:3333';

async function clickButtonWithText(page, text) {
  return await page.evaluate((btnText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find((b) => b.textContent && b.textContent.includes(btnText));
    if (target) {
      target.scrollIntoView({ block: 'center' });
      target.click();
      return true;
    }
    return false;
  }, text);
}

async function run() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // 1. Desktop Main (1366x768)
  console.log('1. Capturing Desktop: d1_main.png (1366x768)...');
  const pageD1 = await browser.newPage();
  await pageD1.setViewport({ width: 1366, height: 768 });
  await pageD1.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2500));
  await pageD1.screenshot({ path: path.join(ASSETS_DIR, 'd1_main.png') });
  await pageD1.close();

  // 2. Desktop Reliable (1366x768)
  console.log('2. Capturing Desktop: d2_reliable.png (1366x768)...');
  const pageD2 = await browser.newPage();
  await pageD2.setViewport({ width: 1366, height: 768 });
  await pageD2.goto(`${BASE_URL}/reliable/`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2000));
  await pageD2.screenshot({ path: path.join(ASSETS_DIR, 'd2_reliable.png') });
  await pageD2.close();

  // 3. Mobile Step 1 Rain (390x844)
  console.log('3. Capturing Mobile: m1_rain.png (390x844)...');
  const pageM = await browser.newPage();
  await pageM.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pageM.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2500));
  await pageM.screenshot({ path: path.join(ASSETS_DIR, 'm1_rain.png') });

  // 4. Mobile Step 2 Patient (390x844)
  console.log('4. Capturing Mobile: m2_patient.png (390x844)...');
  await clickButtonWithText(pageM, 'Set patient location');
  await new Promise((r) => setTimeout(r, 1200));
  await pageM.screenshot({ path: path.join(ASSETS_DIR, 'm2_patient.png') });

  // 5. Mobile Step 3 Result Ok (390x844)
  console.log('5. Capturing Mobile: m3_result.png (390x844)...');
  await clickButtonWithText(pageM, 'Find safe route');
  await new Promise((r) => setTimeout(r, 2000));
  await pageM.screenshot({ path: path.join(ASSETS_DIR, 'm3_result.png') });

  // 6. Mobile Step 6 Why Marked Sheet (390x844)
  console.log('6. Capturing Mobile: m6_why.png (390x844)...');
  await clickButtonWithText(pageM, 'Why these roads?');
  await new Promise((r) => setTimeout(r, 1200));
  await pageM.screenshot({ path: path.join(ASSETS_DIR, 'm6_why.png') });
  await pageM.close();

  // 7. Mobile Step 4 Cut Off State (390x844)
  console.log('7. Capturing Mobile: m4_cutoff.png (390x844)...');
  const pageM4 = await browser.newPage();
  await pageM4.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pageM4.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2000));
  await clickButtonWithText(pageM4, 'Set patient location');
  await new Promise((r) => setTimeout(r, 800));
  await clickButtonWithText(pageM4, 'Kurla');
  await new Promise((r) => setTimeout(r, 800));
  await clickButtonWithText(pageM4, 'Find safe route');
  await new Promise((r) => setTimeout(r, 2000));
  await pageM4.screenshot({ path: path.join(ASSETS_DIR, 'm4_cutoff.png') });
  await pageM4.close();

  // 8. Mobile Step 5 No Change State (390x844)
  console.log('8. Capturing Mobile: m5_nochange.png (390x844)...');
  const pageM5 = await browser.newPage();
  await pageM5.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pageM5.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2000));
  await clickButtonWithText(pageM5, 'Set patient location');
  await new Promise((r) => setTimeout(r, 800));
  await clickButtonWithText(pageM5, 'Colaba');
  await new Promise((r) => setTimeout(r, 800));
  await clickButtonWithText(pageM5, 'Find safe route');
  await new Promise((r) => setTimeout(r, 2000));
  await pageM5.screenshot({ path: path.join(ASSETS_DIR, 'm5_nochange.png') });
  await pageM5.close();

  await browser.close();
  console.log('ALL 8 SCREENSHOTS CAPTURED PERFECTLY!');
}

run().catch((err) => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
