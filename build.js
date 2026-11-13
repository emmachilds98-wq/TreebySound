#!/usr/bin/env node
/* Builds index.html from the files in src/.

   src/index.src.html is the page with include markers in place of each piece.
   A marker is a line on its own — an HTML comment "#include path", a CSS
   comment "#include path" (in styles) or a JS line comment "#include path"
   (see MARKER below) — and is replaced by that file from src/, exactly as written
   (pieces can include pieces). The result is the single, self-contained
   index.html that GitHub Pages serves and that works offline and from disk.

   Usage:
     node build.js           write index.html
     node build.js --check   exit 1 if index.html is out of date with src/ */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'index.html');
const MARKER = /^\s*(?:<!--#include (\S+)-->|\/\*#include (\S+)\*\/|\/\/#include (\S+))\s*$/;

function expand(file, stack) {
  if (stack.includes(file)) throw new Error('Include loop: ' + stack.concat(file).join(' → '));
  const text = fs.readFileSync(path.join(SRC, file), 'utf8');
  return text.split('\n').map(line => {
    const m = MARKER.exec(line);
    if (!m) return line;
    const inc = m[1] || m[2] || m[3];
    if (!fs.existsSync(path.join(SRC, inc))) throw new Error(file + ' includes a missing file: ' + inc);
    return expand(inc, stack.concat(file));
  }).join('\n');
}

const built = expand('index.src.html', []);
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (current !== built) {
    console.error('index.html is out of date — run: node build.js');
    process.exit(1);
  }
  console.log('index.html is up to date with src/');
} else {
  fs.writeFileSync(OUT, built);
  console.log('Built index.html (' + Math.round(Buffer.byteLength(built) / 1024) + ' KB) from src/');
}
