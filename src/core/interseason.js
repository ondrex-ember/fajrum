// ── MEZISEZÓNNÍ FÁZE ────────────────────────────────────────
function startInterseason(){
  const p=G;
  // Regenerace lesa: základní + bonus za výsadbu
  const isEasy=p.difficulty==="easy";
  const reforestBonus=Math.min(p.reforestWorkers||0, 4)*(isEasy?3:2); // Lehká: +3/dělník, Normální: +2
  const naturalRegen=p.forest>0?(isEasy?6:FOREST_REGEN_BASE):2; // vyčerpaný les roste pomaleji
  const totalRegen=naturalRegen+reforestBonus;
  const forestCap=p.forestMax||INIT_FOREST;
  const newForest=Math.min(forestCap, p.forest+totalRegen);
  // Pec chladne, drží zaběhnutost dle tieru (Tier 1: 75%, Tier 2: 85%, Tier 3: 100%!)
  const runInRatio=p.seasonTier>=3?1.0:(p.seasonTier===2?0.85:(p.seasonTier===1?0.75:0.65));
  const newRunIn=Math.round(p.furnace.runIn*runInRatio);
  const furnace={...p.furnace, runIn:newRunIn, age:p.furnace.age+1};

  G.forest=newForest;
  G.furnace=furnace;
  G.reforestWorkers=0;
  if((p.seasonTier||0)>=3){
    G.fActive=true;
  }

  // Baranovský — přiveze nabídku dle sezóny (i bez něj v huti — pošle vzkaz)
  const baran=G.workers.find(w=>w.npcId==="npc_baran");
  const baranNPC=NPC_ROSTER.find(n=>n.id==="npc_baran");
  let baranOffer=null;
  const pool=BARAN_OFFERS.filter(o=>o.season<=p.season);
  if(pool.length){
    const pick=pool[Math.floor(Math.random()*pool.length)];
    baranOffer={...pick};
    if(baran){
      G.log.push(`__EVT__🗣️ ${baran.name}: "${G.lang==="cs"?pick.cs:pick.en}" (${pick.qty}× ${ADDITIVES[pick.item]?.icon||"?"} za ${pick.price}g)`);
    }else{
      G.log.push(`__EVT__✉️ ${G.lang==="cs"?"Dopis od Baranovského":"Letter from Baranovský"}: "${G.lang==="cs"?pick.cs:pick.en}" (${pick.qty}× ${ADDITIVES[pick.item]?.icon||"?"} za ${pick.price}g)`);
    }
  }
  G.baranOffer=baranOffer;

  // Vygeneruj unikátní kandidáty pro nábor
  // Sezóna 1: foukači se hlásí — nabídnout všechny dostupné (až 4)
  // Sezóna 2+: brusiči + rytec se přidají
  const candCount=p.season===1?4:3+Math.floor(Math.random()*2);
  const candidates=genCandidates(p.season+1, candCount);

  // Narrativní zpráva o Sv. Jiří — foukači se hlásí po první sezóně
  const foukNarr=p.season===1&&candidates.some(c=>["foukat_lesni","foukat_kristal","foukat_dekor","foukat_formy"].includes(c.prof));
  const brusNarr=p.season>=2&&candidates.some(c=>["brusic_hrana","brusic_kulic","rytec"].includes(c.prof));
  if(foukNarr){
    G.log.push(`__EVT__💨 ${G.lang==="cs"
      ?"Zpráva o hutě se šíří krajem — foukači se ptají po místě. Na Sv. Jiří příští jaro se mohou hlásit."
      :"Word of the foundry spreads — glassblowers are asking about positions. They may apply come St. George's Day next spring."}`);
  }
  if(brusNarr){
    G.log.push(`__EVT__💎 ${G.lang==="cs"
      ?"Dobrá pověst hutě přitáhla brusičské mistry. Hlásí se o práci."
      :"The foundry's good name has drawn grinding masters. They are inquiring about work."}`);
  }
  // Kariéra: každý, kdo dokončil sezónu v huti, má o sezónu víc (karta dělníka "Sezóny v huti", hodnocení hutmistra)
  G.workers=G.workers.map(w=>({...w,seasonsInFoundry:(w.seasonsInFoundry||0)+1}));
  G.interseason={
    shamotNeedRepair:furnace.shamotWear>=60,
    shamotCritical:furnace.shamotWear>=80,
    forestRegen:totalRegen,
    reforestBonus,
    runInCarryover:newRunIn,
    seasonScore:calcSeasonScore(),
    candidates
  };
  G.phase="interseason";
  Fx.render();
}

