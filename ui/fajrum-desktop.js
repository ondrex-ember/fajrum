/* Desktop presentation only. Move existing controls with their original listeners. */
(function(){
 'use strict';
 function finish(app,state){
  if(!app.classList.contains('desktop'))return;
  const content=app.querySelector('.content');
  if(!content)return;
  content.dataset.desktopTab=state.tab;
  const sections=[...content.children];
  const status=app.querySelector(':scope > .season-panel > div');
  if(status){status.classList.add('fj-desktop-status');status.children[1]?.classList.add('fj-desktop-metrics');}
  if(state.tab==='storage'){
   for(const [grid,name]of [['.fj-glass-stock-grid','glass'],['.fj-additive-stock-grid','additives'],['.fj-material-grid','materials'],['.fj-economy-stock-grid','economy']]){
    content.querySelector(grid)?.closest('.sec')?.setAttribute('data-desktop-stock',name);
   }
   if(!content.querySelector('.fj-desktop-stock-columns')){
    const columns=document.createElement('div');columns.className='fj-desktop-stock-columns';
    const goods=document.createElement('div'),supplies=document.createElement('div');
    const first=content.querySelector('[data-desktop-stock]');
    if(first){first.before(columns);columns.append(goods,supplies);
     for(const section of sections.filter(n=>n.hasAttribute('data-desktop-stock'))){
      (['glass','materials'].includes(section.dataset.desktopStock)?goods:supplies).append(section);
     }
    }
   }
  }else if(state.tab==='overview'){
   sections[sections.length-1]?.classList.add('fj-desktop-specialists');
   for(const span of content.querySelectorAll('.worker-card span')){
    if(span.style.width==='22px')span.classList.add('fj-desktop-worker-value');
    if(span.style.width==='28px')span.classList.add('fj-desktop-worker-label');
   }
  }else if(state.tab==='production'){
   sections.find(n=>n.children.length===2&&n.children[0].querySelector('.sec'))?.classList.add('fj-desktop-production-inputs');
   sections[sections.length-1]?.classList.add('fj-desktop-special-recipes');
  }else if(state.tab==='furnace'){
   const controls=content.querySelector('.furnace-dash')?.closest('.sec');
   const notes=sections.find(n=>n.children.length===2&&[...n.children].every(c=>c.classList.contains('sec')));
   controls?.classList.add('fj-desktop-furnace-controls');
   notes?.classList.add('fj-desktop-furnace-notes');
   if(controls&&notes&&!content.querySelector('.fj-desktop-furnace-columns')){
    const columns=document.createElement('div');columns.className='fj-desktop-furnace-columns';
    controls.before(columns);columns.append(controls,notes);
   }
  }else if(state.tab==='market'&&!content.querySelector('.fj-desktop-market-columns')){
   const columns=document.createElement('div');columns.className='fj-desktop-market-columns';
   const trade=document.createElement('div'),supplies=document.createElement('div');
   trade.className='fj-desktop-trade';supplies.className='fj-desktop-supplies';
   const first=content.querySelector('.fj-market-section');
   if(first){first.before(columns);columns.append(trade,supplies);
    for(const section of sections.filter(n=>n.classList.contains('fj-market-section'))){
     (['contracts','sell'].includes(section.dataset.marketSection)?trade:supplies).append(section);
    }
   }
  }else if(state.tab==='archiv'){
   for(const row of content.querySelectorAll('.fj-codex-row'))row.parentElement.classList.add('fj-desktop-codex-group');
  }
 }
 window.FajrumDesktop={finish};
})();
