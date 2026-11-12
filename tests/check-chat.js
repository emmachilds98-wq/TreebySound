/* Asks the chat every question in chat-cases.txt and checks the reply.
   Usage: node tests/check-chat.js  — prints failures and a score. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const page = 'file://' + path.resolve(__dirname, '..', 'index.html') + '#ask';
const cases = fs.readFileSync(path.join(__dirname, 'chat-cases.txt'), 'utf8')
  .split('\n').filter(l => l.trim() && !l.startsWith('#'))
  .map(l => l.split('=>').map(x => x.trim()));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(page);
  await p.waitForTimeout(600);
  let pass = 0;
  for (const [q, want] of cases) {
    await p.evaluate(() => document.getElementById('chatReset').click());
    await p.fill('#chatInput', q);
    await p.press('#chatInput', 'Enter');
    await p.waitForTimeout(150);
    const got = await p.evaluate(() => [...document.querySelectorAll('#chatLog .chat-msg')].slice(2).map(m => m.textContent).join(' | ') + ' | ' + [...document.querySelectorAll('#chatChips .chat-chip')].map(c => c.textContent).join(' | '));
    if (got.toLowerCase().includes(want.toLowerCase())) pass++;
    else console.log('FAIL: ' + q + '\n  wanted: ' + want + '\n  got:    ' + got.slice(0, 200));
  }
  console.log(`\n${pass}/${cases.length} passed` + (errors.length ? `\nScript errors: ${errors.join('; ')}` : ', no script errors'));
  await b.close();
  process.exit(pass === cases.length && !errors.length ? 0 : 1);
})();
