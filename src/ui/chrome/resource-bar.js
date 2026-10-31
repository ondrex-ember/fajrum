// resource-bar.js — resource bar.
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderResourceBar(ctx){
  const {p,isDesktop,L,isC}=ctx;
  // Resource bar s tooltips
  const md=MONTH_DATA[p.round]||MONTH_DATA[0];
  const wMult=WINTER_LOG_MULT[p.round]||1;
  const resBar=h("div",{class:"res-bar"});
  const sep=()=>h("span",{class:"pill-sep"},"│");
  const grpLabel=(txt)=>h("span",{style:{fontSize:"8px",color:"#8b5e34",textTransform:"uppercase",
    letterSpacing:"1px",opacity:.6,flexShrink:0,alignSelf:"center",marginRight:"1px"}},txt);
  const colorStockKeys=["jantar","zlut","modra","smaragd","lattimo","rubin"];
  const colorIcons={jantar:"🟤",zlut:"🟨",modra:"🔵",smaragd:"🟢",lattimo:"⚪",rubin:"🔴"};
  const colorStock=colorStockKeys.reduce((s,k)=>{const arr=p[k];return s+(Array.isArray(arr)?arr.length:0);},0);
  const rainbowTip=colorStockKeys.map(k=>{const n=Array.isArray(p[k])?p[k].length:0;return n>0?`${colorIcons[k]}${n}`:"";}).filter(Boolean).join(" ")||"—";
  // Přísady na skladě
  const additives=p.additives||{};
  const additivesTotal=Object.values(additives).reduce((s,v)=>s+(v||0),0);
  const additivesTip=Object.entries(ADDITIVES).map(([k,ad])=>{const n=additives[k]||0;return n>0?`${ad.icon}${n}`:""}).filter(Boolean).join(" ")||"—";
  
  // Tier materiály
  const hasStone=(p.res.stone||0)>0;
  const hasDryWood=(p.res.dryWood||0)>0;
  const hasFirebrick=(p.res.firebrick||0)>0;
  const hasPitch=(p.res.pitch||0)>0;

  if(isDesktop){
    resBar.append(
      grpLabel(L==="cs"?"Les":"For."),
      pillTip("🌲",p.forest+"/"+(p.forestMax||INIT_FOREST),p.forest<=FOREST_WARN?"warn":"",L==="cs"?`Hvozd: ${p.forest} parcel`:`Forest: ${p.forest} parcels`),
      pillTip("🌳",p.res.wood,p.res.wood<5?"ember":p.res.wood<10?"warn":"key",L==="cs"?`Dřevo: ${p.res.wood} · potřeba 9/várku`:`Wood: ${p.res.wood} · need 9/melt`,"wood"),
      ...(hasDryWood?[pillTip("🔥",p.res.dryWood||0,"",L==="cs"?`Suché dříví: ${p.res.dryWood||0} · vysušené tvrdé dřevo pro zimní žár`:`Dry wood: ${p.res.dryWood||0}`,"dryWood")]:[]),
      ...(hasPitch?[pillTip("🌲",p.res.pitch||0,"",L==="cs"?`Smůla: ${p.res.pitch||0} · izolace a těsnění`:`Pitch: ${p.res.pitch||0}`,"pitch")]:[]),
      sep(),
      grpLabel(L==="cs"?"Suro.":"Mats"),
      pillTip("🏖️",p.res.sand,"",L==="cs"?`Písek: ${p.res.sand}`:`Sand: ${p.res.sand}`,"sand"),
      pillTip("🟩",p.res.limestone,"",L==="cs"?`Vápenec: ${p.res.limestone}`:`Limestone: ${p.res.limestone}`,"limestone"),
      pillTip("🌿",p.res.potash,p.res.potash===0?"ember":p.res.potash<2?"warn":"key",L==="cs"?`Potaš: ${p.res.potash} · přiřaď Loužírnu!`:`Potash: ${p.res.potash} · assign Potash!`,"potash"),
      pillTip("💧",p.res.water,"",L==="cs"?`Voda: ${p.res.water}`:`Water: ${p.res.water}`,"water"),
      pillTip("🧱",p.res.clay,"",L==="cs"?`Jíl: ${p.res.clay}`:`Clay: ${p.res.clay}`,"clay"),
      ...(hasStone?[pillTip("🪨",p.res.stone||0,"",L==="cs"?`Lomový kámen: ${p.res.stone||0} · stavba huti a pecí`:`Quarry stone: ${p.res.stone||0}`,"stone")]:[]),
      ...(hasFirebrick?[pillTip("🧱",p.res.firebrick||0,"",L==="cs"?`Šamotové kvádry: ${p.res.firebrick||0} · žáruvzdorné cihly`:`Firebricks: ${p.res.firebrick||0}`,"firebrick")]:[]),
      pillTip("🍞",p.res.food,p.res.food<2?"warn":"",L==="cs"?`Jídlo: ${p.res.food}`:`Food: ${p.res.food}`,"food"),
      sep(),
      grpLabel(L==="cs"?"Výr.":"Prod."),
      pillTip("🏺",p.pReady+(p.pAging.length?"+"+p.pAging.length:""),p.pReady<1&&isC?"warn":"key",L==="cs"?`Pánve: ${p.pReady} hotové, ${p.pAging.length} zrají · kval. ${stars(p.panevQuality)}`:`Crucibles: ${p.pReady} ready, ${p.pAging.length} curing`,"panev"),
      pillTip("🌳",p.res.formy||0,"",L==="cs"?`Formy: ${p.res.formy||0}`:`Moulds: ${p.res.formy||0}`,"formy"),
      ...(additivesTotal>0?[pillTip("🧪",additivesTotal,"",L==="cs"?`Přísady: ${additivesTip}`:`Additives: ${additivesTip}`)]:[]),
      ...(colorStock>0?[pillTip("🌈",colorStock,"",L==="cs"?`Barevné sklo: ${rainbowTip}`:`Coloured glass: ${rainbowTip}`)]:[]),
      sep(),
      grpLabel(L==="cs"?"Huť":"Hut"),
      pillTip("😊",p.morale+"%",p.morale<40?"warn":"key",L==="cs"?`Nálada: ${p.morale}%`:`Morale: ${p.morale}%`));
  }else{
    const row1=h("div",{class:"pill-row pill-primary"});
    row1.append(
      grpLabel(L==="cs"?"Les":"For."),
      pillTip("🌲",p.forest+"/"+(p.forestMax||INIT_FOREST),p.forest<=FOREST_WARN?"warn":"",L==="cs"?`Hvozd: ${p.forest} parcel`:`Forest: ${p.forest} parcels`),
      pillTip("🌳",p.res.wood,p.res.wood<5?"warn":"",L==="cs"?`Dřevo: ${p.res.wood}`:`Wood: ${p.res.wood}`,"wood"),
      ...(hasDryWood?[pillTip("🔥",p.res.dryWood||0,"",L==="cs"?`Suché: ${p.res.dryWood||0}`:`Dry: ${p.res.dryWood||0}`,"dryWood")]:[]),
      sep(),
      pillTip("🌿",p.res.potash,p.res.potash<2?"warn":"",L==="cs"?`Potaš: ${p.res.potash}`:`Potash: ${p.res.potash}`,"potash"),
      pillTip("🍞",p.res.food,p.res.food<2?"warn":"",L==="cs"?`Jídlo: ${p.res.food}`:`Food: ${p.res.food}`,"food"),
      sep(),
      pillTip("😊",p.morale+"%",p.morale<40?"warn":"",L==="cs"?`Nálada: ${p.morale}%`:`Morale: ${p.morale}%`));
    const row2=h("div",{class:"pill-row"});
    row2.append(
      grpLabel(L==="cs"?"Suro.":"Mat."),
      pillTip("🏖️",p.res.sand,"",L==="cs"?`Písek: ${p.res.sand}`:`Sand: ${p.res.sand}`,"sand"),
      pillTip("🟩",p.res.limestone,"",L==="cs"?`Vápenec: ${p.res.limestone}`:`Limestone: ${p.res.limestone}`,"limestone"),
      pillTip("💧",p.res.water,"",L==="cs"?`Voda: ${p.res.water}`:`Water: ${p.res.water}`,"water"),
      pillTip("🧱",p.res.clay,"",L==="cs"?`Jíl: ${p.res.clay}`:`Clay: ${p.res.clay}`,"clay"),
      ...(hasStone?[pillTip("🪨",p.res.stone||0,"",L==="cs"?`Kámen: ${p.res.stone||0}`:`Stone: ${p.res.stone||0}`,"stone")]:[]),
      ...(hasFirebrick?[pillTip("🧱",p.res.firebrick||0,"",L==="cs"?`Šamot: ${p.res.firebrick||0}`:`Brick: ${p.res.firebrick||0}`,"firebrick")]:[]),
      sep(),
      grpLabel(L==="cs"?"Výr.":"Pr."),
      pillTip("🏺",p.pReady+(p.pAging.length?"+"+p.pAging.length:""),p.pReady<1&&isC?"warn":"",L==="cs"?`Pánve: ${p.pReady} hotové · kval. ${stars(p.panevQuality)}`:`Crucibles: ${p.pReady} ready`,"panev"),
      pillTip("🌳",p.res.formy||0,"",L==="cs"?`Formy: ${p.res.formy||0}`:`Moulds: ${p.res.formy||0}`,"formy"),
      ...(additivesTotal>0?[pillTip("🧪",additivesTotal,"",L==="cs"?`Přísady: ${additivesTip}`:`Additives: ${additivesTip}`)]:[]),
      ...(colorStock>0?[pillTip("🌈",colorStock,"",L==="cs"?`Barvy: ${rainbowTip}`:`Colours: ${rainbowTip}`)]:[]))
    resBar.append(row1,row2);
  }
  app.append(!isDesktop&&window.FajrumUI?FajrumUI.resources(resBar,p):resBar);
  return {md};
}
