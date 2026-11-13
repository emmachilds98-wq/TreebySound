"use strict";

/* ---------- storage helpers (per-viewer, local to this file) ---------- */
function storeGet(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
function storeSet(key,val){ try{ localStorage.setItem(key,val); }catch(e){} }
function storeRemove(key){ try{ localStorage.removeItem(key); }catch(e){} }

/* ---------- screen-reader announcements ----------
   A shared polite live region for actions whose only feedback is visual
   (ticks cleared, a backup written). Sighted users see the change; this makes
   sure someone using a screen reader hears that something happened. */
var srLive = null;
function announce(msg){
  if(!msg) return;
  if(!srLive){
    srLive = document.createElement('div');
    srLive.className = 'sr-only';
    srLive.setAttribute('role','status');
    srLive.setAttribute('aria-live','polite');
    document.body.appendChild(srLive);
  }
  srLive.textContent = '';
  setTimeout(function(){ srLive.textContent = msg; }, 40);
}

/* One-time migration from the early storage prefix. Move any saved settings,
   notes and checklists across to the TreebySound prefix so nothing is lost.
   TreebySound is now the only name shown in the app. */
(function migrateOldStorageKeys(){
  try{
    var toMove = [];
    for(var i=0;i<localStorage.length;i++){
      var k = localStorage.key(i);
      if(k && k.indexOf('noisebook-') === 0){ toMove.push(k); }
    }
    toMove.forEach(function(oldKey){
      var newKey = 'treebysound-' + oldKey.slice('noisebook-'.length);
      if(storeGet(newKey) === null){ storeSet(newKey, localStorage.getItem(oldKey)); }
      storeRemove(oldKey);
    });
  }catch(e){}
})();

/* ---------- build the table of contents from the actual document ---------- */
var toc = document.getElementById('toc');
var parts = Array.prototype.slice.call(document.querySelectorAll('main > .part'));
var sectionIndex = []; // {id, title, body, norm, li, details}

/* An index entry's searchable text is only read from the page the first time
   something searches — reading and lower-casing every word of the book at
   start-up was the single biggest cost of opening the app, for a search most
   visits never make. The personal notes box appended to each section is left
   out, as it always was. */
function indexEntry(sec, title, li, details){
  var body = null, flat = null;
  var entry = {id: sec.id, title: title.toLowerCase(), li: li, details: details};
  Object.defineProperty(entry, 'body', {enumerable: true, get: function(){
    if(body === null){
      var t = sec.textContent || '';
      var note = sec.lastElementChild;
      if(note && note.classList.contains('notefield')) t = t.slice(0, t.length - (note.textContent || '').length);
      body = t.toLowerCase();
    }
    return body;
  }});
  Object.defineProperty(entry, 'norm', {enumerable: true, get: function(){
    if(flat === null) flat = normText(title + ' ' + entry.body);
    return flat;
  }});
  return entry;
}

/* The library is grouped by the question a person has, not just a textbook order. */
var TOC_GROUPS = {
  'p0':'Start here',
  'p1':'Learn the job',
  'p2':'Learn core audio',
  'p5':'Systems & specialist skills',
  'p9':'Working with other teams',
  'p10':'Learn event landscape',
  'p11':'Check, fix & work safe',
  'p14':'Operate & develop your craft',
  'p17':'Career, learning & reference',
  'p19':'Field tools',
  'p21':'Beyond live audio'
};
var TOC_BADGES = { 'p11': 'before doors', 'p12': 'when it breaks', 'p19': 'use on site' };

/* ---------- the four app screens are part of the book, so index them too ----------
   Home, Job Hub, Support and the learning pathway hold real material — the job
   workspace, the calculators, the reading plan, the quarterly review — and all of
   it has to be reachable from the contents tree and from search, exactly like a
   library part. Each screen becomes one branch of the tree, with its own sections
   underneath. */
var APP_SCREENS = [
  {id:'hub',     group:'Inside each screen', label:'Home',        glyph:'\u2302'},
  {id:'ask',     group:null,            label:'Ask',              glyph:'?', toc:false},
  {id:'job',     group:null,            label:'Job Hub',          glyph:'\u25C9'},
  {id:'support', group:null,            label:'Support',          glyph:'\u26A1'},
  {id:'path',    group:null,            label:'Learning pathway', glyph:'\u2197'},
  {id:'library', group:null,            label:'Library',          glyph:'\u25A4', toc:false}
];
var SCREEN_IDS = [];
(function indexScreens(){
  APP_SCREENS.forEach(function(screen){
    var el = document.getElementById(screen.id);
    if(!el) return;
    SCREEN_IDS.push(screen.id);
    /* The Library screen is a browsable index of the parts, and the contents
       tree immediately below it lists those same parts already — giving it its
       own branch would just say everything twice. */
    if(!toc || screen.toc === false) return;
    var screenSections = Array.prototype.slice.call(el.querySelectorAll('section.hub-section'));
    if(!screenSections.length) return;

    if(screen.group){
      var groupHeader = document.createElement('div');
      groupHeader.className = 'toc-group';
      groupHeader.textContent = screen.group;
      toc.appendChild(groupHeader);
    }

    var details = document.createElement('details');
    details.dataset.part = screen.id;
    var summary = document.createElement('summary');
    var numSpan = document.createElement('span');
    numSpan.className = 'n';
    numSpan.textContent = screen.glyph;
    summary.appendChild(numSpan);
    summary.appendChild(document.createTextNode(screen.label));
    details.appendChild(summary);

    var ul = document.createElement('ul');
    screenSections.forEach(function(sec){
      if(!sec.id) return;
      var h3 = sec.querySelector('h3');
      if(!h3) return;
      var title = h3.textContent.trim();
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + sec.id;
      a.textContent = title;
      li.appendChild(a);
      ul.appendChild(li);
      sectionIndex.push(indexEntry(sec, title, li, details));
    });
    details.appendChild(ul);
    toc.appendChild(details);
  });
})();

parts.forEach(function(part){
  var partNum = part.querySelector('.part-num');
  var partTitle = part.querySelector('.part-head h2');
  if(!partNum || !partTitle) return;

  if(TOC_GROUPS[part.id]){
    var groupHeader = document.createElement('div');
    groupHeader.className = 'toc-group';
    groupHeader.textContent = TOC_GROUPS[part.id];
    toc.appendChild(groupHeader);
  }

  var details = document.createElement('details');
  details.dataset.part = part.id;
  var summary = document.createElement('summary');
  var numSpan = document.createElement('span');
  numSpan.className = 'n';
  numSpan.textContent = partNum.textContent.replace('PART','').trim();
  summary.appendChild(numSpan);
  summary.appendChild(document.createTextNode(partTitle.textContent));
  if(TOC_BADGES[part.id]){
    var badge = document.createElement('span');
    badge.className = 'toc-badge';
    badge.textContent = TOC_BADGES[part.id];
    summary.appendChild(badge);
  }
  details.appendChild(summary);

  var ul = document.createElement('ul');
  var sections = Array.prototype.slice.call(part.querySelectorAll('section.s'));

  sections.forEach(function(sec){
    var h3 = sec.querySelector('h3');
    if(!h3) return;
    var nSpan = h3.querySelector('.n');
    var num = nSpan ? nSpan.textContent : '';
    var title = h3.textContent.replace(num,'').trim();

    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + sec.id;
    var aN = document.createElement('span');
    aN.className = 'n';
    aN.textContent = num;
    a.appendChild(aN);
    a.appendChild(document.createTextNode(title));
    li.appendChild(a);
    ul.appendChild(li);

    sectionIndex.push(indexEntry(sec, title, li, details));

    /* personal notes field — appended to every section, saved per-viewer in this browser only */
    var note = document.createElement('details');
    note.className = 'notefield';
    var noteSummary = document.createElement('summary');
    noteSummary.textContent = 'My notes';
    note.appendChild(noteSummary);
    var noteArea = document.createElement('textarea');
    noteArea.placeholder = 'Private notes for this section — kit quirks, venue specifics, reminders. Saved only in this browser, never sent anywhere.';
    /* a placeholder is not an accessible name — every notes box says which
       section it belongs to, so it isn't just "edit text" 195 times over */
    noteArea.setAttribute('aria-label', 'My notes for ' + (num ? num + ' ' : '') + title);
    note.appendChild(noteArea);
    var savedMark = document.createElement('div');
    savedMark.className = 'savedmark';
    savedMark.textContent = 'Saved';
    note.appendChild(savedMark);
    sec.appendChild(note);

    var noteKey = 'treebysound-note-' + sec.id;
    var savedNote = storeGet(noteKey);
    if(savedNote){ noteArea.value = savedNote; note.open = true; }
    var noteTimer = null;
    noteArea.addEventListener('input', function(){
      if(noteArea.value){ storeSet(noteKey, noteArea.value); } else { storeRemove(noteKey); }
      savedMark.classList.add('show');
      clearTimeout(noteTimer);
      noteTimer = setTimeout(function(){ savedMark.classList.remove('show'); }, 1400);
    });
  });

  details.appendChild(ul);
  toc.appendChild(details);
});

/* ---------- the Library browse screen ----------
   Built from the parts in the document rather than written out by hand: every
   card takes its number, title and standfirst from the part itself, and its
   group heading and badge from the same tables the contents tree uses. Add a
   part to the book and it appears here with no second copy to keep in step. */
(function buildLibraryIndex(){
  var host = document.getElementById('libraryIndex');
  if(!host) return;
  var grid = null;
  parts.forEach(function(part){
    var num = part.querySelector('.part-num');
    var title = part.querySelector('.part-head h2');
    if(!num || !title) return;
    var lead = part.querySelector('.part-head p');
    var count = part.querySelectorAll('section.s').length;

    if(TOC_GROUPS[part.id] || !grid){
      var band = document.createElement('section');
      band.className = 'library-band';
      var h = document.createElement('h4');
      h.className = 'library-group';
      h.textContent = TOC_GROUPS[part.id] || 'More';
      band.appendChild(h);
      grid = document.createElement('div');
      grid.className = 'library-grid';
      band.appendChild(grid);
      host.appendChild(band);
    }

    var card = document.createElement('a');
    card.className = 'library-card';
    card.href = '#' + part.id;

    var top = document.createElement('span');
    top.className = 'library-card-top';
    var n = document.createElement('span');
    n.className = 'library-num';
    n.textContent = num.textContent.replace('PART', '').trim();
    top.appendChild(n);
    if(TOC_BADGES[part.id]){
      var badge = document.createElement('span');
      badge.className = 'library-badge';
      badge.textContent = TOC_BADGES[part.id];
      top.appendChild(badge);
    }
    card.appendChild(top);

    var t = document.createElement('strong');
    t.textContent = title.textContent;
    card.appendChild(t);

    if(lead){
      var p = document.createElement('span');
      p.className = 'library-lead';
      p.textContent = lead.textContent;
      card.appendChild(p);
    }

    var meta = document.createElement('span');
    meta.className = 'library-meta';
    meta.textContent = count ? count + (count === 1 ? ' section' : ' sections') : 'Reference';
    card.appendChild(meta);

    grid.appendChild(card);
  });
})();

/* ---------- search ---------- */
var searchBox = document.getElementById('q');
var hits = document.getElementById('hits');

function normText(s){ return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }

function runSearch(){
  var q = (searchBox.value || '').trim().toLowerCase();
  if(!q){
    sectionIndex.forEach(function(entry){ entry.li.style.display = ''; });
    hits.textContent = '';
    return;
  }
  /* space/punctuation-insensitive fallback so "48v" finds "+48 V",
     "linecheck" finds "line check", etc. */
  var qn = normText(q);
  var matchCount = 0;
  var openDetails = {};
  sectionIndex.forEach(function(entry){
    var match = entry.title.indexOf(q) !== -1 || entry.body.indexOf(q) !== -1 || (qn && entry.norm.indexOf(qn) !== -1);
    entry.li.style.display = match ? '' : 'none';
    if(match){
      matchCount++;
      openDetails[Array.prototype.indexOf.call(toc.children, entry.details)] = entry.details;
    }
  });
  Array.prototype.forEach.call(toc.querySelectorAll('details'), function(d){
    var idx = Array.prototype.indexOf.call(toc.children, d);
    if(openDetails[idx]){ d.open = true; } else { d.open = false; }
  });
  hits.textContent = matchCount === 0 ? 'No matches' : (matchCount + ' section' + (matchCount === 1 ? '' : 's'));
}

if(searchBox){
  searchBox.addEventListener('input', runSearch);
  document.addEventListener('keydown', function(e){
    var ae = document.activeElement;
    var typing = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable);
    /* "/" is the documented jump-to-search shortcut. Search lives inside the
       contents sheet, which is hidden until opened — so open it AND focus,
       rather than trying to focus a display:none input. */
    if(e.key === '/' && !typing){
      e.preventDefault();
      if(typeof openContentsSheet === 'function'){ openContentsSheet(true); }
    }
  });
}

