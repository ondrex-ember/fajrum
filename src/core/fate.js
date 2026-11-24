// fate.js — W2: události s volbou (Android W2). Jen nová ekonomika (G._econ===2), od sezóny FATE.firstSeason, jedna za sezónu v kolech FATE.rounds.
// Stav: G.fate={fx:[{k,v,from,to}], pending:{kind,season,round}|null, done:sezóna poslední události, hist:[{season,round,kind,opt,hit}]}.
// Měsíc, druh a šance se losují z proudu (wSeed, sezóna, měsíc) — ne z hlavního RNG; načtení savu výsledek nezmění. Jedno hození na událost
// (stejné u všech voleb), takže nižší riziko nikdy nedopadne hůř než vyšší ve stejném světě. Doznívající efekty čte wxFx (weather.js).
// Dokud událost čeká (pending), processRound se nespustí (gate na začátku processRound).

function fateInit(){return{fx:[],pending:null,done:0,hist:[],plague:null,plagueSeason:0};}
function fatePending(){return!!(econ2()&&G.fate&&G.fate.pending);}
function _fL(cs,en){return G.lang==="cs"?cs:en;}
function fateMult(){return(G.difficulty==="easy"?FATE.easyMult:1)*(1+FATE.growth*Math.max(0,(G.season||1)-FATE.firstSeason));}
function _fScale(v){return v>0?Math.max(1,Math.round(v*fateMult())):0;}
function fateCostOf(o){const c=o.cost||{};return{zl:_fScale(c.zl||0)*KR,wood:_fScale(c.wood||0),food:_fScale(c.food||0)};}

// Sklad zboží, které jde prodat na trhu: [{type,q}]
function fateGoods(){
  const out=[];
  for(const type of Object.keys(marketSalePrices())){const a=G[type];if(Array.isArray(a))for(const q of a)out.push({type,q});}
  return out;
}

// Měsíc události v sezóně: v weatherShare sezón první měsíc s mrazem / suchem / bouří, jinak měsíc ze zrna (rovnoměrně v FATE.rounds)
function fateMonth(season){
  const[a,b]=FATE.rounds;
  if(wxU(G.wSeed,3,season,0,0)<FATE.weatherShare){
    for(let r=a;r<=b;r++){const k=weatherKind(season,r);if(k==="frost"||k==="dry"||k==="storm")return r;}
  }
  return a+Math.floor(wxU(G.wSeed,3,season,1,0)*(b-a+1));
}
// Druh události v daném měsíci: počasí řídí mráz a požár, jinak kalendář (od kola 5 vojsko, přesycení při ≥ glutMin kusech)
function fateKindFor(season,round){
  const wk=weatherKind(season,round);
  if(wk==="frost")return"frost";
  if(wk==="dry"||wk==="storm")return"fire";
  const pool=["forest"];
  if(round>=5)pool.push("army");
  if(round>=FATE.elbeMinRound&&fateElbeContracts().length>0)pool.push("elbe");
  if(round>=5&&fateGoods().length>=FATE.glutMin)pool.push("glut");
  return pool[Math.min(pool.length-1,Math.floor(wxU(G.wSeed,5,season,round,0)*pool.length))];
}
// Otevřené zakázky Hoffmanna (jen ty se Labem přepisují); zakázky se zálohou jsou Reichelovy, takže sem nepatří
function fateElbeContracts(){return(G.contracts||[]).filter(c=>c&&c.buyer===FATE.elbeBuyer&&!c.adv);}
function fateElbeApply(mult){
  const list=fateElbeContracts();let lost=0;
  for(const c of list){const nr=Math.max(KR,Math.round(c.reward*mult/KR)*KR);lost+=Math.max(0,c.reward-nr);c.reward=nr;}
  return{n:list.length,lost};
}
function fateElbePreview(mult){let lost=0;const l=fateElbeContracts();for(const c of l)lost+=Math.max(0,c.reward-Math.max(KR,Math.round(c.reward*mult/KR)*KR));return{n:l.length,lost};}

