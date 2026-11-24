// ════════════════════════════════════════════════════════════
// ZAKÁZKY — sdílené pomocné funkce (Přehled · Trh · Huť)
// Jedno místo pro: limit slotů, přijetí, stav plnění, vykreslení karty.
// ════════════════════════════════════════════════════════════

// ── Etapa 1b-1: minimální kvalita kusů, nejnižší vyhovující kus, Fama podle odměny, druhá vlna nabídek ──
// Zakázka bez `minQ` (starý save) bere jakékoli kusy jako dřív; bez tabulky CONTRACT_RULES platí staré chování (3 nabídky, Fama +3).
function contractMinQ(c){return c&&c.minQ?c.minQ:0;}
// Kusy ve skladu, které zakázka uzná (hvězdy ≥ minQ).
function contractHave(inv,c){
  const m=contractMinQ(c);
  return m<=0?inv.length:inv.filter(q=>typeof q!=="number"||q>=m).length;
}
// Odevzdá qty kusů. Bez minQ jdou poslední kusy (jako dřív); s minQ nejnižší vyhovující, lepší zůstanou na prodej.
function contractTake(inv,c){
  const m=contractMinQ(c);
  if(m<=0){for(let j=0;j<c.qty;j++)inv.pop();return;}
  const idx=inv.map((q,i)=>i).filter(i=>typeof inv[i]!=="number"||inv[i]>=m)
    .sort((a,b)=>(typeof inv[a]==="number"?inv[a]:99)-(typeof inv[b]==="number"?inv[b]:99)).slice(0,c.qty);
  idx.sort((a,b)=>b-a).forEach(i=>inv.splice(i,1));
}
function contractOffers(){return typeof CONTRACT_RULES!=="undefined"?CONTRACT_RULES.offers:3;}
// Fama za splněnou tržní zakázku: famaBase + floor(reward / famaPer), max famaMax.
function contractFamaGain(c){
  if(typeof CONTRACT_RULES==="undefined"||!(CONTRACT_RULES.famaPer>0))return FAMA_CONTRACT_GAIN;
  const g=CONTRACT_RULES.famaBase+Math.floor(c.reward/CONTRACT_RULES.famaPer);
  return Math.min(g,CONTRACT_RULES.famaMax);
}
// Druhá vlna nabídek při zpracování kola wave2Round (po vyhodnocení aktivních zakázek). Losuje stejným způsobem jako freshContracts.
function contractWave(log,L){
  if(typeof CONTRACT_RULES==="undefined")return;
  const r=CONTRACT_RULES;
  if(!(r.wave2Offers>0)||G.round!==r.wave2Round)return;
  const taken=new Set([...(G.avail||[]),...(G.contracts||[])].map(x=>x.id));
  const pool=CONTRACT_POOL.filter(c=>!taken.has(c.id)&&c.due>=G.round+r.wave2MinLeft&&contractFeasible(c,G));
  if(!pool.length)return;
  const picked=[...pool].sort(()=>Math.random()-.5).slice(0,r.wave2Offers);
  G.avail=[...(G.avail||[]),...picked.map(c=>({...c}))];
  log.push(`__EVT__📜 ${L==="cs"?"Kupci přinesli další zakázky.":"Buyers brought new contracts."}`);
}

function canAcceptContract(){return (G.contracts||[]).length<MAX_CONTRACTS;}

// Jediné místo, kde se zakázka přijímá (Trh, Huť i modal nové sezóny)
function acceptContract(id){
  const c=(G.avail||[]).find(x=>x.id===id);
  if(!c||!canAcceptContract())return false;
  const L=G.lang;
  G.contracts.push({...c});
  G.avail=G.avail.filter(x=>x.id!==id);
  G.log.push(`__ECO__📜 ${L==="cs"?"Zakázka přijata: ":"Contract accepted: "}${L==="cs"?c.cs:c.en} (+${mny(c.reward)})`);
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
  return c.buyer==="Reichel"?"🧐":c.buyer==="Opat"?"⛪":c.buyer==="Slechtic"?"🏰":c.buyer==="Hoffmann"?"🏙️":"🛒";
}

// Řádky k dodání: jednoduchá zakázka = 1 řádek, endgame = komponenty
function contractLines(c){
  const L=G.lang;
  const src=(c.isEndgame&&c.components)?c.components:[{item:c.item,qty:c.qty}];
  return src.map(x=>{
    const have=contractHave(contractInv(x.item),c);
    const flavor=L==="cs"?x.cs:x.en;
    return {item:x.item,need:x.qty,have:have,done:have>=x.qty,minQ:contractMinQ(c),
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
  if(c.adv)return c.reward-c.adv.paid;   // záloha E2a: při dodání se vyplatí jen zbytek (pevná cena, bez Easy bonusu)
  if(kind==="market"&&G.difficulty==="easy")return c.reward+Math.round(inZl(c.reward)*0.25)*KR;
  return c.reward;
}

function contractFamaInfo(c,kind){
  if(kind==="endgame")return {cat:c.cat,gain:EG_FAMA_GAIN,loss:EG_FAMA_LOSS};
  if(kind==="rep")return {cat:c.cat,gain:REP_FAMA_GAIN,loss:REP_FAMA_LOSS};
  return {cat:BUYER_FAMA[c.buyer],gain:contractFamaGain(c),loss:FAMA_CONTRACT_EXPIRE};
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

