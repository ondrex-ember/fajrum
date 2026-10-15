/* FAJRUM D5 – Chronicle & Tomislav's journal, 1680. Presentation only.
   Uses the current narrative entries, player portrait and original artwork.
   Never changes G, save data, chronology or game actions. */
(function () {
  'use strict';
  const node = (tag, className, value) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (value !== undefined) n.textContent = String(value);
    return n;
  };
  const tr = (state, cs, en) => state.lang === 'en' ? en : cs;
  const icon = (asset, name) => {
    const frame = node('span', 'fj-d5-book-emblem');
    frame.setAttribute('aria-hidden', 'true');
    const img = node('img');
    img.src = 'img/ui/nav-' + asset + '.webp';
    img.alt = '';
    img.width = 72; img.height = 72;
    img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('error', () => { img.remove(); frame.textContent = name; }, {once:true});
    frame.append(img);
    return frame;
  };
  function entryKind(entry) {
    if (entry.startsWith('__SEASON__')) return 'season';
    if (entry.startsWith('__MONTH__')) return 'month';
    if (entry.startsWith('__FLAVOR__')) return 'narrative';
    if (entry.startsWith('__PROD__')) return 'production';
    if (entry.startsWith('__ECO__')) return 'economy';
    if (entry.startsWith('__EVT__')) return 'event';
    return 'legacy';
  }
  function heading(section, state, art, subtitle) {
    const title = section.querySelector(':scope > .sec-title');
    if (!title) return;
    title.classList.add('fj-d5-title');
    title.prepend(icon(art, art === 'journal' ? '✒' : '❧'));
    const desc = node('div', 'fj-d5-subtitle', subtitle);
    title.after(desc);
  }
  function chronicle(app, state) {
    const box = app.querySelector('#logBox');
    const section = box?.closest('.sec');
    if (!box || !section || section.classList.contains('fj-d5-chronicle')) return;
    section.classList.add('fj-d5-chronicle');
    box.classList.add('fj-d5-pages');
    const log = Array.isArray(state.log) ? state.log : [];
    const displayed = log.filter(x => typeof x === 'string' && x.trim());
    const count = kind => displayed.filter(x => entryKind(x) === kind).length;
    heading(section, state, 'chronicle', tr(state,
      'Skutečné zápisy ze života lesní sklárny',
      'Recorded events from the forest glassworks'));
    const register = node('div', 'fj-d5-register');
    for (const [cs, en, value] of [
      ['Zápisů', 'Entries', displayed.filter(x => !['season','month'].includes(entryKind(x))).length],
      ['Výroba', 'Production', count('production')],
      ['Události', 'Events', count('event')]
    ]) {
      const item = node('span', 'fj-d5-register-item');
      item.append(node('span','',tr(state, cs, en)), node('strong','',value));
      register.append(item);
    }
    box.before(register);
    if (!log.length) {
      box.classList.add('is-empty');
      return;
    }
    // The original renderer produces one child per non-empty log entry.
    // Only label existing nodes; do not replace or reorder journal text.
    if (box.children.length !== displayed.length) return;
    displayed.forEach((entry, i) => {
      const row = box.children[i];
      row.classList.add('fj-d5-entry', 'fj-d5-entry-' + entryKind(entry));
    });
  }
  function journal(app, state) {
    const portrait = app.querySelector('.fj-player-portrait');
    const section = portrait?.closest('.sec');
    if (!section || section.classList.contains('fj-d5-journal')) return;
    section.classList.add('fj-d5-journal');
    heading(section, state, 'journal', tr(state,
      'Osobní zápisky a cesta skláře',
      'A glassmaker’s notes and path'));
    const identity = portrait.closest('.fj-player-id');
    if (!identity) return;
    identity.classList.add('fj-d5-identity');
    const children = [...section.children];
    const afterIdentity = children.indexOf(identity);
    if (afterIdentity < 0) return;
    const remaining = children.slice(afterIdentity + 1);
    const roles = ['abilities', 'progress', 'timeline', 'stats'];
    remaining.forEach((el, i) => {
      if (!roles[i]) return;
      el.classList.add('fj-d5-' + roles[i]);
      if (roles[i] === 'timeline') {
        // Existing 'opacity:.45' marks future ranks. Show them legibly instead.
        [...el.children].slice(1).forEach(row => {
          row.classList.add('fj-d5-rank-row');
          if (Number(row.style.opacity) < 1) row.classList.add('is-future');
          if (row.textContent.includes('←')) row.classList.add('is-current');
        });
      }
    });
    // This is a textual season label, not a fabricated historical date.
    const season = Number(state.season);
    if (Number.isFinite(season) && season >= 1) {
      const note = node('div', 'fj-d5-journal-folio',
        tr(state, 'Sezóna ', 'Season ') + season);
      section.querySelector('.fj-d5-subtitle')?.after(note);
    }
  }
  function finish(app, state) {
    if (!app || !state || state.phase !== 'playing') return;
    if (state.tab === 'log') chronicle(app, state);
    if (state.tab === 'hrac') journal(app, state);
  }
  window.FajrumD5 = Object.freeze({finish});
})();