// Mor (W3): naplánuje se z vojska (po rozhodnutí) nebo z horka; max. jeden za sezónu, nezabírá běžný slot
function fatePlagueSchedule(round,src){
  G.fate.plague={season:G.season,round,src};G.fate.plagueSeason=G.season;
}
function fateArmyRumour(pd){
  const P=FATE.plague;
  if(G.fate.plagueSeason===pd.season||!(wxU(G.wSeed,7,pd.season,pd.round,0)<P.armyP))return;
  const d=P.armyDelay[0]+Math.floor(wxU(G.wSeed,7,pd.season,pd.round,1)*(P.armyDelay[1]-P.armyDelay[0]+1));
  fatePlagueSchedule(Math.min(P.lastRound,pd.round+d),"army");
  G.log.push(`__EVT__📣 ${_fL("Vojáci roznášejí zvěsti o moru v sousedním kraji…","Soldiers spread rumours of plague in the next district…")}`);
}
// Z horka: v kolech heat.from..heat.to, v prvním měsíci, kdy se nasbírají ≥ minMonths měsíce sucha/bouře, jeden los
function fateHeatPlague(){
  const P=FATE.plague.heat,s=G.season,r=G.round;
  if(r<P.from||r>P.to||G.fate.plagueSeason===s)return false;
  const hot=rr=>{const k=weatherKind(s,rr);return k==="dry"||k==="storm";};
  let cnt=0;for(let q=P.from;q<=r;q++)if(hot(q))cnt++;
  if(!hot(r)||cnt!==P.minMonths)return false;   // „první takový měsíc“ = měsíc, kdy počet dosáhne minMonths
  return wxU(G.wSeed,6,s,r,0)<P.p;
}

// Volá se na konci processRound (G.round je už nové kolo): uklidí doznělé efekty a případně založí čekající událost
function fateOnRound(){
  if(!econ2())return;
  if(!G.fate)G.fate=fateInit();
  const at=wxAbs(G.season,G.round),S=G.season,r=G.round;
  G.fate.fx=G.fate.fx.filter(e=>e.to>=at);
  if(G.fate.plague&&G.fate.plague.season!==S)G.fate.plague=null;   // nespuštěný mor z minulé sezóny propadá
  if(S<FATE.firstSeason||G.fate.pending)return;
  if(!G.fate.plague&&fateHeatPlague())fatePlagueSchedule(r,"heat");   // los z horka proběhne vždy (i v měsíci běžné události; mor pak čeká na další měsíc)
  const reg=G.fate.done!==S&&r>=FATE.rounds[0]&&r<=FATE.rounds[1]&&r===fateMonth(S);
  if(reg){
    const kind=fateKindFor(S,r);
    G.fate.pending={kind,season:S,round:r};G.fate.done=S;
    const k=FATE.kinds[kind];
    G.log.push(`__EVT__⚠️ ${k.icon} ${_fL(k.cs,k.en)} — ${_fL("rozhodni na Přehledu","decide on the Overview")}`);
    return;   // případný mor čeká na další měsíc (druhá událost nikdy ve stejném měsíci)
  }
  const pl=G.fate.plague;
  if(pl&&pl.season===S&&r>=pl.round&&r<=FATE.plague.lastRound){
    G.fate.pending={kind:"plague",season:S,round:r};G.fate.plague=null;
    const k=FATE.kinds.plague;
    G.log.push(`__EVT__⚠️ ${k.icon} ${_fL(k.cs,k.en)} — ${_fL("rozhodni na Přehledu","decide on the Overview")}`);
  }
}

