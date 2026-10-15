/* FAJRUM E1c · Non-market dialogue presentation, forest glassworks c. 1680.
   Decoration and accessibility only. Never changes game state, save data,
   consent controls, event handlers, or the established D1 market dialogues. */
(function () {
  'use strict';

  function classifyDialog(outer, box, kind) {
    outer.classList.add('fj-e1c-overlay');
    box.classList.add('fj-e1c-dialog');
    box.dataset.e1cKind = kind;
    if (!box.hasAttribute('role')) box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    const title = box.querySelector(':scope > :is(h1,h2,h3), :scope > .fj-d7-dialog-heading');
    if (title && title.textContent.trim()) {
      box.setAttribute('aria-label', title.textContent.trim());
    } else if (kind === 'wages') {
      box.setAttribute('aria-label', box.firstElementChild?.textContent.trim() || 'Wages');
    } else if (kind === 'retention') {
      const name = box.querySelector(':scope > div:first-child > div:nth-child(2) > div:first-child')?.textContent.trim();
      box.setAttribute('aria-label', name || 'Worker contract');
    }
  }

  function addKeyboardToContractOptions(box) {
    for (const option of box.querySelectorAll('.contract-btn')) {
      if (option.dataset.e1cKeyboard) continue;
      option.dataset.e1cKeyboard = '1';
      option.setAttribute('role', 'button');
      const disabled = option.classList.contains('disabled');
      option.setAttribute('aria-disabled', String(disabled));
      if (disabled) continue;
      option.tabIndex = 0;
      option.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        option.click(); // Retains the game's original click handler.
      });
    }
  }

  function finish(app, state) {
    if (!app || !state) return;
    for (const outer of app.querySelectorAll('.modal-bg')) {
      // Market contracts and finished worker profile keep their existing artwork.
      if (outer.classList.contains('fj-d1-contract-modal') ||
          outer.querySelector(':scope > .fj-d1-contract-dialog')) continue;
      const panel = outer.querySelector(':scope > .modal, :scope > .retention-modal-box');
      if (panel) {
        if (panel.classList.contains('fj-crew-profile')) continue;
        const kind = panel.classList.contains('retention-modal-box') ? 'retention'
          : panel.classList.contains('fj-event-dialog') ? 'event'
          : state.help ? 'help'
          : state._strikeQueue ? 'strike'
          : state.firstVisit ? 'welcome' : 'other';
        classifyDialog(outer, panel, kind);
        if (kind === 'retention') addKeyboardToContractOptions(panel);
      } else if (state._loyaltyModalPending && outer.firstElementChild &&
                 outer.children.length === 1) {
        // Wage-arrears modal is a bare div (no .modal class in the original game).
        classifyDialog(outer, outer.firstElementChild, 'wages');
      }
    }
    // Dramatic cracked-crucible event uses a deliberately separate dark-red scene.
    // Preserve it; improve only small print and mobile scrolling.
    if (state.phase === 'event' && state.curEvt === 'crack') {
      for (const box of app.querySelectorAll('.fj-event-dialog:not(.modal)')) {
        if (box.parentElement?.classList.contains('modal-bg')) continue;
        box.classList.add('fj-e1c-crack');
        box.parentElement?.classList.add('fj-e1c-crack-overlay');
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        const heading = box.children[1]?.textContent;
        if (heading) box.setAttribute('aria-label', heading);
        const quote = [...box.children].find(child => child.style?.borderTopStyle === 'solid');
        if (quote) quote.classList.add('fj-e1c-crack-quote');
      }
    }
  }
  window.FajrumE1c = Object.freeze({finish});
})();
