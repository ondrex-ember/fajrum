/* FAJRUM D2 — the account ledger of the glassworks (visual layer only).
   No alteration of G, contracts, economic mechanics, handlers or save data. */
(function(){
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
 const finite=value=>Number.isFinite(Number(value))?Number(value):0;
 const clamp=value=>Math.max(0,Math.min(100,value));
 const icon=(name)=>{const frame=el('span','fj-d2-glyph');frame.setAttribute('aria-hidden','true');const img=el('img');img.src='img/ui/'+name+'.webp';img.alt='';img.width=72;img.height=72;img.decoding='async';img.loading='lazy';img.addEventListener('error',()=>{img.remove();frame.textContent='❖';},{once:true});frame.append(img);return frame;};
 const t=(state,cs,en)=>state.lang==='en'?en:cs;
 const fmt=(value,state)=>new Intl.NumberFormat(state.lang==='en'?'en-US':'cs-CZ').format(finite(value));
 function metric(label,value,kind,note){
  const item=el('div','fj-d2-metric');item.dataset.kind=kind;
  item.append(el('span','fj-d2-metric-label',label),el('strong','fj-d2-metric-value',value));
  if(note)item.append(el('span','fj-d2-metric-note',note));
  return item;
 }
 function makeHeader(state){
  const workers=Array.isArray(state.workers)?state.workers:[];
  const salary=workers.reduce((sum,w)=>sum+2+finite(w.wageMod),0);
  const beer=([0,1,2,4][finite(state.beer)]||0)*Math.ceil(workers.length/3);
  const outflow=salary+beer,cash=finite(state.grose),debt=finite(state.debt);
  const active=(Array.isArray(state.contracts)?state.contracts.length:0)+(Array.isArray(state.repContracts)?state.repContracts.length:0);
  const funds=outflow<=0||cash>=outflow;
  const wrap=el('header','fj-d2-book-header');wrap.dataset.solvency=funds?'enough':'short';
  const lead=el('div','fj-d2-book-lead');lead.append(icon('nav-accounts'));
  const copy=el('div','fj-d2-book-title');copy.append(
   el('span','fj-d2-kicker',t(state,'LESNÍ HUŤ · HLAVNÍ KNIHA','FOREST GLASSWORKS · MASTER LEDGER')),
   el('h2','',t(state,'Hutní účty','Foundry accounts')),
   el('p','',t(state,'Pokladna, závazky a důvěra odběratelů','Treasury, liabilities and buyers’ trust'))
  );lead.append(copy);
  const stamp=el('span','fj-d2-book-seal',t(state,'SCHULDENBUCH','SCHULDENBUCH'));stamp.setAttribute('aria-hidden','true');
  const top=el('div','fj-d2-book-top');top.append(lead,stamp);
  const stats=el('div','fj-d2-metrics');
  stats.append(
   metric(t(state,'V pokladně','In treasury'),fmt(cash,state)+' g','cash'),
   metric(t(state,'Dluh faktorovi','Debt to factor'),fmt(debt,state)+' g','debt'),
   metric(t(state,'Mzdy + pivo / kolo','Wages + beer / round'),fmt(outflow,state)+' g','outflow'),
   metric(t(state,'Běžící zakázky','Active contracts'),fmt(active,state),'contracts')
  );
  if(debt>0)stats.querySelector('[data-kind="debt"]').dataset.alert='true';
  if(!funds)stats.querySelector('[data-kind="outflow"]').dataset.alert='true';
  const footer=el('div','fj-d2-financial-warning');footer.dataset.ok=String(funds);
  const marker=el('span','fj-d2-warning-medallion',funds?'✓':'!');marker.setAttribute('aria-hidden','true');
  const status=el('div','fj-d2-warning-copy');
  status.append(
   el('strong','',funds?
    t(state,'Hotovost pokrývá běžné mzdy a příděl','Current cash covers wages and rations'):
    t(state,'Hotovost nepokrývá běžné mzdy a příděl','Current cash does not cover wages and rations')),
   el('span','',outflow<=0?t(state,'Pro toto kolo nejsou evidovány mzdové výdaje.','No wage expenses are listed for this round.'):
    funds?t(state,'Porovnání je orientační, bez dalších plateb a příjmů.','This is a guide only, before other payments and income.'):
    t(state,`Rozdíl ${fmt(outflow-cash,state)} g. Bez očekávaných příjmů či dalších plateb.`,`Shortfall ${fmt(outflow-cash,state)} g. Before expected income or other payments.`))
  );footer.append(marker,status);
  const gauge=el('div','fj-d2-cover-gauge');gauge.setAttribute('role','progressbar');
  gauge.setAttribute('aria-label',t(state,'Krytí mezd a piva dostupnou hotovostí','Coverage of wages and beer with available cash'));
  gauge.setAttribute('aria-valuemin','0');gauge.setAttribute('aria-valuemax','100');
  const coverage=outflow<=0?100:clamp(Math.round(cash/outflow*100));gauge.setAttribute('aria-valuenow',String(coverage));
  const fill=el('span','fj-d2-cover-fill');fill.style.width=coverage+'%';gauge.append(fill);
  wrap.append(top,stats,footer,gauge);return wrap;
 }
 function decorateAccountsArt(content){
  const scene=content.querySelector('.fj-section-art[data-art-tab="accounts"]');
  if(!scene)return;
  scene.classList.add('fj-d2-accounts-art');
  const figure=scene.querySelector('.fj-section-art-figure');
  if(figure){const corners=el('span','fj-d2-etched-corners');corners.setAttribute('aria-hidden','true');figure.append(corners);}
 }
 function classifyPanels(section,cols,state){
  section.classList.add('fj-d2-ledger-section');
  const title=section.querySelector(':scope > .sec-title');if(title)title.classList.add('fj-d2-ledger-section-title');
  const active=cols.previousElementSibling;
  if(active&&active!==title){active.classList.add('fj-d2-active-contracts');active.dataset.d2Active=String((state.contracts||[]).length+(state.repContracts||[]).length);}
  const left=cols.children[0],right=cols.children[1];
  cols.classList.add('fj-d2-ledger-columns');
  if(left){
   left.classList.add('fj-d2-offers-pane');
   const h=left.firstElementChild;if(h)h.classList.add('fj-d2-pane-heading');
   for(const offer of left.querySelectorAll('.fj-endgame-offer,.fj-contract-offer'))offer.classList.add('fj-d2-offer');
  }
  if(right){
   right.classList.add('fj-d2-finance-pane');
   const elements=[...right.children];if(elements[0])elements[0].classList.add('fj-d2-pane-heading');
   // Current source order: heading; cash; [repayment]; upcoming costs;
   // [debt projection]; factor. We only mark existing DOM, never recreate buttons.
   const panels=elements.slice(1);
   if(panels[0])panels[0].classList.add('fj-d2-cash-panel');
   let idx=1;
   if(finite(state.debt)>0&&panels[idx])panels[idx++].classList.add('fj-d2-repayment-panel');
   if(panels[idx])panels[idx++].classList.add('fj-d2-expenditure-panel');
   if(finite(state.debt)>0&&panels[idx])panels[idx++].classList.add('fj-d2-projection-panel');
   if(panels[idx])panels[idx].classList.add('fj-d2-factor-panel');
   for(const button of right.querySelectorAll('button'))button.classList.add('fj-d2-account-action');
  }
  const reputation=cols.nextElementSibling;
  if(reputation){
   reputation.classList.add('fj-d2-reputation');
   const heading=reputation.firstElementChild;if(heading)heading.classList.add('fj-d2-reputation-heading');
   const grid=reputation.querySelector('.fj-accounts-reputation-grid');
   if(grid){
    for(const [i,key] of ['church','noble','trade'].entries()){
     const card=grid.children[i];if(!card)continue;
     card.classList.add('fj-d2-reputation-card');card.dataset.faction=key;
     const val=clamp(finite((state.fama||{})[key]));
     const rail=card.children[1];if(rail){rail.setAttribute('role','progressbar');rail.setAttribute('aria-valuemin','0');rail.setAttribute('aria-valuemax','100');rail.setAttribute('aria-valuenow',String(val));
      rail.setAttribute('aria-label',t(state,{church:'Reputace církve',noble:'Reputace šlechty',trade:'Reputace kupců'}[key],{church:'Church reputation',noble:'Noble reputation',trade:'Merchant reputation'}[key]));
      rail.classList.add('fj-d2-fama-track');
     }
    }
   }
  }
 }
 function finish(app,state){
  if(state.phase!=='playing'||state.tab!=='accounts')return;
  const content=app.querySelector('.content');
  if(!content||content.classList.contains('fj-d2-accounts'))return;
  const cols=content.querySelector('.fj-accounts-columns');
  const section=cols?.closest('.sec');if(!section)return;
  content.classList.add('fj-d2-accounts');
  decorateAccountsArt(content);
  const header=makeHeader(state);
  const art=content.querySelector('.fj-d2-accounts-art');
  if(art)art.after(header);else section.before(header);
  classifyPanels(section,cols,state);
 }
 window.FajrumD2={finish};
})();
