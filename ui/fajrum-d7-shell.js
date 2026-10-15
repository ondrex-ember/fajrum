/* FAJRUM D7 — settings, More and existing dialog presentation, 1680.
   Read-only presentation: never changes G, saves, consent, listeners or game rules.
   Uses only existing /img/ui/nav-settings.webp and other repository assets. */
(function(){
  'use strict';
  const el=(tag,klass,txt)=>{
    const n=document.createElement(tag);if(klass)n.className=klass;
    if(txt!==undefined)n.textContent=String(txt);return n;
  };
  const L=(state,cs,en)=>state.lang==='en'?en:cs;
  const sections=[
    {key:'save',match:/Uložení hry|Save\s*\/\s*Load/i,cs:'Uložení',en:'Saves'},
    {key:'audio',match:/Zvuk|Audio/i,cs:'Zvuk',en:'Audio'},
    {key:'language',match:/^Jazyk$|^Language$/i,cs:'Jazyk',en:'Language'},
    {key:'privacy',match:/Soukromí|Privacy/i,cs:'Soukromí',en:'Privacy'},
    {key:'about',match:/^O hře$|^About$/i,cs:'O hře',en:'About'}
  ];
  function ornament(parent){
    const deco=el('span','fj-d7-folio-corner');deco.setAttribute('aria-hidden','true');parent.append(deco);
  }
  function heading(state){
    const head=el('header','fj-d7-heading');head.setAttribute('aria-label',L(state,'Kniha správy hry','Game administration book'));
    const lead=el('div','fj-d7-heading-lead'),emblem=el('span','fj-d7-heading-emblem');emblem.setAttribute('aria-hidden','true');
    const image=el('img');image.src='img/ui/nav-settings.webp';image.alt='';image.width=64;image.height=64;image.loading='lazy';image.decoding='async';
    image.addEventListener('error',()=>{image.remove();emblem.textContent='✥';},{once:true});emblem.append(image);
    const copy=el('div','fj-d7-heading-copy');copy.append(
      el('span','fj-d7-kicker',L(state,'LESNÍ HUŤ · SPRÁVA A ZÁZNAMY','FOREST GLASSWORKS · ADMINISTRATION')),
      el('h2','',L(state,'Kniha správy hutě','Glassworks administration')),
      el('p','',L(state,'Uložení, zvuk, jazyk a informace o hře','Saves, sound, language and game information'))
    );lead.append(emblem,copy);head.append(lead);
    ornament(head);
    return head;
  }
  function settings(app,state){
    const content=app.querySelector('.content');if(!content||content.classList.contains('fj-d7-settings'))return;
    const panels=[...content.children].filter(node=>node.classList.contains('sec'));
    const found=new Map();
    for(const section of panels){
      const title=section.querySelector(':scope > .sec-title');if(!title)continue;
      const def=sections.find(c=>c.match.test(title.textContent.trim()));if(!def)continue;
      section.classList.add('fj-d7-settings-panel');
      section.dataset.d7Group=def.key;
      title.classList.add('fj-d7-panel-title');
      section.querySelectorAll('.settings-row').forEach(row=>row.classList.add('fj-d7-setting-row'));
      for(const input of section.querySelectorAll('input[type="range"]'))input.classList.add('fj-d7-range');
      for(const button of section.querySelectorAll('button'))button.classList.add('fj-d7-setting-button');
      ornament(section);
      found.set(def.key,section);
    }
    if(!found.size)return;
    content.classList.add('fj-d7-settings');
    const head=heading(state),navigation=el('nav','fj-d7-settings-index');
    navigation.setAttribute('aria-label',L(state,'Oddíly nastavení','Settings sections'));
    for(const def of sections){
      const target=found.get(def.key);if(!target)continue;
      const button=el('button','fj-d7-index-link',L(state,def.cs,def.en));button.type='button';
      button.dataset.d7Link=def.key;
      button.addEventListener('click',()=>{
        const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});
      });
      navigation.append(button);
    }
    head.append(navigation);
    found.values().next().value.before(head);
    // Preserve the exact game-generated forms, buttons, labels and handlers.
    const destructive=found.get('save')?.querySelector('.btn-danger')?.closest('.settings-row');
    if(destructive)destructive.classList.add('fj-d7-danger-row');
    const about=found.get('about');if(about)about.classList.add('fj-d7-about');
  }
  function dialogs(app){
    for(const outer of app.querySelectorAll('.modal-bg')){
      // D1 has its own complete market and contract visual language.
      if(outer.classList.contains('fj-d1-contract-modal'))continue;
      const box=outer.querySelector(':scope > .modal');if(!box)continue;
      box.classList.add('fj-d7-dialog');
      const title=box.querySelector(':scope > h3, :scope > h2');if(title)title.classList.add('fj-d7-dialog-heading');
    }
  }
  function finish(app,state){
    if(!app||!state)return;
    if(state.phase==='playing'&&state.tab==='settings')settings(app,state);
    dialogs(app);
  }
  window.FajrumD7=Object.freeze({finish});
})();
