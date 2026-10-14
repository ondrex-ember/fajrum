/* FAJRUM C2b — Pec: purely presentational, state read-only. */
(function () {
  'use strict';

  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = String(text);
    return el;
  };
  const numeric = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function heatState(state, heat) {
    if (!state.fActive) return heat > 10 ? 'embers' : 'cold';
    if (heat > 87) return 'danger';
    if (heat >= 68) return 'working';
    return 'warming';
  }

  function plate(state) {
    const en = state.lang === 'en';
    const heat = clamp(numeric(state.fTemp), 0, 100);
    const status = heatState(state, heat);
    const labels = {
      cold:    en ? 'Cold hearth' : 'Studená pec',
      embers:  en ? 'Residual heat' : 'Zbytkový žár',
      warming: en ? 'Warming up' : 'Rozehřívání',
      working: en ? 'Working heat' : 'Pracovní žár',
      danger:  en ? 'Overheated' : 'Přetopeno'
    };
    const root = make('section', 'fj-c2b-plate');
    root.dataset.heatState = status;
    root.setAttribute('aria-label', en ? 'Furnace instrument plate' : 'Přístrojová deska pece');
    const head = make('div', 'fj-c2b-plate-head');
    const emblem = make('span', 'fj-c2b-emblem', '✣');
    emblem.setAttribute('aria-hidden','true');
    const name = make('div', 'fj-c2b-heading');
    name.append(
      make('span', 'fj-c2b-eyebrow', en ? 'FOREST GLASSWORKS · ANNO 1680' : 'LESNÍ HUŤ · ANNO 1680'),
      make('h3', '', en ? 'Melting chamber' : 'Tavicí komora')
    );
    const chip = make('span', 'fj-c2b-chip', labels[status]);
    head.append(emblem, name, chip);

    const title = make('div', 'fj-c2b-thermo-title');
    title.append(
      make('span', '', en ? 'Furnace temperature' : 'Teplota pece'),
      make('strong', '', heat + ' %')
    );
    const scale = make('div', 'fj-c2b-thermo');
    scale.setAttribute('role', 'meter');
    scale.setAttribute('aria-label', en ? 'Furnace heat percentage' : 'Žár pece v procentech');
    scale.setAttribute('aria-valuemin', '0');
    scale.setAttribute('aria-valuemax', '100');
    scale.setAttribute('aria-valuenow', String(heat));
    scale.setAttribute('aria-valuetext', `${heat} % · ${labels[status]}`);
    const track = make('div', 'fj-c2b-thermo-track');
    track.append(make('i', 'fj-c2b-zone fj-c2b-zone-prep'),
                 make('i', 'fj-c2b-zone fj-c2b-zone-work'),
                 make('i', 'fj-c2b-zone fj-c2b-zone-danger'));
    const marker = make('span', 'fj-c2b-thermo-marker');
    marker.style.left = clamp(heat, 1.5, 98.5) + '%';
    marker.setAttribute('aria-hidden','true');
    track.append(marker);
    scale.append(track);
    const legend = make('div', 'fj-c2b-legend');
    legend.append(
      make('span', '', en ? '0% · cold' : '0 % · studená'),
      make('span', '', en ? '68–87% · melt' : '68–87 % · tavení'),
      make('span', '', en ? '> 87% · risk' : '> 87 % · riziko')
    );
    const foot = make('div', 'fj-c2b-plate-facts');
    const batches = Array.isArray(state.activeBatches) ? state.activeBatches.length : 0;
    const maxSlots = Math.max(1, numeric(({primitive:1,stone:2,master:4})[state.furnace?.type], 1));
    const wood = numeric(state.res?.wood);
    const wear = clamp(numeric(state.furnace?.shamotWear), 0, 100);
    for (const [label, value, warning] of [
      [en ? 'Active batches' : 'Tavené várky', `${batches}/${maxSlots}`, false],
      [en ? 'Wood in store' : 'Dřevo skladem', wood, wood < 8],
      [en ? 'Lining wear' : 'Opotřebení šamotu', `${wear} %`, wear > 70]
    ]) {
      const cell = make('div', 'fj-c2b-plate-fact');
      if (warning) cell.classList.add('is-alert');
      cell.append(make('small', '', label),make('strong', '', value));
      foot.append(cell);
    }
    root.append(head,title,scale,legend,foot);
    return root;
  }

  function finish(app, state) {
    if (!app || !state || state.phase !== 'playing' || state.tab !== 'furnace') return;
    const content = app.querySelector('.content');
    const dash = content?.querySelector('.furnace-dash');
    if (!content || !dash || content.classList.contains('fj-c2b-furnace')) return;
    content.classList.add('fj-c2b-furnace');
    const heat = clamp(numeric(state.fTemp), 0, 100);
    const status = heatState(state, heat);
    content.dataset.c2bHeatState = status;
    content.style.setProperty('--fj-c2b-heat', (heat / 100).toFixed(3));

    const hero = content.querySelector('.fj-hearth-hero');
    if (hero) {
      hero.classList.add('fj-c2b-hearth');
      const fig = hero.querySelector('.fj-art-figure');
      if (fig && !fig.querySelector('.fj-c2b-etching')) {
        const edge = make('span','fj-c2b-etching');
        edge.setAttribute('aria-hidden','true');
        fig.append(edge);
      }
    }

    const board = plate(state);
    if (hero) hero.after(board);
    else dash.closest('.sec')?.before(board);

    const section = dash.closest('.sec');
    if (section) section.classList.add('fj-c2b-dash-section');
    const heading = make('div','fj-c2b-dash-heading');
    heading.append(
      make('span','fj-c2b-dash-symbol','✥'),
      make('div','fj-c2b-dash-copy', state.lang === 'en' ? 'Crucibles & molten glass' : 'Tavicí pánve a sklovina')
    );
    if (section) section.prepend(heading);
    else dash.prepend(heading);

    // Only CSS classes on the EXISTING elements. Canvases, recipe buttons and
    // handlers remain mounted as rendered by the original game engine.
    const children = [...dash.children];
    children[0]?.classList.add('fj-c2b-gauge-panel');
    children[1]?.classList.add('fj-c2b-melt-layout');
    if (children[1]) {
      const halves = [...children[1].children];
      halves[0]?.classList.add('fj-c2b-smelt-stage');
      halves[1]?.classList.add('fj-c2b-smelt-readings');
    }
    children[2]?.classList.add('fj-c2b-lining-panel');
    children[3]?.classList.add('fj-c2b-guidance');

    // Locate the original sections by stable user-visible bilingual headings.
    // This works even if FajrumDesktop moved them into responsive columns.
    for (const title of content.querySelectorAll('.sec-title')) {
      const name = title.textContent.trim();
      const sectionNode = title.closest('.sec');
      if (!sectionNode) continue;
      if (/Jak roste účinnost|How efficiency grows/i.test(name)) sectionNode.classList.add('fj-c2b-efficiency');
      else if (/Přísady a sklovina|Additives & Batch/i.test(name)) sectionNode.classList.add('fj-c2b-batch');
      else if (/Barevná sklovina|Coloured Glass/i.test(name)) sectionNode.classList.add('fj-c2b-colours');
    }
  }

  window.FajrumC2b = Object.freeze({finish});
})();
