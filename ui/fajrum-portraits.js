/* Phase 8: person-specific artwork. Reads identity; never changes workers or saves. */
(function(){
 'use strict';
 const people={
  npc_formar2:{name:'Péťa Dřevák',asset:'npc_formar2'},
  npc_foukac2:{name:'Hanns Glaser',asset:'npc_foukac2'},
  npc_foukac3:{name:'Josef Sklenář',asset:'npc_foukac3'},
  npc_foukac4:{name:'Kateřina Sklenářová',asset:'npc_foukac4'},
  npc_foukac5:{name:'Elias Böhm',asset:'npc_foukac5'},
  npc_foukac6:{name:'Marie Wagnerová',asset:'npc_foukac6'},
  npc_hrana1:{name:'Ignác Hranař',asset:'npc_hrana1'},
  npc_kulic1:{name:'Anička Kuličková',asset:'npc_kulic1'},
  npc_rytec1:{name:'Kryštof Rytíř',asset:'npc_rytec1'}
 };
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 const names=Object.fromEntries(Object.entries(people).map(([id,p])=>[normalize(p.name),id]));
 function identity(person){
  const id=person.npcId||person.id;
  if(people[id])return id;
  // Older saves can lack npcId. Only an exact canonical name selects a named new face.
  return names[normalize(person.name)]||null;
 }
 function source(person){const id=identity(person);return id?'img/workers/'+people[id].asset+'.webp':`img/workers/${person.portrait||'unknown'}.jpg`;}
 function configure(img,person){
  const id=identity(person);img.src=source(person);img.alt=person.name||people[id]?.name||'';img.loading='lazy';img.decoding='async';
  img.dataset.personId=id||person.npcId||person.id||'';if(id)img.classList.add('fj-person-portrait-new');return img;
 }
 function el(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;}
 function finish(app,state){
  for(const card of app.querySelectorAll('.fj-hiring-candidate')){
   if(card.querySelector('.fj-hiring-portrait'))continue;
   const person=state.interseason?.candidates?.find(c=>c.id===card.dataset.candidateId);if(!person)continue;
   const frame=el('div','fj-hiring-portrait'),img=configure(el('img'),person),copy=el('div','fj-hiring-copy');
   img.addEventListener('error',()=>{img.remove();frame.classList.add('is-unavailable');if(typeof NPC_SVG!=='undefined'&&NPC_SVG[person.portrait])frame.innerHTML=NPC_SVG[person.portrait];else frame.textContent=person.gender==='f'?'👩':'👤';},{once:true});
   frame.append(img);copy.append(...card.children);card.append(frame,copy);card.classList.add('is-illustrated');
  }
  const player=app.querySelector('.fj-player-portrait');
  if(player&&!player.dataset.portraitDone){
   const fallback=player.textContent;player.dataset.portraitDone='true';player.classList.add('has-portrait');
   const img=el('img','fj-player-portrait-image');img.src='img/workers/tomislav.webp';img.alt='Tomislav Břeťánek';img.width=1254;img.height=1254;img.loading='lazy';img.decoding='async';
   const badge=el('span','fj-player-rank',fallback);badge.setAttribute('aria-label',(state.lang==='en'?'Rank: ':'Hodnost: ')+player.dataset.rankLabel);
   img.addEventListener('error',()=>{player.classList.remove('has-portrait');player.replaceChildren(document.createTextNode(fallback));},{once:true});player.replaceChildren(img,badge);
  }
 }
 window.FajrumPortraits={source,configure,finish,identity};
})();
