/* FAJRUM D1 — patinated market ledger and seasonal contracts.
   Presentation only: never mutates game resources, contracts, or saves. */
(function(){
 'use strict';
 const make=(tag,cls,value)=>{
   const n=document.createElement(tag);if(cls)n.className=cls;
   if(value!==undefined)n.textContent=String(value);return n;
 };
 const number=value=>Number.isFinite(Number(value))?Number(value):0;
 const safeText=(state,cs,en)=>state.lang==='en'?en:cs;
 const emblemFor=buyer=>({Opat:'✝',Slechtic:'♜',Hoffmann:'✥',Weiss:'⚖'})[buyer]||'❖';
 const toneFor=buyer=>({Opat:'abbey',Slechtic:'noble',Hoffmann:'town',Weiss:'merchant'})[buyer]||'merchant';
 function crest(iconClass){
   const frame=make('span',iconClass),image=make('img');frame.setAttribute('aria-hidden','true');
   image.src='img/ui/nav-market.webp';image.alt='';image.width=60;image.height=60;
   image.loading='lazy';image.decoding='async';
   image.addEventListener('error',()=>image.remove(),{once:true});
   frame.append(image);return frame;
 }
 function markOffer(row,buyer){
   if(!row||row.classList.contains('fj-d1-embossed'))return;
   row.classList.add('fj-d1-embossed');row.dataset.d1Buyer=toneFor(buyer);
   const seal=make('span','fj-d1-seal',emblemFor(buyer));
   seal.setAttribute('aria-hidden','true');row.prepend(seal);
 }
 function market(app,state){
   if(state.tab!=='market'||state.phase!=='playing')return;
   const content=app.querySelector('.content');
   if(!content||!content.classList.contains('fj-market-page')||content.classList.contains('fj-d1-market'))return;
   content.classList.add('fj-d1-market');
   const art=content.querySelector('.fj-section-art[data-art-tab="market"]');
   if(art){
     art.classList.add('fj-d1-market-scene');
     const fig=art.querySelector('.fj-section-art-figure');
     if(fig){const edging=make('span','fj-d1-scene-engraving');edging.setAttribute('aria-hidden','true');fig.append(edging);}
   }
   const status=content.querySelector('.fj-market-status');
   if(status){
     status.classList.add('fj-d1-market-status');
     const closed=status.querySelector('.fj-market-open')?.dataset.closed==='true';
     const ledger=make('header','fj-d1-market-ledger');
     ledger.setAttribute('aria-label',safeText(state,'Záhlaví tržní knihy','Market ledger header'));
     const info=make('div','fj-d1-market-ledger-copy');
     info.append(
       make('span','fj-d1-overline',safeText(state,'LESNÍ HUŤ · KUPECKÁ KNIHA','FOREST GLASSWORKS · MERCHANT LEDGER')),
       make('h2','',safeText(state,'Tržní kniha','Market ledger')),
       make('p','',safeText(state,'Zakázky, prodej skla a dodávky surovin','Contracts, glass sales and material supplies'))
     );
     const summary=make('div','fj-d1-market-head-stats');
     const available=Array.isArray(state.avail)?state.avail.length:0;
     const contracts=(state.contracts||[]).length+(state.repContracts||[]).length;
     for(const [label,value] of [
       [safeText(state,'Nové nabídky','New offers'),available],
       [safeText(state,'Zakázky v běhu','Active contracts'),contracts]
     ]){
       const block=make('div','fj-d1-head-stat');
       block.append(make('strong','',value),make('span','',label));summary.append(block);
     }
     const copyWrap=make('div','fj-d1-market-ledger-main');copyWrap.append(crest('fj-d1-market-crest'),info);
     ledger.append(copyWrap,summary);
     ledger.dataset.marketState=closed?'closed':'open';
     status.before(ledger);
   }
   for(const [i,offer]of [...content.querySelectorAll('.fj-contract-offer-list .fj-contract-offer')].entries()){
     const buyers=Array.isArray(state.avail)?state.avail:[];
     const selected=buyers.find(c=>String(c.id)===String(offer.dataset.contractId))||buyers[i];
     markOffer(offer,selected?.buyer);
   }
   for(const active of content.querySelectorAll('.fj-contract-active-list .fj-contract-card')){
     if(active.classList.contains('fj-d1-embossed'))continue;
     const id=active.dataset.contractId;
     const contract=[...(state.contracts||[]),...(state.repContracts||[])].find(c=>String(c.id)===String(id));
     markOffer(active,contract?.buyer);
   }
   for(const h of content.querySelectorAll('.fj-market-subheading'))h.classList.add('fj-d1-subheading');
 }
 function modal(app,state){
   if(state.phase!=='playing'||!state._contractModalPending)return;
   const backdrop=app.querySelector('.fj-d1-contract-modal');
   const dialog=backdrop?.querySelector('.fj-d1-contract-dialog');
   if(!backdrop||!dialog||dialog.classList.contains('fj-d1-decorated'))return;
   dialog.classList.add('fj-d1-decorated');
   const en=state.lang==='en';
   dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.tabIndex=-1;
   const title=dialog.querySelector('.fj-d1-modal-heading');
   if(title){
     title.id='fj-d1-contract-title';dialog.setAttribute('aria-labelledby',title.id);
     title.prepend(crest('fj-d1-modal-crest'));
   }
   const intro=dialog.querySelector('.fj-d1-modal-intro');
   if(intro)intro.id='fj-d1-contract-description';
   if(intro)dialog.setAttribute('aria-describedby',intro.id);
   const count=Array.isArray(state.avail)?state.avail.length:0;
   const slots=Math.min(3,Math.max(0,(state.contracts||[]).length));
   const summary=make('div','fj-d1-modal-stats');
   for(const [label,value]of [
     [en?'Offers this season':'Nabídky této sezóny',count],
     [en?'Accepted slots':'Obsazená místa',slots+' / 3']
   ]){
     const item=make('div','fj-d1-modal-stat');item.append(make('small','',label),make('strong','',value));summary.append(item);
   }
   if(intro)intro.after(summary);else if(title)title.after(summary);
   const offers=[...dialog.querySelectorAll('.fj-d1-contract-option')];
   const sorted=[...(state.avail||[])].sort((a,b)=>number(b.reward)-number(a.reward)).slice(0,2);
   offers.forEach((row,i)=>{
     const contract=sorted[i];if(!contract)return;
     row.dataset.d1Buyer=toneFor(contract.buyer);
     const seal=make('span','fj-d1-seal',emblemFor(contract.buyer));seal.setAttribute('aria-hidden','true');
     row.prepend(seal);
     const note=make('span','fj-d1-offer-serial',(en?'OFFER ':'NABÍDKA ')+String(i+1).padStart(2,'0'));
     row.append(note);
     const control=row.querySelector('button');
     if(control&&control.style.opacity==='0.45')control.setAttribute('aria-disabled','true');
   });
   const footer=dialog.querySelector('.fj-d1-modal-actions');
   if(footer)footer.classList.add('fj-d1-actions');
   // Use the original Continue action for the Escape key, never change the state here.
   dialog.addEventListener('keydown',event=>{
     if(event.key!=='Escape')return;
     const continueButton=footer?.querySelector('button:last-child');
     if(continueButton){event.preventDefault();event.stopPropagation();continueButton.click();}
   });
   try{dialog.focus({preventScroll:true});}catch(_){dialog.focus();}
 }
 function finish(app,state){
   if(!app||!state)return;
   if(state._contractModalPending)modal(app,state);
   market(app,state);
 }
 window.FajrumD1=Object.freeze({finish});
})();
