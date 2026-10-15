/* FAJRUM D6 — the existing archive, sample book and parchment entries.
   Presentation only. No changes to G, unlocks, recipes, buttons or save state.
   Uses only images already present in the game's GitHub repository. */
(function () {
  'use strict';
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = String(text);
    return element;
  };
  const translate = (state, cs, en) => state.lang === 'en' ? en : cs;
  function emblem() {
    const frame = make('span', 'fj-d6-emblem');
    frame.setAttribute('aria-hidden', 'true');
    const image = make('img');
    image.src = 'img/ui/nav-archive.webp';
    image.alt = '';
    image.width = 72;
    image.height = 72;
    image.decoding = 'async';
    image.loading = 'lazy';
    image.addEventListener('error', () => { frame.textContent = '❧'; image.remove(); }, {once:true});
    frame.append(image);
    return frame;
  }
  function summary(label, number) {
    const cell = make('span','fj-d6-register-cell');
    cell.append(make('span','',label),make('strong','',String(number)));
    return cell;
  }
  function register(section, state) {
    const head = make('header','fj-d6-register');
    const lead = make('div','fj-d6-register-lead');
    const words = make('div','fj-d6-register-copy');
    words.append(
      make('span','fj-d6-kicker',translate(state,'LESNÍ SKLÁRNA · KNIHA VZORKŮ','FOREST GLASSWORKS · SAMPLE BOOK')),
      make('h2','',translate(state,'Hutní archiv','Glassworks archive')),
      make('p','',translate(state,'Výrobky, záznamy a úspěchy z této hutě','Objects, records and achievements of this glassworks'))
    );
    lead.append(emblem(), words);
    const counts = make('div','fj-d6-register-counts');
    counts.append(
      summary(translate(state,'Získané úspěchy','Earned achievements'), Array.isArray(state.achievements) ? state.achievements.length : 0),
      summary(translate(state,'Odemčené zápisy','Unlocked records'), Array.isArray(state.wikiDiscovered) ? state.wikiDiscovered.length : 0)
    );
    head.append(lead,counts);
    section.querySelector(':scope > .sec-title')?.after(head);
  }
  function achievements(section) {
    section.classList.add('fj-d6-achievements');
    for (const grid of section.querySelectorAll('.ach-grid')) {
      grid.classList.add('fj-d6-achievement-grid');
      for (const card of grid.children) {
        if (card.classList.contains('ach-card')) card.classList.add('fj-d6-achievement-card');
      }
    }
    const commission = section.querySelector('.fj-commission-card')?.parentElement?.parentElement;
    if (commission) commission.classList.add('fj-d6-commissions');
    for (const title of section.querySelectorAll('.ach-cat-hdr')) title.classList.add('fj-d6-category-heading');
  }
  function codex(section, state) {
    section.classList.add('fj-d6-codex');
    const rows = [...section.querySelectorAll('.fj-codex-row')];
    // The source renderer has one parent block per recipe group. We keep
    // this grouping and all existing illustrations from FajrumProducts.
    for (const block of new Set(rows.map(row => row.parentElement))) {
      if (!block) continue;
      block.classList.add('fj-d6-codex-group');
      const header = block.firstElementChild;
      if (header && !header.classList.contains('fj-codex-row')) header.classList.add('fj-d6-group-heading');
      const number = block.querySelectorAll('.fj-codex-row').length;
      if (number > 0 && header) {
        const count = make('span','fj-d6-group-count',String(number));
        count.setAttribute('aria-label',translate(state,'Počet položek: ','Entries: ')+number);
        header.append(count);
      }
    }
    rows.forEach(row => {
      row.classList.add('fj-d6-sample-row');
      const copy = row.querySelector(':scope > div:last-child');
      if (!copy) return;
      copy.classList.add('fj-d6-sample-copy');
      const top = copy.firstElementChild;
      if (top) top.classList.add('fj-d6-sample-heading');
      const recipe = copy.querySelector('.fj-codex-recipe');
      if (recipe) recipe.classList.add('fj-d6-sample-recipe');
      const note = recipe?.nextElementSibling;
      if (note) note.classList.add('fj-d6-sample-note');
    });
    const intro = section.querySelector(':scope > .detail-subtabs + div');
    if (intro && !intro.querySelector('.fj-codex-row')) intro.classList.add('fj-d6-section-intro');
  }
  function parchment(section) {
    section.classList.add('fj-d6-parchment');
    const grid = section.querySelector('.wiki-grid');
    if (grid) {
      grid.classList.add('fj-d6-parchment-pages');
      for (const card of grid.querySelectorAll('.wiki-card')) card.classList.add('fj-d6-parchment-page');
    } else {
      // Only the existing empty state; no invented historical text.
      section.lastElementChild?.classList.add('fj-d6-parchment-empty');
    }
  }
  function finish(app, state) {
    if (!app || !state || state.phase !== 'playing' || state.tab !== 'archiv') return;
    const content = app.querySelector('.content');
    const subtabs = content?.querySelector('.detail-subtabs');
    const section = subtabs?.closest('.sec');
    if (!section || section.classList.contains('fj-d6-archive')) return;
    content.classList.add('fj-d6-archive-view');
    content.dataset.d6Lang = state.lang === 'en' ? 'en' : 'cs';
    section.classList.add('fj-d6-archive');
    const illustration = content.querySelector('.fj-section-art[data-art-tab="archiv"]');
    if (illustration) illustration.classList.add('fj-d6-archive-scene');
    register(section, state);
    subtabs.classList.add('fj-d6-tabs');
    for (const button of subtabs.querySelectorAll('button')) button.classList.add('fj-d6-tab');
    const active = subtabs.querySelector('.active');
    if (active) active.setAttribute('aria-current','page');
    const subtab = state._archivSubtab || 'achievements';
    section.dataset.d6Page = subtab;
    if (subtab === 'achievements') achievements(section);
    else if (subtab === 'codex') codex(section,state);
    else if (subtab === 'wiki') parchment(section);
  }
  window.FajrumD6 = Object.freeze({finish});
})();
