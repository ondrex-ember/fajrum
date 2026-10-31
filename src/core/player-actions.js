function startGame(diff){
  const name=G.huteName;
  G=initState();
  G.huteName=name;
  G.difficulty=diff;
  G.firstVisit=true;
  if(diff==="easy"){
    G.furnace.runIn=45;
    G.panevQuality=3;
    G.pReady=4;
    G.formy=2;
    G.grose=140;
    G.debt=30;
    G.morale=75;
    G.res.wood=70;
    G.res.sand=35;
    G.res.limestone=25;
    G.res.potash=14;
    G.res.water=25;
    G.res.clay=15;
    G.res.shamot=14;
    G.res.food=20;
  }else{
    G.grose=65;
    G.debt=40;
    G.morale=65;
    G.res.wood=50;
    G.res.sand=20;
    G.res.limestone=15;
    G.res.potash=8;
    G.res.water=15;
    G.res.clay=10;
    G.res.shamot=10;
    G.res.food=12;
  }
  G.phase="playing";
  Fx.render();
}
// fall screen / game-over banner "found a new glasshouse": keeps name + difficulty, does NOT apply the difficulty preset (as in the web UI)
function restartAfterFall(){
  const hName=G.huteName;
  const diff=G.difficulty||"normal";
  G=initState();
  G.huteName=hName;
  G.difficulty=diff;
  G.phase="playing";
  Fx.render();
}
// settings "Reset" (the confirm() dialog stays in the UI)
function resetToIntro(){
  const name=G.huteName;
  Fx.musicEnabled(false);
  G=initState();G.huteName=name;G.phase="intro";Fx.render();
}

// ── month summary → next month ──
function continueFromSummary(){
  G.phase="playing"; G.summary=null;
  // Loajalitní modal — pokud existují dělníci s dluhem po zavření summary
  const debtedWorkers=G.workers.filter(w=>(w.unpaidDebt||0)>0);
  if(debtedWorkers.length>0) G._loyaltyModalPending=true;
  Fx.render();
}
function dismissCrackLoss(){G._crackLoss=null;dismissEvt();}

// ── beer / tasks / furnace slots / colour recipes ──
function setBeerLevel(i){G.beer=i;Fx.render();}

// task rules of the Workers card: which tasks the worker is offered and which are disabled
function workerTaskOptions(w){
  const isP=G.round<PREP, isC=G.round>=PREP;
  const tasks=isP?TASKS_PREP:TASKS_CAMP;
  const primaryTaskKeys=ROLE_PRIMARY_TASKS[w.prof]||[];
  const primaryAvailable=primaryTaskKeys.filter(t=>{
    if(t==="panev")return isP;
    if(t==="idle")return true;
    return tasks.includes(t);
  });
  const primarySet=new Set(primaryAvailable);
  const isWerkstatProf=WERKSTAT_PROFS.includes(w.prof);
  const primary=primaryAvailable.map(t=>({t,disabled:t==="idle"&&(w.fat||0)<0.25}));
  const werkstat=isWerkstatProf?{t:"werkstat",disabled:(w.fat||0)>=(w.prof==="tavic"?0.5:0.75)}:null;
  const others=[];
  tasks.forEach(t=>{
    if(t==="idle")return;
    if(t==="werkstat")return;
    if(primarySet.has(t))return;
    others.push(t);
  });
  const panevGhost=isC&&!isP&&!primarySet.has("panev");
  const idleExtra=primarySet.has("idle")?null:{t:"idle",disabled:(w.fat||0)<0.25};
  return {primary,werkstat,others,panevGhost,idleExtra};
}
function setWorkerTask(workerId,t){
  const L=G.lang, isP=G.round<PREP;
  const w=G.workers.find(x=>x.id===workerId);
  const wasIdle=w.task==="idle";
  w.task=t;
  if(t==="idle"&&!wasIdle){
    // Upozornění: odpočívající dělník nic nevyrábí, ale dostává mzdu
    const rate=baseWageRateFor(isP,G.difficulty==="easy");
    const wIdle=workerWageFor(w,rate,"idle"), wWork=workerWageFor(w,rate,"work");
    Fx.toast("😴 "+w.name,L==="cs"
      ?["Odpočívá — nic nevyrábí.","Mzda "+wIdle+"g/kolo (při práci "+wWork+"g), únava −50 %."]
      :["Resting — produces nothing.","Wage "+wIdle+"g/round (working: "+wWork+"g), fatigue −50%."]);
  }
  Fx.render();
}

