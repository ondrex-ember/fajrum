/* Read-only crew presentation. Task assignment uses the original game action. */
(function(){
 'use strict';
 let detachKeys=null,returnId=null,focusedTab=false,bondsOpen=false;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 const button=(text,cls,action)=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',event=>{event.stopPropagation();action(event);});return b;};
 function beforeRender(){
  focusedTab=!!document.activeElement?.closest('.fj-crew-profile .detail-subtabs');
  if(detachKeys){detachKeys();detachKeys=null;}
 }
 function taskSheet(worker,state,context,app){
  const L=state.lang==='en'?'en':'cs',opts=context.taskOptions(worker),labels=L==='cs'?TASK_CS:TASK_EN,info=L==='cs'?TASK_INFO_CS:TASK_INFO_EN;
  const body=el('div','fj-crew-task-list');body.append(el('p','fj-crew-task-intro',`${getProfLabel(worker,L)} · ${L==='cs'?'Únava':'Fatigue'} ${Math.round((worker.fat||0)*100)}%`));
  const choices=[...opts.primary,...(opts.werkstat?[opts.werkstat]:[]),...opts.others.map(t=>({t,disabled:false})),...(opts.panevGhost?[{t:'panev',disabled:true,ghost:true}]:[]),...(opts.idleExtra?[opts.idleExtra]:[])];
  for(const choice of choices){
   const b=button(`${TASK_ICON[choice.t]||''} ${labels[choice.t]||choice.t}`,'fj-crew-task-choice'+(worker.task===choice.t?' is-current':''),()=>context.assign(worker.id,choice.t));
   b.dataset.task=choice.t;b.disabled=!!choice.disabled;
   if(worker.task===choice.t)b.setAttribute('aria-current','true');
   b.append(el('span','fj-crew-task-description',info[choice.t]||''));
   if(window.FajrumWorksites)FajrumWorksites.decorateTask(b,choice.t,worker,L);
   if(choice.disabled){
    const reason=choice.ghost?(L==='cs'?'Jen v přípravě':'Preparation only'):choice.t==='idle'?(L==='cs'?'Dostupné od 25 % únavy':'Available from 25% fatigue'):(L==='cs'?'Příliš vysoká únava pro verštat':'Too fatigued for workshop');
    b.append(el('span','fj-crew-task-reason',reason));
   }
   body.append(b);
  }
  FajrumUI.sheet(`${L==='cs'?'Práce':'Work'} · ${worker.name}`,body,app);
 }
 function statusBars(info,worker,L){
  const rows=[...info.querySelectorAll('.parta-bar-row')];
  const mood=Number.isFinite(worker.mood)?worker.mood:60,fat=Math.round(Math.max(0,Math.min(1,Number(worker.fat)||0))*100);
  for(const [i,label,value]of [[0,L==='cs'?'Nálada':'Mood',mood],[1,L==='cs'?'Únava':'Fatigue',fat]]){
   const row=rows[i];if(!row)continue;
   row.querySelector('.parta-bar-lbl').textContent=label;
   const bar=row.querySelector('.parta-bar');bar.setAttribute('role','meter');bar.setAttribute('aria-label',label);bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',String(value));
   row.append(el('span','fj-crew-stat-value',value+'%'));
  }
 }
 function finish(app,state,context){
  if(state.phase!=='playing')return;
  const L=state.lang==='en'?'en':'cs',labels=L==='cs'?TASK_CS:TASK_EN;
  const grid=app.querySelector('.parta-grid');
  if(grid){
   const bonds=app.querySelector('.fj-crew-bonds');
   if(bonds){const details=el('details','fj-crew-bonds-disclosure');details.open=bondsOpen;
    const summary=el('summary','',L==='cs'?'Vazby a mentorství party':'Crew bonds and mentorship');details.append(summary);bonds.replaceWith(details);details.append(bonds);details.addEventListener('toggle',()=>{bondsOpen=details.open;});}
   const resting=state.workers.filter(w=>w.task==='idle').length,owed=state.workers.reduce((n,w)=>n+(w.unpaidDebt||0),0)+(state.exCrewClaims||[]).reduce((n,c)=>n+(c.amount||0),0);
   const summary=el('div','fj-crew-summary',L==='cs'?`${state.workers.length} řemeslníků · ${resting} odpočívá · dlužné mzdy ${owed}g`:`${state.workers.length} workers · ${resting} resting · owed wages ${owed}g`);grid.before(summary);
   for(const card of grid.querySelectorAll('.parta-card')){
    const w=state.workers.find(x=>x.id===card.dataset.workerId);if(!w)continue;
    const info=card.querySelector('.parta-info');statusBars(info,w,L);
    const task=el('div','fj-crew-current-task',`${L==='cs'?'Práce':'Work'}: ${labels[w.task]||(L==='cs'?'Nepřiděleno':'Unassigned')}`);info.append(task);
    const actions=el('div','fj-crew-actions');
    const profile=button(L==='cs'?'Profil':'Profile','btn fj-crew-profile-button',()=>context.profile(w.id));profile.setAttribute('aria-label',(L==='cs'?'Profil · ':'Profile · ')+w.name);
    const assign=button(L==='cs'?'Změnit práci':'Change work','btn btn-p fj-crew-assign',()=>taskSheet(w,state,context,app));assign.setAttribute('aria-label',(L==='cs'?'Změnit práci · ':'Change work · ')+w.name);
    actions.append(profile,assign);card.append(actions);
   }
  }
  // On mobile the large overview task grid opens as a sheet with the same buttons/listeners.
  if(window.innerWidth<960||window.innerHeight<500){
   for(const card of app.querySelectorAll('.worker-card')){
    const w=state.workers.find(x=>x.id===card.dataset.workerId),tasks=card.querySelector('.fj-task-grid');if(!w||!tasks)continue;
    tasks.classList.add('fj-overview-task-sheet');tasks.remove();
    const footer=el('div','fj-overview-worker-footer');footer.append(el('span','fj-crew-current-task',`${L==='cs'?'Práce':'Work'}: ${labels[w.task]||''}`));
    footer.append(button(L==='cs'?'Změnit práci':'Change work','btn btn-p',()=>{const body=el('div','fj-crew-original-tasks');body.append(tasks);FajrumUI.sheet(`${L==='cs'?'Práce':'Work'} · ${w.name}`,body,app);}));
    footer.append(button(L==='cs'?'Profil':'Profile','btn',()=>context.profile(w.id)));card.append(footer);
   }
  }
  const modal=app.querySelector('.fj-crew-profile');
  if(modal){
   const worker=state.workers.find(w=>w.id===state._partaDetail);if(!worker)return;
   app.append(modal.closest('.fj-crew-profile-bg'));
   returnId=worker.id;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',worker.name);
   const close=modal.querySelector('button');close.setAttribute('aria-label',L==='cs'?'Zavřít profil':'Close profile');
   const tabs=modal.querySelector('.detail-subtabs');tabs.setAttribute('aria-label',L==='cs'?'Podrobnosti řemeslníka':'Worker details');
   for(const tab of tabs.querySelectorAll('button'))tab.setAttribute('aria-pressed',String(tab.classList.contains('active')));
   const keys=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close.click();return;}
    if(event.key===' '||event.key==='Enter')event.stopPropagation();
    if(event.key!=='Tab')return;
    const list=[...modal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex="0"]')],first=list[0],last=list[list.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   };
   document.addEventListener('keydown',keys,true);detachKeys=()=>document.removeEventListener('keydown',keys,true);
   (focusedTab?tabs.querySelector('.active'):close)?.focus();
  }else if(returnId){
   const target=[...app.querySelectorAll('.parta-card')].find(c=>c.dataset.workerId===returnId)?.querySelector('.fj-crew-profile-button');target?.focus();returnId=null;
  }
 }
 window.FajrumCrew={finish,beforeRender};
})();
