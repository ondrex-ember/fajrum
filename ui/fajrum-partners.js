/* Phase 12: trading partners. Read-only art; all native trade actions remain attached. */
(function(){
 'use strict';
 const people={Weiss:'weiss',Hoffmann:'hoffmann',Opat:'abbot',Slechtic:'nobleman',priest:'priest',noblewoman:'noblewoman'};
 const contractPeople={rc1:'Opat',rc2:'priest',rc3:'Opat',rc4:'Slechtic',rc5:'noblewoman',rc6:'Slechtic',rc7:'Weiss',rc8:'Hoffmann',rc9:'Hoffmann',rd_noble1:'Slechtic',rd_noble2:'Slechtic',rd_trade1:'Hoffmann',rd_trade2:'Hoffmann'};
 const commissions={church:'church',noble:'noble',trade:'trade'};
 const own=(map,key)=>Object.prototype.hasOwnProperty.call(map,key);
 function personSource(key){
  if(key==='baranovsky')return 'img/workers/baranovsky.jpg';
  return own(people,key)?'img/partners/'+people[key]+'.webp':null;
 }
 function commissionSource(cat){return own(commissions,cat)?'img/sections/commission-'+commissions[cat]+'.webp':null;}
 function contractSource(contract){
  if(contract.isEndgame)return commissionSource(contract.cat);
  if(['rd_church1','rd_church2'].includes(contract.id))return commissionSource('church');
  const key=own(contractPeople,contract.id)?contractPeople[contract.id]:contract.buyer;
  return personSource(key);
 }
 function decorate(heading,source,kind){
  if(!heading||!source||heading.classList.contains('fj-partner-heading'))return;
  const copy=document.createElement('span');copy.className='fj-partner-copy';copy.append(...heading.childNodes);
  const frame=document.createElement('span');frame.className='fj-partner-art';frame.dataset.kind=kind;frame.setAttribute('aria-hidden','true');
  const img=document.createElement('img');img.src=source;img.alt='';img.width=52;img.height=64;img.loading='lazy';img.decoding='async';
  if(source==='img/workers/baranovsky.jpg')img.className='fj-partner-original';
  img.addEventListener('error',()=>frame.remove(),{once:true});frame.append(img);
  heading.classList.add('fj-partner-heading');heading.append(frame,copy);
 }
 function finish(app,state){
  for(const heading of app.querySelectorAll('[data-partner]'))decorate(heading,personSource(heading.dataset.partner),'person');
  if(state.phase!=='playing')return;
  for(const section of app.querySelectorAll('.fj-market-section')){
   if(['buy','quick','loans'].includes(section.dataset.marketSection))decorate(section.querySelector(':scope > .sec-title'),personSource('Weiss'),'person');
  }
  for(const card of app.querySelectorAll('.fj-contract-card,.fj-contract-offer')){
   const offer=card.classList.contains('fj-contract-offer');
   const contracts=offer?state.avail:card.dataset.contractKind==='market'?state.contracts:state.repContracts;
   const contract=(contracts||[]).find(c=>String(c.id)===card.dataset.contractId);if(!contract)continue;
   const heading=offer?card.firstElementChild?.firstElementChild:card.querySelector('.fj-contract-name');
   const source=contractSource(contract);
   decorate(heading,source,source?.startsWith('img/sections/')?'commission':'person');
  }
  for(const card of app.querySelectorAll('.fj-endgame-offer'))decorate(card.firstElementChild,commissionSource(card.dataset.commissionKind),'commission');
 }
 window.FajrumPartners={finish,personSource,contractSource,commissionSource};
})();
