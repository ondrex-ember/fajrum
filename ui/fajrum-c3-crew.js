/* FAJRUM C3 — Parta. Presentation-only enhancements for the existing roster.
   Reads game state; never edits workers, actions, save data, or game rules. */
(function(){
  'use strict';
  const element=(tag,cls,value)=>{
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(value!==undefined)n.textContent=String(value);
    return n;
  };
  const number=(value,fallback=0)=>{
    const n=Number(value);return Number.isFinite(n)?n:fallback;
  };
  const between=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));

  const trades={
    tavic:'♨',drvorubc:'♣',panvar:'◉',popelar:'✧',
    foukat_lesni:'♧',foukat_kristal:'✧',foukat_dekor:'✥',foukat_formy:'◈',
    brusic_hrana:'◇',brusic_kulic:'◉',rytec:'✒',hornik:'◆',
    obchodnik:'⚖',formar:'⌘',hasic:'✣'
  };
  const tradeMark=prof=>trades[prof]||'✦';

  function heading(root,state){
    if(root.querySelector('.fj-c3-masthead'))return;
    const en=state.lang==='en';
    const head=element('header','fj-c3-masthead');
    const engraving=element('div','fj-c3-masthead-emblem');
    const image=element('img');
    image.src='img/ui/nav-crew.webp';image.alt='';image.loading='lazy';image.decoding='async';
    image.addEventListener('error',()=>image.remove(),{once:true});
    engraving.setAttribute('aria-hidden','true');engraving.append(image);
    const copy=element('div','fj-c3-masthead-copy');
    copy.append(
      element('span','fj-c3-kicker',en?'FOREST GLASSWORKS · CREW ROLL':'LESNÍ HUŤ · KNIHA OSAZENSTVA'),
      element('h2','',en?'The glassmakers':'Naši řemeslníci'),
      element('p','',en?'Faces, crafts and duties of the glassworks':'Tváře, řemesla a povinnosti hutní party')
    );
    head.append(engraving,copy);
    root.prepend(head);
  }

  function decorateCard(card,worker,index,state){
    if(card.classList.contains('fj-c3-worker'))return;
    const en=state.lang==='en';
    card.classList.add('fj-c3-worker');
    card.dataset.c3Mood=number(worker.mood,60)>=65?'good':number(worker.mood,60)>=40?'mixed':'low';
    card.dataset.c3Fatigue=between(number(worker.fat)*100,0,100)>=70?'high':'normal';
    const port=card.querySelector('.parta-portrait');
    if(port){
      port.classList.add('fj-c3-portrait-frame');
      const stamp=element('span','fj-c3-worker-number',String(index+1).padStart(2,'0'));
      stamp.setAttribute('aria-hidden','true');port.append(stamp);
    }
    const info=card.querySelector('.parta-info');
    const profession=info?.querySelector('.parta-prof');
    if(profession){
      profession.classList.add('fj-c3-profession');
      const icon=element('span','fj-c3-trade-mark',tradeMark(worker.prof));
      icon.setAttribute('aria-hidden','true');profession.prepend(icon);
    }
    const stars=info?.querySelector('.parta-stars');
    if(stars)stars.classList.add('fj-c3-trade-level');
    const current=info?.querySelector('.fj-crew-current-task');
    if(current)current.classList.add('fj-c3-duty');
    const actions=card.querySelector('.fj-crew-actions');
    if(actions)actions.classList.add('fj-c3-actions');
    // The original card already opens the profile on click. This adds keyboard
    // access to that same existing handler without changing its action.
    card.tabIndex=0;
    card.setAttribute('aria-label',(en?'Worker profile: ':'Profil řemeslníka: ')+worker.name);
    card.addEventListener('keydown',event=>{
      if(event.target!==card||!['Enter',' '].includes(event.key))return;
      event.preventDefault();card.click();
    });
  }

  function decorateProfile(app,state){
    const modal=app.querySelector('.fj-crew-profile');
    if(!modal||modal.classList.contains('fj-c3-profile'))return;
    modal.classList.add('fj-c3-profile');
    const bg=modal.closest('.fj-crew-profile-bg');
    if(bg)bg.classList.add('fj-c3-profile-backdrop');
    const head=modal.querySelector(':scope > div:first-child');
    if(head){
      head.classList.add('fj-c3-profile-heading');
      const port=head.querySelector('.detail-portrait-big');
      if(port)port.classList.add('fj-c3-portrait-frame');
      const worker=(state.workers||[]).find(w=>String(w.id)===String(state._partaDetail));
      if(worker){
        const level=element('span','fj-c3-profile-medal','Lv. '+between(Math.floor(number(worker.lv,1)),1,99));
        level.setAttribute('aria-label',(state.lang==='en'?'Experience level ':'Úroveň zkušeností ')+worker.lv);
        const name=head.querySelector(':scope > div:nth-child(2)');
        if(name)name.append(level);
      }
    }
    const tabs=modal.querySelector('.detail-subtabs');
    if(tabs)tabs.classList.add('fj-c3-detail-tabs');
  }

  function finish(app,state){
    if(!app||!state||state.phase!=='playing'||state.tab!=='parta')return;
    const grid=app.querySelector('.parta-grid');
    if(grid){
      const section=grid.closest('.sec');
      if(section){
        section.classList.add('fj-c3-roster');
        heading(section,state);
        const summary=section.querySelector('.parta-summary');
        if(summary)summary.classList.add('fj-c3-summary');
        const compact=section.querySelector('.fj-crew-summary');
        if(compact)compact.classList.add('fj-c3-secondary-summary');
      }
      const workers=new Map((state.workers||[]).map(w=>[String(w.id),w]));
      [...grid.querySelectorAll('.parta-card')].forEach((card,i)=>{
        const worker=workers.get(String(card.dataset.workerId));
        if(worker)decorateCard(card,worker,i,state);
      });
    }
    decorateProfile(app,state);
  }
  window.FajrumC3=Object.freeze({finish});
})();
