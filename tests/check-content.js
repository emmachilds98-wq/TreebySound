/* Pack-wide content checks — no browser needed:  node tests/check-content.js
   Broken links, missing § references, duplicate ids, section numbers that
   don't match their ids, answers pointing at sections that don't exist,
   checklists without a reset link. Exits 1 if anything is wrong. */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const problems = [];
const ids = new Map();
for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.set(m[1], (ids.get(m[1]) || 0) + 1);
for (const [id, n] of ids) if (n > 1) problems.push(`duplicate id "${id}" (${n}×)`);
for (const m of html.matchAll(/href="#([^"'+]+)"/g)) if (!ids.has(m[1])) problems.push(`broken link #${m[1]}`);
for (const m of html.matchAll(/§\s?(\d{1,2})\.(\d{1,2})/g)) if (!ids.has(`s${m[1]}-${m[2]}`)) problems.push(`§${m[1]}.${m[2]} has no section`);
for (const m of html.matchAll(/<section class="s" id="s(\d+)-(\d+)"><h3><span class="n">([\d.]+)<\/span>/g))
  if (m[3] !== `${m[1]}.${m[2]}`) problems.push(`section s${m[1]}-${m[2]} is numbered ${m[3]}`);
const bankStart = html.indexOf('var ANSWERS = ['), bankEnd = html.indexOf('\n  ];\n  var bank', bankStart);
const bank = html.slice(bankStart, bankEnd);
let answers = 0;
for (const m of bank.matchAll(/^\s*\["([^"]*)", "((?:[^"\\]|\\.)*)", "([^"]*)"\]/gm)) {
  answers++;
  for (const id of m[3].split(' ').filter(Boolean)) if (!ids.has(id)) problems.push(`answer "${m[1].split('|')[0]}" points at missing #${id}`);
  const opens = (m[2].match(/<p>/g) || []).length, closes = (m[2].match(/<\/p>/g) || []).length;
  if (opens !== closes) problems.push(`answer "${m[1].split('|')[0]}" has unbalanced <p>`);
}
for (const m of html.matchAll(/<ul class="check" id="(chk-[^"]+)">/g)) {
  const isSection = html.lastIndexOf('<section class="s"', m.index) > html.lastIndexOf('<section class="hub', m.index);
  if (isSection && !html.includes(`data-target="${m[1]}"`)) problems.push(`checklist ${m[1]} has no reset link`);
}
const sections = (html.match(/<section class="s" id=/g) || []).length;
const sourced = (html.match(/Sources · checked/g) || []).length;
const items = (html.match(/<ul class="check"[\s\S]*?<\/ul>/g) || []).reduce((n, l) => n + (l.match(/<li/g) || []).length, 0);
console.log(`${sections} sections (${sourced} with a dated sources box), ${answers} answers, ${items} checklist items, ${(html.length / 1024).toFixed(0)} KB`);
if (problems.length) { console.log(problems.join('\n')); process.exit(1); }
console.log('No problems found.');