/* ---------- how-to guides — full A-Z (auto-built from the book itself) ---------- */
(function(){
  var container = document.getElementById('howtoAZList');
  if(!container) return;
  var items = [];
  Array.prototype.forEach.call(document.querySelectorAll('section.s'), function(sec){
    if(!sec.querySelector('ol.seq')) return;
    var h3 = sec.querySelector('h3');
    if(!h3) return;
    var nSpan = h3.querySelector('.n');
    var num = nSpan ? nSpan.textContent : '';
    var title = h3.textContent.replace(num, '').trim();
    items.push({ id: sec.id, num: num, title: title });
  });
  items.sort(function(a,b){ return a.title.toLowerCase().localeCompare(b.title.toLowerCase()); });
  items.forEach(function(it){
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + it.id;
    a.textContent = '§' + it.num + ' ' + it.title;
    li.appendChild(a);
    container.appendChild(li);
  });
})();

/* ---------- glossary — by area (auto-built from the A-Z, so it can't drift) ---------- */
(function(){
  var container = document.getElementById('glossaryByArea');
  if(!container) return;
  var PART_AREA = {
    '1':'The job itself', '2':'Signal & fundamentals', '3':'Cables, connectors & power',
    '4':'Microphones', '5':'Wireless & RF', '6':'Loudspeakers & systems', '7':'Mixing consoles',
    '8':'Software & networking', '9':'Other departments & Titan', '10':'Different worlds',
    '11':'Line check & system check', '12':'Fault-finding', '13':'Safety, regulations & paperwork',
    '14':'Recording & broadcast', '15':'Monitor world & IEMs', '16':'Mixing craft',
    '17':'Career & freelancing', '21':'Beyond live audio'
  };
  var CONSERVATION = 'Conservation & bioacoustics';
  /* a few terms belong to a topic rather than to the part they happen to sit in */
  var SECTION_AREA = { 's18-15':CONSERVATION, 'hub-conservation':CONSERVATION };
  var CATCH_ALL = 'Reference & toolkit';
  var AREA_ORDER = ['The job itself','Signal & fundamentals','Cables, connectors & power','Microphones',
    'Wireless & RF','Loudspeakers & systems','Mixing consoles','Software & networking',
    'Other departments & Titan','Different worlds','Line check & system check','Fault-finding',
    'Safety, regulations & paperwork','Recording & broadcast','Monitor world & IEMs','Mixing craft',
    'Career & freelancing', 'Beyond live audio', CONSERVATION, CATCH_ALL];

  var entries = document.querySelectorAll('#s20-1 .glossary > div');
  var groups = {};
  Array.prototype.forEach.call(entries, function(entry){
    var link = entry.querySelector('dd a[href^="#"]');
    var area = CATCH_ALL;
    if(link){
      var href = link.getAttribute('href').slice(1);
      if(SECTION_AREA[href]){
        area = SECTION_AREA[href];
      } else {
        var m = href.match(/^s(\d+)-\d+$/) || href.match(/^p(\d+)$/);
        if(m && PART_AREA[m[1]]){ area = PART_AREA[m[1]]; }
      }
    }
    if(!groups[area]) groups[area] = [];
    groups[area].push(entry.cloneNode(true));
  });

  AREA_ORDER.forEach(function(area){
    if(!groups[area] || !groups[area].length) return;
    var h4 = document.createElement('h4');
    h4.textContent = area;
    container.appendChild(h4);
    var glossDiv = document.createElement('dl');
    glossDiv.className = 'glossary';
    groups[area].forEach(function(node){ glossDiv.appendChild(node); });
    container.appendChild(glossDiv);
  });
})();

/* ---------- active section highlighting while scrolling ---------- */
var allSectionEls = sectionIndex.map(function(e){ return document.getElementById(e.id); }).filter(Boolean);
var linkById = {};
sectionIndex.forEach(function(e){ linkById[e.id] = e.li.querySelector('a'); });

var currentActive = null;
function setActive(id){
  if(currentActive === id) return;
  currentActive = id;
  Array.prototype.forEach.call(toc.querySelectorAll('a.on'), function(a){ a.classList.remove('on'); a.removeAttribute('aria-current'); });
  var link = linkById[id];
  if(!link) return;
  link.classList.add('on');
  link.setAttribute('aria-current', 'location');
  var details = link.closest('details');
  if(details && !details.open) details.open = true;
  if(typeof link.scrollIntoView === 'function' && toc.scrollHeight > toc.clientHeight){
    var linkRect = link.getBoundingClientRect();
    var tocRect = toc.getBoundingClientRect();
    if(linkRect.top < tocRect.top || linkRect.bottom > tocRect.bottom){
      link.scrollIntoView({block:'center'});
    }
  }
}

if('IntersectionObserver' in window && allSectionEls.length){
  var observer = new IntersectionObserver(function(entries){
    var best = null, bestTop = Infinity;
    entries.forEach(function(en){
      if(en.isIntersecting && en.boundingClientRect.top < bestTop){
        bestTop = en.boundingClientRect.top;
        best = en.target.id;
      }
    });
    if(best) setActive(best);
  }, {rootMargin: '-10% 0px -70% 0px', threshold: [0, 1]});
  allSectionEls.forEach(function(el){ observer.observe(el); });
}

/* ---------- "next part" navigation card at the end of every part ---------- */
parts.forEach(function(part, i){
  var col = part.querySelector('.col');
  if(!col) return;
  var wrap = document.createElement('div');
  wrap.className = 'col part-next';
  var card = document.createElement('div');
  card.className = 'part-next-card';
  var next = parts[i + 1];
  if(next){
    var nextTitle = next.querySelector('.part-head h2');
    var nextNum = next.querySelector('.part-num');
    card.innerHTML = '<a class="part-next-link" href="#' + next.id + '">' +
      '<span><span class="part-next-eyebrow">Next — ' + (nextNum ? nextNum.textContent.replace('PART','Part') : '') + '</span><strong>' + (nextTitle ? nextTitle.textContent : '') + '</strong></span>' +
      '<span class="arrow" aria-hidden="true">→</span></a>';
  } else {
    card.innerHTML = '<a class="part-next-link" href="#hub">' +
      '<span><span class="part-next-eyebrow">That’s the whole library</span><strong>Back to your home hub</strong></span>' +
      '<span class="arrow" aria-hidden="true">→</span></a>';
  }
  wrap.appendChild(card);
  part.appendChild(wrap);
});

/* ---------- library navigation: one screen on view at a time ----------
   TreebySound shows either the home screen (hero + hub) or a single Part —
   never the whole book stacked as one long scroll. Every existing internal
   link (§ references, the glossary, quickfab, the bottom bar, the TOC) keeps
   working exactly as written: it still just sets location.hash, and this
   router decides which screen that hash belongs to, shows it, and scrolls
   to the right spot inside it. Nothing is removed from the page — search,
   the glossary and checklists still see every part regardless of which
   screen is currently on view. Printing (see @media print) shows everything
   at once, same as before. */
var heroEl = document.querySelector('.hero');
var screenEls = SCREEN_IDS.map(function(id){ return document.getElementById(id); }).filter(Boolean);
var partIds = parts.map(function(p){ return p.id; });
var partNav = document.getElementById('partNav');
var partNavAll = document.getElementById('partNavAll');
var partNavPrev = document.getElementById('partNavPrev');
var partNavNext = document.getElementById('partNavNext');
var partNavNum = document.getElementById('partNavNum');
var partNavTitle = document.getElementById('partNavTitle');
var currentScreen = null;

/* ---------- pick up where you left off ----------
   Home offers the last library part that was actually opened, so the app has a
   way back into the book that does not need you to remember where you were. */
var LAST_PART_KEY = 'treebysound-last-part';
function rememberLastPart(id){
  if(partIds.indexOf(id) === -1) return;
  storeSet(LAST_PART_KEY, id);
}
function refreshContinueCard(){
  var card = document.getElementById('homeContinue');
  var label = document.getElementById('homeContinueTitle');
  if(!card || !label) return;
  var id = storeGet(LAST_PART_KEY);
  var part = id ? document.getElementById(id) : null;
  if(!part || partIds.indexOf(id) === -1){ card.hidden = true; return; }
  var num = part.querySelector('.part-num');
  var title = part.querySelector('.part-head h2');
  if(!title){ card.hidden = true; return; }
  var prefix = num ? num.textContent.replace('PART', 'Part').trim() + ' \u2014 ' : '';
  label.textContent = prefix + title.textContent;
  card.setAttribute('href', '#' + id);
  card.hidden = false;
}

function goTo(id){
  var h = '#' + id;
  if(location.hash === h){ navigateTo(h); } else { location.hash = h; }
}
if(partNavAll){ partNavAll.addEventListener('click', function(){ closeAllPanels(); goTo('library'); }); }
if(partNavPrev){ partNavPrev.addEventListener('click', function(){
  var idx = partIds.indexOf(currentScreen);
  if(idx > 0) goTo(partIds[idx - 1]);
}); }
if(partNavNext){ partNavNext.addEventListener('click', function(){
  var idx = partIds.indexOf(currentScreen);
  if(idx > -1 && idx < partIds.length - 1) goTo(partIds[idx + 1]);
}); }

/* ---------- top-nav active section ----------
   Each nav item owns a run of parts, matching the groups the library itself
   uses. Parts with no nav home (field tools, glossary) simply highlight
   nothing rather than mislabelling where you are. */
var NAV_FOR_SCREEN = {
  p1:'p1',
  p2:'p2', p3:'p2', p4:'p2',
  p5:'p5', p6:'p5', p7:'p5', p8:'p5', p9:'p9', p10:'p10',
  p11:'p11', p12:'p11', p13:'p11',
  p14:'p14', p15:'p14', p16:'p14',
  p17:'p17', p18:'p17'
};
/* Two independent runs of navigation share one [data-nav] attribute: the four
   app screens (bottom bar, app bar, sidebar) and the library route chips. A part
   lights a route chip; a screen lights its own destination. */
