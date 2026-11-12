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

## Round 2 — design review and "more everything" (2026-11-12)

**Design decision: no full redesign.** The visual system (warm paper palette,
type, cards, notes) and content structure hold up. What didn't fit the new
additions was *function and placement*, so targeted changes:

- [x] Chat gets its own **Ask** screen and bottom-bar tab (centre, accented):
      full-height, input pinned above the bar and above the keyboard
      (`sizeAsk()`), no "top" button over it. Support keeps a link to it;
      every old `#support-chat` link now points to `#ask`.
- [x] Home: the ask box is the first thing in the Home card; the masthead's
      standfirst is hidden on phones so the box sits above the fold.
- [x] Screen headings reserve room for the floating refresh/settings buttons.
- [x] Chat chrome compacted (one-line status bar, short disclaimer).
- [x] Chat remembers the conversation across app restarts (iOS kills
      backgrounded PWAs).
- [x] Chat does the maths: delay/distance, SPL over distance, dB ratios,
      dBu/volts, antenna lengths — typed as questions.
- [x] Chat offers related answers and "tell me more".
- [x] More guided routes: one side of the PA missing, input distortion,
      comms down, playback/laptop problems, hearing loop, recording/stream
      with no audio, wedge feedback.
- [x] Answer bank: 250 entries (target 300+ as the product list arrives).
- [x] More researched content: §6.22 d&b R1 step by step, §8.12 comms, §8.13 reliable laptop playback.

### Round 2 log

- 2026-11-12 — Ask screen; Home ask-first; headings clear of floating buttons;
  chat memory (12 h), plain-words calculators, related answers, "tell me more";
  7 new routes (side missing, clipping, can't hear themselves, comms, playback,
  hearing loop, recording/stream); answer bank 142 → 256; routing fixes
  ("X not working" follows the thing named, strong answers beat weak route
  matches, "set up" kept as one term); §6.22 R1, §8.12 comms, §8.13 playback;
  `tests/check-chat.js` (53 cases, all passing). Checked at iPhone size, desktop
  and low-light.

### Still open after round 2

- Product-specific guides once the kit list arrives; confirm "techniks".
- [x] Part 13 re-audited (Nov 2026): peak noise values, PPE for workers (2022), opt-out notice, holiday (12.07%), SSP from day one (Apr 2026), zero-hours rights (Apr 2027), under-18 limits. Meyer/other PA brands still wait on stock list.
- Library reading bar is still tight on narrow phones next to the floating
  buttons — consider moving refresh/settings into the bar when reading.

### Round 3 log (2026-11-12)

- Reading a part on a phone: settings move into the reading bar, so the title
  has room (floating buttons hide while reading).
- Part 13 re-audited against current law (see checklist above).
- Answer bank 256 → 301; every handbook section except the checklists, glossary
  and tooling now has at least one answer pointing to it. "§x.y" in answers
  becomes a link that opens the section in the chat.
- Test set 53 → 61 cases, all passing.

### Round 4 log (2026-11-12)

- New sections (sources checked Nov 2026): §6.23 Martin Audio and Meyer Sound,
  §7.11 DiGiCo quick start, §7.12 Allen & Heath dLive/Avantis quick start.
- Pathway technician ladder 18 → 23 skills (comms, DM7 show from blank,
  reliable playback, Dante Controller, second PA brand). New items were
  appended at the end of each list because ticks are stored by position.
- Answer bank 307 → 312; test set 65 cases, all passing.

### Round 5 log (2026-11-12) — "he hasn't ticked anything yet"

- No ticks saved anywhere yet, so checklists were rewritten freely (reordering
  is safe now; once he starts ticking, only append — ticks are stored by
  position).
- Every Part 19 checklist made more thorough, each item linked to its section;
  corporate (§19.18) and theatre (§19.19) now tickable; six new lists:
  §19.20 network & Dante, §19.21 any mixing desk, §19.22 comms & playback,
  §19.23 fault kit, §19.24 festival changeover, §19.25 end-of-job handover.
  263 tickable items in total.
- Eight new sections: §2.12 meters & dBFS, §3.13 testing cables, §4.9 mic
  cheat sheet, §11.10 handing over to the engineer, §12.19 following the
  signal with tone, §14.14 stream audio, §15.13 safe IEM levels, §16.11 mixing
  speech.
- Back-to-top button is a small round arrow on phones (it covered text).
- `tests/check-content.js` added; 317 answers, 72 chat cases, all passing.

### Round 6 log (2026-11-12)

- Glossary 230 → 287 terms (dBFS-era, desks, PA brands, networks, comms,
  measurement, law); the chat answers "what is X" from these.
- Typo handling: real words used by the glossary and answers are never
  "corrected" (coherence ≠ conference); unknown words snap to the book's
  nearest word when one letter off (phantom powr → power), nonsense still
  finds nothing. Radio-mic phrasing routes to the RF route.
- Pocket reference: delay per metre, d&b lights, UK radio licences, Dante
  rules, noise at work, your hours.
- Chat cases 77, all passing; content check clean.

### Round 7 log (2026-11-12)

- Accessibility: axe-core audit of every screen and part, 0 violations
  (2,000+ were term/definition lists not in a <dl>; also contrast, keyboard
  access to flow diagrams, empty table headers, a heading level).
  `tests/check-a11y.js` keeps it there.
- Home "First time here?" card: home screen install, ask one question (one-tap
  "Try one"), tick one Pathway skill — each ticks itself off; hides when done
  or dismissed.
- Speed (4× slowed CPU, phone size): ready in ~0.75 s, first answer ~0.6 s,
  later answers ~0.1 s. No change needed.
