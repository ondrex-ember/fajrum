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

// Nákup parcel lesa: viz core/forest.js (buyParcely)
