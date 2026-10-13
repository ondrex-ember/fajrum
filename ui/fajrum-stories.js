/* Phase 11: event scenes and achievement art. Presentation only; no game writes. */
(function(){
 'use strict';
 const eventKeys=['crack','good','merchant','winter','shamotCrack','forestDepleted','svjiri'];
 const achievementAssets={
  ignis_mutat_res:'ignis_mutat_res',tercikár:'tercikar',speculum:'speculum',kunckel:'kunckel',
  reticello:'reticello',barokni_prelom:'barokni_prelom',ceska_pec:'ceska_pec',
  cerenic_arsenem:'cerenic_arsenem',vilkum:'vilkum',kobaltova_serie:'kobaltova_serie',
  faccon_de_venise:'faccon_de_venise'
 };
 const commissionAssets={relikvar:'church',lustr:'noble',export_drezdany:'trade'};
 function achievementSource(key){
  if(achievementAssets[key])return 'img/achievements/'+achievementAssets[key]+'.webp';
  if(commissionAssets[key])return 'img/sections/commission-'+commissionAssets[key]+'.webp';
  return null;
 }
 function image(source,cls,width,height){
  const img=document.createElement('img');img.className=cls;img.src=source;img.alt='';
  img.width=width;img.height=height;img.decoding='async';return img;
 }
 function finish(app,state){
  if(state.phase==='event'&&eventKeys.includes(state.curEvt)){
   const dialog=app.querySelector('.fj-event-dialog');
   const fallback=dialog?.querySelector('.fj-event-placeholder');
   if(dialog&&fallback&&!dialog.dataset.storyDecorated){
    dialog.dataset.storyDecorated='true';
    const img=image('img/events/'+state.curEvt+'.webp','fj-event-art',1536,1024);
    img.loading='eager';img.setAttribute('aria-hidden','true');
    img.addEventListener('error',()=>img.replaceWith(fallback),{once:true});
    fallback.replaceWith(img);
   }
  }
  if(state.phase!=='playing'||state.tab!=='archiv')return;
  for(const card of app.querySelectorAll('.ach-card[data-achievement]')){
   const source=achievementSource(card.dataset.achievement),fallback=card.querySelector('svg');
   if(!source||!fallback||card.dataset.storyDecorated)continue;
   card.dataset.storyDecorated='true';
   const frame=document.createElement('span');frame.className='fj-ach-art';frame.id=fallback.id;
   frame.setAttribute('aria-hidden','true');
   const img=image(source,'fj-ach-image',80,80);img.loading='lazy';
   img.addEventListener('error',()=>frame.replaceWith(fallback),{once:true});frame.append(img);
   if(card.classList.contains('unlocked')){
    const tick=document.createElement('span');tick.className='fj-ach-tick';tick.textContent='✓';frame.append(tick);
   }
   fallback.replaceWith(frame);
  }
 }
 window.FajrumStories={finish,eventKeys,achievementSource};
})();
