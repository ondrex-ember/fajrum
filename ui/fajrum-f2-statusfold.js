/* FAJRUM F2 — sbalitelný stavový pruh (desktop). Původní .season-panel se jen skryje/zobrazí, nic se nepřepisuje.
   Sbalený stav: jeden řádek (fáze měsíce, priorita, pec, nálada, les, dluh, počet rad). Volba se pamatuje v localStorage. */
(function () {
  'use strict';
  const KEY = 'fajrum_f2_fold';
  // bez uložené volby: sbaleno jen na nízkých oknech (<800 px), jinak rozbaleno
  const read = () => { let v = null; try { v = localStorage.getItem(KEY); } catch (_) {} return v === null ? window.innerHeight < 800 : v === '1'; };
  const write = v => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (_) {} };
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const t = n => (n && n.textContent || '').replace(/\s+/g, ' ').trim();
  const lang = () => (typeof G !== 'undefined' && G.lang === 'en') ? 'en' : 'cs';
  const L = { cs: { fold: 'Sbalit stav', unfold: 'Rozbalit stav', hints: n => n === 1 ? 'rada' : (n >= 2 && n <= 4 ? 'rady' : 'rad') }, en: { fold: 'Collapse status', unfold: 'Expand status', hints: n => n === 1 ? 'tip' : 'tips' } };

  function finish(app) {
    if (!app || !app.classList.contains('desktop')) return;
    const panel = app.querySelector(':scope > .season-panel');
    if (!panel || panel.querySelector(':scope > .fj-f2-bar')) return;
    const status = panel.querySelector(':scope > .fj-desktop-status');
    if (!status) return;
    const col = status.children[0], metrics = status.children[1];
    const icon = t(col && col.querySelector('.season-icon')), phase = t(col && col.querySelector('.season-phase')), prio = t(col && col.querySelector('.season-priority'));
    const furn = metrics && metrics.querySelector('.furnace-hud');
    const furnName = t(furn && furn.children[0]);
    const rows = furn ? [...furn.querySelectorAll('.furnace-hud-row')] : [];
    const furnState = rows[0] ? [...rows[0].children].map(t).join(' · ') : '';
    const bars = metrics && metrics.children[1] ? [...metrics.children[1].children].map(t) : [];
    const hintBox = col && col.children[3];
    const hints = hintBox ? hintBox.children.length : 0;
    const s = L[lang()];

    const bar = el('div', 'fj-f2-bar');
    bar.append(el('span', 'fj-f2-phase', (icon ? icon + ' ' : '') + phase));
    if (prio) bar.append(el('span', 'fj-f2-prio', prio));
    const chips = el('span', 'fj-f2-chips');
    if (furnName) chips.append(el('span', 'fj-f2-chip', '🔥 ' + furnName + (furnState ? ' · ' + furnState : '')));
    bars.filter(Boolean).forEach(b => chips.append(el('span', 'fj-f2-chip', b)));
    if (hints) { const h = el('span', 'fj-f2-chip fj-f2-hints', '💡 ' + hints + ' ' + s.hints(hints)); h.dataset.tone = 'warn'; chips.append(h); }
    bar.append(chips);
    panel.insertBefore(bar, panel.firstChild);

    const btn = el('button', 'fj-f2-toggle');
    btn.type = 'button';
    const apply = folded => {
      panel.classList.toggle('fj-f2-folded', folded);
      btn.setAttribute('aria-expanded', folded ? 'false' : 'true');
      btn.textContent = folded ? '▾ ' + s.unfold : '▴ ' + s.fold;
      btn.title = folded ? s.unfold : s.fold;
    };
    btn.addEventListener('click', ev => { ev.stopPropagation(); const f = !panel.classList.contains('fj-f2-folded'); write(f); apply(f); });
    panel.append(btn);
    panel.classList.add('fj-f2-panel');
    apply(read());
  }
  window.FajrumF2 = { finish };
})();
