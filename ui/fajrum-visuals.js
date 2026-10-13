/* Phases 6–7: illustrative environments and supplies; no state writes or game actions. */
(function(){
 'use strict';
 const scenes={
  production:{asset:'production',cs:'Sklářská dílna',en:'Glassmaker’s workshop',alt_cs:'Očazený dílenský stůl se sklářskou píšťalou, kleštěmi a formou',alt_en:'Soot-darkened workbench with a blowpipe, pincers and wooden mould'},
  storage:{asset:'storage',cs:'Sklad hutě',en:'Foundry storeroom',alt_cs:'Dřevěné police, bedny a sláma ve skladu lesní hutě',alt_en:'Timber shelves, crates and straw inside the forest glassworks storeroom'},
  market:{asset:'market',cs:'Kupecký stánek',en:'Merchant’s stall',alt_cs:'Kupecký stůl s vahami, košíky a zabaleným sklem',alt_en:'Merchant’s table with scales, baskets and packed glass'},
  accounts:{asset:'accounts',cs:'Hutní účty',en:'Foundry accounts',alt_cs:'Účetní kniha, mince a vrubové hůlky na dubovém stole',alt_en:'Ledger, coins and tally sticks on an oak desk'},
  log:{asset:'chronicle',cs:'Kronika hutě',en:'Foundry chronicle',alt_cs:'Opotřebovaný deník, papír, brk a kalamář',alt_en:'Worn journal, rag paper, quill and inkpot'},
  archiv:{asset:'archive',cs:'Archiv a vzorník',en:'Archive and sample collection',alt_cs:'Dřevěná skříň s knihami, svitky a skleněnými vzorky',alt_en:'Wooden archive cupboard with books, scrolls and glass samples'}
 };
 const materialAssets={wood:'wood',sand:'sand',pureSand:'sand',potash:'potash',refinedPotash:'potash',panev:'panev',formy:'formy',limestone:'limestone',water:'water',clay:'clay',shamot:'shamot',food:'food',charcoal:'charcoal',stone:'stone',dryWood:'dryWood',firebrick:'firebrick',pitch:'pitch'};
 const additiveAssets=Object.fromEntries('smolka burel aesUstum crocusMartis cin olovo antimon zlato rtut stribro arsen'.split(' ').map(key=>[key,key]));
 const materialNames={cs:{waldglas:'Lesní sklo',crystal:'Křišťál',wood:'Dřevo',sand:'Písek',pureSand:'Čistý písek',potash:'Potaš',refinedPotash:'Čistá potaš',panev:'Tavicí pánev',formy:'Dřevěná forma',water:'Voda',limestone:'Vápenec',clay:'Jíl',shamot:'Šamot',food:'Jídlo',charcoal:'Dřevěné uhlí',stone:'Lomový kámen',dryWood:'Suché dříví',firebrick:'Šamotové kvádry',pitch:'Smůla'},en:{waldglas:'Forest glass',crystal:'Crystal',wood:'Wood',sand:'Sand',pureSand:'Pure sand',potash:'Potash',refinedPotash:'Refined potash',panev:'Melting crucible',formy:'Wooden mould',water:'Water',limestone:'Limestone',clay:'Clay',shamot:'Shamot',food:'Food',charcoal:'Charcoal',stone:'Quarry stone',dryWood:'Dry hardwood',firebrick:'Firebrick',pitch:'Pitch'}};
 const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;};
 function supplyPicture(key,kind,fallback){
  const asset=(kind==='additives'?additiveAssets:materialAssets)[key];if(!asset)return null;
  const frame=el('span','fj-material-picture'),img=el('img');frame.setAttribute('aria-hidden','true');
  img.src='img/'+kind+'/'+asset+'.webp';img.alt='';img.width=1280;img.height=1280;img.loading='lazy';img.decoding='async';
  img.addEventListener('error',()=>fallback?frame.replaceWith(fallback):frame.remove(),{once:true});frame.append(img);return frame;
 }
 const materialPicture=(key,fallback)=>supplyPicture(key,'materials',fallback);
 const additivePicture=(key,fallback)=>supplyPicture(key,'additives',fallback);
 function scene(state,options){
  const info=scenes[state.tab];if(!info)return null;
  const L=state.lang==='en'?'en':'cs',cs=L==='cs';
  const section=el('section','fj-section-art');section.dataset.artTab=state.tab;section.setAttribute('aria-label',info[L]);
  const figure=el('figure','fj-section-art-figure'),img=el('img','fj-section-art-image');
  img.src='img/sections/'+info.asset+'.webp';img.alt=info['alt_'+L];img.width=1536;img.height=1024;img.loading='eager';img.decoding='async';
  img.addEventListener('error',()=>{img.remove();figure.classList.add('is-unavailable');},{once:true});figure.append(img);
  const caption=el('figcaption','fj-section-art-caption');caption.append(el('span','',cs?'Lesní huť · Fajrum':'Forest glassworks · Fajrum'),el('h2','',info[L]));figure.append(caption);section.append(figure);
  let detail;
  if(state.tab==='production')detail=cs?`Hotové pánve ${state.pReady} · formy ${state.res.formy||0}`:`Ready crucibles ${state.pReady} · moulds ${state.res.formy||0}`;
  if(state.tab==='storage'){const count=[...new Set([...options.stockKeys,'rubin_raw'])].reduce((sum,key)=>sum+(Array.isArray(state[key])?state[key].length:0),0);detail=cs?`Sklo a výrobky: ${count} ks`:`Glass and glassware: ${count} pcs`;}
  if(state.tab==='market'){detail=options.marketClosed?(cs?'Běžný prodej je uzavřen':'Regular sales are closed'):(cs?'Trh je otevřen':'Market is open');section.dataset.closed=String(options.marketClosed);}
  if(state.tab==='accounts')detail=cs?`Hotovost ${state.grose} g · dluh ${state.debt} g`:`Cash ${state.grose} g · debt ${state.debt} g`;
  if(state.tab==='log')detail=cs?`Záznamy ${state.log.length} · sezóna ${state.season}`:`Entries ${state.log.length} · season ${state.season}`;
  if(state.tab==='archiv')detail=cs?'Výrobky · recepty · objevy':'Glassware · recipes · discoveries';
  if(detail)section.append(el('div','fj-section-art-detail',detail));return section;
 }
 function label(key,L){return BLOWN_ITEMS[key]?.[L]||GROUND_ITEMS[key]?.[L]||SPECIAL_ITEMS[key]?.[L]||materialNames[L][key]||COLOR_RECIPES[key]?.[L]||ADDITIVES[key]?.[L]||merchName(key,L);}
 function recipe(key,L){
  if(key.startsWith('rytina_'))return null;
  const b=BLOWN_ITEMS[key],g=GROUND_ITEMS[key],s=SPECIAL_ITEMS[key],it=b||g||s;if(!it)return null;
  const inputs=s?Object.entries(s.inputs):[[b?(b.inputs||[]).map(k=>label(k,L)).join(' / '):label(g.input,L),it.qty]];
  const parts=inputs.map(([key,n])=>`${n}× ${s?label(key,L):key}`);
  if(!s)for(const [key,n]of Object.entries(it.resCost||{}))parts.push(`${n}× ${label(key,L)}`);
  if(!s&&(it.requiresMould||['dzban','misa','dzban_forma'].includes(key)))parts.push(`1× ${label('formy',L)}`);
  const workers=s?s.workers:[it.spec];
  const names=workers.filter(Boolean).map(k=>(L==='cs'?PROF_CS:PROF_EN)[k]||k);
  let detail=parts.join(' + ')+' → '+(L==='cs'?(s?'sestavení':g?'broušení / leštění':'foukání'):(s?'assembly':g?'grinding / polishing':'blowing'));
  if(names.length)detail+=' · '+names.join(' + ');
  if(it.manualOnly)detail+=' · '+(L==='cs'?'ruční recept':'manual recipe');
  return detail;
 }
 function finish(app,state,options){
  for(const card of app.querySelectorAll('.fj-additive-offer')){
   if(card.querySelector('.fj-additive-offer-heading'))continue;
   const picture=additivePicture(card.dataset.additive);if(!picture)continue;
   const copy=el('div','fj-additive-offer-copy'),heading=el('div','fj-additive-offer-heading');
   const lines=[...card.children].filter(n=>n.tagName==='DIV');copy.append(...lines);heading.append(picture,copy);card.prepend(heading);
  }
  if(state.phase!=='playing')return;
  const content=app.querySelector('.content');if(!content)return;
  const L=state.lang==='en'?'en':'cs',hero=scene(state,options);if(hero&&!content.querySelector('.fj-section-art'))content.prepend(hero);
  for(const card of content.querySelectorAll('.fj-material-card')){
   if(card.querySelector('.fj-material-heading'))continue;
   const picture=materialPicture(card.dataset.material),title=card.querySelector('.sec-title');if(!picture||!title)continue;
   const heading=el('div','fj-material-heading');heading.append(picture,title);card.prepend(heading);
  }
  for(const card of content.querySelectorAll('.fj-material-stock')){
   const icon=card.firstElementChild;if(!icon||icon.classList.contains('fj-material-picture'))continue;
   const picture=materialPicture(card.dataset.material,icon);if(picture)icon.replaceWith(picture);
  }
  for(const card of content.querySelectorAll('.fj-additive-stock,.fj-additive-chip')){
   const icon=card.firstElementChild;if(!icon||icon.classList.contains('fj-material-picture'))continue;
   const picture=additivePicture(card.dataset.additive,icon);if(picture)icon.replaceWith(picture);
  }
  for(const input of content.querySelectorAll('.fj-color-input')){
   const icon=input.firstElementChild;if(!icon||icon.classList.contains('fj-material-picture'))continue;
   const picture=materialPicture(input.dataset.input,icon)||additivePicture(input.dataset.input,icon);if(picture)icon.replaceWith(picture);
  }
  for(const button of content.querySelectorAll('.fj-market-buy-item[data-resource]')){
   const key=button.dataset.resource,picture=materialPicture(key),title=button.querySelector(':scope > span:first-child > span:first-child');if(!picture||!title)continue;
   title.classList.add('fj-shop-item-title');title.replaceChildren(picture,document.createTextNode(merchName(key,L)));
  }
  const woodRow=content.querySelector('.fj-forest-wood-row');if(woodRow){const copy=woodRow.querySelector('span');if(copy&&!copy.querySelector('.fj-material-picture'))copy.prepend(materialPicture('wood'));}
  for(const row of content.querySelectorAll('.fj-codex-row')){
   const key=row.dataset.product;if(!key)continue;
   const cost=recipe(key,L);if(cost)row.querySelector('.fj-codex-recipe').textContent=cost;
   if(window.FajrumProducts?.hasArtwork(key)){
    row.classList.add('fj-codex-art');row.firstElementChild.replaceWith(FajrumProducts.picture(key,row.dataset.glass||undefined));
   }
  }
  if(state.tab==='market')for(const line of content.querySelectorAll('.fj-contract-line')){
   const key=line.dataset.item;if(!window.FajrumProducts?.hasArtwork(key))continue;
   line.classList.add('fj-contract-line-art');if(!line.querySelector('.fj-product-picture'))line.prepend(FajrumProducts.picture(key));
  }
  for(const card of content.querySelectorAll('.fj-commission-card')){
   const key={eg_img_church:'church',eg_img_noble:'noble',eg_img_trade:'trade'}[card.dataset.commission];
   const placeholder=card.querySelector('svg');if(!key||!placeholder)continue;
   const img=el('img','fj-commission-image');img.src='img/sections/commission-'+key+'.webp';img.alt='';img.width=1280;img.height=1280;img.loading='lazy';img.decoding='async';
   img.addEventListener('error',()=>img.replaceWith(placeholder),{once:true});placeholder.replaceWith(img);
  }
 }
 window.FajrumVisuals={finish,hasMaterial:key=>!!materialAssets[key],hasAdditive:key=>!!additiveAssets[key]};
})();