function syncNavActive(screenId){
  var dest = SCREEN_IDS.indexOf(screenId) > -1 ? screenId : 'library';
  var route = NAV_FOR_SCREEN[screenId] || null;
  Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function(el){
    var v = el.getAttribute('data-nav');
    var on = (!!dest && v === dest) || (!!route && v === route);
    el.classList.toggle('on', on);
    if(on) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
}

function activateScreen(id){
  if(!id || (SCREEN_IDS.indexOf(id) === -1 && partIds.indexOf(id) === -1)) id = 'hub';
  if(id === currentScreen) return currentScreen;
  currentScreen = id;
  if(heroEl) heroEl.classList.remove('tb-active');
  screenEls.forEach(function(el){ el.classList.remove('tb-active'); });
  parts.forEach(function(p){ p.classList.remove('tb-active'); });
  if(SCREEN_IDS.indexOf(id) > -1){
    var screen = document.getElementById(id);
    if(screen) screen.classList.add('tb-active');
    /* the masthead belongs to Home alone; the other screens carry their own head */
    if(id === 'hub' && heroEl) heroEl.classList.add('tb-active');
    if(partNav) partNav.classList.remove('on');
    if(id === 'hub') refreshContinueCard();
  } else {
    rememberLastPart(id);
    var part = document.getElementById(id);
    if(part) part.classList.add('tb-active');
    var idx = partIds.indexOf(id);
    if(partNav && part){
      partNav.classList.add('on');
      var num = part.querySelector('.part-num');
      var title = part.querySelector('.part-head h2');
      if(partNavNum) partNavNum.textContent = num ? num.textContent.replace('PART','Part') : '';
      if(partNavTitle) partNavTitle.textContent = title ? title.textContent : '';
      if(partNavPrev) partNavPrev.disabled = idx <= 0;
      if(partNavNext) partNavNext.disabled = idx === -1 || idx >= partIds.length - 1;
    }
  }
  syncNavActive(id);
  pingToc(id);
  document.body.setAttribute('data-screen', id);
  document.body.toggleAttribute('data-reading', SCREEN_IDS.indexOf(id) === -1);
  if(id === 'ask'){ window.scrollTo(0, 0); setTimeout(function(){ if(window.tbSizeAsk) window.tbSizeAsk(); var l = document.getElementById('chatLog'); if(l) l.scrollTop = l.scrollHeight; }, 60); }
  return currentScreen;
}

/* When a quick-access button (or any link) jumps to a part, open and flash
   that part's own branch in the contents tree, so it's obvious what's
   underneath where you just landed, without hunting for it by hand. */
function pingToc(id){
  if(!toc) return;
  var target = toc.querySelector('details[data-part="' + id + '"]');
  if(!target) return;
  target.open = true;
  /* Scroll the branch's own heading to the top of the tree, not just the
     branch's nearest edge — a long branch (a big part, or one sitting below
     another that's open) can otherwise land with its heading scrolled past,
     leaving you looking at an unlabelled middle of someone else's section
     list with no clue whose branch it is. A smooth scroll fired before the
     very first paint (a page loaded straight onto a deep link) is silently
     dropped by some browsers, so the first call jumps instantly and only
     later ones animate — and either way, wait a frame so the tree has
     actually taken its layout height before measuring where to scroll it. */
  var behavior = pingToc.hasRun ? 'smooth' : 'auto';
  pingToc.hasRun = true;
  /* Restart the highlight on the next frame rather than by reading
     offsetWidth, which forced a layout of the entire book on every visit. */
  target.classList.remove('toc-ping');
  requestAnimationFrame(function(){ target.classList.add('toc-ping'); });
  /* On a phone the tree lives in a closed sheet with no height, so there is
     nothing to scroll — skip the measuring, which would force a layout. */
  var railNode = document.getElementById('rail');
  if(!railIsPersistent() && !(railNode && railNode.classList.contains('sheet-open'))) return;
  requestAnimationFrame(function(){
    var heading = target.querySelector('summary') || target;
    if(typeof heading.scrollIntoView === 'function' && toc.scrollHeight > toc.clientHeight){
      heading.scrollIntoView({block:'start', behavior: behavior});
    }
  });
}

function navigateTo(hash, opts){
  opts = opts || {};
  var id = (hash || '').replace(/^#/, '');
  var target = id ? document.getElementById(id) : null;
  var screenId = 'hub';
  if(target){
    var host = target.closest('.part, .hub');
    if(host && host.id) screenId = host.id;
  }
  var wasScreen = currentScreen;
  activateScreen(screenId);
  var smooth = wasScreen === screenId && !opts.initial;
  var doScroll = function(){
    if(!target || target.id === 'hub'){
      window.scrollTo({top: 0, behavior: smooth ? 'smooth' : 'auto'});
    } else {
      /* Keep the linked heading in the reading area, not pressed against the top. */
      var readingOffset = Math.max(86, Math.round(window.innerHeight * 0.30));
      var destination = window.scrollY + target.getBoundingClientRect().top - readingOffset;
      window.scrollTo({top: Math.max(0, destination), behavior: smooth ? 'smooth' : 'auto'});
      target.classList.remove('anchor-target');
      void target.offsetWidth;
      target.classList.add('anchor-target');
      clearTimeout(navigateTo.anchorTimer);
      navigateTo.anchorTimer = setTimeout(function(){ target.classList.remove('anchor-target'); }, 1700);
    }
    if(target && linkById[target.id]) setActive(target.id);
  };
  if(wasScreen !== screenId){
    requestAnimationFrame(function(){ requestAnimationFrame(doScroll); });
  } else {
    doScroll();
  }
}

window.addEventListener('hashchange', function(){ navigateTo(location.hash); });
navigateTo(location.hash || '#hub', {initial: true});

/* ---------- appearance: palette, low-light, brightness, name ----------
   This book never follows the phone or browser's system dark-mode setting —
   it always opens in the bright default look, and low-light mode is only
   ever switched on by the person themselves, from this panel. Everything
   here is per-device (localStorage) and nothing is sent anywhere. */
var PALETTE_KEY = 'treebysound-palette';
var LOWLIGHT_KEY = 'treebysound-lowlight';
var CONTRAST_KEY = 'treebysound-high-contrast';
var BRIGHT_KEY = 'treebysound-bright';
var NAME_KEY = 'treebysound-name';
var LAYOUT_KEY = 'treebysound-layout';
var FORCEDESK_KEY = 'treebysound-forcedesktop';
var root = document.documentElement;

/* keep the browser/OS chrome colour matched to the current surface */
function updateThemeColor(){
  var meta = document.getElementById('themeColorMeta');
  if(!meta) return;
  /* Read on the next frame: asking for a computed colour straight away forces
     the browser to restyle the whole book on the spot, mid start-up. */
  cancelAnimationFrame(updateThemeColor.raf);
  updateThemeColor.raf = requestAnimationFrame(function(){
    try{
      var bg = getComputedStyle(document.body).backgroundColor;
      if(bg) meta.setAttribute('content', bg);
    }catch(e){}
  });
}
function applyPalette(p){
  if(p && p !== 'classic'){ root.setAttribute('data-palette', p); }
  else { root.removeAttribute('data-palette'); }
  updateThemeColor();
}
function applyLowlight(on){
  if(on){ root.setAttribute('data-theme','dark'); } else { root.removeAttribute('data-theme'); }
  updateThemeColor();
}
function applyHighContrast(on){
  if(on){ root.setAttribute('data-contrast','high'); } else { root.removeAttribute('data-contrast'); }
  updateThemeColor();
}
function applyBright(v){
  root.style.setProperty('--bright', (v/100).toString());
  root.classList.toggle('tb-dimmed', Number(v) !== 100);
}
function applyLayout(v){
  root.setAttribute('data-layout', v === 'app' ? 'app' : 'book');
}

var savedPalette = storeGet(PALETTE_KEY) || 'classic';
var savedLowlight = storeGet(LOWLIGHT_KEY) === '1';
var savedHighContrast = storeGet(CONTRAST_KEY) === '1';
var savedBright = parseInt(storeGet(BRIGHT_KEY), 10); if(isNaN(savedBright)) savedBright = 100;
var savedName = storeGet(NAME_KEY) || '';
var savedLayout = storeGet(LAYOUT_KEY) || 'app';
applyPalette(savedPalette);
applyLowlight(savedLowlight);
applyHighContrast(savedHighContrast);
applyBright(savedBright);
applyLayout(savedLayout);
updateThemeColor();

var heroEyebrow = document.getElementById('heroEyebrow');
function applyName(n){
  if(heroEyebrow){
    heroEyebrow.textContent = n ? ('Field handbook · edition one · ' + n + '’s copy') : 'Field handbook · edition one';
  }
}
applyName(savedName);

/* ---------- panel plumbing (appearance sheet, contents sheet, job menu) ---------- */
var sheetOverlay = document.getElementById('sheetOverlay');
var appearancePanel = document.getElementById('appearancePanel');
var railEl = document.getElementById('rail');
var quickfabMenuEl = document.getElementById('quickfabMenu');

/* ---------- modal focus handling ----------
   When a sheet opens over the page it becomes a modal dialog: focus moves into
   it, Tab is kept inside it, and closing returns focus to whatever opened it.
   Without this a keyboard or screen-reader user tabs straight out of an open
   sheet into the page behind, which is disorientating and hard to recover from. */
var activeModal = null;
var modalOpener = null;

function focusablesIn(container){
  if(!container) return [];
  var nodes = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])');
  return Array.prototype.filter.call(nodes, function(el){
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
  });
}
function setModal(el, label){
  activeModal = el || null;
  if(!el) return;
  el.setAttribute('aria-modal','true');
  if(label && !el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
  if(el === railEl) el.setAttribute('role','dialog');
}
function clearModal(){
  if(activeModal){
    activeModal.removeAttribute('aria-modal');
    if(activeModal === railEl) railEl.removeAttribute('role');
  }
  activeModal = null;
}
function setExpanded(id, on){
  var el = document.getElementById(id);
  if(el) el.setAttribute('aria-expanded', on ? 'true' : 'false');
}

function closeAllPanels(){
  var hadModal = !!activeModal;
  if(appearancePanel) appearancePanel.classList.remove('open');
  if(railEl) railEl.classList.remove('sheet-open');
  if(quickfabMenuEl) quickfabMenuEl.classList.remove('open');
  if(sheetOverlay) sheetOverlay.classList.remove('open');
  var qb = document.getElementById('quickfabBtn');
  if(qb) qb.setAttribute('aria-expanded','false');
  setExpanded('bbSearch', false);
  setExpanded('appearanceBtn', false); setExpanded('cogAppearance', false);
  if(typeof syncRailToggleUi === 'function') syncRailToggleUi();
  clearModal();
  /* hand focus back to whatever opened the sheet */
  if(hadModal && modalOpener && document.contains(modalOpener)){
    try{ modalOpener.focus({preventScroll:true}); }catch(e){ modalOpener.focus(); }
  }
  modalOpener = null;
}
function openOverlay(){ if(sheetOverlay) sheetOverlay.classList.add('open'); }
if(sheetOverlay){ sheetOverlay.addEventListener('click', closeAllPanels); }

/* keep Tab inside an open modal sheet */
document.addEventListener('keydown', function(e){
  if(e.key !== 'Tab' || !activeModal) return;
  var items = focusablesIn(activeModal);
  if(!items.length) return;
  var first = items[0], last = items[items.length - 1];
  if(e.shiftKey && (document.activeElement === first || !activeModal.contains(document.activeElement))){
    e.preventDefault(); last.focus();
  } else if(!e.shiftKey && document.activeElement === last){
    e.preventDefault(); first.focus();
  }
});

function openAppearance(){
  var opener = document.activeElement;
  closeAllPanels();
  modalOpener = opener;
  if(appearancePanel) appearancePanel.classList.add('open');
  openOverlay();
  setExpanded('appearanceBtn', true); setExpanded('cogAppearance', true);
  setModal(appearancePanel, 'Appearance settings');
  var close = document.getElementById('appearanceClose');
  if(close) setTimeout(function(){ close.focus(); }, 30);
}
var appearanceBtn = document.getElementById('appearanceBtn');
var appearanceClose = document.getElementById('appearanceClose');
if(appearanceBtn) appearanceBtn.addEventListener('click', openAppearance);
if(appearanceClose) appearanceClose.addEventListener('click', closeAllPanels);
var cogAppearance = document.getElementById('cogAppearance');
if(cogAppearance) cogAppearance.addEventListener('click', openAppearance);
var hubOpenLibrary = document.getElementById('hubOpenLibrary');
if(hubOpenLibrary) hubOpenLibrary.addEventListener('click', function(){ openContentsSheet(true); });

/* palette swatches */
var paletteRow = document.getElementById('paletteRow');
var paletteChoice = document.getElementById('paletteChoice');
function markPaletteOn(){
  if(!paletteRow) return;
  var selectedName = 'Classic petrol';
  Array.prototype.forEach.call(paletteRow.querySelectorAll('.palette-swatch'), function(sw){
    var isSelected = sw.getAttribute('data-palette') === savedPalette;
    sw.classList.toggle('on', isSelected);
    if(isSelected) selectedName = sw.getAttribute('title') || selectedName;
  });
  if(paletteChoice) paletteChoice.innerHTML = 'Selected: <strong>' + selectedName + '</strong>';
}
markPaletteOn();
if(paletteRow){
  paletteRow.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('.palette-swatch') : null;
    if(!btn) return;
    savedPalette = btn.getAttribute('data-palette');
    storeSet(PALETTE_KEY, savedPalette);
    applyPalette(savedPalette);
    markPaletteOn();
  });
}