function buyBaranOffer(){
  const o=G.baranOffer;
  if(!o||G.grose<o.price)return;
  G.grose-=o.price;
  G.additives[o.item]=(G.additives[o.item]||0)+o.qty;
  // Odemkni recept pokud tento item byl unlock_item
  Object.entries(COLOR_RECIPES).forEach(([key,rec])=>{
    if(rec.unlock_item===o.item&&!G.unlockedRecipes.includes(key)){
      G.unlockedRecipes.push(key);
      G.log.push(`__EVT__📜 ${G.lang==="cs"?"Nový recept odemčen":"New recipe unlocked"}: ${G.lang==="cs"?rec.cs:rec.en}!`);
    }
  });
  G.log.push(`__ECO__🛒 ${G.lang==="cs"?"Koupeno":"Bought"}: ${o.qty}× ${ADDITIVES[o.item]?.icon} ${G.lang==="cs"?ADDITIVES[o.item]?.cs:ADDITIVES[o.item]?.en} (-${o.price}g)`);
  G.baranOffer=null;
  Fx.render();
}
function colorInputHave(item){
  if(item==="crystal")return G.crystal.length;
  if(item==="waldglas")return G.waldglas.length;
  if(COLOR_RES_INPUTS.includes(item))return (G.res&&G.res[item])||0;
  return (G.additives&&G.additives[item])||0;
}
function colorInputIcon(item){
  if(ADDITIVES[item])return ADDITIVES[item].icon;
  return item==="charcoal"?"⚫":item==="clay"?"🧱":item==="waldglas"?"🟫":"✨";
}
function colorInputName(item,L){
  if(ADDITIVES[item])return L==="cs"?ADDITIVES[item].cs:ADDITIVES[item].en;
  if(COLOR_RES_INPUTS.includes(item))return merchName(item,L);
  return item;
}
// recept je vyrobitelný: pec (nebo vlastní mufle) + atmosféra + vstupy
function colorRecipeBlock(rec){
  if(rec.mufle){
    if(!isCampaignMonth(G.round,G.seasonTier||0))return "season";
    if(((G.res&&G.res.wood)||0)<rec.wood)return "wood";
  }else if(!G.fActive||G.fTemp<rec.furnaceMin)return "temp";
  if(rec.atm==="red"&&!(G.furnAtm||[]).includes("red"))return "atm";
  for(const [item,qty] of Object.entries(rec.inputs)){
    if(colorInputHave(item)<qty)return "inputs";
  }
  return null;
}

