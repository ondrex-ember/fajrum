// ═══════════════════════════════════════════════════════════════════════════
// PLAYER ACTIONS & RULE QUERIES — extracted from render() (no DOM construction)
// Behaviour-preserving move: every function is the body of a former inline click handler (or of a rule that was
// computed inline while building the UI). render() calls these; the headless test tools (android/tools) and the
// Android port use the same functions. Functions that ended with render() in the handler still do.
// Guards marked "UI gate" mirror the condition under which the button was shown (so the call is a no-op otherwise).
// ═══════════════════════════════════════════════════════════════════════════

// ── new game / restart ──
// E1d-H1 SAVEGUARD — validate before activating, never overwrite a valid autosave on failed import.
const SAVEGUARD_KEY = "sh_v9";                // Existing slot remains compatible
const SAVEGUARD_PREIMPORT = "sh_v9_preimport_backup"; // Last autosave before an external import
let saveguardPauseAutosave = false;
function saveguardIsObject(value){
  return value!==null && typeof value==="object" && !Array.isArray(value);
}
function saveguardAssertSafe(value,depth=0){
  if(depth>32)throw new Error("Save is nested too deeply");
  if(value===null || typeof value!=="object")return;
  for(const key of Object.keys(value)){
    if(key==="__proto__"||key==="prototype"||key==="constructor")throw new Error("Unsafe save key");
    saveguardAssertSafe(value[key],depth+1);
  }
}
function validateGameSave(saved){
  if(!saveguardIsObject(saved))throw new Error("Save must be an object");
  saveguardAssertSafe(saved);
  const defaults=initState();
  if(!Number.isSafeInteger(saved.season)||saved.season<1||saved.season>100000)
    throw new Error("Invalid season");
  if(saved.round!==undefined&&(!Number.isSafeInteger(saved.round)||saved.round<0||saved.round>1000))
    throw new Error("Invalid round");
  if(saved.phase!==undefined&&!["intro","playing","event","summary","interseason","interseasonPhase","game_over"].includes(saved.phase))
    throw new Error("Invalid phase");
  const nested=["res","additives","wa","furnace","fama","endgame","audio"];
  const nullableObjects=["summary","curEvt","interseason","baranOffer","_strikeQueue"];
  for(const [key,value] of Object.entries(saved)){
    if(!(key in defaults))continue; // preserve unknown legacy/future data without changing game rules
    const expected=defaults[key];
    if(nested.includes(key)){
      if(!saveguardIsObject(value))throw new Error("Invalid "+key);
      for(const [part,item] of Object.entries(value)){
        if(part in expected && typeof expected[part]==="number" && (typeof item!=="number"||!Number.isFinite(item)))
          throw new Error("Invalid "+key+"."+part);
        if(part in expected && typeof expected[part]==="boolean" && typeof item!=="boolean")
          throw new Error("Invalid "+key+"."+part);
        if(part in expected && typeof expected[part]==="string" && typeof item!=="string")
          throw new Error("Invalid "+key+"."+part);
      }
    }else if(Array.isArray(expected)){
      if(!Array.isArray(value))throw new Error("Invalid "+key+" array");
    }else if(nullableObjects.includes(key)){
      if(value!==null&&!saveguardIsObject(value))throw new Error("Invalid "+key);
    }else if(key==="furnSlotPanev"){
      if(value!==null&&!Array.isArray(value))throw new Error("Invalid crucibles");
    }else if(expected===null){
      // Other legacy nullable runtime flags can remain null or structured JSON.
    }else if(typeof expected==="number"){
      if(typeof value!=="number"||!Number.isFinite(value))throw new Error("Invalid "+key);
    }else if(typeof expected==="string"||typeof expected==="boolean"){
      if(typeof value!==typeof expected)throw new Error("Invalid "+key);
    }else if(saveguardIsObject(expected)){
      if(!saveguardIsObject(value))throw new Error("Invalid "+key);
    }
  }
  if(saved.furnace?.type!==undefined && !Object.prototype.hasOwnProperty.call(FURNACE_TYPES,saved.furnace.type))
    throw new Error("Unknown furnace type");
  if(saved.workers!==undefined){
    for(const worker of saved.workers){
      if(!saveguardIsObject(worker) || typeof worker.id!=="string" || typeof worker.prof!=="string")
        throw new Error("Invalid worker");
      if(worker.name!==undefined && typeof worker.name!=="string")throw new Error("Invalid worker name");
      for(const key of ["xp","lv","fat","mood","loyalty","wageMod"])
        if(worker[key]!==undefined&&(typeof worker[key]!=="number"||!Number.isFinite(worker[key])))
          throw new Error("Invalid worker "+key);
      if(worker.contract!==undefined && worker.contract!==null && !saveguardIsObject(worker.contract))
        throw new Error("Invalid worker contract");
    }
  }
  if(saved.log!==undefined && saved.log.some(line=>typeof line!=="string"))
    throw new Error("Invalid chronicle");
  if(saved.activeBatches!==undefined && saved.activeBatches.some(item=>!saveguardIsObject(item)))
    throw new Error("Invalid melting batch");
  if(saved.furnSlotPanev && saved.furnSlotPanev.some(item=>item!==null&&!saveguardIsObject(item)))
    throw new Error("Invalid crucible entry");
  // Old saves (no _cur) count in groats: convert once to krejcary on a copy (the loaded object is never mutated).
  let src=saved;
  if((saved._cur||0)<2){src=JSON.parse(JSON.stringify(saved));migrateCurrency(src);}
  // Keep all known fields and any future data, while filling old missing fields safely.
  const merged={...defaults,...src};
  for(const key of nested)merged[key]={...defaults[key],...(src[key]||{})};
  if(!Array.isArray(merged.exCrewClaims))merged.exCrewClaims=[];
  if(!merged.guide||typeof merged.guide!=="object"||Array.isArray(merged.guide))merged.guide={on:false,done:[],snooze:{}};
  else{merged.guide={on:merged.guide.on===true,done:Array.isArray(merged.guide.done)?merged.guide.done.filter(x=>typeof x==="string"):[],snooze:(merged.guide.snooze&&typeof merged.guide.snooze==="object"&&!Array.isArray(merged.guide.snooze))?merged.guide.snooze:{}};}
  merged.forest2=forestSanitize(merged.forest2);
  if(!merged.partners||typeof merged.partners!=="object"||Array.isArray(merged.partners))merged.partners=partnersInit();
  migrateDebtModel(merged,src._dm);
  return merged;
}
// Jednorázová migrace měny (_cur: bez značky → 2). Save bez `_cur` počítá v grošiích (1 g = 100 kr): peněžní pole se vynásobí ×100.
// `interseason.seasonScore.grose` zůstává ve zlatnících (skóre, ne peníze). Běží PŘED doplněním výchozích hodnot (ty už jsou v krejcarech)
// a PŘED migrateDebtModel (ten už pracuje v krejcarech).
function migrateCurrency(state){
  if((state._cur||0)>=2)return;
  const sc=(o,...keys)=>{if(!o||typeof o!=="object")return;for(const k of keys)if(typeof o[k]==="number")o[k]*=KR;};
  const scAll=(a,...keys)=>{if(Array.isArray(a))a.forEach(x=>sc(x,...keys));};
  sc(state,"grose","debt","totalGrose","totalDebtPaid");
  for(const list of ["workers","trhuNPC"]){
    scAll(state[list],"hireCost","wageMod","unpaidDebt");
    if(Array.isArray(state[list]))state[list].forEach(w=>sc(w&&w.contract,"paid"));
  }
  scAll(state.interseason&&state.interseason.candidates,"hireCost","wageMod");
  for(const list of ["contracts","avail","repContracts"])scAll(state[list],"reward");
  if(state.shop&&typeof state.shop==="object")Object.values(state.shop).forEach(v=>sc(v,"b","price"));
  sc(state.baranOffer,"price");
  scAll(state.exCrewClaims,"amount");
  sc(state.summary,"bCost","contractIncome","dPay","debtAfter","groseAfter","groseDelta","wages","wagesDeficit","wagesPaid");
  scAll(state.summary&&state.summary.workerWages,"wage","shortfall");
  sc(state.failureStats,"debtPaid");
  state._cur=2;
}
// Jednorázová migrace účetního modelu dluhů (_dm: 1 → 2). Staré savy (bez _dm) připisovaly nevyplacené mzdy dvakrát:
// do G.debt (Reichel) i do w.unpaidDebt (parta). Převod: ze starého G.debt se odečte právě tolik, kolik je dluh partě
// (nejvýš celý G.debt) — nic dalšího se nepřepisuje ani neodpouští. Nové savy mají _dm=2 a migrací neprojdou.
function migrateDebtModel(state,savedVersion){
  if(savedVersion>=2){state._dm=savedVersion;return;}
  const crew=(state.workers||[]).reduce((s,w)=>s+Math.max(0,w.unpaidDebt||0),0);
  const credit=Math.max(0,Math.min(state.debt||0,crew));
  state.debt=(state.debt||0)-credit;
  state._dm=2;
  if(credit>0&&Array.isArray(state.log)){
    const cm=moneyStr(credit,state.lang!=="en");   // migrateCurrency už proběhla → hodnoty jsou v krejcarech
    state.log=[...state.log,`__ECO__📒 ${state.lang==="en"?`Ledger unified: ${cm} of unpaid wages was counted twice (Reichel + crew). Reichel debt reduced by ${cm}; the crew debt is unchanged.`:`Sjednocení účtů: ${cm} nevyplacených mezd se počítalo dvakrát (Reichel + parta). Dluh u Reichela snížen o ${cm}; dluh partě zůstává beze změny.`}`];
  }
}
function restoreGameState(saved){
  G=validateGameSave(saved);
}
function saveguardLoad(saved,backupBeforeImport=false){
  const previousState=G;
  let previousRaw;
  const previousPause=saveguardPauseAutosave;
  try{
    const prepared=validateGameSave(saved); // no mutation or disk writes before validation
    previousRaw=localStorage.getItem(SAVEGUARD_KEY);
    if(backupBeforeImport && previousRaw!==null){
      // A failed backup write blocks the import. Never risk the only good copy.
      localStorage.setItem(SAVEGUARD_PREIMPORT,previousRaw);
    }
    saveguardPauseAutosave=true;
    G=prepared;
    Fx.render(); // may throw: autosave is deliberately paused until the view succeeds
    const committed=JSON.stringify({...G,_savedAt:Date.now()});
    localStorage.setItem(SAVEGUARD_KEY,committed);
    return true;
  }catch(error){
    saveguardPauseAutosave=true; // rollback must never change even the timestamp of the last good save
    console.warn("Saveguard rejected game save:",error);
    G=previousState;
    // If a storage implementation throws after a write, restore the previous raw value.
    if(previousRaw!==undefined){
      try{
        if(localStorage.getItem(SAVEGUARD_KEY)!==previousRaw){
          if(previousRaw===null)localStorage.removeItem(SAVEGUARD_KEY);
          else localStorage.setItem(SAVEGUARD_KEY,previousRaw);
        }
      }catch(e){console.error("Saveguard rollback failed:",e);}
    }
    try{Fx.render();}catch(e){console.error("Failed to repaint previous game:",e);}
    const cs=previousState?.lang!=="en";
    if(typeof alert==="function")alert(cs?
      "Uložení není platné nebo se nepodařilo bezpečně načíst. Dosavadní hra zůstala zachována.":
      "The save is invalid or could not be loaded safely. Your previous game was preserved.");
    return false;
  }finally{
    saveguardPauseAutosave=previousPause;
  }
}