/* brightness slider */
var brightSlider = document.getElementById('brightSlider');
var brightVal = document.getElementById('brightVal');
function syncBrightnessPresets(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-brightness]'), function(btn){
    btn.classList.toggle('on', parseInt(btn.getAttribute('data-brightness'), 10) === savedBright);
  });
}
if(brightSlider){
  brightSlider.value = savedBright;
  if(brightVal) brightVal.textContent = savedBright + '%';
  syncBrightnessPresets();
  brightSlider.addEventListener('input', function(){
    var v = parseInt(brightSlider.value, 10);
    savedBright = v;
    applyBright(v);
    if(brightVal) brightVal.textContent = v + '%';
    syncBrightnessPresets();
  });
  brightSlider.addEventListener('change', function(){
    storeSet(BRIGHT_KEY, savedBright);
  });
}
Array.prototype.forEach.call(document.querySelectorAll('[data-brightness]'), function(btn){
  btn.addEventListener('click', function(){
    savedBright = parseInt(btn.getAttribute('data-brightness'), 10);
    applyBright(savedBright);
    if(brightSlider) brightSlider.value = savedBright;
    if(brightVal) brightVal.textContent = savedBright + '%';
    storeSet(BRIGHT_KEY, savedBright);
    syncBrightnessPresets();
  });
});

/* low-light switch */
var lowlightSwitch = document.getElementById('lowlightSwitch');
function syncLowlightSwitch(){
  if(!lowlightSwitch) return;
  lowlightSwitch.classList.toggle('on', savedLowlight);
  lowlightSwitch.setAttribute('aria-checked', savedLowlight ? 'true' : 'false');
}
syncLowlightSwitch();
if(lowlightSwitch){
  lowlightSwitch.addEventListener('click', function(){
    savedLowlight = !savedLowlight;
    storeSet(LOWLIGHT_KEY, savedLowlight ? '1' : '0');
    applyLowlight(savedLowlight);
    syncLowlightSwitch();
  });
}

/* high-contrast switch */
var contrastSwitch = document.getElementById('contrastSwitch');
function syncContrastSwitch(){
  if(!contrastSwitch) return;
  contrastSwitch.classList.toggle('on', savedHighContrast);
  contrastSwitch.setAttribute('aria-checked', savedHighContrast ? 'true' : 'false');
}
syncContrastSwitch();
if(contrastSwitch){
  contrastSwitch.addEventListener('click', function(){
    savedHighContrast = !savedHighContrast;
    storeSet(CONTRAST_KEY, savedHighContrast ? '1' : '0');
    applyHighContrast(savedHighContrast);
    syncContrastSwitch();
  });
}

/* desktop layout: book (whole page) vs app (docked sidebar + search) */
var apViewChoice = document.getElementById('apViewChoice');
function markLayoutOn(){
  if(!apViewChoice) return;
  Array.prototype.forEach.call(apViewChoice.querySelectorAll('button'), function(btn){
    btn.classList.toggle('on', btn.getAttribute('data-view') === savedLayout);
  });
}
markLayoutOn();
if(apViewChoice){
  apViewChoice.addEventListener('click', function(e){
    var btn = e.target.closest ? e.target.closest('button[data-view]') : null;
    if(!btn) return;
    savedLayout = btn.getAttribute('data-view');
    storeSet(LAYOUT_KEY, savedLayout);
    applyLayout(savedLayout);
    markLayoutOn();
    /* switching layout changes whether the sidebar is docked or a sheet;
       leave this settings panel open and just refresh the sidebar's own UI */
    if(typeof syncRailToggleUi === 'function') syncRailToggleUi();
  });
}

/* owner name */
var ownerNameInput = document.getElementById('ownerName');
if(ownerNameInput){
  ownerNameInput.value = savedName;
  ownerNameInput.addEventListener('input', function(){
    savedName = ownerNameInput.value.trim().slice(0,30);
    storeSet(NAME_KEY, savedName);
    applyName(savedName);
  });
}

/* The old opt-in "web view" (a desktop-style scrolling layout on a phone) has
   been retired — TreebySound is app-first everywhere now. Clear any preference
   saved by an earlier edition so it can't leave the layout in a stale state. */
storeRemove(FORCEDESK_KEY);

/* reset to default look */
var appearanceReset = document.getElementById('appearanceReset');
if(appearanceReset){
  appearanceReset.addEventListener('click', function(){
    savedPalette = 'classic'; storeSet(PALETTE_KEY, savedPalette); applyPalette(savedPalette); markPaletteOn();
    savedLowlight = false; storeSet(LOWLIGHT_KEY,'0'); applyLowlight(false); syncLowlightSwitch();
    savedHighContrast = false; storeSet(CONTRAST_KEY,'0'); applyHighContrast(false); syncContrastSwitch();
    savedBright = 100; storeSet(BRIGHT_KEY,'100'); applyBright(100);
    if(brightSlider) brightSlider.value = 100; if(brightVal) brightVal.textContent = '100%';
    syncBrightnessPresets();
    savedLayout = 'app'; storeSet(LAYOUT_KEY,'app'); applyLayout('app'); markLayoutOn();
    if(typeof syncRailToggleUi === 'function') syncRailToggleUi();
    updateThemeColor();
  });
}

/* ---------- back up / restore everything saved on this device ----------
   Notes, checklists, progress, the job workspace and appearance all live in
   localStorage under the treebysound- prefix. This gathers every one of those
   keys into a single JSON file the person can save, and restores one back.
   No network — the file is created and read entirely in the browser. */
(function(){
  var exportBtn = document.getElementById('dataExport');
  var importBtn = document.getElementById('dataImport');
  var importInput = document.getElementById('dataImportInput');
  var statusEl = document.getElementById('dataBackupStatus');
  if(!exportBtn || !importBtn || !importInput) return;

  var PREFIX = 'treebysound-';
  function setStatus(msg, isWarn){
    if(!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle('warn', !!isWarn);
    clearTimeout(setStatus.timer);
    if(msg){ setStatus.timer = setTimeout(function(){ statusEl.textContent = ''; statusEl.classList.remove('warn'); }, 4000); }
  }
  function collect(){
    var data = {};
    try{
      for(var i=0;i<localStorage.length;i++){
        var k = localStorage.key(i);
        if(k && k.indexOf(PREFIX) === 0){ data[k] = localStorage.getItem(k); }
      }
    }catch(e){}
    return data;
  }

  exportBtn.addEventListener('click', function(){
    var payload = { app:'TreebySound', kind:'backup', version:1, exportedAt:new Date().toISOString(), data:collect() };
    var count = Object.keys(payload.data).length;
    if(!count){ setStatus('Nothing saved yet to back up.', true); return; }
    try{
      var blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var stamp = new Date().toISOString().slice(0,10);
      a.href = url; a.download = 'treebysound-backup-' + stamp + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      setStatus('Backup saved — ' + count + ' item' + (count===1?'':'s') + '. Keep it with your copy of the handbook.');
    }catch(e){ setStatus('Could not create the backup file here.', true); }
  });

  importBtn.addEventListener('click', function(){ importInput.click(); });
  importInput.addEventListener('change', function(){
    var file = importInput.files && importInput.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){
      var parsed;
      try{ parsed = JSON.parse(reader.result); }catch(e){ setStatus('That file isn’t a valid backup.', true); importInput.value=''; return; }
      var data = parsed && parsed.data && typeof parsed.data === 'object' ? parsed.data : null;
      if(!data){ setStatus('That file isn’t a TreebySound backup.', true); importInput.value=''; return; }
      var keys = Object.keys(data).filter(function(k){ return k.indexOf(PREFIX) === 0; });
      if(!keys.length){ setStatus('No TreebySound data found in that file.', true); importInput.value=''; return; }
      if(!window.confirm('Restore ' + keys.length + ' saved item' + (keys.length===1?'':'s') + '? This replaces matching notes, checklists and workspace entries on this device with the backup, then reloads.')){ importInput.value=''; return; }
      try{
        keys.forEach(function(k){ storeSet(k, data[k]); });
      }catch(e){ setStatus('Could not save the restored data on this device.', true); importInput.value=''; return; }
      importInput.value='';
      /* reload so notes, checklists, progress and the workspace re-read from storage */
      location.reload();
    };
    reader.onerror = function(){ setStatus('Could not read that file.', true); importInput.value=''; };
    reader.readAsText(file);
  });
})();

/* ---------- revert to the version before the last update, or back again ----------
   The service worker keeps exactly one snapshot: whatever was current right
   before the last update. This just asks it to switch which one it serves,
   then reloads. Saved notes, checklists and appearance are untouched either
   way — they live in localStorage, not in the cached page itself. */
