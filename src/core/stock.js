// ── Stav zásob: JEDEN výpočet pro pills (značka), bublinu i panel „📦 Zásoby“ na Přehledu. ──
// Stejná pravidla jako Android view/PresentStock.kt (stockCalc, resourceInfoView, stockPanel). Jen zobrazení:
// nic tady nemění stav hry, nelosuje a nic neukládá. Pravidla jsou v data/resource-info.js (RESOURCE_INFO).
// Chybí-li RESOURCE_INFO nebo klíč v ní, funkce vrací null / "ok" a UI se vrátí ke starým tooltipům (žádný pád).
const STOCK_PANEL_KEYS=["forest","wood","sand","limestone","potash","water","clay","food","crucibles","formy"];
const STOCK_COLOR_KEYS=["jantar","zlut","modra","smaragd","lattimo","rubin"];

const _stkCs=()=>G.lang!=="en";
const _stkL=(c,e)=>_stkCs()?c:e;
const _stkInfo=key=>(typeof RESOURCE_INFO!=="undefined"&&RESOURCE_INFO[key])||null;
const _stkTxt=(o,k)=>(_stkCs()?o[k+"_cs"]:o[k+"_en"])||"";
const _stkMax=()=>G.forestMax||INIT_FOREST;

function _stkAmount(key){
  switch(key){
    case"forest":return G.forest||0;
    case"morale":return G.morale||0;
    case"crucibles":return G.pReady||0;
    case"additives":return Object.values(G.additives||{}).reduce((s,v)=>s+(v||0),0);
    case"colors":return STOCK_COLOR_KEYS.reduce((s,k)=>s+(Array.isArray(G[k])?G[k].length:0),0);
    default:return (G.res&&G.res[key])||0;
  }
}
function _stkNeed(info){
  const per=info.per;
  if(per===undefined||per===null)return null;
  if(per==="fuel")return fuelNeedPerRound(G.round,FURNACE_TYPES[G.furnace.type]);
  if(per==="food")return Math.ceil((G.workers||[]).length*0.5);
  return typeof per==="number"?per:null;
}

// → {key,amount,state:"ok"|"warn"|"crit",reach,need,info} nebo null (zdroj bez pravidel)
function stockCalc(key){
  const info=_stkInfo(key);
  if(!info)return null;
  const amount=_stkAmount(key), need=_stkNeed(info);
  const reach=(need!==null&&need>0)?Math.floor(amount/need):null;
  let state="ok";
  if(key==="crucibles"){
    const prep=isPrepMonth(G.round,G.seasonTier||0), aging=(G.pAging||[]).length;
    if(!prep&&amount<1)state="crit";
    else if(prep&&amount<2&&aging<2)state="warn";
  }else if(reach!==null&&info.warnReach!==undefined){
    if(reach<(info.critReach===undefined?1:info.critReach))state="crit";
    else if(reach<info.warnReach)state="warn";
  }else if(info.warnBelow!==undefined){
    if(info.critBelow!==undefined&&amount<info.critBelow)state="crit";
    else if(amount<info.warnBelow)state="warn";
  }
  return {key,amount,state,reach,need,info};
}
function stockStateOf(key){const c=stockCalc(key);return c?c.state:"ok";}   // function declaration: ui/fajrum-ui.js ho čte přes window

function _stkStateLabel(c){
  if(c.state==="ok")return _stkL("V pořádku","OK");
  if(c.state==="warn")return _stkL("⚠️ POZOR","⚠️ WARNING");
  if(c.amount<=0)return _stkL("❗ DOŠLO","❗ OUT");
  return c.reach!==null?_stkL("❗ NESTAČÍ","❗ SHORT"):_stkL("❗ KRITICKÉ","❗ CRITICAL");
}
// čeština: [1 (4. pád), 2–4, 5+]; angličtina: [jednotné, množné]
function _stkUnit(info,n){
  const f=_stkCs()?info.unit_cs:info.unit_en;
  if(!f)return"";
  return _stkCs()?(n===1?f[0]:n>=2&&n<=4?f[1]:f[2]):(n===1?f[0]:f[1]);
}
// „stačí na 3 várky“ / „nestačí na další várku“ / „došlo“; null u zdrojů bez spotřeby na jednotku
function _stkReachText(c){
  if(c.reach===null||!c.info.unit_cs)return null;
  if(c.reach<=0){
    if(c.amount<=0)return _stkL("došlo","none left");
    return _stkL("nestačí na další "+_stkUnit(c.info,1),"not enough for the next "+_stkUnit(c.info,1));
  }
  return _stkL("stačí na ","lasts ")+c.reach+" "+_stkUnit(c.info,c.reach);
}
function _stkValue(key){
  if(key==="forest")return _stkAmount("forest")+"/"+_stkMax();
  if(key==="morale")return _stkAmount("morale")+"%";
  return String(_stkAmount(key));
}
// rozpis pro přísady / barevné sklo (jako dřív v tooltipu pill)
function _stkBreakdown(key){
  if(key==="additives")return Object.entries(ADDITIVES).map(([k,ad])=>{const n=(G.additives||{})[k]||0;return n>0?ad.icon+n:"";}).filter(Boolean).join(" ");
  if(key==="colors"){
    const ic={jantar:"🟤",zlut:"🟨",modra:"🔵",smaragd:"🟢",lattimo:"⚪",rubin:"🔴"};
    return STOCK_COLOR_KEYS.map(k=>{const n=Array.isArray(G[k])?G[k].length:0;return n>0?ic[k]+n:"";}).filter(Boolean).join(" ");
  }
  return"";
}
// nabídka kupce Weisse: živý záznam v G.shop (zásoba + cena), jinak jen základní cena
function _stkMerchantLine(key){
  const base=typeof MERCH!=="undefined"?MERCH[key]:null;
  if(!base)return null;
  const live=G.shop&&G.shop[key];
  const price=mny(live?live.price:base.b);
  if(live&&live.stock<=0)return _stkL("🛒 Kupec Weiss: teď vyprodáno (cena "+price+")","🛒 Merchant Weiss: sold out right now (price "+price+")");
  if(live)return _stkL("🛒 Kupec Weiss: "+live.stock+" ks po "+price+" (Trh → Kupec Weiss)","🛒 Merchant Weiss: "+live.stock+" pcs at "+price+" (Market → Merchant Weiss)");
  return _stkL("🛒 Kupec Weiss: od "+price+" za kus","🛒 Merchant Weiss: from "+price+" each");
}

