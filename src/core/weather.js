// weather.js — W1 počasí nové ekonomiky (Android W1). Druh měsíce je čistá funkce (wSeed, sezóna, měsíc): nic se neukládá, hlavní RNG (Math.random) se nedotýká.
// Vlastní proud: hash (wSeed, sůl, a, b, c) → mulberry32 → první číslo. Sůl odlišuje počasí od osudových událostí (W2) a jejich hodů.
// Klasická ekonomika (G._econ!==2): druh vždy "normal"; logMult/crucible přebírá z pevných zimních tabulek (WINTER_LOG_MULT, WINTER_PANEV_BONUS).

const WX_ICON={frost:"❄️",wet:"🌧️",dry:"☀️",storm:"⛈️",normal:"🌤️"};
const WX_NAME={
  frost:{cs:"Mráz",en:"Frost"},wet:{cs:"Mokro",en:"Wet spell"},dry:{cs:"Sucho",en:"Drought"},storm:{cs:"Bouře",en:"Storm"},
  normal:{cs:"Běžný měsíc",en:"Ordinary month"}};

function _wxMix(seed,salt,a,b,c){
  let h=Math.imul((seed|0)^0x9e3779b9,0x85ebca6b);
  for(const v of [salt,a,b,c]){
    h=Math.imul(h^(((v|0)+0x7f4a7c15)|0),0xc2b2ae35);
    h^=h>>>13;h=Math.imul(h,0x85ebca6b);h^=h>>>16;
  }
  return h>>>0;
}
// Jedno rovnoměrné číslo [0,1) pro (seed, sůl, a, b, c) — mulberry32 inicializovaný hashem
function wxU(seed,salt,a,b,c){
  let t=(_wxMix(seed,salt,a|0,b|0,c|0)+0x6D2B79F5)|0;
  t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return((t^(t>>>14))>>>0)/4294967296;
}

// Druh počasí pro daný seed (čistá funkce, využívají ji i testy)
function weatherKindFor(seed,season,round){
  const W=ECON2.weather,u=wxU(seed,1,season,round,0);
  let acc=0;
  for(const k of W.order){
    const d=W.kinds[k];
    if(round>=d.from&&round<=d.to){acc+=d.p;if(u<acc)return k;}
  }
  return"normal";
}
// Pravděpodobnosti pro měsíc: [{kind,p}] včetně "normal" (zbytek) — tabulka rizik příštího měsíce
function weatherRisk(round){
  if(typeof ECON2==="undefined")return[{kind:"normal",p:1}];
  const W=ECON2.weather,out=[];let sum=0;
  for(const k of W.order){const d=W.kinds[k];if(round>=d.from&&round<=d.to){out.push({kind:k,p:d.p});sum+=d.p;}}
  out.push({kind:"normal",p:Math.max(0,1-sum)});
  return out;
}
function weatherKind(season,round){
  if(!econ2()||!Number.isFinite(G.wSeed))return"normal";
  return weatherKindFor(G.wSeed,season===undefined?G.season:season,round===undefined?G.round:round);
}

// Souhrn vlivů měsíce: počasí + doznívající následky osudových událostí (G.fate.fx = [{k,v,from,to}], from/to jsou absolutní měsíce sezóna*12+kolo, včetně)
// Klíče: logMult/priceMult/fieldMult (násobí se), fatigue (sčítá se), frostMorale (přepis), marketClosed (stačí jeden).
function wxAbs(season,round){return season*12+round;}
function wxFx(season,round){
  season=season===undefined?G.season:season;round=round===undefined?G.round:round;
  const out={kind:"normal",logMult:WINTER_LOG_MULT[round]||1,crucible:WINTER_PANEV_BONUS[round]||0,priceMult:1,fieldMult:1,fatigue:0,wood:0,morale:0,marketClosed:false};
  if(!econ2())return out;
  const d=ECON2.weather.fx,kind=weatherKind(season,round),f=d[kind]||{};
  out.kind=kind;
  out.logMult=f.logMult||1;out.crucible=f.crucible||0;out.priceMult=f.priceMult||1;out.fieldMult=f.fieldMult||1;
  out.fatigue=f.fatigue||0;out.wood=f.wood||0;out.morale=f.morale||0;
  const fx=G.fate&&Array.isArray(G.fate.fx)?G.fate.fx:[],at=wxAbs(season,round);
  for(const e of fx){
    if(!e||at<e.from||at>e.to)continue;
    if(e.k==="logMult"||e.k==="priceMult"||e.k==="fieldMult")out[e.k]*=e.v;
    else if(e.k==="fatigue")out.fatigue+=e.v;
    else if(e.k==="frostMorale"){if(kind==="frost")out.morale=e.v;}
    else if(e.k==="marketClosed"&&e.v)out.marketClosed=true;
  }
  return out;
}
function weatherLabel(kind){const n=WX_NAME[kind]||WX_NAME.normal;return WX_ICON[kind]+" "+(G.lang==="cs"?n.cs:n.en);}

// Řádky vlivů pro UI a log: [{icon,text}] (jen to, co se v měsíci skutečně mění)
function wxEffectLines(fx){
  const cs=G.lang==="cs",pc=m=>(m>1?"+":"−")+Math.round(Math.abs(m-1)*100)+" %",out=[];
  if(fx.kind==="frost")out.push(
    {icon:"🌲",text:(cs?"kácení ":"logging ")+pc(fx.logMult)},
    {icon:"🏺",text:cs?"nové pánve +1★ (mráz čistí jíl)":"new crucibles +1★ (frost clears clay)"},
    {icon:"🌳",text:(cs?"topení: −":"heating: −")+fx.wood+" "+(cs?"dříví":"wood")},
    {icon:"😟",text:(cs?"nálada −":"morale −")+fx.morale});
  else{
    if(fx.logMult!==1&&fx.kind!=="normal")out.push({icon:"🌲",text:(cs?"kácení ":"logging ")+pc(fx.logMult)});
    if(fx.fieldMult!==1)out.push({icon:"🌾",text:(cs?"políčko ":"field ")+pc(fx.fieldMult)});
    if(fx.fatigue>0)out.push({icon:"😓",text:(cs?"únava +":"fatigue +")+Math.round(fx.fatigue*100)+" %"});
    if(fx.priceMult!==1)out.push({icon:"💰",text:(cs?"prodejní ceny ":"sale prices ")+pc(fx.priceMult)});
  }
  return out;
}

// Trh zavřený: kalendář (MARKET_CLOSED) nebo mor (fx marketClosed z osudové události W3). Platí pro prodej, rychlý výkup i jarmark.
function marketClosedNow(round){
  round=round===undefined?G.round:round;
  return !!MARKET_CLOSED[round]||(!!econ2()&&wxFx(G.season,round).marketClosed);
}
function marketPlagueClosed(round){round=round===undefined?G.round:round;return!MARKET_CLOSED[round]&&marketClosedNow(round);}
function marketClosedText(round){
  round=round===undefined?G.round:round;
  if(marketPlagueClosed(round))return G.lang==="cs"?"🦠 Mor v kraji — vrchnost zavřela trhy a zakázala cestování. Prodávat nelze.":"🦠 Plague in the region — the authorities closed the markets and banned travel. No selling.";
  const md=MONTH_DATA[round]||MONTH_DATA[0];return G.lang==="cs"?md.trh_cs:md.trh_en;
}
