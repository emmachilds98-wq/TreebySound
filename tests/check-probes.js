/* Scores the chat on the probe set (tests/probe-cases.txt): harder questions the
   answer bank wasn't written for. Reports good answers by topic.
   Usage: node tests/check-probes.js [--list] [--min N]
   --list   print every question with the start of its reply
   --min N  exit 1 if fewer than N are good (for use before merging) */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const page = 'file://' + path.resolve(__dirname, '..', 'index.html') + '#ask';
const list = process.argv.includes('--list');
const minArg = process.argv.indexOf('--min');
const min = minArg > -1 ? parseInt(process.argv[minArg + 1], 10) : 0;
const cases = fs.readFileSync(path.join(__dirname, 'probe-cases.txt'), 'utf8')
  .split('\n').filter(l => l.trim() && !l.startsWith('#'))
  .map(l => {
    const m = /^\[([^\]]+)\]\s*(.*?)\s*=>\s*(.*)$/.exec(l);
    const [want, not] = m[3].split('!!');
    const split = s => (s || '').split('|').map(x => x.trim().toLowerCase()).filter(Boolean);
    return { topic: m[1], q: m[2], want: split(want), not: split(not) };
  });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(page);
  await p.waitForTimeout(600);
  const byTopic = {};
  let good = 0;
  for (const c of cases) {
    await p.evaluate(() => document.getElementById('chatReset').click());
    await p.fill('#chatInput', c.q);
    await p.press('#chatInput', 'Enter');
    await p.waitForTimeout(200);
    const reply = await p.evaluate(() => [...document.querySelectorAll('#chatLog .chat-msg')].slice(2)
      .filter(m => !m.classList.contains('me')).map(m => m.textContent.replace(/\s+/g, ' ')).join(' | '));
    const r = reply.toLowerCase();
    const ok = c.want.some(w => r.includes(w)) && !c.not.some(w => r.includes(w));
    const t = byTopic[c.topic] = byTopic[c.topic] || { good: 0, all: 0 };
    t.all++; if (ok) { t.good++; good++; }
    if (list || !ok) console.log((ok ? 'GOOD ' : 'MISS ') + '[' + c.topic + '] ' + c.q + '\n     ' + reply.slice(0, 220));
  }
  console.log('\nBy topic: ' + Object.keys(byTopic).map(k => k + ' ' + byTopic[k].good + '/' + byTopic[k].all).join(' · '));
  console.log(`Good: ${good}/${cases.length}` + (errors.length ? `\nScript errors: ${errors.join('; ')}` : ', no script errors'));
  await b.close();
  process.exit((good >= min && !errors.length) ? 0 : 1);
})();