(function(){
  var toggleBtn = document.getElementById('usePreviousToggle');
  var statusEl = document.getElementById('usePreviousStatus');
  if(!toggleBtn) return;
  var USE_PREVIOUS_KEY = 'treebysound-use-previous';

  function setStatus(msg, isWarn){
    if(!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle('warn', !!isWarn);
  }
  function sync(){
    var on = storeGet(USE_PREVIOUS_KEY) === '1';
    toggleBtn.textContent = on ? 'Back to the latest version' : 'Use previous version';
    toggleBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  sync();

  function askServiceWorker(flag){
    return new Promise(function(resolve){
      if(!('serviceWorker' in navigator) || !navigator.serviceWorker.controller){
        resolve({ok:false}); return;
      }
      var settled = false;
      var channel = new MessageChannel();
      channel.port1.onmessage = function(e){ settled = true; resolve(e.data || {ok:false}); };
      navigator.serviceWorker.controller.postMessage({type:'USE_PREVIOUS', value: flag}, [channel.port2]);
      setTimeout(function(){ if(!settled) resolve({ok:false, timeout:true}); }, 1500);
    });
  }

  toggleBtn.addEventListener('click', function(){
    var next = storeGet(USE_PREVIOUS_KEY) !== '1';
    toggleBtn.disabled = true;
    setStatus('');
    askServiceWorker(next).then(function(result){
      toggleBtn.disabled = false;
      if(!result || !result.ok){
        setStatus('Could not switch versions here — try again once you’re online.', true);
        return;
      }
      if(next && !result.hasPrevious){
        setStatus('No earlier version saved on this device yet — this appears after your next update.', true);
        return;
      }
      storeSet(USE_PREVIOUS_KEY, next ? '1' : '0');
      location.reload();
    });
  });
})();

/* ---------- print ---------- */
var printBtn = document.getElementById('print');
if(printBtn){ printBtn.addEventListener('click', function(){ window.print(); }); }

var pocketPrintBtn = document.getElementById('pocketPrint');
if(pocketPrintBtn){
  pocketPrintBtn.addEventListener('click', function(){
    document.body.classList.add('pocket-print');
    window.print();
  });
  window.addEventListener('afterprint', function(){ document.body.classList.remove('pocket-print'); });
}

/* ---------- bottom app bar: contents sheet, search, on-the-job, appearance ---------- */
var railClose = document.getElementById('railClose');
var bbSearch = document.getElementById('bbSearch');
var qInput = document.getElementById('q');

/* TreebySound's phone bar points to the useful starting places, while the
   handbook remains available from Find. */
Array.prototype.forEach.call(document.querySelectorAll('[data-hub-target]'), function(btn){
  btn.addEventListener('click', function(){
    closeAllPanels();
    goTo(btn.getAttribute('data-hub-target'));
  });
});

/* ---------- TreebySound job workspace: private, local and expandable ---------- */
(function(){
  var workspace = document.getElementById('jobWorkspace');
  if(!workspace) return;
  var WORKSPACE_KEY = 'treebysound-job-workspace-v1';
  var status = document.getElementById('wsStatus');
  var docsEl = document.getElementById('wsDocs');
  var contactsEl = document.getElementById('wsContacts');
  var state = { fields:{}, docs:[], contacts:[], gear:[] };
  var raw = storeGet(WORKSPACE_KEY);
  if(raw){
    try{
      var parsed = JSON.parse(raw);
      if(parsed && typeof parsed === 'object'){
        state.fields = parsed.fields || {};
        state.docs = Array.isArray(parsed.docs) ? parsed.docs : [];
        state.contacts = Array.isArray(parsed.contacts) ? parsed.contacts : [];
        state.gear = Array.isArray(parsed.gear) ? parsed.gear : [];
      }
    }catch(e){}
  }
  function kitChanged(){
    try{ document.dispatchEvent(new CustomEvent('tb-kit-change')); }catch(e){}
  }
  function save(){
    storeSet(WORKSPACE_KEY, JSON.stringify(state));
    clearTimeout(save.kitTimer);
    save.kitTimer = setTimeout(kitChanged, 400);
    if(status){
      status.textContent = 'Saved on this device';
      clearTimeout(save.timer);
      save.timer = setTimeout(function(){ status.textContent = ''; }, 1500);
    }
  }
  var fieldSeq = 0;
  function input(labelText, value, placeholder, multiline, onChange){
    var field = document.createElement('div'); field.className = 'workspace-field';
    var id = 'ws-f-' + (++fieldSeq);
    var label = document.createElement('label'); label.textContent = labelText;
    /* the label sits beside the control, not around it, so it has to be
       explicitly tied to it or assistive tech reads an unnamed box */
    label.htmlFor = id;
    field.appendChild(label);
    var control = document.createElement(multiline ? 'textarea' : 'input');
    if(!multiline) control.type = 'text';
    control.id = id;
    control.value = value || ''; control.placeholder = placeholder || '';
    control.addEventListener('input', function(){ onChange(control.value); save(); });
    field.appendChild(control); return field;
  }
  function removeButton(onClick, label){
    var button = document.createElement('button'); button.type='button'; button.className='workspace-remove'; button.textContent='Remove';
    /* every row says just "Remove" on screen; give assistive tech the context */
    if(label) button.setAttribute('aria-label', 'Remove ' + label);
    button.addEventListener('click', function(){
      onClick();
      if(label) announce(label.charAt(0).toUpperCase() + label.slice(1) + ' removed');
    });
    return button;
  }
  function renderDocs(){
    docsEl.textContent = '';
    if(!state.docs.length){ var empty = document.createElement('p'); empty.className='workspace-empty'; empty.textContent='No job documents yet. Start with the kit list, schedule, input list, stage plan and RAMS where applicable.'; docsEl.appendChild(empty); return; }
    state.docs.forEach(function(doc, index){
      var item = document.createElement('div'); item.className='workspace-item';
      var head = document.createElement('div'); head.className='workspace-item-head';
      var title = document.createElement('strong'); title.textContent='Document ' + (index + 1); head.appendChild(title);
      head.appendChild(removeButton(function(){ state.docs.splice(index,1); save(); renderDocs(); }, 'document ' + (index + 1))); item.appendChild(head);
      item.appendChild(input('Document type / name', doc.name, 'e.g. Input list v3', false, function(v){ doc.name=v; }));
      item.appendChild(input('Where it is stored or linked', doc.location, 'Company system, folder or approved link', false, function(v){ doc.location=v; }));
      item.appendChild(input('Key information or change', doc.note, 'What this document changes for audio', true, function(v){ doc.note=v; }));
      docsEl.appendChild(item);
    });
  }
  function renderContacts(){
    contactsEl.textContent = '';
    if(!state.contacts.length){ var empty = document.createElement('p'); empty.className='workspace-empty'; empty.textContent='No contacts yet. Add the audio lead, production contact, venue duty manager and hire supplier only when relevant.'; contactsEl.appendChild(empty); return; }
    state.contacts.forEach(function(contact, index){
      var item = document.createElement('div'); item.className='workspace-item';
      var head = document.createElement('div'); head.className='workspace-item-head';
      var title = document.createElement('strong'); title.textContent='Contact ' + (index + 1); head.appendChild(title);
      head.appendChild(removeButton(function(){ state.contacts.splice(index,1); save(); renderContacts(); }, 'contact ' + (index + 1))); item.appendChild(head);
      item.appendChild(input('Role / department', contact.role, 'e.g. Audio lead', false, function(v){ contact.role=v; }));
      item.appendChild(input('Name', contact.name, 'Name or team name', false, function(v){ contact.name=v; }));
      item.appendChild(input('Best contact route', contact.route, 'Company number, radio channel, desk…', false, function(v){ contact.route=v; }));
      item.appendChild(input('What they own / useful note', contact.note, 'What to ask them about', true, function(v){ contact.note=v; }));
      contactsEl.appendChild(item);
    });
  }
  function renderGear(){
    var gearEl = document.getElementById('wsGear');
    gearEl.textContent = '';
    if(!state.gear.length){ var empty = document.createElement('p'); empty.className='workspace-empty'; empty.textContent='No equipment entries yet. Start with the most common microphones, DIs, cable types and stageboxes—not the entire warehouse.'; gearEl.appendChild(empty); return; }
    state.gear.forEach(function(gear, index){
      var item = document.createElement('div'); item.className='workspace-item';
      var head = document.createElement('div'); head.className='workspace-item-head';
      var title = document.createElement('strong'); title.textContent='Equipment ' + (index + 1); head.appendChild(title);
      head.appendChild(removeButton(function(){ state.gear.splice(index,1); save(); renderGear(); }, 'equipment ' + (index + 1))); item.appendChild(head);
      var row = document.createElement('div'); row.className='workspace-row';
      row.appendChild(input('Stock label (not serial number)', gear.label, 'e.g. company asset label', false, function(v){ gear.label=v; }));
      row.appendChild(input('Item / model', gear.item, 'e.g. SM58, DI, stagebox', false, function(v){ gear.item=v; }));
      item.appendChild(row);
      var row2 = document.createElement('div'); row2.className='workspace-row';
      row2.appendChild(input('Category', gear.category, 'e.g. vocal mic, 10m XLR', false, function(v){ gear.category=v; }));
      row2.appendChild(input('Usual case / location', gear.location, 'Where I normally find it', false, function(v){ gear.location=v; }));
      item.appendChild(row2);
      item.appendChild(input('Practical notes', gear.note, 'What it does, connections, common issue, care', true, function(v){ gear.note=v; }));
      gearEl.appendChild(item);
    });
  }
  Array.prototype.forEach.call(workspace.querySelectorAll('[data-ws-field]'), function(field){
    var key = field.getAttribute('data-ws-field'); field.value = state.fields[key] || '';
    field.addEventListener('input', function(){ state.fields[key] = field.value; save(); });
  });
  /* after adding a row, put the cursor in it — otherwise focus stays on the
     Add button and a keyboard user has to hunt for the field that appeared */
  function focusNewRow(container){
    var items = container.querySelectorAll('.workspace-item');
    var last = items[items.length - 1];
    if(!last) return;
    var field = last.querySelector('input, textarea');
    if(field) field.focus();
  }
  document.getElementById('wsAddDoc').addEventListener('click', function(){ state.docs.push({name:'',location:'',note:''}); save(); renderDocs(); focusNewRow(docsEl); announce('Document added'); });
  document.getElementById('wsAddContact').addEventListener('click', function(){ state.contacts.push({role:'',name:'',route:'',note:''}); save(); renderContacts(); focusNewRow(contactsEl); announce('Contact added'); });
  document.getElementById('wsAddGear').addEventListener('click', function(){ state.gear.push({label:'',item:'',category:'',location:'',note:''}); save(); renderGear(); focusNewRow(document.getElementById('wsGear')); announce('Equipment added'); });
  renderDocs(); renderContacts(); renderGear();
  /* The equipment reference doubles as "my kit": the system test, the model
     tables and the fault finder all read it from here. */
  window.tbKit = {
    list: function(){ return state.gear.slice(); },
    summary: function(){ return state.gear.map(function(g){ return (g.item || '').trim(); }).filter(Boolean).join(', '); },
    add: function(entry){
      state.gear.push({label:'', item:entry.item || '', category:entry.category || '', location:'', note:entry.note || ''});
      save(); renderGear(); kitChanged();
    }
  };
  setTimeout(kitChanged, 0);
})();

/* ---------- System test before doors (Job Hub) ----------
   The pre-event test from §11.9 as something to tick through on site: each
   step gets pass / fail / not needed and a note, and the whole thing becomes a
   dated record to copy, share or keep. The fault finder drives the same steps
   through window.tbSysTest, so the conversation and the page never disagree. */
(function(){
  var host = document.getElementById('sysTest');
  if(!host) return;
  var KEY = 'treebysound-systest-v1', HIST_KEY = 'treebysound-systest-history-v1';
  var STEPS = [
    {t:'Plan in hand', d:'Box, amp, channel, output mode and setup for every channel.', l:'#s6-18'},
    {t:'Safe before powered', d:'Stacks stable and secured, anything flown signed off by the rigger, cables taped, exits and amp vents clear.', l:'#s11-9'},
    {t:'Power', d:'Amps on the supply you were given, powerCONs locked.', l:'#s12-15'},
    {t:'Speaker cables', d:'Right socket for the output mode, 4-core where pins 2 are needed, locked both ends, labelled.', l:'#s6-17'},
    {t:'Power up muted', d:'Console first, amps last, channels muted; no errors on any amp.', l:'#s6-18'},
    {t:'Channel settings match the plan', d:'Setup, output mode, functions, level and delay — every channel read, not assumed.', l:'#s6-20'},
    {t:'R1 and System check', d:'Every amp online with no warnings; System check passed where the amps have it.', l:'#s6-16'},
    {t:'Signal to every amp', d:'Input mode and routing right, green on every channel, digital lock, fallback as planned.', l:'#s6-17'},
    {t:'Every box, one at a time', d:'Low level, everything else muted: right box, every driver, no rattles.', l:'#s6-19'},
    {t:'Polarity', d:'Box against box, or with a polarity checker.', l:'#s6-8'},
    {t:'Whole system', d:'Subs and tops together, fills and delays as planned, nothing phasey where they overlap.', l:'#s6-8'},
    {t:'Level and limits', d:'Show level without living in yellow GR, inside any noise limit.', l:'#s6-10'},
    {t:'Inputs line checked', d:'Every mic, DI, playback and radio mic proved.', l:'#s11-3'},
    {t:'Show stop ready', d:'One move mutes everything; you know who to call.', l:'#support-now'},
    {t:'Saved and handed over', d:'Show file and R1 project saved, changes and known issues written down, handed over.', l:'#s11-7'}
  ];
  var LABEL = {pass:'Pass', fail:'Fail', na:'Not needed'};
  var state = load();
  function blank(){ return {fields:{date:new Date().toISOString().slice(0, 10)}, results:STEPS.map(function(){ return {s:'', note:''}; })}; }
  function load(){
    try{
      var p = JSON.parse(storeGet(KEY) || 'null');
      if(p && p.results && p.results.length === STEPS.length) return p;
    }catch(e){}
    return blank();
  }
  function save(){ storeSet(KEY, JSON.stringify(state)); }

  var list = document.getElementById('sysTestSteps');
  var progress = document.getElementById('sysTestProgress');
  var kitHint = document.getElementById('stKitHint');
  function render(){
    list.textContent = '';
    STEPS.forEach(function(step, i){
      var r = state.results[i];
      var li = document.createElement('li');
      li.className = 'systest-step' + (r.s ? ' is-' + r.s : '');
      var head = document.createElement('div'); head.className = 'systest-step-head';
      var title = document.createElement('strong'); title.textContent = step.t; head.appendChild(title);
      var a = document.createElement('a'); a.href = step.l; a.textContent = 'how'; a.className = 'systest-how'; head.appendChild(a);
      li.appendChild(head);
      var d = document.createElement('p'); d.className = 'systest-detail'; d.textContent = step.d; li.appendChild(d);
      var btns = document.createElement('div'); btns.className = 'systest-btns'; btns.setAttribute('role', 'group'); btns.setAttribute('aria-label', step.t);
      ['pass','fail','na'].forEach(function(s){
        var b = document.createElement('button'); b.type = 'button'; b.className = 'systest-btn ' + s;
        b.textContent = LABEL[s]; b.setAttribute('aria-pressed', r.s === s ? 'true' : 'false');
        b.addEventListener('click', function(){ set(i, r.s === s ? '' : s); });
        btns.appendChild(b);
      });
      li.appendChild(btns);
      var note = document.createElement('input'); note.type = 'text'; note.className = 'systest-note';
      note.placeholder = r.s === 'fail' ? 'What failed, and what you did' : 'Note (optional)';
      note.setAttribute('aria-label', 'Note for ' + step.t);
      note.value = r.note || '';
      note.addEventListener('input', function(){ r.note = note.value; save(); });
      li.appendChild(note);
      list.appendChild(li);
    });
    renderProgress();
  }
  function counts(){
    var c = {pass:0, fail:0, na:0, open:0};
    state.results.forEach(function(r){ if(r.s) c[r.s]++; else c.open++; });
    return c;
  }
  function renderProgress(){
    var c = counts();
    progress.textContent = (c.pass + c.na) + ' of ' + STEPS.length + ' done' + (c.fail ? ' · ' + c.fail + ' failed' : '') + (c.open ? ' · ' + c.open + ' to go' : ' · all steps checked');
    progress.className = 'systest-progress' + (c.fail ? ' has-fail' : (!c.open ? ' all-done' : ''));
  }
  function set(i, s, note){
    if(i < 0 || i >= STEPS.length) return;
    state.results[i].s = s;
    if(note !== undefined) state.results[i].note = note;
    save(); render();
  }
  /* fields */
  Array.prototype.forEach.call(host.querySelectorAll('[data-st-field]'), function(f){
    var k = f.getAttribute('data-st-field');
    f.value = state.fields[k] || '';
    f.addEventListener('input', function(){ state.fields[k] = f.value; if(k === 'kit') state.fields.kitAuto = false; save(); });
  });
  function syncKitHint(){
    var kit = window.tbKit ? window.tbKit.summary() : '';
    var f = document.getElementById('stKit');
    if(kit && (!f.value || state.fields.kitAuto)){ f.value = kit; state.fields.kit = kit; state.fields.kitAuto = true; save(); }
    kitHint.textContent = kit ? 'From your equipment list: ' + kit : 'Tip: add the kit you use to My equipment reference in the Job workspace and it fills in here.';
  }
  document.addEventListener('tb-kit-change', syncKitHint);

  function record(){
    var f = state.fields, c = counts();
    var verdict = c.fail ? 'NOT PASSED — ' + c.fail + ' failed' + (c.open ? ', ' + c.open + ' not checked' : '')
      : c.open ? 'INCOMPLETE — ' + c.open + ' not checked' : 'PASSED — all ' + STEPS.length + ' steps checked';
    var lines = ['SYSTEM TEST RECORD',
      'Event: ' + (f.event || '—'), 'Venue: ' + (f.venue || '—'), 'Date: ' + (f.date || '—'), 'Tested by: ' + (f.by || '—'),
      'System: ' + (f.kit || '—'), 'Result: ' + verdict, ''];
    STEPS.forEach(function(step, i){
      var r = state.results[i];
      lines.push((i + 1) + '. ' + step.t + ' — ' + (r.s ? LABEL[r.s].toUpperCase() : 'NOT CHECKED') + (r.note ? ' (' + r.note + ')' : ''));
    });
    var fails = STEPS.map(function(s, i){ return state.results[i].s === 'fail' ? '- ' + s.t + (state.results[i].note ? ': ' + state.results[i].note : '') : null; }).filter(Boolean);
    if(fails.length){ lines.push('', 'Needs attention before doors:'); lines = lines.concat(fails); }
    return lines.join('\n');
  }
  var recWrap = document.getElementById('sysTestRecordWrap'), recPre = document.getElementById('sysTestRecord');
  function showRecord(){ recPre.textContent = record(); recWrap.hidden = false; }
  document.getElementById('stRecordBtn').addEventListener('click', showRecord);
  document.getElementById('stCopyBtn').addEventListener('click', function(){
    var t = record();
    if(navigator.clipboard) navigator.clipboard.writeText(t).then(function(){ announce('Test record copied'); }, function(){});
  });
  document.getElementById('stShareBtn').addEventListener('click', function(){
    var t = record(), name = 'system-test-' + (state.fields.date || 'record') + '.txt';
    if(navigator.share){ navigator.share({title:'System test record', text:t}).catch(function(){}); return; }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([t], {type:'text/plain'}));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
  function history(){ try{ return JSON.parse(storeGet(HIST_KEY) || '[]'); }catch(e){ return []; } }
  function renderHistory(){
    var h = history(), box = document.getElementById('stHistoryList');
    if(!h.length) return;
    box.textContent = '';
    h.forEach(function(rec){
      var d = document.createElement('details'); d.className = 'hub-guide';
      var sm = document.createElement('summary'); sm.textContent = rec.title; d.appendChild(sm);
      var pre = document.createElement('pre'); pre.className = 'chat-report'; pre.textContent = rec.text; d.appendChild(pre);
      box.appendChild(d);
    });
  }
  function newTest(){
    var c = counts();
    if(c.pass + c.fail + c.na){
      var h = history();
      h.unshift({title:(state.fields.date || '') + ' · ' + (state.fields.event || 'Untitled') + ' · ' + (c.fail ? 'not passed' : c.open ? 'incomplete' : 'passed'), text:record()});
      storeSet(HIST_KEY, JSON.stringify(h.slice(0, 8)));
    }
    var keepBy = state.fields.by;
    state = blank();
    if(keepBy) state.fields.by = keepBy;
    save();
    Array.prototype.forEach.call(host.querySelectorAll('[data-st-field]'), function(f){ f.value = state.fields[f.getAttribute('data-st-field')] || ''; });
    recWrap.hidden = true;
    render(); renderHistory(); syncKitHint();
  }
  document.getElementById('stNewBtn').addEventListener('click', newTest);
  document.getElementById('stChatBtn').addEventListener('click', function(){
    if(window.tbChatStartTest) window.tbChatStartTest();
  });

  window.tbSysTest = {
    steps: STEPS,
    results: function(){ return state.results; },
    fields: function(){ return state.fields; },
    set: set,
    setField: function(k, v){ state.fields[k] = v; save(); var f = host.querySelector('[data-st-field="' + k + '"]'); if(f) f.value = v; },
    next: function(){ for(var i = 0; i < STEPS.length; i++){ if(!state.results[i].s) return i; } return -1; },
    counts: counts,
    record: record,
    reset: newTest
  };
  render(); renderHistory(); syncKitHint();
})();


function railIsPersistent(){
  return !!(window.matchMedia && window.matchMedia('(min-width:1100px)').matches);
}

/* ---------- persistent sidebar: collapse / expand (wide screens) ----------
   On desk width the contents sidebar is docked open. This lets the person
   hide it to reclaim the full page width, and reopen it — remembered per
   device. It has no effect below 1100px, where the sidebar is a sheet. */
var RAIL_COLLAPSE_KEY = 'treebysound-rail-collapsed';
var railCollapseBtn = document.getElementById('railCollapse');
function syncRailToggleUi(){
  var collapsed = document.body.classList.contains('rail-collapsed');
  if(appbarLibrary){ appbarLibrary.classList.toggle('on', railIsPersistent() && !collapsed); appbarLibrary.setAttribute('aria-expanded', (railIsPersistent() && !collapsed) ? 'true' : 'false'); }
  if(railCollapseBtn){ railCollapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true'); }
}
function setRailCollapsed(on){
  document.body.classList.toggle('rail-collapsed', !!on);
  storeSet(RAIL_COLLAPSE_KEY, on ? '1' : '0');
  syncRailToggleUi();
}

function openContentsSheet(focusSearch){
  var opener = document.activeElement;
  closeAllPanels();
  if(toc) toc.classList.remove('hidden');
  /* When the sidebar is already permanently on screen, don't dim the page or
     turn it into a modal sheet — just make sure it's expanded and jump the
     cursor into the search box. */
  if(railIsPersistent()){
    if(document.body.classList.contains('rail-collapsed')) setRailCollapsed(false);
    if(focusSearch && qInput){ setTimeout(function(){ qInput.focus(); }, 30); }
    return;
  }
  modalOpener = opener;
  if(railEl) railEl.classList.add('sheet-open');
  if(railClose) railClose.style.display = 'block';
  openOverlay();
  if(focusSearch) setExpanded('bbSearch', true);
  setModal(railEl, 'Contents and search');
  /* focus the search box when asked, otherwise the sheet's own close button */
  setTimeout(function(){
    if(focusSearch && qInput){ qInput.focus(); }
    else if(railClose){ railClose.focus(); }
  }, 60);
}
if(bbSearch){ bbSearch.addEventListener('click', function(){ openContentsSheet(true); }); }
var appbarLibrary = document.getElementById('appbarLibrary');
if(appbarLibrary){
  appbarLibrary.addEventListener('click', function(){
    if(railIsPersistent()){
      /* toggle the docked sidebar; when opening it, drop into search */
      if(document.body.classList.contains('rail-collapsed')){ openContentsSheet(true); }
      else { setRailCollapsed(true); }
    } else {
      openContentsSheet(true);
    }
  });
}
if(railCollapseBtn){ railCollapseBtn.addEventListener('click', function(){ setRailCollapsed(true); }); }
if(railClose){ railClose.addEventListener('click', closeAllPanels); }

/* restore saved collapse state, and keep the toggle UI correct across resizes */
if(storeGet(RAIL_COLLAPSE_KEY) === '1'){ document.body.classList.add('rail-collapsed'); }
syncRailToggleUi();
if(window.matchMedia){
  var mqPersist = window.matchMedia('(min-width:1100px)');
  var onMq = function(){ syncRailToggleUi(); };
  if(mqPersist.addEventListener){ mqPersist.addEventListener('change', onMq); }
  else if(mqPersist.addListener){ mqPersist.addListener(onMq); }
}

/* One Escape policy for the whole app: if you're typing in search and there's
   something in the box, the first Escape clears the query; otherwise Escape
   closes whatever sheet is open (and hands focus back to what opened it). */
document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  if(searchBox && document.activeElement === searchBox && searchBox.value){
    searchBox.value = '';
    runSearch();
    return;
  }
  closeAllPanels();
});

/* skip-to-content: move focus and scroll to the top of the reading area
   directly, without routing the hash through the one-screen router. */
var skipLink = document.querySelector('.skip-link');
var mainEl = document.getElementById('main');
if(skipLink && mainEl){
  skipLink.addEventListener('click', function(e){
    e.preventDefault();
    closeAllPanels();
    window.scrollTo({top:0, behavior:'auto'});
    mainEl.focus();
  });
}

/* a link tapped inside the contents sheet or job menu should close the sheet behind it */
if(toc){ toc.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('a')) closeAllPanels(); }); }
var railRoutes = document.querySelector('.rail-routes');
if(railRoutes){ railRoutes.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('a')) closeAllPanels(); }); }
var railDest = document.querySelector('.rail-dest');
if(railDest){ railDest.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('a')) closeAllPanels(); }); }
var railLibraryLink = document.querySelector('.rail-library a');
if(railLibraryLink){ railLibraryLink.addEventListener('click', closeAllPanels); }

