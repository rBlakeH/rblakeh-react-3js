import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://localhost:5181/', { waitUntil: 'load' });
await page.waitForFunction(() => document.fonts.status === 'loaded');

// --- route jumps ----------------------------------------------------------
await page.evaluate(() => {
  const f = document.querySelector('[data-screen-label^="06"]');
  document.scrollingElement.scrollTop = f.offsetTop + (f.offsetHeight - innerHeight) * 0.6;
});
await page.waitForTimeout(800);
const labels = ['Boulder', 'Longs Peak', 'Albuquerque', 'Fort Worth', 'Main line'];
console.log('route jumps:');
for (let i = 0; i < labels.length; i++) {
  await page.evaluate(() => {
    const f = document.querySelector('[data-screen-label^="06"]');
    document.scrollingElement.scrollTop = f.offsetTop + (f.offsetHeight - innerHeight) * 0.6;
  });
  await page.waitForTimeout(500);
  await page.locator('.route__stop').nth(i).click();
  await page.waitForTimeout(1600);
  const r = await page.evaluate((i) => {
    const secs = [...document.querySelectorAll('[data-scroll-root]')];
    const t = secs[i];
    const want = t.offsetTop + (t.offsetHeight - innerHeight) * 0.55;
    const got = document.scrollingElement.scrollTop;
    const rect = t.getBoundingClientRect();
    const span = rect.height - innerHeight;
    return { off: Math.round(got - want), progress: +(-rect.top / span).toFixed(3) };
  }, i);
  console.log(`  ${labels[i].padEnd(12)} landed within ${r.off}px of target, progress ${r.progress}`);
}

// --- mount / dispose / remount --------------------------------------------
console.log('remount cycle:');
const ids = ['boulder', 'longs', 'desert', 'yard', 'inspection', 'terminus'];
for (const id of ids) {
  const r = await page.evaluate(async (id) => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:0;top:0;width:600px;height:400px;z-index:-1';
    document.body.appendChild(host);
    const mod = await import(`/src/scenes/${id}.js`);
    const draw = () => {
      const c = host.querySelector('canvas');
      const g = document.createElement('canvas');
      g.width = c.width; g.height = c.height;
      g.getContext('2d').drawImage(c, 0, 0);
      const d = g.getContext('2d').getImageData(0, 0, g.width, g.height).data;
      let lit = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) lit++;
      return lit / (d.length / 4);
    };
    const a = mod.mount(host); a.frame(0.5); const first = draw(); a.dispose();
    const afterDispose = host.querySelectorAll('canvas').length;
    const b = mod.mount(host); b.frame(0.5); const second = draw(); b.dispose();
    host.remove();
    return { first: +first.toFixed(3), second: +second.toFixed(3), afterDispose };
  }, id);
  const ok = r.second > 0.05 && Math.abs(r.first - r.second) < 0.02 && r.afterDispose === 0;
  console.log(`  ${id.padEnd(11)} coverage ${r.first} -> ${r.second}  canvases after dispose ${r.afterDispose}  ${ok ? 'OK' : 'FAIL'}`);
}

console.log(errs.length ? `\nPAGE ERRORS:\n  ${errs.join('\n  ')}` : '\nno page errors');
await b.close();
