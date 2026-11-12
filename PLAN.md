# TreebySound upgrade plan

This file is the hand-over point. Anyone (person or Claude session) picking this
up should read it first, then tick items off and push as they go. Work happens on
the branch `claude/nifty-clarke-p8ph57`; the draft pull request for it collects
the changes for review.

## Ground rules (decided by the owner)

- **No API keys, no running costs.** The in-page "AI assistant" (Anthropic API
  key) mode is **removed**. There is no free way for a public web page to call
  Claude live for someone who isn't logged in, so Claude's work is done *in
  advance*: researched, written and tested in Claude Code sessions, then built
  into the page. On the phone it is instant, offline, needs no login.
- **Fluid, one window.** The assistant is a single chat box. Answers show the
  handbook passage inside the chat ("peek") instead of sending him off to
  another part of the app or opening tabs.
- **Accessible from the GitHub Pages link alone.** No login, no account, no
  third-party service at run time.
- **No CI checks for now** (owner's call, to move fast). Before each merge, at
  least load the page in a headless browser and confirm there are no script
  errors and the chat answers.
- **Kit focus:** d&b audiotechnik, Neutrik NL4 / NLT4, Yamaha DM7, "techniks"
  (owner to confirm the brand — possibly Technics or a typo for another brand)
  and other premium brands. A detailed product list comes in the next upgrade.

## Where things live (all in `index.html`)

| What | Where (search for) |
| --- | --- |
| Handbook sections | `<section class="s" id="sX-Y">` inside `<div class="part" id="pX">` |
| Section search index | `var sectionIndex` / `indexEntry()` |
| Fault-finder chat | `/* ---------- fault finder chat` |
| Guided routes | `var FLOWS = [` (each `{id, kind, title, words, nodes}`) |
| Typo/synonym handling | `var SYNONYMS`, `VOCAB`, `norm()` |
| Book search used by chat | `function searchBook(` |
| Glossary | `#s20-1 .glossary` |
| d&b model tables (chat reads them) | §6.20, `buildModels()` |
| Answer bank (new) | `var ANSWERS = [` |
| Offline caching | `sw.js` |

## Phase 1 — fixes and foundations

- [x] `sw.js`: "Use previous version" is overwritten on every online load — only
      snapshot when the downloaded page actually differs.
- [x] `sw.js`: never cache a non-OK response (a 404/500 must not replace the
      offline copy).
- [x] README: explain the structure and how to add a section, route or answer.

## Phase 2 — one fluid assistant

- [x] Remove the API-key mode: mode switch, key setup panel, SDK loading,
      photo button, `sendAi`, related CSS and the service-worker comment.
- [x] In-chat "peek": section links in chat open the passage inside the chat,
      with an option to open it in the library.
- [x] Smarter book search: apply the same typo correction and synonyms as the
      routes, match word endings (crackling → crackle), weight titles, rank by
      BM25 instead of raw counts.
- [x] Answer bank (125 entries so far; grow it — see `var ANSWERS`): several hundred common questions with direct, checked
      answers taken from the handbook, matched offline.
- [x] New guided routes where they're missing (e.g. console no output, IEM
      problems, corporate presenter-mic check, DM7-specific checks).

## Phase 3 — expand the handbook with research

Each new or expanded section ends with a short "Sources, checked <month year>"
note. Anything model- or firmware-specific that can't be confirmed is flagged,
not guessed. Each new section also adds answer-bank entries.

- [x] Yamaha DM7 — layout, patching, scenes/show files, Dante, common traps.
- [x] Other premium desks he may meet (DiGiCo, Allen & Heath dLive/Avantis,
      Yamaha CL/QL/RIVAGE).
- [x] Wireless systems (Shure, Sennheiser) step by step + current Ofcom
      licensing.
- [x] Dante in depth — Controller step by step, clocking, redundancy, switch
      settings; intro to Milan/AVB.
- [~] Other premium PA brands — L-Acoustics done (§6.21); Meyer and others
      wait for the owner's stock list. (L-Acoustics, Meyer) to the same depth as d&b
      once the owner confirms stock.
- [x] Measurement — Open Sound Meter (free) and Smaart basics.
- [x] Corporate AV / hybrid — presenter mics, conference systems, video-call
      audio.
- [x] Safety refresh — added §13.16 Martyn's Law (in force spring 2027) and
      §13.17 BS 7909:2023+A1:2024 temporary power. Older Part 13 sections not
      re-audited line by line yet.

## Phase 4 — optional, only if search is still missing questions

- [ ] On-device meaning-based search (small embedding model, self-hosted,
      cached offline). Ruled out: a full chatbot on the phone (huge download,
      can invent safety advice) and "free" keys from other AI providers (the key
      would be public in the page).

## Progress log

Add a line per pushed chunk of work: date — what changed — what's next.

- 2026-11-12 — Plan written. Starting Phase 1.
- 2026-11-12 — sw.js fixes, API-key mode removed (stored key now wiped on load), in-chat peek added. Next: smarter search + answer bank.
- 2026-11-12 — BM25 search with synonyms/stemming and a relevance cut-off; answer bank engine + 125 answers. Next: new guided routes, then Phase 3 research.
- 2026-11-12 — 12 researched sections (§5.11–5.12, §6.21, §7.8–7.10, §8.9–8.11, §10.11, §13.16–13.17), 4 new routes (desk no output, IEM, DM7 setup, presenter mics), 17 more answers (142 total), intent fixes. Next: README, then merge.
- 2026-11-12 — README rewritten. Full-page browser check passed (all screens, contents, starters, cross-route jumps, no script errors). Merged for review.

## Next session (tomorrow's upgrade)

- Owner supplies the detailed product list. Then: model-level guides for each
  product (same depth as d&b), answer-bank entries and routes for them.
- Confirm what "techniks" refers to before writing anything about it.
- Meyer Sound / other PA brands if they're in the stock.
- Grow the answer bank towards several hundred entries; re-audit Part 13
  line by line.
- Phase 4 only if real questions are still being missed.