/* ---------- back to top ---------- */
var topBtn = document.getElementById('top');
if(topBtn){
  window.addEventListener('scroll', function(){
    topBtn.classList.toggle('show', window.scrollY > 600);
  }, {passive:true});
  topBtn.addEventListener('click', function(){
    window.scrollTo({top:0, behavior: 'smooth'});
  });
}

/* ---------- development progress summary ----------
   The three development lists already store their ticks; nothing added them up.
   This reads them live so the two-year path has something to show for itself. */
var PROGRESS_LISTS = ['chk-first30','chk-next30','chk-quarterly'];
function updateProgressSummary(){
  var textEl = document.getElementById('progressSummaryText');
  var fillEl = document.getElementById('progressMeterFill');
  if(!textEl) return;
  var total = 0, done = 0;
  PROGRESS_LISTS.forEach(function(id){
    var list = document.getElementById(id);
    if(!list) return;
    var boxes = list.querySelectorAll('input[type="checkbox"]');
    total += boxes.length;
    Array.prototype.forEach.call(boxes, function(b){ if(b.checked) done++; });
  });
  var pct = total ? Math.round((done / total) * 100) : 0;
  if(fillEl) fillEl.style.width = pct + '%';
  var msg;
  if(!total)      msg = 'Development markers will appear here.';
  else if(!done)  msg = 'Nothing ticked yet — start with one thing from Before your next job.';
  else if(done === total) msg = 'All ' + total + ' development markers ticked. Time to agree the next ones with your audio lead.';
  else            msg = done + ' of ' + total + ' development markers ticked.';
  textEl.textContent = msg;
}

