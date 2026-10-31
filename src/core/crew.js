// Aktivní vazba = oba členové jsou v huti a nesedí na odpočinku (task!=="idle") — stejná podmínka jako u afinity Josef+Kateřina.
function bondActive(p,a,b){return p.workers.some(w=>w.npcId===a&&w.task!=="idle")&&p.workers.some(w=>w.npcId===b&&w.task!=="idle");}
function moodEffMult(w){return 1+((w.mood==null?MOOD_NEUTRAL:w.mood)-MOOD_NEUTRAL)/500;}

// Kteří NPC jsou k dispozici pro nábor (ještě ne v huti)
function getAvailableNPC(){
  const inHutte=(G?.workers||[]).map(w=>w.npcId).filter(Boolean);
  return NPC_ROSTER.filter(n=>!inHutte.includes(n.id));
}

function genCandidates(season, count){
  const available=getAvailableNPC().filter(n=>{
    const minSeason=n.availSeason!==undefined?n.availSeason:1;
    return season>=minSeason;
  });
  if(available.length===0)return [];
  // Zamíchej a vyber unikátní kandidáty (žádné duplikáty)
  const shuffled=[...available].sort(()=>Math.random()-.5);
  return shuffled.slice(0,Math.min(count,shuffled.length)).map(npc=>({
    id:"c"+npc.id, npcId:npc.id,
    name:npc.name, prof:npc.prof, lv:npc.lv,
    traits:npc.traits, hireCost:npc.hireCost, wageMod:npc.wageMod,
    portrait:npc.portrait,
    quote_cs:npc.quote_cs, quote_en:npc.quote_en,
    subtitle_cs:npc.subtitle_cs, subtitle_en:npc.subtitle_en,
    loyalty:npc.loyalty, health:npc.health, mood:npc.mood,
    gender:npc.gender||"m",
    xp:0, fat:0, task:WERKSTAT_PROFS.includes(npc.prof)?"werkstat":"idle",
    seasonsInFoundry:0, incidents:0, contract:null // contract:{months,paid,roundsLeft}
  }));
}

function hireWorker(candidate){
  if(G.workers.length>=MAX_WORKERS||G.grose<candidate.hireCost)return;
  G.grose-=candidate.hireCost;
  G.workers.push({...candidate,id:"w"+Date.now()});
  G.interseason.candidates=G.interseason.candidates.filter(c=>c.id!==candidate.id);
  G.log.push(`__ECO__👷 ${candidate.name} ${G.lang==="cs"?"přijat do hutě":"hired"} (-${candidate.hireCost}g)`);
  Fx.render();
}

function fireWorker(workerId){
  if(G.workers.length<=2)return; // min 2 dělníci
  const w=G.workers.find(x=>x.id===workerId);
  if(!w||w.traits?.includes("houzevatny"))return;
  G.workers=G.workers.filter(x=>x.id!==workerId);
  G.log.push(`__ECO__👋 ${w.name} ${G.lang==="cs"?"odešel z hutě":"left the foundry"}`);
  if((w.unpaidDebt||0)>0){   // propuštěný dělník si nárok na nevyplacené mzdy odnáší → kniha pohledávek
    (G.exCrewClaims=G.exCrewClaims||[]).push({id:"c"+G.season+"_"+G.round+"_"+w.id,name:w.name,npcId:w.npcId||null,amount:w.unpaidDebt,season:G.season,round:G.round,reason:"fired"});
    G.log.push(`__ECO__📒 ${G.lang==="cs"?`Pohledávka bývalého dělníka ${w.name}: ${w.unpaidDebt}g zapsána v knize dluhů`:`Claim of former worker ${w.name}: ${w.unpaidDebt}g recorded in the ledger`}`);
  }
  Fx.render();
}

function workerTier(lv){
  if(lv>=10) return {cs:"Velmistr",de:"Glasmeister"};
  if(lv>=7)  return {cs:"Mistr",   de:"Meister"};
  if(lv>=4)  return {cs:"Tovarys", de:"Geselle"};
  return              {cs:"Ucen",   de:"Lehrling"};
}

// Tomislavův rank — globálně dostupná funkce, stejná logika jako v UI Deníku
function getTomislavRank(p){
  const mins=[
    {id:"pomocnik", s:0, g:0},
    {id:"ucen",     s:1, g:50},
    {id:"tovarys",  s:2, g:200},
    {id:"mistr",    s:4, g:600},
    {id:"velmistr", s:8, g:2000},
  ];
  let idx=0;
  mins.forEach((m,i)=>{if((p.season||1)>=m.s&&(p.grose||0)>=m.g)idx=i;});
  return mins[idx].id;
}

// Helper — vrátí bio text pro NPC nebo generický text dle profese
function getNpcBio(w, lang){
  const bio=NPC_BIO[w.npcId]||NPC_BIO[w.id]; // npcId primárně (w.id = "w1","w2"...)
  if(bio) return lang==="cs"?bio.cs:bio.en;
  // Generický fallback dle profese
  const profName=(lang==="cs"?PROF_CS:PROF_EN)[w.prof]||w.prof;
  return lang==="cs"
    ?`<b>${profName}</b><br><br>O ${w.name} zatím mnoho nevíme. Čas ukáže co přináší hutě.`
    :`<b>${profName}</b><br><br>Little is known about ${w.name} yet. Time will tell what they bring to the foundry.`;
}

function getProfLabel(w, lang){
  if(w.subtitle_cs&&lang==="cs") return w.subtitle_cs;
  if(w.subtitle_en&&lang==="en") return w.subtitle_en;
  return (lang==="cs"?PROF_CS:PROF_EN)[w.prof]||w.prof;
}
