// interseason.js — between-seasons screen (phase "interseason").
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderInterseasonScreen(ctx){
  const {p,L,ft}=ctx;
  if(p.phase==="interseasonPhase"){startInterseason();return;}
  const is=p.interseason||{};
  const sc=is.seasonScore||{};
  const total=totalScore(sc);
  const shamotWear=p.furnace.shamotWear;
  const canRepair=p.res.clay>=4&&p.res.limestone>=2&&p.grose>=8;
  const canUpgradeStone=p.furnace.type==="primitive"&&
    p.res.wood>=UPGRADE_COST.stone.wood&&p.res.limestone>=UPGRADE_COST.stone.limestone&&
    p.res.clay>=UPGRADE_COST.stone.clay&&p.grose>=UPGRADE_COST.stone.grose;
  const canUpgradeMaster=p.furnace.type==="stone"&&
    p.res.wood>=UPGRADE_COST.master.wood&&p.res.limestone>=UPGRADE_COST.master.limestone&&
    p.res.clay>=UPGRADE_COST.master.clay&&p.grose>=UPGRADE_COST.master.grose;

  app.append(
    h("div",{class:"hdr"},
      h("div",null,
        h("h1",null,"🌿 "+(L==="cs"?"Mezisezóna":"Between Seasons")),
        h("small",null,`${L==="cs"?"Sezóna":"Season"} ${p.season} → ${p.season+1} · ${1679+p.season+1}`))));

  const body=h("div",{style:{padding:"14px",overflowY:"auto",flex:"1"}});

  // Shrnutí sezóny
  body.append(h("div",{class:"sec-title"},L==="cs"?"Výsledky sezóny":"Season Results"));
  const scoreGrid=h("div",{class:"interseason-grid"});
  [
    ["🔥 Waldglas",sc.waldglas],["✨ Křišťál",sc.crystal],
    ["⭐ Kvalita",sc.quality],["📜 Zakázky",sc.contracts],
    ["💰 Groše",sc.grose],["🌲 Les",sc.forest]
  ].forEach(([l,v])=>{
    scoreGrid.append(h("div",{class:"interseason-card"},
      h("div",{style:{fontSize:"10px",color:"#8b5e34",marginBottom:"2px"}},l),
      h("div",{style:{fontSize:"18px",fontWeight:"700"}},v||0)));
  });
  scoreGrid.append(h("div",{class:"interseason-card",style:{gridColumn:"1/-1",background:"rgba(139,94,52,.08)"}},
    h("div",{style:{fontSize:"10px",color:"#8b5e34",marginBottom:"2px"}},L==="cs"?"CELKEM SEZÓNA":"SEASON TOTAL"),
    h("div",{style:{fontSize:"22px",fontWeight:"700",color:"#c9952b"}},total)));
  body.append(scoreGrid);

  // Stav pece
  body.append(h("div",{class:"sec-title",style:{marginTop:"10px"}},L==="cs"?"Stav pece":"Furnace Status"));
  const furnCard=h("div",{class:"furnace-card"});
  furnCard.append(
    h("div",{class:"furnace-stat"},
      h("span",null,L==="cs"?"Typ":"Type"),
      h("strong",null,L==="cs"?ft.name:ft.nameEn)),
    h("div",{class:"furnace-stat"},
      h("span",null,L==="cs"?"Zaběhnutost (přenos)":"Run-in (carryover)"),
      h("strong",null,p.furnace.runIn+"%")),
    h("div",null,effBar(p.furnace.runIn,p.furnace.runIn>50?"#4a7a3a":"#c9952b")),
    h("div",{class:"furnace-stat",style:{marginTop:"6px"}},
      h("span",null,L==="cs"?"Opotřebení šamotu":"Shamot wear"),
      h("strong",{style:{color:shamotWear>=80?"#a03020":shamotWear>=50?"#c9952b":"#4a7a3a"}},shamotWear+"%")),
    h("div",null,effBar(shamotWear,shamotWear>=80?"#a03020":shamotWear>=50?"#c9952b":"#4a7a3a")));

  if(is.shamotNeedRepair){
    furnCard.append(h("div",{style:{marginTop:"8px",padding:"6px",background:"rgba(160,48,32,.08)",borderRadius:"4px",fontSize:"11px",color:"#a03020"}},
      (is.shamotCritical?"⚠️ ":"🔧 ")+(L==="cs"?"Šamot potřebuje opravu":"Shamot needs repair"),
      h("br",null),
      h("span",{style:{fontSize:"10px",color:"#8b5e34"}},"Cena: 4🧱 + 2🪨 + 8g")));
    furnCard.append(h("button",{
      class:"btn btn-s"+(canRepair?"":" btn-danger"),
      style:{marginTop:"4px",opacity:canRepair?1:.5},
      onClick:()=>{if(canRepair)repairShamot();}},
      L==="cs"?"Opravit šamot (8g)":"Repair shamot (8g)"));
  }
  body.append(furnCard);

  // Upgrade pece
  if(p.furnace.type!=="master"){
    body.append(h("div",{class:"sec-title",style:{marginTop:"10px"}},L==="cs"?"Upgrade pece":"Furnace Upgrade"));
    if(p.furnace.type==="primitive"){
      const uc=UPGRADE_COST.stone;
      body.append(h("button",{
        class:"btn"+(canUpgradeStone?" btn-p":""),"data-furnace-preview":"stone",
        style:{width:"100%",marginBottom:"4px",opacity:canUpgradeStone?1:.5},
        onClick:()=>{if(canUpgradeStone)upgradeFurnace("stone");}},
        `🔥 ${L==="cs"?"Zděná pec":"Stone furnace"} (${uc.wood}🌳 + ${uc.limestone}🟩 + ${uc.clay}🧱 + ${uc.grose}g)`));
    }
    if(p.furnace.type==="stone"){
      const uc=UPGRADE_COST.master;
      body.append(h("button",{
        class:"btn"+(canUpgradeMaster?" btn-p":""),"data-furnace-preview":"master",
        style:{width:"100%",marginBottom:"4px",opacity:canUpgradeMaster?1:.5},
        onClick:()=>{if(canUpgradeMaster)upgradeFurnace("master");}},
        `🔥 ${L==="cs"?"Mistrovská pec":"Master furnace"} (${uc.wood}🌳 + ${uc.limestone}🟩 + ${uc.clay}🧱 + ${uc.grose}g)`));
    }
  }

  // Les + sklad skla přenesený
  body.append(h("div",{class:"sec-title",style:{marginTop:"10px"}},L==="cs"?"Hvozd & Sklad":"Forest & Storage"));
  const regenLine=h("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px",fontSize:"12px"}});
  regenLine.append(h("span",{style:{color:"#4a7a3a"}},`🌲 +${is.forestRegen||FOREST_REGEN_BASE} → ${p.forest}/${p.forestMax||INIT_FOREST}`));
  if(is.reforestBonus>0)regenLine.append(h("span",{style:{color:"#4a7a3a",fontSize:"11px"}},`(🌱 výsadba +${is.reforestBonus})`));
  if(p.forest<(p.forestMax||INIT_FOREST))regenLine.append(h("span",{style:{color:"#8b5e34",fontSize:"11px"}},L==="cs"?`chybí ${(p.forestMax||INIT_FOREST)-p.forest} parcel`:`${(p.forestMax||INIT_FOREST)-p.forest} missing`));
  body.append(regenLine);
  if(p.forest===0){
    body.append(h("div",{style:{fontSize:"11px",color:"#a03020",padding:"6px",
      background:"rgba(160,48,32,.08)",borderRadius:"4px",marginBottom:"6px",lineHeight:"1.5"}},
      L==="cs"
        ?`🌲 Hvozd je vyčerpán. Přidej dělníky na Výsadbu (příprava i kampaň) — každé kolo výsadby přidá +${p.difficulty==="easy"?3:2} parcely, započítají se max. 4 kola za sezónu. Přirozená obnova vyčerpaného lesa: +2/sezónu.`
        :`🌲 Forest depleted. Assign workers to Reforest (prep or campaign) — each planting round adds +${p.difficulty==="easy"?3:2} parcels, max 4 rounds count per season. Natural recovery of a depleted forest: +2/season.`));
  }
  const storedTotal=p.waldglas.length+p.crystal.length;
  if(storedTotal>0){
    const storageCost=storedTotal*STORAGE_COST_PER_ITEM;
    body.append(h("div",{style:{fontSize:"12px",color:"#8b5e34",marginBottom:"8px",
      padding:"6px",background:"rgba(139,94,52,.06)",borderRadius:"4px"}},
      `📦 ${L==="cs"?"Sklad přenáší":"Storage carries"}: 🔥${p.waldglas.length} + ✨${p.crystal.length} ${L==="cs"?"kusů":"pieces"}`,
      h("br",null),
      h("span",{style:{fontSize:"11px",color:"#a03020"}},`💸 ${L==="cs"?"Náklady skladu":"Storage cost"}: ${storageCost}g`)));
  }

  // Baranovský — nabídka přísad
  if(p.baranOffer){
    const bo=p.baranOffer;
    const ad=ADDITIVES[bo.item];
    const canBuy=p.grose>=bo.price;
    const baranSec=h("div",{class:"sec-title","data-partner":"baranovsky",style:{marginTop:"10px"}},
      `🗣️ ${L==="cs"?"Baranovský přišel s nabídkou":"Baranovský has an offer"}`);
    const baranCard=h("div",{class:"fj-additive-offer","data-additive":bo.item,style:{padding:"8px",background:"rgba(201,149,43,.08)",
      border:"1px solid rgba(201,149,43,.25)",borderRadius:"4px",marginBottom:"8px"}});
    baranCard.append(
      h("div",{style:{fontSize:"12px",color:"#3a2a14",marginBottom:"4px",fontStyle:"italic"}},
        `„${L==="cs"?bo.cs:bo.en}"`),
      h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"6px"}},
        `${ad?.icon} ${bo.qty}× ${L==="cs"?ad?.cs:ad?.en} — ${bo.price}g`),
      h("button",{
        class:"btn"+(canBuy?" btn-p":""),
        style:{width:"100%",opacity:canBuy?1:.5},
        onClick:()=>{if(canBuy)buyBaranOffer();}},
        canBuy?(L==="cs"?"Koupit":"Buy"):(L==="cs"?"Nedostatek grošů":"Not enough groats")));
    body.append(baranSec,baranCard);
  }

  // Nástěnka — nábor
  body.append(h("div",{class:"sec-title",style:{marginTop:"10px"}},
    `👷 ${L==="cs"?"Nástěnka — nábor":"Job Board — Hiring"} (${p.workers.length}/${MAX_WORKERS})`));

  // Stávající dělníci s tlačítkem propustit
  const curSec=h("div",{style:{marginBottom:"8px"}});
  p.workers.forEach(w=>{
    const canFire=p.workers.length>2&&!w.traits?.includes("houzevatny");
    const xpNeeded=XP_PER_LEVEL[w.lv-1]||999;
    const xpPct=Math.round(((w.xp||0)/xpNeeded)*100);
    const row=h("div",{style:{display:"flex",alignItems:"center",gap:"6px",padding:"4px 0",
      borderBottom:"1px solid rgba(42,26,10,.07)",fontSize:"11px"}});
    row.append(
      h("span",{style:{flex:1}},
        `${w.name} ${stars(w.lv)} · ${L==="cs"?PROF_CS[w.prof]||w.prof:PROF_EN[w.prof]||w.prof}`,
        w.traits?.length?h("span",{style:{marginLeft:"4px",fontSize:"10px",color:"#8b5e34"}},
          w.traits.map(t=>TRAITS[t]?.icon||"").join("")):null),
      h("span",{style:{fontSize:"10px",color:"#8b5e34",minWidth:"40px"}},`XP ${xpPct}%`),
      h("button",{
        class:"btn btn-s"+(canFire?"":" "),
        style:{fontSize:"10px",opacity:canFire?1:.4,
          ...(canFire?{background:"rgba(160,48,32,.1)",color:"#a03020",borderColor:"rgba(160,48,32,.2)"}:{})},
        onClick:()=>{if(canFire){fireWorker(w.id);}}},
        L==="cs"?"Propustit":"Fire"));
    curSec.append(row);
  });
  body.append(curSec);

  // Kandidáti — rozděleni na specialisty a obecné
  if(is.candidates?.length&&p.workers.length<MAX_WORKERS){
    const specProfs=["foukat_lesni","foukat_kristal","foukat_dekor","foukat_formy","brusic_hrana","brusic_kulic","rytec"];
    const specCands=is.candidates.filter(c=>specProfs.includes(c.prof));
    const genCands=is.candidates.filter(c=>!specProfs.includes(c.prof));

    // Foukači/brusiči — zvýrazněná sekce
    if(specCands.length>0){
      const isFoukSeason=p.season===1&&specCands.some(c=>c.prof.startsWith("foukat_"));
      const isBrusSeason=p.season>=2&&specCands.some(c=>["brusic_hrana","brusic_kulic","rytec"].includes(c.prof));
      const specHdr=h("div",{style:{
        padding:"8px 10px",marginBottom:"6px",borderRadius:"4px",
        background:"rgba(201,149,43,.08)",border:"1px solid rgba(201,149,43,.25)"}});
      specHdr.append(
        h("div",{style:{fontWeight:"700",fontSize:"12px",color:"#c9952b",marginBottom:"3px"}},
          isFoukSeason?"💨 "+(L==="cs"?"Hlásí se foukači — Sv. Jiří":"Glassblowers apply — St. George's Day")
          :isBrusSeason?"💎 "+(L==="cs"?"Přicházejí brusiči a rytci":"Grinders and engravers arrive")
          :"⚒️ "+(L==="cs"?"Hlásí se specialisté":"Specialists applying")),
        h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic"}},
          isFoukSeason
            ?(L==="cs"?"Kampaň na Sv. Jiří přilákala foukače z okolí. Příští sezóna může být jiná."
                      :"St. George's campaign drew blowers from the region. Next season can be different.")
            :(L==="cs"?"Pověst hutě se šíří. Mistři hledají práci."
                      :"The foundry's reputation spreads. Masters seek work.")));
      body.append(specHdr);
      specCands.forEach(c=>buildCandidateCard(c,body,p,L));
    }

    // Obecní kandidáti
    if(genCands.length>0){
      body.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",margin:"8px 0 4px",fontWeight:"600"}},
        L==="cs"?"Hledají práci:":"Looking for work:"));
      genCands.forEach(c=>buildCandidateCard(c,body,p,L));
    }
  }else if(p.workers.length>=MAX_WORKERS){
    body.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"4px"}},
      L==="cs"?"Huť je plná (6/6). Propusť někoho pro nábor.":"Foundry full (6/6). Fire someone to hire."));
  }

  // Rozšíření provozu huti a sezónní tiery
  renderSeasonUpgrades(body, true);

  // Tlačítko nová sezóna
  body.append(h("button",{
    class:"btn btn-p",
    style:{width:"100%",padding:"12px",fontSize:"14px",marginTop:"10px"},
    onClick:startNewSeason},
    L==="cs"?`Začít sezónu ${p.season+1} →`:`Start Season ${p.season+1} →`));

  app.append(body);
  return;
}
