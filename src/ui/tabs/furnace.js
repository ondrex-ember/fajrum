// furnace.js — tab "furnace".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabFurnace(ctx){
  const {p,isP,isC,L,ft,fEff,content,isDesktop}=ctx;
  const z=zone(p.fTemp);
  const tempColor=z.c;
  const isTempering=isTemperingMonth(p.round,p.seasonTier||0);
  const isCooling=isP&&p.fTemp>10;
  const tempLabel=[
    {max:10,cs:"Studená · topeniště mlčí",en:"Cold · hearth is silent"},
    {max:25,cs:"Tmavý žár · ~600°C",en:"Dark heat · ~600°C"},
    {max:40,cs:"Třešňová červeň · ~800°C · temperování",en:"Cherry red · ~800°C · tempering"},
    {max:55,cs:"Jasný oranž · ~1000°C",en:"Bright orange · ~1000°C"},
    {max:68,cs:"Žlutý žár · ~1100°C · sklovina začíná tát",en:"Yellow heat · ~1100°C · glass begins to melt"},
    {max:80,cs:"✅ TAVICÍ ŽÁR · ~1250°C · pracovní teplota",en:"✅ MELT HEAT · ~1250°C · working temperature"},
    {max:90,cs:"Bílý žár · ~1350°C · dotavení",en:"White heat · ~1350°C · refining"},
    {max:100,cs:"⚠️ PŘETOPENO! · ~1450°C+ · Pánev praskne!",en:"⚠️ OVERHEATED! · ~1450°C+ · Crucible will crack!"}
  ].find(t=>p.fTemp<=t.max)||{cs:"⚠️ PŘETOPENO!",en:"⚠️ OVERHEATED!"};

  // Pec dashboard — středověký styl
  const dash=h("div",{class:"furnace-dash"});

  // Teplotní gauge — svislé pruhy jako organové píšťaly
  const gaugeWrap=h("div",null);
  // Teplota nad gauge — řádek s labelm a číslem
  if(p.fTemp>0||isC){
    const tempRow=h("div",{style:{display:"flex",justifyContent:"space-between",
      alignItems:"center",marginBottom:"4px",fontSize:"9px",color:"#6a4a2a"}});
    tempRow.append(
      h("span",{style:{letterSpacing:"1px",textTransform:"uppercase",opacity:.7}},
        L==="cs"?"Teplota":"Temp."),
      h("span",{style:{fontWeight:"700",letterSpacing:"1px",
        color:isC&&p.fActive?zone(p.fTemp).c:"#8b5e34"}},
        p.fTemp+"%"));
    gaugeWrap.append(tempRow);
  }
  const gaugeInner=h("div",{class:"furnace-temp-gauge",style:{position:"relative"}});
  const activeZones=ZONES.filter(z2=>p.fTemp>=z2.max-(ZONES.indexOf(z2)===0?10:12));
  ZONES.forEach((z2,i)=>{
    const active=p.fTemp>=z2.max-(i===0?10:12);
    const isLast=active&&(i===ZONES.length-1||!( p.fTemp>=(ZONES[i+1]?.max-12)));
    const heightPct=active?30+i*10:5;
    const barEl=h("div",{class:"gauge-bar",style:{
      height:heightPct+"%",
      background:active?z2.c:"rgba(255,255,255,.06)",
      position:"relative"}});
    if(isLast&&p.fTemp>0){
      const lbl=document.createElement("div");
      lbl.style.cssText="position:absolute;bottom:100%;left:50%;transform:translateX(-50%);font-size:8px;font-weight:700;color:"+z2.c+";white-space:nowrap;padding-bottom:1px;";
      lbl.textContent=p.fTemp+"%";
      barEl.appendChild(lbl);
    }
    gaugeInner.append(barEl);
  });
  gaugeWrap.append(gaugeInner);
  dash.append(gaugeWrap);

  // Teplota readout + SVG kruh — 2 sloupce: kruh vlevo, info vpravo
  (()=>{
    const active=isC&&p.fActive;
    const temp=p.fTemp;
    const meltColors=(()=>{
      if(!active||temp<5)  return {c1:"#1a1208",c2:"#2a1a0a",c3:"#0e0906",glow:"none",speed:0};
      // Základní teplotní barvy (waldglas/křišťál)
      const spBase=(()=>{
        if(temp<20)  return {c1:"#3a1a08",c2:"#1e0e04",c3:"#2a1208",glow:"#4a1a08",speed:8};
        if(temp<35)  return {c1:"#6a1a08",c2:"#3a0e04",c3:"#8a2010",glow:"#6a1a08",speed:6};
        if(temp<50)  return {c1:"#a03010",c2:"#6a1808",c3:"#c04018",glow:"#a03010",speed:4.5};
        if(temp<65)  return {c1:"#c06020",c2:"#a04010",c3:"#e08030",glow:"#c05020",speed:3.2};
        if(temp<78)  return {c1:"#d49020",c2:"#b07010",c3:"#f0b030",glow:"#d08020",speed:2.2};
        if(temp<88)  return {c1:"#e8c030",c2:"#c09820",c3:"#fff0a0",glow:"#e8c030",speed:1.5};
        return       {c1:"#fff8c0",c2:"#ffe080",c3:"#ffffff",glow:"#fffde0",speed:0.9};
      })();
      // Přebarvení dle aktivního receptu (jen při dostatečné teplotě)
      if(temp>=55&&p._activeColorRecipe){
        const spd=spBase.speed;
        switch(p._activeColorRecipe){
          case "jantar":  return {c1:"#8b4a10",c2:"#6b3008",c3:"#c07020",glow:"#a05010",speed:spd};
          case "modra":   return {c1:"#0a1a5a",c2:"#08103a",c3:"#2040a0",glow:"#1030c0",speed:spd};
          case "smaragd": return {c1:"#0a4a20",c2:"#083010",c3:"#20a040",glow:"#108030",speed:spd};
          case "lattimo": return {c1:"#c8c8c8",c2:"#a0a0a0",c3:"#f0f0f0",glow:"#e0e0e0",speed:spd};
          // Křišťál — čirá oranžovozlatá tavenina (draselné sklo bez Fe nečistot)
          case "crystal": return {c1:"#f0a030",c2:"#d07818",c3:"#ffd060",glow:"#f09020",speed:spd};
          // Rubín — při tavení ČIRÁ/nažloutlá (strike glass — barva se vyvine až při náběhu!)
          case "rubin":   return {c1:"#d4c080",c2:"#b09040",c3:"#fff0c0",glow:"#d4b060",speed:spd};
        }
      }
      return spBase;
    })();
    const spd=meltColors.speed;
    const svgNS="http://www.w3.org/2000/svg";

    // Wrapper — 2 sloupce 1/2 + 1/2
    const twoCol=document.createElement("div");
    twoCol.style.cssText="display:flex;gap:14px;align-items:center;margin-bottom:10px;";

    // Levý sloupec — SVG základ + canvas overlay (Bézier víření + fyzikální bubliny)
    const leftWrap=document.createElement("div");
    leftWrap.style.cssText="flex:1;min-width:0;display:flex;justify-content:center;";
    // ── GRID PÁNVÍ dle slotů pece ────────────────────────────
    const furnSlots2=ft.maxSlots||1;
    const activeBatches=p.activeBatches||[];

    // Helper: barvy skloviny dle colorKey
    function colorKeyToMelt(colorKey,tmp){
      if(!active||tmp<5) return {c1:"#1a1208",c2:"#2a1a0a",c3:"#0e0906",glow:"none",speed:0};
      const spBase=(()=>{
        if(tmp<20) return {c1:"#3a1a08",c2:"#1e0e04",c3:"#2a1208",glow:"#4a1a08",speed:8};
        if(tmp<35) return {c1:"#6a1a08",c2:"#3a0e04",c3:"#8a2010",glow:"#6a1a08",speed:6};
        if(tmp<50) return {c1:"#a03010",c2:"#6a1808",c3:"#c04018",glow:"#a03010",speed:4.5};
        if(tmp<65) return {c1:"#c06020",c2:"#a04010",c3:"#e08030",glow:"#c05020",speed:3.2};
        if(tmp<78) return {c1:"#d49020",c2:"#b07010",c3:"#f0b030",glow:"#d08020",speed:2.2};
        if(tmp<88) return {c1:"#e8c030",c2:"#c09820",c3:"#fff0a0",glow:"#e8c030",speed:1.5};
        return       {c1:"#fff8c0",c2:"#ffe080",c3:"#ffffff",glow:"#fffde0",speed:0.9};
      })();
      if(tmp>=55){
        const spd=spBase.speed;
        switch(colorKey){
          case "waldglas": return {c1:"#4a3a08",c2:"#6a5210",c3:"#8a7020",glow:"#7a6018",speed:spd}; // lesní sklo — olivová/jantarová
          case "jantar":  return {c1:"#8b4a10",c2:"#6b3008",c3:"#c07020",glow:"#a05010",speed:spd};
          case "modra":   return {c1:"#0a1a5a",c2:"#08103a",c3:"#2040a0",glow:"#1030c0",speed:spd};
          case "smaragd": return {c1:"#0a4a20",c2:"#083010",c3:"#20a040",glow:"#108030",speed:spd};
          case "lattimo": return {c1:"#c8c8c8",c2:"#a0a0a0",c3:"#f0f0f0",glow:"#e0e0e0",speed:spd};
          case "rubin":   return {c1:"#d4c080",c2:"#b09040",c3:"#fff0c0",glow:"#d4b060",speed:spd};
          case "crystal": return {c1:"#f0a030",c2:"#d07818",c3:"#ffd060",glow:"#f09020",speed:spd}; // křišťál — oranžovozlatá tavenina
        }
      }
      return spBase;
    }

    // Grid layout dle počtu slotů
    const isGrid2x2=furnSlots2>=4;
    const is2col=furnSlots2>=2;
    // Velikost jedné pánve dle počtu
    const pSize=furnSlots2>=4?100:furnSlots2>=2?120:160;

    const gridWrap=document.createElement("div");
    gridWrap.style.cssText=isGrid2x2
      ?"display:grid;grid-template-columns:1fr 1fr;gap:8px;width:"+(pSize*2+8)+"px;"
      :is2col?"display:flex;gap:8px;":"display:flex;justify-content:center;";

    for(let si=0;si<furnSlots2;si++){
      const batch=activeBatches.find(b=>b.slot===si);
      const slotTypeCfg=(p.furnSlotConfig&&p.furnSlotConfig[si])||"waldglas";
      const colorKey=batch?batch.colorKey:(slotTypeCfg==="crystal"?"crystal":(p._activeColorRecipe||"waldglas"));
      const mc=colorKeyToMelt(colorKey,temp);
      // Per-slot: má pánev? Čteme z furnSlotPanev pro přesný stav
      const hasP=p.furnSlotPanev ? (p.furnSlotPanev[si]!==null&&p.furnSlotPanev[si]!==undefined) : si<(p.pReady||0);

      // Outer wrapper — keramický okraj + pozice
      const slotDiv=document.createElement("div");
      slotDiv.style.cssText=`position:relative;width:${pSize}px;height:${pSize}px;flex-shrink:0;`;

      // Keramický okraj pánve — SVG kroužek
      const rimDiv=document.createElement("div");
      rimDiv.style.cssText=`position:absolute;inset:0;border-radius:50%;
          background:radial-gradient(ellipse at 30% 25%, #7a5535 0%, #4a2e18 45%, #2a1608 100%);
          box-shadow:inset 0 2px 6px rgba(0,0,0,.7), inset 0 -1px 3px rgba(255,180,80,.08),
          0 2px 8px rgba(0,0,0,.5);`;

      // Vnitřní plocha pánve (o 10px menší ze všech stran)
      const innerDiv=document.createElement("div");
      const innerSize=pSize-14;
      innerDiv.style.cssText=`position:absolute;top:7px;left:7px;width:${innerSize}px;height:${innerSize}px;
          border-radius:50%;overflow:hidden;
          box-shadow:inset 0 3px 10px rgba(0,0,0,.8);`;

      if(hasP&&active&&mc.speed>0){
        // Canvas s animací taveniny — seed = slot index pro unikátní animaci
        const canvas=document.createElement("canvas");
        canvas.width=140;canvas.height=140;
        canvas.style.cssText=`width:${innerSize}px;height:${innerSize}px;display:block;border-radius:50%;`;
        innerDiv.appendChild(canvas);
        // Stopnout předchozí RAF pro tento slot pokud existuje
        if(canvas._moltenRaf) cancelAnimationFrame(canvas._moltenRaf);
        // Seed: kombinace slotu + herního kola + hash colorKey
        const seed=(si*137+(p.round||0)*31+colorKey.length*17)%999;
        startMoltenCanvas(canvas,temp,mc,seed);
        // Label skloviny
        const lbl=document.createElement("div");
        lbl.style.cssText=`position:absolute;bottom:6px;left:0;right:0;text-align:center;
            font-size:7px;color:${mc.c3};font-family:Georgia,serif;letter-spacing:.5px;
            text-shadow:0 1px 3px rgba(0,0,0,.8);pointer-events:none;opacity:.8;`;
        lbl.textContent=batch?(
          batch.colorKey==="modra"   ?(L==="cs"?"modrá":"blue"):
          batch.colorKey==="smaragd" ?(L==="cs"?"smaragd":"emerald"):
          batch.colorKey==="rubin"   ?(L==="cs"?"rubín":"ruby"):
          batch.colorKey==="lattimo" ?(L==="cs"?"lattimo":"lattimo"):
          batch.colorKey==="jantar"  ?(L==="cs"?"jantar":"amber"):
          batch.type==="crystal"     ?(L==="cs"?"křišťál":"crystal"):
          (L==="cs"?"waldglas":"waldglas")
        ):(L==="cs"?"žár":"heat");
        innerDiv.appendChild(lbl);
      }else if(hasP){
        // Pánev je ale pec nežhne — tmavá, klidná
        innerDiv.style.background="radial-gradient(circle, #2a1a0a 0%, #120a04 100%)";
        const coldLbl=document.createElement("div");
        coldLbl.style.cssText=`position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;
            font-size:8px;color:#5a3a1a;font-family:Georgia,serif;letter-spacing:.5px;`;
        coldLbl.textContent=L==="cs"?"studená":"cold";
        // Zobrazit zbývající uses
        const sp=p.furnSlotPanev?.[si];
        if(sp){
          const usesLbl=document.createElement("div");
          usesLbl.style.cssText="font-size:7px;color:#4a2e18;";
          usesLbl.textContent=`${sp.uses}/${PANEV_DUR}`;
          coldLbl.appendChild(usesLbl);
        }
        innerDiv.appendChild(coldLbl);
      }else{
        // Prázdný slot — bez pánve
        innerDiv.style.background="rgba(0,0,0,.4)";
        const emptyLbl=document.createElement("div");
        emptyLbl.style.cssText=`position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            font-size:18px;opacity:.2;`;
        emptyLbl.textContent="○";
        innerDiv.appendChild(emptyLbl);
      }

      slotDiv.appendChild(rimDiv);
      slotDiv.appendChild(innerDiv);


      gridWrap.appendChild(slotDiv);
    }
    leftWrap.appendChild(gridWrap);

    // Pravý sloupec — teplota label + stats
    const rightWrap=document.createElement("div");
    rightWrap.style.cssText="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;";

    // Teplota label
    const tempDiv=document.createElement("div");
    tempDiv.style.cssText="margin-bottom:4px;";
    tempDiv.innerHTML=`<div style="font-size:28px;font-family:Georgia,serif;letter-spacing:2px;color:${active?meltColors.c3:"#5a3a1a"};transition:color .5s;font-weight:700;${meltColors.glow!=="none"?`text-shadow:0 0 12px ${meltColors.glow};`:""}">
        ${active?temp+"%":isTempering?(temp+"%"):(isC&&p.round===PREP?(temp+"%"):"—")}
      </div>
      <div style="font-size:10px;color:${active?meltColors.c3:"#5a3a1a"};font-style:italic;letter-spacing:.4px;line-height:1.4;">
        ${active?(L==="cs"?tempLabel.cs:tempLabel.en):isTempering?(L==="cs"?"🌡️ Temperování — ~300–500°C":"🌡️ Tempering — ~300–500°C"):(isC&&p.round===PREP?(L==="cs"?"🔥 Sv. Jiří — rozžíháme na 1100°C+":"🔥 St. George — firing up to 1100°C+"):(L==="cs"?"Pec studená · kampaň v dubnu":"Furnace cold · campaign in April"))}
      </div>`;
    rightWrap.append(tempDiv);

    // Stats řádky
    const ftSlots=ft.maxSlots||1;
    const ftSlotsColor=ftSlots>=4?"#4a7a3a":ftSlots>=2?"#c9952b":"#8b5e34";
    [
      {label:L==="cs"?"Typ pece":"Type",    val:L==="cs"?ft.name:ft.nameEn, color:"#c9952b"},
      {label:"Eff.",                          val:fEff+"%",                   color:fEff>65?"#4a7a3a":fEff>45?"#c9952b":"#a03020"},
      {label:L==="cs"?"Zaběhnutost":"Run-in",val:p.furnace.runIn+"%",        color:"#c9952b"},
      {label:L==="cs"?"Pánev":"Crucible",    val:stars(p.panevQuality),      color:"#f0deb8"},
      {label:L==="cs"?"Sloty":"Slots",        val:"⬜".repeat(ftSlots)+" "+ftSlots+"×", color:ftSlotsColor},
    ].forEach(r=>{
      const row=document.createElement("div");
      row.style.cssText="display:flex;justify-content:space-between;align-items:center;font-size:11px;border-bottom:1px solid rgba(255,255,255,.05);padding-bottom:5px;margin-bottom:2px;";
      row.innerHTML=`<span style="color:#8b5e34;font-size:9px;text-transform:uppercase;letter-spacing:.8px;">${r.label}</span>
          <strong style="color:${r.color};font-size:13px;text-align:right;">${r.val}</strong>`;
      rightWrap.append(row);
    });

    twoCol.append(leftWrap, rightWrap);
    dash.append(twoCol);
  })();

  // Šamot vizualizace — cihlová zeď
  const shamotPct=p.furnace.shamotWear;
  dash.append(
    h("div",{style:{marginTop:"6px"}},
      h("div",{style:{fontSize:"9px",color:"#8b5e34",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"4px"}},
        `${L==="cs"?"Šamotová vyzdívka":"Shamot lining"} · ${shamotPct}% ${L==="cs"?"opotřeben":"worn"}`),
      h("div",{class:"shamot-visual"},
        ...Array.from({length:10},(_,i)=>{
          const worn=shamotPct>i*10;
          const critical=shamotPct>70&&worn;
          return h("div",{class:"shamot-brick",style:{
            background:critical?"#a03020":worn?"#6a4a2a":"#c9952b",
            opacity:worn?1:.3}});
        }))));

  // Fáze a doporučení
  const phaseMsg=isC
    ?(p.fActive
      ?(p.fTemp>=68&&p.fTemp<=87?{cs:"🎯 Pec na správné teplotě. Taví se!",en:"🎯 Optimal temperature. Smelting!"}
        :p.fTemp>87?{cs:"⚠️ Přetopeno — ubeř palivo!",en:"⚠️ Overheated — reduce fuel!"}
        :{cs:"🔼 Nízká teplota — přidej palivo.",en:"🔼 Low temp — add fuel."})
      :p.round===PREP
        ?{cs:`🌡️ Sv. Jiří — kampaň začíná! Přidej palivo, pec se rozžíhá. Teplota: ${p.fTemp}%.`,
          en:`🌡️ St. George — campaign starts! Add fuel, furnace lighting up. Temp: ${p.fTemp}%.`}
        :{cs:"❌ Pec nehoří — nedostatek paliva.",en:"❌ Furnace out — not enough fuel."})
    :isTempering
      ?{cs:`🌡️ Temperování — pec se zahřívá na provozní teplotu. Kampaň na Sv. Jiří (24. dubna). Zaběhnutost přenáší ${Math.round(p.furnace.runIn*0.65)}%.`,
        en:`🌡️ Tempering — furnace warming to working temp. Campaign starts St. George (Apr 24). Run-in carries ${Math.round(p.furnace.runIn*0.65)}%.`}
      :isCooling
        ?{cs:`🌡️ Pec chladne — ${p.fTemp}%. Přípravná sezóna. Zaběhnutost přenáší ${Math.round(p.furnace.runIn*0.65)}%.`,
          en:`🌡️ Furnace cooling — ${p.fTemp}%. Prep season. Run-in carries ${Math.round(p.furnace.runIn*0.65)}%.`}
        :{cs:`⏸️ Pec studená. Kampaň spouštíš v dubnu (Sv. Jiří). Zaběhnutost přenáší ${Math.round(p.furnace.runIn*0.65)}%.`,
          en:`⏸️ Furnace cold. Campaign starts April (St. George). Run-in carries ${Math.round(p.furnace.runIn*0.65)}%.`};
  dash.append(h("div",{style:{marginTop:"8px",padding:"6px 8px",background:"rgba(255,255,255,.04)",
    borderRadius:"4px",fontSize:"11px",color:isC&&p.fActive&&p.fTemp>=65&&p.fTemp<=85?"#9fca6a":"#c9952b",
    lineHeight:"1.5"}},L==="cs"?phaseMsg.cs:phaseMsg.en));
  const dashSec=h("div",{class:"sec"});
  dashSec.append(dash);
  const effSec=h("div",{class:"sec"});
  effSec.append(h("div",{class:"sec-title"},L==="cs"?"Jak roste účinnost":"How efficiency grows"));
  const effRows=[
    {label:L==="cs"?"Zaběhnutost pece":"Furnace run-in",val:Math.round(p.furnace.runIn/ft.maxRunIn*EFF_RUNIN*100)+"%",
     tip:L==="cs"?"Roste každou várkou. Zimní přestávka ubere 35%.":"Grows each batch. Winter pause removes 35%."},
    {label:L==="cs"?"Kvalita pánve":"Crucible quality",val:Math.round(p.panevQuality/5*EFF_PANEV*100)+"%",
     tip:L==="cs"?"Závisí na pánvaři a zimní výrobě.":"Depends on crucible-maker and winter production."},
    {label:L==="cs"?"Šamot (vyzdívka)":"Shamot (lining)",val:shamotPct<30?Math.round(EFF_SHAMOT*100)+"%":shamotPct<60?Math.round(EFF_SHAMOT*50)+"%":"0%",
     tip:L==="cs"?"Oprav v mezisezóně (4🧱+2🪨+8g).":"Repair in off-season (4🧱+2🪨+8g)."}
  ];
  effRows.forEach(r=>{
    effSec.append(h("div",{style:{display:"flex",justifyContent:"space-between",padding:"4px 0",
      borderBottom:"1px solid rgba(42,26,10,.06)",fontSize:"11px"}},
      h("div",null,h("div",{style:{fontWeight:"600"}},r.label),h("div",{style:{fontSize:"10px",color:"#8b5e34"}},r.tip)),
      h("div",{style:{fontWeight:"700",color:"#c9952b",flexShrink:0,marginLeft:"8px"}},r.val)));
  });
  effSec.append(h("div",{style:{display:"flex",justifyContent:"space-between",padding:"6px 0",
    fontWeight:"700",fontSize:"12px",borderTop:"1px solid rgba(42,26,10,.15)",marginTop:"4px"}},
    h("span",null,L==="cs"?"Celková účinnost":"Total efficiency"),
    h("span",{style:{color:fEff>65?"#4a7a3a":fEff>45?"#c9952b":"#a03020"}},fEff+"%")));
  // Max cap per furnace type
  effSec.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic",
    marginTop:"6px",padding:"6px 8px",background:"rgba(0,0,0,.04)",borderRadius:"4px",lineHeight:"1.6"}},
    L==="cs"
      ?"Max. účinnost dle pece: Primitivní ~58% · Zděná ~75% · Mistrovská ~90%.\nVyšší účinnost = více skla z várky."
      :"Max. efficiency by furnace: Primitive ~58% · Stone ~75% · Master ~90%.\nHigher efficiency = more glass per batch."));
  // Dashboard — vždy přes celou šířku (1 sloupec)
  content.append(dashSec);
  // effSec + chemSec připojíme níže společně po sestavení chemSec

  // Přísady — placeholder pro budoucí chemii
  const chemSec=h("div",{class:"sec"});
  chemSec.append(
    h("div",{class:"sec-title"},L==="cs"?"⚗️ Přísady a sklovina":"⚗️ Additives & Batch"),
    h("div",{style:{padding:"10px",background:"rgba(42,26,10,.04)",borderRadius:"4px",
      border:"1px dashed rgba(139,94,52,.3)"}},
      h("div",{style:{fontSize:"12px",color:"#8b5e34",marginBottom:"2px",fontWeight:"700"}},
        L==="cs"?"Kmen (Gemenge) — složení várky:":"Batch composition (Gemenge):"),
      h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic",marginBottom:"8px"}},
        L==="cs"?"Poměry = díly váhy (dle Kunckela, Arnsdorf 1680)":"Ratios = parts by weight (after Kunckel, Arnsdorf 1680)"),
      // Hlavní složky s historickými poměry
      [
        {cs:"Křemenný písek (SiO₂)", en:"Quartz sand (SiO₂)",  note_cs:"základ skloviny",  note_en:"glass former",    parts:100, avail:p.res.sand,      warn:p.res.sand<3,      color:"#3a6a9a"},
        {cs:"Soda (Na₂CO₃)",        en:"Soda (Na₂CO₃)",       note_cs:"tavidlo — snižuje bod tání", note_en:"flux — lowers melt point", parts:20, avail:null, warn:false, color:"#8b5e34"},
        {cs:"Potaš (K₂CO₃)",        en:"Potash (K₂CO₃)",      note_cs:"tavidlo / flus",   note_en:"flux / potash",    parts:10, avail:p.res.potash,    warn:p.res.potash<2,    color:"#a03020"},
        {cs:"Vápenec (CaCO₃)",      en:"Limestone (CaCO₃)",   note_cs:"stabilizátor",     note_en:"stabiliser",       parts:15, avail:p.res.limestone, warn:p.res.limestone<1, color:"#3a2a14"},
        {cs:"Čeřivo (ledek Na₂SO₄)",en:"Fining agent (Na₂SO₄)",note_cs:"odbublávání skloviny",note_en:"removes bubbles from melt",parts:1, avail:null, warn:false, color:"#4a7a3a"},
      ].map(ing=>h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",
        fontSize:"10px",padding:"4px 0",borderBottom:"1px solid rgba(42,26,10,.06)"}},
        h("span",{style:{color:ing.warn?"#a03020":ing.color,fontWeight:ing.warn?"700":"500",flex:"2"}},
          L==="cs"?ing.cs:ing.en),
        h("span",{style:{color:"#8b5e34",flex:"2",fontSize:"9px",fontStyle:"italic",textAlign:"center"}},
          L==="cs"?ing.note_cs:ing.note_en),
        h("span",{style:{fontWeight:"700",color:"#c9952b",width:"28px",textAlign:"right",flexShrink:0}},ing.parts),
        h("span",{style:{color:ing.avail!=null?(ing.warn?"#a03020":"#4a7a3a"):"#bbb",
          width:"24px",textAlign:"right",flexShrink:0,fontSize:"10px"}},
          ing.avail!=null?ing.avail:"—"))),
      // Záhlaví sloupců
      h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"9px",
        color:"#8b5e34",marginTop:"6px",paddingTop:"4px",borderTop:"1px solid rgba(42,26,10,.1)",
        letterSpacing:"0.5px",textTransform:"uppercase"}},
        h("span",{style:{flex:"2"}},L==="cs"?"Složka":"Component"),
        h("span",{style:{flex:"2",textAlign:"center"}},L==="cs"?"Funkce":"Function"),
        h("span",{style:{width:"28px",textAlign:"right"}},L==="cs"?"Díly":"Parts"),
        h("span",{style:{width:"24px",textAlign:"right"}},L==="cs"?"Sklad":"Stock")),
      h("div",{style:{marginTop:"8px",fontSize:"10px",color:"#8b5e34",fontStyle:"italic",
        borderTop:"1px solid rgba(42,26,10,.1)",paddingTop:"6px"}},
        L==="cs"
          ?"⚠️ Pozor na vodu, může pánev poškodit."
          :"⚠️ Beware of water - it can crack the crucible."),
      h("div",{style:{marginTop:"6px",fontSize:"10px",color:"#8b5e34",fontStyle:"italic"}},
        L==="cs"
          ?"🔬 Barviva, odbarvovače a speciální přísady (MnO₂, CoO, Au...) — všecko bude."
          :"🔬 Colorants, decolorants and special additives (MnO₂, CoO, Au...) — coming soon.")));
  content.append(chemSec);

  // Barevné sklo — craft sekce
  const colorSec=h("div",{class:"sec"});
  colorSec.append(h("div",{class:"sec-title"},L==="cs"?"🎨 Barevná sklovina":"🎨 Coloured Glass"));

  // Přísady na skladě
  const addDiv=h("div",{style:{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"8px",
    padding:"6px",background:"rgba(0,0,0,.03)",borderRadius:"4px"}});
  let hasAny=false;
  Object.entries(ADDITIVES).forEach(([key,ad])=>{
    const qty=p.additives?.[key]||0;
    if(qty>0){hasAny=true;}
    addDiv.append(h("span",{class:"fj-additive-chip","data-additive":key,"data-quantity":qty,
      title:(L==="cs"?ad.cs:ad.en)+" — "+(L==="cs"?ad.desc_cs:ad.desc_en),
      "aria-label":(L==="cs"?ad.cs:ad.en)+": "+qty,style:{fontSize:"11px",padding:"2px 6px",borderRadius:"8px",
      background:qty>0?"rgba(139,94,52,.15)":"rgba(0,0,0,.04)",
      color:qty>0?"#3a2a14":"#bbb",border:qty>0?"1px solid rgba(139,94,52,.3)":"1px solid transparent"}},
      h("span",null,ad.icon),h("span",{class:"fj-additive-chip-quantity"},qty+"×")));
  });
  if(!hasAny){
    addDiv.append(h("span",{style:{fontSize:"11px",color:"#8b5e34",fontStyle:"italic"}},
      L==="cs"?"Žádné přísady. Baranovský je sežene v mezisezóně.":"No additives. Baranovský will find some next off-season."));
  }
  colorSec.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",marginBottom:"4px"}},
    L==="cs"?"Přísady na skladě:":"Additives in stock:"),addDiv);

  // Odemčené recepty
  const unlockedColors=Object.entries(COLOR_RECIPES).filter(([k])=>p.unlockedRecipes?.includes(k));
  // Typ skloviny per-slot — kompaktní 2×2 grid (varianta B)
  const furnSlotsN=ensureFurnSlotConfig();
  const canCrystalUI=canUseCrystalSlot();
  const slotTypeBox=h("div",{style:{marginBottom:"8px",padding:"6px 8px",background:"rgba(42,26,10,.05)",
    borderRadius:"4px",border:"1px solid rgba(42,26,10,.12)"}});
  slotTypeBox.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"6px"}},
    "🏺 "+(L==="cs"?"Typ skloviny v pánvi:":"Glass type per crucible:")));
  const slotGrid=h("div",{style:{
    display:"grid",
    gridTemplateColumns:furnSlotsN>=2?"1fr 1fr":"1fr",
    gap:"4px"
  }});
  for(let sj=0;sj<furnSlotsN;sj++){
    const sType=p.furnSlotConfig[sj]||"waldglas";
    const row=h("div",{style:{display:"flex",alignItems:"center",gap:"3px"}});
    row.append(h("span",{style:{fontSize:"9px",color:"#8b5e34",minWidth:"20px"}},"🏺"+(sj+1)));
    const bWald=h("button",{
      class:"btn btn-s"+(sType==="waldglas"?" btn-active":""),
      style:{fontSize:"9px",padding:"2px 6px"},
      onClick:()=>{setFurnSlotType(sj,"waldglas");}},"🔥 Wald");
    const bKris=h("button",{
      class:"btn btn-s"+(sType==="crystal"?" btn-active":""),
      style:{fontSize:"9px",padding:"2px 6px",opacity:canCrystalUI?1:0.4},
      title:canCrystalUI
        ?(L==="cs"?"Křišťál: 3× čistý písek + 2× čistá potaš + 1× vápenec + 1× uhlí":"Crystal: 3 pure sand + 2 refined potash + 1 limestone + 1 charcoal")
        :(L==="cs"?"Vyžaduje foukače křišťálu v party":"Requires crystal blower in party"),
      onClick:()=>{
        if(!canCrystalUI)return;
        setFurnSlotType(sj,"crystal");
      }},"✨ Kris");
    const atmRed=(p.furnAtm||[])[sj]==="red";
    const bAtm=h("button",{
      class:"btn btn-s"+(atmRed?" btn-active":""),
      style:{fontSize:"9px",padding:"2px 6px"},
      title:L==="cs"
        ?"Atmosféra pánve: oxidační (čiré sklo) / redukční (kouřivý žár: jantar, ale −★ a −1🪵 navíc)"
        :"Crucible atmosphere: oxidising (clear glass) / reducing (smoky fire: amber, but −★ and −1🪵 extra)",
      onClick:()=>{setFurnAtm(sj,atmRed?"ox":"red");}},atmRed?"💨 "+(L==="cs"?"Redukce":"Reducing"):"🌬️ "+(L==="cs"?"Oxidace":"Oxidising"));
    row.append(bWald,bKris,bAtm);
    slotGrid.append(row);
  }
  slotTypeBox.append(slotGrid);
  if(!canCrystalUI){
    slotTypeBox.append(h("div",{style:{fontSize:"9px",color:"#8b5e34",fontStyle:"italic",marginTop:"4px"}},
      L==="cs"?"✨ Křišťál: pošli foukače křišťálu na Verštat":"✨ Crystal: send crystal blower to Workshop"));
  }
  colorSec.append(slotTypeBox);

  // Selector aktivního receptu pro barvu skloviny v pánvi
  if(unlockedColors.length>0){
    const atmBox=h("div",{style:{marginBottom:"8px",padding:"6px 8px",background:"rgba(42,26,10,.05)",
      borderRadius:"4px",border:"1px solid rgba(42,26,10,.12)"}});
    atmBox.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"5px"}},
      "🔥 "+(L==="cs"?"Barva skloviny v pánvi:":"Melt colour in crucible:")));
    const atmRow=h("div",{style:{display:"flex",gap:"4px",flexWrap:"wrap"}});
    // Výchozí (bez barvení)
    const dfBtn=h("button",{
      class:"btn btn-s"+((!p._nextColorRecipe&&!p._activeColorRecipe)?" btn-active":""),
      onClick:()=>{clearColorRecipe();}},
      "🔥 "+(L==="cs"?"Waldglas":"Waldglas"));
    atmRow.append(dfBtn);
    unlockedColors.filter(([,rc])=>!rc.mufle).forEach(([key,rec])=>{
      const active=p._nextColorRecipe===key||(p._activeColorRecipe===key&&!p._nextColorRecipe);
      const isBusy=!!(G.activeBatches?.length>0);
      atmRow.append(h("button",{
        class:"btn btn-s"+(active?" btn-active":""),
        style:{fontSize:"10px"},
        onClick:()=>{toggleColorRecipe(key);}},
        rec.icon+" "+(L==="cs"?rec.cs.split(" ")[0]:rec.en.split(" ")[0])));
    });
    atmBox.append(atmRow);
    // Indikátor příští várky (jen pokud pec taví a byl vybrán jiný recept)
    const isBusyHint=!!(p.activeBatches?.length>0);
    if(isBusyHint&&p._nextColorRecipe&&p._nextColorRecipe!==p._activeColorRecipe){
      const nextRec=COLOR_RECIPES[p._nextColorRecipe];
      atmBox.append(h("div",{style:{fontSize:"9px",color:"#7a6030",marginTop:"4px",fontStyle:"italic"}},
        "🕐 "+(L==="cs"?"Příští várka: ":"Next batch: ")+(nextRec?(L==="cs"?nextRec.cs:nextRec.en):"–")));
    }else{
      atmBox.append(h("div",{style:{fontSize:"9px",color:"#8b5e34",marginTop:"4px",fontStyle:"italic"}},
        L==="cs"?"Výběr barví pánev — vyrobit sklo pak přes tlačítko receptu níže.":"Select to colour the crucible — craft via recipe button below."));
    }
    colorSec.append(atmBox);
  }
  if(unlockedColors.length===0){
    colorSec.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",fontStyle:"italic",padding:"6px 0"}},
      L==="cs"
        ?"Žádné recepty. Naber Baranovského do hutě — přiveze přísady a odemkne receptury."
        :"No recipes yet. Hire Baranovský — he'll bring additives and unlock formulas."));
  } else {
    const recipeGrid=h("div",{style:{display:"grid",gridTemplateColumns:isDesktop?"1fr 1fr 1fr 1fr":"1fr 1fr",gap:"6px"}});
    unlockedColors.forEach(([key,rec])=>{
      const block=colorRecipeBlock(rec);
      const canCraft=isC&&!block;
      const card=h("div",{style:{padding:"8px",borderRadius:"4px",
        border:`1px solid ${canCraft?"rgba(74,122,58,.3)":"rgba(42,26,10,.1)"}`,
        background:canCraft?"rgba(74,122,58,.05)":"rgba(0,0,0,.02)",
        display:"flex",flexDirection:"column",gap:"4px"}});
      card.append(
        h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
          h("div",null,
            h("span",{style:{fontSize:"13px"}},rec.icon+" "),
            h("strong",{style:{fontSize:"11px",color:"#3a2a14"}},L==="cs"?rec.cs:rec.en)),
          h("span",{style:{fontSize:"10px",color:"#c9952b",fontStyle:"italic"}},`~${rec.sell_cs}g`)),
        h("div",{style:{fontSize:"9px",color:"#8b5e34",fontStyle:"italic",lineHeight:"1.3"}},
          L==="cs"?rec.desc_cs:rec.desc_en),
        h("div",{style:{display:"flex",gap:"3px",flexWrap:"wrap",fontSize:"10px"}},
          ...Object.entries(rec.inputs).map(([item,qty])=>{
            const have=colorInputHave(item);
            const ok=have>=qty;
            return h("span",{class:"fj-color-input","data-input":item,
              title:colorInputName(item,L),"aria-label":colorInputName(item,L)+": "+have+"/"+qty,
              style:{padding:"1px 5px",borderRadius:"4px",
              background:ok?"rgba(74,122,58,.1)":"rgba(160,48,32,.08)",
              color:ok?"#4a7a3a":"#a03020",border:`1px solid ${ok?"rgba(74,122,58,.2)":"rgba(160,48,32,.2)"}`}},
              h("span",null,colorInputIcon(item)),h("span",null,`${have}/${qty}`));
          })),
        h("button",{
          class:"btn"+(canCraft?" btn-p":""),
          style:{width:"100%",opacity:canCraft?1:.5,fontSize:"10px",padding:"4px 6px",marginTop:"auto"},
          onClick:()=>{if(canCraft)craftColorGlass(key);}},
          canCraft
            ?(rec.mufle?(L==="cs"?"Vypálit →":"Fire →"):(L==="cs"?"Tavit →":"Smelt →"))
            :block==="temp"
              ?(L==="cs"?`Min ${rec.furnaceMin}%`:`Min ${rec.furnaceMin}%`)
              :block==="atm"
                ?(L==="cs"?"Nutná redukce":"Needs reducing")
                :block==="season"
                  ?(L==="cs"?"Jen v kampani":"Campaign only")
                :block==="wood"
                  ?(L==="cs"?"Chybí dřevo":"No wood")
                  :(L==="cs"?"Chybí sur.":"Missing")));
      recipeGrid.append(card);
    });
    colorSec.append(recipeGrid);
    // Rubín: polotovary čekají na náběh (druhé, pomalé zahřátí)
    const rawN=(p.rubin_raw||[]).length;
    if(rawN>0||p._strikeQueue){
      const canStrike=rawN>0&&!p._strikeQueue&&p.fActive&&p.fTemp>=RUBY_STRIKE_MIN;
      colorSec.append(h("div",{style:{marginTop:"6px",padding:"8px",borderRadius:"4px",
        border:`1px solid ${canStrike?"rgba(138,26,26,.35)":"rgba(42,26,10,.1)"}`,
        background:canStrike?"rgba(138,26,26,.05)":"rgba(0,0,0,.02)",
        display:"flex",flexDirection:"column",gap:"4px"}},
        h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#8a1a1a"}},
          `⚪ ${L==="cs"?"Rubínový polotovar":"Ruby blank"}: ${rawN}×`),
        h("div",{style:{fontSize:"9px",color:"#8b5e34",fontStyle:"italic",lineHeight:"1.3"}},
          L==="cs"
            ?`Sklo je téměř bezbarvé. Barvu vyvolá až druhé, pomalé zahřátí (náběh) — pec min ${RUBY_STRIKE_MIN}%, ne přepálená (>85 %). Šanci zvyšuje mistr tavič (lv 4+).`
            :`The glass is almost colourless. The colour comes only on a second, slow reheating (striking) — furnace min ${RUBY_STRIKE_MIN}%, not overheated (>85%). A master smelter (lv 4+) improves the odds.`),
        h("button",{class:"btn"+(canStrike?" btn-p":""),
          style:{width:"100%",opacity:canStrike?1:.5,fontSize:"10px",padding:"4px 6px"},
          onClick:()=>{if(canStrike)strikeRuby();}},
          canStrike?(L==="cs"?"Náběh →":"Strike →")
            :(rawN===0?(L==="cs"?"Žádný polotovar":"No blank"):(L==="cs"?`Pec min ${RUBY_STRIKE_MIN}%`:`Furnace min ${RUBY_STRIKE_MIN}%`)))));
    }
  }
  // Desktop: levý = effSec, pravý = chemSec; colorSec přes celou šířku dole
  if(isDesktop){
    const bottomCols=h("div",{style:{display:"flex",gap:"0",alignItems:"flex-start",borderBottom:"1px solid rgba(42,26,10,.1)"}});
    effSec.style.flex="1";
    effSec.style.borderRight="1px solid rgba(42,26,10,.1)";
    chemSec.style.flex="1";
    bottomCols.append(effSec,chemSec);
    content.append(bottomCols,colorSec);
  }else{
    content.append(effSec,chemSec,colorSec);
  }
  renderSeasonUpgrades(content);
}
