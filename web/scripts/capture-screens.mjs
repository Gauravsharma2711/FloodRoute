// Captures real screenshots of the running app (API on :8000, web on :3000) for the slide deck.
// Usage (from web/): node scripts/capture-screens.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('..', 'presentation', 'screens');
const BROWSER = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:3000';
const SCENARIO = 'replay_2021_05_17'; // very heavy real day (199.9 mm)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// hide the Next.js dev-mode badge so it does not appear in the slides
const hideDevBadge = (page) => page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((n) => n.remove()));

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--hide-scrollbars'] });

async function clickText(page, text) {
  const ok = await page.evaluate((t) => {
    const el = [...document.querySelectorAll('button')].find((b) => b.textContent && b.textContent.includes(t));
    if (el) { el.scrollIntoView({ block: 'center' }); el.click(); return true; }
    return false;
  }, text);
  if (!ok) throw new Error(`button not found: ${text}`);
}

// 1. Dispatcher view with the BKC decision
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 810, deviceScaleFactor: 1.5 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(4000);
  await clickText(page, 'BKC');
  await sleep(9000);
  await hideDevBadge(page);
  await page.screenshot({ path: path.join(OUT, 'dispatcher_bkc.png') });

  // 2. The decision card on its own
  const card = await page.evaluateHandle(() => {
    const label = [...document.querySelectorAll('div')].find((d) => d.textContent === 'Send the ambulance to');
    return label ? label.closest('.rounded-xl') : null;
  });
  const el = card.asElement();
  if (el) {
    await el.evaluate((n) => n.scrollIntoView({ block: 'center' }));
    await sleep(800);
    await hideDevBadge(page);
    await el.screenshot({ path: path.join(OUT, 'decision_card.png') });
  }
  await page.close();
}

// 3. Driver phone view opened from the dispatcher's link
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/driver/?lat=19.06800&lon=72.86800&scenario=${SCENARIO}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(12000);
  await hideDevBadge(page);
  await page.screenshot({ path: path.join(OUT, 'driver_phone.png') });
  await page.close();
}

// 4. "How reliable is this?" evidence panel
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 810, deviceScaleFactor: 1.5 });
  await page.goto(`${BASE}/reliable/`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(4000);
  await hideDevBadge(page);
  await page.screenshot({ path: path.join(OUT, 'reliability.png') });
  await page.close();
}

await browser.close();
console.log('saved to', OUT);