// furnace slots (crucibles): number of slots follows the furnace type; the config is (re)created when it does not fit
function furnaceSlotCount(){return (FURNACE_TYPES[G.furnace.type].maxSlots)||1;}
function ensureFurnSlotConfig(){
  const n=furnaceSlotCount();
  if(!G.furnSlotConfig||G.furnSlotConfig.length!==n){
    G.furnSlotConfig=Array(n).fill("waldglas");
  }
  if(!G.furnAtm||G.furnAtm.length!==n){
    G.furnAtm=Array(n).fill("ox");
  }
  return n;
}
// atmosféra pánve: "ox" oxidační (čisté sklo) | "red" redukční (kouřivý žár: jantar, ale zakouřené čiré sklo, +1 dřevo)
function setFurnAtm(sj,atm){
  if(atm!=="ox"&&atm!=="red")return;
  ensureFurnSlotConfig();
  if(sj<0||sj>=G.furnAtm.length)return;
  G.furnAtm[sj]=atm;autoSave();Fx.render();
}
function canUseCrystalSlot(){return G.workers.some(w=>w.prof==="foukat_kristal"||w.prof==="tavic");}
function setFurnSlotType(sj,type){
  if(type==="crystal"&&!canUseCrystalSlot())return;   // UI gate
  if(!G.furnSlotConfig)G.furnSlotConfig=Array(furnaceSlotCount()).fill("waldglas");
  G.furnSlotConfig[sj]=type;autoSave();Fx.render();
}
function clearColorRecipe(){G._nextColorRecipe=null;if(!G.activeBatches?.length){G._activeColorRecipe=null;}Fx.render();}
function toggleColorRecipe(key){
  if(COLOR_RECIPES[key]&&COLOR_RECIPES[key].mufle)return;   // lazura se vypaluje v mufli, nebarví sklovinu v pánvi
  const active=G._nextColorRecipe===key||(G._activeColorRecipe===key&&!G._nextColorRecipe);
  const isBusy=!!(G.activeBatches?.length>0);
  G._nextColorRecipe=active?null:key;if(!isBusy){G._activeColorRecipe=G._nextColorRecipe;}Fx.render();
}
// ruby "strike": the player reveals the result of the strike queued by craftColorGlass("rubin")
function resolveRubyStrike(){
  const L=G.lang, sq=G._strikeQueue;
  if(!sq)return;
  const success=Math.random()<sq.chance;
  const archKey="arch_rubin";
  if(success){
    G.rubin.push(sq.q);
    if(!G.unlockedRecipes.includes(archKey)){
      G.unlockedRecipes.push(archKey);
      G.log.push(`__EVT__📚 „${L==="cs"?"Donec fiat vitrum pellucidum — zlatý rubín":"Donec fiat vitrum pellucidum — golden ruby"}"`);
    }
    G.log.push(`__PROD__🔴 ${L==="cs"?"Zlatý rubín (Kunckel)":"Gold Ruby (Kunckel)"} ${["★","★★","★★★","★★★★","★★★★★"][sq.q-1]}`);
    G.log.push(`__EVT__🔴 ${L==="cs"?"Strike! Rubínová barva se projevila. Kunckelova metoda funguje!":"Strike! The ruby colour has struck. Kunckel's method works!"}`);
    G.morale=Math.min(100,(G.morale||70)+8);
  } else {
    // Selhání — sklo zůstalo čiré: polotovar jde zahřát znovu (o ★ horší); ze slabého zbyde jen znehodnocený křišťál
    if(sq.q>1){if(!G.rubin_raw)G.rubin_raw=[];G.rubin_raw.push(sq.q-1);}
    else G.crystal.push(1);
    G.log.push(`__EVT__⚪ ${L==="cs"?"Náběh selhal — sklo zůstalo čiré. Zlatý koloid se nevytvořil. Výrobní tajemství Kunckela odolalo.":"Strike failed — glass stayed clear. Gold colloid did not form. Kunckel's secret held."}${sq.q>1?(L==="cs"?" Polotovar lze zahřát znovu (−1★).":" The blank can be reheated (−1★)."):(L==="cs"?" Zbyl jen znehodnocený křišťál.":" Only a degraded crystal remains.")}`);
    G.morale=Math.min(100,(G.morale||70)-3);
  }
  G._strikeQueue=null;
  Fx.render();
}

