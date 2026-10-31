// production.js — tab "production".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabProduction(ctx){
  const {L,isC,p,fEff,isDesktop,content}=ctx;
  // Waldglas
  const w1=h("div",{class:"sec","data-worksite":"potash"});
  w1.append(
    h("div",{class:"sec-title"},L==="cs"?"⚗️ Lesní sklo (Waldglas)":"⚗️ Forest Glass (Waldglas)"),
    h("div",{style:{fontSize:"11px",marginBottom:"6px",padding:"6px",background:"rgba(0,0,0,.03)",borderRadius:"4px"}},
      "3🏖️ + 2🌿 + 1🪨 + 1💧 + 🏺 → 🔥 Waldglas"),
    h("div",{style:{fontSize:"11px",color:"#8b5e34"}},
      isC?(p.fActive?`✅ ${L==="cs"?"Pec běží":"Furnace running"} ${zone(p.fTemp).l} ${p.fTemp}% · eff ${fEff}%`
        :`❌ ${L==="cs"?"Pec neběží — přidej palivo":"Furnace off — add fuel"}`)
        :`⏸️ ${L==="cs"?"Kampaň začíná v dubnu (Sv. Jiří)":"Campaign starts in April (St. George)"}`));
  if(p.waldglas.length){
    const inv=h("div",{style:{marginTop:"6px",display:"flex",flexWrap:"wrap",gap:"2px"}});
    p.waldglas.forEach(q=>{inv.append(h("span",{class:"stars",style:{marginRight:"2px",fontSize:"13px"}},stars(q)));});
    w1.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",marginTop:"4px"}},`${L==="cs"?"Sklad":"Stock"}: ${p.waldglas.length}×`),inv);
  }
  // w1 w2 w3 wFormy jsou sestaveny do gridu níže
  const w2=h("div",{class:"sec fj-material-card","data-material":"panev"});
  w2.append(
    h("div",{class:"sec-title"},L==="cs"?"🏺 Výroba pánví":"🏺 Crucible Making"),
    h("div",{style:{fontSize:"11px",marginBottom:"6px",padding:"6px",background:"rgba(0,0,0,.03)",borderRadius:"4px"}},
      `2🧱 + 1🍞 → 🏺 · ${L==="cs"?"Zrají":"Ages"} ${PANEV_AGE} ${L==="cs"?"měsíců · zimní výroba +1 kvalita":"months · winter production +1 quality"}`),
    h("div",{style:{display:"flex",gap:"8px",flexWrap:"wrap",fontSize:"11px",color:"#8b5e34"}},
      h("span",null,`${L==="cs"?"Hotové":"Ready"}: ${p.pReady}× ${stars(p.panevQuality)}`),
      h("span",null,`${L==="cs"?"Zrají":"Aging"}: ${p.pAging.length}×`),
      h("span",null,`${L==="cs"?"Zbývá použití":"Uses left"}: ${p.pUses}/${PANEV_DUR}`)));
  if(p.pAging.length){
    const agDiv=h("div",{style:{marginTop:"4px"}});
    p.pAging.forEach(pa=>{
      const readyMonth=(L==="cs"?MONTHS_CS:MONTHS_EN)[pa.rdy%MONTHS_CS.length];
      agDiv.append(h("div",{style:{fontSize:"10px",color:"#8b5e34"}},
        `🏺 ${stars(pa.q)} — ${L==="cs"?"hotovo v":"ready in"} ${readyMonth}`));
    });
    w2.append(agDiv);
  }
  const w3=h("div",{class:"sec"});
  w3.append(
    h("div",{class:"sec-title"},L==="cs"?"✨ Křišťál (Čiré sklo)":"✨ Crystal (Clear Glass)"),
    h("div",{style:{fontSize:"11px",marginBottom:"6px",padding:"6px",background:"rgba(0,0,0,.03)",borderRadius:"4px"}},
      `3✨ + 2🌿r + 1🪨 + 1⚫ → ✨ · ${L==="cs"?"Vyžaduje min. 65% teplotu":"Requires min. 65% temperature"}`),
    h("div",{style:{fontSize:"11px",color:"#8b5e34"}},
      `✨ ${L==="cs"?"Čistý písek":"Pure sand"}: ${p.res.pureSand} · 🌿r ${L==="cs"?"Čistá potaš":"Refined potash"}: ${p.res.refinedPotash} · ⚫ ${L==="cs"?"Uhlí":"Charcoal"}: ${p.res.charcoal}`));
  if(p.crystal.length){
    const inv=h("div",{style:{marginTop:"6px",display:"flex",flexWrap:"wrap",gap:"2px"}});
    p.crystal.forEach(q=>{inv.append(h("span",{class:"stars",style:{marginRight:"2px",fontSize:"13px",color:"#3a6a9a"}},stars(q)));});
    w3.append(h("div",{style:{fontSize:"10px",color:"#3a6a9a",marginTop:"4px"}},`${L==="cs"?"Sklad":"Stock"}: ${p.crystal.length}×`),inv);
  }
  // ── FORMY ──
  const wFormy=h("div",{class:"sec fj-material-card","data-material":"formy"});
  const formyInHutte=p.workers.filter(w=>w.prof==="formar");
  wFormy.append(h("div",{class:"sec-title"},"🌳 "+(L==="cs"?"Dřevěné formy":"Wooden Moulds")));
  wFormy.append(h("div",{style:{fontSize:"11px",marginBottom:"6px",padding:"6px",
    background:"rgba(0,0,0,.03)",borderRadius:"4px"}},
    `2🪵 + 2💧 + 1🍞 → 🪚 · ${L==="cs"?"Formař, hotové hned · uchovávány ve vodě":"Mould-maker, ready immediately · stored in water"}`));
  wFormy.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"4px"}},
    formyInHutte.length>0
      ?`🌳 ${L==="cs"?"Formař":"Mould-maker"}: ${formyInHutte.map(w=>w.name).join(", ")} · ${L==="cs"?"Hotové formy":"Ready moulds"}: ${p.res.formy||0}×`
      :`❌ ${L==="cs"?"Žádný Formař v huti":"No Mould-maker in foundry"}`));
  // Desktop: w1+w2 vlevo, w3+wFormy vpravo; wFouk pod jako full-width
  if(isDesktop){
    const prodGrid=h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"1px solid rgba(42,26,10,.1)"}});
    const prodLeft=h("div");
    prodLeft.append(w1,w2);
    const prodRight=h("div",{style:{borderLeft:"1px solid rgba(42,26,10,.1)"}});
    prodRight.append(w3,wFormy);
    prodGrid.append(prodLeft,prodRight);
    content.append(prodGrid);
  }else{
    content.append(w1,w2,w3,wFormy);
  }

  // ── FOUKANÉ VÝROBKY — vždy full-width pod gridem ──
  const wFouk=h("div",{class:"sec"});
  wFouk.append(h("div",{class:"sec-title"},"💨 "+(L==="cs"?"Foukané výrobky":"Blown Glassware")));
  const foukaci=p.workers.filter(w=>["foukat_lesni","foukat_kristal","foukat_dekor","foukat_formy"].includes(w.prof));
  if(foukaci.length===0){
    wFouk.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",fontStyle:"italic",padding:"4px 0"}},
      L==="cs"?"Žádný foukač v huti. Nastupují v dubnu (Sv. Jiří).":"No glassblower in foundry. They start in April (St. George)."));
  } else {
    const basicItems=Object.entries(BLOWN_ITEMS).filter(([,v])=>!v.specOnly);
    const specItems=Object.entries(BLOWN_ITEMS).filter(([,v])=>v.specOnly);

    // Helper: vykreslí kartu výrobku s výběrem barvy/vstupu
    function blownCard(key, it, isSpecWorker){
      const defaultColor=it.inputs[0];
      // Aktuálně vybraná barva pro tuto kartu (uložena v G._blownColor)
      if(!G._blownColor)G._blownColor={};
      const selColor=G._blownColor[key]||defaultColor;
      const stateKey=selColor==="waldglas"?key:key+"_"+selColor;
      const inv=p[stateKey]||[];
      const hasInput=(p[selColor]||[]).length>=it.qty;
      const needsForma=!!it.requiresMould||["dzban","misa","dzban_forma"].includes(key);
      const hasForma=!needsForma||(p.res.formy||0)>0;
      const missingResource=FajrumCatalog.resourceCost(it,p);
      const ok=isC&&p.fActive&&hasInput&&hasForma&&!missingResource&&(isSpecWorker||!it.specOnly);
      const estPrice=Math.round(it.base*COLOR_MULT[selColor]);
      const card=h("div",{style:{padding:"6px",borderRadius:"4px",
        border:`1px solid ${ok?"rgba(201,149,43,.3)":"rgba(42,26,10,.08)"}`,
        background:ok?"rgba(201,149,43,.05)":"rgba(0,0,0,.02)"}});
      card.classList.add("fj-recipe-card");
      card.dataset.product=key;card.dataset.glass=selColor;
      card.dataset.available=String(ok);
      if(window.FajrumProducts)card.append(FajrumProducts.picture(key,selColor));
      // Hlavička: ikona + jméno + cena
      card.append(h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px"}},
        h("span",{style:{fontSize:"11px"}},`${it.icon} ${L==="cs"?it.cs:it.en}`),
        h("span",{style:{fontSize:"10px",color:"#c9952b",fontWeight:"700"}},`~${estPrice}g`)));
      // Výběr barvy/vstupu — jen pokud má více možností
      if(it.inputs.length>1){
        const colorRow=h("div",{style:{display:"flex",gap:"2px",flexWrap:"wrap",marginBottom:"3px"}});
        it.inputs.forEach(col=>{
          const hasCol=(p[col]||[]).length>=it.qty;
          const btn=h("button",{
            class:"btn btn-s"+(col===selColor?" btn-active":""),
            "data-glass":col,
            style:{fontSize:"8px",padding:"1px 4px",opacity:hasCol?1:.45},
            title:`${col==="waldglas"?(L==="cs"?"Lesní sklo":"Waldglas"):col==="crystal"?(L==="cs"?"Křišťál":"Crystal"):COLOR_RECIPES[col]?(L==="cs"?COLOR_RECIPES[col].cs:COLOR_RECIPES[col].en):col} · ${hasCol?(p[col]||[]).length+"×":(L==="cs"?"chybí":"missing")}`,
            onClick:()=>{G._blownColor[key]=col;render();}},
            `${COLOR_ICON[col]||col}`);
          colorRow.append(btn);
        });
        card.append(colorRow);
      }
      // Sklad + craft button
      if(inv.length>0)card.append(h("div",{style:{fontSize:"9px",color:"#4a7a3a",marginBottom:"3px"}},
        `${L==="cs"?"Sklad":"Stock"}: ${inv.length}× ${stars(Math.round(inv.reduce((a,b)=>a+b,0)/inv.length))}`));
      const resourceMax=Math.min(999,...Object.entries(it.resCost||{}).map(([k,n])=>Math.floor((p.res[k]||0)/n)));
      const maxCraft = ok ? Math.min(resourceMax,Math.floor((p[selColor]||[]).length / it.qty), needsForma ? (p.res.formy || 0) : 999) : 0;
      if (ok && maxCraft > 1) {
        const btnRow = h("div", {class: "batch-btn-row"});
        btnRow.append(h("button", {
          class: "btn btn-s btn-p batch-btn",
          title: L === "cs" ? "Foukat 1 kus" : "Blow 1 piece",
          onClick: () => craftBlown(key, selColor)
        }, L === "cs" ? "1×" : "1×"));
        if (maxCraft >= 3) {
          btnRow.append(h("button", {
            class: "btn btn-s btn-p batch-btn",
            title: L === "cs" ? "Foukat 3 kusy" : "Blow 3 pieces",
            onClick: () => {
              for (let i = 0; i < 3; i++) {
                if ((G[selColor]||[]).length >= it.qty && (!needsForma || (G.res.formy||0) > 0)) {
                  craftBlown(key, selColor);
                }
              }
            }
          }, L === "cs" ? "3×" : "3×"));
        }
        btnRow.append(h("button", {
          class: "btn btn-s btn-p batch-btn",
          title: L === "cs" ? `Foukat vše (${maxCraft}×)` : `Blow max (${maxCraft}×)`,
          onClick: () => {
            const count = Math.min(maxCraft, 20);
            for (let i = 0; i < count; i++) {
              if ((G[selColor]||[]).length >= it.qty && (!needsForma || (G.res.formy||0) > 0)) {
                craftBlown(key, selColor);
              }
            }
          }
        }, `Max (${maxCraft}×)`));
        card.append(btnRow);
      } else {
        card.append(h("button",{class:"btn btn-s"+(ok?" btn-p":""),
          style:{width:"100%",fontSize:"9px",opacity:ok?1:.45},
          onClick:()=>{if(ok)craftBlown(key,selColor);}},
          ok?(L==="cs"?"Foukat →":"Blow →")
            :!isC||!p.fActive?(L==="cs"?"Pec neběží":"Furnace off")
            :!hasInput?(L==="cs"?`Chybí ${selColor}`:`No ${selColor}`)
            :missingResource?(L==="cs"?`Chybí ${missingResource[0]}`:`Missing ${missingResource[0]}`)
            :(L==="cs"?"Chybí forma":"No mould")));
      }
      return card;
    }

    wFouk.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",marginBottom:"6px",fontWeight:"700"}},
      L==="cs"?"Základní výrobky (všichni foukači):":"Basic wares (all blowers):"));
    const basicGrid=h("div",{class:"fj-recipe-grid",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px",marginBottom:"10px"}});
    basicItems.forEach(([key,it])=>{
      const spec=foukaci.find(w=>w.prof===it.spec);
      basicGrid.append(blownCard(key,it,!!spec));
    });
    wFouk.append(basicGrid);

    // Specializované výrobky — seskupeny po foukači
    const specGroups={foukat_lesni:[],foukat_kristal:[],foukat_dekor:[],foukat_formy:[]};
    specItems.forEach(([key,it])=>{if(specGroups[it.spec])specGroups[it.spec].push([key,it]);});
    Object.entries(specGroups).forEach(([profCode,items])=>{
      if(items.length===0)return;
      const specWorker=foukaci.find(w=>w.prof===profCode);
      const secLabel=h("div",{style:{fontSize:"10px",color:specWorker?"#c9952b":"#aaa",
        fontWeight:"700",margin:"6px 0 4px",display:"flex",alignItems:"center",gap:"4px"}});
      secLabel.append(
        h("span",null,`${specWorker?"💨":"⬜"} ${L==="cs"?PROF_CS[profCode]:PROF_EN[profCode]}`),
        specWorker?h("span",{style:{fontWeight:"400",fontSize:"9px"}},`— ${specWorker.name} ★×${specWorker.lv}`):
          h("span",{style:{fontStyle:"italic",fontWeight:"400"}},L==="cs"?" (není v huti)":" (not hired)"));
      wFouk.append(secLabel);
      const sGrid=h("div",{class:"fj-recipe-grid",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px",marginBottom:"4px",
        opacity:specWorker?1:.4}});
      items.forEach(([key,it])=>sGrid.append(blownCard(key,it,!!specWorker)));
      wFouk.append(sGrid);
    });
  }
  content.append(wFouk);

  // ── BROUŠENÍ ──
  const wBrus=h("div",{class:"sec","data-worksite":"grinding"});
  wBrus.append(h("div",{class:"sec-title"},"💎 "+(L==="cs"?"Broušení":"Grinding")));
  const hranar=p.workers.find(w=>w.prof==="brusic_hrana");
  const kulic=p.workers.find(w=>w.prof==="brusic_kulic");
  if(!hranar&&!kulic){
    wBrus.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",fontStyle:"italic",padding:"4px 0"}},
      L==="cs"?"Žádný brusič v huti. Nastupují v červnu.":"No grinder in foundry. They start in June."));
  } else {
    // Hranař
    if(hranar){
      wBrus.append(h("div",{style:{fontSize:"10px",color:"#3a6a9a",fontWeight:"700",margin:"4px 0"}},
        `💎 ${hranar.name} ★×${hranar.lv} — ${L==="cs"?"Hranař":"Edge-cutter"}`));
      const hGrid=h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px",marginBottom:"8px"}});
      ["brus_hrana_cise","brus_hrana_panel","brus_koule","brus_tezitko","brus_lustr_dil","brus_pokal"].forEach(key=>{
        const it=GROUND_ITEMS[key];
        const inv=p[key]||[];
        const hasInput=(p[it.input]||[]).length>=it.qty;
        const ok=isC&&hasInput;
        const card=h("div",{class:"fj-craft-card","data-product":key,"data-glass":"crystal","data-available":String(ok),style:{padding:"6px",borderRadius:"4px",
          border:`1px solid ${ok?"rgba(58,106,154,.3)":"rgba(42,26,10,.08)"}`,
          background:ok?"rgba(58,106,154,.04)":"rgba(0,0,0,.02)"}});
        card.append(
          h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"2px"}},
            h("span",{style:{fontSize:"11px"}},`${it.icon} ${L==="cs"?it.cs:it.en}`),
            h("span",{style:{fontSize:"10px",color:"#3a6a9a",fontWeight:"700"}},`~${it.base}g`)),
          h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"4px"}},
            `✨ ${it.qty}× crystal`),
          inv.length?h("div",{style:{fontSize:"9px",color:"#4a7a3a",marginBottom:"3px"}},`${L==="cs"?"Sklad":"Stock"}: ${inv.length}×`):"",
          h("button",{class:"btn btn-s"+(ok?" btn-p":""),
            style:{width:"100%",fontSize:"9px",opacity:ok?1:.45},
            onClick:()=>{if(ok)craftGround(key);}},
            ok?(L==="cs"?"Brousit →":"Grind →"):(L==="cs"?"Chybí křišťál":"Need crystal")));
        hGrid.append(card);
      });
      wBrus.append(hGrid);
    }
    // Kulič
    if(kulic){
      wBrus.append(h("div",{style:{fontSize:"10px",color:"#3a6a9a",fontWeight:"700",margin:"4px 0"}},
        `🔵 ${kulic.name} ★×${kulic.lv} — ${L==="cs"?"Kulič":"Sphere-grinder"}`));
      const kGrid=h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px",marginBottom:"8px"}});
      ["brus_vaza","brus_vaza_velka","brus_misa","brus_poharak",...Object.keys(FajrumCatalog.ground)].forEach(key=>{
        const it=GROUND_ITEMS[key];
        const inv=p[key]||[];
        const hasInput=(p[it.input]||[]).length>=it.qty;
        const ok=isC&&hasInput&&(!it.needsHeat||p.fActive)&&!FajrumCatalog.resourceCost(it,p);
        const card=h("div",{class:"fj-craft-card","data-product":key,"data-glass":it.input,"data-available":String(ok),style:{padding:"6px",borderRadius:"4px",
          border:`1px solid ${ok?"rgba(58,106,154,.3)":"rgba(42,26,10,.08)"}`,
          background:ok?"rgba(58,106,154,.04)":"rgba(0,0,0,.02)"}});
        card.append(
          h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"2px"}},
            h("span",{style:{fontSize:"11px"}},`${it.icon} ${L==="cs"?it.cs:it.en}`),
            h("span",{style:{fontSize:"10px",color:"#3a6a9a",fontWeight:"700"}},`~${it.base}g`)),
          h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"4px"}},`${COLOR_ICON[it.input]||"✨"} ${it.qty}× ${it.input}`),
          inv.length?h("div",{style:{fontSize:"9px",color:"#4a7a3a",marginBottom:"3px"}},`${L==="cs"?"Sklad":"Stock"}: ${inv.length}×`):"",
          h("button",{class:"btn btn-s"+(ok?" btn-p":""),
            style:{width:"100%",fontSize:"9px",opacity:ok?1:.45},
            onClick:()=>{if(ok)craftGround(key);}},
            ok?((L==="cs"?it.action_cs:it.action_en)||(L==="cs"?"Brousit →":"Grind →")):(L==="cs"?"Chybí vstup, surovina nebo žár":"Missing input, resource or heat")));
        kGrid.append(card);
      });
      wBrus.append(kGrid);
    }
  }
  content.append(wBrus);

  // ── RYTINY ──
  const wRyt=h("div",{class:"sec","data-worksite":"engraving"});
  wRyt.append(h("div",{class:"sec-title"},"✂️ "+(L==="cs"?"Rytiny (Rytec)":"Engravings (Engraver)")));
  const rytec=p.workers.find(w=>w.prof==="rytec");
  if(!rytec){
    wRyt.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",fontStyle:"italic",padding:"4px 0"}},
      L==="cs"?"Rytec není v huti. Nastupuje v červnu.":"No engraver in foundry. Starts in June."));
  } else {
    wRyt.append(h("div",{style:{fontSize:"11px",color:"#8b7a2a",marginBottom:"6px"}},
      `✂️ ${rytec.name} ★×${rytec.lv} · ${L==="cs"?"Rytina přidá +40% k ceně kusu (žlutěný křišťál +80%)":"Engraving adds +40% to piece price (stained crystal +80%)"}`));
    const rytGrid=h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}});
    ENGRAVE_INPUTS.forEach(key=>{
      const srcItem=engraveSrc(key);
      if(!srcItem)return;
      const inv=p[key]||[];
      const rytInv=p["rytina_"+key]||[];
      const srcBase=srcItem.base;
      const ok=isC&&inv.length>0;
      const card=h("div",{class:"fj-craft-card","data-product":"rytina_"+key,"data-available":String(ok),style:{padding:"6px",borderRadius:"4px",
        border:`1px solid ${ok?"rgba(139,122,42,.35)":"rgba(42,26,10,.08)"}`,
        background:ok?"rgba(139,122,42,.05)":"rgba(0,0,0,.02)"}});
      card.append(
        h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"2px"}},
          h("span",{style:{fontSize:"10px"}},`${srcItem.icon} ${L==="cs"?srcItem.cs:srcItem.en}`),
          h("span",{style:{fontSize:"10px",color:"#8b7a2a",fontWeight:"700"}},
            `~${Math.round(srcBase*engraveBonus(key))}g ✂️`)),
        h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"3px"}},
          `${L==="cs"?"Na skladě":"In stock"}: ${inv.length}× → rytina: ${rytInv.length}×`),
        h("button",{class:"btn btn-s"+(ok?" btn-p":""),
          style:{width:"100%",fontSize:"9px",opacity:ok?1:.45},
          onClick:()=>{if(ok)craftEngrave(key);}},
          ok?(L==="cs"?"Rytit →":"Engrave →"):(L==="cs"?"Nic k rytí":"Nothing to engrave")));
      rytGrid.append(card);
    });
    wRyt.append(rytGrid);
  }
  content.append(wRyt);

  // ── SPECIÁLNÍ VÝROBKY ──
  const wSpec=h("div",{class:"sec"});
  wSpec.append(h("div",{class:"sec-title"},"🪟 "+(L==="cs"?"Okenní sklo & Speciální výrobky":"Window Glass & Special Items")));

  // Terčíky — craft karta (viditelná od začátku)
  const tercikStock=p.tercik?.length||0;
  const vyplneStock=p.tercik_vyplne?.length||0;
  const tercikIt=BLOWN_ITEMS.tercik;
  const hasTercikInput=(p.waldglas||[]).length>=2;
  const hasFoukacLesni=!!p.workers.find(w=>w.prof==="foukat_lesni"||w.prof==="tavic");
  const tercikOk=isC&&p.fActive&&hasTercikInput&&hasFoukacLesni;
  const tercikCard=h("div",{class:"fj-craft-card","data-product":"tercik","data-glass":"waldglas","data-available":String(tercikOk),style:{padding:"8px",borderRadius:"5px",
    border:`1px solid ${tercikOk?"rgba(74,122,58,.4)":"rgba(42,26,10,.1)"}`,
    background:tercikOk?"rgba(74,122,58,.06)":"rgba(0,0,0,.02)",
    marginBottom:"6px"}});
  [
    h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
      h("span",{style:{fontSize:"12px",fontWeight:"700"}},"🪟 "+(L==="cs"?"Okenní terčíky":"Window discs")),
      h("span",{style:{fontSize:"11px",color:"#4a7a3a",fontWeight:"700"}},"~3–9g/ks")),
    h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"4px",lineHeight:"1.5"}},
      L==="cs"
        ?"🟫 2× waldglas → 2–3× terčík Ø8–10 cm. Nepodařené (kval.≤2) → výplně (2g). Prémiové (kval.≥4) → žebrové (9g)."
        :"🟫 2× waldglas → 2–3× window disc Ø8–10 cm. Rejects (qual.≤2) → fillers (2g). Premium (qual.≥4) → ribbed (9g)."),
    !hasFoukacLesni?h("div",{style:{fontSize:"9px",color:"#a03020",marginBottom:"3px"}},
      L==="cs"?"⛔ Foukač nastupuje v dubnu (Sv. Jiří)":"⛔ Blower joins in April (St. George's Day)"):null,
    !hasTercikInput&&hasFoukacLesni?h("div",{style:{fontSize:"9px",color:"#a03020",marginBottom:"3px"}},
      L==="cs"?"⛔ Nedostatek waldglasu (2×)":"⛔ Not enough waldglas (2×)"):null,
    tercikStock>0||vyplneStock>0?h("div",{style:{fontSize:"9px",color:"#4a7a3a",marginBottom:"3px"}},
      `${L==="cs"?"Sklad":"Stock"}: ${tercikStock}× ${L==="cs"?"terčík":"disc"}`+(vyplneStock>0?` + ${vyplneStock}× ${L==="cs"?"výplň":"filler"}`:"")+(p.tercik_zebrovy?.length>0?` + ${p.tercik_zebrovy.length}× ${L==="cs"?"žebrový":"ribbed"}`:"")):null,
    h("button",{class:"btn btn-s"+(tercikOk?" btn-p":""),
      style:{width:"100%",fontSize:"10px",opacity:tercikOk?1:.45},
      onClick:()=>{if(tercikOk)craftBlown("tercik","waldglas");}},
      tercikOk?(L==="cs"?"Foukat terčíky →":"Blow window discs →")
        :!isC||!p.fActive?(L==="cs"?"Pec neběží":"Furnace off")
        :!hasFoukacLesni?(L==="cs"?"Čeká na foukače (duben)":"Waiting for blower (April)")
        :(L==="cs"?"Podmínky nesplněny":"Requirements not met"))
  ].filter(Boolean).forEach(n=>tercikCard.append(n));
  wSpec.append(tercikCard);

  // Terčíky — přehled skladu
  if(tercikStock>0||vyplneStock>0){
    wSpec.append(h("div",{style:{fontSize:"10px",color:"#4a7a3a",marginBottom:"4px"}},
      `🪟 ${L==="cs"?"Terčíky na skladě":"Window discs in stock"}: ${tercikStock}× ` +
      (vyplneStock>0?`+ ${vyplneStock}× ${L==="cs"?"výplně":"fillers"}`:"")));
  }

  // Zrcadlo — craft sekce
  const zrIt=SPECIAL_ITEMS.zrcadlo;
  const hasBrusic=!!p.workers.find(w=>w.prof==="brusic_hrana");
  const hasCrystal2=(p.crystal||[]).length>=2;
  const hasRtut=(p.additives?.rtut||0)>=1;
  const hasCin=(p.additives?.cin||0)>=1;
  const zrOk=isC&&p.fActive&&hasCrystal2&&hasRtut&&hasCin&&hasBrusic&&p.season>=3;
  const zrStock=p.zrcadlo?.length||0;

  const zrCard=h("div",{class:"fj-craft-card","data-product":"zrcadlo","data-glass":"crystal","data-available":String(zrOk),style:{padding:"8px",borderRadius:"5px",
    border:`1px solid ${zrOk?"rgba(201,149,43,.4)":"rgba(42,26,10,.1)"}`,
    background:zrOk?"rgba(201,149,43,.06)":"rgba(0,0,0,.02)",
    marginBottom:"6px"}});
  [
    h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
      h("span",{style:{fontSize:"12px",fontWeight:"700"}},`🪞 ${L==="cs"?zrIt.cs:zrIt.en}`),
      h("span",{style:{fontSize:"11px",color:"#c9952b",fontWeight:"700"}},`~${zrIt.sell_cs}g`)),
    h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"4px",lineHeight:"1.5"}},
      `✨ 2× crystal  🩶 1× ${L==="cs"?"rtuť":"mercury"}  ⚪ 1× ${L==="cs"?"cín":"tin"}`),
    h("div",{style:{fontSize:"9px",color:hasBrusic?"#4a7a3a":"#a03020",marginBottom:"3px"}},
      hasBrusic?`💎 ${p.workers.find(w=>w.prof==="brusic_hrana").name}`
        :(L==="cs"?"⛔ Chybí hranař":"⛔ Missing edge-cutter")),
    !hasCrystal2?h("div",{style:{fontSize:"9px",color:"#a03020",marginBottom:"3px"}},
      L==="cs"?"⛔ Nedostatek křišťálu (2×)":"⛔ Not enough crystal (2×)"):null,
    !hasRtut?h("div",{style:{fontSize:"9px",color:"#a03020",marginBottom:"3px"}},
      L==="cs"?"⛔ Chybí rtuť — kup od Baranovského (sez. 3+)":"⛔ Missing mercury — buy from Baranovský (season 3+)"):null,
    !hasCin?h("div",{style:{fontSize:"9px",color:"#a03020",marginBottom:"3px"}},
      L==="cs"?"⛔ Chybí cín":"⛔ Missing tin"):null,
    p.season<3?h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"3px",fontStyle:"italic"}},
      L==="cs"?"Dostupné od sezóny 3":"Available from season 3"):null,
    zrStock>0?h("div",{style:{fontSize:"9px",color:"#4a7a3a",marginBottom:"3px"}},
      `${L==="cs"?"Sklad":"Stock"}: ${zrStock}× ${stars(Math.round((p.zrcadlo||[]).reduce((a,b)=>a+b,0)/zrStock))||""}`):null,
    h("button",{class:"btn btn-s"+(zrOk?" btn-p":""),
      style:{width:"100%",fontSize:"10px",opacity:zrOk?1:.45},
      onClick:()=>{if(zrOk)craftSpecial("zrcadlo");}},
      zrOk?(L==="cs"?"Vyrobit zrcadlo →":"Make mirror →")
        :(L==="cs"?"Podmínky nesplněny":"Requirements not met"))
  ].filter(Boolean).forEach(n=>zrCard.append(n));
  wSpec.append(zrCard);

  // Alembik — craft sekce
  const alIt=SPECIAL_ITEMS.alembik;
  const hasFoukacKrist=!!p.workers.find(w=>w.prof==="foukat_kristal");
  const hasCrystal2al=(p.crystal||[]).length>=2;
  const hasArsen=(p.additives?.arsen||0)>=1;
  const alOk=isC&&p.fActive&&hasCrystal2al&&hasArsen&&hasFoukacKrist&&p.season>=2;
  const alStock=p.alembik?.length||0;

  const alCard=h("div",{class:"fj-craft-card","data-product":"alembik","data-glass":"crystal","data-available":String(alOk),style:{padding:"8px",borderRadius:"5px",
    border:`1px solid ${alOk?"rgba(122,74,154,.4)":"rgba(42,26,10,.1)"}`,
    background:alOk?"rgba(122,74,154,.05)":"rgba(0,0,0,.02)",
    marginBottom:"6px"}});
  [
    h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
      h("span",{style:{fontSize:"12px",fontWeight:"700"}},`⚗️ ${L==="cs"?alIt.cs:alIt.en}`),
      h("span",{style:{fontSize:"11px",color:"#7a4a9a",fontWeight:"700"}},`~${alIt.sell_cs}g`)),
    h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"4px",lineHeight:"1.5"}},
      `✨ 2× crystal  🧪 1× ${L==="cs"?"arsen (As₂O₃)":"arsenic (As₂O₃)"}`),
    h("div",{style:{fontSize:"9px",color:hasFoukacKrist?"#4a7a3a":"#a03020",marginBottom:"3px"}},
      hasFoukacKrist?`💨 ${p.workers.find(w=>w.prof==="foukat_kristal").name}`
        :(L==="cs"?"⛔ Chybí foukač křišťálu":"⛔ Missing crystal blower")),
    !hasCrystal2al?h("div",{style:{fontSize:"9px",color:"#a03020",marginBottom:"3px"}},
      L==="cs"?"⛔ Nedostatek křišťálu (2×)":"⛔ Not enough crystal (2×)"):null,
    !hasArsen?h("div",{style:{fontSize:"9px",color:"#a03020",marginBottom:"3px"}},
      L==="cs"?"⛔ Chybí arsen — čeřidlo/dekolorant (As₂O₃)":"⛔ Missing arsenic — fining agent (As₂O₃)"):null,
    p.season<2?h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"3px",fontStyle:"italic"}},
      L==="cs"?"Dostupné od sezóny 2":"Available from season 2"):null,
    alStock>0?h("div",{style:{fontSize:"9px",color:"#4a7a3a",marginBottom:"3px"}},
      `${L==="cs"?"Sklad":"Stock"}: ${alStock}×`):null,
    h("button",{class:"btn btn-s"+(alOk?" btn-p":""),
      style:{width:"100%",fontSize:"10px",opacity:alOk?1:.45},
      onClick:()=>{if(alOk)craftSpecial("alembik");}},
      alOk?(L==="cs"?"Vyrobit alembik →":"Make alembic →")
        :(L==="cs"?"Podmínky nesplněny":"Requirements not met"))
  ].filter(Boolean).forEach(n=>alCard.append(n));
  wSpec.append(alCard);

  // Info note
  wSpec.append(h("div",{style:{fontSize:"9px",color:"#8b6a3a",fontStyle:"italic",lineHeight:"1.5",
    borderTop:"1px solid rgba(42,26,10,.08)",paddingTop:"6px"}},
    L==="cs"
      ?"🪟 Terčíky = foukané jako základní výrobek, quality≤2 → výplně, ≥4 → žebrový. 🪞 Rtuť jen od Baranovského (sez.3+). ⚗️ Alembik = zakázka alchymisty/lékárníka."
      :"🪟 Window discs = blown as basic item, quality≤2 → fillers, ≥4 → ribbed. 🪞 Mercury only from Baranovský (season 3+). ⚗️ Alembic = alchemist/apothecary commission."));

  if(window.FajrumRecipeUI)FajrumRecipeUI.specialCards(wSpec,p,{isCampaign:isC,craft:craftSpecial});
  content.append(wSpec);
}
