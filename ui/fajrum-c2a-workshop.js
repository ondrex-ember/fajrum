/* FAJRUM C2a — Dílna. Presentation only; game state is read, never changed. */
(function () {
  'use strict';

  const stations = [
    ['waldglas', '01'],
    ['crucibles', '02'],
    ['crystal', '03'],
    ['moulds', '04']
  ];

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function createRibbon(state) {
    const english = state.lang === 'en';
    const ribbon = element('section', 'fj-c2a-ribbon');
    ribbon.setAttribute('aria-label', english ? 'Workshop status' : 'Stav dílny');
    const labels = english
      ? ['Furnace', 'Ready crucibles', 'Wooden moulds']
      : ['Pec', 'Hotové pánve', 'Dřevěné formy'];
    const readings = [
      state.fActive ? (english ? 'Running' : 'V chodu') : (english ? 'Idle' : 'Mimo provoz'),
      String(state.pReady ?? 0),
      String(state.res?.formy ?? 0)
    ];
    const icons = ['♨', '◈', '✥'];
    for (let i = 0; i < labels.length; i++) {
      const item = element('div', 'fj-c2a-ribbon-cell');
      const symbol = element('span', 'fj-c2a-ribbon-icon', icons[i]);
      symbol.setAttribute('aria-hidden', 'true');
      const content = element('span', 'fj-c2a-ribbon-copy');
      content.append(element('small', '', labels[i]), element('strong', '', readings[i]));
      item.append(symbol, content);
      ribbon.append(item);
    }
    ribbon.dataset.furnaceActive = state.fActive ? 'true' : 'false';
    return ribbon;
  }

  function finish(app, state) {
    if (!app || !state || state.phase !== 'playing' || state.tab !== 'production') return;
    const content = app.querySelector('.content');
    if (!content) return;
    content.classList.add('fj-c2a-production');

    const waldglas = content.querySelector('.sec[data-worksite="potash"]');
    const crucibles = content.querySelector('.sec.fj-material-card[data-material="panev"]');
    const moulds = content.querySelector('.sec.fj-material-card[data-material="formy"]');
    // Crystal is immediately before the moulds in both current responsive layouts.
    const crystal = moulds?.previousElementSibling?.classList.contains('sec')
      ? moulds.previousElementSibling : null;
    const nodes = [waldglas, crucibles, crystal, moulds];

    stations.forEach(([key, ordinal], i) => {
      const node = nodes[i];
      if (!node) return;
      node.classList.add('fj-c2a-station');
      node.dataset.c2aStation = key;
      const title = node.querySelector(':scope > .sec-title, :scope > .fj-material-heading > .sec-title');
      if (title && !title.querySelector('.fj-c2a-ordinal')) {
        const num = element('span', 'fj-c2a-ordinal', ordinal);
        num.setAttribute('aria-hidden', 'true');
        title.append(num);
      }
    });

    // Existing production hero stays intact; this is an additional slim data strip.
    if (!content.querySelector('.fj-c2a-ribbon')) {
      const ribbon = createRibbon(state);
      const hero = content.querySelector('.fj-section-art[data-art-tab="production"]');
      if (hero) hero.after(ribbon);
      else content.prepend(ribbon);
    }

    // Style the whole blown-glass section but keep every original button/listener.
    const firstRecipe = content.querySelector('.fj-recipe-card');
    const glasswareSection = firstRecipe?.closest('.sec');
    if (glasswareSection && glasswareSection !== waldglas) {
      glasswareSection.classList.add('fj-c2a-glassware');
    }
  }

  window.FajrumC2a = Object.freeze({ finish });
})();
