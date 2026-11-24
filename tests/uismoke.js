'use strict';
// DOM smoke test (needs `npm i jsdom` outside the repo: NODE_PATH=/path/to/node_modules node tests/uismoke.js).
// Starts a game, plays some rounds with the bot's simple moves, opens every tab and scans rendered text for
// NaN/undefined/[object and for leftover groat-style amounts ("12g", "3.5 g").
const path = require('path');
const http = require('http');
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => /googletagmanager|Could not load (link|img|media)|not implemented/i.test(e.message) || errors.push('jsdomError: ' + (e.detail && e.detail.message || e.message)));
const BAD = [/NaN/, /undefined/, /\[object/, /(^|[\s(~+\-–])\d+([.,]\d+)?\s?g(\b|$)(?!\w)/];
(async () => {
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream'); fs.createReadStream(p).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const dom = await JSDOM.fromURL(base, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      w.HTMLMediaElement.prototype.play = () => Promise.resolve(); w.HTMLMediaElement.prototype.pause = () => {};
      w.scrollTo = () => {}; w.Element.prototype.scrollTo = () => {}; w.Element.prototype.scrollIntoView = () => {};
      w.AudioContext = w.webkitAudioContext = undefined;
      // jsdom has no canvas: a no-op 2D context lets the molten/furnace drawings run (they only paint)
      const noop = new Proxy(function () {}, { get: (t, k) => k === 'canvas' ? {} : noop, apply: () => noop, set: () => true });
      w.HTMLCanvasElement.prototype.getContext = () => noop;
    },
  });
  const w = dom.window;
  await new Promise(r => w.addEventListener('load', r));
  await new Promise(r => setTimeout(r, 300));
  const ev = s => w.eval(s);
  const found = new Map();
  function scan(label) {
    const txt = w.document.getElementById('app') ? w.document.getElementById('app').innerText || w.document.getElementById('app').textContent : w.document.body.textContent;
    const bc = w.document.body.cloneNode(true); bc.querySelectorAll('script,style,noscript,svg').forEach(n => n.remove());
    const full = bc.textContent.replace(/\s+/g, ' ');
    for (const re of BAD) {
      let m; const g = new RegExp(re.source, 'g');
      while ((m = g.exec(full))) { const ctx = full.slice(Math.max(0, m.index - 40), m.index + 40); const k = label + ' | ' + re.source.slice(0, 12) + ' | ' + ctx; if (!found.has(k)) found.set(k, 1); }
    }
  }
  try {
    ev('G.huteName="Test"; startGame("'+(process.env.DIFF||'normal')+'"); '+(process.env.EN?'G.lang="en"; ':'')+'render();');
  } catch (e) { console.log('startGame failed:', e.message); }
  const tabs = ['overview', 'production', 'furnace', 'storage', 'market', 'parta', 'accounts', 'log', 'archiv', 'hrac'];
  const sweep = label => {
    for (const t of tabs) { try { ev(`G.tab=${JSON.stringify(t)}; render();`); scan(label + ':' + t); } catch (e) { found.set(`${label}:${t} threw ${e.message}`, 1); } }
    for (const t of Object.keys(JSON.parse(ev('JSON.stringify(Object.fromEntries(Object.entries(SUBTABS).map(([k,v])=>[k,v.map(s=>s.id)])))')))) {
      for (const id of JSON.parse(ev(`JSON.stringify(SUBTABS[${JSON.stringify(t)}].map(s=>s.id))`))) {
        try {
          ev(`Object.keys(G).filter(k=>/Pending$/.test(k)).forEach(k=>{G[k]=Array.isArray(G[k])?[]:false}); G.tab=${JSON.stringify(t)}; G._sub=G._sub||{}; G._sub[${JSON.stringify(t)}]=${JSON.stringify(id)}; render();`);
          scan(label + ':' + t + '/' + id);
          if (process.env.SUBDBG && !w.document.querySelector('.fj-sub-chips')) console.log('NOCHIPS', label, t, id, w.document.getElementById('app').textContent.slice(0, 120), ev('JSON.stringify([G._loyaltyModalPending,G.curEvt&&1,G.phase])'));
          const secs = w.document.querySelectorAll('.content .sec').length;
          const active = ev(`subActive(${JSON.stringify(t)})`);
          if (active === id && secs < 1) found.set(`${label}:${t}/${id} renders no section`, 1);
          if (w.document.querySelectorAll('.fj-sub-chips .detail-subtab.active').length !== 1) found.set(`${label}:${t}/${id} chip state`, 1);
        } catch (e) { found.set(`${label}:${t}/${id} threw ${e.message}`, 1); if (process.env.SUBDBG) console.log(e.stack.split("\n").slice(0,6).join("\n")); }
      }
    }
    ev('G._sub={}');
    for (const st of ['profil', 'workers', 'hire', 'contracts']) { try { ev(`G.tab="parta"; G._partaSubtab=${JSON.stringify(st)}; render();`); scan(label + ':parta/' + st); } catch (e) { found.set(`${label}:parta/${st} threw ${e.message}`, 1); } }
  };
  let rounds = 0, seasonsDone = 0;
  const MAXR = +(process.env.ROUNDS || 40);
  for (let step = 0; step < MAXR * 4 && rounds < MAXR; step++) {
    const ph = ev('G.phase');
    const lab = `r${rounds}/${ph}`;
    try {
      if (ph === 'playing') {
        sweep(lab);
        if (rounds === 3 && process.env.DEBT) ev('G.debt=4500; G.grose=900; G.workers.forEach(w=>{w.unpaidDebt=250});');
        if (rounds === 3 && !process.env.DEBT) ev('G.debt=300; G.workers.forEach(w=>{w.unpaidDebt=250});');
        if (rounds % 3 === 1) ev('try{craftBlown("pullitr","waldglas")}catch(e){} try{sellItems("waldglas",2)}catch(e){}');
        if (process.env.RICH) ev('G.grose=Math.max(G.grose,400000); G.res.wood=Math.max(G.res.wood,300); G.res.sand=Math.max(G.res.sand||0,300);');
        ev('processRound()'); rounds++;
      } else if (ph === 'event') { ev('render()'); scan(lab); ev('dismissEvt()'); }
      else if (ph === 'summary') { ev('render()'); scan(lab); ev('continueFromSummary()'); }
      else if (ph === 'interseason') { ev('render()'); scan(lab); ev('startNewSeason()'); seasonsDone++; }
      else if (ph === 'game_over') { ev('render()'); scan(lab); break; }
      else { ev('render()'); scan(lab); break; }
    } catch (e) { found.set(`${lab} threw ${e.message.slice(0, 120)}`, 1); break; }
  }
  // Zásoby: pills se značkou, bublina po kliku, tlačítko do Skladu, panel na Přehledu, žádné surovinové řádky v „Vyžaduje pozornost“
  if (process.env.STOCK) {
    const doc = w.document, chk = (c, m) => { if (!c) found.set('STOCK: ' + m, 1); };
    if (process.env.MOBILE) { Object.defineProperty(w, 'innerWidth', { value: 400, configurable: true }); }
    ev('G.huteName="Test"; startGame("'+(process.env.DIFF||'normal')+'"); '+(process.env.EN?'G.lang="en"; ':''));   // čistá hra, ať stav z dlouhého běhu nevadí
    ev('G._loyaltyModalPending=false; G.curEvt=null; G.workers.forEach(w=>{w.unpaidDebt=0;w.loyalty=80}); G.phase="playing"; G.round=8; G.res.sand=2; G.res.potash=5; G.res.wood=3; G.res.food=1; G.pReady=0; G.tab="overview"; render();');
    const q = s => doc.querySelector(s), qa = s => [...doc.querySelectorAll(s)];
    chk(qa('.stk-pill').length >= 8, 'pills with stock bubble: ' + qa('.stk-pill').length);
    chk(qa('.stk-pill .stk-mark.crit').length >= 3, 'crit marks: ' + qa('.stk-pill .stk-mark.crit').length);
    chk(qa('.stk-pill .stk-mark.warn').length >= 1, 'warn marks');
    chk(q('.fj-stock-panel'), 'panel missing');
    chk(qa('.fj-stock-panel .stk-alert.crit').length >= 3 && q('.fj-stock-panel .stk-alert.warn'), 'panel alerts');
    chk(qa('.fj-stock-panel .stk-tile').length === 10, 'panel tiles: ' + qa('.fj-stock-panel .stk-tile').length);
    chk(!/Dřevo: \d+ — kriticky|Potaš: \d|Jídlo: \d+ — hrozí|Žádné pánve — tavení stojí/.test((q('.attention-banner') || { textContent: '' }).textContent), 'resource rows still in attention banner');
    qa('.stk-pill')[qa('.stk-pill').findIndex(n => n.dataset.stock === 'sand')].click();
    chk(q('.fj-sheet .stk-bubble[data-stock="sand"]'), 'bubble not opened');
    const bub = (q('.fj-sheet') || { textContent: '' }).textContent;
    chk(/Písek/.test(bub) || /Sand/.test(bub), 'bubble has no name');
    chk(/Weiss/.test(bub), 'bubble has no Weiss line');
    chk(/NESTAČÍ|SHORT|DOŠLO|OUT/.test(bub), 'bubble has no state');
    const open = q('.fj-sheet .stk-open'); chk(open, 'no open button');
    if (open) { open.click(); chk(ev('G.tab') === 'storage' && ev('subActive("storage")') === 'raw', 'open button → tab ' + ev('G.tab') + '/' + ev('subActive("storage")')); chk(!q('.fj-sheet'), 'sheet should close'); chk(q('.content .fj-sub-chips [data-sub="raw"].active'), 'raw chip active'); }
    ev('G.tab="overview"; render();');
    qa('.fj-stock-panel .stk-tile').find(n => n.dataset.stock === 'morale') || 0;
    qa('.stk-pill').find(n => n.dataset.stock === 'morale').click();
    const mo = q('.fj-sheet .stk-open'); chk(mo && /Huť|Foundry/.test(mo.textContent), 'morale → Foundry button');
    if (mo) { mo.click(); chk(ev('G.tab') === 'accounts' && ev('subActive("accounts")') === 'accounts', 'morale open → accounts/accounts'); }
    ev('G.tab="overview"; render();');
    qa('.stk-pill').find(n => n.dataset.stock === 'forest').click();
    chk(!q('.fj-sheet .stk-open'), 'forest tab button must be hidden until the Les tab exists');
    ev('render()');
    scan('stock');
    if (process.env.STOCK_DUMP) { ev('G.tab="overview"; render();'); console.log('PANEL:', q('.fj-stock-panel').textContent.replace(/\s+/g,' ')); qa('.stk-pill').find(n => n.dataset.stock === 'wood').click(); console.log('BUBBLE:', q('.fj-sheet').textContent.replace(/\s+/g,' ')); }
    console.log('stock UI checks done');
  }
  // Bubliny „proč nejde úkol“ + navigační pruh
  if (process.env.TASKS) {
    const doc = w.document, chk = (c, m) => { if (!c) found.set('TASKS: ' + m, 1); };
    if (process.env.MOBILE) { Object.defineProperty(w, 'innerWidth', { value: 400, configurable: true }); }
    const q = s => doc.querySelector(s), qa = s => [...doc.querySelectorAll(s)];
    ev('G.huteName="Test"; startGame("'+(process.env.DIFF||'normal')+'"); '+(process.env.EN?'G.lang="en"; ':''));
    ev('Object.keys(G).filter(k=>/Pending$/.test(k)).forEach(k=>{G[k]=Array.isArray(G[k])?[]:false}); G.phase="playing"; G.tab="overview"; G.round=1; G.res.food=9; G.workers.forEach(x=>{x.task="idle";x.fat=0.5}); render();');
    const mobile = !!process.env.MOBILE;
    if (mobile) {
      chk(q('.fj-nav-strip .fj-nav-scroll'), 'nav strip missing');
      chk(qa('.fj-nav-scroll .fj-nav-button').length === 11, 'strip buttons: ' + qa('.fj-nav-scroll .fj-nav-button').length);
      chk(q('.fj-nav-strip > .fj-nav-more'), 'More not pinned outside the scroller');
      chk(q('.fj-nav-scroll .is-current[data-strip-tab="overview"]'), 'current section not marked');
      qa('.fj-nav-scroll .fj-nav-button').find(n => n.dataset.stripTab === 'market').click();
      chk(ev('G.tab') === 'market', 'strip click → market (' + ev('G.tab') + ')');
      chk(q('.fj-nav-scroll .is-current[data-stripTab="market"],.fj-nav-scroll [data-strip-tab="market"].is-current'), 'current follows tab');
      q('.fj-nav-more').click(); chk(q('.fj-sheet .fj-more-list'), 'More sheet'); ev('FajrumUI.beforeRender()');
      ev('G.tab="overview"; render();');
      // na mobilu je grid úkolů v sheetu „Změnit práci“
      const btn = qa('.worker-card .btn-p').find(n => /Změnit práci|Change work/.test(n.textContent)); chk(btn, 'change-work button'); if (btn) btn.click();
    }
    const field = qa('.btn.is-veiled').find(n => /Políčko|Field/.test(n.textContent)); chk(field, 'veiled field chip in winter');
    chk(qa('.fj-task-warn').length === 0, 'no active warning for resting workers');
    if (field) { field.click(); chk(q('.fj-sheet .tb-bubble[data-task="field"]'), 'hard bubble not opened'); chk(!q('.fj-sheet .tb-assign'), 'hard bubble must not offer assignment'); chk(/března|March/.test(q('.fj-sheet').textContent), 'bubble names the month'); chk(ev('G.workers[0].task') === 'idle', 'hard click must not assign'); ev('FajrumUI.beforeRender()'); }
    // měkké: formař na jaře bez dřeva → „Přesto přidělit“ přidělí
    ev('G.round=6; G.res.wood=0; G.res.water=0; G.workers.forEach(x=>{x.task="idle";x.fat=0.5}); G.tab="overview"; render();');
    if (mobile) { const b2 = qa('.worker-card .btn-p').find(n => /Změnit práci|Change work/.test(n.textContent)); if (b2) b2.click(); }
    const wid = ev('G.workers.findIndex(x=>x.prof==="formar"||workerTaskOptions(x).primary.some(p=>p.t==="formar"))');
    const formar = qa('.btn.is-veiled').find(n => /Formař|Mould/.test(n.textContent)); chk(formar, 'veiled formar chip');
    if (formar) { formar.click(); const as = q('.fj-sheet .tb-assign'); chk(as, 'soft bubble offers assign'); if (as) { const before = ev('JSON.stringify(G.workers.map(x=>x.task))'); as.click(); chk(ev('JSON.stringify(G.workers.map(x=>x.task))') !== before, 'assign anyway changed a task'); chk(!q('.fj-sheet .tb-bubble'), 'bubble closes'); } }
    // aktivní úkol bez výsledku → ⚠ pod čipy
    ev('G.round=1; G.workers[0].task="field"; G.tab="overview"; render();');
    chk(qa('.fj-task-warn').some(n => /nic nevyrobí|produces nothing/.test(n.textContent)), 'active warning for field in winter');
    ev('G.tab="parta"; render();'); chk(qa('.fj-task-warn').length >= 1 || !mobile, 'warning on the Parta card');
    scan('tasks');
    console.log('task UI checks done');
  }
  // Zakázky 1b-1: 5 nabídek v Trhu, minQ v textu, Fama podle odměny, po přijetí 3 sloty plné, vlna v kole 4
  if (process.env.CONTRACTS) {
    const doc = w.document, chk = (c, m) => { if (!c) found.set('CONTRACTS: ' + m, 1); };
    if (process.env.MOBILE) { Object.defineProperty(w, 'innerWidth', { value: 400, configurable: true }); }
    ev('G.huteName="Test"; startGame("'+(process.env.DIFF||'normal')+'"); '+(process.env.EN?'G.lang="en"; ':''));
    ev('Object.keys(G).filter(k=>/Pending$/.test(k)).forEach(k=>{G[k]=Array.isArray(G[k])?[]:false}); G.phase="playing"; G.round=1; G.curEvt=null; goTab("market","contracts"); render();');
    const qa = s => [...doc.querySelectorAll(s)];
    chk(qa('.fj-contract-offer').length === 5, 'offers rendered: ' + qa('.fj-contract-offer').length);
    chk(qa('.fj-contract-offer').every(n => /★|min/.test(n.textContent)), 'offer text lacks the minimal stars');
    const famaTexts = new Set(qa('.fj-contract-offer').map(n => (n.textContent.match(/[🕊⚔🌍]\uFE0F?\s*\+(\d+)/u) || ['', ''])[1]));
    if (process.env.DUMP) console.log('OFFER', qa('.fj-contract-offer').map(n => n.textContent).join(' // '));
    chk(famaTexts.size >= 2, 'Fama gain should vary with reward: ' + [...famaTexts].join('|'));
    for (let i = 0; i < 5; i++) { const b = qa('.fj-contract-offer button, .fj-contract-offer .btn')[0]; if (b) { b.click(); } }
    chk(ev('G.contracts.length') === 3 && ev('G.avail.length') === 2, 'accept cap 3/5: ' + ev('G.contracts.length') + '/' + ev('G.avail.length'));
    chk(qa('.fj-contract-card[data-contract-kind="market"]').length === 3, 'active cards: ' + qa('.fj-contract-card[data-contract-kind="market"]').length);
    chk(/Plno tržních zakázek|Market contract slots full/.test(doc.body.textContent), 'slots-full note');
    // vlna: po zpracování kola 4 přibudou nabídky a ukáže se odznak
    ev('G.contracts=[]; G.round=4; G.avail=G.avail.slice(0,1); G.workers.forEach(x=>{x.task="idle"}); G.fActive=false; processRound(); G.curEvt=null; G.events=[]; G.phase="playing"; G.tab="market"; render();');
    chk(ev('G.avail.length') >= 1 && ev('G.avail.length') <= 3, 'wave size: ' + ev('G.avail.length'));
    scan('contracts');
    console.log('contract UI checks done');
  }
  if (process.env.GUIDE) { ev('G.tab="overview"; G.phase="playing"; render();'); const c = w.document.querySelector('.fj-guide-card'); console.log('guide card:', c ? c.textContent.replace(/\s+/g, ' ').slice(0, 300) : 'none'); }
  if (process.env.DUMP) for (const t of process.env.DUMP.split(',')) { ev(`G.phase='playing'; G.tab=${JSON.stringify(t)}; render();`); const bc = w.document.body.cloneNode(true); bc.querySelectorAll('script,style,svg,iframe').forEach(n => n.remove()); console.log('=== ' + t + '\n' + [...bc.querySelectorAll('[data-partner-card]')].map(n => n.textContent.replace(/\s+/g, ' ').slice(0, 900)).join('\n')); }
  console.log('rounds processed:', rounds, 'phase:', ev('G.phase'), 'season:', ev('G.season'));
  console.log('jsdom errors:', errors.length); errors.slice(0, 10).forEach(e => console.log('  ' + e));
  console.log('findings:', found.size); [...found.keys()].slice(0, 60).forEach(k => console.log('  ' + k));
  process.exit(0);
})();
