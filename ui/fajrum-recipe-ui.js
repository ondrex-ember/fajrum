(function(){
 'use strict';
 const text={cs:{wood:'Dřevo',sand:'Písek',water:'Voda',formy:'Forma',waldglas:'Lesní sklo',crystal:'Křišťál'},en:{wood:'Wood',sand:'Sand',water:'Water',formy:'Mould',waldglas:'Forest glass',crystal:'Crystal'}};
 const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;};
 function label(key,L){const it=BLOWN_ITEMS[key]||GROUND_ITEMS[key];return it?it[L]:text[L][key]||key;}
 function specialCards(container,state,options){
  const L=state.lang==='en'?'en':'cs',it=FajrumCatalog.special.hodiny;
  const missingWorkers=it.workers.filter(p=>!state.workers.some(w=>w.prof===p));
  const missing=Object.entries(it.inputs).filter(([key,n])=>FajrumCatalog.specialHave(state,key)<n);
  const ok=options.isCampaign&&state.fActive&&state.season>=it.minSeason&&!missing.length&&!missingWorkers.length;
  const card=el('div','fj-craft-card');card.dataset.product='hodiny';card.dataset.glass='waldglas';card.dataset.available=String(ok);
  const heading=el('div','fj-recipe-heading');heading.append(el('strong','',it[L]),el('span','',`~${it.base}g`));card.append(heading,el('p','fj-recipe-cost',it['desc_'+L]));
  card.append(el('div','fj-recipe-cost',Object.entries(it.inputs).map(([k,n])=>`${n}× ${label(k,L)}`).join(' + ')));
  card.append(el('div','fj-recipe-cost',it.workers.map(k=>(L==='cs'?PROF_CS:PROF_EN)[k]).join(' + ')));
  const hint=!options.isCampaign||!state.fActive?(L==='cs'?'Pec neběží':'Furnace off'):missingWorkers.length?(L==='cs'?'Chybí profese: ':'Missing worker: ')+missingWorkers.map(k=>(L==='cs'?PROF_CS:PROF_EN)[k]).join(', '):missing.length?(L==='cs'?'Chybí: ':'Missing: ')+missing.map(([k])=>label(k,L)).join(', '):'';
  if(hint)card.append(el('div','fj-recipe-cost is-warning',hint));
  const btn=el('button','btn btn-s'+(ok?' btn-p':''),L==='cs'?'Sestavit hodiny →':'Assemble hourglass →');btn.type='button';btn.disabled=!ok;btn.addEventListener('click',()=>options.craft('hodiny'));card.append(btn);container.append(card);
 }
 function marketRows(container,state,options){
  if(options.closed||!(state.hodiny||[]).length)return;
  const L=state.lang==='en'?'en':'cs',it=FajrumCatalog.special.hodiny,row=el('div','fj-sale-row');row.dataset.product='hodiny';row.dataset.glass='waldglas';
  row.append(el('span','',`${it[L]} (${state.hodiny.length}×) · ~${it.base}g/★`));const controls=el('div');
  for(const [name,n]of [['1×',1],[L==='cs'?'Vše':'All',999]]){const b=el('button','btn btn-s',name);b.type='button';b.addEventListener('click',()=>options.sell('hodiny',n));controls.append(b);}row.append(controls);container.append(row);
 }
 function finish(app,state){
  const L=state.lang==='en'?'en':'cs';
  for(const card of app.querySelectorAll('.fj-recipe-card,.fj-craft-card')){
   const key=card.dataset.product,it=BLOWN_ITEMS[key]||GROUND_ITEMS[key];if(!it||card.querySelector('.fj-recipe-ingredients'))continue;
   const color=card.dataset.glass||it.input||it.inputs?.[0];
   const costs=[`${it.qty}× ${label(color,L)}`,...Object.entries(it.resCost||{}).map(([k,n])=>`${n}× ${label(k,L)}`)];
   if(it.requiresMould||['dzban','misa','dzban_forma'].includes(key))costs.push(`1× ${label('formy',L)}`);
   const box=el('div','fj-recipe-cost fj-recipe-ingredients');box.append(el('div','',costs.join(' + ')));
   if(it.manualOnly)box.append(el('div','',`${(L==='cs'?PROF_CS:PROF_EN)[it.spec]} · ${L==='cs'?'Ruční recept':'Manual recipe'}`));
   card.insertBefore(box,card.children[2]||null);
  }
 }
 window.FajrumRecipeUI={specialCards,marketRows,finish};
})();
