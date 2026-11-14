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

## Where things live (source in `src/`, built into `index.html`)

Since round 9 the source is split into pieces under `src/` and joined by
`node build.js` into the same single `index.html` (byte-identical to before the
split). **Edit `src/`, never `index.html`, then run `node build.js`.**

| What | File · search for |
| --- | --- |
| Handbook sections | `src/parts/pPP.html` · `<section class="s" id="sX-Y">` |
| App screens | `src/screens/*.html` |
| Styles | `src/styles.css` |
| Section search index | `src/js/app.js` · `var sectionIndex` / `indexEntry()` |
| Fault-finder chat | `src/js/chat.js` |
| Guided routes | `src/js/chat-routes.js` · `var FLOWS = [` |
| Answer bank | `src/js/chat-answers.js` · `var ANSWERS = [` |
| Typo/synonym handling | `src/js/chat.js` · `var SYNONYMS`, `VOCAB`, `norm()` |
| Book search used by chat | `src/js/chat.js` · `function searchBook(` |
| Glossary | `src/parts/p20.html` · `#s20-1 .glossary` |
| d&b model tables (chat reads them) | `src/parts/p06.html` §6.20, `buildModels()` |
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

### Round 8 log (2026-11-12)

- Asked the chat all ~1,250 answer phrasings (`tests/check-answers.js`):
  83% → 85% exact answer, 13% go to a guided route (usually right for faults),
  the rest are mostly sibling answers or d&b model-table answers.
- Fixes: safety questions get the safety note *and* the answer; a strong
  written answer beats a tie between routes; six overview answers stopped
  claiming specific questions (input list, stage plot, measurement mic,
  Avantis/DiGiCo snapshot, stream mix, other careers).
- Chat cases 81, all passing.

## Round 9 — answer harder, in-depth questions (2026-11-13)

**Why.** 40 realistic in-depth questions the answer bank wasn't written for
(saved as `tests/probe-cases.txt` from step 1): 10 good, 12 partly useful, 18
wrong or unhelpful — even where the book holds the answer (Arc vs Line in §6.20,
power alley in §6.6, antenna spacing via the RF calculator). Causes: the wrong
layer answers first (kit offer fires on questions; the d&b set-up route grabs any
question with "sub/PA/amp"; a model's info card answers whatever the question
was about the model), search returns whole sections instead of the passage that
answers, no sense of question type, some facts missing, misses not learnt from.

**Owner's decisions:** split the source (done); no monthly scheduled re-check;
don't wait for the kit list.

- [x] 0. Split the source into `src/` + `build.js` (output byte-identical).
- [x] 1. Scoring set + routing fixes. Graded probe set by topic (must contain /
      must not contain; safety cases must keep their warning) with a scorer.
      Fix: kit offer only for statements; narrow the set-up route's words; a
      model card only when the model is the topic. Target: probe ≥ 20/40 good,
      existing tests stay green.
- [x] 2. Answers built from passages. Passage index (paragraphs, steps, term
      lines, table rows with their headings, notes) built on first question.
      Question types: what is / how do I / difference / why / how many / can I.
      Reply = best 2–4 passages with § citations; "Go deeper" and "Why?";
      warnings attached to a passage always travel with it; one clarifying
      question when unsure; honest "not sure" below a confidence floor.
      Target: probe ≥ 30/40.
- [x] 3. d&b facts as data (setups, functions, boxes per channel per amp,
      lights and messages per amp — from d&b manuals) + job calculators (amps per
      16/32 A supply, voltage drop, fill/delay from positions, cardioid/end-fire
      spacing, headroom against a noise limit).
- [ ] 4. Learn from misses: "Not what I asked" and low-confidence questions
      saved on the phone with a "send these" button; per-section likely-question
      gap finder.
- [ ] 5. Worked playbooks (conference on E-Series + D20, breakout T10 + desk,
      awards dinner on DM7, small outdoor stage) and diagrams shown in chat;
      job-aware answers ("what next?", "test plan for tomorrow").
- [ ] 6. Quiz me (spaced repetition on unticked Pathway skills); voice (dictation
      in, read-aloud out — both offline on iPhone).
- [ ] 7. Meaning-based search only if the probe score says it's needed.

### Round 9 log

- 2026-11-13 — Source split into `src/` (37 files) with `build.js`; rebuilt
  `index.html` byte-identical. README and this map updated.
- 2026-11-13 — Probe set `tests/probe-cases.txt` (50 harder questions by topic)
  and `tests/check-probes.js`. Baseline 21/50.
- 2026-11-13 — Routing: kit offer only for statements; d&b set-up route only on
  d&b set-up words; a model's card only when the model is the subject;
  "how do I fix…" and fault words (noise, muffled, feeding back, distorted…)
  go to fault routes; "fire exit" no longer triggers the emergency stop;
  "power alley" is not mains power; glossary names only split on " / ".