function _fRiskP(o){return o.risk?(weatherKind(G.season,G.round)==="storm"&&o.risk.pStorm!==undefined?o.risk.pStorm:o.risk.p):null;}
// Nejbližší jarmark v rozmezí 1..within měsíců (ve stejné sezóně) → kolo, jinak null
function _fFairAhead(within){
  const fr=(ECON2.fair&&ECON2.fair.rounds)||[];
  for(const f of fr)if(f>G.round&&f-G.round<=within)return f;
  return null;
}
function fateDumpTotal(o){
  const rate=o.rate*(G.difficulty==="easy"&&!o.noEasy?1.2:1),prices=marketSalePrices();
  let total=0,n=0;
  for(const g of fateGoods()){total+=Math.max(KR,Math.round(g.q*inZl(prices[g.type]||350)*rate)*KR);n++;}
  return{total,n,rate};
}
function _fHitParts(h){
  const out=[];
  if(h.woodPct)out.push(`−${h.woodPct} % 🌳`);
  if(h.zl)out.push(`−${_fScale(h.zl)} zl`);
  if(h.morale)out.push(`😟 ${h.morale}`);
  if(h.rewardMult)out.push(`🏙️ ${_fL("odměny","rewards")} −${Math.round((1-h.rewardMult)*100)} %`);
  return out.join(", ");
}
// Pohled jedné volby pro UI: {id,label,desc,cost,costParts,risk:{p,hit},ok,why}
function fateOptionView(o,pd){
  const cost=fateCostOf(o),parts=[];
  if(cost.zl)parts.push({icon:"💰",text:"−"+mny(cost.zl),ok:G.grose>=cost.zl});
  if(cost.wood)parts.push({icon:"🌳",text:"−"+cost.wood,ok:G.res.wood>=cost.wood});
  if(cost.food)parts.push({icon:"🍞",text:"−"+cost.food,ok:G.res.food>=cost.food});
  let ok=parts.every(x=>x.ok),why=ok?null:_fL("nemáš na to zásoby","you lack the supplies");
  const risk=o.risk?{p:_fRiskP(o),hit:_fHitParts(o.risk.hit||{}),penalty:!!(o.risk.hit)}:null;
  let extra=null;
  if(o.special==="dump"){
    const d=fateDumpTotal(o);extra={text:d.n>0?`+${mny(d.total)} · ${d.n}×`:_fL("není co prodat","nothing to sell")};
    if(!d.n){ok=false;why=_fL("není co prodat","nothing to sell");}
    else if(marketClosedNow()){ok=false;why=_fL("trh je zavřený","the market is closed");}
  }
  if(o.special==="hold"){
    const f=_fFairAhead(o.fairWithin);
    if(f===null){ok=false;why=_fL("jarmark není do 3 měsíců","no fair within 3 months");}
    else extra={text:`${_fL("jarmark","fair")}: ${(G.lang==="cs"?MONTHS_CS:MONTHS_EN)[f]}`};
  }
  const rm=o.rewardMult||(o.risk&&o.risk.hit&&o.risk.hit.rewardMult);
  if(rm){const pv=fateElbePreview(rm);extra=extra||{text:`🏙️ ${pv.n}× · −${mny(pv.lost)}`};}
  return{id:o.id,label:_fL(o.cs,o.en),desc:_fL(o.dcs,o.den),cost,costParts:parts,risk,extra,ok,why};
}
function fatePendingView(){
  if(!fatePending())return null;
  const pd=G.fate.pending,k=FATE.kinds[pd.kind];if(!k)return null;
  return{kind:pd.kind,icon:k.icon,title:_fL(k.cs,k.en),desc:_fL(k.dcs,k.den),options:k.opts.map(o=>fateOptionView(o,pd)),season:pd.season,round:pd.round};
}

