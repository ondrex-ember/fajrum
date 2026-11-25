/* FAJRUM F1 — jednotné záhlaví záložek na desktopu (hero obrázek + název + KPI + podzáložky).
   Čistě prezentační: nic nemění ve stavu hry. Hodnoty čte z bloků, které už záložka vykreslila (knižní záhlaví, pruhy, účty…),
   a ty pak schová (class fj-f1-merged), takže se nic nepočítá dvakrát. Mobil a okna < 960 px / < 500 px výšky se nedotýká. */
(function(){
  'use strict';
  const el=(tag,klass,txt)=>{const n=document.createElement(tag);if(klass)n.className=klass;if(txt!=null)n.textContent=String(txt);return n;};
  const txt=n=>n?n.textContent.replace(/\s+/g,' ').trim():'';
  const q=(root,sel)=>root?root.querySelector(sel):null;
  const qa=(root,sel)=>root?[...root.querySelectorAll(sel)]:[];
  const merge=nodes=>nodes.forEach(n=>n&&n.classList.add('fj-f1-merged'));

  function kpi(k){
    const cell=el('div','fj-f1-kpi');
    if(k.tone)cell.dataset.tone=k.tone;
    if(k.key)cell.dataset.kpi=k.key;
    const label=el('span','fj-f1-kpi-label');
    if(k.icon)label.append(el('i','fj-f1-kpi-icon',k.icon));
    label.append(document.createTextNode(k.l));
    cell.append(label,el('strong','',k.v));
    if(k.s)cell.append(el('small','',k.s));
    return cell;
  }
  // Čtení dvojic (štítek / hodnota / poznámka) z hotových buněk záložky
  const cells=(root,cellSel,l,v,s,icon)=>qa(root,cellSel).map(c=>({l:txt(q(c,l)),v:txt(q(c,v)),s:s?txt(q(c,s)):'',icon:icon?txt(q(c,icon)):'',node:c})).filter(x=>x.l&&x.v);

  function side(hero,head,kpis,extra){
    const box=el('div','fj-f1-side');
    const top=el('div','fj-f1-top');
    const copy=el('div','fj-f1-copy');
    if(head.kicker)copy.append(el('span','fj-f1-kicker',head.kicker));
    if(head.title)copy.append(el('h3','fj-f1-title',head.title));
    if(head.sub)copy.append(el('p','fj-f1-sub',head.sub));
    top.append(copy);
    if(head.chip){const chip=el('span','fj-f1-chip',head.chip);if(head.chipState)chip.dataset.state=head.chipState;top.append(chip);}
    box.append(top);
    if(kpis&&kpis.length){const row=el('div','fj-f1-kpis');row.dataset.count=String(kpis.length);kpis.forEach(k=>row.append(kpi(k)));box.append(row);}
    if(extra)extra.forEach(n=>n&&box.append(n));
    hero.classList.add('fj-f1-head');
    try{const cs=getComputedStyle(hero.parentNode);hero.style.setProperty('--f1-padx',cs.paddingLeft||'0px');hero.style.setProperty('--f1-pady',cs.paddingTop||'0px');}catch(e){}
    hero.append(box);
    return box;
  }
  const moveSubs=(content,box)=>{
    const bar=q(content,':scope > .detail-subtabs.fj-sub-chips')||q(content,':scope > .fj-d6-tabs')||q(content,'.fj-d6-tabs');
    if(bar){const wrap=el('div','fj-f1-subs');wrap.append(bar);box.append(wrap);}
  };
  const heroOf=content=>q(content,':scope > .fj-section-art')||q(content,':scope > .fj-artwork');

  function overview(content,state,o){
    const hero=q(content,':scope > .fj-hut-hero');if(!hero)return;
    const cs=state.lang!=='en',foot=q(hero,'.fj-art-foot');
    const st=window.FajrumArt&&FajrumArt.furnaceState?FajrumArt.furnaceState(state,o):null;
    const heat=Math.round(Number(state.fTemp)||0),wear=Math.round(Number(state.furnace&&state.furnace.shamotWear)||0);
    const kpis=[
      {key:'heat',l:cs?'Žár pece':'Furnace heat',v:heat+' %',tone:heat>85?'warn':''},
      {key:'wear',l:cs?'Opotřebení šamotu':'Shamot wear',v:wear+' %',tone:wear>70?'warn':''},
      {key:'ready',l:cs?'Hotové pánve':'Ready crucibles',v:String(state.pReady||0)},
      {key:'wood',l:cs?'Dřevo skladem':'Wood in store',v:String((state.res&&state.res.wood)||0)}
    ];
    const actions=el('div','fj-f1-actions');
    if(foot){const chip=q(foot,'.fj-art-status'),link=q(foot,'.fj-art-link');if(chip)actions.append(chip);if(link)actions.append(link);}
    const box=side(hero,{kicker:cs?'Stav hutě':'Foundry status',title:txt(q(foot,'.fj-art-date')),chip:null},kpis,[actions]);
    merge([foot]);
    return box;
  }
  function furnace(content,state){
    const hero=q(content,':scope > .fj-hearth-hero');if(!hero)return;
    const cs=state.lang!=='en',readout=q(hero,'.fj-hearth-readout'),foot=q(hero,'.fj-art-foot'),plate=q(content,'.fj-c2b-plate');
    const kpis=cells(readout,'.fj-hearth-stat','span','strong').map(x=>({l:x.l,v:x.v,tone:x.node.classList.contains('is-warning')?'warn':''}));
    cells(plate,'.fj-c2b-plate-fact','small','strong').forEach(x=>{if(!/^(Opot|Wear)/i.test(x.l))kpis.push({l:x.l,v:x.v});});
    const actions=el('div','fj-f1-actions');
    if(foot){const chip=q(foot,'.fj-art-status'),link=q(foot,'.fj-art-link');if(chip)actions.append(chip);if(link)actions.append(link);}
    const box=side(hero,{kicker:txt(q(plate,'.fj-c2b-eyebrow'))||(cs?'Pec':'Furnace'),title:txt(q(plate,'h3'))||(cs?'Tavicí komora':'Melting chamber')},kpis,[actions]);
    // teploměr zůstává v desce pece, jen bez hlavičky a faktů (jsou v KPI)
    merge([readout,foot,q(plate,'.fj-c2b-plate-head'),q(plate,'.fj-c2b-plate-facts')]);
    moveSubs(content,box);
    return box;
  }
  function production(content){
    const hero=q(content,':scope > .fj-section-art');if(!hero)return;
    const ribbon=q(content,':scope > .fj-c2a-ribbon'),reg=q(content,':scope > .fj-d4-register');
    const kpis=cells(ribbon,'.fj-c2a-ribbon-cell','small','strong',null,'.fj-c2a-ribbon-icon').map(x=>({l:x.l,v:x.v,icon:x.icon}));
    const box=side(hero,{kicker:txt(q(reg,'.fj-d4-register-kicker')),title:txt(q(reg,'h3')),sub:txt(q(reg,'p'))},kpis);
    merge([ribbon,reg,q(hero,'.fj-section-art-detail')]);moveSubs(content,box);return box;
  }
  function storage(content,state){
    const hero=q(content,':scope > .fj-section-art');if(!hero)return;
    const cs=state.lang!=='en',cont=q(content,':scope > .fj-d3-contents'),detail=q(hero,'.fj-section-art-detail');
    const m=/:\s*(.+)$/.exec(txt(detail));
    const kpis=[{l:cs?'Sklo a výrobky':'Glass and goods',v:m?m[1]:'—'},
      {l:cs?'Pokladna':'Treasury',v:mny(state.grose)},
      {l:cs?'Dluh':'Debt',v:mny(state.debt||0),tone:(state.debt||0)>0?'warn':''}];
    const box=side(hero,{kicker:txt(q(cont,'.fj-d3-contents-kicker')),title:txt(q(cont,'h3')),sub:txt(q(cont,'.fj-d3-contents-subtitle'))},kpis);
    merge([cont,detail]);moveSubs(content,box);return box;
  }
  function market(content,state){
    const hero=q(content,':scope > .fj-section-art');if(!hero)return;
    const ledger=q(content,':scope > .fj-d1-market-ledger'),status=q(content,':scope > .fj-market-status'),open=q(status,'.fj-market-open');
    const kpis=cells(ledger,'.fj-d1-head-stat','span','strong').map(x=>({l:x.l,v:x.v}));
    cells(status,'.fj-market-summary-cell','span','strong','small').forEach(x=>kpis.push({l:x.l,v:x.v,s:x.s}));
    const closed=open&&open.dataset.closed==='true';
    const box=side(hero,{kicker:txt(q(ledger,'.fj-d1-overline')),title:txt(q(ledger,'h2')),sub:txt(q(ledger,'p')),chip:txt(open),chipState:closed?'closed':'open'},kpis);
    merge([ledger,status,q(hero,'.fj-section-art-detail')]);moveSubs(content,box);return box;
  }
  function accounts(content,state){
    const hero=q(content,':scope > .fj-section-art');if(!hero)return;
    const book=q(content,':scope > .fj-d2-book-header');if(!book)return;
    const kpis=cells(book,'.fj-d2-ledger-entry','.fj-d2-ledger-label','.fj-d2-ledger-value').map(x=>({l:x.l,v:x.v,tone:x.node.dataset.alert==='true'?'warn':''}));
    const note=q(book,'.fj-d2-ledger-note'),noteEl=note?el('p','fj-f1-note',txt(note)):null;
    if(noteEl&&note.dataset.status)noteEl.dataset.status=note.dataset.status;
    const box=side(hero,{kicker:txt(q(book,'.fj-d2-kicker')),title:txt(q(book,'h2')),sub:txt(q(book,'.fj-d2-book-title p'))},kpis,[noteEl]);
    merge([book,q(hero,'.fj-section-art-detail')]);moveSubs(content,box);return box;
  }
  function chronicle(content,state){
    const hero=q(content,':scope > .fj-section-art');if(!hero)return;
    const sec=q(content,':scope > .fj-d5-chronicle');if(!sec)return;
    const kpis=cells(sec,'.fj-d5-register-item',':scope > span:first-child','strong').map(x=>({l:x.l,v:x.v}));
    const cs=state.lang!=='en';
    const box=side(hero,{kicker:cs?'LESNÍ HUŤ · KRONIKA':'FOREST GLASSWORKS · CHRONICLE',title:cs?'Kronika hutě':'Glassworks chronicle',sub:txt(q(sec,'.fj-d5-subtitle')),chip:txt(q(hero,'.fj-section-art-detail'))},kpis);
    merge([q(sec,'.fj-d5-title'),q(sec,'.fj-d5-subtitle'),q(sec,'.fj-d5-register'),q(hero,'.fj-section-art-detail')]);return box;
  }
  function archive(content,state){
    const hero=q(content,':scope > .fj-section-art');if(!hero)return;
    const sec=q(content,':scope > .fj-d6-archive'),reg=q(sec,'.fj-d6-register');if(!reg)return;
    const kpis=cells(reg,'.fj-d6-register-cell','span','strong').map(x=>({l:x.l,v:x.v}));
    const box=side(hero,{kicker:txt(q(reg,'.fj-d6-kicker')),title:txt(q(reg,'h2')),sub:txt(q(reg,'p'))},kpis);
    merge([reg,q(sec,':scope > .sec-title'),q(hero,'.fj-section-art-detail')]);moveSubs(content,box);return box;
  }
  function forest(content,state){
    const cs=state.lang!=='en';
    if(!q(content,':scope > .fj-forest-sec'))return;
    const hero=el('section','fj-section-art fj-f1-forest');hero.dataset.artTab='forest';
    const fig=el('figure','fj-section-art-figure'),img=el('img','fj-section-art-image');
    img.src='img/worksites/forestry.webp';img.alt=cs?'Špalky, sekera a sazenice na lesní mýtině':'Logs, axe and saplings in a forest clearing';img.width=1536;img.height=1024;img.loading='eager';img.decoding='async';
    img.addEventListener('error',()=>{img.remove();fig.classList.add('is-unavailable');},{once:true});
    const cap=el('figcaption','fj-section-art-caption');cap.append(el('span','',cs?'Lesní huť · Fajrum':'Forest glassworks · Fajrum'),el('h2','',cs?'Hvozd':'The forest'));
    fig.append(img,cap);hero.append(fig);
    const f2=state.forest2||{},max=state.forestMax||0,s=state.forest||0,y=f2.y||0,z=f2.z||0,p=Math.max(0,max-s-y-z);
    const kpis=[{icon:'🌲',l:cs?'Těžitelný':'Harvestable',v:s+' / '+max},{icon:'🌿',l:cs?'Mlází':'Young growth',v:String(y)},{icon:'🌱',l:cs?'Sazenice':'Saplings',v:String(z)},{icon:'▫️',l:cs?'Paseka':'Clearing',v:String(p)}];
    const dens=txt(q(content,'.fj-forest-density'));
    const box=side(hero,{kicker:cs?'LESNÍ HUŤ · HVOZD':'FOREST GLASSWORKS · WOODLAND',title:cs?'Správa lesa':'Forest management',sub:cs?'Kácení, výsadba a péče o hvozd':'Felling, planting and woodland care',chip:dens},kpis);
    content.prepend(hero);moveSubs(content,box);
    const sec=q(content,':scope > .fj-forest-sec');
    merge([q(sec,'.fj-worksite-card[data-worksite="forestry"]'),q(sec,'.fj-forest-stages'),q(sec,'.fj-forest-density')]);
    return box;
  }

  const handlers={overview,furnace,production,storage,market,accounts,log:chronicle,archiv:archive,forest};
  function finish(app,state,options){
    if(!app||!state||state.phase!=='playing'||!app.classList.contains('desktop'))return;
    const content=app.querySelector('.content');if(!content||q(content,'.fj-f1-side'))return;
    const fn=handlers[state.tab];if(!fn)return;
    try{fn(content,state,options||{});}catch(e){if(window.console)console.warn('FajrumF1',state.tab,e);}
  }
  window.FajrumF1=Object.freeze({finish});
})();