- 2026-11-13 — Passage answers: every section cut into ~passages (paragraphs,
  steps, term lines, table rows with headings, notes), ranked with BM25 +
  section relevance + question type; replies show the best passages with
  where they're from, keep a related "Watch it" note, offer "Go deeper" and
  "Why?", and say "Closest I have" when unsure. Knowledge questions go to a
  close written answer, then the book, before a weakly matched route.
  "Not what I asked" and low-confidence questions are kept on the phone
  (`treebysound-missed-questions`). Book words are protected from typo
  correction ("alley" ≠ "Allen"). 7 new answers (comb filtering, polarity by
  ear, Dual Channel vs Mix TOP/SUB, fan noise in a lectern mic, muffled
  presenter, speech level, a box used as a wedge).
- Results: probe 21 → 41/50; answer phrasings 85% → 93% exact; chat cases
  90/90; content check clean; axe 0 violations; first answer ≤ 0.9 s on a 4×
  slowed CPU if asked straight after opening (index then built), later ~10 ms.
- 2026-11-13 — Job sums in the chat: fill/delay time from two distances,
  end-fire per-row delay, cardioid reversed-sub delay and polarity, voltage
  drop on a cable run (BS 7671 mV/A/m, 5% guide), speaker-cable loss and
  headroom under a noise limit. Unsure answers now ask "which is it closest
  to?" with up to three sections. Off-topic chapters (lighting, video,
  career) are down-weighted unless the question is about them. Low-confidence
  replies no longer show a guessed snippet: they say so, keep the question
  and link the closest sections. "Questions I couldn't answer (n)" chip in the
  menu shows the kept list with Copy / Clear. 4 new answers (amp protect on
  sub hits, boomy sub at the back, sub distorted at low level, breakout room
  with a T10 and a QL1). Fixed a route's delayed auto-answer firing after the
  chat was reset.
- Held-out set `tests/probe-holdout.txt` (30 questions, run with
  `--file probe-holdout.txt`). **Never tune answers to these** — they check
  the chat on questions nobody wrote answers for. Fix the engine or the book,
  then re-run.
- Results: probe 43/50; held-out 22/30 (was 23 — "subs in a long narrow room"
  previously passed on a guessed snippet that now honestly says it has no
  direct answer); phrasings 93%; chat cases 97/97.
  Held-out misses point at engine/content gaps, not answers to write:
  setup-route ties for "how do I…" on DM7/RF, fault route asking a question
  instead of answering ("D80 over temperature"), conference speaker height,
  sub placement in long rooms, qualifications. Also weak passages that the
  lenient grader still counts (ear protection → theatre, impedance → invoicing).
- 2026-11-13 — d&b facts from d&b's own manuals (downloaded from dbaudio.com):
  new §6.24 with boxes per amp channel for 25 box families (E4/E5, E6, E8,
  E12, E15X-SUB, 8S, 10S, 12S, 24S, 44S, T10, T-SUB, Y7P/Y10P, Y8/Y12, Y-SUB,
  B4/B6-SUB, V7P/V10P, V8/V12, V-SUB, AL60/AL90, CCL, KSL, M4/M6, MAX2), the
  amps' impedance rule (4 Ω → 1 … 20 Ω → 5) and every D20/D80 screen message
  with what to do. The chat reads both tables from the page: "how many E8 on
  a D20 channel" → 3 (4 on a D80), "can I put 4 E12 on a D80 channel" → No, 2;
  "the amp says Speaker imp. fault" / "D80 over temperature warning" → the
  message, its cause and the steps. §6.17's red-light row corrected to the
  manual (OVL = over –2 dBFS, 12 dB+ limiting or current limiting).
- Results: probe 45/50; held-out 23/30 (the D80 over-temperature question now
  passes through the messages table — written from the manual for every
  message, not for that question); chat cases 103/103; phrasings 93%.
- 2026-11-13 — "How do I set up talkback on the DM7?" answers the talkback part
  (from an answer or the book) and offers the DM7 walkthrough as a chip, instead
  of starting the whole route. §6.6 gains speaker height on stands for speech
  and subs in a long, narrow room. New answers: one box quieter than its pair;
  what qualifications an audio technician needs (no longer caught by the
  coaching reply). The §6.24 tables only count for amp questions.
- Held-out rotation: the three held-out questions whose topics were then
  written into the book (speaker height, long-room subs, qualifications) moved
  to the tuned set; three fresh ones written before seeing any answer (mains
  cable under carpet, radio mic battery dies mid-speech, two Dante clock
  leaders). Do this every time a held-out topic gets written up.
- Results: tuned probe 49/54; held-out 25/30; chat cases 104/104; phrasings
  92% (1212/1310); 0 accessibility violations.
- Next: step 4 (per-section gap finder), then playbooks (conference on
  E-Series + D20, awards dinner on DM7) and job-aware answers.