function craftColorGlass(recipeKey){
  const rec=COLOR_RECIPES[recipeKey];
  if(!rec||!G.unlockedRecipes.includes(recipeKey))return;
  const L=G.lang;
  if(rec.mufle){
    if(!isCampaignMonth(G.round,G.seasonTier||0)){
      G.log.push(`__EVT__❌ ${L==="cs"?"Muflová pec pracuje jen v kampani":"The muffle furnace works only in the campaign"}`);
      Fx.render(); return;
    }
    if(((G.res&&G.res.wood)||0)<rec.wood){
      G.log.push(`__EVT__❌ ${L==="cs"?"Na muflovou pec chybí dřevo":"Not enough wood for the muffle furnace"} (${rec.wood}🪵)`);
      Fx.render(); return;
    }
  }else if(!G.fActive||G.fTemp<rec.furnaceMin){
    G.log.push(`__EVT__❌ ${L==="cs"?"Pec příliš studená":"Furnace too cold"} (min ${rec.furnaceMin}%)`);
    Fx.render(); return;
  }
  if(rec.atm==="red"&&!(G.furnAtm||[]).includes("red")){
    G.log.push(`__EVT__❌ ${L==="cs"?"Jantar vyžaduje redukční atmosféru — přepni pánev na kouřivý žár":"Amber needs a reducing atmosphere — switch a crucible to smoky fire"}`);
    Fx.render(); return;
  }
  // Zkontroluj vstupy
  for(const [item,qty] of Object.entries(rec.inputs)){
    if(colorInputHave(item)<qty){
      G.log.push(`__EVT__❌ ${L==="cs"?"Chybí":"Missing"}: ${qty}× ${colorInputIcon(item)} ${colorInputName(item,L)}`);
      Fx.render(); return;
    }
  }
  // Odečti vstupy
  let takenCrystal=[];
  for(const [item,qty] of Object.entries(rec.inputs)){
    if(item==="crystal") takenCrystal=G.crystal.splice(0,qty);
    else if(item==="waldglas") G.waldglas.splice(0,qty);
    else if(COLOR_RES_INPUTS.includes(item)) G.res[item]-=qty;
    else G.additives[item]-=qty;
  }
  if(rec.mufle)G.res.wood-=rec.wood;
  // Kvalita: dle pece + bonus receptu; lazura (mufle) zachovává kvalitu křišťálu
  const q=rec.mufle
    ?clamp(takenCrystal[0]||1,1,5)
    :Math.min(5,Math.round(calcFurnaceEff(G.furnace,G.panevQuality)*5)+rec.quality_bonus);

  // ── RUBÍN: po tavení je sklo téměř bezbarvé — polotovar čeká na náběh (druhé zahřátí), viz strikeRuby() ──
  if(recipeKey==="rubin"){
    if(!G.rubin_raw)G.rubin_raw=[];
    G.rubin_raw.push(q);
    G.log.push(`__PROD__⚪ ${L==="cs"?"Rubínový polotovar — sklo je téměř bezbarvé, čeká na náběh":"Ruby blank — the glass is almost colourless, awaiting striking"} ${["★","★★","★★★","★★★★","★★★★★"][q-1]}`);
    Fx.render(); return;
  }

  // Ostatní barvy — okamžitý výsledek
  if(!G[rec.output])G[rec.output]=[];
  G[rec.output].push(q);
  // Zapsat do archivu pokud poprvé
  const archKey="arch_"+recipeKey;
  if(!G.unlockedRecipes.includes(archKey)){
    G.unlockedRecipes.push(archKey);
    G.log.push(`__EVT__📚 „${G.lang==="cs"?rec.latin:(rec.latinEn||rec.latin)}"`);
  }
  G.log.push(`__PROD__${rec.icon} ${G.lang==="cs"?rec.cs:rec.en} ${["★","★★","★★★","★★★★","★★★★★"][q-1]}`);
  Fx.render();
}

// ── RUBÍN: náběh — druhé, pomalé zahřátí polotovaru; barva se vyvine (nebo ne) ──
function strikeRuby(){
  const raw=G.rubin_raw||[];
  if(!raw.length||G._strikeQueue)return;
  const L=G.lang;
  if(!G.fActive||G.fTemp<RUBY_STRIKE_MIN){
    G.log.push(`__EVT__❌ ${L==="cs"?"Náběh vyžaduje zapálenou pec":"Striking needs a lit furnace"} (min ${RUBY_STRIKE_MIN}%)`);
    Fx.render(); return;
  }
  const q=raw[0];
  G.rubin_raw=raw.slice(1);
  // Šance: mistr tavič (lv4+) 61–85 %, jinak 40 %; slabý žár −5 %, přepálení (>85 %) −15 %
  const masterTavic=G.workers.find(w=>w.prof==="tavic"&&w.lv>=4);
  const base=masterTavic?(0.55+Math.min(0.30,masterTavic.lv*0.06)):0.40;
  const tempMod=G.fTemp>85?-0.15:(G.fTemp<55?-0.05:0);
  G._strikeQueue={q, chance:Math.min(0.92,Math.max(0.20,base+tempMod)), tempAtStrike:G.fTemp};
  Fx.render();
}

