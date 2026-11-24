// ── měna: KR a inZl jsou v data/constants.js; tady formátování ──
// "2 zl 30 kr" (CS) / "2 fl 30 kr" (EN); celé zlatníky "2 zl", pod zlatník "30 kr", záporné se znaménkem "-"
function moneyStr(kr,cs){
  if(!Number.isFinite(kr))return"?";
  const neg=kr<0,a=Math.round(Math.abs(kr)),zl=Math.floor(a/100),k=a%100,u=cs?"zl":"fl";
  const body=(zl===0&&k===0)?"0 "+u:zl===0?k+" kr":k===0?zl+" "+u:zl+" "+u+" "+k+" kr";
  return neg?"-"+body:body;
}
function mny(kr){return moneyStr(kr,(G&&G.lang)!=="en");}   // peníze v jazyce hry (log, toasty, texty)

function baseWageRateFor(isP,isEasy){return isP?(isEasy?100:150):(isEasy?150:200);}
function workerWageFor(w,rate,task){
  const work=Math.max(KR,Math.round(inZl(rate+(w.wageMod||0)))*KR);
  return (task||w.task)==="idle"?Math.max(KR,Math.ceil(inZl(work)*IDLE_WAGE_FACTOR)*KR):work;
}

// Palivo: spotřeba dřeva za kolo (kampaň) a součet za celou kampaň — sdílí processRound i hinty v UI
function fuelNeedPerRound(round,ft){return Math.ceil(FUEL_BASE*ft.fuelMult)+(round>=6?2:0);}
function campaignFuelTotal(tier,ft){let t=0;for(let r=0;r<ROUNDS;r++)if(isCampaignMonth(r,tier))t+=fuelNeedPerRound(r,ft);return t;}

function isPrepMonth(round, tier=0){
  if(tier>=3) return false;
  if(tier===2) return round>=1 && round<=3; // Prosinec, Leden, Únor
  if(tier===1) return round>=1 && round<=4; // Prosinec, Leden, Únor, Březen
  return round>=0 && round<=4; // Listopad..Březen
}
function isCampaignMonth(round, tier=0){
  return !isPrepMonth(round, tier);
}
function isTemperingMonth(round, tier=0){
  if(tier>=3) return false;
  if(tier===2) return round===3; // Únor temperování
  return round===4; // Březen temperování
}
function getLightingMonth(tier=0){
  if(tier>=3) return null;
  if(tier===2) return 4; // Březen rozžehnutí
  return 5; // Duben rozžehnutí
}
function merchName(k,L){const i=MERCH_INFO[k];return i?(L==="cs"?i.cs:i.en):k;}
function merchDesc(k,L){const i=MERCH_INFO[k];return i?(L==="cs"?i.d_cs:i.d_en):"";}

// Nákup parcel lesa — max 60, cena roste s počtem
function buyParcely(n){
  const cur=G.forest;
  const max=200;
  if(cur>=max){G.log.push(`__EVT__🌲 ${G.lang==="cs"?"Hvozd je na maximu (200 parcel)":"Forest at maximum (200 parcels)"}`);Fx.render();return;}
  const buy=Math.min(n,max-cur);
  const price=buy*800; // 8 zl/parcela
  if(G.grose<price){G.log.push(`__EVT__❌ ${G.lang==="cs"?"Nedostatek peněz":"Not enough money"}`);Fx.render();return;}
  G.grose-=price;
  G.forest+=buy;
  G.forestMax=(G.forestMax||INIT_FOREST)+buy; // koupené parcely navyšují strop
  G.log.push(`__ECO__🌲 ${G.lang==="cs"?"Zakoupeno":"Bought"} ${buy} ${G.lang==="cs"?"parcel lesa":"forest parcels"} (-${mny(price)})`);
  Fx.render();
}
