// Renders each slide of presentation/index.html to PNG (to check the deck). Usage: node scripts/render-deck.mjs <outDir>
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const out = process.argv[2] || '.';
const file = pathToFileURL(path.resolve('..', 'presentation', 'index.html')).href;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1306, height: 760 });
await page.goto(file, { waitUntil: 'networkidle0' });
const n = await page.evaluate(() => document.querySelectorAll('.slide').length);
for (let k = 0; k < n; k++) {
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(out, `slide${k + 1}.png`) });
  await page.keyboard.press('ArrowRight');
}
await browser.close();
console.log('rendered', n);
