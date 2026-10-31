// ════════════════════════════════════════════════════════════
// ZAKÁZKY — sdílené pomocné funkce (Přehled · Trh · Huť)
// Jedno místo pro: limit slotů, přijetí, stav plnění, vykreslení karty.
// ════════════════════════════════════════════════════════════

function canAcceptContract(){return (G.contracts||[]).length<MAX_CONTRACTS;}

// Jediné místo, kde se zakázka přijímá (Trh, Huť i modal nové sezóny)
function acceptContract(id){
  const c=(G.avail||[]).find(x=>x.id===id);
  if(!c||!canAcceptContract())return false;
  const L=G.lang;
  G.contracts.push({...c});
  G.avail=G.avail.filter(x=>x.id!==id);
  G.log.push(`__ECO__📜 ${L==="cs"?"Zakázka přijata: ":"Contract accepted: "}${L==="cs"?c.cs:c.en} (+${c.reward}g)`);
  Fx.render();
  return true;
}

function contractUrgent(remaining){return remaining<=1;}
function czMonthsWord(n){return n===1?"měsíc":(n>=2&&n<=4?"měsíce":"měsíců");}
function contractLowerFirst(s){return s?s.charAt(0).toLowerCase()+s.slice(1):s;}

// Lidský název položky zakázky (waldglas, crystal, barvy, foukané, broušené, rytiny)
function contractItemName(key,L){
  const lc=L==="cs"?"cs":"en";
  if(key==="waldglas")return L==="cs"?"lesní sklo":"forest glass";
  if(key==="crystal")return L==="cs"?"křišťál":"crystal";
  if(CONTRACT_COLOR_NAMES[key])return CONTRACT_COLOR_NAMES[key][lc];
  if(BLOWN_ITEMS[key])return contractLowerFirst(BLOWN_ITEMS[key][lc]);
  if(GROUND_ITEMS[key])return contractLowerFirst(GROUND_ITEMS[key][lc]);
  if(key.indexOf("rytina_")===0)return (L==="cs"?"rytý výrobek — ":"engraved — ")+contractItemName(key.slice(7),L);
  const us=key.lastIndexOf("_");
  if(us>0&&CONTRACT_COLOR_NAMES[key.slice(us+1)]&&BLOWN_ITEMS[key.slice(0,us)]){
    return contractLowerFirst(BLOWN_ITEMS[key.slice(0,us)][lc])+" ("+CONTRACT_COLOR_NAMES[key.slice(us+1)][lc]+")";
  }
  return key;
}

// Sklad pro danou položku (stejné pravidlo jako processRound)
function contractInv(item){
  if(item==="crystal")return G.crystal||[];
  if(item==="waldglas")return G.waldglas||[];
  return Array.isArray(G[item])?G[item]:[];
}

function contractIcon(c){
  if(c.cat&&FAMA_ICON[c.cat])return FAMA_ICON[c.cat];
  return c.buyer==="Opat"?"⛪":c.buyer==="Slechtic"?"🏰":c.buyer==="Hoffmann"?"🏙️":"🛒";
}

// Řádky k dodání: jednoduchá zakázka = 1 řádek, endgame = komponenty
function contractLines(c){
  const L=G.lang;
  const src=(c.isEndgame&&c.components)?c.components:[{item:c.item,qty:c.qty}];
  return src.map(x=>{
    const have=contractInv(x.item).length;
    const flavor=L==="cs"?x.cs:x.en;
    return {item:x.item,need:x.qty,have:have,done:have>=x.qty,
      label:flavor||(x.qty+"× "+contractItemName(x.item,L))};
  });
}

// Dá se do termínu ještě něco uvařit? (příprava = pec nehoří, viz isPrepMonth)
function contractCanProduce(c){
  if(c.due>=ROUNDS)return true;
  const tier=G.seasonTier||0;
  for(let r=Math.max(0,G.round);r<=c.due;r++){
    if(isCampaignMonth(r,tier))return true;
  }
  return false;
}

function contractStatus(c){
  const lines=contractLines(c);
  const ready=lines.every(x=>x.done);
  const remaining=c.due-G.round;
  const missing=lines.reduce((s,x)=>s+Math.max(0,x.need-x.have),0);
  let state;
  if(ready)state="ready";
  else if(!contractCanProduce(c))state="blocked";
  else if(remaining<=0)state="last";
  else state="work";
  return {lines:lines,ready:ready,remaining:remaining,missing:missing,state:state};
}

function contractReward(c,kind){
  if(kind==="market"&&G.difficulty==="easy")return c.reward+Math.round(c.reward*0.25);
  return c.reward;
}

function contractFamaInfo(c,kind){
  if(kind==="endgame")return {cat:c.cat,gain:EG_FAMA_GAIN,loss:EG_FAMA_LOSS};
  if(kind==="rep")return {cat:c.cat,gain:REP_FAMA_GAIN,loss:REP_FAMA_LOSS};
  return {cat:BUYER_FAMA[c.buyer],gain:FAMA_CONTRACT_GAIN,loss:FAMA_CONTRACT_EXPIRE};
}

function contractDueText(due){
  const cs=G.lang==="cs";
  if(due>=ROUNDS)return "";
  return cs?"do konce "+MONTHS_GEN_CS[due]:"by end of "+MONTHS_EN[due];
}

function contractDeadlineText(c,remaining){
  const cs=G.lang==="cs";
  const when=contractDueText(c.due);
  let left;
  if(remaining<=0)left=cs?"poslední měsíc":"last month";
  else if(cs)left="zbývá "+remaining+" "+czMonthsWord(remaining);
  else left=remaining+(remaining===1?" month left":" months left");
  return when?when+" · "+left:left;
}

// Kde se položka vyrábí (názvy záložek)
function contractWhere(lines,L){
  const isFurn=x=>x.item==="waldglas"||x.item==="crystal"||!!CONTRACT_COLOR_NAMES[x.item];
  const open=lines.filter(x=>!x.done);
  const furn=open.some(isFurn), prod=open.some(x=>!isFurn(x));
  if(furn&&prod)return L==="cs"?"záložky Pec a Výroba":"Furnace and Production tabs";
  if(furn)return L==="cs"?"záložka Pec":"Furnace tab";
  return L==="cs"?"záložka Výroba":"Production tab";
}

