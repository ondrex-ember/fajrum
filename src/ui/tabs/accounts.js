// accounts.js — tab "accounts".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabAccounts(ctx){
  const {L,p,content}=ctx;
  {const sb=subTabBar("accounts");if(sb)content.append(sb);}
  // ── Dvousloupcový layout: Zakázky | Účty ──
  const hutSec=h("div",{class:"sec"});
  hutSec.append(h("div",{class:"sec-title"},"🏭 "+(L==="cs"?"Huť — Zakázky & Účty":"Foundry — Contracts & Accounts")));

  // ── ZAKÁZKY — co je potřeba udělat (tržní + reputační + endgame) ──
  const activeBox=h("div",{style:{marginBottom:"10px",padding:"8px 10px",borderRadius:"6px",
    border:"1px solid rgba(201,149,43,.3)",background:"rgba(201,149,43,.05)"}});
  activeBox.append(h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#8b5e34",
    marginBottom:"4px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
    "📜 "+(L==="cs"?"Zakázky — co je potřeba udělat":"Contracts — what needs doing"),
    h("button",{class:"btn btn-s",style:{fontSize:"9px"},
      onClick:()=>{G.tab="market";render();}},
      L==="cs"?"→ Trh":"→ Market")));
  activeBox.append(h("div",{style:{fontSize:"9px",color:"#8b5e34",fontStyle:"italic",marginBottom:"6px",lineHeight:"1.4"}},
    L==="cs"
      ?`Zakázka se odevzdá sama při uzavření měsíce, pokud máš na skladě dost kusů. Zásoby sdílíš s prodejem — co prodáš, v zakázce chybí. Obsazené sloty: ${(p.contracts||[]).length}/${MAX_CONTRACTS}.`
      :`A contract is delivered automatically at month end if you have enough pieces in stock. Stock is shared with sales — what you sell is missing here. Slots used: ${(p.contracts||[]).length}/${MAX_CONTRACTS}.`));
  const activeAll=(p.contracts||[]).map(c=>({c:c,kind:"market"}))
    .concat((p.repContracts||[]).map(rc=>({c:rc,kind:rc.isEndgame?"endgame":"rep"})));
  activeAll.forEach(x=>activeBox.append(renderContractCard(x.c,x.kind)));
  if(activeAll.length===0){
    activeBox.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic"}},
      L==="cs"?"Žádné aktivní zakázky. Nabídky najdeš níže a na Trhu — plněním buduješ reputaci.":"No active contracts. Offers are listed below and at the Market — fulfilling them builds reputation."));
  }
  if(subOn("accounts","contracts"))hutSec.append(activeBox);

  const twoCol=h("div",{class:"fj-accounts-columns",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}});

  // ── LEVÝ SLOUPEC: ZAKÁZKY ──
  const leftCol=h("div",{});
  leftCol.append(h("div",{style:{fontSize:"11px",fontWeight:"600",color:"#8b5e34",marginBottom:"6px",borderBottom:"1px solid rgba(42,26,10,.1)",paddingBottom:"3px"}},
    "📜 "+(L==="cs"?"Nabídky":"Offers")));

  // Endgame zakázky — dostupné ale nepřijaté (pravidla v endgameOffer)
  const famaState=p.fama||{church:0,noble:0,trade:0};
  const egState=p.endgame||{church:false,noble:false,trade:false};
  let hasEgAvail=false;
  ["church","noble","trade"].forEach(cat=>{
    const {eg,reqFurn,furnOk,available}=endgameOffer(cat);
    if(available){
      hasEgAvail=true;
      const egBox=h("div",{class:"fj-endgame-offer","data-commission-kind":cat,style:{background:furnOk?"rgba(201,149,43,.12)":"rgba(42,26,10,.06)",border:"1px solid "+(furnOk?"rgba(201,149,43,.4)":"rgba(42,26,10,.2)"),borderRadius:"4px",padding:"7px 9px",marginBottom:"6px",opacity:furnOk?1:0.75}});
      egBox.append(
        h("div",{style:{fontSize:"10px",fontWeight:"700",color:furnOk?"#8b3a00":"#8b5e34",marginBottom:"3px"}},
          FAMA_ICON[cat]+" "+(L==="cs"?"ENDGAME ZAKÁZKA":"ENDGAME CONTRACT")),
        h("div",{style:{fontSize:"10px",color:"#5a3a1a",marginBottom:"4px",lineHeight:"1.4"}},
          L==="cs"?eg.cs:eg.en),
        h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"4px"}},
          (L==="cs"?"Odměna: ":"Reward: ")+mny(eg.reward)+" · "+(L==="cs"?"termín ":"due ")+eg.due+(L==="cs"?" kol":" rounds")),
        h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"4px",fontStyle:"italic"}},
          (L==="cs"?"Vyžaduje pec: ":"Requires furnace: ")+(FURNACE_TYPES[reqFurn]?(L==="cs"?FURNACE_TYPES[reqFurn].name:FURNACE_TYPES[reqFurn].nameEn):reqFurn)
          +(furnOk?" ✅":" ❌")),
        h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"5px",fontStyle:"italic"}},
          (L==="cs"?"Komponenty: ":"Components: ")+eg.components.map(c=>(L==="cs"?c.cs:c.en)).join(", "))
      );
      if(furnOk){
        const acceptBtn=h("button",{class:"btn btn-s",style:{fontSize:"10px"},
          onClick:()=>{acceptEndgameContract(cat);}},L==="cs"?"✅ Přijmout zakázku":"✅ Accept contract");
        egBox.append(acceptBtn);
      }else{
        const reqFurnName=FURNACE_TYPES[reqFurn]?(L==="cs"?FURNACE_TYPES[reqFurn].name:FURNACE_TYPES[reqFurn].nameEn):reqFurn;
        egBox.append(h("div",{style:{fontSize:"10px",color:"#a03020",fontStyle:"italic",marginTop:"4px"}},
          L==="cs"?"🔒 Nejprve postav "+reqFurnName+" ("+FURNACE_TYPES[reqFurn]?.maxSlots+"× sloty)":"🔒 Build "+reqFurnName+" first ("+FURNACE_TYPES[reqFurn]?.maxSlots+"× slots)"));
      }
      egBox.append(h("span",{})); // spacer
      leftCol.append(egBox);
    }
  });

  // Nabídky kupců (nepřijaté tržní zakázky)
  const offers=p.avail||[];
  if(offers.length>0){
    leftCol.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontWeight:"600",marginBottom:"4px"}},
      L==="cs"?"Nabídky kupců:":"Merchant offers:"));
    offers.forEach(c=>leftCol.append(contractOfferRow(c)));
    if(!canAcceptContract()){
      leftCol.append(h("div",{style:{fontSize:"9px",color:"#a03020",fontStyle:"italic",marginTop:"2px"}},
        L==="cs"?`⚠️ Plno zakázek (max ${MAX_CONTRACTS}). Splň aktivní před přijetím dalších.`:`⚠️ Contract slots full (max ${MAX_CONTRACTS}). Finish an active one first.`));
    }
  }else if(!hasEgAvail){
    leftCol.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic",marginTop:"4px"}},
      L==="cs"?"Žádné nové nabídky. Kupci přijdou s nabídkami na začátku příští sezóny.":"No new offers. Merchants return with offers at the start of next season."));
  }

  // ── PRAVÝ SLOUPEC: ÚČTY (stávající obsah) ──
  const rightCol=h("div",{});
  rightCol.append(h("div",{style:{fontSize:"11px",fontWeight:"600",color:"#8b5e34",marginBottom:"6px",borderBottom:"1px solid rgba(42,26,10,.1)",paddingBottom:"3px"}},
    "📒 "+(L==="cs"?"Účty — Schuldenbuch":"Accounts — Schuldenbuch")));

  const wagesNext=crewWageNext();
  const beerCostNext=([0,1,2,4][p.beer]||0)*Math.ceil(p.workers.length/3);
  const rentNext=econ2RentNext();
  const totalOutNext=wagesNext+beerCostNext+(rentNext&&rentNext.away===0?rentNext.cash:0);
  const debtAutoNext=p.debt>0&&p.grose>500?Math.min(500,p.grose-200,p.debt):0;
  let projDebt=p.debt,projGrose=p.grose;
  const proj=[];
  for(let i=0;i<3;i++){
    projGrose=Math.max(0,projGrose-totalOutNext);
    const dPay=projDebt>0&&projGrose>500?Math.min(500,projGrose-200,projDebt):0;
    projGrose-=dPay; projDebt=Math.max(0,projDebt-dPay);
    if(projGrose<totalOutNext) projDebt+=Math.max(0,totalOutNext-projGrose);
    proj.push({debt:Math.round(projDebt),grose:Math.round(projGrose)});
  }

  // Aktuální stav
  const nowBox=h("div",{style:{background:"rgba(0,0,0,.04)",borderRadius:"4px",padding:"8px 10px",marginBottom:"8px",borderLeft:"3px solid #c9952b"}});
  nowBox.append(
    h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"4px"}},
      h("span",{style:{fontSize:"11px",color:"#8b5e34"}},L==="cs"?"Hotovost v pokladně:":"Cash in hand:"),
      h("strong",{style:{fontSize:"13px",color:p.grose>2000?"#4a7a3a":"#a03020"}},mny(p.grose))),
    h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"4px"}},
      h("span",{style:{fontSize:"11px",color:"#8b5e34"}},L==="cs"?"Dluh u Reichela:":"Debt owed to Reichel:"),
      h("strong",{style:{fontSize:"13px",color:p.debt>0?"#a03020":"#4a7a3a"}},
        p.debt>0?mny(p.debt):(L==="cs"?"✅ Splaceno":"✅ Clear"))),
    p.debt>0?h("div",{style:{fontSize:"10px",color:"#8b5e34",marginTop:"2px",fontStyle:"italic"}},
      L==="cs"?`Auto-splátka: až ${mny(500)}/kolo je-li hotovost nad ${mny(500)}`:`Auto-payment: up to ${mny(500)}/round when cash above ${mny(500)}`):h("span",{}),
    liabilities(p).crew>0?h("div",{style:{display:"flex",justifyContent:"space-between",marginTop:"4px"}},
      h("span",{style:{fontSize:"11px",color:"#8b5e34"}},L==="cs"?"Dluh partě (mzdy):":"Owed to crew (wages):"),
      h("strong",{style:{fontSize:"13px",color:"#a03020"}},mny(liabilities(p).crew))):h("span",{}),
    liabilities(p).crew>0?h("div",{style:{fontSize:"10px",color:"#8b5e34",marginTop:"2px",fontStyle:"italic"}},
      L==="cs"?"Dluh partě se neplatí automaticky ani Reichelovi — vyplácí se v záložce Parta.":"Crew debt is not auto-repaid and not part of Reichel's loan — pay it in the Crew tab."):h("span",{})
  );
  rightCol.append(nowBox);
  // Ruční splacení
  if(p.debt>0){
    const payBox=h("div",{style:{marginBottom:"8px",padding:"8px 10px",background:"rgba(160,48,32,.05)",borderRadius:"4px",border:"1px solid rgba(160,48,32,.15)"}});
    payBox.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"6px",fontWeight:"600"}},
      L==="cs"?"💸 Splatit dluh předčasně:":"💸 Early debt repayment:"));
    const payBtns=h("div",{style:{display:"flex",gap:"4px",flexWrap:"wrap"}});
    [1000,2000,p.debt].forEach(amt=>{
      if(amt<=0) return;
      const lbl=amt===p.debt?(L==="cs"?"Vše ("+mny(amt)+")":"All ("+mny(amt)+")"):mny(amt);
      const canPay=p.grose>=amt;
      payBtns.append(h("button",{class:"btn btn-s",style:{opacity:canPay?1:0.45,cursor:canPay?"pointer":"not-allowed"},
        onClick:()=>{
          if(!canPay) return;
          repayDebt(amt);
        }},lbl));
    });
    payBox.append(payBtns);
    rightCol.append(payBox);
  }
  // Výdaje příští kolo
  const outBox=h("div",{style:{marginBottom:"8px",padding:"8px 10px",background:"rgba(0,0,0,.03)",borderRadius:"4px",border:"1px solid rgba(42,26,10,.1)"}});
  outBox.append(h("div",{style:{fontSize:"11px",fontWeight:"600",color:"#8b5e34",marginBottom:"5px"}},
    L==="cs"?"📊 Výdaje příští kolo:":"📊 Next round expenses:"));
  [{label:(L==="cs"?"Mzdy ("+p.workers.length+") dělníků":"Wages ("+p.workers.length+") workers"),val:mny(wagesNext),c:"#a03020"},
   {label:(L==="cs"?"Pivo (příděl "+p.beer+")":"Beer (ration "+p.beer+")"),val:mny(beerCostNext),c:"#8b5e34"},
   ...(rentNext&&rentNext.away===0&&rentNext.cash>0?[{label:(L==="cs"?"🏰 Činže panství":"🏰 Estate rent"),val:mny(rentNext.cash),c:"#a03020"}]:[]),
   {label:(L==="cs"?"Celkem":"Total"),val:mny(totalOutNext),c:"#a03020",bold:true}
  ].forEach(r=>outBox.append(h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"3px",fontWeight:r.bold?"700":"400"}},
    h("span",{style:{color:"#8b5e34"}},r.label),h("span",{style:{color:r.c}},r.val))));
  if(rentNext&&rentNext.away>0)outBox.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",borderTop:"1px solid rgba(42,26,10,.1)",paddingTop:"3px",marginTop:"3px"}},
    "🏰 "+(L==="cs"
      ?`Činže panství za ${rentNext.away} kol: `+(rentNext.grace?"hotovost prominuta":mny(rentNext.cash))+`, kvóta ${rentNext.wood} 🌳 + ${rentNext.potash} 🧂`
      :`Estate rent in ${rentNext.away} rounds: `+(rentNext.grace?"cash waived":mny(rentNext.cash))+`, quota ${rentNext.wood} 🌳 + ${rentNext.potash} 🧂`)));
  if(debtAutoNext>0)outBox.append(h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#4a7a3a",borderTop:"1px solid rgba(42,26,10,.1)",paddingTop:"3px",marginTop:"3px"}},
    h("span",{},L==="cs"?"+ auto-splátka dluhu":"+ auto debt payment"),h("span",{},"-"+mny(debtAutoNext))));
  rightCol.append(outBox);
  // Projekce dluhu
  if(p.debt>0){
    const projBox=h("div",{style:{marginBottom:"8px",padding:"8px 10px",background:"rgba(0,0,0,.03)",borderRadius:"4px",border:"1px solid rgba(42,26,10,.1)"}});
    projBox.append(h("div",{style:{fontSize:"11px",fontWeight:"600",color:"#8b5e34",marginBottom:"5px"}},
      L==="cs"?"🔮 Projekce dluhu (bez příjmů):":"🔮 Debt projection (no income):"));
    proj.forEach((p2,i)=>{
      const prev=i===0?p.debt:proj[i-1].debt;
      const col=p2.debt<prev?"#4a7a3a":"#a03020";
      const arrow=p2.debt<prev?"↓":"↑";
      projBox.append(h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"3px"}},
        h("span",{style:{color:"#8b5e34"}},(L==="cs"?"Kolo ":"Round ")+(i+1)),
        h("span",{style:{color:col}},arrow+" "+mny(p2.debt)+" "+(L==="cs"?"dluh":"debt")+" · "+mny(p2.grose)+" "+(L==="cs"?"pokladna":"cash"))));
    });
    rightCol.append(projBox);
  }
  // Faktor — půjčit (s reputací dlužníka)
  const drH=p.debtReputation||0;
  const loanRateH=loanRateAccounts();
  const loanRatePctH=Math.round(loanRateH*100);
  const lichBox=h("div",{style:{padding:"8px 10px",background:"rgba(42,26,10,.06)",borderRadius:"4px",border:"1px dashed rgba(139,94,52,.3)",marginBottom:"4px"}});
  lichBox.append(h("div",{"data-partner":"Reichel",style:{fontSize:"11px",fontWeight:"600",color:"#8b5e34",marginBottom:"4px"}},
    "🪙 "+(L==="cs"?"Faktor Reichel — půjčky a zálohy":"Factor Reichel — loans & advances")));
  lichBox.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic",marginBottom:"6px",lineHeight:"1.4"}},
    L==="cs"
      ?`Peníze vždy najdu. Aktuální úrok: ${loanRatePctH}% — splácejte a podmínky se zlepší.`
      :`I always have coin. Current rate: ${loanRatePctH}% — repay well and terms improve.`));
  const loanBtns=h("div",{style:{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"6px"}});
  [1500,2500,4000].forEach(amt=>{
    const totalDebt=amt+Math.round(inZl(amt)*loanRateH)*KR;
    loanBtns.append(h("button",{class:"btn btn-s",style:{fontSize:"10px"},
      onClick:()=>{takeLoan(amt,loanRateH);}},"+"+mny(amt)+" (+"+mny(totalDebt)+" "+(L==="cs"?"dluh":"debt")+")"));
  });
  lichBox.append(loanBtns);
  // Odklad splátek v Účtech
  if(p.debtMoratorium>0){
    lichBox.append(h("div",{style:{padding:"4px 6px",background:"rgba(74,122,58,.1)",borderRadius:"3px",fontSize:"10px",color:"#4a7a3a",fontWeight:"600",marginBottom:"4px"}},
      "⏳ "+(L==="cs"?`Odklad splátek aktivní (zbývá ${p.debtMoratorium} kol) — auto-splátky pozastaveny.`:`Moratorium active (${p.debtMoratorium} rounds left) — auto-deductions paused.`)));
  }else if(p.debt>0){
    const moraCostH=moratoriumCost();
    const canMoraH=p.grose>=moraCostH||drH>=25;
    const moraRow=h("div",{style:{display:"flex",alignItems:"center",gap:"6px",marginTop:"4px"}});
    moraRow.append(h("button",{class:"btn btn-s",style:{fontSize:"10px",opacity:canMoraH?1:0.6},
      onClick:()=>{negotiateMoratorium();}},"⏳ "+(L==="cs"?`Odklad splátek (2 kola, ${moraCostH>0?mny(moraCostH):"zdarma"})`:`Defer debt (2 rounds, ${moraCostH>0?mny(moraCostH):"free"})`)));
    moraRow.append(h("span",{style:{fontSize:"9px",color:"#8b5e34",fontStyle:"italic"}},
      L==="cs"?"Umožní použít peníze na mzdy a dřevo":"Saves cash for wages and fuel"));
    lichBox.append(moraRow);
  }
  rightCol.append(lichBox);

  // jedna podzáložka = jeden sloupec; panely značí data-acc-pane (ui/fajrum-d2-accounts.js), ne pořadí
  leftCol.setAttribute("data-acc-pane","offers");rightCol.setAttribute("data-acc-pane","finance");
  if(subOn("accounts","contracts"))twoCol.append(leftCol);
  if(subOn("accounts","accounts"))twoCol.append(rightCol);
  twoCol.style.gridTemplateColumns="1fr";
  if(!twoCol.children.length)twoCol.style.display="none";
  hutSec.append(twoCol);

  // ── REPUTACE PANEL (pod oběma sloupci) ──
  const repPanel=h("div",{style:{borderTop:"1px solid rgba(42,26,10,.12)",paddingTop:"10px",marginTop:"4px"}});
  repPanel.append(h("div",{style:{fontSize:"11px",fontWeight:"600",color:"#8b5e34",marginBottom:"8px"}},
    "⭐ "+(L==="cs"?"Reputace hutě — Fama":"Foundry Reputation — Fama")));
  const repGrid=h("div",{class:"fj-accounts-reputation-grid",style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}});
  ["church","noble","trade"].forEach(cat=>{
    const val=famaState[cat]||0;
    const icon=FAMA_ICON[cat];
    const labelCs=FAMA_LABEL_CS[cat];
    const labelEn=FAMA_LABEL_EN[cat];
    const color=val>=65?"#4a7a3a":val>=35?"#c9952b":"#8b5e34";
    const eg=ENDGAME_CONTRACTS[cat];
    const nextThresh=FAMA_THRESHOLDS[cat].find(t=>t>val)||FAMA_MAX;
    const catCard=h("div",{style:{background:"rgba(0,0,0,.03)",borderRadius:"4px",padding:"7px 9px",border:"1px solid rgba(42,26,10,.08)"}});
    catCard.append(
      h("div",{style:{display:"flex",alignItems:"center",gap:"4px",marginBottom:"5px"}},
        h("span",{style:{fontSize:"14px"}},icon),
        h("span",{style:{fontSize:"11px",fontWeight:"700",color}},(L==="cs"?labelCs:labelEn)),
        h("span",{style:{fontSize:"12px",fontWeight:"700",color,marginLeft:"auto"}},val+"%")));
    // Progress bar
    const barOuter=h("div",{style:{height:"5px",background:"rgba(0,0,0,.1)",borderRadius:"3px",marginBottom:"5px",overflow:"hidden"}});
    const barInner=h("div",{style:{height:"5px",width:val+"%",background:color,borderRadius:"3px",transition:"width .3s"}});
    barOuter.append(barInner);
    catCard.append(barOuter);
    // Status
    if(egState[cat]){
      catCard.append(h("div",{style:{fontSize:"9px",color:"#4a7a3a",fontWeight:"600"}},
        L==="cs"?"✅ Endgame splněn — pravidelné dodávky aktivní":"✅ Endgame complete — regular deliveries active"));
    } else if(eg&&val>=eg.minFama){
      catCard.append(h("div",{style:{fontSize:"9px",color:"#c9952b",fontWeight:"600"}},
        L==="cs"?"⚠️ Endgame zakázka dostupná!":"⚠️ Endgame contract available!"));
    } else {
      catCard.append(h("div",{style:{fontSize:"9px",color:"#8b5e34"}},
        (L==="cs"?"Další milestone: ":"Next milestone: ")+nextThresh+"%"));
    }
    // Thresholds jako malé tečky
    const dotsRow=h("div",{style:{display:"flex",gap:"3px",marginTop:"4px",flexWrap:"wrap"}});
    FAMA_THRESHOLDS[cat].forEach(t=>{
      const reached=val>=t;
      dotsRow.append(h("div",{style:{
        width:"8px",height:"8px",borderRadius:"50%",
        background:reached?color:"rgba(0,0,0,.12)",
        title:t+"%",cursor:"default"
      }}));
    });
    catCard.append(dotsRow);
    repGrid.append(catCard);
  });
  repPanel.append(repGrid);
  if(subOn("accounts","fame"))hutSec.append(repPanel);
  // Vztahy s obchodními partnery (jen záznam: důvěra, metriky, historie)
  const relPanel=h("div",{style:{borderTop:"1px solid rgba(42,26,10,.12)",paddingTop:"10px",marginTop:"10px"}});
  relPanel.append(h("div",{style:{fontSize:"11px",fontWeight:"600",color:"#8b5e34",marginBottom:"8px"}},
    "🤝 "+(L==="cs"?"Vztahy s obchodními partnery":"Trade partner relations")));
  partnerIds().forEach(id=>relPanel.append(partnerCard(id)));
  if(subOn("accounts","relations"))hutSec.append(relPanel);
  if(subOn("accounts","fame"))renderSeasonUpgrades(hutSec);
  content.append(hutSec);
}