function fateChoose(id){
  if(!fatePending())return false;
  const pd=G.fate.pending,k=FATE.kinds[pd.kind],o=k&&k.opts.find(x=>x.id===id);
  if(!o)return false;
  const v=fateOptionView(o,pd);if(!v.ok)return false;
  const at=wxAbs(G.season,G.round),cs=G.lang==="cs",name=_fL(o.cs,o.en),notes=[];
  // 1. cena
  G.grose-=v.cost.zl;G.res.wood-=v.cost.wood;G.res.food-=v.cost.food;
  if(v.cost.zl)notes.push("−"+mny(v.cost.zl));
  if(v.cost.wood)notes.push("−"+v.cost.wood+" 🌳");
  if(v.cost.food)notes.push("−"+v.cost.food+" 🍞");
  // 2. okamžitá nálada, doznívající efekty
  if(o.morale){G.morale=clamp(G.morale+o.morale,0,100);notes.push(`😟 ${o.morale}`);}
  for(const[kk,val,months]of(o.fx||[]))G.fate.fx.push({k:kk,v:val,from:at,to:at+months-1});
  if(o.rewardMult){const e=fateElbeApply(o.rewardMult);notes.push(`🏙️ ${e.n}× −${mny(e.lost)}`);}
  // 3. zvláštní volby přesycení
  if(o.special==="dump"){
    const d=fateDumpTotal(o),prices=marketSalePrices();
    for(const type of Object.keys(prices))if(Array.isArray(G[type]))G[type]=[];
    G.grose+=d.total;econ2PieceAdd(d.total);G.totalSold=(G.totalSold||0)+d.n;
    notes.push(`+${mny(d.total)} (${d.n}×, ${Math.round(d.rate*100)} %)`);
  }
  if(o.special==="hold"){
    const f=_fFairAhead(o.fairWithin),goods=fateGoods().map((g,i)=>({...g,i}));
    const nb=Math.round(goods.length*o.breakPct);
    goods.sort((a,b)=>a.q-b.q||(a.type<b.type?-1:a.type>b.type?1:a.i-b.i));
    const drop={};for(const g of goods.slice(0,nb))(drop[g.type]=drop[g.type]||[]).push(g.q);
    for(const type of Object.keys(drop)){const a=[...G[type]];for(const q of drop[type]){const ix=a.indexOf(q);if(ix>=0)a.splice(ix,1);}G[type]=a;}
    G.fate.fx.push({k:"priceMult",v:o.priceMult,from:at,to:at+(f-G.round)-1});
    notes.push(cs?`${nb} ks se rozbilo`:`${nb} pcs broke`);
  }
  // 4. riziko: jedno hození na událost, stejné pro všechny volby
  let hit=null;
  if(o.risk){
    const p=_fRiskP(o);hit=p>0&&wxU(G.wSeed,4,pd.season,pd.round,0)<p;
    if(hit&&o.risk.hit){
      const h=o.risk.hit,hn=[];
      if(h.woodPct){const lost=Math.round(G.res.wood*h.woodPct/100);G.res.wood-=lost;hn.push(`−${lost} 🌳`);}
      if(h.zl){const lost=Math.min(G.grose,_fScale(h.zl)*KR);G.grose-=lost;hn.push("−"+mny(lost));}
      if(h.morale){G.morale=clamp(G.morale+h.morale,0,100);hn.push(`😟 ${h.morale}`);}
      if(h.rewardMult){const e=fateElbeApply(h.rewardMult);hn.push(`🏙️ ${e.n}× −${mny(e.lost)}`);}
      notes.push((pd.kind==="fire"?"🔥 ":"⚠️ ")+_fL("stalo se","it happened")+": "+hn.join(", "));
    }else if(p>0)notes.push(_fL("tentokrát to prošlo","you got away with it"));
  }
  G.fate.hist=[...(G.fate.hist||[]),{season:pd.season,round:pd.round,kind:pd.kind,opt:id,hit}].slice(-24);
  G.fate.pending=null;
  G.log.push(`__EVT__${k.icon} ${_fL(k.cs,k.en)}: ${name}${notes.length?" ("+notes.join(" · ")+")":""}`);
  if(pd.kind==="army")fateArmyRumour(pd);
  if(typeof autoSave==="function")autoSave();
  Fx.render();
  return true;
}

// Čištění savu: doznívající efekty {k,v,from,to}, čekající událost {kind,season,round}, historie
function fateSanitize(f){
  const out=fateInit();
  if(!f||typeof f!=="object"||Array.isArray(f))return out;
  const KEYS=["logMult","priceMult","fieldMult","fatigue","frostMorale","marketClosed"];
  if(Array.isArray(f.fx))out.fx=f.fx.filter(e=>e&&typeof e==="object"&&KEYS.includes(e.k)&&(typeof e.v==="number"&&isFinite(e.v)||e.v===true)&&Number.isSafeInteger(e.from)&&Number.isSafeInteger(e.to)&&e.to>=e.from).slice(0,40).map(e=>({k:e.k,v:e.v,from:e.from,to:e.to}));
  const p=f.pending;
  if(p&&typeof p==="object"&&typeof p.kind==="string"&&FATE.kinds[p.kind]&&Number.isSafeInteger(p.season)&&Number.isSafeInteger(p.round))out.pending={kind:p.kind,season:p.season,round:p.round};
  out.done=Number.isSafeInteger(f.done)&&f.done>0?f.done:0;
  out.plagueSeason=Number.isSafeInteger(f.plagueSeason)&&f.plagueSeason>0?f.plagueSeason:0;
  const pl=f.plague;
  if(pl&&typeof pl==="object"&&Number.isSafeInteger(pl.season)&&Number.isSafeInteger(pl.round)&&pl.round>=0&&pl.round<=11)out.plague={season:pl.season,round:pl.round,src:pl.src==="heat"?"heat":"army"};
  if(Array.isArray(f.hist))out.hist=f.hist.filter(e=>e&&typeof e==="object"&&typeof e.kind==="string"&&typeof e.opt==="string"&&Number.isSafeInteger(e.season)&&Number.isSafeInteger(e.round)).slice(-24).map(e=>({season:e.season,round:e.round,kind:e.kind,opt:e.opt,hit:e.hit===true?true:e.hit===false?false:null}));
  return out;
}
