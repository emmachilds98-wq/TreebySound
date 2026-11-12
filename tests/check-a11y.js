/* Accessibility audit of every screen and every handbook part with axe-core.
   One-off setup:  npm install --no-save axe-core@4.10.2
   Run:            node tests/check-a11y.js     (exits 1 on any violation) */
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ ...devices['iPhone 13'] })).newPage();
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await p.waitForTimeout(800);
  await p.addScriptTag({ content: axe });
  const screens = ['#hub', '#ask', '#job', '#support', '#path', '#library'].concat(Array.from({ length: 22 }, (_, i) => '#p' + i));
  const totals = {};
  for (const h of screens) {
    await p.evaluate(h => { location.hash = h; }, h);
    await p.waitForTimeout(300);
    const v = await p.evaluate(async () => (await axe.run(document, { resultTypes: ['violations'] })).violations.map(x => ({ id: x.id, help: x.help, n: x.nodes.length, eg: x.nodes[0].target.join(' ') })));
    v.forEach(x => { if (!totals[x.id]) console.log(`${x.id} on ${h}: ${x.help} — e.g. ${x.eg}`); totals[x.id] = (totals[x.id] || 0) + x.n; });
  }
  await b.close();
  console.log(Object.keys(totals).length ? 'Violations: ' + JSON.stringify(totals) : 'No accessibility violations on any screen or part.');
  process.exit(Object.keys(totals).length ? 1 : 0);
})();
