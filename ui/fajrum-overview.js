/* C1: decorate existing overview controls; never change game or save state. */
(function () {
  'use strict';
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  function thumbnail(src, fallbackKey) {
    const frame = el('span','fj-overview-thumb');
    frame.setAttribute('aria-hidden','true');
    const image = el('img');
    image.src = src; image.alt = ''; image.width = 120; image.height = 80;
    image.decoding = 'async';
    const fallback = window.FajrumUI?.resourceIcon?.(fallbackKey) || el('span');
    fallback.hidden = true;
    image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; }, {once:true});
    frame.append(image,fallback);
    return frame;
  }
  function heading(target, title, art) {
    if (!target || target.querySelector(':scope>.fj-overview-card-head')) return;
    const head = el('div','fj-overview-card-head');
    if (art) head.append(art);
    head.append(el('h3','',title));
    target.prepend(head);
  }
  function meter(target, key, label, value, max, display, warning) {
    if (target.querySelector('[data-overview-meter="'+key+'"]')) return;
    const box = el('div','fj-overview-meter'+(warning?' is-warning':''));
    box.dataset.overviewMeter = key;
    const caption = el('div','fj-overview-meter-caption');
    caption.append(el('span','',label),el('strong','',display));
    const track = el('div','fj-overview-meter-track');
    track.setAttribute('role','meter');
    track.setAttribute('aria-label',label);
    track.setAttribute('aria-valuemin','0');
    track.setAttribute('aria-valuemax',String(max));
    track.setAttribute('aria-valuenow',String(Math.max(0,Math.min(max,value))));
    track.setAttribute('aria-valuetext',display);
    const fill = el('span','fj-overview-meter-fill');
    fill.style.width = Math.max(0,Math.min(100,value/max*100))+'%';
    track.append(fill);box.append(caption,track);
    const head = target.querySelector(':scope>.fj-overview-card-head');
    if (head) head.after(box);else target.prepend(box);
  }
  function finish(app,state) {
    if (state.tab !== 'overview') return;
    const content = app.querySelector('.content');
    if (!content || !content.querySelector('.fj-overview-ledger')) return;
    content.classList.add('fj-overview-page');
    const cs = state.lang === 'cs';
    const ledger = content.querySelector('.fj-overview-ledger');
    heading(ledger,cs?'Tento měsíc':'This month',window.FajrumUI?.navigationIcon?.('log'));
    for (const button of content.querySelectorAll('.fj-overview-hint button')) {
      button.setAttribute('aria-label',button.textContent.trim()==='←'?(cs?'Předchozí rada':'Previous tip'):(cs?'Další rada':'Next tip'));
    }
    const stock = content.querySelector('.fj-overview-allocations');
    if (stock) {
      heading(stock,cs?'Hvozd a zásoby':'Forest & supplies',thumbnail('img/worksites/forestry.webp','wood'));
      const capacity = Number(state.forestMax)||80;
      const forest = Number(state.forest);
      const status = window.FajrumArt?.forestState?.(state);
      if (state.forest!=null && Number.isFinite(forest) && forest>=0 && capacity>0 && status?.key!=='unknown') {
        meter(stock,'forest',cs?'Hvozd':'Forest',forest,capacity,forest+'/'+capacity,status?.key==='scarce'||status?.key==='depleted');
      }
    }
    const furnace = content.querySelector('.fj-overview-furnace');
    if (furnace) {
      const status = window.FajrumArt?.furnaceState?.(state,{
        inPrep:window.isPrepMonth?.(state.round,state.seasonTier||0),
        tempering:window.isTemperingMonth?.(state.round,state.seasonTier||0)
      });
      const type = state.furnace?.type;
      const art = status && ['primitive','stone','master'].includes(type)
        ? thumbnail('img/furnaces/'+type+'-'+status.asset+'.webp','panev')
        : window.FajrumUI?.navigationIcon?.('furnace');
      heading(furnace,cs?'Pec':'Furnace',art);
      if (status && !furnace.querySelector('.fj-overview-furnace-status')) {
        const chip = el('span','fj-art-status fj-overview-furnace-status',status[cs?'cs':'en']);
        chip.dataset.state = status.key;
        furnace.querySelector('.fj-overview-card-head').after(chip);
        furnace.dataset.furnaceState = status.key;
      }
      const heat = Number(state.fTemp)||0;
      meter(furnace,'heat',cs?'Žár':'Heat',heat,100,heat+'%',status?.key==='overheated');
    }
    for (const toggle of content.querySelectorAll('.fj-overview-toggle')) {
      if (toggle.dataset.overviewKeyboard) continue;
      toggle.dataset.overviewKeyboard = 'true';
      toggle.addEventListener('keydown',event=>{
        if (event.key===' '||event.key==='Enter') {
          event.preventDefault();event.stopPropagation();toggle.click();
        }
      });
    }
    for (const [selector,key] of [['.fj-overview-roster','parta'],['.fj-overview-specialists','workshop']]) {
      const title = content.querySelector(selector+' > .fj-overview-toggle > .sec-title');
      if (title && !title.querySelector('.fj-nav-art')) {
        const art = window.FajrumUI?.navigationIcon?.(key);
        if (art) title.prepend(art);
      }
    }
  }
  window.FajrumOverview = {finish};
})();
