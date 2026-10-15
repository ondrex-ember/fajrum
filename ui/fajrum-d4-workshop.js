/* FAJRUM D4 — final workshop presentation, forest glassworks circa 1680.
   DOM-only enhancement: no game state writes, prices, recipe mutations or cloned action buttons.
   Reuses the current workshop, potash, grinding, engraving and product illustrations. */
(function(){
  'use strict';
  const make=(tag,cls,text)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=String(text);
    return node;
  };
  const TITLE={
    cs:{kicker:'LESNÍ HUŤ · DÍLENSKÝ REJSTŘÍK',heading:'Zápisy o výrobě',intro:'Sklovina, foukání a zušlechťování skla',sections:['Sklovina a formy','Foukané sklo','Broušení','Rytiny','Zvláštní výrobky']},
    en:{kicker:'FOREST GLASSWORKS · WORKSHOP REGISTER',heading:'Workshop records',intro:'Glass batch, blowing and finishing',sections:['Glass & moulds','Blown glass','Grinding','Engraving','Special wares']}
  };
  function findSection(content,regexp){
    for(const title of content.querySelectorAll('.sec-title')){
      if(regexp.test(title.textContent||'')){
        const section=title.closest('.sec');
        if(section&&content.contains(section))return section;
      }
    }
    return null;
  }
  function createIndex(content,sections,lang){
    const t=TITLE[lang];
    const block=make('section','fj-d4-register');
    block.setAttribute('aria-label',t.heading);
    const brand=make('div','fj-d4-register-brand');
    const figure=make('span','fj-d4-register-emblem');
    figure.setAttribute('aria-hidden','true');
    const image=make('img');
    image.src='img/ui/nav-workshop.webp';image.alt='';image.width=62;image.height=62;
    image.decoding='async';image.loading='lazy';
    image.addEventListener('error',()=>figure.remove(),{once:true});
    figure.append(image);
    const copy=make('div','fj-d4-register-copy');
    copy.append(make('span','fj-d4-register-kicker',t.kicker),make('h3','',t.heading),make('p','',t.intro));
    brand.append(figure,copy);
    const nav=make('nav','fj-d4-register-nav');
    nav.setAttribute('aria-label',lang==='cs'?'Oddíly dílny':'Workshop sections');
    sections.forEach(([section,idx])=>{
      if(!section)return;
      const button=make('button','fj-d4-register-link');button.type='button';
      button.append(make('span','fj-d4-register-number',String(idx+1).padStart(2,'0')),document.createTextNode(t.sections[idx]));
      button.addEventListener('click',()=>{
        const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        section.scrollIntoView({block:'start',behavior:prefersReduced?'auto':'smooth'});
      });
      nav.append(button);
    });
    block.append(brand,nav);
    const ribbon=content.querySelector('.fj-c2a-ribbon');
    const scene=content.querySelector('.fj-section-art[data-art-tab="production"]');
    if(ribbon)ribbon.after(block);
    else if(scene)scene.after(block);
    else content.prepend(block);
  }
  function markSection(section,id){
    if(!section)return;
    section.classList.add('fj-d4-section','fj-d4-'+id);
    const title=section.querySelector(':scope > .sec-title');
    if(title)title.classList.add('fj-d4-section-heading');
    // Keep every original recipe and worker controls in place.
    for(const child of section.children){
      if(child.tagName==='DIV' && child!==title && !child.matches('.fj-worksite-card,.fj-material-heading')
          && !child.classList.contains('fj-d4-notes') && !child.querySelector('.fj-recipe-card,.fj-craft-card')){
        // Apply ink colours only to small informational notes, not forms or action groups.
        if(child.style.fontSize && child.style.fontSize!=='')child.classList.add('fj-d4-notes');
      }
    }
  }
  function decorateProducts(content){
    for(const card of content.querySelectorAll('.fj-recipe-card,.fj-craft-card')){
      card.classList.add('fj-d4-product');
      const head=[...card.children].find(child=>child.tagName==='DIV'&&child.style.display==='flex'&&child.style.justifyContent==='space-between');
      if(head)head.classList.add('fj-d4-product-head');
      const pic=card.querySelector(':scope > .fj-product-picture');
      if(pic)pic.classList.add('fj-d4-product-art');
      // The original disabled-looking button retains its original handler and guard.
      const actions=card.querySelectorAll('button');
      for(const button of actions){
        if(button.classList.contains('fj-glass-choice'))continue;
        if(button.closest('.batch-btn-row'))continue;
        if(button.parentElement===card)button.classList.add('fj-d4-craft-action');
      }
    }
    for(const grid of content.querySelectorAll('.fj-recipe-grid')){
      grid.classList.add('fj-d4-product-grid');
      // Old presentation faded the whole specialist group to 40% opacity.
      // Retain unavailability in data/labels; don't make text unreadable.
      if(Number(grid.style.opacity)>0&&Number(grid.style.opacity)<1){
        grid.dataset.d4Unassigned='true';
      }
    }
    for(const card of content.querySelectorAll('.fj-craft-card')){
      const grid=card.parentElement;
      if(grid?.style?.display==='grid')grid.classList.add('fj-d4-product-grid');
    }
  }
  function finish(app,state){
    if(!app||!state||state.phase!=='playing'||state.tab!=='production')return;
    const content=app.querySelector('.content');
    if(!content||content.classList.contains('fj-d4-production'))return;
    content.classList.add('fj-d4-production');
    const lang=state.lang==='en'?'en':'cs';
    const station1=content.querySelector('.sec[data-worksite="potash"]');
    const crucibles=content.querySelector('.sec[data-material="panev"]');
    const crystal=findSection(content,lang==='cs'?/^✨\s*Křišťál/:/^✨\s*Crystal/);
    const moulds=content.querySelector('.sec[data-material="formy"]');
    for(const [id,section] of [['glass-batch',station1],['crucibles',crucibles],['crystal',crystal],['moulds',moulds]]){
      markSection(section,id);
      if(section)section.classList.add('fj-d4-station');
    }
    const blowing=findSection(content,/Foukané výrobky|Blown Glassware/i);
    const grinding=content.querySelector('.sec[data-worksite="grinding"]');
    const engraving=content.querySelector('.sec[data-worksite="engraving"]');
    const special=findSection(content,/Okenní sklo|Window Glass/i);
    for(const [name,section]of [['blowing',blowing],['grinding',grinding],['engraving',engraving],['special',special]])markSection(section,name);
    const intro=content.querySelector('.fj-section-art[data-art-tab="production"]');
    if(intro)intro.classList.add('fj-d4-original-scene');
    createIndex(content,[[station1,0],[blowing,1],[grinding,2],[engraving,3],[special,4]],lang);
    decorateProducts(content);
  }
  window.FajrumD4=Object.freeze({finish});
})();