/* ---------- checklist persistence ---------- */
Array.prototype.forEach.call(document.querySelectorAll('ul.check[id]'), function(list){
  var key = 'treebysound-check-' + list.id;
  var boxes = Array.prototype.slice.call(list.querySelectorAll('input[type="checkbox"]'));
  var saved = storeGet(key);
  if(saved){
    try{
      var state = JSON.parse(saved);
      boxes.forEach(function(box, i){ if(state[i]) box.checked = true; });
    }catch(e){}
  }
  function save(){
    storeSet(key, JSON.stringify(boxes.map(function(b){ return b.checked; })));
  }
  boxes.forEach(function(box){ box.addEventListener('change', function(){ save(); updateProgressSummary(); }); });
});

updateProgressSummary();

Array.prototype.forEach.call(document.querySelectorAll('a.reset-link'), function(link){
  /* these act as buttons, not navigation — say so, and support Space as well as Enter */
  link.setAttribute('role','button');
  function reset(){
    var targetId = link.getAttribute('data-target');
    var list = document.getElementById(targetId);
    if(!list) return;
    var cleared = 0;
    Array.prototype.forEach.call(list.querySelectorAll('input[type="checkbox"]'), function(box){
      if(box.checked) cleared++;
      box.checked = false;
    });
    storeRemove('treebysound-check-' + targetId);
    updateProgressSummary();
    announce(cleared ? (cleared + ' tick' + (cleared === 1 ? '' : 's') + ' cleared') : 'Nothing to clear');
  }
  link.addEventListener('click', function(e){ e.preventDefault(); reset(); });
  link.addEventListener('keydown', function(e){
    if(e.key === ' ' || e.key === 'Spacebar'){ e.preventDefault(); reset(); }
  });
});

/* ---------- progressive checklist cards ---------- */
Array.prototype.forEach.call(document.querySelectorAll('.progress-deck'), function(deck){
  var pages = Array.prototype.slice.call(deck.querySelectorAll('.progress-page'));
  var next = deck.querySelector('[data-progress-next]');
  var prev = deck.querySelector('[data-progress-prev]');
  var count = deck.querySelector('.progress-deck-count');
  var key = 'treebysound-progress-page-' + deck.id;
  var page = parseInt(storeGet(key), 10);
  if(isNaN(page) || page < 0 || page >= pages.length) page = 0;
  function showPage(index){
    page = Math.max(0, Math.min(pages.length - 1, index));
    pages.forEach(function(item, itemIndex){ item.hidden = itemIndex !== page; });
    if(count) count.textContent = 'Step ' + (page + 1) + ' of ' + pages.length;
    if(prev) prev.hidden = page === 0;
    if(next) next.hidden = page === pages.length - 1;
    storeSet(key, page);
  }
  if(next) next.addEventListener('click', function(){ showPage(page + 1); });
  if(prev) prev.addEventListener('click', function(){ showPage(page - 1); });
  showPage(page);
});