// ── money: loans, debt, moratorium, emergency wood, quick sell ──
// NOTE: the web UI has two different loan rate tables — Market tab (depends on difficulty) and Accounts tab (does not). Kept as is.
function loanRateMarket(){
  const dr=G.debtReputation||0;
  const isEasyLoan=G.difficulty==="easy";
  return isEasyLoan?(dr>=75?0.05:dr>=50?0.08:dr>=25?0.12:0.15):(dr>=75?0.08:dr>=50?0.12:dr>=25?0.16:0.20);
}
function loanRateAccounts(){
  const drH=G.debtReputation||0;
  return drH>=75?0.10:drH>=50?0.15:drH>=25?0.20:0.25;
}
function takeLoan(amt,loanRate){
  const L=G.lang;
  const totalDebt=amt+Math.round(amt*loanRate);
  const loanRatePct=Math.round(loanRate*100);
  G.grose+=amt; G.debt+=totalDebt;
  G.log.push("__ECO__🪙 "+(L==="cs"?"Půjčka od Faktora Weisse":"Loan from Factor Weiss")+": +"+amt+"g ("+(L==="cs"?"dluh":"debt")+" +"+totalDebt+"g, "+loanRatePct+"%)");
  Fx.render();
}
function moratoriumCost(){return (G.debtReputation||0)>=50?0:3;}
function negotiateMoratorium(){
  const L=G.lang, moraCost=moratoriumCost();
  if(G.grose>=moraCost&&moraCost>0){ G.grose-=moraCost; }
  else if(moraCost>0){ G.debt+=4; }
  G.debtMoratorium=2;
  G.log.push(`__ECO__⏳ ${L==="cs"?"Sjednán odklad splátek na 2 kola u Faktora Weisse.":"Negotiated 2-round debt moratorium with Factor Weiss."}`);
  Fx.render();
}
function clearAllDebt(){
  const L=G.lang;
  if(!(G.debt>0&&G.grose>=G.debt))return;   // UI gate
  const pay=G.debt;
  G.grose-=pay; G.debt=0;
  G.totalDebtPaid=(G.totalDebtPaid||0)+pay;
  G.debtReputation=Math.min(100,Math.floor((G.totalDebtPaid||0)/3));
  G.log.push("__ECO__📜 "+(L==="cs"?"Dluh splacen":"Debt cleared"));
  Fx.render();
}
function repayDebt(amt){
  const L=G.lang;
  if(!(G.debt>0&&amt>0&&G.grose>=amt))return;   // UI gate
  const pay=Math.min(amt,G.debt);
  G.grose-=pay; G.debt=Math.max(0,G.debt-pay);
  G.totalDebtPaid=(G.totalDebtPaid||0)+pay;
  G.debtReputation=Math.min(100,Math.floor((G.totalDebtPaid||0)/3));
  G.log.push("__ECO__📜 "+(L==="cs"?"Splácení dluhu":"Debt payment")+": -"+pay+"g");
  Fx.render();
}
function emergencyWoodPrice(){return WOOD_EMERGENCY_PRICE*5;}
function buyEmergencyWood(){
  const L=G.lang, woodPrice=emergencyWoodPrice();
  if(G.grose<woodPrice)return;   // UI gate
  G.grose-=woodPrice;G.res.wood+=5;G.log.push(`__ECO__🌳 +5 ${L==="cs"?"nouzové dřevo":"emergency wood"} (-${woodPrice}g)`);Fx.render();
}
// "Rychlý výkup": merchant Weiss buys all waldglas / crystal / blown stock once per season
function quickSellQuote(){
  const basePricesQS={waldglas:3.5,crystal:9};
  Object.entries(BLOWN_ITEMS).forEach(([k,v])=>{basePricesQS[k]=v.base;});
  const qsRate=G.difficulty==="easy"?0.90:0.85;
  const qsRatePct=Math.round(qsRate*100);
  let qsTotal=0, qsCount=0;
  ["waldglas","crystal",...BLOWN_TYPES].forEach(k=>{
    const inv=G[k]||[];
    if(!Array.isArray(inv)) return;
    const bp=basePricesQS[k]||3.5;
    inv.forEach(q=>{qsTotal+=Math.max(1, Math.round(q*bp*qsRate));qsCount++;});
  });
  return {rate:qsRate,ratePct:qsRatePct,total:qsTotal,count:qsCount,basePrices:basePricesQS};
}
function quickSellAll(){
  const L=G.lang;
  if(G.quickSellUsed)return;   // UI gate
  const {rate:qsRate,ratePct:qsRatePct,count:qsCount,basePrices:basePricesQS}=quickSellQuote();
  if(qsCount===0) return;
  let earned=0;
  ["waldglas","crystal",...BLOWN_TYPES].forEach(k=>{
    const inv=G[k]||[];
    if(!Array.isArray(inv)||!inv.length) return;
    const bp=basePricesQS[k]||3.5;
    const gain=inv.reduce((s,q)=>s+Math.max(1, Math.round(q*bp*qsRate)),0);
    earned+=gain;
    G[k]=[];
  });
  G.grose+=earned;
  G.quickSellUsed=true;
  G.log.push(`__ECO__🐴 ${L==="cs"?"Kramář Weiss vykoupil sklad":"Merchant Weiss bought out stock"}: +${earned}g (${qsRatePct}%)`);
  Fx.render();
}

