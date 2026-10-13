/* Fajrum mobile, phase 1. Presentation preferences are separate from sh_v9. */
(function () {
  'use strict';
  const KEY = 'fajrum_ui_v1';
  const root = document.documentElement;
  let prefs = { theme: 'dark', resourcesOpen: false, calendarOpen: false, workshop: 'furnace' };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      prefs.theme = saved.theme === 'light' ? 'light' : 'dark';
      prefs.resourcesOpen = saved.resourcesOpen === true;
      prefs.calendarOpen = saved.calendarOpen === true;
      if (['furnace', 'production', 'storage'].includes(saved.workshop)) prefs.workshop = saved.workshop;
    }
  } catch (_) { /* A missing or blocked preference store must not affect the game. */ }
  function savePrefs() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (_) {} }
  function theme() {
    root.dataset.fajrumTheme = prefs.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = prefs.theme === 'dark' ? '#191713' : '#342a20';
  }
  theme();
  const paths = {
    overview: '<path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6M9 8V3h6v5"/>',
    furnace: '<path d="M12 3c2 5-3 6-1 10 2-1 3-3 4-5 4 4 5 8 2 11-4 4-12 1-11-5 0-4 3-6 6-11Z"/>',
    production: '<path d="M9 3h6M10 3v6L5 18c-1 2 0 3 2 3h10c2 0 3-1 2-3l-5-9V3M8 14h8"/>',
    storage: '<path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10M7 5l10 4"/>',
    parta: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4c0-5 12-5 12 0v4M17 4a3 3 0 0 1 0 6M19 13c3 1 3 3 3 8"/>',
    market: '<path d="M3 21h18M12 3v18M5 6h14M5 6l-3 7h6L5 6Zm14 0-3 7h6l-3-7Z"/>',
    more: '<circle cx="4" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="20" cy="12" r="1.4"/>',
    log: '<path d="M6 3h13v18H6a3 3 0 0 1 0-6h13M6 3a3 3 0 0 0-3 3v12M9 7h7M9 11h7"/>',
    accounts: '<path d="M4 3h16v18H4zM8 7h8M8 11h3M15 11h1M8 15h3M15 15h1"/>',
    hrac: '<path d="M5 3h14v18H5zM8 3v18M11 7h5M11 11h5"/>',
    archiv: '<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15"/>',
    settings: '<path d="m9 3-1 3-3 1-2 4 2 2v4l4 2 3-1 3 1 4-2v-4l2-2-2-4-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
    wood: '<path d="m5 6 11-3 5 14-11 4L5 6Zm0 0L2 9l5 13M8 9l10-3M10 16l9-3"/>',
    potash: '<path d="M8 3h8l-1 4c8 11 6 14-3 14S1 18 9 7L8 3Zm1 4h6M6 16h12"/>',
    food: '<path d="M3 19v-9c0-9 18-9 18 0v9H3Zm5-8 2-4M13 11l2-4"/>',
    panev: '<path d="M3 7h18l-3 14H6L3 7Zm0 0c0-4 18-4 18 0M6 11h12"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>'
  };
  function icon(key) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'fj-icon');
    svg.innerHTML = paths[key] || paths.more;
    return svg;
  }
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function button(label, key, action, cls) {
    const node = el('button', cls || 'fj-nav-button');
    node.type = 'button';
    node.setAttribute('aria-label', label);
    node.append(icon(key), el('span', '', label));
    node.addEventListener('click', action);
    return node;
  }
  const cs = (state) => state.lang === 'cs';
  let closeSheet = null;
  function sheet(title, body, app) {
    if (closeSheet) closeSheet();
    const focusBefore = document.activeElement;
    const bg = el('div', 'fj-sheet-backdrop');
    const box = el('section', 'fj-sheet');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', title);
    box.tabIndex = -1;
    const head = el('div', 'fj-sheet-heading');
    head.append(el('h2', '', title));
    const close = el('button', 'fj-sheet-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', root.lang === 'en' ? 'Close' : 'Zavřít');
    let dismiss;
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); dismiss(); }
      if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
      if (event.key !== 'Tab') return;
      const focusable = [...box.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dismiss = () => {
      bg.remove();
      document.removeEventListener('keydown', keydown, true);
      closeSheet = null;
      if (focusBefore && focusBefore.isConnected) focusBefore.focus();
    };
    closeSheet = dismiss;
    close.addEventListener('click', dismiss);
    bg.addEventListener('click', (event) => { if (event.target === bg) dismiss(); });
    document.addEventListener('keydown', keydown, true);
    head.append(close);
    box.append(head, body);
    bg.append(box);
    app.append(bg);
    close.focus();
    return dismiss;
  }
  function beforeRender() {
    if (closeSheet) closeSheet();
    // Dispose graphics belonging to the view being removed, not to the game state.
    for(const canvas of document.querySelectorAll('#app canvas')){
      if(canvas._moltenRaf){cancelAnimationFrame(canvas._moltenRaf);canvas._moltenRaf=0;}
    }
    root.style.setProperty('--fj-viewport-height', `${window.visualViewport ? window.visualViewport.height : window.innerHeight}px`);
  }
  function navigation({ tabBar, state, select, app }) {
    const labels = cs(state)
      ? {overview:'Huť', furnace:'Pec', production:'Výroba', storage:'Sklad', parta:'Parta', market:'Trh', log:'Kronika', accounts:'Správa hutě', hrac:'Deník', archiv:'Archiv', settings:'Nastavení', more:'Více', workshop:'Dílna'}
      : {overview:'Foundry', furnace:'Furnace', production:'Making', storage:'Stock', parta:'Crew', market:'Market', log:'Chronicle', accounts:'Accounts', hrac:'Journal', archiv:'Archive', settings:'Settings', more:'More', workshop:'Workshop'};
    const original = [...tabBar.children];
    const brandCopy = app.querySelector('.fj-brand-copy');
    const references = brandCopy ? [...brandCopy.children].slice(1) : [];
    const network = app.querySelector('.chem-network-wrap');
    const keys = ['overview','production','storage','furnace','market','log','accounts','parta','hrac','archiv'];
    original.forEach((node, i) => {
      node.dataset.fajrumTab = keys[i];
      node.prepend(icon(keys[i]));
      for (const child of [...node.childNodes]) if (child.nodeType === 3) child.remove();
      node.setAttribute('aria-label', labels[keys[i]]);
      if (state.tab === keys[i]) node.setAttribute('aria-current', 'page');
    });
    const workshop = ['furnace','production','storage'];
    if (workshop.includes(state.tab)) { prefs.workshop = state.tab; savePrefs(); }
    const current = workshop.includes(state.tab) ? 'workshop'
      : ['overview','parta','market'].includes(state.tab) ? state.tab : 'more';
    const nav = el('nav', 'fj-bottom-nav');
    nav.setAttribute('aria-label', cs(state) ? 'Hlavní navigace' : 'Main navigation');
    const openMore = () => {
      const list = el('div', 'fj-more-list');
      // Use the original buttons with their original listeners, not a replacement for game actions.
      for (const key of ['accounts','log','hrac','archiv']) {
        const node = original[keys.indexOf(key)];
        node.className = 'fj-more-entry';
        node.replaceChildren(icon(key), el('span','',labels[key]));
        list.append(node);
      }
      list.append(button(labels.settings, 'settings', () => select('settings'), 'fj-more-entry'));
      if(references.length || network){
        const reference=el('section','fj-reference');
        reference.append(el('h3','',cs(state)?'Sklářská Huť · Fajrum':'Glassworks · Fajrum'));
        reference.append(...references);
        if(network)reference.append(network);
        list.append(reference);
      }
      list.append(themeControl(state, select));
      sheet(labels.more, list, app);
    };
    for (const [key, glyph, action] of [
      ['overview','overview',()=>select('overview')],
      ['workshop','production',()=>select(prefs.workshop)],
      ['parta','parta',()=>select('parta')],
      ['market','market',()=>select('market')],
      ['more','more',openMore]
    ]) {
      const node = button(labels[key], glyph, action);
      if (key === 'market') {
        const count = (state.avail || []).length + (state.contracts || []).length;
        if (count) {
          node.append(el('span', 'fj-nav-count', count));
          node.setAttribute('aria-label', `${labels[key]} · ${count} ${cs(state)?'zakázky':'contracts'}`);
        }
      }
      if (key === current) { node.classList.add('is-current'); node.setAttribute('aria-current','page'); }
      nav.append(node);
    }
    let subnav = null;
    if (current === 'workshop') {
      subnav = el('nav','fj-subnav');
      subnav.setAttribute('aria-label', labels.workshop);
      for (const key of workshop) subnav.append(original[keys.indexOf(key)]);
    } else if (current === 'more') {
      subnav = el('div','fj-section-heading');
      subnav.append(icon(state.tab), el('h2','',labels[state.tab] || labels.more));
      subnav.append(button(labels.more,'more',openMore,'fj-section-switch'));
    }
    return {nav, subnav};
  }
  function setTheme(value, refresh) {
    prefs.theme = value === 'light' ? 'light' : 'dark';
    savePrefs(); theme(); refresh();
  }
  function themeControl(state, select) {
    const box = el('section','fj-theme-control');
    box.append(el('h3','',cs(state) ? 'Vzhled hry' : 'Appearance'));
    const choices = el('div','fj-theme-choices');
    for (const [key,glyph,label] of [
      ['dark','moon',cs(state)?'Zakouřená huť':'Smoky foundry'],
      ['light','sun',cs(state)?'Hutní kniha':'Foundry ledger']
    ]) {
      const node = button(label,glyph,()=>setTheme(key,()=>select(state.tab)),'fj-theme-choice');
      node.setAttribute('aria-pressed', String(prefs.theme === key));
      choices.append(node);
    }
    box.append(choices);
    return box;
  }
  function resources(node, state) {
    const details = el('details','fj-resources');
    details.open = prefs.resourcesOpen;
    const summary = el('summary','fj-resource-summary');
    summary.setAttribute('aria-label', cs(state) ? 'Rozbalit všechny zásoby' : 'Expand all resources');
    for (const [key,label,value,warn] of [
      ['wood',cs(state)?'Dřevo':'Wood',state.res.wood,state.res.wood<8],
      ['potash',cs(state)?'Potaš':'Potash',state.res.potash,state.res.potash<2],
      ['food',cs(state)?'Jídlo':'Food',state.res.food,state.res.food<3],
      ['panev',cs(state)?'Pánve':'Crucibles',state.pReady,state.round>=5&&state.pReady<1]
    ]) {
      const cell = el('span','fj-resource-cell'+(warn?' is-warning':''));
      cell.append(icon(key),el('span','fj-resource-label',label),el('strong','',value));
      summary.append(cell);
    }
    summary.append(el('span','fj-resource-chevron','⌄'));
    details.append(summary,node);
    summary.addEventListener('click',()=>{prefs.resourcesOpen=!details.open;savePrefs();});
    details.addEventListener('toggle',()=>{if(details.isConnected){prefs.resourcesOpen=details.open;savePrefs();}});
    return details;
  }
  function calendar(node,state) {
    const pips = node.lastElementChild;
    pips.classList.add('fj-calendar-pips');
    const details = el('details','fj-calendar');
    details.open = prefs.calendarOpen;
    const summary = el('summary','',cs(state)?'Kalendář sezóny':'Season calendar');
    details.append(summary,pips);
    summary.addEventListener('click',()=>{prefs.calendarOpen=!details.open;savePrefs();});
    details.addEventListener('toggle',()=>{if(details.isConnected){prefs.calendarOpen=details.open;savePrefs();}});
    node.append(details);
  }
  function context(panel,state,reports) {
    const wrapper = el('details','fj-context');
    const important = reports.filter(item=>item.warn);
    const summary = el('summary','fj-context-summary');
    const text = cs(state) ? (important.length?`${important.length} upozornění · Sezónní přehled`:'Sezónní přehled')
      : (important.length?`${important.length} alerts · Season overview`:'Season overview');
    summary.append(icon(important.length?'furnace':'overview'),el('span','',text));
    if (important.length) wrapper.classList.add('has-warnings');
    wrapper.append(summary,panel);
    return wrapper;
  }
  // Translate only known interface ink colors. Glass/furnace SVG and canvas art are untouched.
  const colors = new Map();
  const probe = document.createElement('span');
  const register = (token, list) => list.forEach(value=>{probe.style.color=value;colors.set(probe.style.color,token);});
  register('--ink',['#3a2a14','#3a2010','#3a1a08','#2a1a0a','#4a1a0a','#4a3015','#4a2e18','#543714','#5a3a1a','#5a2a10','#5a3a18','#6b3a10','#6a4830']);
  register('--fj-muted',['#8b5e34','#8b6a3a','#8b7a2a','#8b7a5a','#6a4a28','#6a4a2a','#9a7040','#6a4520','#aaa','#bbb','#999','#888']);
  register('--gold',['#c9952b']);
  register('--danger',['#a03020','#a03010']);
  register('--ok',['#4a7a3a','#3a6a2a']);
  register('--blue',['#3a6a9a']);
  register('--fj-amber',['#7a4a1a','#9a7a1a']);
  register('--fj-ruby',['#8a1a1a']);
  register('--fj-purple',['#7a4a9a']);
  register('--ok',['#2a6a3a']);
  const paper = new Map();
  ['#f4e4c1','#e8d5a3','#f0deb8','#e2c990','#f5e9c8','#ead8a5','#dcc690'].forEach(value=>{probe.style.backgroundColor=value;paper.set(probe.style.backgroundColor,'var(--card)');});
  function finish(app,state,select) {
    root.lang = state.lang;
    app.dataset.fajrumPhase = state.phase;
    app.dataset.fajrumTab = state.tab;
    theme();
    for (const node of app.querySelectorAll('[style]')) {
      if (!(node instanceof HTMLElement) || node.closest('svg')) continue;
      const token = colors.get(node.style.color);
      if (token) node.style.color = `var(${token})`;
      if (paper.has(node.style.backgroundColor)) node.style.backgroundColor = paper.get(node.style.backgroundColor);
      if ([...paper.keys()].some(color=>node.style.backgroundImage.includes(color))) node.style.backgroundImage = 'linear-gradient(145deg,var(--card),var(--card2))';
      const inContent = node.closest('.content, .modal, .retention-modal-box');
      const size = parseFloat(node.style.fontSize);
      if (inContent && size>0 && size<13 && !node.closest('.fama-widget')) node.style.fontSize='13px';
    }
    if(!app.classList.contains('desktop')){
      for(const wrap of app.querySelectorAll('.tip-wrap')){
        const trigger=wrap.querySelector('.pill'),tip=wrap.querySelector('.tip');
        if(!trigger||!tip||trigger.dataset.fajrumTip)continue;
        trigger.dataset.fajrumTip='true';
        trigger.setAttribute('role','button');trigger.tabIndex=0;
        trigger.setAttribute('aria-label',`${trigger.textContent} · ${cs(state)?'Podrobnosti':'Details'}`);
        trigger.addEventListener('click',()=>{
          wrap.classList.remove('open');
          const text=el('p','fj-tip-body',tip.textContent);
          sheet(cs(state)?'Zásoby · Podrobnosti':'Resources · Details',text,app);
        });
        trigger.addEventListener('keydown',event=>{
          if(event.key===' '||event.key==='Enter'){event.preventDefault();event.stopPropagation();trigger.click();}
        });
      }
    }
    const header = app.querySelector('.hdr');
    if (header && !header.querySelector('.fj-header-theme')) {
      const toggle = button(cs(state)?'Změnit motiv':'Change theme',prefs.theme==='dark'?'sun':'moon',()=>setTheme(prefs.theme==='dark'?'light':'dark',()=>select(state.tab)),'fj-header-theme');
      toggle.title = cs(state)?'Přepnout světlý / tmavý motiv':'Switch light / dark theme';
      let actions=header.children.length>1?header.lastElementChild:null;
      if(!actions){actions=el('div','fj-header-actions');header.append(actions);}
      actions.prepend(toggle);
    }
    if (state.tab==='settings' && state.phase==='playing') {
      const content=app.querySelector('.content');
      if(content && !content.querySelector('.fj-theme-control')) content.prepend(themeControl(state,select));
    }
    if (state.phase==='intro' && !app.querySelector('.fj-theme-control')) app.prepend(themeControl(state,select));
    // In-scroll SVG labels are part of the existing illustrations; keep their colors and sizes.
  }
  window.FajrumUI = {icon,navigation,resources,calendar,context,finish,beforeRender,sheet};
  let desktopMode = null;
  function viewport() {
    root.style.setProperty('--fj-viewport-height', `${window.visualViewport ? window.visualViewport.height : window.innerHeight}px`);
    const next = window.innerWidth >= 960 && window.innerHeight >= 500;
    if (desktopMode !== null && desktopMode !== next && typeof window.render === 'function') window.render();
    desktopMode = next;
  }
  window.addEventListener('resize', viewport);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', viewport);
  document.addEventListener('DOMContentLoaded', viewport, {once:true});
})();
