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
 // Historical accounting desk: manuscript entries, never a fictional instrument.
 function entry(label,value,kind){
  const line=el('div','fj-d2-ledger-entry');line.dataset.kind=kind;
  line.append(el('dt','fj-d2-ledger-label',label),el('dd','fj-d2-ledger-value',value));
  return line;
 }
 function makeHeader(state){
  // Mirror the game's existing next-round expense calculation without changing rules.
  const workers=Array.isArray(state.workers)?state.workers:[];
  const wages=workers.reduce((sum,w)=>sum+2+finite(w.wageMod),0);
  const beer=([0,1,2,4][finite(state.beer)]||0)*Math.ceil(workers.length/3);
  const outflow=wages+beer, cash=finite(state.grose),debt=finite(state.debt);
  const active=(Array.isArray(state.contracts)?state.contracts.length:0)+(Array.isArray(state.repContracts)?state.repContracts.length:0);
  const funds=cash>=outflow;
  const wrap=el('section','fj-d2-book-header');wrap.dataset.solvency=funds?'enough':'short';
  wrap.setAttribute('aria-label',t(state,'Zápis v hutní účetní knize','Entry in the glassworks account ledger'));
  const lead=el('div','fj-d2-book-lead');lead.append(icon('nav-accounts'));
  const copy=el('div','fj-d2-book-title');
  copy.append(
   el('span','fj-d2-kicker',t(state,'LESNÍ SKLÁŘSKÁ HUŤ · HLAVNÍ KNIHA','FOREST GLASSWORKS · ACCOUNT BOOK')),
   el('h2','',t(state,'Hutní účty','Foundry accounts')),
   el('p','',t(state,'Zápis pokladny, pohledávek a závazků','Record of cash, contracts and debts'))
  );lead.append(copy);
  const year=1679+(finite(state.season)||1);
  const stamp=el('span','fj-d2-book-seal','Anno '+year);stamp.setAttribute('aria-hidden','true');
  const top=el('div','fj-d2-book-top');top.append(lead,stamp);
  const book=el('div','fj-d2-ledger-sheet');
  const heading=el('div','fj-d2-ledger-heading');
  heading.append(el('span','',t(state,'Soupis nynějšího stavu','Present balance')),
   el('span','',t(state,'groše · g','groats · g')));
  const list=el('dl','fj-d2-ledger-entries');
  list.append(
   entry(t(state,'Hotovost v pokladně','Cash in hand'),fmt(cash,state)+' g','cash'),
   entry(t(state,'Dluh faktorovi Weissovi','Debt to factor Weiss'),fmt(debt,state)+' g','debt'),
   entry(t(state,'Mzdy a příděl na další kolo','Wages and rations, next round'),fmt(outflow,state)+' g','outflow'),
   entry(t(state,'Přijaté zakázky','Accepted contracts'),fmt(active,state),'contracts')
  );
  if(debt>0)list.querySelector('[data-kind="debt"]').dataset.alert='true';
  if(!funds)list.querySelector('[data-kind="outflow"]').dataset.alert='true';
  const foot=el('p','fj-d2-ledger-note');
  if(outflow<=0)foot.textContent=t(state,'Pro příští kolo nejsou evidovány mzdy ani příděly.','No wages or rations are listed for the next round.');
  else if(funds)foot.textContent=t(state,'Pokladna vystačí na běžné mzdy a příděl. Další příjmy a platby nezapočítány.','Cash covers ordinary wages and rations. Other receipts and payments are not included.');
  else foot.textContent=t(state,
    'Na běžné mzdy a příděl schází '+fmt(outflow-cash,state)+' g. Další příjmy a platby nezapočítány.',
    'Short of ordinary wages and rations by '+fmt(outflow-cash,state)+' g. Other receipts and payments are not included.');
  foot.dataset.status=funds?'enough':'short';
  book.append(heading,list,foot);wrap.append(top,book);
  return wrap;
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
     // The actual Fama value is already printed in the original game card.
     // Hide the modern-style bar; preserve the numeric text and milestones.
     const rail=card.children[1];if(rail){
      rail.classList.add('fj-d2-fama-track');rail.setAttribute('aria-hidden','true');
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
