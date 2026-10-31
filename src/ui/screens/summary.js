// summary.js — month summary screen (phase "summary").
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderSummaryScreen(ctx){
  const {p,ms,L}=ctx;
  const sd=p.summary, pr=p.round-1;
  const hdr=h("div",{class:"hdr"},
    h("span",{style:{fontWeight:"700"}},ms[pr]+" — "+(pr<PREP?(L==="cs"?"Příprava":"Prep"):(L==="cs"?"Kampaň":"Campaign"))));
  const body=h("div",{class:"sec",style:{overflowY:"auto",maxHeight:"calc(100vh - 140px)"}});

  // ── SKLAD SKLA + EKONOMIKA (původní 2-sloupcový grid) ──
  const grid=h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}});
  grid.append(
    h("div",{style:{padding:"8px",background:"rgba(74,122,58,.08)",borderRadius:"4px"}},
      h("div",{style:{fontSize:"10px",color:"#4a7a3a",fontWeight:"700"}},L==="cs"?"SKLAD SKLA":"GLASS STOCK"),
      h("div",{style:{fontSize:"18px",fontWeight:"700"}},"🔥 "+p.waldglas.length),
      p.crystal.length?h("div",{style:{fontSize:"12px",color:"#3a6a9a"}},"✨ "+p.crystal.length):null,
      h("div",{style:{fontSize:"9px",color:"#8b5e34",marginTop:"2px",fontStyle:"italic"}},L==="cs"?"kusů čeká na prodej":"pieces awaiting sale")),
    h("div",{style:{padding:"8px",background:"rgba(139,94,52,.08)",borderRadius:"4px"}},
      h("div",{style:{fontSize:"10px",color:"#8b5e34",fontWeight:"700"}},L==="cs"?"EKONOMIKA":"ECONOMY"),
      h("div",{style:{fontSize:"18px",fontWeight:"700"}},"💰 "+p.grose+"g"),
      p.debt>0?h("div",{style:{fontSize:"11px",color:"#a03020"}},"📜 "+(L==="cs"?"Weiss ":"Weiss ")+p.debt+"g"):null,
      liabilities(p).crew>0?h("div",{style:{fontSize:"11px",color:"#a03020"}},"👥 "+(L==="cs"?"parta ":"crew ")+liabilities(p).crew+"g"):null));
  body.append(grid);

  // ── STAV HUTĚ ──
  body.append(
    h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"3px"}},`🔥 ${L==="cs"?"Pec":"Furnace"}: eff ${sd.fEff}%${sd.furnTemp!=null?" · 🌡️ "+sd.furnTemp+"%":""} · ${L==="cs"?"zaběhnutost":"run-in"} ${p.furnace.runIn}%`),
    h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"3px"}},`🌲 ${L==="cs"?"Hvozd":"Forest"}: ${p.forest}/${p.forestMax||INIT_FOREST}${sd.fCut?" (-"+sd.fCut+")":""}`),
    h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"8px"}},`🏺 ${L==="cs"?"Pánve":"Crucibles"}: ${p.pReady} + ${p.pAging.length} ${L==="cs"?"zrají":"aging"} · ${L==="cs"?"kval.":"qual."} ${stars(p.panevQuality)}`));

  // ── CO SE UDÁLO — produkce + těžba ──
  const prodBox=h("div",{style:{background:"rgba(74,122,58,.06)",borderRadius:"4px",padding:"8px 10px",marginBottom:"8px",borderLeft:"3px solid #4a7a3a"}});
  prodBox.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#4a7a3a",marginBottom:"5px"}},L==="cs"?"⚗️ PRODUKCE KOLA":"⚗️ ROUND PRODUCTION"));
  // Sklo
  const newWgS=(p.waldglas?.length||0), newCrS=(p.crystal?.length||0);
  if(newWgS>0||newCrS>0){
    prodBox.append(h("div",{style:{fontSize:"11px",marginBottom:"3px",color:"#3a2a14"}},
      `🔥 ${newWgS}× waldglas${newCrS>0?" · ✨ "+newCrS+"× křišťál":""} ${L==="cs"?"na skladě":"in stock"}`));
  }
  // Přírůstek produkce tohoto kola (starší save ve fázi summary tato pole nemá)
  const sumGainW=sd.prodW||0, sumGainC=sd.prodC||0, sumGainP=sd.newPanve||0;
  if(sumGainW>0||sumGainC>0||sumGainP>0){
    const gainParts=[];
    if(sumGainW>0)gainParts.push(`🔥 +${sumGainW}× waldglas`);
    if(sumGainC>0)gainParts.push(`✨ +${sumGainC}× ${L==="cs"?"křišťál":"crystal"}`);
    if(sumGainP>0)gainParts.push(`🏺 +${sumGainP}× ${L==="cs"?"pánev hotová":"crucible ready"}`);
    prodBox.append(h("div",{style:{fontSize:"11px",fontWeight:"700",marginBottom:"4px",color:"#4a7a3a"}},
      `${L==="cs"?"Přírůstek":"Gained"}: ${gainParts.join(" · ")}`));
  }
  // Suroviny delta
  const resReport=[
    {icon:"🪵",label:L==="cs"?"Dřevo":"Wood",k:"wood"},{icon:"🏖️",label:L==="cs"?"Písek":"Sand",k:"sand"},
    {icon:"🌿",label:L==="cs"?"Potaš":"Potash",k:"potash"},{icon:"🪨",label:L==="cs"?"Vápenec":"Limestone",k:"limestone"},
    {icon:"💧",label:L==="cs"?"Voda":"Water",k:"water"},{icon:"🧱",label:L==="cs"?"Jíl":"Clay",k:"clay"},
    {icon:"🍞",label:L==="cs"?"Jídlo":"Food",k:"food"},{icon:"🌳",label:L==="cs"?"Formy":"Moulds",k:"formy"},
    {icon:"🏺",label:L==="cs"?"Pánve":"Crucibles",k:"pReady"}
  ];
  const resGrid=h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 8px"}});
  resReport.forEach(({icon,label,k})=>{
    const cur=k==="pReady"?p.pReady:(p.res[k]||0);
    if(cur>0||k==="food"||k==="wood"){
      resGrid.append(h("div",{style:{fontSize:"10px",color:"#8b5e34"}},
        `${icon} ${label}: ${cur}`));
    }
  });
  prodBox.append(resGrid);

  // Práce dělníků v tomto kole (řádky __PROD__ z logu kola)
  const sumWorkerProd=sd.workerProd||[];
  if(sumWorkerProd.length>0){
    const wpBox=h("div",{style:{marginTop:"6px",paddingTop:"5px",borderTop:"1px solid rgba(74,122,58,.2)"}});
    wpBox.append(h("div",{style:{fontSize:"9px",fontWeight:"700",color:"#4a7a3a",marginBottom:"3px"}},
      L==="cs"?"👷 PRÁCE V TOMTO KOLE":"👷 WORK THIS ROUND"));
    sumWorkerProd.slice(0,14).forEach(t=>wpBox.append(h("div",{style:{fontSize:"10px",color:"#3a2a14",marginBottom:"2px",lineHeight:"1.4"}},t)));
    prodBox.append(wpBox);
  }

  // Hint co dělat dál — pouze pokud není vypnuté v settings
  const showHints=p.showHints!==false; // default: zapnuto
  const nextHints=[];
  if(showHints){
    if(!p.fActive&&p.round>=PREP) nextHints.push(L==="cs"?"🔥 Pec chladí — přidej palivo (Dřevo·Pec → Palivo 80%+)":"🔥 Furnace cold — add fuel");
    if((p.waldglas?.length||0)>2&&p.grose<15) nextHints.push(L==="cs"?`💰 Máš ${p.waldglas.length}× neprodané sklo → jdi na Trh a prodej`:`💰 ${p.waldglas.length}× unsold glass → go to Market`);
    if(p.pReady<1) nextHints.push(L==="cs"?"🏺 Žádné pánve — přiřaď Káninského na Pánvař":"🏺 No crucibles — assign to Crucible task");
    if((p.res.wood||0)<8) nextHints.push(L==="cs"?"🪵 Dřevo dochází — nakup u Weisse (Trh) nebo pošli Komára kácet":"🪵 Low wood — buy at market or send logger");
    if((p.res.potash||0)<3&&p.round>=4) nextHints.push(L==="cs"?"🌿 Potaš dochází — Loužírna potřebuje 6🪵 a dělníka":"🌿 Potash low — Potash station needs 6 wood");
    if(p.debt>30&&p.grose<5) nextHints.push(L==="cs"?`📜 Dluh ${p.debt}g a prázdná pokladna — prodej sklo nebo půjč od Faktora Weisse`:`📜 Debt ${p.debt}g, empty purse — sell glass or borrow from Factor Weiss`);
    if(sd.wagesDeficit>0) nextHints.push(L==="cs"?`⚠️ Nezaplaceno ${sd.wagesDeficit}g — dělníci jsou nespokojení. Splaťte z Účtů.`:`⚠️ Unpaid ${sd.wagesDeficit}g — workers unhappy. Pay from Accounts tab.`);
    // Nové hinty v8
    if(p.round>=PREP&&p.waldglas.length===0&&p.crystal.length===0) nextHints.push(L==="cs"?"🫥 Prázdná sklárna — zkontroluj pánve a palivo v tabu Pec":"🫥 Empty foundry — check crucibles and fuel in Furnace tab");
    if((p.tercik?.length||0)===0&&p.round>=PREP) nextHints.push(L==="cs"?"🪟 Terčíky = rychlé groše — jdi na Výroba → Okenní sklo":"🪟 Window discs = quick coin — go to Production → Window glass");
    if(p.morale<40) nextHints.push(L==="cs"?"😟 Nálada klesla — dej lidem pivo nebo zaplaď mzdy (Huť → Účty)":"😟 Morale low — give beer or pay wages (Foundry → Accounts)");
    if((p.res.sand||0)<3&&p.round<PREP) nextHints.push(L==="cs"?"🏖️ Dochází písek — pošli horníka nebo nakup u Weisse":"🏖️ Low sand — send miner or buy from Weiss");
  }

  if(nextHints.length>0){
    const nhBox=h("div",{style:{background:"rgba(139,94,52,.06)",borderRadius:"4px",padding:"8px 10px",marginBottom:"8px",borderLeft:"3px solid #8b5e34"}});
    const nhHdr=h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}});
    nhHdr.append(
      h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34"}},L==="cs"?"💡 CO DÁL":"💡 NEXT STEPS"),
      h("button",{class:"btn btn-s",style:{fontSize:"8px",padding:"1px 5px",opacity:.6},
        onClick:()=>{G.showHints=false;render();}},L==="cs"?"skrýt":"hide"));
    nhBox.append(nhHdr);
    nextHints.slice(0,4).forEach(h2=>nhBox.append(h("div",{style:{fontSize:"10px",color:"#3a2a14",marginBottom:"3px",lineHeight:"1.4"}},h2)));
    body.append(nhBox);
  }else if(!showHints){
    // Skryté hinty — malý odkaz pro obnovení
    const restoreDiv=h("div",{style:{fontSize:"9px",color:"rgba(139,94,52,.5)",textAlign:"right",
      marginBottom:"4px",cursor:"pointer"},onClick:()=>{G.showHints=true;render();}},
      L==="cs"?"💡 zobrazit tipy":"💡 show tips");
    body.append(restoreDiv);
  }
  body.append(prodBox);

  // ── FINANČNÍ PŘEHLED & DLUHOVÝ ROZBOR KOLA ──
  const ecoBox=h("div",{style:{background:"rgba(0,0,0,.04)",borderRadius:"4px",padding:"8px 10px",marginBottom:"8px",borderLeft:"3px solid #c9952b"}});
  ecoBox.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"5px"}},L==="cs"?"📊 ÚČETNICTVÍ & HOSPODAŘENÍ KOLA":"📊 ROUND ACCOUNTS & FINANCES"));
  const ecoRows=[
    ...(sd.contractIncome>0?[{label:L==="cs"?"✅ Příjem ze zakázek":"✅ Contract income",val:"+"+sd.contractIncome+"g",c:"#4a7a3a"}]:[]),
    {label:L==="cs"?"💸 Mzdy (náklad)":"💸 Wages (cost)",val:"-"+sd.wages+"g",c:"#a03020"},
    {label:L==="cs"?"🍺 Pivo & režie":"🍺 Beer & rations",val:"-"+sd.bCost+"g",c:"#8b5e34"},
    ...(sd.dPay>0?[{label:L==="cs"?"📜 Splátka dluhu u Weisse":"📜 Weiss debt payment",val:"-"+sd.dPay+"g",c:"#4a7a3a"}]:[]),
    {label:L==="cs"?"Δ Změna pokladny":"Δ Cash change",val:(sd.groseDelta>=0?"+":"")+sd.groseDelta+"g",c:sd.groseDelta>=0?"#4a7a3a":"#a03020",bold:true},
  ];
  ecoRows.forEach(r=>ecoBox.append(h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"11px",
    marginBottom:"3px",fontWeight:r.bold?"700":"400"}},
    h("span",{style:{color:"#8b5e34"}},r.label),
    h("span",{style:{color:r.c}},r.val))));

  // DLUH STATUS & VAROVÁNÍ
  const debtStatusCard=h("div",{style:{marginTop:"6px",padding:"6px 8px",background:"rgba(42,26,10,.05)",borderRadius:"3px",border:"1px solid rgba(42,26,10,.12)"}});
  const dHeader=h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"11px"}});
  dHeader.append(
    h("span",{style:{fontWeight:"600",color:"#8b5e34"}},"📜 "+(L==="cs"?"Stav dluhu u Faktora Weisse:":"Debt owed to Factor Weiss:")),
    h("strong",{style:{fontSize:"12px",color:p.debt>0?"#a03020":"#4a7a3a"}},p.debt>0?(p.debt+"g"):(L==="cs"?"✅ 0g (Bez dluhu)":"✅ 0g (No debt)"))
  );
  debtStatusCard.append(dHeader);
  {
    const lb=liabilities(p);
    debtStatusCard.append(h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"11px",marginTop:"3px"}},
      h("span",{style:{fontWeight:"600",color:"#8b5e34"}},"👥 "+(L==="cs"?"Dluh partě (nevyplacené mzdy):":"Owed to the crew (unpaid wages):")),
      h("strong",{style:{fontSize:"12px",color:lb.crew>0?"#a03020":"#4a7a3a"}},lb.crew>0?(lb.crew+"g"):"✅ 0g")));
    if(lb.claims>0)debtStatusCard.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",marginTop:"1px",paddingLeft:"14px"}},
      (L==="cs"?"z toho bývalí zaměstnanci: ":"of which former employees: ")+lb.claims+"g"));
    if(lb.weiss>0&&lb.crew>0)debtStatusCard.append(h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"11px",marginTop:"3px",paddingTop:"3px",borderTop:"1px dashed rgba(42,26,10,.2)"}},
      h("span",{style:{fontWeight:"700",color:"#8b5e34"}},L==="cs"?"Závazky celkem:":"Total liabilities:"),
      h("strong",{style:{color:"#a03020"}},lb.total+"g")));
    debtStatusCard.append(h("div",{style:{fontSize:"9px",color:"#8b5e34",marginTop:"3px",fontStyle:"italic"}},
      L==="cs"?"Dvě oddělené věci: dluh u Weisse (úvěr, auto-splátka) a dluh partě (nevyplacené mzdy — platí se v záložce Parta, jinak klesá loajalita)."
              :"Two separate things: debt to Weiss (loan, auto-repayment) and debt to the crew (unpaid wages — paid in the Crew tab, otherwise loyalty drops)."));
  }
  if(p.debtMoratorium>0){
    debtStatusCard.append(h("div",{style:{fontSize:"10px",color:"#4a7a3a",marginTop:"3px",fontWeight:"600"}},
      "⏳ "+(L==="cs"?`Aktivní odklad splátek: zbývá ${p.debtMoratorium} kol bez automatických srážek.`:`Active moratorium: ${p.debtMoratorium} rounds left without auto-deductions.`)));
  }else if(p.debt>0&&sd.dPay>0){
    debtStatusCard.append(h("div",{style:{fontSize:"10px",color:"#4a7a3a",marginTop:"2px"}},
      L==="cs"?`✓ V tomto kole automaticky splaceno ${sd.dPay}g.`:`✓ Auto-repaid ${sd.dPay}g this round.`));
  }
  if(sd.wagesDeficit>0){
    debtStatusCard.append(h("div",{style:{fontSize:"10px",color:"#a03020",marginTop:"4px",fontWeight:"700",background:"rgba(160,48,32,.08)",padding:"3px 5px",borderRadius:"3px"}},
      L==="cs"?`⚠️ Huť dluží partě na mzdách ${sd.wagesDeficit}g! Roste dluh partě a klesá loajalita dělníků. Prodej sklo a vyplať mzdy (záložka Parta).`
              :`⚠️ Foundry owes the crew ${sd.wagesDeficit}g in wages! Crew debt grows and loyalty drops. Sell glass and pay the wages (Crew tab).`));
  }
  ecoBox.append(debtStatusCard);
  body.append(ecoBox);

  // ── DĚLNÍCI — mzdy a dluhy ──
  const workerBox=h("div",{style:{background:"rgba(0,0,0,.04)",borderRadius:"4px",padding:"8px 10px",marginBottom:"8px",borderLeft:"3px solid #8b5e34"}});
  workerBox.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"5px"}},L==="cs"?"👷 MZDY DĚLNÍKŮ":"👷 WORKER WAGES"));
  p.workers.forEach(w=>{
    const wEntry=sd.workerWages?sd.workerWages.find(x=>x.id===w.id):null;
    const wage=wEntry?wEntry.wage:(2+(w.wageMod||0));
    const paid=wEntry?wEntry.paid:true;
    const shortfall=wEntry?wEntry.shortfall:0;
    const unpaid=w.unpaidDebt||0;
    const row=h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",
      fontSize:"10px",marginBottom:"3px",padding:"2px 0",
      borderBottom:"1px solid rgba(42,26,10,.06)"}});
    row.append(
      h("span",{style:{color:"#3a2a14"}},w.name+" "+"★".repeat(Math.max(0,w.lv||0))),
      h("div",{style:{display:"flex",gap:"8px",alignItems:"center"}},
        h("span",{style:{color:paid?"#4a7a3a":"#a03020"}},paid?("✓ "+wage+"g"):("✗ "+wage+"g → "+(L==="cs"?"dluh":"debt"))),
        unpaid>0?h("span",{style:{color:"#a03020",fontWeight:"700"}},(L==="cs"?"celk. dluh":"total debt")+": "+unpaid+"g"):h("span",{},"")
      ));
    workerBox.append(row);
  });
  // Možnost splatit dluhy dělníkům
  const indebted=p.workers.filter(w=>(w.unpaidDebt||0)>0);
  if(indebted.length>0||claimsTotal(p)>0){
    const totalUnpaid=indebted.reduce((s,w)=>s+(w.unpaidDebt||0),0)+claimsTotal(p);
    const canPay=p.grose>=totalUnpaid;
    workerBox.append(h("div",{style:{marginTop:"6px"}},
      h("button",{class:"btn btn-s"+(canPay?" btn-p":""),
        style:{width:"100%",fontSize:"10px",opacity:canPay?1:0.5,cursor:canPay?"pointer":"not-allowed"},
        onClick:()=>{
          if(!canPay)return;
          payWorkerDebtsSummary();
        }},L==="cs"?"💸 Splatit dluhy dělníkům ("+totalUnpaid+"g)":"💸 Clear worker debts ("+totalUnpaid+"g)")));
  }
  body.append(workerBox);

  // ── ZAKÁZKY — stav v tomto kole ──
  if(p.contracts&&p.contracts.length>0||(sd.contractIncome&&sd.contractIncome>0)){
    const conBox=h("div",{style:{background:"rgba(42,26,10,.04)",borderRadius:"4px",padding:"8px 10px",marginBottom:"8px",borderLeft:"3px solid #c9952b"}});
    conBox.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"5px"}},L==="cs"?"📜 ZAKÁZKY":"📜 CONTRACTS"));
    // Splněné toto kolo
    if(sd.contractIncome>0){
      conBox.append(h("div",{style:{fontSize:"11px",color:"#4a7a3a",marginBottom:"3px",fontWeight:"700"}},
        "✅ "+(L==="cs"?"Splněno toto kolo: +":"Fulfilled this round: +")+sd.contractIncome+"g"));
    }
    // Aktivní se stavem
    if(p.contracts&&p.contracts.length>0){
      p.contracts.forEach(c=>{
        const roundsLeft=Math.max(0,c.due-p.round);
        const urgent=contractUrgent(roundsLeft);
        const inv=c.item==="crystal"?p.crystal:c.item==="waldglas"?p.waldglas:(p[c.item]||[]);
        const have=Math.min(inv.length,c.qty);
        const buyerIcon=c.buyer==="Opat"?"⛪":c.buyer==="Slechtic"?"🏰":c.buyer==="Hoffmann"?"🏙️":"🛒";
        conBox.append(h("div",{style:{fontSize:"10px",color:urgent?"#a03020":"#5a3a1a",
          marginBottom:"2px",display:"flex",justifyContent:"space-between"}},
          h("span",null,buyerIcon+" "+(L==="cs"?c.cs:c.en).substring(0,35)+((L==="cs"?c.cs:c.en).length>35?"…":"")),
          h("span",{style:{fontWeight:"700",flexShrink:0,marginLeft:"4px"}},
            have+"/"+c.qty+" · ⏳"+roundsLeft+(L==="cs"?"m":"mo"))));
      });
    }
    // Hint jít na trh pokud jsou dostupné a volný slot
    if((p.avail||[]).length>0&&(p.contracts||[]).length<3){
      conBox.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",marginTop:"4px",fontStyle:"italic"}},
        L==="cs"?"💡 Na Trhu čekají nové zakázky":"💡 New contracts waiting at Market"));
    }
    body.append(conBox);
  }

  // ── NÁLADA A MORÁLKA ──
  const morBox=h("div",{style:{background:"rgba(0,0,0,.04)",borderRadius:"4px",padding:"8px 10px",marginBottom:"12px",borderLeft:"3px solid "+(sd.mDelta>=0?"#4a7a3a":"#a03020")}});
  morBox.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"4px"}},L==="cs"?"😊 NÁLADA HUTĚ":"😊 FOUNDRY MORALE"));
  morBox.append(h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"11px"}},
    h("span",{style:{color:"#8b5e34"}},L==="cs"?"Aktuální nálada:":"Current morale:"),
    h("span",{style:{color:p.morale>60?"#4a7a3a":p.morale>35?"#c9952b":"#a03020",fontWeight:"700"}},p.morale+" "+(sd.mDelta!==0?"("+(sd.mDelta>0?"+":"")+sd.mDelta+")":""))));
  body.append(morBox);

  const btn=h("button",{class:"btn btn-p",style:{width:"100%",padding:"10px",fontSize:"14px"},
    onClick:continueFromSummary},
    L==="cs"?"Další měsíc →":"Next Month →");
  app.append(hdr,body,h("div",{style:{padding:"12px 14px",flexShrink:0}},btn));
  return;
}