// Obsah bubliny. {key,icon,name,amount,state,stateLabel,reach,hint,source,usage,buy,detail,openTab,openSub,openLabel} nebo null
function resourceInfoView(key){
  const info=_stkInfo(key), c=stockCalc(key);
  if(!info||!c)return null;
  const hint=c.state==="ok"?"":_stkTxt(info,c.state==="crit"?"hint_crit":"hint_warn");
  let use=_stkTxt(info,"use");
  // skutečná čísla této hry (palivo závisí na peci a měsíci, jídlo na počtu dělníků)
  if(key==="wood"&&c.need!==null)use+=_stkL("\nPec teď potřebuje "+c.need+" 🪵 za kolo.","\nThe furnace now needs "+c.need+" 🪵 a round.");
  if(key==="forest"){const f2=forestRec(),y=f2.y||0,z=f2.z||0;if(y+z>0)use+=_stkL("\nV dorůstání: 🌿 "+y+" mlází · 🌱 "+z+" sazenic.","\nGrowing: 🌿 "+y+" saplings · 🌱 "+z+" seedlings.");}
  if(key==="food"&&c.need!==null)use+=_stkL("\nTeď: "+c.need+" za kolo.","\nNow: "+c.need+" a round.");
  const open=(info.open||"storage:raw").split(":");
  const openTab=open[0], openSub=open[1]||"";
  const openLabel=openTab==="accounts"?_stkL("🏭 Otevřít Huť","🏭 Open Foundry")
    :openTab==="forest"?_stkL("🌲 Otevřít Les","🌲 Open Forest")
    :_stkL("📦 Otevřít Sklad","📦 Open Storage");
  return {key,icon:info.icon||"",name:_stkTxt(info,"name"),amount:_stkValue(key),state:c.state,stateLabel:_stkStateLabel(c),
    reach:_stkReachText(c),hint,source:_stkTxt(info,"source"),usage:use,buy:_stkMerchantLine(key),detail:_stkBreakdown(key),
    openTab,openSub,openLabel};
}

// Panel „📦 Zásoby“: {title, alerts:[{key,state,text,hint}] (❗ první, pak POZOR), tiles:[{key,icon,name,value,reach,state,stateLabel,fill}]}
function stockPanelView(){
  const title=_stkL("📦 Zásoby","📦 Stock");
  if(typeof RESOURCE_INFO==="undefined")return{title,alerts:[],tiles:[]};
  const tiles=[], alerts=[];
  for(const key of STOCK_PANEL_KEYS){
    const c=stockCalc(key);
    if(!c)continue;
    const info=c.info, name=_stkTxt(info,"name"), icon=info.icon||"", reach=_stkReachText(c);
    let fill=null;
    if(key==="forest")fill=Math.max(0,Math.min(1,c.amount/Math.max(1,_stkMax())));
    else if(c.reach!==null&&info.warnReach!==undefined)fill=Math.max(0,Math.min(1,c.reach/(info.warnReach*2)));
    tiles.push({key,icon,name,value:_stkValue(key),reach,state:c.state,stateLabel:_stkStateLabel(c),fill});
    if(c.state!=="ok"){
      const hint=_stkTxt(info,c.state==="crit"?"hint_crit":"hint_warn");
      const detail=reach||(key==="forest"?_stkL("zbývá "+c.amount+" parcel",c.amount+" parcels left"):_stkValue(key));
      alerts.push({key,state:c.state,text:icon+" "+name+" — "+detail,hint});
    }
  }
  alerts.sort((a,b)=>(a.state==="crit"?0:1)-(b.state==="crit"?0:1));
  return{title,alerts,tiles};
}
