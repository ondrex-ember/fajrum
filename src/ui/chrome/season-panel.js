// season-panel.js — season panel (situation report, furnace HUD, fame).
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderSeasonPanel(ctx){
  const {isP,p,L,md,isC,ft,fEff,isDesktop}=ctx;
  // Sezónní kontext panel — vždy viditelný
  // ── SEASON PANEL — 2 sloupce 60:40 ───────────────────────
  // SitRep: kritické věci dle fáze (max 4 položky)
  const sitRep=[];
  if(isP){
    if(p.res.wood<10) sitRep.push({warn:true, text:`🪵 ${L==="cs"?"Málo dřeva":"Low wood"}: ${p.res.wood}`});
    if(p.pReady<2&&p.pAging.length<2) sitRep.push({warn:true, text:`🏺 ${L==="cs"?"Málo pánví":"Low crucibles"}: ${p.pReady}`});
    if(p.res.potash<4) sitRep.push({warn:p.res.potash<2, text:`🌿 ${L==="cs"?"Potaš":"Potash"}: ${p.res.potash}`});
    if(p.res.sand<6) sitRep.push({warn:p.res.sand<3, text:`🏖️ ${L==="cs"?"Písek":"Sand"}: ${p.res.sand}`});
    if(p.round===PREP-1) sitRep.push({warn:false, text:`⛽ ${L==="cs"?"Zásoby paliva na kampaň!":"Stock fuel for campaign!"}`});
    if(p.res.food<3) sitRep.push({warn:true, text:`🍞 ${L==="cs"?"Jídlo":"Food"}: ${p.res.food}`});
  }else{
    {const fNeed=fuelNeedPerRound(p.round,ft), fGot=Math.floor((p.res.wood||0)*p.wa.fuel/100);
     if(fGot<fNeed&&(p.res.wood||0)>=fNeed) sitRep.push({warn:true,
       text:`🔥 ${L==="cs"?`Palivo: při podílu ${p.wa.fuel} % vyjde ${fGot} 🪵, pec potřebuje ${fNeed} → zvyš podíl Palivo`:`Fuel: ${p.wa.fuel}% share gives ${fGot} 🪵, furnace needs ${fNeed} → raise the Fuel share`}`});}
    if(!p.fActive) sitRep.push({warn:true, text:`🔥 ${L==="cs"?"Pec nehoří! Přidej palivo.":"Furnace out! Add fuel."}`});
    if(p.fTemp>85) sitRep.push({warn:true, text:`⚠️ ${L==="cs"?"Přetopeno! Ubeř palivo.":"Overheated! Reduce fuel."}`});
    if(p.pReady<1) sitRep.push({warn:true, text:`🏺 ${L==="cs"?"Žádné pánve! Tavení stojí.":"No crucibles! Halted."}`});
    if(p.res.sand<3) sitRep.push({warn:true, text:`🏖️ ${L==="cs"?"Dochází písek":"Low sand"}: ${p.res.sand}`});
    if(p.res.potash<2) sitRep.push({warn:true, text:`🌿 ${L==="cs"?"Dochází potaš":"Low potash"}: ${p.res.potash}`});
    if(p.res.wood<8) sitRep.push({warn:true, text:`🪵 ${L==="cs"?"Málo dřeva":"Low wood"}: ${p.res.wood}`});
  }
  // Dřevo a potaš: přebytek potaše = zbytečně spálené dřevo; hvozd je konečný
  if(p.res.potash>=12&&p.wa.potash>=30) sitRep.push({warn:false,
    text:`🌿 ${L==="cs"?`Potaše máš na ${Math.floor(p.res.potash/2)} várek — dřevo se jen mění v nepotřebnou potaš → sniž podíl Potaš nebo přesuň dělníka z Loužírny`:`Potash for ${Math.floor(p.res.potash/2)} batches in stock — wood is just turning into unneeded potash → lower the Potash share or move the worker off Potash`}`});
  if(p.forest<=20) sitRep.push({warn:p.forest<=8,
    text:`🌲 ${L==="cs"?`Hvozd: zbývá ${p.forest} parcel (1 parcela = 4 🪵) → nekácej do zásoby, pošli dělníka na Výsadbu`:`Forest: ${p.forest} parcels left (1 parcel = 4 🪵) → stop logging into stock, send a worker to Reforest`}`});
  if(p.morale<35) sitRep.push({warn:true, text:`😟 ${L==="cs"?"Nálada kritická":"Morale critical"}: ${p.morale}%`});

  // Blokátory — co brání dělníkům pracovat
  p.workers.forEach(w=>{
    if(w.task==="formar"){
      if(!p.res.formy||p.res.formy<1) sitRep.push({warn:true,
        text:`🌳 ${w.name.split(" ")[0]}: ${L==="cs"?"Formař nemá formy — vyrobit formy":"Formař has no moulds"}`,
        action:L==="cs"?"→ Přiřaď jiného dělníka na Formař (vyrobí formy)":"→ Assign worker to Mould task"});
      if(!p.res.water||p.res.water<1) sitRep.push({warn:true,
        text:`💧 ${w.name.split(" ")[0]}: ${L==="cs"?"Chybí voda pro formy":"Missing water for moulds"}`});
    }
    if(w.task==="panev"&&(!p.res.clay||p.res.clay<4)) sitRep.push({warn:true,
      text:`🧱 ${w.name.split(" ")[0]}: ${L==="cs"?"Pánvař — málo jílu (${p.res.clay||0}<4)":"Crucible — low clay"}`,
      action:L==="cs"?"→ Pošli dělníka na Lůmek (těžba jílu)":"→ Send worker to quarry for clay"});
    if(w.task==="potash"&&(p.res.wood||0)<6) sitRep.push({warn:false,
      text:`🌿 ${w.name.split(" ")[0]}: ${L==="cs"?"Loužírna — málo dřeva (${p.res.wood||0}<6)":"Potash — low wood"}`});
  });
  // Neprodané zboží
  const unsold=(p.waldglas?.length||0)+(p.crystal?.length||0)+(p.colorGlass?.length||0);
  if(unsold>3&&p.grose<10) sitRep.push({warn:true,
    text:`💰 ${L==="cs"?`${unsold}× neprodané sklo — pokladna: ${p.grose}g`:`${unsold}× unsold glass — cash: ${p.grose}g`}`,
    action:L==="cs"?"→ Jdi na Trh a prodej zásoby":"→ Go to Market and sell stock"});

  const sp=h("div",{class:"season-panel",style:{padding:"0"}});
  const spGrid=h("div",{style:{display:"flex",alignItems:"stretch",minHeight:"0"}});

  // Levý sloupec 60% — season info + SitRep
  const colL=h("div",{style:{flex:"6",padding:"8px 10px 8px 14px",borderRight:"1px solid rgba(42,26,10,.12)",minWidth:0}});
  colL.append(
    h("div",{class:"season-panel-top"},
      h("span",{class:"season-icon"},md.icon),
      h("div",null,
        h("div",{class:"season-phase"},L==="cs"?md.phase_cs:md.phase_en),
        h("div",{class:"season-priority"},L==="cs"?md.priority_cs:md.priority_en))),
    h("div",{class:"season-tip"},L==="cs"?md.tip_cs:md.tip_en),
    h("div",{class:"season-trh",style:{color:MARKET_CLOSED[p.round]?"#a03020":"#4a7a3a"}},
      L==="cs"?md.trh_cs:md.trh_en));
  // SitRep pod season info
  if(sitRep.length>0){
    const srDiv=h("div",{style:{marginTop:"5px",paddingTop:"5px",borderTop:"1px solid rgba(42,26,10,.08)"}});
    sitRep.slice(0,4).forEach(item=>{
      srDiv.append(h("div",{style:{fontSize:"10px",color:item.warn?"#a03020":"#8b5e34",
        lineHeight:"1.5"}},item.text));
    });
    colL.append(srDiv);
  }else{
    colL.append(h("div",{style:{marginTop:"5px",paddingTop:"5px",borderTop:"1px solid rgba(42,26,10,.08)",
      fontSize:"10px",color:"#4a7a3a",fontStyle:"italic"}},
      L==="cs"?"✅ Vše v pořádku":"✅ All clear"));
  }

  // Pravý sloupec 40% — furnHud + bars
  const colR=h("div",{style:{flex:"4",minWidth:0,display:"flex",flexDirection:"column",justifyContent:"center"}});

  // furnHud — typ pece nahoře vlevo, pak teplota + metriky
  const furnHud=h("div",{class:"furnace-hud",style:{borderBottom:"1px solid rgba(42,26,10,.08)",padding:"4px 8px",flexDirection:"column",alignItems:"stretch",gap:"3px"}});
  const tempColor=zone(p.fTemp).c;
  const tempLabel=isC&&p.fActive?`${p.fTemp}%`:isP&&p.round===PREP-1?(L==="cs"?"Temperování":"Tempering"):isC&&p.round===PREP?(L==="cs"?"Rozžíháme":"Lighting"):(L==="cs"?"Chladí":"Cold");
  furnHud.append(
    h("div",{style:{fontSize:"10px",color:"#c9952b",fontWeight:"600"}},L==="cs"?ft.name:ft.nameEn),
    h("div",{style:{display:"flex",alignItems:"center",gap:"6px"}},
      h("div",{class:"furnace-temp-big",style:{color:isC&&p.fActive?tempColor:"#8b5e34",fontSize:"18px",lineHeight:"1",flexShrink:0}},
        isC&&p.fActive?zone(p.fTemp).l:"🔥"),
      h("div",{class:"furnace-details",style:{flex:1,minWidth:0}},
        h("div",{class:"furnace-hud-row",style:{marginBottom:"2px"}},
          h("span",{style:{fontWeight:"700",fontSize:"11px",color:isC&&p.fActive?tempColor:"#8b5e34"}},tempLabel),
          h("span",{style:{marginLeft:"5px",fontSize:"10px"}},`eff ${fEff}%`)),
        h("div",{class:"furnace-hud-row",style:{fontSize:"10px",color:"#8b5e34",marginBottom:"2px"}},
          h("span",{},`${L==="cs"?"zaběh.":"run-in"} ${p.furnace.runIn}%`),
          h("span",{style:{marginLeft:"5px",color:p.furnace.shamotWear>70?"#a03020":"#8b5e34"}},`${L==="cs"?"šamot":"shamot"} ${p.furnace.shamotWear}%`)),
        h("div",{style:{display:"flex",gap:"2px"}},
          ...ZONES.map(z2=>h("div",{style:{
            flex:1,height:"3px",borderRadius:"2px",
            background:p.fTemp>=(z2.max-12)?z2.c:"rgba(0,0,0,.08)"}}))))));

  // bars
  const bars=h("div",{style:{padding:"4px 14px 4px 10px",display:"flex",gap:"6px",alignItems:"center"}});
  bars.append(
    h("div",{style:{flex:1}},
      h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"2px"}},`${L==="cs"?"Nálada":"Morale"} ${p.morale}`),
      bar(p.morale,100,p.morale>60?"#4a7a3a":p.morale>35?"#c9952b":"#a03020")),
    h("div",{style:{flex:1}},
      h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"2px"}},`🔥 eff ${fEff}%`),
      bar(fEff,100,fEff>65?"#4a7a3a":fEff>45?"#c9952b":"#a03020")),
    h("div",{style:{flex:1}},
      h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"2px"}},`🌲 ${p.forest}/${p.forestMax||INIT_FOREST}`),
      bar(p.forest,p.forestMax||INIT_FOREST,p.forest>12?"#3a6a2a":p.forest>6?"#c9952b":"#a03020")));
  if(p.debt>0||liabilities(p).crew>0)bars.append(h("div",{style:{fontSize:"10px",color:"#a03020",alignSelf:"center",whiteSpace:"nowrap"}},(p.debt>0?"📜"+p.debt+"g":"")+(liabilities(p).crew>0?" 👥"+liabilities(p).crew+"g":"")));

  // Reputace mini-widget
  const fama=p.fama||{church:0,noble:0,trade:0};
  const repCats=["church","noble","trade"];
  const famaWidget=h("div",{style:{padding:"3px 10px 4px 10px",borderTop:"1px solid rgba(42,26,10,.08)"}});
  famaWidget.append(h("div",{style:{fontSize:"9px",color:"#8b5e34",fontWeight:"600",marginBottom:"3px",letterSpacing:"0.5px"}},
    (L==="cs"?"+ REPUTACE":"+ REPUTATION")));
  repCats.forEach(cat=>{
    const val=fama[cat]||0;
    const icon=FAMA_ICON[cat];
    const label=L==="cs"?FAMA_LABEL_CS[cat]:FAMA_LABEL_EN[cat];
    const color=val>=65?"#4a7a3a":val>=35?"#c9952b":"#8b5e34";
    // Aktivní reputační zakázka pro tuto kategorii
    const activeRep=(p.repContracts||[]).find(r=>r.cat===cat);
    // Endgame zakázka dostupná ale nezačatá?
    const eg=ENDGAME_CONTRACTS[cat];
    const egAvail=eg&&val>=eg.minFama&&!(p.endgame||{})[cat]&&!(p.repContracts||[]).find(r=>r.id===eg.id);
    let hintText="—";
    if(egAvail) hintText=(L==="cs"?"⚠️ ENDGAME dostupný":"⚠️ ENDGAME available");
    else if(activeRep) hintText=(L==="cs"?activeRep.cs:activeRep.en).substring(0,28)+"…";
    const row=h("div",{style:{display:"flex",alignItems:"center",gap:"4px",marginBottom:"2px",fontSize:"9px"}});
    const barW=54;
    const filled=Math.round((val/FAMA_MAX)*barW);
    const barEl=document.createElement("div");
    barEl.innerHTML=`<div style="width:${barW}px;height:4px;background:rgba(0,0,0,.1);border-radius:2px;flex-shrink:0;display:inline-block;vertical-align:middle"><div style="width:${filled}px;height:4px;background:${color};border-radius:2px"></div></div>`;
    row.append(
      h("span",{style:{width:"13px",textAlign:"center",flexShrink:0}},icon),
      barEl.firstChild,
      h("span",{style:{color,fontWeight:"600",width:"22px",flexShrink:0}},val+"%"),
      h("span",{style:{color:"#8b5e34",overflow:"hidden",whiteSpace:"nowrap",maxWidth:"90px",textOverflow:"ellipsis"}},hintText)
    );
    famaWidget.append(row);
  });
  colR.append(furnHud,bars,famaWidget);
  spGrid.append(colL,colR);
  sp.append(spGrid);
  if(isDesktop)app.append(sp);

  // Varování: les kriticky nízko
  if(p.forest<=FOREST_WARN){
    app.append(h("div",{style:{padding:"4px 14px",background:p.forest===0?"rgba(160,48,32,.15)":"rgba(201,149,43,.1)",
      borderBottom:"1px solid rgba(42,26,10,.15)",fontSize:"11px",
      color:p.forest===0?"#a03020":"#8b3a00",flexShrink:0}},
      p.forest===0
        ?(L==="cs"?"⚠️ Hvozd vyčerpán! Nakup dřevo u Weisse nebo sázej stromy.":"⚠️ Forest depleted!")
        :(L==="cs"?`⚠️ Les téměř vyčerpán — ${p.forest} parcel.`:`⚠️ Forest nearly gone — ${p.forest} parcels.`)));
  }
  return {sp,sitRep};
}
