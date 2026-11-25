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
  const tabs = ['overview', 'production', 'furnace', 'storage', 'forest', 'market', 'parta', 'accounts', 'log', 'archiv', 'hrac'];
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
      chk(qa('.fj-nav-scroll .fj-nav-button').length === 12, 'strip buttons: ' + qa('.fj-nav-scroll .fj-nav-button').length);
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
  // Les: záložka, podzáložky, akce přes UI, Weiss už jen odkaz, nákup sazenic, nouzová seč s potvrzením
  if (process.env.FOREST) {
    const doc = w.document, chk = (c, m) => { if (!c) found.set('FOREST: ' + m, 1); };
    if (process.env.MOBILE) { Object.defineProperty(w, 'innerWidth', { value: 400, configurable: true }); }
    ev('G.huteName="Test"; startGame("'+(process.env.DIFF||'normal')+'"); '+(process.env.EN?'G.lang="en"; ':''));
    ev('Object.keys(G).filter(k=>/Pending$/.test(k)).forEach(k=>{G[k]=Array.isArray(G[k])?[]:false}); G.phase="playing"; G.round=1; G.curEvt=null; G.forestMax=30; G.forest=20; G.grose=20000; goTab("forest","work"); render();');
    const qa = s => [...doc.querySelectorAll(s)], q = s => doc.querySelector(s);
    chk(qa('.fj-nav-scroll [data-strip-tab="forest"]').length === 1, 'strip button Les');
    chk(ev('G.tab') === 'forest' && qa('.fj-sub-chips .detail-subtab').length === 2, 'forest tab with 2 sub-tabs');
    chk(qa('.fj-forest-stage').length === 4 && qa('.fj-forest-cell').length === 30, 'stages/cells: ' + qa('.fj-forest-stage').length + '/' + qa('.fj-forest-cell').length);
    chk(qa('.fj-forest-action').length === 3, 'three action buttons');
    q('.fj-forest-action[data-action="plant"]').click();
    chk(ev('G.forest2.z') === 2 && ev('G.forest2.man') === 2, 'plant via UI: z=' + ev('G.forest2.z') + ' man=' + ev('G.forest2.man'));
    chk(/2/.test(q('.fj-forest-stage[data-stage="Z"] b').textContent), 'UI shows 2 seedlings');
    const hire = qa('.fj-forest-hands button')[0]; hire.click();
    chk(ev('G.forest2.hands') === 1 && ev('G.grose') === 20000 - 800, 'hire hand via UI');
    chk(qa('.fj-forest-flow-line').length >= 2, 'next-winter flow');
    ev('goTab("forest","manage"); render();');
    qa('.fj-forest-choice')[2].click();
    chk(ev('G.forest2.reserve') === 2, 'reserve tier 2 via UI');
    w.confirm = () => true;
    q('[data-emerg]').click();
    chk(ev('G.forest2.emerg') === true, 'emergency felling toggled');
    q('[data-buy="seedlings"]').click();
    chk(ev('G.forest2.z') === 7 && ev('G.forestMax') === 35, 'buy 5 seedling parcels: z=' + ev('G.forest2.z') + ' max=' + ev('G.forestMax'));
    ev('G._sub={market:"weiss"}; G.tab="market"; render();');
    chk(!qa('.fj-forest-wood-row').length && q('[data-goto="forest"]'), 'Weiss shows only a link to Les');
    q('[data-goto="forest"]').click();
    chk(ev('G.tab') === 'forest' && ev('subActive("forest")') === 'manage', 'link opens Les › manage');
    chk(qa('.fj-forest-wood-row').length === 1, 'emergency wood row now in Les');
    ev('G.forest2.hist=[10,12,14]; render();'); chk(qa('.fj-forest-hist-bar').length === 3, 'history bars');
    scan('forest');
    console.log('forest UI checks done');
  }
  if (process.env.ECON2) {
    const doc = w.document, chk = (c, m) => { if (!c) found.set('ECON2: ' + m, 1); };
    if (process.env.MOBILE) { Object.defineProperty(w, 'innerWidth', { value: 400, configurable: true }); }
    ev('G.huteName="Test"; startGame("'+(process.env.DIFF||'normal')+'"); '+(process.env.EN?'G.lang="en"; ':''));
    ev('Object.keys(G).filter(k=>/Pending$/.test(k)).forEach(k=>{G[k]=Array.isArray(G[k])?[]:false}); G.phase="playing"; G.round=3; G.curEvt=null; G.grose=50000; G.pieceAcc=700;');
    const qa = s => [...doc.querySelectorAll(s)], q = s => doc.querySelector(s);
    chk(ev('G._econ') === 2, 'nová hra má _econ=2');
    // W1: karta počasí na Přehledu
    const wxSeed = k => ev('(function(){for(var s=1;s<9999;s++)if(weatherKindFor(s,1,1)==="' + k + '")return s;})()');
    ev('G.season=1; G.round=1; G.wSeed=' + wxSeed('frost') + '; G.tab="overview"; render();');
    const wc = q('.fj-weather-card');
    chk(!!wc && wc.dataset.wx === 'frost' && /❄️/.test(wc.textContent) && !!wc.querySelector('.fj-weather-fx') && /%/.test(wc.querySelector('.fj-weather-risk').textContent), 'karta počasí: mráz s vlivy a rizikem: ' + (wc && wc.textContent.slice(0, 120)));
    ev('G.wSeed=' + wxSeed('normal') + '; render();');
    chk(q('.fj-weather-card') && q('.fj-weather-card').dataset.wx === 'normal' && !q('.fj-weather-fx'), 'karta počasí: běžný měsíc bez vlivů');
    ev('delete G._econ; render();'); chk(!q('.fj-weather-card'), 'klasika: bez karty počasí'); ev('G._econ=2; render();');
    // W2: panel události s volbou + blokace tlačítka Další měsíc
    const sv0 = ev('G.season'), r0 = ev('G.round');
    chk(!q('.fj-fate-card') && !q('.fj-fate-block'), 'bez události: žádný panel ani blokace');
    ev('G.season=2; G.round=5; G.res.wood=50; G.grose=50000; G.fate.pending={kind:"fire",season:2,round:5}; G.tab="overview"; render();');
    chk(qa('.fj-fate-card').length === 1 && qa('.fj-fate-opt').length === 3, 'panel události se 3 volbami');
    chk(qa('.fj-fate-risk').length === 3 && /%/.test(q('.fj-fate-risk').textContent), 'volby ukazují šanci');
    chk(!!q('.fj-fate-block') && /(Nejdřív rozhodni|Decide first)/.test(q('.fj-fate-block').textContent) && !qa('.action-bar .btn').some(b => !b.classList.contains('fj-fate-block')), 'tlačítko Další měsíc nahrazeno textem');
    ev('G.grose=100; G.res.wood=0; render();');
    chk(qa('.fj-fate-opt[disabled]').length === 2 && qa('.fj-fate-why').length === 2, 'bez zásob jsou 2 volby zašedlé s důvodem');
    ev('G.tab="market"; render();'); chk(!!q('.fj-fate-block'), 'blokace je vidět na každé záložce');
    q('.fj-fate-block').click(); chk(ev('G.tab') === 'overview', 'klik na blokaci vede na Přehled');
    q('.fj-fate-opt[data-fate-opt="fate"]').click();
    chk(ev('G.fate.pending') === null && ev('G.fate.hist.length') === 1 && !q('.fj-fate-card') && !q('.fj-fate-block'), 'volba vyřeší událost a vrátí tlačítko');
    // W3: mor (zavřený trh, 2 volby) a Labe (Hoffmann)
    ev('G.season=2; G.round=6; G.res.wood=50; G.grose=50000; G.waldglas=[3,3]; G.mBonus=false; G.fate.pending={kind:"plague",season:2,round:6}; G.tab="overview"; render();');
    chk(qa('.fj-fate-opt').length === 2 && /🦠/.test(q('.fj-fate-card').textContent), 'mor: panel se 2 volbami');
    q('.fj-fate-opt[data-fate-opt="wait"]').click();
    ev('G.tab="market"; G._sub={market:"sell"}; render();');
    const mo = q('.fj-market-open');
    chk(mo && mo.dataset.closed === 'true' && /🦠/.test(mo.textContent), 'mor: trh označen jako zavřený (mor)');
    chk(!qa('.fj-sale-row').length && !qa('[data-market-section="sell"] button.btn-s').some(b => /^1×$/.test(b.textContent)), 'mor: žádná tlačítka prodeje');
    ev('G._sub={market:"weiss"}; render();'); const bo = q('.fj-market-buyout'); chk(!bo || bo.disabled, 'mor: rychlý výkup zašedlý');
    ev('G.round=8; render();'); chk(!q('.fj-market-open') || q('.fj-market-open').dataset.closed === 'false', 'po 2 měsících trh otevřen');
    ev('G.round=6; G.fate.fx=[]; G.contracts=[{id:"h1",item:"crystal",qty:1,reward:10400,due:10,buyer:"Hoffmann",minQ:4,cs:"H",en:"H"}]; G.fate.pending={kind:"elbe",season:2,round:6}; G.tab="overview"; render();');
    chk(qa('.fj-fate-opt').length === 3 && /🚢/.test(q('.fj-fate-card').textContent), 'Labe: panel se 3 volbami');
    q('.fj-fate-opt[data-fate-opt="land"]').click(); chk(ev('G.contracts[0].reward') === 8300, 'Labe: Po souši přepíše odměnu (8300)');
    ev('G.contracts=[]; G.waldglas=[]; G.season=' + sv0 + '; G.round=' + r0 + '; G.grose=50000; G.fate.fx=[]; render();');
    // E3: Cesta z dluhů (jen v potížích), připomínka v souhrnu, „Proč jsem padl“
    ev('G.tab="market"; G._sub={market:"reichel"}; G.grose=50000; G.debt=3000; G.debtMoratorium=0; G.quickSellUsed=false; G.waldglas=[3,3]; G.workers.forEach(w=>{w.unpaidDebt=0}); G.fall.lastOut=0; G.fate.fx=[]; render();');
    chk(!q('.fj-ladder-card'), 'E3: bez potíží se karta Cesta z dluhů neukáže');
    ev('G.workers[0].unpaidDebt=400; render();');
    const lc = q('.fj-ladder-card');
    chk(!!lc && qa('.fj-ladder-step').length === 3 && ['1', '2', '3'].join() === qa('.fj-ladder-step').map(x => x.dataset.ladderStep).join(), 'E3: karta se 3 kroky v pořadí');
    chk(!!q('.fj-ladder-mora') && !!q('.fj-ladder-buyout') && /(160|180)/.test(lc ? lc.textContent : ''), 'E3: tlačítko odkladu, výkupu a řádek o exekuci');
    chk(lc && !/NaN|undefined|Infinity/.test(lc.textContent), 'E3: karta bez NaN/undefined');
    q('.fj-ladder-mora').click(); chk(ev('G.debtMoratorium') > 0 && /(Aktivní|Active)/.test(q(".fj-ladder-card").textContent), 'E3: odklad přes kartu zapnut a karta ukáže aktivní');
    const gb = ev('G.grose'); q('.fj-ladder-buyout').click(); chk(ev('G.grose') > gb && ev('G.quickSellUsed') === true && /(použit|Already)/.test(q('.fj-ladder-card').textContent), 'E3: výkup přes kartu prodá a ukáže „použit“');
    ev('G.workers[0].unpaidDebt=0; G.fall.lastOut=900000; G.grose=100; render();'); chk(!!q('.fj-ladder-card'), 'E3: karta i při nedostatku hotovosti na mzdy+pivo');
    ev('G.fall.lastOut=0; G.workers[0].unpaidDebt=0; render();'); chk(!q('.fj-ladder-card'), 'E3: po vyřešení karta zmizí');
    ev('G.workers[0].unpaidDebt=400; delete G._econ; render();'); chk(!q('.fj-ladder-card'), 'E3: klasika bez karty'); ev('G._econ=2; G.workers[0].unpaidDebt=0; G.grose=50000; G.debt=0; render();');
    ev('G.phase="game_over"; G.failureReason="foreclosure"; G.debt=30000; G.fall={hunger:1,wageMonths:3,wageSum:9000,rentTerms:2,rentSum:4000,noWood:0,closedMonths:0,lastOut:0}; render();');
    chk(qa('.fj-fall-cause').length === 3 && !!q('[data-fall-causes="3"]') && /(PROČ JSEM PADL|WHY I FELL)/.test(q('[data-fall-causes]').textContent), 'E3: game over ukáže 3 největší příčiny');
    const fixedTip = () => qa('div').some(d => !d.children.length && /(Pánve potřebují 2 kola|Crucibles take time)/.test(d.textContent));
    chk(!/NaN|undefined|Infinity/.test(q('[data-fall-causes]').textContent) && !fixedTip(), 'E3: bez pevných rad a bez NaN');
    ev('G.fall={hunger:0,wageMonths:0,wageSum:0,rentTerms:0,rentSum:0,noWood:0,closedMonths:0,lastOut:0}; G.debt=0; render();');
    chk(!qa('.fj-fall-cause').length && !q('[data-fall-causes]') && fixedTip(), 'E3: bez zaznamenaných příčin zůstanou pevné rady');
    ev('G.phase="playing"; G.failureReason=null; G.round=' + r0 + '; G.season=' + sv0 + '; G.grose=50000; G.debt=0; G.tab="overview"; render();');
    // karta dělníka: blok Mzda s verdiktem a vzorcem
    ev('G.tab="parta"; G._partaDetail=G.workers.find(w=>w.prof==="tavic").id; G._partaSubtab="profil"; render();');
    const blk = q('.fj-wage-block');
    chk(!!blk, 'blok Mzda na kartě výrobce');
    if (blk) {
      const t = blk.textContent.replace(/\s+/g, ' ');
      chk(/[🟢🟡🔴]/u.test(t), 'verdikt: ' + t.slice(0, 40));
      chk(/25 %|25%/.test(t) && /(rovným dílem|split equally)/.test(t), 'vzorec fondu: ' + t.slice(0, 200));
      chk(!/NaN|undefined|Infinity/.test(t), 'bez NaN/undefined');
    }
    const helperId = ev('G.workers.find(w=>w.prof==="drvorubc").id');
    ev('G._partaDetail="' + helperId + '"; render();');
    const tb = (q('.fj-wage-block') || { textContent: '' }).textContent;
    chk(!/(rovným dílem|split equally)/.test(tb) && /(Pevná mzda|Fixed wage|Stravné|Meals)/.test(tb), 'pomocný: bez vzorce fondu, s pevnou mzdou');
    ev('G.grose=100; render();'); chk(/🔴/.test((q('.fj-wage-block') || { textContent: '' }).textContent), 'málo hotovosti → 🔴');
    ev('G.grose=50000; G._partaDetail=null; G.tab="accounts"; render();');
    chk(/🏰/.test(doc.body.textContent), 'Účty: předpověď činže');
    // souhrn kola s činží
    ev('G.round=5; G.leaseSeasons=1; G.grose=50000; processRound(); G.phase="summary"; G.tab="overview"; render();');
    chk(ev('G.summary&&G.summary.rent&&G.summary.rent.cash') === 2500 || ev('G.summary&&G.summary.rent&&G.summary.rent.cash') === 2000, 'summary.rent v duben (S2)');
    chk(/🏰/.test(doc.body.textContent), 'souhrn: karta činže');
    ev('G.workers[0].unpaidDebt=0; G.fall.lastOut=0; render();'); chk(!q('.fj-ladder-reminder'), 'E3: souhrn bez potíží nemá připomínku');
    ev('G.workers[0].unpaidDebt=400; render();'); chk(!!q('.fj-ladder-reminder') && /(Cesta z dluhů|Way out of debt)/.test(q('.fj-ladder-reminder').textContent), 'E3: souhrn s dluhem partě má připomínku');
    ev('G.workers[0].unpaidDebt=0; render();');
    scan('econ2');
    console.log('econ2 UI checks done');
  }
  if (process.env.ECON2B) {
    const doc = w.document, chk = (c, m) => { if (!c) found.set('ECON2B: ' + m, 1); };
    if (process.env.MOBILE) { Object.defineProperty(w, 'innerWidth', { value: 400, configurable: true }); }
    ev('G.huteName="Test"; startGame("'+(process.env.DIFF||'normal')+'"); '+(process.env.EN?'G.lang="en"; ':''));
    ev('Object.keys(G).filter(k=>/Pending$/.test(k)).forEach(k=>{G[k]=Array.isArray(G[k])?[]:false}); G.phase="playing"; G.curEvt=null; G.grose=50000; G.round=0; G.workers.forEach(w=>{w.task="idle"}); processRound(); G.phase="playing"; G.curEvt=null; G.events=[]; G.contracts=[]; render();');
    const qa = s => [...doc.querySelectorAll(s)], q = s => doc.querySelector(s);
    chk(ev('G.adv&&G.adv.season') === 1, 'nabídka zálohy založena');
    ev('goTab("market","reichel"); render();');
    chk(!!q('.fj-advance-card') && q('.fj-advance-card').dataset.advState === 'offer', 'karta zálohy v Trh › Reichel');
    chk(qa('.fj-advance-blocker').length === 2 && q('[data-adv-accept]').disabled, 'blokace (důvěra, dluh) + zamčené tlačítko');
    ev('G.debt=0; G.partners.reichel.trust=40; render();');
    chk(qa('.fj-advance-blocker').length === 0 && !q('[data-adv-accept]').disabled, 'bez blokací se dá přijmout');
    const g0 = ev('G.grose'); q('[data-adv-accept]').click();
    chk(ev('G.contracts.some(c=>c.adv)') === true && ev('G.grose') > g0, 'přijetí přes UI: záloha v kase');
    chk(q('.fj-advance-card').dataset.advState === 'active', 'karta přejde do stavu active');
    ev('G.tab="overview"; render();');
    chk(/🧐/.test(doc.body.textContent), 'Přehled: zakázka od Reichela');
    ev('G.tab="market"; G._sub={market:"contracts"}; render();');
    chk(/záloha|advance/i.test(doc.body.textContent), 'aktivní zakázka: poznámka o záloze');
    // jarmark
    ev('G.round=7; G.tab="market"; G._sub={market:"sell"}; G.waldglas=[3,3,3]; render();');
    chk(q('.fj-fair-banner') && q('.fj-fair-banner').dataset.fair === 'soon', 'banner: příští měsíc jarmark');
    ev('G.round=8; render();');
    chk(q('.fj-fair-banner') && q('.fj-fair-banner').dataset.fair === 'on' && /1[,.]3/.test(q('.fj-fair-banner').textContent), 'banner: jarmark ×1,3');
    ev('G.round=9; render();'); chk(!q('.fj-fair-banner'), 'po jarmarku bez banneru');
    scan('econ2b');
    console.log('econ2b UI checks done');
  }
  if (process.env.F1) {
    // F1: sjednocené záhlaví záložek (desktop) — KPI dlaždice, podzáložky v hero, sloučené bloky skryté
    const doc = w.document, chk = (c, m) => { if (!c) found.set('F1: ' + m, 1); };
    ev('G.huteName="Test"; startGame("'+(process.env.DIFF||'normal')+'"); '+(process.env.EN?'G.lang="en"; ':''));
    ev('Object.keys(G).filter(k=>/Pending$/.test(k)).forEach(k=>{G[k]=Array.isArray(G[k])?[]:false}); G.phase="playing"; G.curEvt=null; G.events=[]; render();');
    const q = s => doc.querySelector(s), qa = s => [...doc.querySelectorAll(s)];
    const desk = ev('document.getElementById("app").classList.contains("desktop")');
    if (!desk) { console.log('F1: jsdom není v desktop režimu — přeskočeno'); }
    else {
      const tabs = { overview: 3, furnace: 3, production: 2, storage: 2, market: 4, accounts: 3, log: 2, archiv: 2, forest: 3 };
      for (const t of Object.keys(tabs)) {
        ev(`G.tab=${JSON.stringify(t)}; G._sub=G._sub||{}; render();`);
        const h = q('.content > .fj-f1-head'), sd = h && h.querySelector('.fj-f1-side');
        chk(!!h && !!sd, t + ': hero má boční panel');
        if (!sd) continue;
        chk(sd.querySelector('.fj-f1-title') && sd.querySelector('.fj-f1-title').textContent.trim().length > 1, t + ': nadpis');
        chk(sd.querySelectorAll('.fj-f1-kpi').length >= tabs[t], t + ': KPI dlaždic ≥ ' + tabs[t] + ' (je ' + sd.querySelectorAll('.fj-f1-kpi').length + ')');
        chk(!/NaN|undefined|Infinity|null/.test(sd.textContent), t + ': bez NaN/undefined');
        chk(qa('.content > .fj-f1-head').length === 1, t + ': právě jedno záhlaví');
        if (t !== 'overview' && t !== 'log') chk(!!sd.querySelector('.fj-f1-subs .detail-subtabs, .fj-f1-subs .fj-sub-chips, .fj-f1-subs .fj-d6-tabs'), t + ': podzáložky uvnitř hero');
        chk(!q('.content > .detail-subtabs') && !q('.content > .fj-sub-chips'), t + ': žádné podzáložky mimo hero');
      }
      ev('G.tab="market"; G._sub={market:"sell"}; render();');
      chk(/Tržní kniha|Market ledger/i.test(q('.fj-f1-title').textContent), 'market: název záhlaví');
      ev('G.grose=123456; G.tab="storage"; render();');
      chk(/1[\s\u00a0]?234|zl|fl/.test(q('.fj-f1-side').textContent), 'storage: pokladna v KPI');
      // F2: sbalitelný stavový pruh
      ev('try{localStorage.setItem("fajrum_f2_fold","0")}catch(e){} G.tab="overview"; render();');
      const sp = () => q('.season-panel');
      chk(!!sp() && !!q('.fj-f2-toggle') && !!q('.fj-f2-bar'), 'F2: pruh má tlačítko a souhrn');
      chk(sp() && !sp().classList.contains('fj-f2-folded') && q('.fj-f2-toggle').getAttribute('aria-expanded') === 'true', 'F2: uložená volba 0 = rozbaleno');
      q('.fj-f2-toggle').click();
      chk(sp().classList.contains('fj-f2-folded') && q('.fj-f2-toggle').getAttribute('aria-expanded') === 'false', 'F2: klik sbalí');
      chk(ev('localStorage.getItem("fajrum_f2_fold")') === '1', 'F2: volba uložena');
      ev('G.tab="market"; render();');
      chk(sp().classList.contains('fj-f2-folded'), 'F2: po překreslení zůstává sbaleno');
      chk(/Nálada|Morale/.test(q('.fj-f2-bar').textContent) && !/NaN|undefined/.test(q('.fj-f2-bar').textContent), 'F2: souhrn obsahuje náladu a nemá NaN');
      chk(qa('.season-panel .fj-desktop-status').length === 1, 'F2: původní blok zůstal v DOM');
      q('.fj-f2-toggle').click(); chk(!sp().classList.contains('fj-f2-folded') && ev('localStorage.getItem("fajrum_f2_fold")') === '0', 'F2: klik rozbalí a uloží');
      // F3: Parta a Deník — DOM, na který se váže desktopové CSS, musí existovat
      ev('G.tab="parta"; render();');
      chk(!!q('.sec.fj-c3-roster > .fj-c3-masthead') && !!q('.sec.fj-c3-roster > .fj-c3-summary') && !!q('.fj-c3-roster > .parta-grid'), 'F3: Parta má masthead, souhrn a mřížku jako přímé děti');
      chk(qa('.parta-card.fj-c3-worker').length === ev('G.workers.length') && qa('.parta-card.fj-c3-worker .fj-crew-actions button').length === 2 * ev('G.workers.length'), 'F3: karta na každého dělníka se 2 tlačítky');
      ev('G.tab="hrac"; render();');
      chk(['.fj-d5-title', '.fj-d5-identity', '.fj-d5-abilities', '.fj-d5-progress', '.fj-d5-timeline', '.fj-d5-stats'].every(s => !!q('.sec.fj-d5-journal > ' + s)), 'F3: Deník má všech 6 bloků jako přímé děti');
    }
    console.log('F1 tabs checked:', desk ? Object.keys({overview:1,furnace:1,production:1,storage:1,market:1,accounts:1,log:1,archiv:1,forest:1}).length : 0, 'KPI market:', desk ? ev('document.querySelectorAll(".fj-f1-kpi").length') : '-');
    scan('f1');
    console.log('F1 UI checks done');
  }
  if (process.env.GUIDE) { ev('G.tab="overview"; G.phase="playing"; render();'); const c = w.document.querySelector('.fj-guide-card'); console.log('guide card:', c ? c.textContent.replace(/\s+/g, ' ').slice(0, 300) : 'none'); }
  if (process.env.DUMP) for (const t of process.env.DUMP.split(',')) { ev(`G.phase='playing'; G.tab=${JSON.stringify(t)}; render();`); const bc = w.document.body.cloneNode(true); bc.querySelectorAll('script,style,svg,iframe').forEach(n => n.remove()); console.log('=== ' + t + '\n' + [...bc.querySelectorAll('[data-partner-card]')].map(n => n.textContent.replace(/\s+/g, ' ').slice(0, 900)).join('\n')); }
  console.log('rounds processed:', rounds, 'phase:', ev('G.phase'), 'season:', ev('G.season'));
  console.log('jsdom errors:', errors.length); errors.slice(0, 10).forEach(e => console.log('  ' + e));
  console.log('findings:', found.size); [...found.keys()].slice(0, 60).forEach(k => console.log('  ' + k));
  process.exit(0);
})();
