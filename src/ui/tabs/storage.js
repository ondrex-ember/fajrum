// storage.js — tab "storage".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabStorage(ctx){
  const {L,p,content,isC,fEff}=ctx;
  // ── SEKCE 1: Sklo na skladě ──
  const glassSec=h("div",{class:"sec"});
  glassSec.append(h("div",{class:"sec-title"},L==="cs"?"🔥 Sklo na skladě":"🔥 Glass in stock"));

  const glassGrid=h("div",{class:"fj-glass-stock-grid",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}});

  // Waldglas
  const wg=p.waldglas||[];
  const wgAvg=wg.length?Math.round(wg.reduce((s,q)=>s+q,0)/wg.length):0;
  glassGrid.append(h("div",{style:{padding:"8px",background:"rgba(0,0,0,.03)",borderRadius:"4px",
    border:`1px solid ${wg.length?"rgba(139,94,52,.2)":"rgba(42,26,10,.08)"}`}},
    h("div",{style:{fontWeight:"700",fontSize:"12px",marginBottom:"2px"}},"🔥 "+(L==="cs"?"Lesní sklo":"Waldglas")),
    h("div",{style:{fontSize:"18px",fontWeight:"700",color:wg.length?"#3a2a14":"#bbb"}},wg.length+"×"),
    wg.length?h("div",{style:{fontSize:"10px",color:"#8b5e34"}},
      `${L==="cs"?"Průměr kval.":"Avg. qual."}: ${stars(wgAvg)} · ~${Math.round(3.5*wgAvg)}g`):
    h("div",{style:{fontSize:"10px",color:"#bbb",fontStyle:"italic"}},L==="cs"?"Prázdný sklad":"Empty")));

  // Křišťál
  const cr=p.crystal||[];
  const crAvg=cr.length?Math.round(cr.reduce((s,q)=>s+q,0)/cr.length):0;
  glassGrid.append(h("div",{style:{padding:"8px",background:"rgba(0,0,0,.03)",borderRadius:"4px",
    border:`1px solid ${cr.length?"rgba(58,106,154,.3)":"rgba(42,26,10,.08)"}`}},
    h("div",{style:{fontWeight:"700",fontSize:"12px",marginBottom:"2px"}},"✨ "+(L==="cs"?"Křišťál":"Crystal")),
    h("div",{style:{fontSize:"18px",fontWeight:"700",color:cr.length?"#3a6a9a":"#bbb"}},cr.length+"×"),
    cr.length?h("div",{style:{fontSize:"10px",color:"#8b5e34"}},
      `${L==="cs"?"Průměr kval.":"Avg. qual."}: ${stars(crAvg)} · ~${Math.round(9*crAvg)}g`):
    h("div",{style:{fontSize:"10px",color:"#bbb",fontStyle:"italic"}},L==="cs"?"Prázdný sklad":"Empty")));

  // Barevné sklo
  const colorDefs={jantar:{icon:"🟤",cs:"Jantar",en:"Amber"},
    zlut:{icon:"🟨",cs:"Stříbrná žluť",en:"Silver stain"},
    modra:{icon:"🔵",cs:"Temná modř",en:"Dark blue"},
    smaragd:{icon:"🟢",cs:"Smaragd",en:"Emerald"},
    lattimo:{icon:"⚪",cs:"Lattimo",en:"Milk glass"},
    rubin:{icon:"🔴",cs:"Rubín",en:"Ruby"}};
  Object.values(colorDefs).forEach((d,i)=>{d.base=COLOR_RECIPES[Object.keys(colorDefs)[i]].sell_cs;}); // cena z receptu — jediný zdroj
  Object.entries(colorDefs).forEach(([k,def])=>{
    const arr=p[k]||[];
    if(arr.length===0)return;
    const avg=Math.round(arr.reduce((s,q)=>s+q,0)/arr.length);
    glassGrid.append(h("div",{style:{padding:"8px",background:"rgba(0,0,0,.03)",borderRadius:"4px",
      border:"1px solid rgba(139,94,52,.2)"}},
      h("div",{style:{fontWeight:"700",fontSize:"12px",marginBottom:"2px"}},def.icon+" "+(L==="cs"?def.cs:def.en)),
      h("div",{style:{fontSize:"18px",fontWeight:"700",color:"#3a2a14"}},arr.length+"×"),
      h("div",{style:{fontSize:"10px",color:"#8b5e34"}},
        `${L==="cs"?"Průměr kval.":"Avg. qual."}: ${stars(avg)} · ~${Math.round(def.base*avg/3)}g`)));
  });

  // Rubínový polotovar — čeká na náběh
  if((p.rubin_raw||[]).length>0){
    const rr=p.rubin_raw;
    const rrAvg=Math.round(rr.reduce((s,q)=>s+q,0)/rr.length);
    glassGrid.append(h("div",{style:{padding:"8px",background:"rgba(0,0,0,.03)",borderRadius:"4px",
      border:"1px solid rgba(138,26,26,.3)"}},
      h("div",{style:{fontWeight:"700",fontSize:"12px",marginBottom:"2px"}},"⚪ "+(L==="cs"?"Rubín (polotovar)":"Ruby (blank)")),
      h("div",{style:{fontSize:"18px",fontWeight:"700",color:"#3a2a14"}},rr.length+"×"),
      h("div",{style:{fontSize:"10px",color:"#8b5e34"}},
        `${L==="cs"?"Průměr kval.":"Avg. qual."}: ${stars(rrAvg)} · ${L==="cs"?"čeká na náběh":"awaits striking"}`)));
  }

  // Foukané výrobky
  // základní výrobek + barevné varianty (klíč_barva, např. cise_modra)
  BLOWN_TYPES.forEach(k=>{
    const it=BLOWN_ITEMS[k];
    [["waldglas",k],...(it.inputs||[]).filter(c=>c!=="waldglas").map(c=>[c,k+"_"+c])].forEach(([col,sk])=>{
      const arr=p[sk]||[];
      if(!arr.length)return;
      const avg=Math.round(arr.reduce((s,q)=>s+q,0)/arr.length);
      const colorLabel=col!=="waldglas"?" "+COLOR_ICON[col]:"";
      const price=col==="waldglas"?it.base:Math.round(it.base*COLOR_MULT[col]);
      glassGrid.append(h("div",{class:"fj-stock-card","data-product":k,"data-glass":col,style:{padding:"8px",background:"rgba(0,0,0,.03)",borderRadius:"4px",
        border:"1px solid rgba(139,94,52,.15)"}},
        h("div",{style:{fontWeight:"700",fontSize:"12px",marginBottom:"2px"}},it.icon+colorLabel+" "+(L==="cs"?it.cs:it.en)),
        h("div",{style:{fontSize:"18px",fontWeight:"700",color:"#3a2a14"}},arr.length+"×"),
        h("div",{style:{fontSize:"10px",color:"#8b5e34"}},
          `${L==="cs"?"Průměr kval.":"Avg. qual."}: ${stars(avg)} · ~${price}g`)));
    });
  });

  // Broušené + rytiny
  [...GROUND_TYPES,...ENGRAVE_INPUTS.map(k=>"rytina_"+k)].forEach(k=>{
    const arr=p[k]||[];
    if(!arr.length)return;
    const isEngrave=k.startsWith("rytina_");
    const baseKey=isEngrave?k.replace("rytina_",""):k;
    const it=engraveSrc(baseKey);
    if(!it)return;
    const avg=Math.round(arr.reduce((s,q)=>s+q,0)/arr.length);
    const basePrice=isEngrave?Math.round(it.base*engraveBonus(baseKey)):it.base;
    glassGrid.append(h("div",{class:"fj-stock-card","data-product":k,style:{padding:"8px",background:"rgba(0,0,0,.03)",borderRadius:"4px",
      border:"1px solid rgba(139,94,52,.15)"}},
      h("div",{style:{fontWeight:"700",fontSize:"12px",marginBottom:"2px"}},
        (isEngrave?"✂️ ":it.icon+" ")+(L==="cs"?it.cs:it.en)+(isEngrave?" ✂️":"")),
      h("div",{style:{fontSize:"18px",fontWeight:"700",color:"#3a2a14"}},arr.length+"×"),
      h("div",{style:{fontSize:"10px",color:"#8b5e34"}},`~${basePrice}g`)));
  });

  ["tercik_vyplne","tercik_zebrovy",...Object.keys(SPECIAL_ITEMS)].forEach(key=>{
    const arr=p[key]||[];if(!arr.length)return;
    const info=SPECIAL_ITEMS[key];
    const labels={tercik_vyplne:["Výplňový terčík","Filler disc"],tercik_zebrovy:["Žebrový terčík","Ribbed disc"]};
    const label=info?(L==="cs"?info.cs:info.en):(labels[key]||[key,key])[L==="cs"?0:1];
    const avg=Math.round(arr.reduce((sum,q)=>sum+q,0)/arr.length);
    glassGrid.append(h("div",{class:"fj-stock-card","data-product":key,style:{padding:"8px",border:"1px solid rgba(139,94,52,.15)",borderRadius:"4px"}},
      h("div",{style:{fontWeight:"700"}},label),h("div",{style:{fontSize:"18px",fontWeight:"700"}},arr.length+"×"),
      h("div",{style:{fontSize:"11px"}},`${L==="cs"?"Průměr kval.":"Avg. qual."}: ${stars(avg)}`)));
  });

  glassSec.append(glassGrid);
  content.append(glassSec);

  // ── SEKCE 2: Přísady & barvy ──
  const addSec=h("div",{class:"sec"});
  addSec.append(h("div",{class:"sec-title"},L==="cs"?"🧪 Přísady & barvy":"🧪 Additives & colorants"));
  const addGrid=h("div",{class:"fj-additive-stock-grid",style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px"}});
  let anyAdd=false;
  Object.entries(ADDITIVES).forEach(([k,ad])=>{
    const qty=p.additives?.[k]||0;
    if(!qty)return;
    anyAdd=true;
    addGrid.append(h("div",{class:"fj-additive-stock","data-additive":k,"data-quantity":qty,style:{padding:"6px",background:"rgba(0,0,0,.03)",borderRadius:"4px",
      border:"1px solid rgba(139,94,52,.15)",display:"flex",alignItems:"center",gap:"6px"}},
      h("span",{style:{fontSize:"16px"}},ad.icon),
      h("div",null,
        h("div",{style:{fontSize:"10px",fontWeight:"700"}},L==="cs"?ad.cs:ad.en),
        h("div",{style:{fontSize:"14px",fontWeight:"700",color:"#3a2a14"}},qty+"×"))));
  });
  if(!anyAdd){
    addGrid.append(h("div",{style:{gridColumn:"1/-1",fontSize:"11px",color:"#8b5e34",fontStyle:"italic",padding:"4px 0"}},
      L==="cs"?"Žádné přísady na skladě. Baranovský přiveze v mezisezóně.":"No additives in stock."));
  }
  addSec.append(addGrid);
  content.append(addSec);

  // ── SEKCE 3: Suroviny ──
  const resSec=h("div",{class:"sec"});
  resSec.append(h("div",{class:"sec-title"},L==="cs"?"🌲 Suroviny":"🌲 Raw materials"));
  const resItems=[
    {key:"wood",icon:"🌳",label:L==="cs"?"Dřevo":"Wood",val:p.res.wood,warn:p.res.wood<5},
    {key:"sand",icon:"🏖️",label:L==="cs"?"Křemenný písek":"Quartz sand",val:p.res.sand,warn:p.res.sand<3},
    {key:"limestone",icon:"🟩",label:L==="cs"?"Vápenec":"Limestone",val:p.res.limestone,warn:p.res.limestone<1},
    {key:"potash",icon:"🌿",label:L==="cs"?"Potaš":"Potash",val:p.res.potash,warn:p.res.potash<2},
    {key:"water",icon:"💧",label:L==="cs"?"Voda":"Water",val:p.res.water},
    {key:"clay",icon:"🧱",label:L==="cs"?"Jíl":"Clay",val:p.res.clay},
    {key:"shamot",icon:"🪨",label:L==="cs"?"Šamot":"Shamot",val:p.res.shamot},
    {key:"food",icon:"🍞",label:L==="cs"?"Jídlo":"Food",val:p.res.food,warn:p.res.food<2},
    {key:"charcoal",icon:"⚫",label:L==="cs"?"Dřevěné uhlí":"Charcoal",val:p.res.charcoal},
    {key:"pureSand",icon:"✨",label:L==="cs"?"Čistý písek":"Pure sand",val:p.res.pureSand||0},
    {key:"refinedPotash",icon:"🌿",label:L==="cs"?"Čistá potaš":"Refined potash",val:p.res.refinedPotash||0},
    {key:"formy",icon:"🪚",label:L==="cs"?"Formy":"Moulds",val:p.res.formy||0,warn:(p.res.formy||0)<1&&isC},
    {key:"stone",icon:"🪨",label:L==="cs"?"Lomový kámen":"Quarry stone",val:p.res.stone||0},
    {key:"dryWood",icon:"🔥",label:L==="cs"?"Suché dříví":"Dry hardwood",val:p.res.dryWood||0},
    {key:"firebrick",icon:"🧱",label:L==="cs"?"Šamotové kvádry":"Firebrick",val:p.res.firebrick||0},
    {key:"pitch",icon:"🌲",label:L==="cs"?"Smůla":"Pitch",val:p.res.pitch||0},
  ];
  const resGrid=h("div",{class:"fj-material-grid",style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px"}});
  resItems.forEach(item=>{
    resGrid.append(h("div",{class:"fj-material-stock","data-material":item.key,"data-quantity":item.val,style:{padding:"6px",background:item.warn?"rgba(160,48,32,.06)":"rgba(0,0,0,.03)",
      borderRadius:"4px",border:`1px solid ${item.warn?"rgba(160,48,32,.2)":"rgba(42,26,10,.1)"}`,
      display:"flex",alignItems:"center",gap:"6px"}},
      h("span",{style:{fontSize:"14px"}},item.icon),
      h("div",null,
        h("div",{style:{fontSize:"9px",color:item.warn?"#a03020":"#8b5e34",textTransform:"uppercase",letterSpacing:".5px"}},item.label),
        h("div",{style:{fontSize:"16px",fontWeight:"700",color:item.warn?"#a03020":"#3a2a14"}},item.val))));
  });
  resSec.append(resGrid);
  content.append(resSec);

  // ── SEKCE 4: Ekonomika ──
  const ecoSec=h("div",{class:"sec"});
  ecoSec.append(h("div",{class:"sec-title"},L==="cs"?"💰 Ekonomika & huť":"💰 Economy & foundry"));
  const ecoItems=[
    {icon:"💰",label:L==="cs"?"Groše":"Groats",val:p.grose+"g",color:p.grose<5?"#a03020":"#3a2a14"},
    {icon:"📜",label:L==="cs"?"Dluh Weissovi":"Debt to Weiss",val:p.debt>0?p.debt+"g":"—",color:p.debt>0?"#a03020":"#8b5e34"},
    {icon:"👥",label:L==="cs"?"Dluh partě":"Crew debt",val:liabilities(p).crew>0?liabilities(p).crew+"g":"—",color:liabilities(p).crew>0?"#a03020":"#8b5e34"},
    {icon:"😊",label:L==="cs"?"Nálada":"Morale",val:p.morale+"%",color:p.morale>60?"#4a7a3a":p.morale>35?"#c9952b":"#a03020"},
    {icon:"🌲",label:L==="cs"?"Parcely lesa":"Forest parcels",val:`${p.forest}/${p.forestMax||INIT_FOREST}`,color:p.forest<=FOREST_WARN?"#a03020":"#3a2a14"},
    {icon:"🏺",label:L==="cs"?"Pánve hotové":"Crucibles ready",val:p.pReady+"×",color:p.pReady<1&&isC?"#a03020":"#3a2a14"},
    {icon:"🏺",label:L==="cs"?"Pánve zrají":"Crucibles aging",val:p.pAging.length+"×",color:"#8b5e34"},
    {icon:"⭐",label:L==="cs"?"Kvalita pánve":"Crucible quality",val:stars(p.panevQuality),color:"#c9952b"},
    {icon:"🔥",label:L==="cs"?"Účinnost pece":"Furnace eff.",val:fEff+"%",color:fEff>65?"#4a7a3a":fEff>45?"#c9952b":"#a03020"},
    {icon:"⚙️",label:L==="cs"?"Zaběhnutost":"Run-in",val:p.furnace.runIn+"%",color:"#c9952b"},
    {icon:"🧱",label:L==="cs"?"Šamot (opotřeben)":"Shamot worn",val:p.furnace.shamotWear+"%",color:p.furnace.shamotWear>70?"#a03020":"#8b5e34"},
  ];
  const ecoGrid=h("div",{class:"fj-economy-stock-grid",style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px"}});
  ecoItems.forEach(item=>{
    ecoGrid.append(h("div",{style:{padding:"6px",background:"rgba(0,0,0,.03)",borderRadius:"4px",
      border:"1px solid rgba(42,26,10,.1)",display:"flex",alignItems:"center",gap:"6px"}},
      h("span",{style:{fontSize:"14px"}},item.icon),
      h("div",null,
        h("div",{style:{fontSize:"9px",color:"#8b5e34",textTransform:"uppercase",letterSpacing:".5px"}},item.label),
        h("div",{style:{fontSize:"14px",fontWeight:"700",color:item.color||"#3a2a14"}},item.val))));
  });
  ecoSec.append(ecoGrid);
  content.append(ecoSec);
}
