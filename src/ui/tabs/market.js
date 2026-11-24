// market.js — tab "market".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabMarket(ctx){
  const {p,L,content}=ctx;
  {const sb=subTabBar("market",{contracts:(p.avail||[]).length});if(sb)content.append(sb);}
  const md2=MONTH_DATA[p.round]||MONTH_DATA[0];
  const closed=MARKET_CLOSED[p.round];
  // Stav trhu — vždy nahoře
  const trhStatus=h("div",{class:"sec fj-market-status"});
  trhStatus.append(h("div",{class:"fj-market-open","data-closed":String(!!closed),style:{
    padding:"8px",borderRadius:"4px",
    background:closed?"rgba(160,48,32,.08)":"rgba(74,122,58,.08)",
    border:`1px solid ${closed?"rgba(160,48,32,.2)":"rgba(74,122,58,.2)"}`,
    fontSize:"12px",color:closed?"#a03020":"#4a7a3a",marginBottom:"6px",fontWeight:"600"}},
    L==="cs"?md2.trh_cs:md2.trh_en));
  const sSec2=h("div",{class:"sec fj-market-section","data-market-section":"sell",id:"fj-market-sell"});
  sSec2.append(h("div",{class:"sec-title"},"💰 "+(L==="cs"?"Prodej":"Sell")));
  if(p.mBonus)sSec2.append(h("div",{style:{fontSize:"11px",color:"#c9952b",marginBottom:"4px"}},"🗣️ "+( L==="cs"?"Kupec Weiss přijel — ceny ×1.5!":"Merchant Weiss arrived — prices ×1.5!")));
  if(closed){
    sSec2.append(h("div",{class:"fj-sale-closed",style:{fontSize:"11px",color:"#a03020",fontStyle:"italic"}},
      L==="cs"?"Cesty jsou nesjízdné. Počkej na otevření trhů.":"Roads impassable. Wait for markets to open."));
  }else if(p.waldglas.length){
    sSec2.append(h("div",{class:"fj-sale-row","data-product":"waldglas","data-glass":"waldglas",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
      h("span",{style:{fontSize:"12px"}},"🔥 Waldglas ("+p.waldglas.length+"×) · ~"+mny(350)+"/★"),
      h("div",{style:{display:"flex",gap:"3px"}},
        h("button",{class:"btn btn-s",onClick:()=>sellItems("waldglas",1)},"1×"),
        h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems("waldglas",999)},L==="cs"?"Vše":"All"))));
  }
  if(!closed&&p.crystal.length){
    sSec2.append(h("div",{class:"fj-sale-row","data-product":"crystal","data-glass":"crystal",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
      h("span",{style:{fontSize:"12px",color:"#3a6a9a"}},"✨ "+(L==="cs"?"Křišťál":"Crystal")+" ("+p.crystal.length+"×) · ~"+mny(900)+"/★"),
      h("div",{style:{display:"flex",gap:"3px"}},
        h("button",{class:"btn btn-s",onClick:()=>sellItems("crystal",1)},"1×"),
        h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems("crystal",999)},L==="cs"?"Vše":"All"))));
  }
  // Barevné sklo
  if(!closed){
    [["jantar","🟤","#7a4a1a"],["zlut","🟨","#9a7a1a"],["modra","🔵","#3a5a9a"],["smaragd","🟢","#2a6a3a"],["lattimo","⚪","#8b7a5a"],["rubin","🔴","#8a1a1a"]].forEach(([type,icon,col])=>{
      const inv=p[type]||[];
      const rec=COLOR_RECIPES[type];
      if(!inv.length||!rec)return;
      sSec2.append(h("div",{class:"fj-sale-row","data-product":type,"data-glass":type,style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
        h("span",{style:{fontSize:"12px",color:col}},`${icon} ${L==="cs"?rec.cs:rec.en} (${inv.length}×) · ~${mny(rec.sell_cs)}/★`),
        h("div",{style:{display:"flex",gap:"3px"}},
          h("button",{class:"btn btn-s",onClick:()=>sellItems(type,1)},"1×"),
          h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems(type,999)},L==="cs"?"Vše":"All"))));
    });
  }
  if(!closed&&!Object.keys(marketSalePrices()).some(k=>Array.isArray(p[k])&&p[k].length)){
    sSec2.append(h("div",{class:"fj-sale-empty",style:{fontSize:"11px",color:"#8b5e34"}},L==="cs"?"Nic k prodeji.":"Nothing to sell."));
  }
    // Foukané výrobky na trhu — základní + barevné varianty
  if(!closed){
    // Collect all blown state keys: základní + barevné varianty
    const allBlownKeys=[];
    BLOWN_TYPES.forEach(k=>{
      if((p[k]||[]).length>0)allBlownKeys.push({key:k,it:BLOWN_ITEMS[k],color:"waldglas"});
      (BLOWN_ITEMS[k].inputs||[]).forEach(col=>{
        if(col==="waldglas")return;
        const sk=k+"_"+col;
        if((p[sk]||[]).length>0)allBlownKeys.push({key:sk,it:BLOWN_ITEMS[k],color:col});
      });
    });
    if(allBlownKeys.length>0){
      sSec2.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontWeight:"700",
        margin:"6px 0 3px",borderTop:"1px solid rgba(42,26,10,.08)",paddingTop:"6px"}},
        "💨 "+(L==="cs"?"Foukané výrobky:":"Blown glassware:")));
      allBlownKeys.forEach(({key,it,color})=>{
        const inv=p[key]||[];
        const price=Math.round(it.base*COLOR_MULT[color]);
        const colorLabel=color!=="waldglas"?` ${COLOR_ICON[color]}`:"";
        sSec2.append(h("div",{class:"fj-sale-row","data-product":key,"data-glass":color,style:{display:"flex",justifyContent:"space-between",
          alignItems:"center",marginBottom:"4px"}},
          h("span",{style:{fontSize:"12px"}},`${it.icon}${colorLabel} ${L==="cs"?it.cs:it.en} (${inv.length}×) · ~${mny(price)}/★`),
          h("div",{style:{display:"flex",gap:"3px"}},
            h("button",{class:"btn btn-s",onClick:()=>sellItems(key,1)},"1×"),
            h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems(key,999)},
              L==="cs"?"Vše":"All"))));
      });
    }
    // Broušené výrobky na trhu
    const groundAvail=GROUND_TYPES.filter(k=>(p[k]||[]).length>0);
    if(groundAvail.length>0){
      sSec2.append(h("div",{style:{fontSize:"10px",color:"#3a6a9a",fontWeight:"700",
        margin:"6px 0 3px",borderTop:"1px solid rgba(42,26,10,.08)",paddingTop:"6px"}},
        "💎 "+(L==="cs"?"Broušené výrobky:":"Ground glassware:")));
      groundAvail.forEach(key=>{
        const it=GROUND_ITEMS[key];
        const inv=p[key]||[];
        sSec2.append(h("div",{class:"fj-sale-row","data-product":key,"data-glass":"crystal",style:{display:"flex",justifyContent:"space-between",
          alignItems:"center",marginBottom:"4px"}},
          h("span",{style:{fontSize:"12px",color:"#3a6a9a"}},`${it.icon} ${L==="cs"?it.cs:it.en} (${inv.length}×) · ~${mny(it.base)}/★`),
          h("div",{style:{display:"flex",gap:"3px"}},
            h("button",{class:"btn btn-s",onClick:()=>sellItems(key,1)},"1×"),
            h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems(key,999)},L==="cs"?"Vše":"All"))));
      });
    }
    // Rytiny na trhu
    const rytinyAvail=ENGRAVE_INPUTS.filter(k=>(p["rytina_"+k]||[]).length>0);
    if(rytinyAvail.length>0){
      sSec2.append(h("div",{style:{fontSize:"10px",color:"#8b7a2a",fontWeight:"700",
        margin:"6px 0 3px",borderTop:"1px solid rgba(42,26,10,.08)",paddingTop:"6px"}},
        "✂️ "+(L==="cs"?"Rytiny (luxus):":"Engravings (luxury):")));
      rytinyAvail.forEach(key=>{
        const srcItem=engraveSrc(key);
        const rKey="rytina_"+key;
        const inv=p[rKey]||[];
        const price=Math.round((srcItem?.base||10)*engraveBonus(key));
        sSec2.append(h("div",{class:"fj-sale-row","data-product":rKey,style:{display:"flex",justifyContent:"space-between",
          alignItems:"center",marginBottom:"4px"}},
          h("span",{style:{fontSize:"12px",color:"#8b7a2a"}},
            `✂️ ${srcItem?.icon||""} ${L==="cs"?srcItem?.cs:srcItem?.en} (${inv.length}×) · ~${mny(price)}/★`),
          h("div",{style:{display:"flex",gap:"3px"}},
            h("button",{class:"btn btn-s",onClick:()=>sellItems(rKey,1)},"1×"),
            h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems(rKey,999)},L==="cs"?"Vše":"All"))));
      });
    }
    // Terčíky a zrcadla na trhu
    const hasTercikSell=(p.tercik?.length||0)>0||(p.tercik_vyplne?.length||0)>0||(p.tercik_zebrovy?.length||0)>0||(p.zrcadlo?.length||0)>0||(p.alembik?.length||0)>0;
    if(hasTercikSell){
      sSec2.append(h("div",{style:{fontSize:"10px",color:"#6a7a3a",fontWeight:"700",
        margin:"6px 0 3px",borderTop:"1px solid rgba(42,26,10,.08)",paddingTop:"6px"}},
        "🪟 "+(L==="cs"?"Okenní sklo & Speciální:":"Window glass & Special:")));
      if((p.tercik||[]).length>0){
        sSec2.append(h("div",{class:"fj-sale-row","data-product":"tercik",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
          h("span",{style:{fontSize:"12px",color:"#5a6a2a"}},`🪟 ${L==="cs"?"Okenní terčík":"Window disc"} (${p.tercik.length}×) · ~${mny(600)}/★`),
          h("div",{style:{display:"flex",gap:"3px"}},
            h("button",{class:"btn btn-s",onClick:()=>sellItems("tercik",1)},"1×"),
            h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems("tercik",999)},L==="cs"?"Vše":"All"))));
      }
      if((p.tercik_vyplne||[]).length>0){
        sSec2.append(h("div",{class:"fj-sale-row","data-product":"tercik_vyplne",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
          h("span",{style:{fontSize:"12px",color:"#7a6a2a"}},`🟫 ${L==="cs"?"Výplňové terče (nepodařené)":"Filler discs (rejects)"} (${p.tercik_vyplne.length}×) · ~${mny(200)}/★`),
          h("div",{style:{display:"flex",gap:"3px"}},
            h("button",{class:"btn btn-s",onClick:()=>sellItems("tercik_vyplne",1)},"1×"),
            h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems("tercik_vyplne",999)},L==="cs"?"Vše":"All"))));
      }
      if((p.tercik_zebrovy||[]).length>0){
        sSec2.append(h("div",{class:"fj-sale-row","data-product":"tercik_zebrovy",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
          h("span",{style:{fontSize:"12px",color:"#5a7a4a"}},`🪟✨ ${L==="cs"?"Terčík žebrový (prémiový)":"Ribbed disc (premium)"} (${p.tercik_zebrovy.length}×) · ~${mny(900)}/★`),
          h("div",{style:{display:"flex",gap:"3px"}},
            h("button",{class:"btn btn-s",onClick:()=>sellItems("tercik_zebrovy",1)},"1×"),
            h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems("tercik_zebrovy",999)},L==="cs"?"Vše":"All"))));
      }
      if((p.zrcadlo||[]).length>0){
        sSec2.append(h("div",{class:"fj-sale-row","data-product":"zrcadlo",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
          h("span",{style:{fontSize:"12px",color:"#c9952b"}},`🪞 ${L==="cs"?"Zrcadlo (luxus)":"Mirror (luxury)"} (${p.zrcadlo.length}×) · ~${mny(6500)}/★`),
          h("div",{style:{display:"flex",gap:"3px"}},
            h("button",{class:"btn btn-s",onClick:()=>sellItems("zrcadlo",1)},"1×"),
            h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems("zrcadlo",999)},L==="cs"?"Vše":"All"))));
      }
      if((p.alembik||[]).length>0){
        sSec2.append(h("div",{class:"fj-sale-row","data-product":"alembik",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}},
          h("span",{style:{fontSize:"12px",color:"#7a4a9a"}},`⚗️ ${L==="cs"?"Alembik (zakázka)":"Alembic (commission)"} (${p.alembik.length}×) · ~${mny(5500)}/★`),
          h("div",{style:{display:"flex",gap:"3px"}},
            h("button",{class:"btn btn-s",onClick:()=>sellItems("alembik",1)},"1×"),
            h("button",{class:"btn btn-s btn-active",onClick:()=>sellItems("alembik",999)},L==="cs"?"Vše":"All"))));
      }
    }
  }
  if(window.FajrumRecipeUI)FajrumRecipeUI.marketRows(sSec2,p,{closed,sell:sellItems});
  content.append(trhStatus);
  if(subOn("market","sell"))content.append(sSec2);

  // Hvozd & dřevo (parcely, sazenice, nouzové dřevo) přesunuto do karty Les › Správa; tady jen odkaz.
  const extraSec=h("div",{class:"sec fj-market-section","data-market-section":"forest",id:"fj-market-forest"});
  extraSec.append(h("div",{class:"fj-forest-link-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"8px"}},
    h("span",{style:{fontSize:"11px"}},"🌲 "+(L==="cs"?"Parcely, sazenice a nouzové dřevo najdeš v Lese.":"Parcels, seedlings and emergency wood are in the Forest tab.")),
    h("button",{class:"btn btn-s btn-active","data-goto":"forest",onClick:()=>goTab("forest","manage")},L==="cs"?"Otevřít Les":"Open Forest")));
  if(subOn("market","weiss"))content.append(extraSec);

  const bSec=h("div",{class:"sec fj-market-section","data-market-section":"buy",id:"fj-market-buy"});
  bSec.append(h("div",{class:"sec-title"},"🛒 "+(L==="cs"?"Kupec Weiss":"Merchant Weiss")));
  bSec.append(partnerCard("weiss"));
  const grid=h("div",{class:"shop-grid"});
  Object.entries(p.shop).forEach(([k,it])=>{
    const can=p.grose>=it.price&&it.stock>0;
    grid.append(h("button",{class:"btn btn-s fj-market-buy-item","data-resource":k,...(can?{}:{disabled:true}),title:merchName(k,L)+" — "+merchDesc(k,L),
      style:{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",textAlign:"left",opacity:can?1:.4,cursor:can?"pointer":"default"},
      onClick:()=>{if(can)buyItem(k);}},
      h("span",{style:{display:"flex",flexDirection:"column",minWidth:0}},
        h("span",null,it.e+" "+merchName(k,L)),
        h("span",{style:{fontWeight:"400",fontSize:"9px",opacity:.7,lineHeight:"1.3"}},merchDesc(k,L))),
      h("span",{style:{fontWeight:"700"}},mny(it.price)+" ",h("span",{style:{fontWeight:"400",fontSize:"9px"}},"("+it.stock+")"))));
  });
  bSec.append(grid);
  if(subOn("market","weiss"))content.append(bSec);

  // ── RYCHLÝ VÝKUP — kramář přijede a vykoupí vše ──
  const quickSellDone=p.quickSellUsed||false;
  const allStock=["waldglas","crystal",...BLOWN_TYPES].reduce((s,k)=>{
    const inv=p[k]||[];
    return s+(Array.isArray(inv)?inv.length:0);
  },0);
  if(allStock>0||!quickSellDone){
    const qSec=h("div",{class:"sec fj-market-section","data-market-section":"quick",id:"fj-market-quick"});
    qSec.append(h("div",{class:"sec-title"},"🐴 "+(L==="cs"?"Rychlý výkup — Kupec Weiss":"Quick buyout — Merchant Weiss")));
    qSec.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic",marginBottom:"6px",lineHeight:"1.4"}},
      L==="cs"
        ?`Weiss přijede a vykoupí vybrané zboží za ${quickSellQuote().ratePct}% ceny. Okamžitá hotovost, žádné čekání. Jednou za sezónu.`
        :`Weiss rides out and buys selected goods at ${quickSellQuote().ratePct}% price. Instant cash, no waiting. Once per season.`));
    if(quickSellDone){
      qSec.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic"}},
        L==="cs"?"✅ Výkup již použit tuto sezónu.":"✅ Buyout already used this season."));
    } else {
      // Spočítej co by dostal
      const {ratePct:qsRatePct,total:qsTotal,count:qsCount}=quickSellQuote();
      qSec.append(
        h("div",{style:{fontSize:"11px",color:"#4a7a3a",marginBottom:"6px",fontWeight:"600"}},
          (L==="cs"?"Na skladě: ":"In stock: ")+qsCount+(L==="cs"?" kusů → ":"  pcs → ")+mny(qsTotal)+` (${qsRatePct}%)`),
        h("button",{
          class:"btn btn-s fj-market-buyout"+(qsCount>0?" btn-active":""),...(qsCount>0?{}:{disabled:true}),
          style:{opacity:qsCount>0?1:0.4,cursor:qsCount>0?"pointer":"default",width:"100%"},
          onClick:()=>{
            if(qsCount===0) return;
            quickSellAll();
          }},
          L==="cs"?`🐴 Prodat vše Weissovi (${qsRatePct}%)`:`🐴 Sell all to Weiss (${qsRatePct}%)`)
      );
    }
    if(subOn("market","sell")||subOn("market","weiss"))content.append(qSec);
  }

  // Faktor Reichel — půjčky s reputací dlužníka a snadnějšími úroky v Light módu
  const dr=p.debtReputation||0;
  const loanRate=loanRateMarket();
  const loanRatePct=Math.round(loanRate*100);
  const drLabel=dr>=75?(L==="cs"?"🟢 Výborný":"🟢 Excellent"):dr>=50?(L==="cs"?"🟡 Dobrý":"🟡 Good"):dr>=25?(L==="cs"?"🟠 Slušný":"🟠 Fair"):(L==="cs"?"🔴 Nový":"🔴 New");
  const faktorSec=h("div",{class:"sec fj-market-section","data-market-section":"loans",id:"fj-market-loans"});
  faktorSec.append(h("div",{class:"sec-title"},"🪙 "+(L==="cs"?"Faktor Reichel — půjčky":"Factor Reichel — loans")));
  faktorSec.append(partnerCard("reichel"));
  // Reputace dlužníka
  faktorSec.append(h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px",padding:"5px 7px",background:"rgba(0,0,0,.04)",borderRadius:"3px"}},
    h("span",{style:{fontSize:"10px",color:"#8b5e34"}},L==="cs"?"Reputace dlužníka:":"Debtor reputation:"),
    h("span",{style:{fontSize:"10px",fontWeight:"700"}},drLabel+" · "+dr+"/100"),
    h("span",{style:{fontSize:"10px",color:loanRate<0.25?"#4a7a3a":"#8b5e34",fontWeight:"600"}},L==="cs"?"úrok "+loanRatePct+"%":"rate "+loanRatePct+"%")));
  faktorSec.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic",marginBottom:"6px",lineHeight:"1.4"}},
    L==="cs"
      ?`Peníze vždy najdu, jen se vrátíte s úrokem. Aktuálně ${loanRatePct}% — splácejte a podmínky se zlepší.`
      :`I always have coin — return with interest. Current rate ${loanRatePct}% — repay well and terms improve.`));
  if(p.debt>0)faktorSec.append(h("div",{style:{fontSize:"10px",color:"#a03020",marginBottom:"6px"}},
    (L==="cs"?"Aktuální dluh u Reichela: ":"Current debt to Reichel: ")+mny(p.debt)));
  const fLoanRow=h("div",{style:{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"6px"}});
  [1500,2500,4000].forEach(amt=>{
    const totalDebt=amt+Math.round(inZl(amt)*loanRate)*KR;
    fLoanRow.append(h("button",{class:"btn btn-s",style:{fontSize:"10px"},
      onClick:()=>{takeLoan(amt,loanRate);}},"+"+mny(amt)+" (+"+mny(totalDebt)+" "+(L==="cs"?"dluh":"debt")+")"));
  });
  faktorSec.append(fLoanRow);
  // Odklad splátek (Moratorium) & Splacení
  const fActionRow=h("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center",marginTop:"4px"}});
  if(p.debtMoratorium>0){
    fActionRow.append(h("div",{style:{padding:"4px 7px",background:"rgba(74,122,58,.1)",borderRadius:"3px",fontSize:"10px",color:"#4a7a3a",fontWeight:"600"}},
      "⏳ "+(L==="cs"?`Odklad splátek aktivní (zbývá ${p.debtMoratorium} kol)`:`Debt moratorium active (${p.debtMoratorium} rounds left)`)));
  }else if(p.debt>0){
    const moraCost=moratoriumCost();
    const canMora=p.grose>=moraCost||dr>=25;
    fActionRow.append(h("button",{class:"btn btn-s",style:{fontSize:"10px",opacity:canMora?1:0.6},
      onClick:()=>{negotiateMoratorium();}},"⏳ "+(L==="cs"?`Odklad splátek 2 kola (${moraCost>0?mny(moraCost):"zdarma"})`:`Defer debt 2 rounds (${moraCost>0?mny(moraCost):"free"})`)));
  }
  if(p.debt>0&&p.grose>=p.debt){
    fActionRow.append(h("button",{class:"btn btn-s btn-p",style:{fontSize:"10px"},
      onClick:()=>{clearAllDebt();}},(L==="cs"?"✅ Splatit celý dluh (":"✅ Clear all debt (")+mny(p.debt)+")"));
  }
  if(fActionRow.children.length>0) faktorSec.append(fActionRow);
  if(subOn("market","reichel"))content.append(faktorSec);

  // Zakázky: aktivní jsou před nabídkami, všechny používají původní vyhodnocení.
  const cSec=h("div",{class:"sec fj-market-section","data-market-section":"contracts",id:"fj-market-contracts"});
  cSec.append(h("div",{class:"sec-title"},"📜 "+(L==="cs"?"Zakázky":"Contracts")));
  const activeCards=h("div",{class:"fj-contract-active-list"});
  const addContract=(c,kind,index,source)=>{
    const card=renderContractCard(c,kind);
    card.dataset.contractIndex=index;
    card.dataset.contractSource=source;
    activeCards.append(card);
  };
  p.contracts.forEach((c,i)=>addContract(c,"market",i,"market"));
  (p.repContracts||[]).forEach((c,i)=>addContract(c,c.isEndgame?"endgame":"rep",i,"rep"));
  if(activeCards.children.length){
    cSec.append(h("h3",{class:"fj-market-subheading"},L==="cs"?"Aktivní zakázky":"Active contracts"),activeCards);
  }
  if(p.avail.length){
    cSec.append(h("h3",{class:"fj-market-subheading"},L==="cs"?"Nové nabídky":"New offers"));
    const offers=h("div",{class:"fj-contract-offer-list"});
    p.avail.forEach(c=>offers.append(contractOfferRow(c)));
    cSec.append(offers);
    if(!canAcceptContract()){
      cSec.append(h("div",{class:"fj-market-note is-warning"},
        L==="cs"?`Plno tržních zakázek (max ${MAX_CONTRACTS}). Splň aktivní před přijetím dalších.`:`Market contract slots full (max ${MAX_CONTRACTS}). Finish an active one first.`));
    }
  }
  if(!p.avail.length&&!activeCards.children.length){
    cSec.append(h("div",{class:"fj-market-note"},L==="cs"?"Žádné zakázky.":"No contracts."));
  }
  cSec.append(h("button",{class:"btn btn-s fj-market-accounts",onClick:()=>{goTab("accounts","contracts");}},
    L==="cs"?"Reputace a další zakázky →":"Reputation and further contracts →"));
  if(subOn("market","contracts"))content.append(cSec);

  // Nábor specialistů na trhu
  const trhNPC=p.trhuNPC||[];
  if(trhNPC.length>0&&p.workers.length<MAX_WORKERS){
    const nSec=h("div",{class:"sec fj-market-section","data-market-section":"hire",id:"fj-market-hire"});
    nSec.append(h("div",{class:"sec-title"},"💨 "+(L==="cs"?"Specialisté hledají práci":"Specialists seeking work")));
    nSec.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic",marginBottom:"6px"}},
      L==="cs"?"Sv. Jiří přilákal do kraje foukače a brusiče. Nabídka platí tuto sezónu."
              :"St. George drew blowers and grinders to the region. Offer lasts this season."));
    trhNPC.forEach(c=>{
      const canHire=p.grose>=c.hireCost&&p.workers.length<MAX_WORKERS;
      const card=h("div",{style:{padding:"8px",marginBottom:"6px",borderRadius:"4px",
        background:"rgba(201,149,43,.05)",border:"1px solid rgba(201,149,43,.25)"}});
      const topRow=h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}});
      topRow.append(
        h("div",{style:{flex:"1"}},
          h("div",{style:{fontWeight:"700",fontSize:"12px"}},
            `${c.name} · ${stars(c.lv)} · ${L==="cs"?PROF_CS[c.prof]||c.prof:PROF_EN[c.prof]||c.prof}`),
          h("div",{style:{fontSize:"10px",color:"#8b5e34",marginTop:"2px"}},
            c.traits.map(t=>{const tr=TRAITS[t];return tr?`${tr.icon} ${L==="cs"?tr.cs:tr.en}`:"";}).filter(Boolean).join(" · ")||"—")),
        h("button",{
          class:"btn btn-s"+(canHire?" btn-p":""),...(canHire?{}:{disabled:true}),
          style:{opacity:canHire?1:.4,flexShrink:0,marginLeft:"8px"},
          onClick:()=>{
            if(!canHire)return;
            hireMarketSpecialist(c.id);
          }},`${L==="cs"?"Najmout":"Hire"} ${mny(c.hireCost)}`));
      card.append(topRow);
      if(c.wageMod!==0){
        card.append(h("div",{style:{fontSize:"10px",color:c.wageMod<0?"#4a7a3a":"#a03020"}},
          `${L==="cs"?"Mzda":"Wage"}: ${c.wageMod>0?"+":""}${mny(c.wageMod)}/kolo`));
      }
      nSec.append(card);
    });
    if(subOn("market","people"))content.append(nSec);
  }
}
