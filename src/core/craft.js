// Craft foukaného výrobku — inputColor = konkrétní surovina/barva z it.inputs[]
function craftBlown(itemKey, inputColor){
  const it=BLOWN_ITEMS[itemKey];
  if(!it)return;
  const p=G, L=p.lang;
  const color=inputColor||it.inputs[0];
  if(!it.inputs.includes(color)){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Tento vstup není povolen pro tento výrobek":"Input not allowed for this item"}`);
    Fx.render(); return;
  }
  if(!isCampaignMonth(p.round,p.seasonTier||0)||!p.fActive){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Pec musí běžet (kampaň)":"Furnace must be running (campaign)"}`);
    Fx.render(); return;
  }
  const needsForma=!!it.requiresMould||["dzban","misa","dzban_forma"].includes(itemKey);
  if(needsForma&&(p.res.formy||0)<1){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Chybí forma":"No mould available"}`);
    Fx.render(); return;
  }
  const missingResource=FajrumCatalog.resourceCost(it,p);
  if(missingResource){G.log.push(`__EVT__⛔ ${L==="cs"?"Chybí surovina":"Missing resource"}: ${missingResource[0]}`);Fx.render();return;}
  // Vstupní zásoba — barva/surovina je klíč v state
  const inv=[...(p[color]||[])];
  if(inv.length<it.qty){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Nedostatek":"Not enough"}: ${color}`);
    Fx.render(); return;
  }
  const specialists=p.workers.filter(w=>w.prof===it.spec);
  const anyBlower=p.workers.filter(w=>["foukat_lesni","foukat_kristal","foukat_dekor","foukat_formy","tavic"].includes(w.prof));
  if(it.specOnly&&specialists.length===0){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Vyžaduje specializovaného foukače":"Requires specialist glassblower"}: ${L==="cs"?PROF_CS[it.spec]:PROF_EN[it.spec]}`);
    Fx.render(); return;
  }
  if(!it.specOnly&&anyBlower.length===0){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Žádný foukač v huti":"No glassblower in foundry"}`);
    Fx.render(); return;
  }
  inv.sort((a,b)=>b-a);
  const used=inv.slice(0,it.qty);
  const avgQ=Math.round(used.reduce((s,q)=>s+q,0)/it.qty);
  G[color]=inv.slice(it.qty);
  FajrumCatalog.consumeResources(it,G);
  if(needsForma)G.res.formy=Math.max(0,(G.res.formy||0)-1);
  const isSpec=specialists.length>0;
  const specLv=isSpec?specialists[0].lv:1;
  const qBonus=isSpec?Math.round(specLv*0.8):0;
  const outQ=clamp(avgQ+qBonus+(Math.random()>.6?1:0),1,5);
  const outCount=isSpec?Math.min(3,1+Math.floor(Math.random()*2.5+0.5)):1;
  // State klíč: itemKey + color suffix (jen pokud není waldglas = default)
  const stateKey=color==="waldglas"?itemKey:itemKey+"_"+color;
  if(!G[stateKey])G[stateKey]=[];
  // Terčíky: specialista → 3ks, jinak 2ks (qty=2 je výstup, ne vstup)
  const tercikBase= itemKey==="tercik"?(isSpec?3:2):null;
  const actualCount= tercikBase!==null ? tercikBase : (isSpec?Math.min(3,1+Math.floor(Math.random()*2.5+0.5)):1);
  for(let i=0;i<actualCount;i++){
    // Terčíky: quality ≤2 → výplně, quality ≥4 → žebrový terčík (prémiový)
    if(itemKey==="tercik"&&outQ<=2){
      if(!G.tercik_vyplne)G.tercik_vyplne=[];
      G.tercik_vyplne.push(outQ);
    }else if(itemKey==="tercik"&&outQ>=4){
      if(!G.tercik_zebrovy)G.tercik_zebrovy=[];
      G.tercik_zebrovy.push(outQ);
    }else{
      G[stateKey].push(outQ);
    }
  }
  const colorLabel=color!=="waldglas"?` (${COLOR_ICON[color]||color})`:"";
  // Log — terčíky ukáží kolik šlo do výplní
  if(itemKey==="tercik"){
    const goodCount=G[stateKey].length-(G[stateKey].length-actualCount+(outQ<=2?actualCount:0));
    const fillCount=outQ<=2?actualCount:0;
    const goodActual=actualCount-fillCount;
    G.log.push(`__PROD__🪟 ${goodActual>0?goodActual+"× "+(L==="cs"?"terčík":"window disc")+" "+stars(outQ):""}${fillCount>0?(goodActual>0?" + ":"")+fillCount+"× "+(L==="cs"?"výplň":"filler")+" ★★":""}${isSpec?(L==="cs"?" (spec)":" (special)"):""}`);
    Fx.float(`+${goodActual} 🪟 ${stars(outQ)}`, null, "pos");
  }else{
    G.log.push(`__PROD__${it.icon} ${actualCount}× ${L==="cs"?it.cs:it.en}${colorLabel} ${stars(outQ)}${isSpec?" (spec ×"+actualCount+")":""}`);
    Fx.float(`+${actualCount} ${it.icon} ${stars(outQ)}`, null, "pos");
  }
  Fx.sound("glass", 0.6);
  Fx.render();
}
function engraveBonus(k){return ENGRAVE_BONUS_KEY[k]||ENGRAVE_BONUS;}
function engraveSrc(k){return GROUND_ITEMS[k]||BLOWN_ITEMS[k]||STAINED_ITEMS[k]||COLORED_ENGRAVE_ITEMS[k];}

