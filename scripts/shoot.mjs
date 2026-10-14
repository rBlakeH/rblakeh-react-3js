// Dev tool: screenshot each station at a given scroll progress, so a port can
// be compared against the design prototype frame by frame.
//
//   node scripts/shoot.mjs <url> <outDir> [progress...]
//
// Progress values are fractions of each station's own scroll span (the same
// number the page's scroll driver computes). Defaults to 0.5.

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const url = process.argv[2] || 'http://localhost:5181/';
const outDir = process.argv[3] || 'shots';
const progresses = process.argv.slice(4).map(Number);
const stops = progresses.length ? progresses : [0.5];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => document.fonts.status === 'loaded');

const labels = await page.$$eval('[data-screen-label]', (els) =>
  els.map((e) => e.getAttribute('data-screen-label'))
);

for (const label of labels) {
  for (const p of stops) {
    await page.evaluate(
      ([label, p]) => {
        const el = document.querySelector(`[data-screen-label="${label}"]`);
        const se = document.scrollingElement;
        const top = el.offsetTop + (el.offsetHeight - window.innerHeight) * p;
        se.scrollTop = top;
      },
      [label, p]
    );
    // let the RAF loop settle on the new position
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    );
    await page.waitForTimeout(120);
    const name = `${label.replace(/\s+/g, '-').toLowerCase()}@${p}`;
    await page.screenshot({ path: `${outDir}/${name}.png` });
    console.log(`${name}.png`);
  }
}

await page.evaluate(() => (document.scrollingElement.scrollTop = 0));
await page.waitForTimeout(150);
await page.screenshot({ path: `${outDir}/hero.png` });
console.log('hero.png');

await browser.close();

if (errors.length) {
  console.error('\nPAGE ERRORS:');
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
