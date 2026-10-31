// ── KONTRAKT SYSTÉM ─────────────────────────────────────────────────────────
function contractCost(w,months){
  const wage=2+(w.wageMod||0);
  const opt=CONTRACT_OPTIONS.find(o=>o.months===months)||CONTRACT_OPTIONS[0];
  return Math.round(wage*opt.mult);
}
function signContract(workerId,months){
  const w=G.workers.find(x=>x.id===workerId);
  if(!w) return;
  const cost=contractCost(w,months);
  if(G.grose<cost) return;
  G.grose-=cost;
  w.contract={months,paid:cost,roundsLeft:months};
  w.loyalty=Math.min(100,(w.loyalty||50)+20);
  w.mood=Math.min(100,(w.mood||60)+10);
  // Odstranit z retention queue
  G._retentionPending=(G._retentionPending||[]).filter(id=>id!==workerId);
  const L=G.lang||"cs";
  G.log.push(`__ECO__📜 ${w.name} ${L==="cs"?"podepsal kontrakt na":"signed contract for"} ${months} ${L==="cs"?"měs.":"mo."} (-${cost}g, +${L==="cs"?"loaj.":"loy."})`);
  Fx.render();
}

// Osobní hodnocení hutmistra — statická báze + dynamika
function workerAssessment(w,L){
  const npc=NPC_ROSTER.find(n=>n.id===w.npcId);
  const tier=workerTier(w.lv);
  const seasons=w.seasonsInFoundry||0;
  const incidents=w.incidents||0;
  const loyalty=w.loyalty||75;
  // Statická báze per NPC → NPC_ASSESS
  const base=NPC_ASSESS[w.npcId]||(L==="cs"?{cs:"Dobrý dělník. Spolehlivý."}:{en:"Good worker. Reliable."});
  const baseText=L==="cs"?base.cs:base.en;
  // Dynamická část
  const parts=[];
  if(seasons>=3) parts.push(L==="cs"?`${seasons} sezóny v huti — zkušenost se počítá.`:`${seasons} seasons here — experience counts.`);
  else if(seasons===1) parts.push(L==="cs"?"První sezóna za sebou.":"First season done.");
  if(incidents>=3) parts.push(L==="cs"?"Pár nehod na kontě — pozor na únavu.":"A few incidents on record — watch the fatigue.");
  if(loyalty>=85) parts.push(L==="cs"?"Loajální jako málokdo.":"As loyal as they come.");
  else if(loyalty<30) parts.push(L==="cs"?"Uvažuje o odchodu. Nutno jednat.":"Thinking of leaving. Action needed.");
  if(w.mentorId) parts.push(L==="cs"?"Mentor mu otevřel oči.":"Mentorship opened his eyes.");
  if(w.lv>=7) parts.push(L==="cs"?`${tier.cs} — respekt pečeme do skla.`:`${tier.cs} — respect baked into glass.`);
  return baseText+(parts.length?" "+parts[0]:"");
}

function autoSave(){
  if(saveguardPauseAutosave)return;
  try{
    localStorage.setItem("sh_v9",JSON.stringify({...G,_savedAt:Date.now()}));
  }catch(e){console.warn("AutoSave failed:",e);}
}