// ── workers: debts, loyalty modals, retention, market hire ──
// Rozpočítání schodku mezd na celé groše (metoda největšího zbytku): podíl_i = floor(w_i*D/W), zbylé groše dostanou
// největší zbytky (při shodě nižší index). Σ == D přesně, každý podíl ≤ w_i. Čistě celočíselné, deterministické.
function allocateShortfalls(wageList,deficit){
  const n=wageList.length,total=wageList.reduce((s,x)=>s+x,0),D=Math.max(0,Math.min(total,Math.round(deficit)));
  const out=new Array(n).fill(0);
  if(!(D>0)||!(total>0))return out;
  const rem=[];let given=0;
  for(let i=0;i<n;i++){const num=wageList[i]*D;out[i]=Math.floor(num/total);given+=out[i];rem.push({i,r:num-out[i]*total});}
  rem.sort((a,b)=>b.r-a.r||a.i-b.i);
  for(let k=0;k<D-given;k++)out[rem[k].i]++;
  return out;
}
function claimsTotal(p){return(p.exCrewClaims||[]).reduce((s,c)=>s+(c.amount||0),0);}   // pohledávky bývalých zaměstnanců
function totalWorkerDebt(){return G.workers.filter(w=>(w.unpaidDebt||0)>0).reduce((s,w)=>s+(w.unpaidDebt||0),0)+claimsTotal(G);}
// Dvě oddělené entity dluhu: Weiss (G.debt, úvěr + úrok, auto-splátka) a parta (součet w.unpaidDebt = nevyplacené mzdy).
function liabilities(p){const weiss=p.debt||0,crewNow=(p.workers||[]).reduce((s,w)=>s+(w.unpaidDebt||0),0),claims=claimsTotal(p),crew=crewNow+claims;return{weiss,crew,crewNow,claims,total:weiss+crew};}
// month summary: "Clear worker debts"
function payWorkerDebtsSummary(){
  const L=G.lang, totalUnpaid=totalWorkerDebt();
  if(!(totalUnpaid>0&&G.grose>=totalUnpaid))return;   // UI gate
  G.workers.forEach(w=>{if(w.unpaidDebt>0){G.grose-=w.unpaidDebt;w.unpaidDebt=0;}});
  G.grose-=claimsTotal(G);G.exCrewClaims=[];   // pohledávky bývalých dělníků se splácejí spolu s ostatními
  G.log.push("__ECO__💸 "+(L==="cs"?"Dluhy dělníkům splaceny: -"+totalUnpaid+"g":"Worker debts cleared: -"+totalUnpaid+"g"));
  Fx.render();
}
// loyalty modal (after the summary, workers with unpaid wages)
function loyaltyModalPayAll(){
  const L=G.lang;
  const owedNow=liabilities(G).crewNow;   // modal se týká jen dělníků, kteří v huti zůstali; pohledávky bývalých se platí zvlášť
  if(!(owedNow>0&&G.grose>=owedNow))return;   // UI gate
  G.workers.forEach(w=>{if(w.unpaidDebt>0){G.grose-=w.unpaidDebt;w.unpaidDebt=0;w.loyalty=Math.min(100,w.loyalty+15);}});
  G.log.push("__ECO__💚 "+(L==="cs"?"Dluhy splaceny — dělníci zůstávají (+loajalita)":"Debts paid — workers staying (+loyalty)"));
  G._loyaltyModalPending=false;
  Fx.render();
}
function loyaltyModalPromise(){
  const L=G.lang;
  // Slíbit — loajalita mírně roste ale dluh zůstává
  G.workers.forEach(w=>{if(w.unpaidDebt>0){w.loyalty=Math.min(100,w.loyalty+5);w.promisedDebt=true;}});
  G.log.push("__EVT__🤝 "+(L==="cs"?"Hutmistr slíbil doplatit — dělníci váhají":"Foundry master promised payment — workers hesitate"));
  G._loyaltyModalPending=false;
  Fx.render();
}
function loyaltyModalDismiss(){G._loyaltyModalPending=false;Fx.render();}
function dropStaleLoyaltyModal(){G._loyaltyModalPending=false;}   // render-time clean-up when nobody is in debt any more
// retention modal (a worker is about to leave)
function retentionPayDebt(wId){
  const L=G.lang;
  const rw=G.workers.find(x=>x.id===wId);
  if(!rw)return;
  const unpaid=rw.unpaidDebt||0;
  if(!(unpaid>0&&G.grose>=unpaid))return;   // UI gate
  G.grose-=unpaid;
  const ww=G.workers.find(x=>x.id===wId);
  if(ww){ww.unpaidDebt=0;ww.loyalty=Math.min(100,(ww.loyalty||50)+15);ww.mood=Math.min(100,(ww.mood||60)+8);}
  G._retentionPending=(G._retentionPending||[]).filter(id=>id!==wId);
  G.log.push(`__ECO__💸 ${rw.name} ${L==="cs"?"— dluh splacen, zůstává":"— debt paid, staying"} (+15 ${L==="cs"?"loaj.":"loy."})`);
  Fx.render();
}
function retentionPromise(wId){
  const L=G.lang;
  const rw=G.workers.find(x=>x.id===wId);
  if(!rw)return;
  G.workers.forEach(w=>{if(w.id===wId) w.loyalty=Math.min(100,(w.loyalty||50)+5);});
  G._retentionPending=(G._retentionPending||[]).filter(id=>id!==wId);
  G.log.push(`__EVT__🤝 ${rw.name} ${L==="cs"?"— slíbeno zlepšení, váhá":"— promised improvement, hesitates"}`);
  Fx.render();
}
function retentionIgnore(wId){
  G._retentionPending=(G._retentionPending||[]).filter(id=>id!==wId);
  Fx.render();
}
function dropStaleRetention(wId){G._retentionPending=(G._retentionPending||[]).filter(id=>id!==wId);}   // render-time clean-up when the worker is gone
// Parta tab → debts
function payAllOwedWages(){
  const L=G.lang;
  const debtedNow=G.workers.filter(w=>(w.unpaidDebt||0)>0);
  const claimsOwed=claimsTotal(G);
  const totalOwed=debtedNow.reduce((s,w)=>s+(w.unpaidDebt||0),0)+claimsOwed;
  if(!((debtedNow.length||claimsOwed>0)&&G.grose>=totalOwed))return;   // UI gate
  G.grose-=claimsOwed;G.exCrewClaims=[];   // bývalí dělníci: jen splacení, bez bonusu loajality/nálady
  G.workers.forEach(w=>{
    if((w.unpaidDebt||0)>0){
      G.grose-=w.unpaidDebt;
      w.loyalty=Math.min(100,(w.loyalty||70)+12);
      w.mood=Math.min(100,(w.mood||60)+6);
      w.unpaidDebt=0;
    }
  });
  G.log.push(`__ECO__💸 ${L==="cs"?"Dluhy dělníkům splaceny":"Worker debts cleared"}: -${totalOwed}g`);
  Fx.render();
}
// Pohledávka bývalého zaměstnance: zaplatí se celá; mimo vyúčtování žádný další efekt (háček pro příběhové události/pověst později).
function payExClaim(claimId){
  const L=G.lang;
  const c=(G.exCrewClaims||[]).find(x=>x.id===claimId);
  if(!c||!(c.amount>0)||G.grose<c.amount)return;   // UI gate
  G.grose-=c.amount;
  G.exCrewClaims=G.exCrewClaims.filter(x=>x.id!==claimId);
  G.log.push(`__ECO__💸 ${L==="cs"?"Splacena pohledávka bývalého dělníka":"Former worker's claim paid"} ${c.name}: -${c.amount}g`);
  Fx.render();
}
function payWorkerWage(wId,amt){
  const L=G.lang;
  const w=G.workers.find(x=>x.id===wId);
  if(!w||!(amt>0)||G.grose<amt)return;   // UI gate
  const pay=Math.min(amt,G.workers.find(x=>x.id===w.id)?.unpaidDebt||0);
  G.grose-=pay;
  const ww=G.workers.find(x=>x.id===w.id);
  if(ww){
    ww.unpaidDebt=Math.max(0,(ww.unpaidDebt||0)-pay);
    ww.loyalty=Math.min(100,(ww.loyalty||70)+8);
    ww.mood=Math.min(100,(ww.mood||60)+5);
  }
  G.log.push(`__ECO__💸 ${L==="cs"?"Splaceno":"Paid"} ${w.name}: ${pay}g`);
  Fx.render();
}
// Market tab: hire a specialist drawn to the region by St. George (G.trhuNPC). Ids are stamped with Date.now().
function hireMarketSpecialist(candidateId){
  const L=G.lang;
  const c=(G.trhuNPC||[]).find(x=>x.id===candidateId);
  if(!c)return;
  if(!(G.grose>=c.hireCost&&G.workers.length<MAX_WORKERS))return;   // UI gate
  G.grose-=c.hireCost;
  G.workers.push({...c,id:"w"+Date.now()});
  G.trhuNPC=(G.trhuNPC||[]).filter(x=>x.id!==c.id);
  G.log.push(`__ECO__👷 ${c.name} ${L==="cs"?"najmut na trhu":"hired at market"} (-${c.hireCost}g)`);
  Fx.render();
}

