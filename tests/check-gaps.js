/* Gap finder: asks the chat the questions each section of the book should be
   able to answer, and lists the sections it can't find its way to.
   Questions come from the book itself: "what is <term>" for every glossary
   style term (<dt>) in a section, and each sub-heading (<h4>) asked as-is.
   A reply counts as found when it cites the section (a link or "From x.y")
   or, for a term, explains that term.
   Usage: node tests/check-gaps.js [--part 6] [--worst 25] [--list]
   Not a pass/fail test: it's a to-do list for the next update. */
const { chromium } = require('playwright');
const path = require('path');
const page = 'file://' + path.resolve(__dirname, '..', 'index.html') + '#ask';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const part = arg('--part', null), worst = +arg('--worst', 25), list = process.argv.includes('--list');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto(page);
  await p.waitForTimeout(600);
  const qs = await p.evaluate((part) => {
    const out = [];
    document.querySelectorAll('section.s[id^="s"]').forEach(sec => {
      const id = sec.id, m = /^s(\d+)-(\d+)$/.exec(id);
      if (!m || (part && m[1] !== part) || m[1] === '20' || m[1] === '19') return;
      const num = m[1] + '.' + m[2];
      sec.querySelectorAll('dt').forEach(dt => {
        const term = dt.textContent.replace(/\s*\(.*?\)\s*/g, ' ').split(/ \/ | — |:/)[0].trim();
        /* skip labels rather than terms ("What it is", "Your part in it") and naming suffixes ("-SUB") */
        if (/^(what|the|your|how|when|where|why|who|if|in|on|at|for|before|after|during)\b/i.test(term) || term.length < 3 || /^[-.]/.test(term)) return;
        if (term && term.length < 40) out.push({ id, num, q: 'what is ' + term, term: term.toLowerCase() });
      });
      sec.querySelectorAll('h4').forEach(h => {
        const t = h.textContent.trim();
        if (t.length > 6 && t.length < 70) out.push({ id, num, q: t, term: null });
      });
    });
    return out;
  }, part);
  const bySec = {};
  for (const c of qs) {
    await p.evaluate(() => document.getElementById('chatReset').click());
    await p.fill('#chatInput', c.q);
    await p.press('#chatInput', 'Enter');
    await p.waitForTimeout(120);
    const r = await p.evaluate(() => {
      const msgs = [...document.querySelectorAll('#chatLog .chat-msg')].slice(2).filter(m => !m.classList.contains('me'));
      return { text: msgs.map(m => m.textContent.replace(/\s+/g, ' ')).join(' | ').toLowerCase(),
               links: msgs.flatMap(m => [...m.querySelectorAll('a[href^="#s"]')].map(a => a.getAttribute('href').slice(1))) };
    });
    const ok = r.links.includes(c.id) || r.text.includes('from ' + c.num + ' ') || (c.term && r.text.includes(c.term) && !/i don't have|i want to get this right/.test(r.text));
    const s = bySec[c.id] = bySec[c.id] || { num: c.num, good: 0, all: 0, miss: [] };
    s.all++; if (ok) s.good++; else s.miss.push(c.q);
    if (list) console.log((ok ? 'GOOD ' : 'MISS ') + c.num + '  ' + c.q + '\n      ' + r.text.slice(0, 160));
  }
  const secs = Object.values(bySec), good = secs.reduce((n, s) => n + s.good, 0), all = secs.reduce((n, s) => n + s.all, 0);
  console.log(`\nFound the right section for ${good}/${all} questions (${Math.round(100 * good / Math.max(1, all))}%) across ${secs.length} sections.`);
  console.log(`\nWorst sections (to work on next):`);
  secs.filter(s => s.good < s.all).sort((a, b) => (a.good / a.all) - (b.good / b.all) || b.all - a.all).slice(0, worst)
    .forEach(s => console.log(`  ${s.num.padEnd(6)} ${s.good}/${s.all}   e.g. "${s.miss.slice(0, 2).join('", "')}"`));
  if (errors.length) console.log('Script errors: ' + errors.join('; '));
  await b.close();
})();
