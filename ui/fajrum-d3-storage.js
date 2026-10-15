/* FAJRUM D3 — Stock book presentation, 1680. Reads the existing DOM and game state.
   No game-state mutations, inventory changes, prices, saves, or duplicated controls. */
(function(){
 'use strict';
 const el=(tag,cls,text)=>{
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(text!==undefined)n.textContent=String(text);
  return n;
 };
 const tone=(value)=>{
  const v=String(value||'').toLowerCase().replace(/\s+/g,'');
  if(v==='#a03020'||v==='rgb(160,48,32)')return 'fj-d3-danger';
  if(v==='#4a7a3a'||v==='rgb(74,122,58)')return 'fj-d3-positive';
  if(v==='#c9952b'||v==='rgb(201,149,43)')return 'fj-d3-caution';
  return '';
 };
 const groups=[
  {key:'glass',selector:'.fj-glass-stock-grid',cs:'Sklo a výrobky',en:'Glass and glassware'},
  {key:'additives',selector:'.fj-additive-stock-grid',cs:'Přísady',en:'Additives'},
  {key:'materials',selector:'.fj-material-grid',cs:'Suroviny',en:'Materials'},
  {key:'economy',selector:'.fj-economy-stock-grid',cs:'Hospodářství',en:'Accounts'}
 ];
 function contents(state,sections){
  const en=state.lang==='en';
  const root=el('section','fj-d3-contents');root.setAttribute('aria-label',en?'Storehouse index':'Rejstřík skladu');
  const lead=el('div','fj-d3-contents-lead');
  const frame=el('span','fj-d3-contents-icon');frame.setAttribute('aria-hidden','true');
  const image=el('img');image.src='img/ui/nav-storage.webp';image.alt='';image.width=72;image.height=72;
  image.loading='lazy';image.addEventListener('error',()=>frame.replaceChildren(el('span','', '▤')),{once:true});frame.append(image);
  const heading=el('div','');heading.append(
   el('span','fj-d3-contents-kicker',en?'FOREST GLASSWORKS · 1680':'LESNÍ HUŤ · 1680'),
   el('h3','',en?'Storehouse register':'Skladový rejstřík'),
   el('span','fj-d3-contents-subtitle',en?'Recorded goods and materials':'Zapsané zboží a suroviny')
  );lead.append(frame,heading);root.append(lead);
  const nav=el('nav','fj-d3-index');nav.setAttribute('aria-label',en?'Storehouse sections':'Oddíly skladu');
  sections.forEach((s,i)=>{
   const b=el('button');b.type='button';
   b.append(el('span','fj-d3-index-numeral',String(i+1).padStart(2,'0')),
            document.createTextNode(en?s.en:s.cs));
   b.setAttribute('aria-label',(en?'Jump to ':'Přejít na ')+(en?s.en:s.cs));
   b.addEventListener('click',()=>s.section.scrollIntoView({block:'start',behavior:
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
   nav.append(b);
  });
  root.append(nav);return root;
 }
 function markGlass(grid){
  grid.classList.add('fj-d3-glass-grid','fj-d3-stock-grid');
  for(const card of grid.children){
   card.classList.add('fj-d3-stock-item');
   const chunks=[...card.children].filter(c=>c.tagName==='DIV'&&!c.classList.contains('fj-product-picture'));
   if(chunks[0])chunks[0].classList.add('fj-d3-item-name');
   if(chunks[1]){
    chunks[1].classList.add('fj-d3-item-quantity');
    if(/^0\s*×/.test(chunks[1].textContent.trim()))card.classList.add('fj-d3-empty');
   }
   if(chunks[2])chunks[2].classList.add('fj-d3-item-detail');
  }
 }
 function markInventory(grid,kind){
  grid.classList.add('fj-d3-stock-grid',kind==='additives'?'fj-d3-additive-grid':'fj-d3-material-grid');
  for(const card of grid.children){
   if(!card.classList.contains(kind==='additives'?'fj-additive-stock':'fj-material-stock'))continue;
   card.classList.add('fj-d3-stock-item');
   const copy=[...card.children].find(c=>c.tagName==='DIV');
   if(copy){copy.classList.add('fj-d3-item-copy');
    const label=copy.children[0],qty=copy.children[1];
    if(label){label.classList.add('fj-d3-item-label');const c=tone(label.style.color);if(c)card.classList.add(c);}
    if(qty)qty.classList.add('fj-d3-item-value');
   }
   if(card.dataset.quantity==='0')card.classList.add('fj-d3-empty');
  }
 }
 function markEconomy(grid){
  grid.classList.add('fj-d3-economy-grid','fj-d3-stock-grid');
  for(const card of grid.children){
   const copy=[...card.children].find(c=>c.tagName==='DIV');if(!copy)continue;
   card.classList.add('fj-d3-stock-item');copy.classList.add('fj-d3-item-copy');
   const label=copy.children[0],val=copy.children[1];
   if(label)label.classList.add('fj-d3-item-label');
   if(val){val.classList.add('fj-d3-item-value');const c=tone(val.style.color);if(c)card.classList.add(c);}
  }
 }
 function finish(app,state){
  if(!app||!state||state.phase!=='playing'||state.tab!=='storage')return;
  const content=app.querySelector('.content');
  if(!content||content.classList.contains('fj-d3-storage'))return;
  const sections=groups.map((g)=>{
   const grid=content.querySelector(g.selector),section=grid?.closest('.sec');
   return grid&&section?{...g,grid,section}:null;
  }).filter(Boolean);
  if(!sections.length)return;
  content.classList.add('fj-d3-storage');
  const hero=content.querySelector('.fj-section-art[data-art-tab="storage"]');
  if(hero)hero.classList.add('fj-d3-scene');
  for(const [i,s] of sections.entries()){
   s.section.classList.add('fj-d3-stock-section');
   s.section.dataset.d3Section=s.key;
   if(s.key==='economy')s.section.classList.add('fj-d3-economy-section');
   const title=s.section.querySelector(':scope > .sec-title');
   if(title&&!title.querySelector('.fj-d3-section-numeral')){
    title.classList.add('fj-d3-stock-heading');
    title.prepend(el('span','fj-d3-section-numeral',String(i+1).padStart(2,'0')));
   }
   if(s.key==='glass')markGlass(s.grid);
   else if(s.key==='economy')markEconomy(s.grid);
   else markInventory(s.grid,s.key);
  }
  const nav=contents(state,sections);
  if(hero)hero.after(nav);
  else sections[0].section.before(nav);
 }
 window.FajrumD3=Object.freeze({finish});
})();