// ── endgame contracts (reputation) ──
function endgameOffer(cat){
  const eg=ENDGAME_CONTRACTS[cat];
  const famaState=G.fama||{church:0,noble:0,trade:0};
  const egState=G.endgame||{church:false,noble:false,trade:false};
  const currentFurnType=G.furnace?.type||"primitive";
  const FURNACE_ORDER=["primitive","stone","master"];
  const egActive=(G.repContracts||[]).find(r=>r.id===eg.id);
  const reqFurn=eg.minFurnace||"primitive";
  const furnOk=FURNACE_ORDER.indexOf(currentFurnType)>=FURNACE_ORDER.indexOf(reqFurn);
  const available=!!(eg&&famaState[cat]>=eg.minFama&&!egState[cat]&&!egActive);
  return {eg,egActive,reqFurn,furnOk,available};
}
function acceptEndgameContract(cat){
  const L=G.lang, eg=ENDGAME_CONTRACTS[cat];
  const o=endgameOffer(cat);
  if(!(o.available&&o.furnOk))return;   // UI gate
  G.repContracts=[...(G.repContracts||[]),{
    ...eg, cat, due:G.round+eg.due,
    isEndgame:true, instanceId:eg.id
  }];
  G.log.push("__EVT__⭐ "+(L==="cs"?"ENDGAME zakázka přijata: ":"ENDGAME contract accepted: ")+(L==="cs"?eg.cs:eg.en));
  Fx.render();
}

