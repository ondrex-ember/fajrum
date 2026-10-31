function renderSeasonUpgrades(container, isInterseason=false){
  const p=G, L=p.lang;
  const curTier=p.seasonTier||0;
  const curInfo=SEASON_TIERS[curTier];

  const panel=h("div",{
    class:"sec fj-season-upgrades",
    style:{
      marginTop:"14px",
      background:"linear-gradient(135deg, rgba(201,149,43,.06) 0%, rgba(139,94,52,.04) 100%)",
      border:"1px solid rgba(201,149,43,.25)",
      borderRadius:"6px",
      padding:"12px"
    }
  });

  // Title & Header
  const hdr=h("div",{class:"fj-season-upgrades-head",
    style:{
      display:"flex",
      justifyContent:"space-between",
      alignItems:"flex-start",
      borderBottom:"1px solid rgba(201,149,43,.2)",
      paddingBottom:"8px",
      marginBottom:"10px",
      flexWrap:"wrap",
      gap:"6px"
    }
  });
  
  const titleBox=h("div",{class:"fj-season-upgrades-title"},
    h("div",{style:{fontSize:"13px",fontWeight:"700",color:"#8b5e34",display:"flex",alignItems:"center",gap:"6px"}},
      "🏛️ "+(L==="cs"?"Stavební rozvoj & Rozšíření sezóny":"Building Expansion & Season Tiers")),
  	h("div",{style:{fontSize:"11px",color:"#543714",marginTop:"2px"}},
  	(L==="cs"?"Aktuální kampaň: ":"Current schedule: "),
  	h("strong",{style:{color:"#8b5e34"}},
    `${curInfo.badge} — ${L==="cs"?curInfo.name_cs:curInfo.name_en}`),
  	" ",
  	h("span",{style:{color:"#4a7a3a",fontWeight:"600"}},
    `(${L==="cs"?curInfo.months_cs:curInfo.months_en})`)
	)
  );

  const badge=h("span",{
    style:{
      background:curTier>=3?"#8a1a1a":curTier>=1?"#4a7a3a":"#8b5e34",
      color:"#fff",
      fontSize:"10px",
      fontWeight:"700",
      padding:"3px 9px",
      borderRadius:"10px",
      whiteSpace:"nowrap"
    }
  }, `Tier ${curTier}/3`);

  hdr.append(titleBox, badge);
  panel.append(hdr);

  // Motivational Info Box
  panel.append(h("div",{class:"fj-season-upgrades-intro",
    style:{
      fontSize:"10px",
      color:"#8b5e34",
      fontStyle:"italic",
      background:"rgba(255,255,255,.5)",
      padding:"6px 8px",
      borderRadius:"4px",
      marginBottom:"10px",
      border:"1px solid rgba(201,149,43,.15)",
      lineHeight:"1.4"
    }
  }, L==="cs"
    ? "💡 Rozšiřování provozu huti umožňuje vyrábět a prodávat sklo i mimo tradiční letní měsíce. Každý nový Tier přináší nové stavební suroviny (lomový kámen, suché dříví, šamotové kvádry, smůlu), vyšší tržby a udržuje zaběhnutost pece."
    : "💡 Extending the foundry season unlocks production and sales outside traditional summer months. Each Tier introduces new building materials (quarry stone, dry wood, firebricks, pitch), higher profits, and better furnace retention."));

  // Tiers Grid
  const tiersList=h("div",{class:"fj-season-tier-list",style:{display:"flex",flexDirection:"column",gap:"8px"}});

  [1, 2, 3].forEach(tNum=>{
    const info=SEASON_TIERS[tNum];
    const isCurrentOrPast=curTier>=tNum;
    const isNext=curTier===(tNum-1);
    const isLocked=curTier<(tNum-1);

    const tCard=h("div",{class:"fj-season-tier-card",
      "data-tier-state":isCurrentOrPast?"completed":isNext?"available":"locked",
      style:{
        background:isCurrentOrPast?"rgba(74,122,58,.06)":isNext?"rgba(255,255,255,.7)":"rgba(0,0,0,.02)",
        border:`1px solid ${isCurrentOrPast?"rgba(74,122,58,.3)":isNext?"rgba(201,149,43,.4)":"rgba(0,0,0,.08)"}`,
        borderRadius:"5px",
        padding:"9px 11px",
        opacity:isLocked?0.55:1
      }
    });

    // Card Header
    const tHeader=h("div",{class:"fj-season-tier-header",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}});
    tHeader.append(
      h("div",{style:{display:"flex",alignItems:"center",gap:"6px"}},
        h("span",{style:{fontSize:"15px"}},info.icon),
        h("strong",{style:{fontSize:"11px",color:isCurrentOrPast?"#4a7a3a":"#3a2a14"}},
          `Tier ${tNum}: ${L==="cs"?info.name_cs:info.name_en}`
        )
      ),
      h("span",{
        style:{
          fontSize:"9px",
          fontWeight:"700",
          color:isCurrentOrPast?"#4a7a3a":isNext?"#c9952b":"#888"
        }
      }, isCurrentOrPast?(L==="cs"?"✓ DOKONČENO":"✓ ACTIVE"):isNext?(L==="cs"?"🔓 PŘIPRAVENO":"🔓 AVAILABLE"):(L==="cs"?"🔒 UZAMČENO":"🔒 LOCKED"))
    );
    tCard.append(tHeader);

    // Description & Months
    tCard.append(h("div",{class:"fj-season-tier-description",style:{fontSize:"10px",color:"#543714",marginBottom:"4px",lineHeight:"1.35"}},
      L==="cs"?info.desc_cs:info.desc_en
    ));

    // Benefits Highlight
    tCard.append(h("div",{class:"fj-season-tier-benefit",
      style:{
        fontSize:"9px",
        color:"#4a7a3a",
        fontWeight:"600",
        background:"rgba(74,122,58,.08)",
        padding:"4px 7px",
        borderRadius:"3px",
        marginBottom:"6px"
      }
    }, "⭐ "+(L==="cs"?info.benefit_cs:info.benefit_en)));

    if(!isCurrentOrPast){
      // Requirements & Costs
      const missing=[];
      const furn=p.furnace.type;
      if(info.reqFurnace==="stone" && furn==="primitive"){
        missing.push(L==="cs"?"Zděná pec (v Peci)":"Stone furnace");
      }
      if(info.reqFurnace==="master" && furn!=="master"){
        missing.push(L==="cs"?"Mistrovská pec (v Peci)":"Master furnace");
      }
      if(info.reqFama){
        const curMaxFama=Math.max(p.fama?.church||0, p.fama?.noble||0, p.fama?.trade||0);
        if(curMaxFama<info.reqFama){
          missing.push(L==="cs"?`Fama ≥ ${info.reqFama}% (${curMaxFama}%)`:`Fama ≥ ${info.reqFama}% (${curMaxFama}%)`);
        }
      }

      const costLabels={
        stone: {cs:"Lomový kámen", en:"Stone", icon:"🪨"},
        wood: {cs:"Dřevo", en:"Wood", icon:"🪵"},
        clay: {cs:"Jíl", en:"Clay", icon:"🧱"},
        dryWood: {cs:"Suché dříví", en:"Dry hardwood", icon:"🔥"},
        firebrick: {cs:"Šamotové kvádry", en:"Firebrick", icon:"🧱"},
        pitch: {cs:"Smůla", en:"Pitch", icon:"🌲"},
        grose: {cs:"Groše", en:"Groats", icon:"💰"}
      };

      const costChips=h("div",{class:"fj-season-tier-costs",style:{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"6px"}});
      let canAfford=isNext && missing.length===0;

      for(const [resKey, needed] of Object.entries(info.cost)){
        const have=resKey==="grose"?p.grose:(p.res[resKey]||0);
        const ok=have>=needed;
        if(!ok){
          canAfford=false;
          missing.push(`${needed-have}× ${costLabels[resKey]?costLabels[resKey].icon:""}`);
        }
        costChips.append(h("span",{class:"fj-season-tier-cost "+(ok?"is-sufficient":"is-missing"),
          style:{
            fontSize:"9px",
            padding:"2px 6px",
            borderRadius:"3px",
            background:ok?"rgba(74,122,58,.1)":"rgba(160,48,32,.08)",
            color:ok?"#4a7a3a":"#a03020",
            border:`1px solid ${ok?"rgba(74,122,58,.2)":"rgba(160,48,32,.2)"}`
          }
        }, `${costLabels[resKey]?costLabels[resKey].icon:""} ${have}/${needed} ${L==="cs"?(costLabels[resKey]?.cs||resKey):(costLabels[resKey]?.en||resKey)}`));
      }
      tCard.append(costChips);

      // Upgrade Action Button
      if(isNext){
        const btn=h("button",{
          class:"btn btn-s fj-season-upgrade-action "+(canAfford?"is-ready btn-p":"is-blocked"),
          style:{
            width:"100%",
            opacity:canAfford?1:0.6,
            cursor:canAfford?"pointer":"not-allowed",
            fontWeight:"700",
            fontSize:"10px",
            padding:"6px 8px"
          },
          onClick:()=>{
            if(canAfford) upgradeSeasonTier(tNum);
          }
        }, canAfford
          ? (tNum===1?(L==="cs"?"🔨 Postavit zastřešení a sušárnu (Tier 1)":"🔨 Build Roofed Foundry (Tier 1)")
            :tNum===2?(L==="cs"?"📜 Získat panské privilegium (Tier 2)":"📜 Concession Charter (Tier 2)")
            :(L==="cs"?"👑 Povýšit na celoroční huť (Tier 3)":"👑 Upgrade to All-Year Glasshouse (Tier 3)"))
          : (L==="cs"?`⚠️ Chybí požadavky (${missing.slice(0,2).join(", ")})`:`⚠️ Missing requirements`)
        );
        tCard.append(btn);
      }
    }

    tiersList.append(tCard);
  });

  panel.append(tiersList);
  container.append(panel);
}

