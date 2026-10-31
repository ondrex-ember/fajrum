// hrac.js — tab "hrac".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabHrac(ctx){
  const {L,p,content}=ctx;
  const hracSec=h("div",{class:"sec"});
  hracSec.append(h("div",{class:"sec-title"},"📓 "+(L==="cs"?"Deník — Tomislav Břeťánek":"Journal — Tomislav Břeťánek")));


  // Určení aktuálního ranku
  const hracGrose=p.grose||0;
  const hracSeason=p.season||1;
  let currentRankIdx=0;
  HRAC_RANKS.forEach((r,i)=>{
    if(hracSeason>=r.minSeason&&hracGrose>=r.minGrose)currentRankIdx=i;
  });
  const currentRank=HRAC_RANKS[currentRankIdx];
  const nextRank=HRAC_RANKS[currentRankIdx+1]||null;

  // ── Identita karta ──
  const idCard=h("div",{class:"fj-player-id",style:{padding:"12px",borderRadius:"8px",
    border:"1px solid rgba(201,149,43,.3)",background:"rgba(201,149,43,.05)",
    marginBottom:"12px",display:"flex",gap:"12px",alignItems:"flex-start"}});

  // Portrait artwork is applied without changing the active rank or its symbol.
  const portrait=h("div",{class:"fj-player-portrait","data-rank-label":L==="cs"?currentRank.cs:currentRank.en,style:{width:"60px",height:"60px",flexShrink:"0",
    borderRadius:"6px",background:"rgba(42,26,10,.15)",border:"1px solid rgba(139,94,52,.3)",
    display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px"}});
  portrait.textContent=currentRank.icon;
  idCard.append(portrait);

  const idInfo=h("div",{style:{flex:1}});
  idInfo.append(
    h("div",{style:{fontSize:"15px",fontWeight:"700",color:"#3a2a14",marginBottom:"2px"}},
      "Tomislav Břeťánek"),
    h("div",{style:{fontSize:"12px",color:"#c9952b",fontWeight:"700",marginBottom:"4px"}},
      L==="cs"?currentRank.cs:currentRank.en),
    h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic",lineHeight:"1.4"}},
      L==="cs"?currentRank.desc_cs:currentRank.desc_en));
  idCard.append(idInfo);
  hracSec.append(idCard);

  const abilText=RANK_ABILITIES[currentRank.id]?.[L]||"";
  const abilDiv=h("div",{style:{marginBottom:"12px",padding:"8px 10px",borderRadius:"6px",
    background:"rgba(74,122,58,.06)",border:"1px solid rgba(74,122,58,.18)"}});
  abilDiv.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#4a7a3a",marginBottom:"5px"}},
    L==="cs"?"⚙️ Aktivní schopnosti:":"⚙️ Active abilities:"));
  abilText.split("\n").forEach(line=>{
    abilDiv.append(h("div",{style:{fontSize:"10px",color:"#3a2a14",lineHeight:"1.5"}},line));
  });
  hracSec.append(abilDiv);

  // ── Progress k dalšímu ranku ──
  if(nextRank){
    const progDiv=h("div",{style:{marginBottom:"12px",padding:"8px",borderRadius:"6px",
      background:"rgba(42,26,10,.04)",border:"1px solid rgba(42,26,10,.08)"}});
    progDiv.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"6px"}},
      L==="cs"?"📈 Postup k dalšímu ranku:":"📈 Progress to next rank:"));

    // Sezóna progress
    const seaDone=hracSeason>=nextRank.minSeason;
    const seaBar=Math.min(1,hracSeason/nextRank.minSeason);
    progDiv.append(h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"9px",
      color:seaDone?"#4a7a3a":"#8b5e34",marginBottom:"2px"}},
      L==="cs"?`${seaDone?"✅":"⏳"} Sezóna: ${hracSeason}/${nextRank.minSeason}`
               :`${seaDone?"✅":"⏳"} Season: ${hracSeason}/${nextRank.minSeason}`,
      seaDone?(L==="cs"?"splněno":"done"):""));
    const seaBarDiv=h("div",{style:{height:"4px",borderRadius:"2px",background:"rgba(42,26,10,.1)",marginBottom:"6px"}});
    seaBarDiv.append(h("div",{style:{height:"100%",borderRadius:"2px",width:`${Math.round(seaBar*100)}%`,
      background:seaDone?"#4a7a3a":"#c9952b",transition:"width .3s"}}));
    progDiv.append(seaBarDiv);

    // Groše progress
    const groDone=hracGrose>=nextRank.minGrose;
    const groBar=Math.min(1,hracGrose/nextRank.minGrose);
    progDiv.append(h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"9px",
      color:groDone?"#4a7a3a":"#8b5e34",marginBottom:"2px"}},
      L==="cs"?`${groDone?"✅":"💰"} Groše: ${hracGrose}/${nextRank.minGrose}g`
               :`${groDone?"✅":"💰"} Groschen: ${hracGrose}/${nextRank.minGrose}g`,
      groDone?(L==="cs"?"splněno":"done"):""));
    const groBarDiv=h("div",{style:{height:"4px",borderRadius:"2px",background:"rgba(42,26,10,.1)"}});
    groBarDiv.append(h("div",{style:{height:"100%",borderRadius:"2px",width:`${Math.round(groBar*100)}%`,
      background:groDone?"#4a7a3a":"#c9952b",transition:"width .3s"}}));
    progDiv.append(groBarDiv);

    if(seaDone&&groDone){
      progDiv.append(h("div",{style:{marginTop:"6px",fontSize:"10px",color:"#4a7a3a",fontWeight:"700",
        textAlign:"center"}},
        `🎉 ${L==="cs"?"Postup na "+((L==="cs"?nextRank.cs:nextRank.en))+" odemčen!":"Rank up to "+(nextRank.en)+" unlocked!"}`));
    }

    hracSec.append(progDiv);
  }else{
    hracSec.append(h("div",{style:{padding:"8px",borderRadius:"6px",
      background:"rgba(201,149,43,.08)",border:"1px solid rgba(201,149,43,.2)",
      fontSize:"11px",color:"#c9952b",fontWeight:"700",textAlign:"center",marginBottom:"12px"}},
      L==="cs"?"🏆 Velmistr — nejvyšší dosažitelný rank. Jméno Břeťánek žije v legendě.":"🏆 Glasmaster — the highest achievable rank. The Břeťánek name lives in legend."));
  }

  // ── Ranky timeline ──
  const timelineDiv=h("div",{style:{marginBottom:"12px"}});
  timelineDiv.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",
    marginBottom:"6px",borderBottom:"1px solid rgba(139,94,52,.15)",paddingBottom:"3px"}},
    L==="cs"?"🗺️ Cesta Tomislava Břeťánka:":"🗺️ Tomislav Břeťánek's path:"));
  HRAC_RANKS.forEach((r,i)=>{
    const done=i<=currentRankIdx;
    const isCurrent=i===currentRankIdx;
    const row=h("div",{style:{display:"flex",gap:"8px",alignItems:"flex-start",
      padding:"5px 6px",borderRadius:"4px",marginBottom:"2px",
      background:isCurrent?"rgba(201,149,43,.08)":"transparent",
      border:isCurrent?"1px solid rgba(201,149,43,.2)":"1px solid transparent",
      opacity:done?1:.45}});
    row.append(h("span",{style:{fontSize:"13px",flexShrink:"0"}},r.icon));
    const rTxt=h("div",{style:{flex:1}});
    rTxt.append(
      h("div",{style:{fontSize:"10px",fontWeight:"700",color:isCurrent?"#c9952b":"#3a2a14"}},
        (done&&!isCurrent?"✓ ":"")+(L==="cs"?r.cs:r.en)+
        (isCurrent?(L==="cs"?" ← aktuálně":" ← current"):""),
      ),
      h("div",{style:{fontSize:"9px",color:"#8b6a3a",fontStyle:"italic"}},
        L==="cs"?r.desc_cs:r.desc_en),
      h("div",{style:{fontSize:"9px",color:"rgba(139,94,52,.6)",marginTop:"1px"}},
        `${L==="cs"?"od sez.":"from s."}${r.minSeason} · ${r.minGrose}g`));
    row.append(rTxt);
    timelineDiv.append(row);
  });
  hracSec.append(timelineDiv);

  // ── Statistiky ──
  const statDiv=h("div",{style:{padding:"8px",borderRadius:"6px",
    background:"rgba(42,26,10,.04)",border:"1px solid rgba(42,26,10,.08)"}});
  statDiv.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"6px"}},
    L==="cs"?"📊 Statistiky hutě:":"📊 Foundry statistics:"));
  const stats=[
    {icon:"💰",label_cs:"Celkové groše",label_en:"Total groschen",val:`${hracGrose}g`},
    {icon:"🗓️",label_cs:"Sezóna",label_en:"Season",val:hracSeason},
    {icon:"🔥",label_cs:"Várky odtaveny",label_en:"Batches smelted",val:p.totalBatches||0},
    {icon:"📦",label_cs:"Výrobků prodáno",label_en:"Items sold",val:p.totalSold||0},
    {icon:"💀",label_cs:"Prasknuté pánve",label_en:"Cracked crucibles",val:p.totalCracks||0},
    {icon:"🌲",label_cs:"Parcely lesa",label_en:"Forest parcels",val:`${p.forest||0}/200`},
  ];
  const statGrid=h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}});
  stats.forEach(s=>{
    statGrid.append(h("div",{style:{display:"flex",gap:"4px",alignItems:"center",
      padding:"3px 5px",background:"rgba(255,255,255,.04)",borderRadius:"3px"}},
      h("span",{style:{fontSize:"11px"}},s.icon),
      h("div",null,
        h("div",{style:{fontSize:"8px",color:"#8b6a3a"}},L==="cs"?s.label_cs:s.label_en),
        h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#3a2a14"}},s.val))));
  });
  statDiv.append(statGrid);
  hracSec.append(statDiv);

  content.append(hracSec);
}