/* ---------- on-the-job quick access ---------- */
var quickfabBtn = document.getElementById('quickfabBtn');
var quickfabMenu = document.getElementById('quickfabMenu');
if(quickfabBtn && quickfabMenu){
  quickfabBtn.addEventListener('click', function(e){
    e.stopPropagation();
    var open = quickfabMenu.classList.toggle('open');
    quickfabBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function(e){
    if(quickfabMenu.classList.contains('open') && !quickfabMenu.contains(e.target) && e.target !== quickfabBtn){
      quickfabMenu.classList.remove('open');
      quickfabBtn.setAttribute('aria-expanded', 'false');
    }
  });
  Array.prototype.forEach.call(quickfabMenu.querySelectorAll('a'), function(a){
    a.addEventListener('click', function(){
      quickfabMenu.classList.remove('open');
      quickfabBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- reference tables: screen-reader headers + keyboard scrolling ----------
   The book is full of wide reference tables. Two things they need that plain
   markup doesn't give them: header cells flagged as headers (so a screen reader
   announces "Role: Crew Chief" rather than reading a wall of cells), and — when
   a table is genuinely wider than the screen — a way to scroll it without a
   mouse. The tabindex is only added when the table actually overflows, so it
   never adds pointless tab stops on a wide monitor. */
(function(){
  var wraps = Array.prototype.slice.call(document.querySelectorAll('.tw'));
  if(!wraps.length) return;

  wraps.forEach(function(wrap){
    var table = wrap.querySelector('table');
    if(table){
      Array.prototype.forEach.call(table.querySelectorAll('thead th'), function(th){
        if(!th.getAttribute('scope')) th.setAttribute('scope','col');
      });
      Array.prototype.forEach.call(table.querySelectorAll('tbody th'), function(th){
        if(!th.getAttribute('scope')) th.setAttribute('scope','row');
      });
    }
    if(!wrap.getAttribute('aria-label')){
      var sec = wrap.closest ? wrap.closest('section.s') : null;
      var h3 = sec ? sec.querySelector('h3') : null;
      wrap.setAttribute('aria-label', h3 ? (h3.textContent.trim() + ' — table') : 'Reference table');
    }
  });

  function syncScrollable(){
    wraps.forEach(function(wrap){
      /* an inactive screen reports zero width — leave those alone until shown */
      if(!wrap.clientWidth) return;
      var overflows = wrap.scrollWidth > wrap.clientWidth + 1;
      if(overflows){
        if(wrap.getAttribute('tabindex') !== '0'){
          wrap.setAttribute('tabindex','0');
          wrap.setAttribute('role','region');
        }
      } else if(wrap.hasAttribute('tabindex')){
        wrap.removeAttribute('tabindex');
        wrap.removeAttribute('role');
      }
    });
  }
  /* First check after the first paint: measuring during start-up forced an
     extra layout of the whole book before anything was on screen. */
  requestAnimationFrame(function(){ setTimeout(syncScrollable, 0); });
  window.addEventListener('resize', syncScrollable, {passive:true});
  window.addEventListener('hashchange', function(){ setTimeout(syncScrollable, 60); });
})();

/* ---------- quick level converter (dBu / dBV / Volts) ---------- */
(function(){
  var val = document.getElementById('calcLevelValue');
  var unit = document.getElementById('calcLevelUnit');
  var out = document.getElementById('calcLevelOut');
  if(!val || !unit || !out) return;
  function fmt(n){ return (Math.round(n * 100) / 100).toString(); }
  function compute(){
    var n = parseFloat(val.value);
    if(isNaN(n)){ out.textContent = 'Enter a number'; return; }
    var volts;
    if(unit.value === 'dbu'){ volts = 0.775 * Math.pow(10, n/20); }
    else if(unit.value === 'dbv'){ volts = Math.pow(10, n/20); }
    else { volts = n; }
    if(volts <= 0){ out.textContent = 'Volts must be greater than 0'; return; }
    var dbu = 20 * Math.log10(volts / 0.775);
    var dbv = 20 * Math.log10(volts / 1);
    out.textContent = fmt(dbu) + ' dBu = ' + fmt(volts) + ' V = ' + fmt(dbv) + ' dBV';
  }
  val.addEventListener('input', compute);
  unit.addEventListener('change', compute);
  compute();
})();

/* ---------- speaker cable loss estimator ---------- */
(function(){
  var lenEl = document.getElementById('calcCableLen');
  var gaugeEl = document.getElementById('calcCableGauge');
  var loadEl = document.getElementById('calcCableLoad');
  var out = document.getElementById('calcCableOut');
  if(!lenEl || !gaugeEl || !loadEl || !out) return;
  /* ohms of round-trip resistance per metre, copper, by cross-section in mm² */
  var OHMS_PER_M = { '1.5': 0.0224, '2.5': 0.0134, '4': 0.0084, '6': 0.0056 };
  function compute(){
    var len = parseFloat(lenEl.value);
    var gauge = OHMS_PER_M[gaugeEl.value];
    var load = parseFloat(loadEl.value);
    if(isNaN(len) || len < 0 || !gauge || isNaN(load) || load <= 0){ out.textContent = 'Check the values above'; return; }
    var cableR = gauge * len;
    var lossDb = 10 * Math.log10((load + cableR) / load);
    var lossPct = (cableR / (load + cableR)) * 100;
    var verdict = lossDb < 0.2 ? 'negligible' : lossDb < 0.5 ? 'minor, worth noting on a very long run' : 'significant — step up a gauge if you can';
    out.textContent = 'Cable resistance ≈ ' + (Math.round(cableR*100)/100) + ' Ω · power lost in the cable ≈ ' + (Math.round(lossDb*100)/100) + ' dB (' + Math.round(lossPct) + '%) — ' + verdict;
  }
  lenEl.addEventListener('input', compute);
  gaugeEl.addEventListener('change', compute);
  loadEl.addEventListener('change', compute);
  compute();
})();

/* ---------- distance & delay time ----------
   Speed of sound in dry air, from temperature: c = 331.3 + 0.606 T (m/s). Over a
   long throw on a cold night that is a genuinely different answer from the 343
   everyone quotes, which is why the temperature field is there. */
(function(){
  var val = document.getElementById('calcDelayValue');
  var unit = document.getElementById('calcDelayUnit');
  var temp = document.getElementById('calcDelayTemp');
  var out = document.getElementById('calcDelayOut');
  if(!val || !unit || !temp || !out) return;
  function fmt(n, dp){ var f = Math.pow(10, dp === undefined ? 1 : dp); return (Math.round(n * f) / f).toString(); }
  function compute(){
    var n = parseFloat(val.value);
    var t = parseFloat(temp.value);
    if(isNaN(n)){ out.textContent = 'Enter a number'; return; }
    if(isNaN(t)) t = 20;
    if(t < -40 || t > 60){ out.textContent = 'Air temperature looks wrong'; return; }
    var c = 331.3 + 0.606 * t;
    var metres;
    if(unit.value === 'm')       metres = n;
    else if(unit.value === 'ft') metres = n * 0.3048;
    else                         metres = c * (n / 1000);
    if(metres < 0){ out.textContent = 'Distance cannot be negative'; return; }
    var ms = (metres / c) * 1000;
    out.textContent = fmt(metres, 2) + ' m = ' + fmt(metres / 0.3048, 1) + ' ft = ' +
      fmt(ms, 1) + ' ms \u00B7 speed of sound ' + fmt(c, 1) + ' m/s at ' + fmt(t, 1) + ' \u00B0C';
  }
  val.addEventListener('input', compute);
  temp.addEventListener('input', compute);
  unit.addEventListener('change', compute);
  compute();
})();

/* ---------- SPL over distance (inverse square, free field) ---------- */
(function(){
  var ref = document.getElementById('calcSplRef');
  var from = document.getElementById('calcSplFrom');
  var to = document.getElementById('calcSplTo');
  var out = document.getElementById('calcSplOut');
  if(!ref || !from || !to || !out) return;
  function fmt(n, dp){ var f = Math.pow(10, dp === undefined ? 1 : dp); return (Math.round(n * f) / f).toString(); }
  function compute(){
    var spl = parseFloat(ref.value), d1 = parseFloat(from.value), d2 = parseFloat(to.value);
    if(isNaN(spl) || isNaN(d1) || isNaN(d2)){ out.textContent = 'Enter all three values'; return; }
    if(d1 <= 0 || d2 <= 0){ out.textContent = 'Distances must be greater than 0'; return; }
    var change = -20 * Math.log10(d2 / d1);
    var result = spl + change;
    var word = change < -0.05 ? fmt(Math.abs(change)) + ' dB quieter' :
               change > 0.05 ? fmt(change) + ' dB louder' : 'the same level';
    var doublings = Math.abs(Math.log(d2 / d1) / Math.log(2));
    var word2 = (Math.round(doublings * 10) / 10) === 1 ? 'ing' : 'ings';
    var extra = doublings >= 0.5 ?
      ' \u00B7 ' + fmt(doublings) + (d2 > d1 ? ' doubl' : ' halv') + word2 + ' of distance' : '';
    out.textContent = '\u2248 ' + fmt(result) + ' dB at ' + fmt(d2, 2) + ' m \u2014 ' + word + extra;
  }
  [ref, from, to].forEach(function(el){ el.addEventListener('input', compute); });
  compute();
})();

/* ---------- decibels & ratios ----------
   Voltage is 20 log, power is 10 log. Getting these two the wrong way round is
   one of the most common mistakes in the whole subject. */
(function(){
  var val = document.getElementById('calcDbValue');
  var mode = document.getElementById('calcDbMode');
  var out = document.getElementById('calcDbOut');
  if(!val || !mode || !out) return;
  function fmt(n, dp){ var f = Math.pow(10, dp === undefined ? 2 : dp); return (Math.round(n * f) / f).toString(); }
  function sense(db){
    var a = Math.abs(db);
    if(a < 0.5) return 'no audible difference';
    if(a < 1.5) return 'just about audible on a good day';
    if(a < 4)   return 'clearly audible';
    if(a < 8)   return 'obvious; voltage roughly doubled or halved';
    if(a < 14)  return 'about what most people call twice (or half) as loud';
    return 'a very large change';
  }
  function compute(){
    var n = parseFloat(val.value);
    if(isNaN(n)){ out.textContent = 'Enter a number'; return; }
    var db;
    if(mode.value === 'db') db = n;
    else if(n <= 0){ out.textContent = 'A ratio must be greater than 0'; return; }
    else db = (mode.value === 'vratio' ? 20 : 10) * Math.log10(n);
    var v = Math.pow(10, db / 20);
    var p = Math.pow(10, db / 10);
    out.textContent = (db >= 0 ? '+' : '') + fmt(db, 2) + ' dB = \u00D7' + fmt(v) +
      ' in voltage = \u00D7' + fmt(p) + ' in power \u2014 ' + sense(db);
  }
  val.addEventListener('input', compute);
  mode.addEventListener('change', compute);
  compute();
})();

/* ---------- RF wavelength & antenna spacing ---------- */
(function(){
  var freq = document.getElementById('calcRfFreq');
  var out = document.getElementById('calcRfOut');
  if(!freq || !out) return;
  function mm(m){ return Math.round(m * 1000) + ' mm'; }
  function compute(){
    var f = parseFloat(freq.value);
    if(isNaN(f) || f <= 0){ out.textContent = 'Enter a frequency in MHz'; return; }
    if(f > 30000){ out.textContent = 'That is well outside anything you will meet on a job'; return; }
    var lambda = 299.792458 / f;
    out.textContent = '\u03BB ' + mm(lambda) + ' \u00B7 \u00BD\u03BB ' + mm(lambda / 2) +
      ' \u00B7 \u00BC\u03BB ' + mm(lambda / 4) +
      ' \u2014 keep diversity antennas at least \u00BC\u03BB (' + mm(lambda / 4) + ') apart, ' +
      '\u2248 1\u03BB (' + mm(lambda) + ') is better';
  }
  freq.addEventListener('input', compute);
  compute();
})();



/* The reading bar's own settings button opens the same Appearance sheet. */
(function(){
  var b = document.getElementById('partNavCog'), cog = document.getElementById('cogAppearance');
  if(b && cog) b.addEventListener('click', function(){ cog.click(); });
})();


/* ---------- first-run card: three steps, each ticks itself off ----------
   Shown on Home until all three are done or it's hidden. Nothing leaves the
   phone; it only reads what this device already knows. */
(function(){
  var card = document.getElementById('firstRun');
  if(!card) return;
  var HIDE = 'treebysound-first-run-hidden';
  function installed(){ return window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches); }
  function asked(){ return storeGet('treebysound-first-ask') === '1'; }
  function ticked(){
    try{ for(var i = 1; i <= 4; i++){ var v = JSON.parse(storeGet('treebysound-check-chk-tech-' + i) || '[]'); if(v.some(Boolean)) return true; } }catch(e){}
    return false;
  }
  function sync(){
    var state = {install: installed(), ask: asked(), tick: ticked()};
    var all = true;
    Array.prototype.forEach.call(card.querySelectorAll('[data-step]'), function(li){
      var done = !!state[li.getAttribute('data-step')];
      li.classList.toggle('done', done);
      if(!done) all = false;
    });
    card.hidden = all || storeGet(HIDE) === '1';
  }
  document.getElementById('firstRunHide').addEventListener('click', function(){ storeSet(HIDE, '1'); card.hidden = true; });
  window.addEventListener('hashchange', sync);
  document.addEventListener('change', function(ev){ if(ev.target && ev.target.closest && ev.target.closest('#path-tech')) sync(); });
  window.tbFirstRunSync = sync;
  sync();
})();

/* ---------- floating tools tuck away while reading (phone) ----------
   Scrolling down hides the refresh and Appearance buttons so they stop sitting
   on top of the text; any scroll up, the top of a page, a new screen, or
   keyboard focus on one of them brings them straight back. */
(function(){
  var mq = window.matchMedia ? window.matchMedia('(max-width:820px)') : null;
  var lastY = window.scrollY || 0, ticking = false;
  function set(on){ document.body.classList.toggle('tools-tucked', !!on); }
  function update(){
    ticking = false;
    var y = window.scrollY || 0;
    if(!mq || !mq.matches || y <= 80){ set(false); }
    else if(y > lastY + 6){ set(true); }
    else if(y < lastY - 6){ set(false); }
    lastY = y;
  }
  window.addEventListener('scroll', function(){
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }, {passive:true});
  window.addEventListener('hashchange', function(){ set(false); lastY = window.scrollY || 0; });
  Array.prototype.forEach.call(document.querySelectorAll('.cog-btn'), function(b){
    b.addEventListener('focus', function(){ set(false); });
  });
})();