function craftGround(itemKey){
  const it=GROUND_ITEMS[itemKey];
  if(!it)return;
  const p=G, L=p.lang;
  if(!isCampaignMonth(p.round,p.seasonTier||0)){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Broušení jen v kampani":"Grinding only during campaign"}`);
    Fx.render(); return;
  }
  const worker=p.workers.find(w=>w.prof===it.spec);
  if(!worker){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Chybí":"Missing"}: ${L==="cs"?PROF_CS[it.spec]:PROF_EN[it.spec]}`);
    Fx.render(); return;
  }
  if(it.needsHeat&&!p.fActive){G.log.push(`__EVT__⛔ ${L==="cs"?"Pec musí běžet":"Furnace must run"}`);Fx.render();return;}
  const missingResource=FajrumCatalog.resourceCost(it,p);
  if(missingResource){G.log.push(`__EVT__⛔ ${L==="cs"?"Chybí surovina":"Missing resource"}: ${missingResource[0]}`);Fx.render();return;}
  const inv=[...(p[it.input]||[])];
  if(inv.length<it.qty){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Nedostatek":"Not enough"}: ${it.input}`);
    Fx.render(); return;
  }
  inv.sort((a,b)=>b-a);
  const used=inv.slice(0,it.qty);
  const avgQ=Math.round(used.reduce((s,q)=>s+q,0)/it.qty);
  G[it.input]=inv.slice(it.qty);
  FajrumCatalog.consumeResources(it,G);
  const qBonus=Math.round(worker.lv*0.6);
  const outQ=clamp(avgQ+qBonus+(Math.random()>.5?1:0),1,5);
  if(!G[itemKey])G[itemKey]=[];
  G[itemKey].push(outQ);
  G.log.push(`__PROD__${it.icon} 1× ${L==="cs"?it.cs:it.en} ${stars(outQ)} (${L==="cs"?PROF_CS[it.spec]:PROF_EN[it.spec]})`);
  Fx.render();
}

function craftEngrave(inputKey){
  const p=G, L=p.lang;
  const rytec=p.workers.find(w=>w.prof==="rytec");
  if(!rytec){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Rytec není v huti":"No engraver in foundry"}`);
    Fx.render(); return;
  }
  if(!isCampaignMonth(p.round,p.seasonTier||0)){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Rytí jen v kampani":"Engraving only during campaign"}`);
    Fx.render(); return;
  }
  const inv=[...(p[inputKey]||[])];
  if(!inv.length){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Žádný kus k rytí":"No piece to engrave"}`);
    Fx.render(); return;
  }
  inv.sort((a,b)=>b-a);
  const q=inv[0];
  G[inputKey]=inv.slice(1);
  const outKey="rytina_"+inputKey;
  if(!G[outKey])G[outKey]=[];
  G[outKey].push(q);
  const srcName=L==="cs"?(GROUND_ITEMS[inputKey]?.cs||BLOWN_ITEMS[inputKey]?.cs||STAINED_ITEMS[inputKey]?.cs||COLORED_ENGRAVE_ITEMS[inputKey]?.cs||inputKey):(GROUND_ITEMS[inputKey]?.en||BLOWN_ITEMS[inputKey]?.en||STAINED_ITEMS[inputKey]?.en||COLORED_ENGRAVE_ITEMS[inputKey]?.en||inputKey);
  G.log.push(`__PROD__✂️ ${L==="cs"?"Rytina na":"Engraved"} ${srcName} ${stars(q)} (+${Math.round((engraveBonus(inputKey)-1)*100)}% ${L==="cs"?"cena":"price"})`);
  Fx.render();
}

function craftSpecial(itemKey){
  const it=SPECIAL_ITEMS[itemKey];
  if(!it) return;
  const p=G, L=p.lang;
  if(!isCampaignMonth(p.round,p.seasonTier||0)||!p.fActive){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Pec musí běžet (kampaň)":"Furnace must be running (campaign)"}`);
    Fx.render(); return;
  }
  if(p.season<it.minSeason){
    G.log.push(`__EVT__⛔ ${L==="cs"?"Dostupné od sezóny "+it.minSeason:"Available from season "+it.minSeason}`);
    Fx.render(); return;
  }
  // Zkontroluj dělníky
  for(const prof of it.workers){
    if(!p.workers.find(w=>w.prof===prof)){
      G.log.push(`__EVT__⛔ ${L==="cs"?"Chybí":"Missing"}: ${(L==="cs"?PROF_CS:PROF_EN)[prof]||prof}`);
      Fx.render(); return;
    }
  }
  // Validate all inventory, additive and numeric resource inputs before consuming any.
  for(const [key,qty]of Object.entries(it.inputs)){
    if(FajrumCatalog.specialHave(p,key)<qty){G.log.push(`__EVT__⛔ ${L==="cs"?"Nedostatek":"Not enough"}: ${key}`);Fx.render();return;}
  }
  for(const [key,qty]of Object.entries(it.inputs))FajrumCatalog.specialConsume(G,key,qty);
  // Výstup
  const worker=p.workers.find(w=>it.workers.includes(w.prof));
  const qBonus=worker?Math.round(worker.lv*0.6):0;
  const outQ=clamp(3+qBonus+(Math.random()>.5?1:0),1,5);
  if(!G[itemKey])G[itemKey]=[];
  G[itemKey].push(outQ);
  G.log.push(`__PROD__${it.icon} 1× ${L==="cs"?it.cs:it.en} ${stars(outQ)}`);
  Fx.render();
}