function repairShamot(){
  const cost={clay:4,limestone:2,grose:8};
  if(G.res.clay<cost.clay||G.res.limestone<cost.limestone||G.grose<cost.grose){
    G.log.push(`__EVT__❌ ${G.lang==="cs"?"Nedostatek surovin pro opravu šamotu":"Not enough materials to repair shamot"}`);
    Fx.render(); return;
  }
  G.res.clay-=cost.clay; G.res.limestone-=cost.limestone; G.grose-=cost.grose;
  G.furnace.shamotWear=Math.max(0,G.furnace.shamotWear-70);
  G.log.push(`__ECO__🧱 ${G.lang==="cs"?"Šamot opraven":"Shamot repaired"} (-${cost.grose}g, -${cost.clay} ${G.lang==="cs"?"jíl":"clay"})`);
  Fx.render();
}

function upgradeFurnace(type){
  const cost=UPGRADE_COST[type];
  if(G.furnace.type===type||
     (type==="master"&&G.furnace.type==="primitive")||
     G.res.wood<cost.wood||G.res.limestone<cost.limestone||
     G.res.clay<cost.clay||G.grose<cost.grose){
    return;
  }
  G.res.wood-=cost.wood; G.res.limestone-=cost.limestone;
  G.res.clay-=cost.clay; G.grose-=cost.grose;
  G.furnace.type=type; G.furnace.runIn=Math.round(G.furnace.runIn*0.4); // reset zaběhnutosti
  G.furnace.shamotWear=0;
  G.log.push(`__ECO__🔥 ${G.lang==="cs"?"Pec vylepšena":"Furnace upgraded"}: ${FURNACE_TYPES[type][G.lang==="cs"?"name":"nameEn"]}`);
  G.showUpgrade=false;
  Fx.render();
}

function upgradeSeasonTier(targetTier){
  const p=G, L=p.lang;
  const info=SEASON_TIERS[targetTier];
  if(!info) return;
  const curTier=p.seasonTier||0;
  if(targetTier!==curTier+1) return;

  const furn=p.furnace.type;
  if(info.reqFurnace==="stone" && furn==="primitive"){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Vyžaduje zděnou pec!":"Requires stone furnace!"}`);
    Fx.render(); return;
  }
  if(info.reqFurnace==="master" && furn!=="master"){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Vyžaduje mistrovskou pec!":"Requires master furnace!"}`);
    Fx.render(); return;
  }
  if(info.reqFama){
    const curMaxFama=Math.max(p.fama?.church||0, p.fama?.noble||0, p.fama?.trade||0);
    if(curMaxFama<info.reqFama){
      G.log.push(`__EVT__⛔ ${L==="cs"?`Vyžaduje Fama reputaci alespoň ${info.reqFama}%!`:`Requires Fama reputation of at least ${info.reqFama}%!`}`);
      Fx.render(); return;
    }
  }

  // Kontrola a odečet surovin
  for(const [resKey, needed] of Object.entries(info.cost)){
    const have=resKey==="grose"?p.grose:(p.res[resKey]||0);
    if(have<needed){
      G.log.push(`__EVT__⛔ ${L==="cs"?`Nedostatek ${resKey} (chybí ${needed-have})`:`Not enough ${resKey}`}`);
      Fx.render(); return;
    }
  }

  for(const [resKey, needed] of Object.entries(info.cost)){
    if(resKey==="grose") G.grose-=needed;
    else G.res[resKey]-=needed;
  }

  G.seasonTier=targetTier;
  if(targetTier>=2) G.noblePrivilege=true;
  if(targetTier>=3){
    G.fActive=true;
    G.fTemp=Math.max(72, G.fTemp||75);
  }

  Fx.sound('bell', 0.6);
  G.log.push(`__ECO__🏛️ ${L==="cs"?`STAVEBNÍ ROZVOJ: ${info.name_cs} dokončeno!`:`BUILDING UPGRADE: ${info.name_en} completed!`}`);
  G.log.push(`__EVT__⭐ ${L==="cs"?info.benefit_cs:info.benefit_en}`);
  Fx.render();
}

