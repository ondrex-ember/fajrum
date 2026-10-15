/* Read-only product presentation. All recipes, prices and actions remain in index.html. */
(function(){
 'use strict';
 const tiles={cise:0,dzban:1,pullitr:2,holba:2,romer:3,romer_krist:3,pohar:4,dekantr:5,kalamar:6,koule:7,misa:8,dzban_forma:1,tercik:9,banka:10,spunt:11,kutrolf:12,stangenglas:13,pateriky:14,konvice:15,mucholapka:-1};
 const extraTiles={tezitko:0,pucmeloun:1,vaza_dekor:2,ozdoba:3,brus_hrana_cise:4,brus_hrana_panel:5,brus_koule:6,brus_tezitko:7,brus_lustr_dil:8,brus_pokal:9,brus_vaza:10,brus_vaza_velka:11,brus_misa:12,brus_poharak:13,zrcadlo:14,alembik:15,zlut:5};
 const sourceRegions=[[25, 105, 295, 191], [329, 32, 301, 278], [683, 0, 218, 316], [1020, 11, 184, 297], [58, 311, 230, 302], [361, 309, 234, 309], [645, 336, 296, 280], [952, 403, 287, 206], [94, 616, 158, 321], [384, 613, 186, 330], [689, 617, 205, 319], [953, 618, 283, 323], [12, 975, 306, 242], [366, 982, 229, 235], [665, 931, 251, 313], [932, 939, 315, 306]];
 const catalogueTiles={krautstrunk:0,berkemeyer:1,passglas:2,cise_ceska:3,maigelein:4,humpen:5,matula:6,cucurbita:7,retorta:8,fiala:9,tabule:10,lampa:11,hladitko:12,ampulka:13,cteci_kamen:14,herni_kameny:15};
 const catalogueRegions=[[20, 35, 287, 282], [325, 20, 306, 291], [685, 2, 223, 312], [1018, 0, 169, 318], [0, 395, 325, 209], [352, 322, 245, 306], [633, 309, 301, 321], [964, 304, 275, 327], [0, 628, 327, 308], [406, 629, 150, 309], [639, 614, 290, 337], [960, 663, 294, 254], [0, 946, 318, 304], [346, 932, 266, 319], [622, 980, 323, 231], [943, 960, 311, 263]];
 const singleAssets={mucholapka:'mucholapka.webp',pucmeloun:'figurka.webp',kutrolf:'kutrolf.webp',stangenglas:'stangenglas.webp',tercik:'tercik.webp',alembik:'alembik.webp',hodiny:'hodiny.webp'};
 let clipSequence=0;
 const filters={waldglas:'none',crystal:'saturate(0) brightness(1.22)',jantar:'hue-rotate(-48deg) saturate(1.6)',zlut:'hue-rotate(-25deg) saturate(1.5)',modra:'hue-rotate(145deg) saturate(1.8)',smaragd:'hue-rotate(28deg) saturate(1.7)',rubin:'hue-rotate(280deg) saturate(2)',lattimo:'saturate(0) brightness(1.55)'};
 function base(key){return Object.keys({...tiles,...extraTiles,...catalogueTiles,...singleAssets}).sort((a,b)=>b.length-a.length).find(k=>key===k||key.startsWith(k+'_'));}
 function picture(key,color){
  const frame=document.createElement('div');frame.className='fj-product-picture';frame.setAttribute('aria-hidden','true');
  const engraved=key.startsWith('rytina_');key=key.replace(/^rytina_/,'');
  const k=base(key);
  color=color||Object.keys(filters).find(c=>key.endsWith('_'+c))||(key==='zlut'?'zlut':key.startsWith('brus_')||['pohar','dekantr','romer_krist','kalamar','tezitko','vaza_dekor','stangenglas','zrcadlo','alembik'].includes(k)?'crystal':'waldglas');
  if(!k){frame.classList.add('fj-product-no-art');return frame;}
  const extra=Object.prototype.hasOwnProperty.call(extraTiles,k);
  const catalogue=Object.prototype.hasOwnProperty.call(catalogueTiles,k);
  const tile=catalogue?catalogueTiles[k]:extra?extraTiles[k]:tiles[k];let sprite;
  if(singleAssets[k]){
   // Standalone historical product images must be DOM images, not CSS backgrounds.
   // CSS-background sprites were invisible in the Codex although the files loaded.
   sprite=document.createElement('span');
   sprite.className='fj-product-sprite fj-product-single'+(k==='pucmeloun'?' fj-product-figurine':'');
   const img=document.createElement('img');
   img.className='fj-product-single-image';
   img.src='img/products/'+singleAssets[k];
   img.alt=''; img.decoding='async'; img.loading='eager';
   img.addEventListener('error',()=>{
    img.remove();
    sprite.classList.add('fj-product-single-unavailable');
    // A neutral missing-image mark rather than a different, incorrect vessel.
    sprite.textContent='◇';
   },{once:true});
   sprite.append(img);
  }else{
   // Exact per-object source windows; the generated atlas is NOT a regular grid.
   // viewBox preserves proportions and prevents any neighboring object from entering the frame.
   const regions=[
    [45,35,230,270],[330,10,285,303],[675,33,263,276],[990,5,235,304],
    [52,312,216,303],[330,311,290,316],[640,390,290,228],[975,355,266,265],
    [5,677,326,201],[345,627,276,258],[664,622,218,266],[1020,637,180,250],
    [50,881,229,365],[378,888,199,350],[619,1007,330,222],[954,900,282,339]
   ];
   const ns='http://www.w3.org/2000/svg';sprite=document.createElementNS(ns,'svg');
   sprite.setAttribute('class','fj-product-sprite');const bounds=catalogue?catalogueRegions[tile]:extra?sourceRegions[tile]:regions[tile];
   sprite.setAttribute('viewBox',bounds.join(' '));
   sprite.setAttribute('preserveAspectRatio','xMidYMid meet');sprite.style.backgroundImage='none';sprite.style.clipPath='none';
   const clipId='fj-product-clip-'+(++clipSequence),defs=document.createElementNS(ns,'defs');
   const clip=document.createElementNS(ns,'clipPath');clip.setAttribute('id',clipId);clip.setAttribute('clipPathUnits','userSpaceOnUse');
   const rect=document.createElementNS(ns,'rect');
   ['x','y','width','height'].forEach((attr,i)=>rect.setAttribute(attr,bounds[i]));
   clip.append(rect);defs.append(clip);sprite.append(defs);
   const image=document.createElementNS(ns,'image');image.setAttribute('clip-path','url(#'+clipId+')');image.setAttribute('href',catalogue?'img/products/historical-catalogue.webp':extra?'img/products/glass-special-alpha.webp':'img/products/glass-atlas-alpha.webp');
   image.setAttribute('width',catalogue?'1254':'1254');image.setAttribute('height',catalogue?'1254':'1254');sprite.append(image);
  }
  sprite.dataset.product=k;sprite.style.filter=filters[color]||'none';frame.append(sprite);
  if(engraved){
   frame.classList.add('is-engraved');
   const ns='http://www.w3.org/2000/svg',motif=document.createElementNS(ns,'svg');
   motif.setAttribute('class','fj-engraving-overlay');motif.setAttribute('viewBox','0 0 40 40');
   const path=document.createElementNS(ns,'path');path.setAttribute('d','M20 4 C8 9 8 16 20 20 C32 16 32 9 20 4 M20 36 C8 31 8 24 20 20 C32 24 32 31 20 36 M4 20 C9 8 16 8 20 20 C16 32 9 32 4 20 M36 20 C31 8 24 8 20 20 C24 32 31 32 36 20');
   motif.append(path);frame.append(motif);
  }
  if(key==='tercik_vyplne')sprite.style.filter='saturate(.65) brightness(.8)';
  return frame;
 }
 function finish(app,state){
  if(state.phase!=='playing')return;
  for(const card of app.querySelectorAll('.fj-stock-card,.fj-sale-row,.fj-craft-card')){
   if(!card.querySelector('.fj-product-picture'))card.prepend(picture(card.dataset.product,card.dataset.glass));
  }
  for(const card of app.querySelectorAll('.fj-recipe-card,.fj-craft-card')){
   const grid=card.parentElement;if(grid.style.display==='grid'){grid.classList.add('fj-recipe-grid');grid.style.opacity='1';}
   // Full color names are visible to touch users; original buttons and callbacks stay intact.
   const names=state.lang==='en'?{waldglas:'Forest',crystal:'Crystal',jantar:'Amber',modra:'Blue',smaragd:'Emerald',rubin:'Ruby',lattimo:'Milk',zlut:'Silver stain'}:{waldglas:'Lesní',crystal:'Křišťál',jantar:'Jantar',modra:'Modř',smaragd:'Smaragd',rubin:'Rubín',lattimo:'Lattimo',zlut:'Žluť'};
   const buttons=[...card.querySelectorAll('button[title]')].filter(b=>b.title.includes(' · '));
   if(buttons.length)buttons[0].parentElement.classList.add('fj-glass-options');
   for(const b of buttons){const label=b.title.split(' · ')[0];b.setAttribute('aria-label',b.title);b.classList.add('fj-glass-choice');
    const color=b.dataset.glass||Object.keys(names).find(k=>({waldglas:['Lesní sklo','Waldglas'],crystal:['Křišťál','Crystal'],jantar:['Jantar','Amber'],modra:['Temná modř','Dark blue'],smaragd:['Smaragd','Emerald'],rubin:['Rubín','Ruby'],lattimo:['Lattimo','Milk glass'],zlut:['Stříbrná žluť','Silver stain']}[k]||[]).includes(label));
    const text=document.createElement('span');text.textContent=' '+(names[color]||label);b.append(text);
   }
  }
 }
 window.FajrumProducts={picture,finish,hasArtwork:key=>!!base(key.replace(/^rytina_/,""))};
})();
