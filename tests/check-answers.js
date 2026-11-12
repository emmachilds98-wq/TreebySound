/* Asks the chat every way each written answer can be asked (every phrasing in
   ANSWERS) and reports how many get that exact answer, a guided route, or
   something else. Use --list to see the misses.  node tests/check-answers.js */
const { chromium } = require('playwright');
const fs = require('fs');
const html = fs.readFileSync(require('path').resolve(__dirname, '..', 'index.html'), 'utf8');
const bank = html.slice(html.indexOf('var ANSWERS = ['), html.indexOf('\n  ];\n  var bank', html.indexOf('var ANSWERS = [')));
const entries = [...bank.matchAll(/^\s*\["([^"]*)", "((?:[^"\\]|\\.)*)", "([^"]*)"\]/gm)].map(m => ({ ps: m[1].split('|'), a: m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/\\"/g,'"').slice(0, 40) }));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + require('path').resolve(__dirname, '..', 'index.html') + '#ask'); await p.waitForTimeout(700);
  let ok = 0, route = 0, wrong = [], total = 0;
  for (const e of entries) for (const q of e.ps) {
    total++;
    const out = await p.evaluate(q => {
      document.getElementById('chatReset').click();
      const i = document.getElementById('chatInput'); i.value = q;
      document.getElementById('chatForm').requestSubmit();
      const ms = [...document.querySelectorAll('#chatLog .chat-msg')].slice(2);
      return { text: ms.map(m => m.textContent).join(' | '), route: ms.some(m => m.classList.contains('note') && /Sounds like|one step at a time|Let's prove/.test(m.textContent)) };
    }, q);
    const norm = s => s.replace(/\s+/g, ' ');
    if (norm(out.text).includes(norm(e.a))) ok++;
    else if (out.route) route++;
    else wrong.push(q + '  →  ' + out.text.slice(0, 70) + '   [wanted: ' + e.a + ']');
  }
  console.log(`phrasings ${total}: right answer ${ok}, went to a route ${route}, other ${wrong.length}`);
  if (process.argv.includes('--list')) console.log(wrong.join('\n'));
  await b.close();
})();
