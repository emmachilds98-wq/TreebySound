/* ---------- fault finder chat (Support → Talk it through) ----------
   A set of symptom flows written into this page. It matches what the
   person types against each flow's words, then asks one question at a time and
   points at the check and the section. No network, ever — it works in a
   basement with no signal, like the rest of the book.
   An offline answer bank and the book's own search cover questions that
   aren't faults. There is no online mode: nothing typed here leaves the phone. */
(function(){
  var box = document.getElementById('faultChat');
  if(!box) return;
  var log = document.getElementById('chatLog');
  var chips = document.getElementById('chatChips');
  var form = document.getElementById('chatForm');
  var input = document.getElementById('chatInput');
  var sendBtn = document.getElementById('chatSend');
  var resetBtn = document.getElementById('chatReset');

  /* The online AI mode (and the API key it needed) has been removed. Clear
     anything it left on this device so a backup never carries an old key. */
  storeRemove('treebysound-anthropic-key');
  storeRemove('treebysound-chat-mode');

  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function plain(html){ var d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* ---- the guided flows ----
     Each node: q (what the fault finder says — trusted HTML), k (a short label
     for the report), opts ([label, next]), links ([href, label]), end (a
     resolution: offer "fixed" / "still stuck"). A next of "flow:node" jumps
     into another flow, so shared checks are only written once. */
  var LOCK = 'Mute first, then at <em>both</em> ends: push the speakON fully in and twist clockwise until it clicks. A tug on the connector body shouldn\'t move it.';
//#include js/chat-routes.js
  var FLOW_BY_ID = {};
  FLOWS.forEach(function(f){ FLOW_BY_ID[f.id] = f; });
  var FIX_STARTERS = ['box','sub','crackle','limit','r1','all','side','desk','clip','hum','mic','feedback','wedge','rf','iem','dante','power'];
  var OTHER_STARTERS = ['comms','playback','loop','record'];
  var ADV_STARTERS = ['array','cardioid','phasey','digital','loading','noise'];
  var SETUP_STARTERS = ['setup','dm7','presenter','nl4','setupother'];
  var INFO_HINTS = ['What amp does a V8 need?','Can a D20 run KSL?','D40 vs D80','What is Mix TOP/SUB?','What does GR mean?','NL4 vs NLT4'];
  var INFO_INTENT = /^(what|whats|what's|which|who|why|when|where|explain|define|definition|meaning|tell me|difference|is there|is it|are|does|do i need|can i|should i|how much|how many|how long|how loud)\b|\b(mean|means|stand for|stands for|difference between|vs|versus|cost|price|fee|legal|checklist|check list|tips|guide)\b|^(is|are|can|could)\b.*\b(dangerous|safe|legal|ok|okay|allowed|necessary|needed|required|normal|bad)\b|\?$/i;
  var SETUP_INTENT = /\b(set ?up|setting up|configure|configuring|install|connect(ing)?|how (do|to|should) i|how to|walk me through|step by step|get .* working|patch)\b/i;
  var DANGER = /\b(smoke|smoking|burning|burnt smell|fire(?! (exit|exits|door|doors|escape|route|routes|alarm test|marshal|marshals|extinguisher|extinguishers|safety|risk|regs|regulations|order|assessment|strategy|plan))|flames?|sparks?|sparking|shock(ed)?|electrocut\w*|injur\w*|hurt|bleeding|falling|fell|collapsed?|swaying)\b/i;

  /* ---- conversation window ---- */
  /* Scroll on the next frame: measuring the log straight away forced a layout
     of the whole page, including at start-up when the greeting is added. */
  function scrollDown(){
    cancelAnimationFrame(scrollDown.raf);
    scrollDown.raf = requestAnimationFrame(function(){ log.scrollTop = log.scrollHeight; });
  }
  function addMsg(who, html, cls){
    var m = document.createElement('div');
    m.className = 'chat-msg ' + who + (cls ? ' ' + cls : '');
    m.innerHTML = html;
    log.appendChild(m);
    scrollDown();
    saveSoon();
    return m;
  }
  /* The conversation is kept on this phone for 12 hours, so switching apps
     (which on an iPhone often closes this one) doesn't lose it. Only the
     words on screen are kept — never sent anywhere. */
  var LOG_STORE = 'treebysound-chat-log';
  function saveSoon(){
    clearTimeout(saveSoon.t);
    saveSoon.t = setTimeout(function(){
      var msgs = log.querySelectorAll('.chat-msg');
      if(msgs.length < 2){ storeRemove(LOG_STORE); return; }
      var keep = Array.prototype.slice.call(msgs, -60).map(function(n){ return n.outerHTML; }).join('');
      if(keep.length > 400000) keep = keep.slice(-400000).replace(/^[\s\S]*?(?=<div class="chat-msg)/, '');
      storeSet(LOG_STORE, JSON.stringify({t: Date.now(), html: keep, slots: g.slots, symptom: g.symptom}));
    }, 400);
  }
  function restoreLog(){
    try{
      var saved = JSON.parse(storeGet(LOG_STORE) || 'null');
      if(!saved || !saved.html || Date.now() - saved.t > 12 * 3600 * 1000) return false;
      log.innerHTML = saved.html;
      Array.prototype.forEach.call(log.querySelectorAll('.typing'), function(n){ n.classList.remove('typing'); });
      g.slots = saved.slots || {};
      g.symptom = saved.symptom || '';
      addMsg('bot', 'Carrying on from earlier — or tap Start over.', 'note');
      return true;
    }catch(e){ return false; }
  }
  function addLinks(m, links){
    if(!links || !links.length) return;
    var row = document.createElement('div');
    row.className = 'chat-links';
    links.forEach(function(l){
      var a = document.createElement('a');
      a.href = l[0];
      a.innerHTML = l[1] + ' →';
      row.appendChild(a);
    });
    m.appendChild(row);
    scrollDown();
  }
  var currentChips = [];
  function setChips(list){
    chips.innerHTML = '';
    currentChips = list;
    list.forEach(function(c){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip' + (c.quiet ? ' quiet' : '');
      b.textContent = c.label;
      b.addEventListener('click', function(){ setChips([]); c.go(); });
      chips.appendChild(b);
    });
  }


  /* ---- peek: read a section without leaving the conversation ----
     A link to a book section from inside the chat opens that section here,
     in the conversation, instead of switching screens — he reads it and
     carries on where he was. "Open in the library" still goes to the page. */
  var SECTION_LINK = /^#s\d+-\d+$/;
  function peek(id){
    var sec = document.getElementById(id);
    if(!sec) return false;
    var clone = sec.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.notefield, script, .next-part'), function(n){ n.remove(); });
    Array.prototype.forEach.call(clone.querySelectorAll('[id]'), function(n){ n.removeAttribute('id'); });
    clone.removeAttribute('id');
    Array.prototype.forEach.call(clone.querySelectorAll('input, select, textarea, button'), function(n){ n.disabled = true; });
    var m = addMsg('bot', '', 'peek');
    var body = document.createElement('div');
    body.className = 'chat-peek-body';
    while(clone.firstChild) body.appendChild(clone.firstChild);
    m.appendChild(body);
    var tools = document.createElement('div');
    tools.className = 'chat-peek-tools';
    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'peek-more';
    more.textContent = 'Show the whole section';
    var go = document.createElement('a');
    go.href = '#' + id;
    go.setAttribute('data-nopeek', '');
    go.textContent = 'Open in the library →';
    tools.appendChild(more); tools.appendChild(go);
    m.appendChild(tools);
    requestAnimationFrame(function(){
      if(body.scrollHeight <= body.clientHeight + 4){ body.classList.add('open'); more.remove(); }
      m.scrollIntoView({block:'start', behavior:'smooth'});
    });
    return true;
  }
  log.addEventListener('click', function(ev){
    var more = ev.target.closest && ev.target.closest('.peek-more');
    if(more){
      var pm = more.closest('.chat-msg'), pb = pm && pm.querySelector('.chat-peek-body');
      if(pb){
        var open = pb.classList.toggle('open');
        more.textContent = open ? 'Show less' : 'Show the whole section';
        if(!open) pm.scrollIntoView({block:'nearest'});
        saveSoon();
      }
      return;
    }
    var a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if(!a || !log.contains(a) || a.hasAttribute('data-nopeek')) return;
    var href = a.getAttribute('href');
    if(!SECTION_LINK.test(href)) return;
    if(ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    if(peek(href.slice(1))) ev.preventDefault();
  });


  /* ---- the Ask screen fills whatever is visible ----
     Sized from the real visible area, so the typing box sits just above the
     bottom bar — and just above the keyboard while it's open. */
  function sizeAsk(){
    if(document.body.getAttribute('data-screen') !== 'ask' || !box.closest('.ask-screen')) return;
    var vv = window.visualViewport;
    var vh = vv ? vv.height : window.innerHeight;
    var bar = document.getElementById('bottombar');
    var keyboard = vv && vv.height < window.innerHeight - 120;
    var below = (!keyboard && bar && getComputedStyle(bar).display !== 'none') ? bar.offsetHeight : 0;
    var top = box.getBoundingClientRect().top - (vv ? vv.offsetTop : 0);
    if(window.matchMedia && !window.matchMedia('(max-width:820px)').matches){ box.style.height = ''; return; }
    box.style.height = Math.max(300, Math.floor(vh - Math.max(top, 0) - below - 10)) + 'px';
    scrollDown();
  }
  window.addEventListener('resize', sizeAsk);
  if(window.visualViewport) window.visualViewport.addEventListener('resize', sizeAsk);
  window.addEventListener('hashchange', function(){ setTimeout(sizeAsk, 80); });
  window.tbSizeAsk = sizeAsk;

  /* ---- guided mode state ---- */
  var g = {flow:null, node:null, steps:[], symptom:'', slots:{}, trail:[], models:[], queue:[], lastQ:'', test:null};

  /* ---- understanding what was typed ----
     Everything typed is normalised the same way as the routes' own words:
     lower-cased, common synonyms folded together ("cab", "loudspeaker" → speaker;
     "no sound", "dead" → silent), and small typos forgiven, so "spekaer crakling"
     still lands on the right route. */
  var SYNONYMS = [
    [/\bpower alley\b/g, 'poweralley'],
    [/\b(d ?& ?b|d and b|dnb|db audiotechnik|d&b audiotechnik)\b/g, 'd&b'],
    [/\b(cabs?|cabinets?|loudspeakers?|speakers)\b/g, 'speaker'],
    [/\b(subwoofers?|subs|bass bins?)\b/g, 'sub'],
    [/\b(no (sound|audio|output|noise)|not making (any )?(sound|noise)|nothing (coming )?out|gone (quiet|silent)|dead)\b/g, 'silent'],
    [/\b(crackl\w*|crunch\w*|scratch\w*|spitting)\b/g, 'crackle'],
    [/\b(distort\w*|fuzzy|breaking up|clipp\w*)\b/g, 'distorted'],
    [/\bspeak ?on\b/g, 'speakon'], [/\bnl ?4\b/g, 'nl4'], [/\bnlt ?4\b/g, 'nlt4'], [/\bnl ?8\b/g, 'nl8'], [/\bnl ?2\b/g, 'nl2'],
    [/\b(two|2) ?-? ?core\b/g, '2-core'], [/\b(four|4) ?-? ?core\b/g, '4-core'],
    [/\b(isn't|isnt|is not)\b/g, 'isn'], [/\b(won't|wont|will not)\b/g, 'won\'t'], [/\b(can't|cant|cannot)\b/g, 'can\'t']
  ];
  /* Misspellings are corrected against the words the routes actually use
     (plus the everyday kit words) before anything else, so a typo'd word
     can still hit a synonym or a route. */
  var VOCAB = {};
  'speaker speakers cabinet loudspeaker subwoofer cable cables channel channels amplifier amps silent crackle crackling crackly distorted distortion feedback howling wireless microphone phantom console network dante limiting limiter overload temperature connector intermittent buzzing humming tripping breaker powercon speakon multicore stagebox receiver transmitter dropouts quiet nothing working output input signal yellow muted remote laptop setting configure install'.split(' ').forEach(function(w){ VOCAB[w] = true; });
  function correct(tok){
    if(tok.length < 5 || VOCAB[tok] || /[^a-z]/.test(tok)) return tok;
    var allow = tok.length >= 8 ? 2 : 1, best = tok, bestD = allow + 1;
    Object.keys(VOCAB).forEach(function(w){
      var d = editDistance(tok, w);
      if(d < bestD){ bestD = d; best = w; }
    });
    return best;
  }
  function norm(text, raw){
    var t = String(text).toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[^a-z0-9&'+\-\/ ]+/g, ' ');
    if(!raw) t = t.split(/\s+/).map(correct).join(' ');
    t = ' ' + t + ' ';
    SYNONYMS.forEach(function(r){ t = t.replace(r[0], r[1]); });
    return t.replace(/\s+/g, ' ');
  }
  function editDistance(a, b){
    if(Math.abs(a.length - b.length) > 2) return 3;
    var prev = [], cur, i, j;
    for(j = 0; j <= b.length; j++) prev[j] = j;
    for(i = 1; i <= a.length; i++){
      cur = [i];
      for(j = 1; j <= b.length; j++){
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }
  function hasWord(t, w, tokens){
    if(w.length <= 3) return t.indexOf(' ' + w + ' ') > -1 || t.indexOf(' ' + w + 's ') > -1;
    if(t.indexOf(w) > -1) return true;
    if(w.indexOf(' ') > -1 || w.length < 5 || /\d/.test(w)) return false;
    var allow = w.length >= 8 ? 2 : 1;
    return tokens.some(function(tok){ return tok.length >= 4 && !/\d/.test(tok) && editDistance(tok, w) <= allow; });
  }
  FLOWS.forEach(function(f){ f.words.forEach(function(w){ w.split(' ').forEach(function(x){ if(/^[a-z]{5,}$/.test(x)) VOCAB[x] = true; }); }); });
  FLOWS.forEach(function(f){
    f.nwords = f.words.map(function(w){ return norm(w, true).trim(); }).filter(function(w, i, all){ return all.indexOf(w) === i; });
    if(f.entries) Object.keys(f.entries).forEach(function(id){ f.entries[id] = f.entries[id].map(function(w){ return norm(w, true).trim(); }); });
  });

  /* Details people give without being asked — which amp, which channel, what
     mode, what cable, what the lights show. Kept for the whole conversation,
     used to skip questions that are already answered, and put in the report. */
  function readSlots(text){
    var t = norm(text), sl = {}, m;
    if((m = /\b(d6|d12|d20|d40|d80|d90|5d|10d|30d|40d)\b/.exec(t))) sl.amp = m[1].toUpperCase();
    if((m = /\b(?:channel|chan|ch|output|out)\s*([a-d])\b/.exec(t))) sl.channel = m[1].toUpperCase();
    if((m = /\bamp\s*(?:no\.?\s*|number\s*)?(\d{1,2})\b/.exec(t))) sl.ampNo = m[1];
    if(/mix ?top ?\/? ?sub|top ?\/ ?sub/.test(t)) sl.mode = 'Mix TOP/SUB';
    else if(/\b(2|two) ?-? ?way\b/.test(t)) sl.mode = '2-Way Active';
    else if(/dual ?channel/.test(t)) sl.mode = 'Dual Channel';
    if(/\b2-core\b|\bnl2\b/.test(t)) sl.cable = '2-core';
    else if(/\b4-core\b/.test(t)) sl.cable = '4-core';
    if(/\bno (green|signal|input)\b|not getting (any )?signal/.test(t)) sl.light = 'none';
    else if(/\b(green|isp|osp)\b|signal present/.test(t)) sl.light = 'green';
    if(/\b(yellow|amber|gr)\b|gain reduction|limit(ing|er)/.test(t)) sl.light = 'yellow';
    if(/\b(red|ovl)\b/.test(t)) sl.light = 'red';
    if(/\bmuted?\b/.test(t)) sl.muted = true;
    if(/\b(overload\w*|ovl|too hot)\b/.test(t)) sl.overload = true;
    if(/\b(error|warning|temperature|overheat\w*)\b/.test(t)) sl.error = true;
    return sl;
  }

  /* ---- d&b model knowledge ----
     Read from the two tables in §6.20, so the book and the chat can never
     disagree. Every model name in a row's data-models becomes something the
     chat recognises in what's typed, with or without hyphens and spaces. */
  var MODELS = null, MODEL_LIST = [];
  var NO_MATCH = {A1:true, MAX:true};
  /* Verified exclusions (d&b product pages): the setups these amps don't have. */
  var NOT_ON = {
    D20: /^(J8|J12|J-SUB|J-INFRA|M2|KSL|XSL|GSL|SL-)/,
    D40: /^(GSL|SL-SUB|SL-GSUB|J8|J12|J-SUB|J-INFRA|M2)$|^GSL/
  };
  function cellText(td){ return td ? (td.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function buildModels(){
    if(MODELS) return MODELS;
    MODELS = {};
    Array.prototype.forEach.call(document.querySelectorAll('table.db-models'), function(table){
      var kind = table.getAttribute('data-kind');
      Array.prototype.forEach.call(table.querySelectorAll('tbody tr[data-models]'), function(tr){
        var td = tr.querySelectorAll('td');
        var row = kind === 'amp'
          ? {kind:'amp', status:cellText(td[1]), power:cellText(td[2]), inputs:cellText(td[3]), drives:cellText(td[4])}
          : {kind:'speaker', range:tr.getAttribute('data-range') || cellText(td[0]), models:cellText(td[1]), what:cellText(td[2]), driven:cellText(td[3])};
        row.names = tr.getAttribute('data-models').split(',').map(function(x){ return x.trim(); });
        tr.getAttribute('data-models').split(',').forEach(function(name){
          name = name.trim();
          var entry = {name:name, row:row};
          MODELS[name.toUpperCase()] = entry;
          if(NO_MATCH[name]) return;
          var pat = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[\\s-]?');
          MODEL_LIST.push({entry:entry, re:new RegExp('(^|[^a-z0-9])' + pat + '(?:s)?(?![a-z0-9])', 'i')});
        });
        if(kind === 'speaker'){
          /* the range on its own too: "KSL", "V-Series", "V series", "CCL" */
          var range = row.range, m = /\(([^)]+)\)/.exec(range), aliases = [];
          if(m) aliases.push(m[1]);
          var base = range.replace(/\s*\(.*\)/, '');
          aliases.push(base);
          var lead = /^([A-Za-z]+)-Series$/.exec(base);
          if(lead) aliases.push(lead[1] + ' series', lead[1] + '-series', lead[1] + 'series');
          aliases.forEach(function(a){
            var pat = a.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[\s-]+/g, '[\\s-]?');
            MODEL_LIST.push({entry:{name:a, row:row, range:true}, re:new RegExp('(^|[^a-z0-9])' + pat + '(?![a-z0-9])', 'i')});
          });
        }
      });
    });
    /* longest names first, so "V-GSUB" wins over "V" family matches */
    MODEL_LIST.sort(function(a, b){ return b.entry.name.length - a.entry.name.length; });
    return MODELS;
  }
  function findModels(text){
    buildModels();
    var t = String(text), found = [], taken = [];
    MODEL_LIST.forEach(function(mm){
      var m = mm.re.exec(t);
      if(!m) return;
      var start = m.index + m[1].length, end = start + m[0].length - m[1].length;
      if(taken.some(function(r){ return start < r[1] && end > r[0]; })) return;
      taken.push([start, end]);
      found.push({entry:mm.entry, at:start});
    });
    found.sort(function(a, b){ return a.at - b.at; });
    return found.map(function(f){ return f.entry; });
  }
  function modelCard(e){
    var r = e.row, h;
    if(r.kind === 'amp'){
      h = '<p><strong>' + esc(e.name) + '</strong> — d&amp;b amplifier · ' + esc(r.status) + '</p><ul><li>' + esc(r.power) + '</li><li>Inputs: ' + esc(r.inputs) + '</li><li>Drives: ' + esc(r.drives) + '</li></ul>';
    } else {
      h = '<p><strong>' + esc(e.name) + '</strong> — ' + esc(r.range) + (e.range ? ': ' + esc(r.models) : '') + '</p><p>' + esc(r.what) + '</p><p><strong>Driven by:</strong> ' + esc(r.driven) + '</p>';
    }
    return h;
  }
  function speakerKey(e){ return e.range ? e.row.models.split(/[,(]/)[0].trim() : e.name; }
  /* Can this amp drive this box? Exclusions are d&b's own; otherwise the
     "Driven by" cell decides, and anything we can't confirm says so. */
  function canDrive(amp, spk){
    var a = amp.name.toUpperCase(), driven = spk.row.driven;
    var keys = spk.range ? spk.row.names : [spk.name];
    if(/^(5D|5DM|10D|25D|30D|40D)$/.test(a)) return {ok:null, why:a + ' is an installation amp — in a venue it will already be set up for its system. Check its setup list rather than re-purpose it.'};
    var excluded = NOT_ON[a] ? keys.filter(function(k){ return NOT_ON[a].test(k.toUpperCase()); }) : [];
    if(excluded.length && excluded.length === keys.length) return {ok:false, why:'The ' + a + ' doesn\'t have setups for ' + (spk.range ? spk.name : spk.name) + '. ' + spk.row.range + ' is driven by: ' + driven};
    if(excluded.length) return {ok:null, why:'Not all of them: the ' + a + ' has no setup for ' + excluded.join(', ') + '. ' + spk.row.range + ' is driven by: ' + driven};
    /* Only count a firm mention: drop "check the setup list" clauses and anything after "not". */
    var firm = driven.replace(/\([^)]*check[^)]*\)/gi, '').split(/\.\s+/).filter(function(x){ return !/check/i.test(x); }).join('. ').replace(/\bnot\b.*$/i, '');
    if(new RegExp('\\b' + a + '\\b').test(firm)) return {ok:true, why:spk.row.range + ' is driven by: ' + driven};
    if(a === 'D80') return {ok:true, why:'The D80 carries setups for all d&b loudspeakers. ' + spk.row.range + ': ' + driven};
    if(/^Practically any d&b amp/i.test(driven) && /^(D20|D25|D40|D90)$/.test(a)) return {ok:true, why:spk.row.range + ': ' + driven};
    return {ok:null, why:'I can\'t confirm that from the table. ' + spk.row.range + ' is driven by: ' + driven + ' Check whether the setup is in the ' + a + '\'s list (amp screen or R1).'};
  }
  var COMPAT_Q = /\b(can|could|will|does|do|would)\b[^?]*\b(run|drive|power|work|handle|use|support|take)|\bcompatib|\bon an? (d\d|\d+d)\b|\bwith an? (d\d|\d+d)\b/i;
  var WHICH_AMP_Q = /\b(what|which)\b[^?]*\bamps?\b|\bdriven by\b|\bwhat drives\b|\bamp (does|do) (it|they|that|these|this)\b|\bwhat amp\b/i;
  var COMPARE_Q = /\b(vs\.?|versus|compare|comparison|difference|differ|better|or)\b/i;
  var PER_CHANNEL_Q = /\b(per channel|how many)\b|\b(on|off|per|from) (one|a|each|1|the same|single) (\w+ )?channel\b/i;

  /* Answer a question about d&b kit by name. Returns true if it answered. */
  function modelAnswer(text){
    if(SETUP_INTENT.test(text) && !COMPAT_Q.test(text) && !WHICH_AMP_Q.test(text)) return false;
    var ms = findModels(text);
    var t = text.toLowerCase();
    /* "can my amps run a V8?" — use the amps in his kit */
    if(/\bmy (amps?|rack|kit)\b|\bour (amps?|rack)\b/.test(t)){
      myKit().forEach(function(e){ if(e.row.kind === 'amp' && !ms.some(function(x){ return x.name === e.name; })) ms.push(e); });
    }
    var refersBack = /\b(it|they|them|that|those|these|this one|the box|the boxes|the amp)\b/.test(t) || /^(and|what about|how about)\b/.test(t.trim());
    if(!ms.length && refersBack && g.models.length) ms = g.models.slice(-2);
    if(!ms.length) return false;
    var amps = ms.filter(function(e){ return e.row.kind === 'amp'; });
    var spks = ms.filter(function(e){ return e.row.kind === 'speaker'; });
    /* "and the D40?" after talking about a speaker */
    if(amps.length && !spks.length && refersBack){
      var lastSpk = g.models.filter(function(e){ return e.row.kind === 'speaker'; }).pop();
      if(lastSpk) spks = [lastSpk];
    }
    if(spks.length && !amps.length && WHICH_AMP_Q.test(t) === false && /\b(and|what about|how about)\b/.test(t)){
      var lastAmp = g.models.filter(function(e){ return e.row.kind === 'amp'; }).pop();
      if(lastAmp && COMPAT_Q.test(g.lastQ || '')) amps = [lastAmp];
    }
    ms.forEach(function(e){ g.models.push(e); });
    if(g.models.length > 8) g.models = g.models.slice(-8);
    if(amps[0]) g.slots.amp = g.slots.amp || amps[0].name.toUpperCase();
    if(spks[0]) g.slots.box = spks[0].name;
    g.lastQ = text;
    var links = [['#s6-20','6.20 d&amp;b models']];

    if(PER_CHANNEL_Q.test(t) && spks.length){
      var mm = addMsg('bot', '<p>The maximum number of ' + esc(spks[0].name) + ' per amp channel is in its manual, and ArrayCalc won\'t let a plan exceed it — it can differ from amp to amp. Too many on one channel and it limits hard or protects.</p>' + (/^CCL/i.test(speakerKey(spks[0])) ? '<p>For CCL, d&amp;b quote up to eight boxes per amp.</p>' : '') + '<p>Go by the plan; if it isn\'t to hand, ask.</p>');
      addLinks(mm, links);
      modelChips(spks[0], amps[0]);
      return true;
    }
    if(amps.length && spks.length && (COMPAT_Q.test(t) || refersBack || amps.length + spks.length === 2)){
      var verdicts = [];
      spks.forEach(function(sp){ amps.forEach(function(am){
        var v = canDrive(am, sp);
        verdicts.push('<p>' + (v.ok === true ? '<strong>Yes</strong> — ' : v.ok === false ? '<strong>No</strong> — ' : '<strong>Not certain</strong> — ') + esc(am.name.toUpperCase()) + ' with ' + esc(sp.name) + '. ' + esc(v.why) + '</p>');
      }); });
      var m1 = addMsg('bot', verdicts.join('') + '<p class="note-line">Whatever the table says, the amp\'s own setup list has the final word.</p>');
      addLinks(m1, links);
      modelChips(spks[0], amps[0]);
      return true;
    }
    if(spks.length && !amps.length && WHICH_AMP_Q.test(t)){
      var sp0 = spks[0];
      var m2 = addMsg('bot', '<p><strong>' + esc(sp0.name) + '</strong> (' + esc(sp0.row.range) + ') is driven by: ' + esc(sp0.row.driven) + '</p>');
      addLinks(m2, links);
      modelChips(sp0, null);
      return true;
    }
    /* Past this point the reply would be a model's info card. That's only right
       when the model is the subject ("what is a V8", "D40 vs D80"). If the
       question is about something else — a light, a setup, a cable, a sound —
       let the answers and the book handle it; the model stays remembered. */
    if(!modelIsTopic(t, ms)) return false;
    if(ms.length >= 2 && (COMPARE_Q.test(t) || ms.length === 2)){
      var m3 = addMsg('bot', '<p>Side by side:</p>' + ms.slice(0, 3).map(modelCard).join('<hr>'));
      addLinks(m3, links);
      modelChips(spks[0], amps[0]);
      return true;
    }
    var m4 = addMsg('bot', modelCard(ms[0]));
    addLinks(m4, links);
    modelChips(spks[0], amps[0]);
    return true;
  }
  var TOPIC_FILLER = /^(what|whats|what's|is|are|a|an|the|tell|me|about|explain|info|information|on|of|vs|versus|difference|differences|between|compare|comparison|and|or|d&b|amp|amps|amplifier|box|boxes|speaker|speakers|loudspeaker|sub|subs|it|its|which|better|for|i|do|does|need|to|know|please|model|series|show|give|details|spec|specs|in|with|festival|tour|touring|event|events|gig|job|use|good|best|one|ones|than|more|less|bigger|smaller|current|old|new)$/;
  function modelIsTopic(t, ms){
    var rest = t.replace(/[?.!,]/g, ' ');
    ms.forEach(function(e){ rest = rest.replace(new RegExp(e.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[\\s-]?') + 's?', 'g'), ' '); });
    var left = rest.split(/\s+/).filter(function(w){ return w && !TOPIC_FILLER.test(w) && !/^\d+$/.test(w); });
    return left.length <= 1;
  }
  function modelChips(spk, amp){
    var c = [];
    if(spk && !amp) c.push({label:'Which amp does it need?', quiet:true, go:function(){ addMsg('me', 'Which amp does it need?'); modelAnswer('which amp does it need'); }});
    if(spk && amp) c.push({label:'Set it up', quiet:true, go:function(){ addMsg('me', 'Set it up'); startFlow(FLOW_BY_ID.setup); }});
    if(spk) c.push({label:'Something\'s wrong with it', quiet:true, go:function(){ addMsg('me', 'Something\'s wrong with it'); addMsg('bot', '<p>What\'s it doing? Describe it, or pick:</p>'); setChips(starterChips(['box','sub','crackle','limit','array','phasey']).concat([BACK])); }});
    [spk, amp].forEach(function(e){ var k = e && addToKitChip(e); if(k) c.push(k); });
    if(amp && !spk) c.push({label:'What can it drive?', quiet:true, go:function(){ addMsg('me', 'What can it drive?'); var m = addMsg('bot', '<p><strong>' + esc(amp.name) + '</strong> drives: ' + esc(amp.row.drives) + '</p>'); addLinks(m, [['#s6-20','6.20 d&amp;b models']]); menu(); }});
    c.push(BACK);
    setChips(c);
  }


  /* ---- the kit he actually uses ----
     Read from "My equipment reference" in the Job workspace. Any d&b model
     written there counts as his kit: answers lean on it, the model tables
     mark it, and new kit the chat hears about can be added in one tap. */
  function myKit(){
    var text = window.tbKit ? window.tbKit.summary() : '';
    var seen = {}, out = [];
    findModels(text).forEach(function(e){ if(!e.range && !seen[e.name.toUpperCase()]){ seen[e.name.toUpperCase()] = true; out.push(e); } });
    return out;
  }
  function inKit(e){
    var n = e.name.toUpperCase();
    return myKit().some(function(k){ return k.name.toUpperCase() === n; });
  }
  function addToKitChip(e){
    if(!window.tbKit || e.range || inKit(e)) return null;
    return {label:'Add ' + e.name + ' to my kit', quiet:true, go:function(){
      window.tbKit.add({item:'d&b ' + e.name, category:'d&b ' + (e.row.kind === 'amp' ? 'amplifier' : 'loudspeaker — ' + e.row.range), note:'Added from the fault finder'});
      addMsg('bot', '<p>Added <strong>' + esc(e.name) + '</strong> to My equipment reference in the Job workspace.</p>', 'note');
      menu();
    }};
  }
  /* Every amp in the kit against every box in the kit. */
  function kitCheck(){
    var kit = myKit();
    var amps = kit.filter(function(e){ return e.row.kind === 'amp'; });
    var spks = kit.filter(function(e){ return e.row.kind === 'speaker'; });
    if(!kit.length){
      var m0 = addMsg('bot', '<p>There\'s no d&amp;b kit in your equipment list yet. Add what you use to <strong>My equipment reference</strong> in the Job workspace — or just tell me ("we use D20s with E8s and E15X-SUBs") and I\'ll offer to add it.</p>');
      addLinks(m0, [['#hub-workspace','Job workspace']]);
      menu();
      return;
    }
    var lines = ['<p>Your kit: <strong>' + kit.map(function(e){ return esc(e.name); }).join(', ') + '</strong>.</p>'];
    if(amps.length && spks.length){
      var bad = [], unsure = [];
      spks.forEach(function(sp){ amps.forEach(function(am){
        var v = canDrive(am, sp);
        if(v.ok === false) bad.push(am.name.toUpperCase() + ' can\'t drive ' + sp.name);
        else if(v.ok === null) unsure.push(am.name.toUpperCase() + ' with ' + sp.name);
      }); });
      if(bad.length) lines.push('<p><strong>Watch:</strong> ' + esc(bad.join('; ')) + '.</p>');
      if(unsure.length) lines.push('<p>' + (bad.length ? 'And these' : 'Nothing rules a pairing out, but these') + ' aren\'t confirmed in §6.20 — check the amp\'s setup list: ' + esc(unsure.join('; ')) + '.</p>');
      if(!bad.length && !unsure.length) lines.push('<p>Every amp in your kit has setups for every box in it, as far as §6.20 shows.</p>');
    } else if(spks.length){
      lines.push('<p>No amps in the list yet — add the amps you use and I\'ll check them against these boxes.</p>');
    }
    var m = addMsg('bot', lines.join(''));
    addLinks(m, [['#s6-20','6.20 d&amp;b models'],['#hub-workspace','Edit my kit']]);
    menu();
  }
  /* "We use D20s with E8s and subs" — offer to add what isn't there yet. */
  function offerKitFromText(text){
    /* Only for statements ("we use D20s"), never a question that happens to say
       "can I run" or "should I use". */
    if(/\?\s*$/.test(text) || /^\s*(how|what|whats|what's|why|which|when|where|who|can|could|should|would|will|is|are|do|does|did|may|might|must|shall)\b/i.test(text)) return false;
    if(!window.tbKit || !/\b(we|i) (use|have|run|got)\b|\bour (kit|stock|system|amps|boxes|speakers)\b|\bat (my |our )?work\b|\bin (our |the )?warehouse\b/i.test(text)) return false;
    var fresh = findModels(text).filter(function(e){ return !e.range && !inKit(e); });
    if(!fresh.length) return false;
    var m = addMsg('bot', '<p>Want me to add ' + fresh.map(function(e){ return '<strong>' + esc(e.name) + '</strong>'; }).join(', ') + ' to your kit? Then I\'ll check your amps against your boxes and fill them into the system test.</p>');
    setChips([
      {label:'Add to my kit', go:function(){
        fresh.forEach(function(e){ window.tbKit.add({item:'d&b ' + e.name, category:'d&b ' + (e.row.kind === 'amp' ? 'amplifier' : 'loudspeaker — ' + e.row.range), note:'Added from the fault finder'}); });
        addMsg('me', 'Add to my kit');
        kitCheck();
      }},
      {label:'Not now', quiet:true, go:function(){ addMsg('me', 'Not now'); menu(); }}
    ]);
    return true;
  }

  /* ---- system test as a conversation ----
     Drives the same steps and record as the System test in the Job Hub. */
  var TEST_HELP = {6:'r1', 7:'digital', 8:'box', 9:'phasey', 10:'phasey', 11:'limit', 3:'nl4', 12:'mic'};
  function startTest(){
    var T = window.tbSysTest;
    if(!T){ addMsg('bot', '<p>The system test isn\'t available on this page.</p>'); return; }
    g.test = {awaiting:'step', step:-1};
    var c = T.counts();
    var done = c.pass + c.fail + c.na;
    addMsg('bot', done
      ? '<p>Carrying on with the system test you started — ' + done + ' of ' + T.steps.length + ' steps done.</p>'
      : '<p>Let\'s prove the system, one check at a time. Answer <strong>pass</strong>, <strong>fail</strong> or <strong>not needed</strong> — if something fails, tell me what you found. I\'ll write the record as we go.</p>', 'note');
    var f = T.fields();
    if(!f.kit){
      var kit = window.tbKit ? window.tbKit.summary() : '';
      if(kit){ T.setField('kit', kit); T.fields().kitAuto = true; }
      else { g.test.awaiting = 'kit'; addMsg('bot', '<p>First, what\'s the system? e.g. "2 × D20, 4 × E8, 2 × E15X-SUB".</p>'); setChips([{label:'Skip', quiet:true, go:function(){ addMsg('me', 'Skip'); g.test.awaiting = 'step'; askStep(); }}]); return; }
    }
    askStep();
  }
  function askStep(){
    var T = window.tbSysTest, i = T.next();
    if(i < 0){ finishTest(); return; }
    g.test.step = i; g.test.awaiting = 'step';
    var st = T.steps[i];
    var m = addMsg('bot', '<p><strong>' + (i + 1) + ' of ' + T.steps.length + ' — ' + esc(st.t) + '.</strong> ' + esc(st.d) + '</p>');
    addLinks(m, [[st.l, 'How']]);
    setChips([
      {label:'Pass', go:function(){ answerStep('pass'); }},
      {label:'Fail', go:function(){ answerStep('fail'); }},
      {label:'Not needed', quiet:true, go:function(){ answerStep('na'); }},
      {label:'Pause the test', quiet:true, go:function(){ addMsg('me', 'Pause the test'); g.test = null; addMsg('bot', '<p>Paused — your answers are saved. Pick it up any time from here or from the System test in the Job Hub.</p>'); menu(); }}
    ]);
  }
  function answerStep(s, note){
    var T = window.tbSysTest, i = g.test.step;
    addMsg('me', esc({pass:'Pass', fail:'Fail', na:'Not needed'}[s]) + (note ? ' — ' + esc(note) : ''));
    T.set(i, s, note !== undefined ? note : undefined);
    if(s === 'fail' && note === undefined){
      g.test.awaiting = 'note';
      addMsg('bot', '<p>What did you find? A few words for the record.</p>');
      setChips([{label:'Skip the note', quiet:true, go:function(){ addMsg('me', 'Skip the note'); afterFail(i); }}]);
      return;
    }
    if(s === 'fail'){ afterFail(i); return; }
    askStep();
  }
  function afterFail(i){
    var flowId = TEST_HELP[i];
    var c = [{label:'Carry on testing', go:function(){ addMsg('me', 'Carry on testing'); askStep(); }}];
    if(flowId && FLOW_BY_ID[flowId]) c.unshift({label:'Troubleshoot it now', go:function(){ addMsg('me', 'Troubleshoot it now'); g.test = null; g.symptom = 'System test step ' + (i + 1) + ' failed: ' + window.tbSysTest.steps[i].t; startFlow(FLOW_BY_ID[flowId]); }});
    addMsg('bot', '<p>Noted. A failed step means the system hasn\'t passed until it\'s fixed or the system\'s owner decides.</p>');
    setChips(c);
  }
  function finishTest(){
    var T = window.tbSysTest, c = T.counts();
    g.test = null;
    var m = addMsg('bot', c.fail
      ? '<p>All steps answered — <strong>not passed</strong>: ' + c.fail + ' failed. Here\'s the record to send whoever owns the system:</p>'
      : '<p>All steps answered — <strong>passed</strong>. Here\'s your record:</p>');
    var pre = document.createElement('div'); pre.className = 'chat-report'; pre.textContent = T.record(); m.appendChild(pre);
    var row = [];
    if(navigator.clipboard) row.push({label:'Copy record', go:function(){ navigator.clipboard.writeText(T.record()).then(function(){ addMsg('bot', 'Copied.', 'note'); }, function(){}); setChips(row); }});
    row.push({label:'Open the test page', quiet:true, go:function(){ location.hash = '#hub-systest'; }});
    row.push({label:'New test', quiet:true, go:function(){ T.reset(); addMsg('me', 'New test'); startTest(); }});
    setChips(row);
  }
  var TEST_Q = /\b(system test|test the (system|pa|rig)|pre-?event test|prove the (system|pa|rig)|test before doors|before doors test|run (a|the) test)\b/i;
  var KIT_Q = /\b(my|our) (kit|equipment|gear|stock|amps|boxes|speakers|system)\b.*\b(check|work|compatible|ok|fine|run|drive|list|what)\b|\bwhat('s| is) in my kit\b|^my kit\??$|\bcheck my kit\b/i;
  var COACH_Q = /\b(what (should|do) i (learn|practi[sc]e|work on)|learn next|next skill|become (an? )?(audio )?technician|progress(ion)?|career next|how do i (get better|improve|step up|move up))\b/i;
  function coach(){
    var lists = Array.prototype.slice.call(document.querySelectorAll('ul.check[id^="chk-tech-"]'));
    var total = 0, ticked = 0, next = null, level = 0;
    lists.forEach(function(ul, li){
      var items = Array.prototype.slice.call(ul.querySelectorAll('li'));
      items.forEach(function(item){
        total++;
        var box = item.querySelector('input');
        if(box && box.checked) ticked++;
        else if(!next){ next = item; level = li + 1; }
      });
    });
    if(!next){
      var m0 = addMsg('bot', '<p>You\'ve ticked every technician skill. Next is depth: d&amp;b\'s Software &amp; System Fundamentals workshop, measurement, and taking the lead on a bigger system with someone experienced alongside.</p>');
      addLinks(m0, [['#path-tech','Technician skills'],['#path-career','Career routes']]);
      menu(); return;
    }
    var link = next.querySelector('a');
    var text = (next.querySelector('span') || next).textContent.replace(/\s*\(.*\)\s*$/, '');
    var m = addMsg('bot', '<p>You\'ve ticked <strong>' + ticked + ' of ' + total + '</strong> technician skills. Next, at level ' + level + ': <strong>' + esc(text) + '</strong>.</p><p>Read it, then do it for real on your next job — tick it once you\'ve done it unsupervised twice.</p>');
    var links = [['#path-tech','Technician skills']];
    if(link) links.unshift([link.getAttribute('href'), 'Start here']);
    addLinks(m, links);
    menu();
  }
  window.tbChatStartTest = function(){
    location.hash = '#ask';
    setTimeout(function(){
      reset();
      startTest();
    }, 120);
  };
  /* Mark his kit on the §6.20 tables. Deferred: it reads the tables, and
     nothing about it needs to happen during start-up. */
  function markKitRows(){
    var names = {};
    myKit().forEach(function(e){ names[e.name.toUpperCase()] = true; });
    Array.prototype.forEach.call(document.querySelectorAll('table.db-models tr[data-models]'), function(tr){
      var hit = tr.getAttribute('data-models').split(',').filter(function(n){ return names[n.trim().toUpperCase()]; });
      tr.classList.toggle('in-kit', hit.length > 0);
      var cell = tr.querySelector('td'), badge = cell && cell.querySelector('.kit-badge');
      if(hit.length){
        if(!badge){ badge = document.createElement('span'); badge.className = 'kit-badge'; cell.appendChild(badge); }
        badge.textContent = 'My kit: ' + hit.join(', ');
      } else if(badge){ badge.remove(); }
    });
  }
  document.addEventListener('tb-kit-change', function(){ setTimeout(markKitRows, 0); });

  function mergeSlots(text){
    var sl = readSlots(text);
    findModels(text).forEach(function(e){ if(e.row.kind === 'speaker') sl.box = e.name; else sl.amp = sl.amp || e.name.toUpperCase(); });
    Object.keys(sl).forEach(function(k){ g.slots[k] = sl[k]; });
  }
  function kitLine(){
    var sl = g.slots, parts = [];
    if(sl.amp) parts.push(sl.amp + (sl.ampNo ? ' (amp ' + sl.ampNo + ')' : ''));
    else if(sl.ampNo) parts.push('amp ' + sl.ampNo);
    if(sl.channel) parts.push('channel ' + sl.channel);
    if(sl.mode) parts.push(sl.mode);
    if(sl.cable) parts.push(sl.cable + ' cable');
    if(sl.box) parts.unshift(sl.box);
    return parts.join(', ');
  }
  /* For a question the person has already answered in passing, the answer —
     an option label from that node — or nothing if we can't tell. */
  var AUTO = {
    'box:start': function(sl){ return sl.light === 'green' ? 'Yes, green' : sl.light === 'none' ? 'No green' : null; },
    'box:out': function(sl){ return sl.muted ? 'Yes, muted' : null; },
    'box:mode': function(sl){ return sl.mode || null; },
    'box:mix': function(sl){ return sl.cable === '2-core' ? 'It\'s 2-core / not sure' : null; },
    'sub:start': function(sl){ return sl.mode === 'Mix TOP/SUB' ? 'Yes, one cable' : sl.mode === 'Dual Channel' ? 'No, separate channels' : null; },
    'sub:core': function(sl){ return sl.cable === '2-core' ? 'Found a 2-core / NL2' : sl.cable === '4-core' ? 'All 4-core' : null; },
    'limit:start': function(sl){ return sl.error ? 'An error message' : sl.light === 'yellow' ? 'Yellow GR' : sl.light === 'red' ? 'Red' : null; },
    'limit:red': function(sl){ return sl.muted ? 'Muted' : sl.overload ? 'Overload' : null; }
  };

  function starterChips(ids){
    return ids.map(function(id){
      var f = FLOW_BY_ID[id];
      return {label: f.title, go: function(){ addMsg('me', esc(f.title)); if(!g.symptom) g.symptom = f.title; startFlow(f); }};
    });
  }
  var BACK = {label:'← Back', quiet:true, go: function(){ menu(); }};
  function menu(){
    setChips([
      {label:'Set something up', go:function(){ addMsg('me', 'Set something up'); addMsg('bot', '<p>What are you setting up? Pick one, or type it — "connect R1", "run the sub cables", "line check".</p>'); setChips(starterChips(SETUP_STARTERS).concat([BACK])); }},
      {label:'Something\'s wrong', go:function(){ addMsg('me', 'Something\'s wrong'); addMsg('bot', '<p>Which is closest? Or describe it — "sub silent on amp 2", "crackle from stage left".</p>'); setChips(starterChips(FIX_STARTERS).concat([{label:'Comms, playback, loops, recording…', quiet:true, go:function(){ addMsg('me', 'Comms, playback, loops, recording'); setChips(starterChips(OTHER_STARTERS).concat([BACK])); }}, {label:'More advanced…', quiet:true, go:function(){ addMsg('me', 'More advanced'); setChips(starterChips(ADV_STARTERS).concat([BACK])); }}, BACK])); }},
      {label:'Test before doors', go:function(){ addMsg('me', 'Test before doors'); startTest(); }},
      {label:'Look something up', go:function(){ addMsg('me', 'Look something up'); addMsg('bot', '<p>Type a word or a question — a term, a connector, a setting, a light. A few to try:</p>'); setChips(INFO_HINTS.map(function(h){ return {label:h, quiet:true, go:function(){ addMsg('me', esc(h)); answerInfo(h); }}; }).concat([BACK])); }}
    ]);
  }
  function myKitSafe(){
    try{ return myKit().map(function(e){ return e.name; }).join(', '); }catch(e){ return ''; }
  }
  function greet(){
    var kitNames = myKitSafe();
    addMsg('bot', '<p>I can help you <strong>set something up</strong>, <strong>test it before doors</strong>, <strong>find and fix a problem</strong>, or <strong>look something up</strong>. Type it in your own words, or pick one:</p>' + (kitNames ? '<p class="chat-kitline">Your kit: ' + esc(kitNames) + '</p>' : ''));
    menu();
  }

  function entryNode(f, text){
    if(!f.entries || !text) return 'start';
    var t = norm(text), tokens = t.trim().split(' ');
    var hit = 'start';
    Object.keys(f.entries).some(function(id){
      return f.entries[id].some(function(w){
        var ok = hasWord(t, w, tokens);
        if(ok) hit = id;
        return ok;
      });
    });
    return hit;
  }
  function startFlow(f, text){
    g.flow = f;
    g.steps = [];
    g.trail = [];
    addMsg('bot', f.kind === 'setup'
      ? '<p><strong>' + esc(f.title) + '</strong> — one step at a time.</p>'
      : '<p>Sounds like <strong>' + esc(f.title.toLowerCase()) + '</strong>. One check at a time — and if anything is unsafe, stop and <a href="#support-now">make it safe</a> first.</p>', 'note');
    var entry = resolve(entryNode(f, text), f);
    if(entry.flow !== f) g.flow = entry.flow;
    showNode(entry.flow, entry.id);
  }
  function resolve(ref, f){
    if(ref.indexOf(':') > -1){
      var p = ref.split(':');
      return {flow: FLOW_BY_ID[p[0]], id: p[1]};
    }
    return {flow: f, id: ref};
  }
  function showNode(f, id){
    var node = f.nodes[id];
    if(!node) return;
    g.node = node;
    g.trail.push({flow:f, id:id, steps:g.steps.length});
    var m = addMsg('bot', /^<(ol|ul)/.test(node.q) ? node.q : '<p>' + node.q + '</p>');
    addLinks(m, node.links);
    if(node.end){
      g.steps.push({k: node.k || 'Result', a: plain(node.q)});
      if(f.kind === 'setup'){
        setChips([
          {label:'Next part', go: function(){ addMsg('me', 'Next part'); showNode(f, 'start'); }},
          {label:'Hit a problem', go: function(){ addMsg('me', 'Hit a problem'); addMsg('bot', '<p>What\'s happening? Describe it, or pick the closest:</p>'); setChips(starterChips(FIX_STARTERS).concat([BACK])); }},
          {label:'All done', quiet:true, go: function(){ addMsg('me', 'All done'); addMsg('bot', '<p>Good. Save and write down anything that changed from the plan — it makes the derig and the next job easier.</p>'); menu(); }}
        ]);
        return;
      }
      setChips([
        {label:'That fixed it', go: function(){ addMsg('me', 'That fixed it'); finish(true); }},
        {label:'Still not right', go: function(){ addMsg('me', 'Still not right'); finish(false); }},
        {label:'Start again', quiet:true, go: reset}
      ]);
      return;
    }
    function take(o, said){
      if(said) addMsg('bot', '<p>From what you said: <strong>' + esc(o[0]) + '</strong>.</p>', 'note');
      else addMsg('me', esc(o[0]));
      g.steps.push({k: node.k, a: o[0]});
      var next = resolve(o[1], f);
      if(next.flow !== f) g.flow = next.flow;
      showNode(next.flow, next.id);
    }
    var auto = AUTO[f.id + ':' + id];
    var known = auto && auto(g.slots);
    var pick = known && node.opts.filter(function(o){ return o[0] === known; })[0];
    if(pick){ setChips([]); setTimeout(function(){ take(pick, true); }, 250); return; }
    var extra = [];
    if(g.trail.length > 1) extra.push({label:'\u2190 Back a step', quiet:true, go: stepBack});
    extra.push({label:'Start again', quiet:true, go: reset});
    setChips(node.opts.map(function(o){
      return {label:o[0], go:function(){ take(o); }};
    }).concat(extra));
  }
  function stepBack(){
    g.trail.pop();
    var prev = g.trail.pop();
    if(!prev){ menu(); return; }
    addMsg('me', 'Back a step');
    g.steps.length = prev.steps;
    g.flow = prev.flow;
    var keep = AUTO[prev.flow.id + ':' + prev.id];
    if(keep) AUTO[prev.flow.id + ':' + prev.id] = function(){ return null; };
    showNode(prev.flow, prev.id);
    if(keep) AUTO[prev.flow.id + ':' + prev.id] = keep;
  }

  function buildReport(fixed){
    var f = g.flow || {title:'', ask:''};
    var lines = [];
    lines.push('Fault: ' + (g.symptom || f.title).replace(/[.\s]+$/, '') + '.');
    var kit = kitLine();
    if(kit) lines.push('Kit: ' + kit + '.');
    var checks = g.steps.filter(function(s){ return s.k !== 'Result'; });
    if(checks.length){
      lines.push('Checked: ' + checks.map(function(s){ return s.k + ' — ' + s.a.toLowerCase(); }).join('; ') + '.');
    }
    var last = g.steps.filter(function(s){ return s.k === 'Result'; }).pop();
    if(last) lines.push((fixed ? 'Fixed: ' : 'Where it\'s got to: ') + last.a);
    if(!fixed) lines.push(f.ask || 'What would you like me to do next?');
    return lines.join('\n');
  }
  function finish(fixed){
    var report = buildReport(fixed);
    var m = addMsg('bot', fixed
      ? '<p>Good. Log it so the next person knows — here\'s a note you can keep or send:</p>'
      : '<p>Time to hand it over with the facts. Here\'s the message — symptom, what\'s been checked, what you need:</p>');
    var pre = document.createElement('div');
    pre.className = 'chat-report';
    pre.textContent = report;
    m.appendChild(pre);
    var row = [];
    if(navigator.clipboard){
      row.push({label:'Copy message', go:function(){
        navigator.clipboard.writeText(report).then(function(){ addMsg('bot', 'Copied.', 'note'); }, function(){ addMsg('bot', 'Couldn\'t copy — press and hold the text to select it.', 'note'); });
        setChips(row);
      }});
    }
    if(g.queue.length){
      var nextF = g.queue.shift();
      row.unshift({label:'Now: ' + nextF.title, go:function(){ addMsg('me', esc(nextF.title)); g.symptom = nextF.title; startFlow(nextF); }});
    }
    row.push({label:'Another problem', quiet:true, go: reset});
    setChips(row);
  }

  /* match free text against the flows; fall back to the book's own index */
  function rankFlows(text, kind){
    var t = norm(text), tokens = t.trim().split(' ');
    var out = [];
    FLOWS.forEach(function(f){
      if(kind && (f.kind || 'fix') !== kind) return;
      var s = 0;
      f.nwords.forEach(function(w){ if(hasWord(t, w, tokens)) s += w.indexOf(' ') > -1 ? 2 : 1; });
      if(s > 0) out.push({f:f, s:s});
    });
    out.sort(function(a, b){ return b.s - a.s; });
    return out;
  }
  function scoreFlows(text, kind){
    var r = rankFlows(text, kind);
    return r.length ? r[0].f : null;
  }
  /* A short typed reply while options are showing — "yes", "no", "not sure",
     "4 core" — picks the matching option instead of starting a new search. */
  function matchChip(text){
    if(!currentChips.length || !g.flow) return null;
    var t = norm(text).trim();
    if(!t || t.split(' ').length > 6) return null;
    var yes = /^(y|yes|yeah|yep|yup|it is|it does|correct|ok|okay|sure)$/.test(t);
    var no = /^(n|no|nope|nah|it isn|not really|negative)$/.test(t);
    var best = null, bestScore = 0;
    currentChips.forEach(function(c){
      var lab = norm(c.label).trim();
      if(yes && /^(yes|that fixed it)\b/.test(lab)) { best = best || c; bestScore = 99; return; }
      if(no && /^(no|still not right)\b/.test(lab)) { best = best || c; bestScore = 99; return; }
      if(lab === t || (t.length >= 3 && lab.indexOf(t) === 0)){ if(bestScore < 50){ best = c; bestScore = 50; } return; }
      var lw = lab.split(' ').filter(function(w){ return w.length >= 3; });
      var tw = t.split(' ').filter(function(w){ return w.length >= 3; });
      var hit = tw.filter(function(w){ return lw.indexOf(w) > -1; }).length;
      if(hit && hit === tw.length && hit > bestScore){ best = c; bestScore = hit; }
    });
    return best;
  }
  /* ---- searching the book ----
     Every word is folded the same way the routes fold what's typed (synonyms:
     "cab" → speaker, "dead" → silent) and cut back to its stem ("crackling",
     "crackles" → crackl), so the book and the question meet in the middle.
     Sections are ranked with BM25 — rare, specific words count for more than
     common ones, and a long section doesn't win just by being long. Titles
     count three times. The index is built once, the first time it's needed
     (or when the phone is idle after start-up). */
  var STOP = {};
  'the and not but for with from its has have one what whats why how does doesn isn won there this that when just mean means meaning is a an of to in on it do i my me can you are was difference between vs versus explain tell about which should need get set up help please be or if at by as so we our your they them then than into out any all some will would could also very really much more most only own same too s t'.split(' ').forEach(function(w){ STOP[w] = true; });
  function stem(w){
    if(w.length <= 3 || /\d/.test(w) || w.indexOf('&') > -1) return w;
    return w
      .replace(/(ies)$/, 'y')
      .replace(/(ence|ance|ences|ances)$/, '')
      .replace(/(ing|ings|ed|er|ers|es|ly|ness|ment|ments)$/, '')
      .replace(/([^s])s$/, '$1')
      .replace(/e$/, '')
      .replace(/(.)\1$/, '$1');
  }
  function terms(text, raw){
    return norm(text, raw).replace(/'/g, '').replace(/\bset ?ting ?up\b|\bset ?up\b/g, 'setup').split(' ').filter(function(w){ return w && !STOP[w] && (w.length > 1 || /\d/.test(w)); }).map(stem);
  }
  var bm = null;
  function buildBookIndex(){
    if(bm) return bm;
    var docs = [], df = {}, total = 0;
    sectionIndex.forEach(function(e){
      if(!/^s\d/.test(e.id) || /^s(19-1[26]|20-)/.test(e.id)) return;
      var title = terms(e.title, true), body = terms(e.body, true);
      var tf = {}, len = 0;
      function add(t, w){ tf[t] = (tf[t] || 0) + w; len += w; }
      title.forEach(function(t){ add(t, 3); });
      body.forEach(function(t){ add(t, 1); });
      Object.keys(tf).forEach(function(t){ df[t] = (df[t] || 0) + 1; });
      docs.push({e:e, tf:tf, len:len});
      total += len;
    });
    bm = {docs:docs, df:df, n:docs.length, avg: total / Math.max(1, docs.length)};
    return bm;
  }
  /* A word the book doesn't contain is probably a typo: use the book's own
     nearest word if it's one letter off (two for long words). Nonsense with
     no near neighbour is left alone, so it still finds nothing. */
  function nearest(t, df){
    if(df[t] || t.length < 4 || /\d/.test(t)) return t;
    var allow = t.length >= 8 ? 2 : 1, best = t, bestD = allow + 1, bestN = 0;
    Object.keys(df).forEach(function(w){
      if(Math.abs(w.length - t.length) > allow) return;
      var d = editDistance(t, w);
      if(d < bestD || (d === bestD && df[w] > bestN)){ bestD = d; best = w; bestN = df[w]; }
    });
    return bestD <= allow ? best : t;
  }
  function idf(t, index){ var d = index.df[t] || 0; return Math.log(1 + (index.n - d + 0.5) / (d + 0.5)); }
  function searchBook(text, limit, skip){
    var index = buildBookIndex();
    var q = terms(text).map(function(t){ return nearest(t, index.df); }).filter(function(t, i, all){ return all.indexOf(t) === i; });
    if(!q.length) return [];
    var k1 = 1.2, b = 0.75, scored = [];
    var qIdf = q.reduce(function(sum, t){ return sum + idf(t, index); }, 0);
    index.docs.forEach(function(d){
      if(skip && skip[d.e.id]) return;
      var s = 0, hits = 0, got = 0;
      q.forEach(function(t){
        var f = d.tf[t];
        if(!f) return;
        hits++;
        got += idf(t, index);
        s += idf(t, index) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / index.avg));
      });
      if(s > 0 && got / qIdf >= 0.4) scored.push({e:d.e, s:s * (1 + hits / q.length)});
    });
    scored.sort(function(a, b){ return b.s - a.s; });
    return scored.slice(0, limit).map(function(x){ return x.e; });
  }
  (window.requestIdleCallback || function(fn){ setTimeout(fn, 3000); })(function(){ try{ buildBookIndex(); }catch(e){} });
  (window.requestIdleCallback || function(fn){ setTimeout(fn, 4000); })(function(){ try{ buildPassageIndex(); }catch(e){} });

  /* ---- answering from passages ----
     Whole sections are too coarse to answer a question: the answer is usually
     one paragraph, a few steps, a term and its definition, or one row of a
     table. So every section is cut into passages — paragraphs, list items,
     term lines (dt + dd), table rows (each cell labelled with its column
     heading) and notes — and those are ranked with the same BM25, typo and
     synonym handling as the section search. A passage also earns credit for
     its section and sub-heading matching the question, so the answer comes
     from the right place in the book, not a stray mention.
     The reply is built for the kind of question: steps for "how do I", the
     defining passage for "what is", both sides for "difference", the reasons
     and warnings for "why", the figure for "how many / how far". A "Watch it"
     note in the same section that shares the question's words always travels
     with the answer. Built once, on the first question that needs it. */
  var pidx = null;
  function cleanText(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function buildPassageIndex(){
    if(pidx) return pidx;
    var docs = [], df = {}, total = 0;
    var NOTE_LABEL = {warn:'Watch it', std:'Standard', alt:'Also seen', deep:'Go deeper'};
    sectionIndex.forEach(function(e){
      if(!/^s\d/.test(e.id) || /^s(19-1[26]|20-)/.test(e.id)) return;
      var sec = document.getElementById(e.id);
      if(!sec) return;
      var titleTerms = terms(e.title, true);
      var h4 = '', order = 0;
      function push(kind, text, el, extra){
        if(!text || text.length < 12) return;
        var head = terms(h4, true);
        var tf = {}, len = 0;
        terms(text, true).forEach(function(t){ tf[t] = (tf[t] || 0) + 1; len++; });
        head.forEach(function(t){ tf[t] = (tf[t] || 0) + 0.6; });
        Object.keys(tf).forEach(function(t){ df[t] = (df[t] || 0) + 1; });
        var d = {id:e.id, title:e.title, h4:h4, kind:kind, text:text, el:el, tf:tf, len:Math.max(len, 4), order:order++, titleTerms:titleTerms};
        if(extra) Object.keys(extra).forEach(function(k){ d[k] = extra[k]; });
        docs.push(d); total += d.len;
      }
      Array.prototype.forEach.call(sec.querySelectorAll('h4, p, li, dt, tr, div.note'), function(el){
        if(el.closest('.notefield, .next-part, figure, .diagram')) return;
        var tag = el.tagName;
        if(tag === 'H4'){ h4 = cleanText(el); return; }
        var note = el.closest('div.note');
        if(tag === 'DIV'){
          var cls = (el.className.match(/\b(warn|std|alt|deep)\b/) || [])[1] || 'std';
          var body = Array.prototype.map.call(el.querySelectorAll('p'), cleanText).join(' ');
          push('note-' + cls, body, el, {label: NOTE_LABEL[cls]});
          return;
        }
        if(note) return;                       /* notes are taken whole, above */
        if(tag === 'P' && !el.closest('li, td, dd, .hub-card')) push('p', cleanText(el), el);
        else if(tag === 'LI' && !el.closest('ul.check, .chat, nav')){
          var list = el.parentElement;
          push(list && list.tagName === 'OL' ? 'step' : 'item', cleanText(el), el, {list:list});
        }
        else if(tag === 'DT'){
          var dd = el.nextElementSibling;
          if(dd && dd.tagName === 'DD') push('term', cleanText(el) + ' — ' + cleanText(dd), el, {term:cleanText(el)});
        }
        else if(tag === 'TR' && el.parentElement && el.parentElement.tagName === 'TBODY'){
          var table = el.closest('table');
          var heads = table ? Array.prototype.map.call(table.querySelectorAll('thead th'), cleanText) : [];
          var cells = Array.prototype.map.call(el.children, cleanText);
          var text = cells.map(function(c, i){ return (heads[i] && i ? heads[i] + ': ' : '') + c; }).join(' · ');
          push('row', text, el, {cells:cells, heads:heads});
        }
      });
    });
    pidx = {docs:docs, df:df, n:docs.length, avg: total / Math.max(1, docs.length)};
    docs.forEach(function(d){ d.text.toLowerCase().split(/[^a-z]+/).forEach(function(w){ if(w.length >= 5) VOCAB[w] = true; }); });
    return pidx;
  }

  function questionType(text){
    var t = text.toLowerCase().trim();
    if(/\b(difference|differ|vs\.?|versus|compare|compared|better)\b/.test(t)) return 'diff';
    if(/^(how|what) (do|should|would|can) (i|you|we)\b|^how to\b|^(walk me through|steps? (to|for))\b|\b(step by step|set ?up|connect|configure|install|run|ring out|check|test|fix|stop|avoid|prevent|explain to)\b/.test(t) && !/^(what|which) (is|are|does)\b/.test(t)) return 'how';
    if(/^why\b|\bwhy (does|do|is|are|would|should)\b/.test(t)) return 'why';
    if(/^how (many|much|far|long|loud|big|high|low|close)\b|\bhow (many|much|far|long|loud)\b/.test(t)) return 'amount';
    if(/^(can|could|should|is it ok|is it safe|am i allowed|do i need|may)\b/.test(t)) return 'can';
    if(/^(what|whats|what's|which|who|define|explain|meaning|tell me about)\b|\bmeans?\b|\bstand(s)? for\b|\bwhat (is|are|does)\b/.test(t)) return 'what';
    return 'other';
  }

  /* Rank passages for a question. Returns [{d, s}] best first, and the share of
     the question's meaning (by IDF) that the best passage covers. */
  function rankPassages(text){
    var P = buildPassageIndex();
    var q = terms(text).map(function(t){ return nearest(t, P.df); }).filter(function(t, i, all){ return all.indexOf(t) === i; });
    if(!q.length) return {list:[], cover:0, q:q};
    var unknown = q.filter(function(t){ return !P.df[t] && t.length >= 4 && !/\d/.test(t); });
    var secs = {};
    searchBook(text, 6).forEach(function(e, i){ secs[e.id] = 6 - i; });
    var qtype = questionType(text);
    var k1 = 1.2, b = 0.75, qIdf = 0, ids = {};
    q.forEach(function(t){ ids[t] = idf(t, P); qIdf += ids[t]; });
    var out = [];
    P.docs.forEach(function(d){
      var s = 0, got = 0, hits = 0;
      q.forEach(function(t){
        var f = d.tf[t];
        var inTitle = d.titleTerms.indexOf(t) > -1;
        if(!f && !inTitle) return;
        hits++; got += ids[t];
        if(f) s += ids[t] * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / P.avg));
        if(inTitle) s += ids[t] * 0.35;
      });
      if(!s) return;
      s *= (1 + hits / q.length);
      if(secs[d.id]) s *= 1 + secs[d.id] * 0.12;
      if(qtype === 'how' && d.kind === 'step') s *= 1.25;
      if((qtype === 'what' || qtype === 'diff' || qtype === 'other') && (d.kind === 'term' || d.kind === 'row')) s *= 1.2;
      if(qtype === 'why' && (/\b(because|so that|which is why|otherwise|that's why|so the)\b/i.test(d.text) || d.kind === 'note-warn')) s *= 1.2;
      if(qtype === 'amount' && /\d/.test(d.text)) s *= 1.2;
      out.push({d:d, s:s, cover: got / qIdf});
    });
    out.sort(function(a, b){ return b.s - a.s; });
    return {list:out, cover: out.length ? out[0].cover : 0, q:q, qtype:qtype, unknown:unknown};
  }

  function passageHTML(d){
    if(d.kind === 'term') return '<p><strong>' + esc(d.term) + '</strong> — ' + esc(d.text.slice(d.term.length + 3)) + '</p>';
    if(d.kind === 'row'){
      return '<p>' + d.cells.map(function(c, i){ return i === 0 ? '<strong>' + esc(c) + '</strong>' : (d.heads[i] ? esc(d.heads[i]) + ': ' : '') + esc(c); }).join(' · ') + '</p>';
    }
    if(/^note-/.test(d.kind)) return '<p class="chat-note-' + d.kind.slice(5) + '"><strong>' + esc(d.label) + ':</strong> ' + esc(d.text) + '</p>';
    return '<p>' + esc(d.text) + '</p>';
  }
  /* The steps of a numbered list, whole — a how-to answer is the list. */
  function stepsHTML(list){
    var items = Array.prototype.map.call(list.children, function(li){ return '<li>' + esc(cleanText(li)) + '</li>'; });
    return '<ol>' + items.slice(0, 12).join('') + '</ol>' + (items.length > 12 ? '<p>…and ' + (items.length - 12) + ' more steps in the section.</p>' : '');
  }

  /* Build and show an answer from passages. Returns true if it answered with
     reasonable confidence; false (and shows nothing) if it shouldn't try. */
  var CONFIDENT = 0.45;
  function passageAnswer(text, opts){
    opts = opts || {};
    var r = rankPassages(text);
    if(!r.list.length) return false;
    var top = r.list[0];
    if(!opts.force && r.cover < CONFIDENT) return false;
    if(r.unknown.length && !(opts.force && opts.fromBank)) return false;
    var qtype = r.qtype, used = [], html = [];
    var sameSec = r.list.filter(function(x){ return x.d.id === top.d.id; });
    function take(x){ if(used.indexOf(x.d) < 0 && used.length < 4){ used.push(x.d); return true; } return false; }

    if(qtype === 'how' && (top.d.kind === 'step' || sameSec.some(function(x){ return x.d.kind === 'step' && x.s > top.s * 0.6; }))){
      var stepPassage = top.d.kind === 'step' ? top.d : sameSec.filter(function(x){ return x.d.kind === 'step'; })[0].d;
      var intro = sameSec.filter(function(x){ return x.d.kind === 'p' && x.s > top.s * 0.4; })[0];
      if(intro){ take(intro); html.push(passageHTML(intro.d)); }
      html.push(stepsHTML(stepPassage.list));
      used.push(stepPassage);
    } else if(qtype === 'diff'){
      take(top); html.push(passageHTML(top.d));
      /* a second passage that covers the words the first one didn't */
      var missing = r.q.filter(function(t){ return !top.d.tf[t]; });
      var other = r.list.slice(1, 20).filter(function(x){ return missing.some(function(t){ return x.d.tf[t]; }); })[0] || r.list[1];
      if(other && take(other)) html.push(passageHTML(other.d));
    } else {
      take(top); html.push(passageHTML(top.d));
      /* one or two more from the same section if they're nearly as relevant */
      sameSec.slice(1).forEach(function(x){ if(x.s > top.s * 0.55 && used.length < 3 && !/^note-/.test(x.d.kind) && take(x)) html.push(passageHTML(x.d)); });
    }
    /* The warning that goes with it: a "Watch it" note from the same section
       that shares the question's words, or sits right after a passage used. */
    var warn = r.list.filter(function(x){ return x.d.kind === 'note-warn' && x.d.id === top.d.id && used.indexOf(x.d) < 0; })[0];
    if(!warn){
      used.forEach(function(d){
        var nx = d.el && d.el.nextElementSibling;
        if(!warn && nx && nx.classList && nx.classList.contains('note') && nx.classList.contains('warn')){
          var w = buildPassageIndex().docs.filter(function(p){ return p.el === nx; })[0];
          if(w) warn = {d:w};
        }
      });
    }
    if(warn) html.push(passageHTML(warn.d));

    var sure = r.cover >= CONFIDENT && top.s > 2;
    var head = '<p class="chat-from">' + (sure ? 'From' : 'Closest I have, from') + ' <strong>' + esc(top.d.title) + '</strong>' + (top.d.h4 ? ' · ' + esc(top.d.h4) : '') + ':</p>';
    var m = addMsg('bot', head + html.join(''));
    var secIds = [top.d.id];
    r.list.slice(1, 12).forEach(function(x){ if(secIds.indexOf(x.d.id) < 0 && secIds.length < 3 && x.s > top.s * 0.5) secIds.push(x.d.id); });
    addLinks(m, secIds.map(function(id){ return ['#' + id, esc(sectionLabel(id))]; }));

    g.lastPassages = {text:text, r:r, shown:used.slice(), id:top.d.id};
    g.lastAnswer = {see:[top.d.id], q:text};
    var next = [];
    next.push({label:'Go deeper', go: function(){ addMsg('me', 'Go deeper'); deeper(); }});
    if(qtype !== 'why') next.push({label:'Why?', quiet:true, go: function(){ addMsg('me', 'Why?'); whyMore(); }});
    var rf = rankFlows(text), f = rf.length && rf[0].s >= 2 ? rf[0].f : null;
    if(f) next.push({label:(f.kind === 'setup' ? 'Walk me through: ' : 'Troubleshoot: ') + f.title, quiet:true, go: function(){ addMsg('me', esc(f.title)); startFlow(f, text); }});
    next.push({label:'Not what I asked', quiet:true, go: function(){ addMsg('me', 'Not what I asked'); notWhatIAsked(text); }});
    next.push(BACK);
    setChips(next);
    return true;
  }
  /* The next most relevant passages not shown yet, from the same section
     first; then the whole section if there's nothing left. */
  function deeper(){
    var L = g.lastPassages;
    if(!L){ menu(); return; }
    var more = L.r.list.filter(function(x){ return L.shown.indexOf(x.d) < 0 && (x.d.id === L.id || x.s > L.r.list[0].s * 0.5); }).slice(0, 3);
    if(!more.length){ peek(L.id); return; }
    more.forEach(function(x){ L.shown.push(x.d); });
    var m = addMsg('bot', more.map(function(x){ return (x.d.id !== L.id ? '<p class="chat-from">From <strong>' + esc(x.d.title) + '</strong>:</p>' : '') + passageHTML(x.d); }).join(''));
    addLinks(m, [['#' + L.id, esc(sectionLabel(L.id))]]);
    setChips([{label:'Go deeper', go: function(){ addMsg('me', 'Go deeper'); deeper(); }}, {label:'Read the whole section', quiet:true, go: function(){ addMsg('me', 'Read the whole section'); peek(L.id); }}, BACK]);
  }
  /* Reasons: passages that explain (because / so that / otherwise) and the
     section's notes. */
  function whyMore(){
    var L = g.lastPassages;
    if(!L){ menu(); return; }
    var why = L.r.list.filter(function(x){ return L.shown.indexOf(x.d) < 0 && (/\b(because|so that|which is why|otherwise|that's why|so the|means)\b/i.test(x.d.text) || /^note-(warn|std)/.test(x.d.kind)) && (x.d.id === L.id || x.s > L.r.list[0].s * 0.5); }).slice(0, 2);
    if(!why.length){ deeper(); return; }
    why.forEach(function(x){ L.shown.push(x.d); });
    addMsg('bot', why.map(function(x){ return passageHTML(x.d); }).join(''));
    setChips([{label:'Go deeper', go: function(){ addMsg('me', 'Go deeper'); deeper(); }}, BACK]);
  }

  /* Questions it couldn't answer well are kept on this phone (never sent
     anywhere) so they can be turned into answers in the next upgrade. */
  var MISS_KEY = 'treebysound-missed-questions';
  function logMiss(text, why){
    try{
      var l = JSON.parse(storeGet(MISS_KEY) || '[]');
      if(l.length && l[0].q === text) return;
      l.unshift({q:text, why:why || 'low confidence', at:new Date().toISOString().slice(0, 10)});
      storeSet(MISS_KEY, JSON.stringify(l.slice(0, 150)));
    }catch(e){}
  }
  function bookAnswer(text){
    var defs = questionType(text) === 'what' ? findGlossary(text) : [];
    if(defs.length){
      defs.forEach(function(d){ addMsg('bot', '<p><strong>' + esc(d.name) + '</strong> — ' + (d.dd ? d.dd.innerHTML : '') + '</p>').classList.add('def'); });
      if(!passageAnswer(text)) menu();
      return true;
    }
    return passageAnswer(text);
  }
  function notWhatIAsked(text){
    logMiss(text, 'not what I asked');
    var shownFromBank = g.lastAnswer && g.lastAnswer.fromBank;
    if(shownFromBank && passageAnswer(text, {force:true, fromBank:true})) return;
    var found = searchBook(text, 4);
    var m = addMsg('bot', '<p>Sorry — I\'ve kept that question so it can be answered properly in the next update.' + (found.length ? ' The closest sections:' : '') + '</p>');
    if(found.length) addLinks(m, found.map(function(e){ return ['#' + e.id, esc(sectionLabel(e.id))]; }));
    menu();
  }


  /* ---- the answer bank ----
     Direct answers to the questions people actually ask, written in advance
     from this book (and checked against the sources it cites), so the chat
     can answer straight away with no signal. Each entry: the ways it gets
     asked (separated by |), the answer (trusted HTML), and the sections it
     comes from. Matching is by meaning-bearing words: rare words count for
     more, and most of what was asked has to be covered by one phrasing. */
//#include js/chat-answers.js
  var bank = null;
  /* Words the answers and the glossary use are real words, not typos — so the
     typo corrector leaves them alone ("coherence" must not become "conference"). */
  ANSWERS.forEach(function(a){ a[0].toLowerCase().split(/[^a-z]+/).forEach(function(w){ if(w.length >= 5) VOCAB[w] = true; }); });
  Array.prototype.forEach.call(document.querySelectorAll('#s20-1 .glossary dt'), function(dt){
    (dt.textContent || '').toLowerCase().split(/[^a-z]+/).forEach(function(w){ if(w.length >= 5) VOCAB[w] = true; });
  });
  function bankIndex(){
    if(bank) return bank;
    var df = {};
    var entries = ANSWERS.map(function(a){
      var ps = a[0].split('|').map(function(q){ return terms(q).filter(function(t, i, all){ return all.indexOf(t) === i; }); }).filter(function(p){ return p.length; });
      var seen = {};
      ps.forEach(function(p){ p.forEach(function(t){ seen[t] = true; }); });
      Object.keys(seen).forEach(function(t){ df[t] = (df[t] || 0) + 1; });
      return {ps:ps, all:Object.keys(seen), a:a[1], see:(a[2] || '').split(' ').filter(Boolean), q:a[0].split('|')[0]};
    });
    bank = {entries:entries, df:df, n:entries.length};
    return bank;
  }
  function bestAnswer(text){
    var B = bankIndex();
    if(!B.n) return null;
    var q = terms(text).map(function(t){ return nearest(t, B.df); }).filter(function(t, i, all){ return all.indexOf(t) === i; });
    if(!q.length) return null;
    function w(t){ var d = B.df[t] || 0; return Math.log(1 + (B.n + 1) / (d + 0.5)); }
    var qw = q.reduce(function(sum, t){ return sum + w(t); }, 0);
    var all = [];
    B.entries.forEach(function(e){
      /* How much of the question this entry covers (any of its phrasings),
         and how closely the best single phrasing matches. */
      var got = q.filter(function(t){ return e.all.indexOf(t) > -1; });
      if(!got.length || got.length < Math.min(2, q.length)) return;
      var cover = got.reduce(function(sum, t){ return sum + w(t); }, 0) / qw;
      var close = 0;
      e.ps.forEach(function(p){
        var gw = p.filter(function(t){ return q.indexOf(t) > -1; }).reduce(function(sum, t){ return sum + w(t); }, 0);
        var pw = p.reduce(function(sum, t){ return sum + w(t); }, 0);
        if(gw / pw > close) close = gw / pw;
      });
      all.push({e:e, score:0.65 * cover + 0.35 * close});
    });
    all.sort(function(a, b){ return b.score - a.score; });
    var best = all[0];
    if(!best || best.score < 0.62) return null;
    best.others = all.slice(1, 3).filter(function(o){ return o.score >= 0.55; });
    return best;
  }
  /* "§6.17" in an answer becomes a link that opens the section in the chat. */
  function linkSections(html){
    return html.replace(/§(\d{1,2})\.(\d{1,2})/g, function(all, a, b, at, str){
      if(str.charAt(at - 1) === '>') return all;
      var id = 's' + a + '-' + b;
      return document.getElementById(id) ? '<a href="#' + id + '">' + all + '</a>' : all;
    });
  }
  function showAnswer(hit, text){
    var e = hit.e;
    var m = addMsg('bot', linkSections(e.a));
    if(e.see.length) addLinks(m, e.see.filter(function(id){ return document.getElementById(id); }).map(function(id){ return ['#' + id, esc(sectionLabel(id))]; }));
    var next = [];
    var rf = rankFlows(text), f = rf.length && rf[0].s >= 2 ? rf[0].f : null;
    if(f) next.push({label: (f.kind === 'setup' ? 'Walk me through: ' : 'Troubleshoot: ') + f.title, go: function(){ addMsg('me', esc(f.title)); startFlow(f, text); }});
    if(e.see[0] && SECTION_LINK.test('#' + e.see[0]) && document.getElementById(e.see[0])) next.push({label:'Read it here', go: function(){ addMsg('me', 'Read it here'); peek(e.see[0]); setChips(next.filter(function(c){ return c.label !== 'Read it here'; })); }});
    (hit.others || []).forEach(function(o){
      next.push({label:'Also: ' + o.e.q, quiet:true, go: function(){ addMsg('me', esc(o.e.q)); showAnswer({e:o.e, others:[]}, o.e.q); }});
    });
    next.push({label:'Not what I asked', quiet:true, go: function(){ addMsg('me', 'Not what I asked'); notWhatIAsked(text); }});
    next.push(BACK);
    g.lastAnswer = e;
    e.fromBank = true;
    setChips(next);
  }

  function sectionLabel(id){
    var sec = document.getElementById(id);
    var h = sec && sec.querySelector('h3');
    return h ? h.textContent.trim() : id;
  }

  /* "Look something up": answer from the book itself — the glossary first
     (a definition is usually what's wanted), then the sentence in the best
     matching sections that actually contains the words asked about. */
  function spaced(s){ return ' ' + String(s).toLowerCase().replace(/[^a-z0-9&+]+/g, ' ').trim() + ' '; }
  var glossary = null;
  function glossaryEntries(){
    if(glossary) return glossary;
    glossary = Array.prototype.map.call(document.querySelectorAll('#s20-1 .glossary > div'), function(div){
      var dt = div.querySelector('dt'), dd = div.querySelector('dd');
      var name = dt ? dt.textContent.trim() : '';
      var alts = [];
      name.split(/\s+\/\s+/).forEach(function(part){
        var bare = part.replace(/\s*\(.*?\)\s*/g, ' ').trim();
        if(bare) alts.push(spaced(bare));
        var inside = /\(([^)]+)\)/.exec(part);
        if(inside) alts.push(spaced(inside[1]));
      });
      return {name:name, alts:alts, dd:dd};
    });
    return glossary;
  }
  function findGlossary(text){
    var q = spaced(text);
    var hits = [];
    glossaryEntries().forEach(function(e){
      var best = 0;
      e.alts.forEach(function(a){ if(a.trim().length >= 2 && q.indexOf(a) > -1) best = Math.max(best, a.length); });
      if(best) hits.push({e:e, s:best});
    });
    hits.sort(function(a, b){ return b.s - a.s; });
    return hits.slice(0, 2).map(function(h){ return h.e; });
  }
  function snippet(id, text){
    var sec = document.getElementById(id);
    if(!sec) return '';
    var words = text.toLowerCase().split(/[^a-z0-9&]+/).filter(function(w){ return w.length > 2; });
    var best = '', bestScore = 0;
    Array.prototype.forEach.call(sec.querySelectorAll('p, li, dd, td'), function(el){
      if(el.closest('.notefield')) return;
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      var lt = t.toLowerCase(), s = 0;
      words.forEach(function(w){ if(lt.indexOf(w) > -1) s++; });
      if(s > bestScore && t.length > 30){ bestScore = s; best = t; }
    });
    return best.length > 320 ? best.slice(0, 317).replace(/\s+\S*$/, '') + '…' : best;
  }
  function answerInfo(text, noBank){
    var hit = !noBank && bestAnswer(text);
    if(hit){ showAnswer(hit, text); return; }
    var defs = findGlossary(text);
    var qt = questionType(text);
    /* A definition first when that's what's asked; then the passages that
       answer it. Only fall back to a list of sections when nothing fits. */
    if(defs.length && qt === 'what'){
      defs.forEach(function(d){ addMsg('bot', '<p><strong>' + esc(d.name) + '</strong> — ' + (d.dd ? d.dd.innerHTML : '') + '</p>').classList.add('def'); });
      if(!passageAnswer(text)){ menu(); }
      return;
    }
    if(passageAnswer(text)) return;
    var weak = rankPassages(text);
    if(weak.list.length && weak.cover >= 0.34 && !weak.unknown.length){ logMiss(text); passageAnswer(text, {force:true}); return; }
    var found = searchBook(text, 3);
    if(!defs.length && !found.length){
      logMiss(text, 'nothing found');
      addMsg('bot', '<p>I couldn\'t find that in the book. Try a different word for it, or describe what you can see.</p>');
      menu();
      return;
    }
    defs.forEach(function(d){
      var m = addMsg('bot', '<p><strong>' + esc(d.name) + '</strong> — ' + (d.dd ? d.dd.innerHTML : '') + '</p>');
      m.classList.add('def');
    });
    if(found.length){
      var top = found[0];
      var snip = defs.length ? '' : snippet(top.id, text);
      var m2 = addMsg('bot', snip
        ? '<p>From <strong>' + esc(sectionLabel(top.id)) + '</strong>:</p><p>' + esc(snip) + '</p><p>More on this in:</p>'
        : '<p>' + (defs.length ? 'Read more in:' : 'These sections cover it:') + '</p>');
      addLinks(m2, found.map(function(e){ return ['#' + e.id, esc(sectionLabel(e.id))]; }));
    }
    var f = scoreFlows(text);
    var next = [];
    if(f) next.push({label: (f.kind === 'setup' ? 'Walk me through: ' : 'Troubleshoot: ') + f.title, go: function(){ addMsg('me', esc(f.title)); startFlow(f, text); }});
    next.push({label:'Ask something else', quiet:true, go: function(){ input.focus(); }});
    next.push(BACK);
    setChips(next);
  }


  /* ---- the maths, asked in plain words ----
     "delay for 30 m", "how far is 45 ms", "120 dB at 1 m, what at 32 m",
     "+4 dBu in volts", "1.23 V in dBu", "how many dB is double the power",
     "quarter wave at 606 MHz", "4 boxes of 8 ohms". Same formulas as the
     calculators in Support; the working is shown so it can be checked. */
  function num(x){ return parseFloat(String(x).replace(',', '.')); }
  function round(n, dp){ var f = Math.pow(10, dp); return Math.round(n * f) / f; }
  var C = 344; /* m/s — the figure used throughout the book */
  function calcAnswer(text){
    var t = String(text).toLowerCase().replace(/metres|meters|metre|meter/g, 'm').replace(/\s+/g, ' ');
    var m, out = null, links = [['#support-calc','Calculators']];
    if((m = /(\d+(?:[.,]\d+)?) ?(m|ft|feet|foot)\b/.exec(t)) && /\b(delay|ms|millisec|time|align)/.test(t) && !/\bms\b.*\b(how far|distance)/.test(t)){
      var d = num(m[1]); if(/ft|feet|foot/.test(m[2])) d = d * 0.3048;
      out = '<p><strong>' + round(d / C * 1000, 1) + ' ms</strong> for ' + round(d, 1) + ' m.</p><p>Sound travels about 344 m/s, so roughly 2.9 ms per metre. For a delay speaker, add a few milliseconds on top so the main PA is still heard first — and set it with the system tech.</p>';
      links.unshift(['#s6-8','6.8 System tuning']);
    }
    else if((m = /(\d+(?:[.,]\d+)?) ?ms\b/.exec(t)) && /\b(how far|distance|metres|m\b|far)/.test(t)){
      var ms = num(m[1]);
      out = '<p><strong>' + round(ms * C / 1000, 2) + ' m</strong> — the distance sound travels in ' + ms + ' ms (at about 344 m/s).</p>';
    }
    else if((m = /(\d+(?:[.,]\d+)?) ?db\w*(?: spl)? (?:at|@) ?(\d+(?:[.,]\d+)?) ?m\b.*?(\d+(?:[.,]\d+)?) ?m\b/.exec(t))){
      var L1 = num(m[1]), d1 = num(m[2]), d2 = num(m[3]);
      var L2 = L1 - 20 * Math.log10(d2 / d1);
      out = '<p><strong>About ' + round(L2, 1) + ' dB</strong> at ' + d2 + ' m (from ' + L1 + ' dB at ' + d1 + ' m).</p><p>That\'s the free-field inverse-square figure: −6 dB per doubling of distance. Indoors reflections keep it higher; a line array in its near field drops more slowly.</p>';
      links.unshift(['#s6-6','6.6 Coverage, aiming and subs']);
    }
    else if((m = /([+-]?\d+(?:[.,]\d+)?) ?dbu\b/.exec(t)) && /\bvolt|\bv\b/.test(t)){
      var dbu = num(m[1]);
      out = '<p><strong>' + round(0.775 * Math.pow(10, dbu / 20), 3) + ' V</strong> RMS for ' + dbu + ' dBu (0 dBu = 0.775 V).</p>';
      links.unshift(['#s2-2','2.2 Signal levels']);
    }
    else if((m = /([+-]?\d+(?:[.,]\d+)?) ?dbv\b/.exec(t)) && /\bvolt|\bv\b/.test(t)){
      var dbv = num(m[1]);
      out = '<p><strong>' + round(Math.pow(10, dbv / 20), 3) + ' V</strong> RMS for ' + dbv + ' dBV (0 dBV = 1 V).</p>';
      links.unshift(['#s2-2','2.2 Signal levels']);
    }
    else if((m = /(\d+(?:[.,]\d+)?) ?(?:v|volts?)\b/.exec(t)) && /\bdbu\b|\bdbv\b/.test(t)){
      var v = num(m[1]);
      out = '<p><strong>' + round(20 * Math.log10(v / 0.775), 1) + ' dBu</strong> (or ' + round(20 * Math.log10(v), 1) + ' dBV) for ' + v + ' V RMS.</p>';
      links.unshift(['#s2-2','2.2 Signal levels']);
    }
    else if(/\bdb\b/.test(t) && /\b(double|twice|half|halve|(\d+(?:[.,]\d+)?) ?(x|times))\b/.test(t) && /\b(power|watts?|voltage|volts?|spl|pressure|level|amp)/.test(t)){
      var ratio = /half|halve/.test(t) ? 0.5 : /double|twice/.test(t) ? 2 : num((/(\d+(?:[.,]\d+)?) ?(x|times)/.exec(t) || [0, 2])[1]);
      var power = /power|watt/.test(t);
      var db = (power ? 10 : 20) * Math.log10(ratio);
      out = '<p><strong>' + (db > 0 ? '+' : '') + round(db, 1) + ' dB</strong> for ' + ratio + '× the ' + (power ? 'power' : 'voltage / pressure') + '.</p><p>Power: 10 × log(ratio) — double the watts is +3 dB. Voltage or SPL pressure: 20 × log(ratio) — double is +6 dB. About +10 dB sounds twice as loud.</p>';
      links.unshift(['#s2-10','2.10 Decibels']);
    }
    else if((m = /(\d+(?:[.,]\d+)?) ?mhz\b/.exec(t)) && /\b(wave|wavelength|antenna|aerial|spacing|apart|quarter|half)/.test(t)){
      var f = num(m[1]);
      out = '<p>At ' + f + ' MHz: wavelength <strong>' + round(300 / f * 100, 1) + ' cm</strong>, quarter wave <strong>' + round(75 / f * 100, 1) + ' cm</strong>.</p><p>Diversity antennas want to be at least a quarter wavelength apart — further is better.</p>';
      links.unshift(['#s5-3','5.3 Antennas']);
    }
    else if((m = /(\d+) ?(?:boxes|speakers|cabs|cabinets|drivers)\b.*?(\d+(?:[.,]\d+)?) ?(?:ohms?|Ω)/.exec(t))){
      var n = parseInt(m[1], 10), r = num(m[2]);
      out = '<p><strong>' + round(r / n, 2) + ' Ω</strong> — ' + n + ' × ' + r + ' Ω in parallel on one amp channel.</p><p>Check that against the amp\'s minimum load and, on d&amp;b, the boxes-per-channel limits in <a href="#s6-20">§6.20</a> — the limit there wins.</p>';
      links.unshift(['#s6-20','6.20 d&amp;b models']);
    }
    if(!out) return false;
    var msg = addMsg('bot', out);
    addLinks(msg, links);
    setChips([{label:'Another sum', quiet:true, go:function(){ input.focus(); }}, BACK]);
    return true;
  }

  function guidedText(text){
    if(/^(tell me more|more|go on|more detail|more please|explain more|why\??|and\??)$/i.test(text.trim()) && g.lastAnswer && g.lastAnswer.see[0] && SECTION_LINK.test('#' + g.lastAnswer.see[0])){ peek(g.lastAnswer.see[0]); return; }
    if(calcAnswer(text)) return;
    if(TEST_Q.test(text)){ startTest(); return; }
    if(KIT_Q.test(text) && !findModels(text).some(function(e){ return !inKit(e); })){ kitCheck(); return; }
    if(COACH_Q.test(text)){ coach(); return; }
    if(offerKitFromText(text)) return;
    mergeSlots(text);
    var setupAsk = SETUP_INTENT.test(text);
    var ranked = (setupAsk && !/\b(fix|wrong|broken|faulty|not working|feeding back|feedback|hum\w*|buzz\w*|noise|muffled|distort\w*|cutting out)\b/i.test(text)) ? rankFlows(text, 'setup') : rankFlows(text, 'fix');
    if(!ranked.length) ranked = rankFlows(text);
    var f = ranked.length ? ranked[0].f : null;
    var info = INFO_INTENT.test(text.trim()) && !setupAsk;
    /* A question about d&b kit by name ("can a D20 run KSL?", "V8 vs Y8",
       "what amp does it need?") is answered from the model tables — unless
       it's really a fault report that happens to name the kit, in which case
       the kit is remembered for the report and the fault route starts. */
    var fixRanked = rankFlows(text, 'fix');
    /* "How do I route Dante?" is a how-to, not a fault — unless it says something's wrong. */
    var fixAsk = /\b(fix|wrong|broken|faulty|not working|won't|isn|stopped|no sound|silent|problem|fault|dropping|drops? out|cutting out|crackl\w*|hum\w*|buzz\w*|hiss\w*|feeding back|feedback|howl\w*|ringing|muffled|quieter|too quiet|distort\w*|noise|interference|protect\w*|boomy)\b/i.test(text);
    var faultish = fixRanked.length && fixRanked[0].s >= 1 && !info && (!setupAsk || fixAsk) && !COMPAT_Q.test(text) && !WHICH_AMP_Q.test(text) && fixRanked[0].f.id !== 'setup';
    if(!faultish && !(setupAsk && f && f.kind === 'setup' && !findModels(text).length) && modelAnswer(text)) return;
    /* A question with a written answer gets it straight away — unless it's
       really a fault report, which goes to the step-by-step route. */
    var hit = bestAnswer(text);
    /* A near-exact written answer wins unless a route matches strongly. */
    if(hit && hit.score >= 0.9 && (!f || ranked[0].s <= 2) && !(setupAsk && f && f.kind === 'setup')){ showAnswer(hit, text); return; }
    var routeTie = ranked.length > 1 && ranked[1].s === ranked[0].s;
    var weakRoute = !ranked.length || ranked[0].s <= 1 || routeTie;
    if(hit && (((!faultish || info) && (info || !f || (setupAsk && f.kind !== 'setup'))) || (weakRoute && hit.score >= 0.8 && !fixAsk && (routeTie || !(setupAsk && f && f.kind === 'setup'))))){ showAnswer(hit, text); return; }
    if(!g.symptom) g.symptom = text;
    /* Two problems in one message: start with the stronger, queue the other. */
    if(f && !info && ranked.length > 1 && ranked[1].f !== f && ranked[1].s >= 1 && /\b(and|also|plus|as well|too)\b/i.test(text) && (f.kind || 'fix') === 'fix' && (ranked[1].f.kind || 'fix') === 'fix'){
      g.queue = [ranked[1].f];
      addMsg('bot', '<p>Two things there. Starting with <strong>' + esc(f.title.toLowerCase()) + '</strong>, then <strong>' + esc(ranked[1].f.title.toLowerCase()) + '</strong>.</p>', 'note');
      startFlow(f, text);
      return;
    }
    /* A question that isn't reporting a fault ("how do I check polarity…",
       "what is power alley…") is answered from the book unless a set-up route
       was clearly asked for, or a route matches strongly. */
    var knowledgeQ = !fixAsk && (info || /^(how|why|what|which|when|where|can|could|should|is|are|does|do|will|would)\b/i.test(text.trim()) || /\?\s*$/.test(text) || /\b(can|could|should) (i|we)\b/i.test(text));
    var routeAsked = f && f.kind === 'setup' && /\b(set ?up|setting up|configure|install|connect|walk me through)\b/i.test(text) && ranked[0].s >= 1;
    if(knowledgeQ && !routeAsked){
      /* A close written answer first; a loose one only if the book has
         nothing better. */
      if(hit && hit.score >= 0.75){ showAnswer(hit, text); return; }
      if(bookAnswer(text)) return;
      if(hit){ showAnswer(hit, text); return; }
    }
    if(f && !info && ranked.length > 1 && ranked[1].s === ranked[0].s){
      addMsg('bot', '<p>That could be a couple of things — which is closer?</p>');
      setChips(ranked.slice(0, 3).map(function(r){
        return {label: r.f.title, go: function(){ addMsg('me', esc(r.f.title)); startFlow(r.f, text); }};
      }).concat(hit ? [{label:'Answer: ' + hit.e.q, go: function(){ addMsg('me', esc(hit.e.q)); showAnswer(hit, text); }}] : []).concat([{label:'Neither — look it up', quiet:true, go: function(){ answerInfo(text); }}]));
      return;
    }
    if(f && !info){ startFlow(f, text); return; }
    if(!f && setupAsk){
      var found = searchBook(text, 3);
      var m = addMsg('bot', found.length ? '<p>I don\'t have a step-by-step for that one in here, but these sections cover it:</p>' : '<p>What are you setting up? Pick the closest:</p>');
      addLinks(m, found.map(function(e){ return ['#' + e.id, esc(sectionLabel(e.id))]; }));
      setChips(starterChips(SETUP_STARTERS).concat([BACK]));
      return;
    }
    answerInfo(text);
  }

  /* ---- shared plumbing ---- */
  function safetyNote(){
    var m = addMsg('bot', '<p><strong>Stop and make it safe first.</strong> Mute or stop, keep people clear, isolate power at the source only if that\'s yours to do, and get the responsible person. Then come back to the fault.</p>', 'warn');
    addLinks(m, [['#support-now','Make it safe']]);
  }
  function reset(){
    log.innerHTML = '';
    storeRemove(LOG_STORE);
    g = {flow:null, node:null, steps:[], symptom:'', slots:{}, trail:[], models:[], queue:[], lastQ:'', test:null};
    greet();
  }
  resetBtn.addEventListener('click', reset);

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var text = input.value.trim();
    if(!text) return;
    storeSet('treebysound-first-ask', '1');
    if(window.tbFirstRunSync) window.tbFirstRunSync();
    input.value = '';
    input.style.height = '';
    if(g.test && !DANGER.test(text)){
      if(g.test.awaiting === 'kit'){ addMsg('me', esc(text)); window.tbSysTest.setField('kit', text); g.test.awaiting = 'step'; setChips([]); askStep(); return; }
      if(g.test.awaiting === 'note'){ addMsg('me', esc(text)); var ix = g.test.step; window.tbSysTest.set(ix, 'fail', text); g.test.awaiting = 'step'; setChips([]); afterFail(ix); return; }
      var tn = text.trim().toLowerCase();
      if(/^(pass(ed)?|ok(ay)?|yes|yep|good|fine|done|all good|checked|tick)\b/.test(tn)){ setChips([]); answerStep('pass'); return; }
      if(/^(skip|n\/?a|not needed|not applicable|none)\b/.test(tn)){ setChips([]); answerStep('na'); return; }
      if(/^(fail(ed)?|no|nope|not (ok|right|working))\b/.test(tn)){
        var rest = text.replace(/^\s*(fail(ed)?|no|nope|not (ok|right|working))[\s,:—-]*/i, '').trim();
        setChips([]); answerStep('fail', rest || undefined); return;
      }
      if(/^(pause|stop)( the)? test\b/.test(tn)){ addMsg('me', esc(text)); g.test = null; addMsg('bot', '<p>Paused — your answers are saved.</p>'); menu(); return; }
    }
    var chip = !DANGER.test(text) && matchChip(text);
    if(chip){ setChips([]); chip.go(); return; }
    addMsg('me', esc(text));
    if(g.flow) mergeSlots(text);
    setChips([]);
    if(DANGER.test(text)){
      safetyNote();
      var safeHit = bestAnswer(text);
      if(safeHit && safeHit.score >= 0.7){ showAnswer(safeHit, text); return; }
      addMsg('bot', '<p>Once it\'s safe and the right person knows, tell me what you found — or pick:</p>');
      setChips(starterChips(['power','limit']).concat([BACK]));
      return;
    }
    guidedText(text);
  });
  input.addEventListener('keydown', function(ev){
    if(ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing){ ev.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', {cancelable:true})); }
  });
  input.addEventListener('input', function(){
    input.style.height = '';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  });

  /* The "what's going on?" box on Home: jump to the fault finder and ask it
     there. */
  var homeAsk = document.getElementById('homeAsk');
  var homeAskInput = document.getElementById('homeAskInput');
  function askFromHome(text){
    location.hash = '#ask';
    setTimeout(function(){
      reset();
      if(text){
        input.value = text;
        if(form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', {cancelable:true}));
      } else {
        input.focus();
      }
    }, 120);
  }
  if(homeAsk){
    homeAsk.addEventListener('submit', function(ev){
      ev.preventDefault();
      var text = (homeAskInput.value || '').trim();
      homeAskInput.value = '';
      askFromHome(text);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#homeAsk [data-ask], #firstRun [data-ask]'), function(b){
      b.addEventListener('click', function(){ askFromHome(b.getAttribute('data-ask')); });
    });
  }

  if(restoreLog()) menu(); else greet();
})();