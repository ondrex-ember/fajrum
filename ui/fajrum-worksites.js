/* Worksite illustrations and current figures. No writes to game state. */
(function(){
 'use strict';
 const places={
  potash:{cs:'Loužírna',en:'Ash leaching room',alt_cs:'Dřevěné loužicí kádě, popel a nádoby na výrobu potaše',alt_en:'Wooden leaching tubs, ash and vessels used for potash making'},
  grinding:{cs:'Brusírna',en:'Grinding room',alt_cs:'Kamenné brusné kolo na dřevěném rámu a skleněné poháry',alt_en:'Stone grinding wheel on a timber frame and glass goblets'},
  engraving:{cs:'Rytecká dílna',en:'Engraver’s workshop',alt_cs:'Malé měděné rytecké kolečko a zdobený skleněný pohár',alt_en:'Small copper engraving wheel and a decorated glass goblet'},
  forestry:{cs:'Lesní práce',en:'Forest work',alt_cs:'Špalky, sekera, dřevěné sáně a sazenice na lesní mýtině',alt_en:'Logs, axe, wooden sledge and saplings in a forest clearing'}
 };
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 function taskSite(task,worker){
  if(task==='potash')return 'potash';
  if(task==='logging'||task==='reforest')return 'forestry';
  if(task==='werkstat'&&['brusic_hrana','brusic_kulic'].includes(worker.prof))return 'grinding';
  if(task==='werkstat'&&worker.prof==='rytec')return 'engraving';
  return null;
 }
 function picture(key,L,decorative){
  const frame=el('span','fj-worksite-picture'),img=el('img');
  img.src='img/worksites/'+key+'.webp';img.width=1536;img.height=1024;img.alt=decorative?'':places[key]['alt_'+L];img.loading='lazy';img.decoding='async';
  if(decorative)frame.setAttribute('aria-hidden','true');
  img.addEventListener('error',()=>{frame.classList.add('is-unavailable');img.remove();},{once:true});frame.append(img);return frame;
 }
 function figures(key,state,L){
  const cs=L==='cs',workers=state.workers||[],res=state.res||{};
  if(key==='potash')return [
   (cs?'Přiděleno: ':'Assigned: ')+workers.filter(w=>w.task==='potash').length,
   (cs?'Dřevo: ':'Wood: ')+(res.wood||0)+' · '+(cs?'potaš: ':'potash: ')+(res.potash||0)
  ];
  if(key==='forestry')return [
   (cs?'Kácení: ':'Logging: ')+workers.filter(w=>w.task==='logging').length+' · '+(cs?'výsadba: ':'planting: ')+workers.filter(w=>w.task==='reforest').length,
   (cs?'Les: ':'Forest: ')+state.forest+'/'+(state.forestMax||INIT_FOREST)+' · '+(cs?'dřevo: ':'wood: ')+(res.wood||0)
  ];
  const crew=workers.filter(w=>key==='grinding'?['brusic_hrana','brusic_kulic'].includes(w.prof):w.prof==='rytec');
  return [
   (cs?'V huti: ':'In crew: ')+crew.length+' · '+(cs?'ve verštatu: ':'in workshop: ')+crew.filter(w=>w.task==='werkstat').length,
   key==='grinding'?(cs?'Křišťál: ':'Crystal: ')+(state.crystal||[]).length:
    (cs?'Kusy k rytí: ':'Pieces to engrave: ')+ENGRAVE_INPUTS.reduce((sum,key)=>sum+(Array.isArray(state[key])?state[key].length:0),0)
  ];
 }
 function card(key,state){
  const L=state.lang==='en'?'en':'cs',n=el('figure','fj-worksite-card');n.dataset.worksite=key;
  const copy=el('figcaption','fj-worksite-copy');copy.append(el('h3','',places[key][L]));
  for(const line of figures(key,state,L))copy.append(el('p','',line));
  n.append(picture(key,L,false),copy);return n;
 }
 function finish(app,state){
  if(state.phase!=='playing')return;
  for(const section of app.querySelectorAll('.sec[data-worksite]')){
   const key=section.dataset.worksite;if(!places[key]||section.querySelector('.fj-worksite-card'))continue;
   const title=section.querySelector('.sec-title');if(title)title.after(card(key,state));
  }
 }
 function decorateTask(button,task,worker,L){
  const key=taskSite(task,worker);if(!key||button.querySelector('.fj-worksite-task-thumb'))return;
  button.classList.add('fj-worksite-task-choice');
  const frame=picture(key,L,true);frame.classList.add('fj-worksite-task-thumb');button.append(frame);
  frame.querySelector('img').loading='eager';
  frame.querySelector('img').addEventListener('error',()=>{button.classList.remove('fj-worksite-task-choice');frame.remove();},{once:true});
 }
 window.FajrumWorksites={finish,decorateTask,taskSite};
})();
