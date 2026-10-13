/* Phases 2, 10 and 13. Read-only artwork: no game state or save mutations. */
(function () {
  'use strict';
  const months = {
    cs:['Listopad','Prosinec','Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen'],
    en:['November','December','January','February','March','April','May','June','July','August','September','October']
  };
  const seasons = {
    winter:{cs:'Zima v Arnsdorfu',en:'Winter in Arnsdorf',alt_cs:'Sklářská huť v zasněženém hvozdu',alt_en:'Forest glassworks in winter snow'},
    spring:{cs:'Jaro v Arnsdorfu',en:'Spring in Arnsdorf',alt_cs:'Sklářská huť v jarním hvozdu',alt_en:'Forest glassworks in spring'},
    summer:{cs:'Léto v Arnsdorfu',en:'Summer in Arnsdorf',alt_cs:'Sklářská huť v letním hvozdu',alt_en:'Forest glassworks in summer'},
    autumn:{cs:'Podzim v Arnsdorfu',en:'Autumn in Arnsdorf',alt_cs:'Sklářská huť v podzimním hvozdu',alt_en:'Forest glassworks in autumn'}
  };
  function seasonForRound(round) {
    if(round>=4&&round<=6)return 'spring';
    if(round>=7&&round<=9)return 'summer';
    if(round>=10&&round<=11)return 'autumn';
    return 'winter';
  }
  function forestState(state) {
    const forest=Number(state.forest),capacity=Number(state.forestMax)||80;
    if(state.forest==null||!Number.isFinite(forest)||forest<0||!Number.isFinite(capacity)||capacity<=0){
      return {key:'unknown',asset:null};
    }
    if(forest===0)return {key:'depleted',asset:'cleared',cs:'Hvozd vyčerpán',en:'Forest depleted'};
    const ratio=forest/capacity;
    if(ratio<=.25)return {key:'scarce',asset:'cleared',cs:'Hvozd téměř vytěžený',en:'Forest heavily logged'};
    if(ratio<.6)return {key:'thinned',asset:'thinned',cs:'Prořídlý hvozd',en:'Thinned woodland'};
    return {key:'dense',asset:null,cs:'Souvislý hvozd',en:'Dense woodland'};
  }
  function furnaceState(state, options) {
    const temp=Number.isFinite(Number(state.fTemp))?Number(state.fTemp):0;
    if(state.fActive){
      if(temp>85)return {key:'overheated',asset:'hot',cs:'Přetopená pec',en:'Overheated furnace'};
      if(temp>=68)return {key:'working',asset:'hot',cs:'Pec v provozu',en:'Furnace running'};
      return {key:'warming',asset:temp>=55?'hot':'embers',cs:'Pec se rozehřívá',en:'Furnace warming'};
    }
    if(temp>10){
      if(options.tempering)return {key:'tempering',asset:'embers',cs:'Temperování pece',en:'Furnace tempering'};
      return {key:'cooling',asset:'embers',cs:'Pec chladne',en:'Furnace cooling'};
    }
    return {key:'cold',asset:'cold',cs:options.inPrep?'Studená pec':'Pec vyhasla',en:options.inPrep?'Cold furnace':'Furnace out'};
  }
  function node(tag, cls, text) {
    const element=document.createElement(tag);
    if(cls)element.className=cls;
    if(text!=null)element.textContent=text;
    return element;
  }
  function photograph(src, alt, type, fallbackSrc, fallbackAlt) {
    const frame=node('figure','fj-art-figure');
    const image=node('img','fj-art-image');
    image.src=src;image.alt=alt;image.width=1536;image.height=1024;
    image.decoding='async';image.loading='eager';
    let triedFallback=false;
    const onError=()=>{
      if(fallbackSrc&&!triedFallback){triedFallback=true;image.src=fallbackSrc;image.alt=fallbackAlt||alt;return;}
      image.removeEventListener('error',onError);
      frame.classList.add('is-unavailable');
      const fallback=node('span','fj-art-fallback',alt);
      frame.append(fallback);
    };
    image.addEventListener('error',onError);
    frame.dataset.kind=type;
    frame.append(image);
    return frame;
  }
  function statusChip(status,lang) {
    const chip=node('span','fj-art-status',status[lang]);
    chip.dataset.state=status.key;
    return chip;
  }
  function hut(state, options) {
    const lang=state.lang==='en'?'en':'cs';
    const season=seasonForRound(state.round),info=seasons[season];
    const forest=forestState(state),legacy=`img/world/hut-${season}.webp`;
    const source=forest.asset?`img/world/hut-${season}-${forest.asset}.webp`:legacy;
    const status=furnaceState(state,options);
    const section=node('section','fj-artwork fj-hut-hero');
    section.dataset.season=season;
    section.dataset.forestState=forest.key;
    section.setAttribute('aria-label',lang==='cs'?'Tvoje huť':'Your glassworks');
    const alt=info['alt_'+lang]+(forest[lang]?' · '+forest[lang]:'');
    const fallbackAlt=info['alt_'+lang]+' · '+(lang==='cs'?'Záložní obraz okolí':'Fallback landscape illustration');
    const frame=photograph(source,alt,'hut',source===legacy?null:legacy,fallbackAlt);
    const caption=node('figcaption','fj-art-caption');
    caption.append(node('span','fj-art-eyebrow',info[lang]));
    caption.append(node('h2','',state.huteName||(lang==='cs'?'Tvoje huť':'Your glassworks')));
    frame.append(caption);
    const foot=node('div','fj-art-foot');
    const month=months[lang][state.round]||months[lang][0];
    const year=1679+(Number(state.season)||1);
    const phase=lang==='cs'?(options.inPrep?'Příprava':'Kampaň'):(options.inPrep?'Preparation':'Campaign');
    const time=node('span','fj-art-date',`${month} ${year} · ${phase}`);
    foot.append(time,statusChip(status,lang));
    const link=node('button','fj-art-link',lang==='cs'?'Otevřít pec →':'Open furnace →');
    link.type='button';link.addEventListener('click',()=>options.select('furnace'));
    foot.append(link);
    section.append(frame,foot);
    return section;
  }
  function furnace(state, options) {
    const lang=state.lang==='en'?'en':'cs',status=furnaceState(state,options);
    const section=node('section','fj-artwork fj-hearth-hero');
    section.dataset.furnaceState=status.key;
    section.dataset.furnaceType=state.furnace.type;
    section.style.setProperty('--fj-heat',String(Math.max(0,Math.min(100,Number(state.fTemp)||0))/100));
    section.setAttribute('aria-label',lang==='cs'?'Topeniště pece':'Furnace firebox');
    const alt={
      cold:lang==='cs'?'Studené očazené topeniště bez ohně':'Cold soot-stained firebox without fire',
      embers:lang==='cs'?'Očazené topeniště se zbytkovým žárem':'Soot-stained firebox with glowing embers',
      hot:lang==='cs'?'Rozžhavené topeniště sklářské pece':'Hot working glassworks firebox'
    };
    const type=state.furnace.type,legacy=`img/world/furnace-${status.asset}.webp`;
    const source=['primitive','stone','master'].includes(type)?`img/furnaces/${type}-${status.asset}.webp`:legacy;
    const frame=photograph(source,alt[status.asset],'furnace',source===legacy?null:legacy);
    const caption=node('figcaption','fj-art-caption');
    caption.append(node('span','fj-art-eyebrow',lang==='cs'?'Topeniště':'Firebox'));
    caption.append(node('h2','',lang==='cs'?options.furnaceType.name:options.furnaceType.nameEn));
    frame.append(caption);
    const readout=node('div','fj-hearth-readout');
    for(const [label,value,key] of [
      [lang==='cs'?'Žár':'Heat',`${state.fTemp}%`,'heat'],
      [lang==='cs'?'Místa pro pánve':'Crucible slots',options.furnaceType.maxSlots||1,'slots'],
      [lang==='cs'?'Opotřebení':'Wear',`${state.furnace.shamotWear}%`,'wear']
    ]){
      const cell=node('div','fj-hearth-stat');cell.dataset.stat=key;
      cell.append(node('span','',label),node('strong','',value));
      if((key==='heat'&&Number(state.fTemp)>85)||(key==='wear'&&Number(state.furnace.shamotWear)>70))cell.classList.add('is-warning');
      readout.append(cell);
    }
    const foot=node('div','fj-art-foot');
    foot.append(statusChip(status,lang));
    const controls=node('button','fj-art-link',lang==='cs'?'Ovládání pece ↓':'Furnace controls ↓');
    controls.type='button';
    controls.addEventListener('click',()=>{
      const target=section.closest('.content').querySelector('.furnace-dash');
      if(target)target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
    foot.append(controls);
    section.append(frame,readout,foot);
    return section;
  }
  function finish(app,state){
    if(state.phase!=='interseason')return;
    for(const button of app.querySelectorAll('button[data-furnace-preview]')){
      if(button.classList.contains('fj-furnace-upgrade'))continue;
      const type=button.dataset.furnacePreview;
      if(!['stone','master'].includes(type))continue;
      const copy=node('span','fj-furnace-upgrade-copy');
      copy.append(...button.childNodes);
      const image=node('img','fj-furnace-upgrade-picture');
      image.src=`img/furnaces/${type}-cold.webp`;image.alt='';image.width=1536;image.height=1024;image.loading='eager';image.decoding='async';
      image.addEventListener('error',()=>image.remove(),{once:true});
      button.classList.add('fj-furnace-upgrade');button.append(image,copy);
    }
  }
  window.FajrumArt={hut,furnace,seasonForRound,forestState,furnaceState,finish};
})();
