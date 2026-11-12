# TreebySound

The TreebySound live-audio workday companion: a UK live-audio field handbook,
job hub and fault finder, designed for iPhone-first reading and fully usable
offline. Published with GitHub Pages; open it in Safari and *Share → Add to Home
Screen* to install it like an app.

No accounts, no API keys, no running costs. Nothing typed into the app leaves
the phone.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole app (screens: Home, Ask, Job, Support, Pathway, Library): styles, the handbook (21 parts), the app screens and all the scripts. Works opened straight from disk too. |
| `sw.js` | Service worker: keeps an offline copy, fetches updates in the background, and keeps one previous version for "Use previous version". |
| `manifest.webmanifest`, `treebysound-icon.png` | Home-screen app details and icon. |
| `PLAN.md` | The current upgrade plan and progress log — read this first if you're continuing work. |

## How the chat (the Ask screen) works

It runs entirely in the page and keeps the conversation on the phone for 12
hours (`saveSoon()` / `restoreLog()`). In order, it tries:

1. **Follow-ups and sums** — "tell me more" opens the last answer's section; `calcAnswer()` does delay, SPL, dB, volts, antenna and impedance sums.
2. **Special requests** — system test, "my kit", career coaching.
3. **d&b model questions** — answered from the tables in §6.20 (`buildModels()`), so the book and the chat never disagree.
4. **The answer bank** — `var ANSWERS = [` — direct written answers to common questions.
5. **Guided routes** — `var FLOWS = [` — step-by-step fault-finding and set-up conversations.
6. **The book** — glossary (§20.1) and a ranked search of every section (`searchBook()`, BM25).

Typos, synonyms ("cab" → speaker) and word endings are handled the same way
everywhere (`SYNONYMS`, `norm()`, `terms()`, `stem()`). Links to sections from the
chat open the section inside the chat (`peek()`).

## Adding things

**A handbook section** — add `<section class="s" id="sP-N"><h3><span class="n">P.N</span> Title</h3> … </section>`
inside its part (`<div class="part" id="pP">`). The contents, search, how-to
index and chat pick it up automatically. Use the existing note boxes
(`note std` Standard, `note warn` Watch it, `note alt` Also seen, `note deep`
Go deeper / Sources). Researched content ends with a
`Sources · checked <Month Year>` note.

**An answer** — add a line to `ANSWERS`:

```js
["how it gets asked|another way to ask it|a third way", "<p>The answer, short and plain.</p>", "s6-17 s3-12"],
```

The last part lists the sections it comes from (first one is offered as "Read it
here"). Several phrasings make it easier to match.

**A guided route** — add an object to `FLOWS` (see the comment above it for the
node format), and add its id to `FIX_STARTERS`, `ADV_STARTERS` or
`SETUP_STARTERS` if it should appear as a starter button.

## Checking a change

There's no CI. Before merging, run the chat test set — real questions, each
with what the reply must contain:

```bash
node tests/check-chat.js
```

And the pack-wide content check (no browser needed — broken links, missing §
references, duplicate ids, misnumbered sections, answers pointing at missing
sections, checklists without a reset link):

```bash
node tests/check-content.js
```

Every way each written answer can be asked (about 1,250 phrasings) — how many get exactly that answer; `--list` shows the misses:

```bash
node tests/check-answers.js
```

Accessibility (axe-core, every screen and part) — install axe once, then run:

```bash
npm install --no-save axe-core@4.10.2
```

```bash
node tests/check-a11y.js
```

Add a line to `tests/chat-cases.txt` whenever you add an answer or a route, or
find a question the chat gets wrong. Also open `index.html` at phone size and
look at the screen you changed.
