/* Market presentation only. Quotes and all trade actions come from the game. */
(function(){
 'use strict';
 const raw=new Set(['waldglas','crystal','jantar','zlut','modra','smaragd','lattimo','rubin']);
 const prefs={search:'',group:'all'};
 const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;};
 const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function name(key,L){
  const rawNames={waldglas:{cs:'Lesní sklo',en:'Forest glass'},crystal:{cs:'Křišťál',en:'Crystal'},tercik_vyplne:{cs:'Výplňové terče (nepodařené)',en:'Filler discs (rejects)'},tercik_zebrovy:{cs:'Terčík žebrový (prémiový)',en:'Ribbed disc (premium)'}};
  if(rawNames[key])return rawNames[key][L];
  if(COLOR_RECIPES[key])return COLOR_RECIPES[key][L];
  const item=BLOWN_ITEMS[key]||GROUND_ITEMS[key]||SPECIAL_ITEMS[key];
  if(item)return item[L];
  if(key.startsWith('rytina_'))return (L==='cs'?'Rytina · ':'Engraved · ')+name(key.slice(7),L);
  const split=key.lastIndexOf('_'),base=key.slice(0,split),color=key.slice(split+1);
  if(BLOWN_ITEMS[base]&&(COLOR_RECIPES[color]||color==='waldglas'||color==='crystal'))return name(base,L)+' · '+name(color,L);
  return contractItemName(key,L);
 }
 function demand(state,options){
  const needed={};
  for(const c of [...(state.contracts||[]),...(state.repContracts||[])]){
   if(c.due<state.round)continue;
   for(const x of options.lines(c))needed[x.item]=(needed[x.item]||0)+x.need;
  }
  return needed;
 }
 function stockPlan(state,options){
  const stock={},plan=new Map();
  // processRound evaluates each group from the last accepted contract backwards.
  for(const [source,list]of [['market',state.contracts||[]],['rep',state.repContracts||[]]]){
   for(let i=list.length-1;i>=0;i--){
    const c=list[i],lines=options.lines(c).map(x=>{
     if(stock[x.item]==null)stock[x.item]=(state[x.item]||[]).length;
     return {...x,available:stock[x.item]};
    });
    const ready=c.due>=state.round&&lines.every(x=>x.available>=x.need);
    plan.set(source+':'+i,{ready,lines,expired:c.due<state.round});
    // Incomplete orders do not consume a partial delivery.
    if(ready)for(const x of lines)stock[x.item]-=x.need;
   }
  }
  return plan;
 }
 function contracts(section,state,options,plan){
  const L=state.lang==='en'?'en':'cs',cs=L==='cs';
  const note=el('p','fj-market-note',cs?'Odevzdání proběhne automaticky na konci měsíce. Všechny zakázky sdílejí sklad s prodejem.':'Delivery happens automatically at month end. All contracts share stock with sales.');
  section.querySelector('.sec-title').after(note);
  for(const card of section.querySelectorAll('.fj-contract-card')){
   const c=(card.dataset.contractSource==='market'?state.contracts:state.repContracts)[Number(card.dataset.contractIndex)];
   const status=options.status(c),allocation=plan.get(card.dataset.contractSource+':'+card.dataset.contractIndex);
   const shared=!allocation.ready&&!allocation.expired&&allocation.lines.some(x=>x.available<x.have);
   const stateKey=allocation.expired?'expired':shared?'shared':status.state;
   card.dataset.state=stateKey;
   const labels=cs?{ready:'Zásoba připravena',shared:'Sdílená zásoba',expired:'Po termínu',last:'Poslední měsíc',blocked:'Pec do termínu netaví',work:'Ve výrobě'}:{ready:'Stock ready',shared:'Shared stock',expired:'Overdue',last:'Last month',blocked:'No firing before due date',work:'In progress'};
   card.prepend(el('div','fj-contract-state',labels[stateKey]));
   let total=0,got=0;
   const nodes=[...card.querySelectorAll('.fj-contract-line')];
   allocation.lines.forEach((x,i)=>{
    total+=x.need;got+=Math.min(x.available,x.need);
    const line=nodes[i],missing=Math.max(0,x.need-x.available);
    line.replaceChildren(el('span','fj-contract-line-name',x.label),el('strong','',`${x.available}/${x.need}`));
    line.dataset.missing=String(missing>0);
    line.append(el('span','fj-contract-line-detail',missing?(cs?`Chybí ${missing} ks`:`${missing} missing`):(cs?'Zásoba stačí':'Enough in stock')));
   });
   const progress=card.querySelector('.fj-contract-progress'),pct=total>0?Math.round(got/total*100):0;
   progress.setAttribute('aria-valuenow',pct);progress.firstElementChild.style.width=pct+'%';
   const guidance=card.querySelector('.fj-contract-guidance');
   if(shared)guidance.textContent=cs?'Jiná zakázka spotřebuje stejné kusy jako první. Bez další výroby tato zásoba nestačí.':'Another contract consumes these pieces first. Current stock will not cover both without further production.';
   if(allocation.expired)guidance.textContent=cs?'Termín uplynul. Zakázka propadne při uzavření měsíce.':'The deadline has passed. This contract expires at month end.';
  }
  for(const offer of section.querySelectorAll('.fj-contract-offer')){
   const c=state.avail.find(c=>String(c.id)===offer.dataset.contractId);if(!c)continue;
   const missing=options.lines(c).reduce((sum,x)=>sum+Math.max(0,x.need-x.have),0);
   offer.firstElementChild.append(el('div','fj-offer-stock',cs?(missing?`Ze současné zásoby chybí ${missing} ks`:'Současná zásoba stačí'):(missing?`${missing} missing from current stock`:'Current stock is sufficient')));
   offer.querySelector('button').setAttribute('aria-label',(cs?'Přijmout · ':'Accept · ')+c[L]);
  }
 }
 function sales(section,app,state,options,needed){
  const L=state.lang==='en'?'en':'cs',cs=L==='cs';
  if(section.querySelector('.fj-sale-closed'))return;
  const seen=new Set();
  for(const row of [...section.querySelectorAll('.fj-sale-row')]){if(seen.has(row.dataset.product))row.remove();else seen.add(row.dataset.product);}
  // Some older saves contain a legacy colour key; retain access to its original sell action.
  for(const key of Object.keys(options.prices())){
   if(seen.has(key)||!Array.isArray(state[key])||!state[key].length)continue;
   const row=el('div','fj-sale-row');row.dataset.product=key;
   row.append(FajrumProducts.picture(key),el('span','',name(key,L)));
   const controls=el('div');
   for(const qty of [1,999]){const b=el('button','btn btn-s');b.type='button';b.addEventListener('click',()=>options.sell(key,qty));controls.append(b);}row.append(controls);section.append(row);
  }
  for(const child of [...section.children])if(!child.classList.contains('fj-sale-row')&&child.style.borderTop)child.remove();
  const rows=[...section.querySelectorAll('.fj-sale-row')];
  for(const row of rows){
   const key=row.dataset.product,inv=state[key]||[],title=name(key,L),reserved=needed[key]||0,free=Math.max(0,inv.length-reserved);
   const copy=row.querySelector(':scope > span'),actions=row.querySelector(':scope > div:last-child');
   copy.className='fj-sale-copy';copy.replaceChildren(el('strong','fj-sale-name',title));
   const lo=Math.min(...inv),hi=Math.max(...inv),quality=lo===hi?lo.toFixed(1):lo.toFixed(1)+'–'+hi.toFixed(1);
   copy.append(el('span','fj-sale-stock',cs?`${inv.length} ks · kvalita ${quality} ★`:`${inv.length} pcs · quality ${quality} ★`));
   actions.className='fj-sale-actions';
   [...actions.querySelectorAll('button')].forEach((button,i)=>{
    const q=options.quote(key,i===0?1:999);
    const label=i===0?(cs?'Prodat 1 ks':'Sell 1 pc'):(cs?`Vše (${q.count})`:`All (${q.count})`);
    button.replaceChildren(el('span','',label),el('strong','',q.total+' g'));
    button.dataset.saleCount=q.count;button.dataset.saleTotal=q.total;
    button.setAttribute('aria-label',`${label} · ${title} · ${q.total} g`);
    button.dataset.affectsContracts=String(reserved>0&&q.count>free);
   });
   row.dataset.raw=String(raw.has(key));row.dataset.search=norm(title);
   if(reserved){
    const id='fj-sale-need-'+key,note=el('div','fj-sale-reservation',cs?`Potřeba pro zakázky: ${reserved} ks · volných ${free} ks`:`Contracts need ${reserved} pcs · ${free} spare`);note.id=id;row.append(note);
    for(const b of actions.querySelectorAll('button'))if(b.dataset.affectsContracts==='true')b.setAttribute('aria-describedby',id);
   }
  }
  if(!rows.length)return;
  const controls=el('div','fj-market-controls'),label=el('label','fj-market-search-label',cs?'Najít ve skladu':'Find in stock');
  const input=el('input','fj-market-search');input.type='search';input.value=prefs.search;input.placeholder=cs?'Název výrobku…':'Product name…';input.setAttribute('aria-label',cs?'Hledat zboží k prodeji':'Search goods for sale');label.append(input);controls.append(label);
  const groups=el('div','fj-market-filters');groups.setAttribute('role','group');groups.setAttribute('aria-label',cs?'Druh zboží':'Goods category');
  const buttons=[];
  const empty=el('div','fj-market-note fj-sale-filter-empty',cs?'Žádné odpovídající zboží.':'No matching goods.');empty.setAttribute('role','status');
  const apply=()=>{
   const search=norm(prefs.search.trim());let shown=0;
   for(const row of rows){row.hidden=!(row.dataset.search.includes(search)&&(prefs.group==='all'||(prefs.group==='glass')===(row.dataset.raw==='true')));if(!row.hidden)shown++;}
   empty.hidden=shown>0;
   for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.group===prefs.group));
  };
  for(const [key,title]of [['all',cs?'Vše':'All'],['glass',cs?'Sklo':'Glass'],['goods',cs?'Výrobky':'Glassware']]){const b=el('button','btn btn-s',title);b.type='button';b.dataset.group=key;b.addEventListener('click',()=>{prefs.group=key;apply();});groups.append(b);buttons.push(b);}
  input.addEventListener('input',()=>{prefs.search=input.value;apply();});controls.append(groups);rows[0].before(controls);
  section.append(empty,el('p','fj-market-note',cs?'Ceny tlačítek zahrnují kvalitu i aktuální bonusy. Prodávají se nejprve nejlepší kusy. Potřeba zakázek je doporučení — sklad se neblokuje.':'Button prices include quality and current bonuses. The best pieces sell first. Contract quantities are advisory; stock is not locked.'));apply();
 }
 function finish(app,state,options){
  if(state.phase!=='playing'||state.tab!=='market')return;
  const content=app.querySelector('.content');if(!content)return;
  const L=state.lang==='en'?'en':'cs',cs=L==='cs',needed=demand(state,options),plan=stockPlan(state,options);
  content.classList.add('fj-market-page');
  const sections=new Map([...content.querySelectorAll('.fj-market-section')].map(n=>[n.dataset.marketSection,n]));
  if(sections.has('contracts'))contracts(sections.get('contracts'),state,options,plan);
  if(sections.has('sell'))sales(sections.get('sell'),app,state,options,needed);
  const active=(state.contracts||[]).length+(state.repContracts||[]).length,ready=[...plan.values()].filter(x=>x.ready).length;
  let units=0,value=0;for(const key of Object.keys(options.prices()))if(Array.isArray(state[key])&&state[key].length){units+=state[key].length;value+=options.quote(key,state[key].length).total;}
  const summary=el('div','fj-market-summary');
  for(const [label,total,detail]of [
   [cs?'Hotovost':'Cash',state.grose+' g',cs?`Dluh ${state.debt} g`:`Debt ${state.debt} g`],
   [cs?'Aktivní zakázky':'Active contracts',active,cs?`${ready} ze současné zásoby`:`${ready} from current stock`],
   [cs?'Sklad k prodeji':'Sale stock',units+(cs?' ks':' pcs'),cs?`Tržní hodnota ${value} g`:`Market value ${value} g`]
  ]){const cell=el('div','fj-market-summary-cell');cell.append(el('span','',label),el('strong','',total),el('small','',detail));summary.append(cell);}
  const status=content.querySelector('.fj-market-status');if(status)status.append(summary);
  const nav=el('nav','fj-market-nav');nav.setAttribute('aria-label',cs?'Části trhu':'Market sections');
  for(const [key,label]of [['contracts',cs?'Zakázky':'Contracts'],['sell',cs?'Prodej':'Sell'],['buy',cs?'Nákup':'Buy'],['forest',cs?'Hvozd':'Forest'],['quick',cs?'Výkup':'Buyout'],['loans',cs?'Půjčky':'Loans'],['hire',cs?'Nábor':'Hire']]){
   const section=sections.get(key);if(!section)continue;section.tabIndex=-1;
   const b=el('button','btn btn-s',label);b.type='button';b.setAttribute('aria-controls',section.id);b.addEventListener('click',()=>{section.focus({preventScroll:true});section.scrollIntoView({block:'start',behavior:'instant'});});nav.append(b);
  }
  if(status)status.after(nav);else content.prepend(nav);
  const quick=sections.get('quick');if(quick){
   quick.querySelector('.sec-title').after(el('p','fj-market-note',cs?'Výkup zahrnuje jen lesní sklo, křišťál a nebarvené foukané výrobky. Barevné, broušené, ryté a sestavené výrobky zůstávají ve skladu.':'Buyout covers only forest glass, crystal and uncoloured blown goods. Coloured, ground, engraved and assembled goods remain in stock.'));
   const affected=Object.keys(needed).filter(k=>k==='waldglas'||k==='crystal'||BLOWN_ITEMS[k]).some(k=>(state[k]||[]).length>0);
   if(affected&&!state.quickSellUsed)quick.append(el('p','fj-market-note is-warning',cs?'Výkup odveze i kusy potřebné pro aktivní zakázky.':'Buyout also takes pieces needed for active contracts.'));
  }
  for(const b of content.querySelectorAll('.fj-market-buy-item')){
   const key=b.dataset.resource;b.setAttribute('aria-label',(cs?'Koupit 1× ':'Buy 1× ')+merchName(key,L)+' · '+state.shop[key].price+' g');
   b.append(el('span','fj-shop-own',cs?`Máš ${state.res[key]||0}`:`Have ${state.res[key]||0}`));
  }
 }
 window.FajrumMarket={finish};
})();
