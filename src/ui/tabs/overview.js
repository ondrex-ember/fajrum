// overview.js — tab "overview".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabOverview(ctx){
  const {isDesktop,p,L,isC,hs,isP,content,ft,fEff}=ctx;
  const topCols=h("div",{class:"fj-overview-columns"+(isDesktop?" overview-top-cols":"")});

  // ── ATTENTION BANNER — kritické akce ──
  const attItems=[];
  if(p.res.potash===0) attItems.push({critical:true,
    text:L==="cs"?"🌿 Potaš: 0":"🌿 Potash: 0",
    action:L==="cs"?"→ Přiřaď dělníka na Loužírnu (6🪵→1 potaš)":"→ Assign worker to Potash (6🪵→1 potash)"});
  else if(p.res.potash<2&&isC) attItems.push({critical:false,
    text:L==="cs"?`🌿 Potaš: ${p.res.potash} — brzy dojde`:`🌿 Potash: ${p.res.potash} — running low`,
    action:L==="cs"?"→ Loužírna potřebuje dřevo a dělníka":"→ Potash station needs wood and worker"});
  if(p.res.wood<5) attItems.push({critical:true,
    text:L==="cs"?`🪵 Dřevo: ${p.res.wood} — kriticky málo`:`🪵 Wood: ${p.res.wood} — critically low`,
    action:L==="cs"?"→ Pošli Komára kácet (Kácení)":"→ Send Komár to logging"});
  const atRiskWorkers=p.workers.filter(w=>(w.loyalty||75)<40&&!w.contract);
  if(atRiskWorkers.length) attItems.push({critical:atRiskWorkers.some(w=>(w.loyalty||75)<25),
    text:L==="cs"?`👋 ${atRiskWorkers.map(w=>w.name.split(" ")[0]).join(", ")} — nízká loajalita`
                 :`👋 ${atRiskWorkers.map(w=>w.name.split(" ")[0]).join(", ")} — low loyalty`,
    action:L==="cs"?"→ Party tab → Kontrakt nebo splať dluh":"→ Party tab → Contract or pay debt"});
  if(p.pReady<1&&isC) attItems.push({critical:true,
    text:L==="cs"?"🏺 Žádné pánve — tavení stojí":"🏺 No crucibles — smelting halted",
    action:L==="cs"?"→ Přiřaď Káninského na Pánvař":"→ Assign Káninský to Crucible"});
  if(p.res.food<2) attItems.push({critical:true,
    text:L==="cs"?`🍞 Jídlo: ${p.res.food} — hrozí únava`:`🍞 Food: ${p.res.food} — fatigue risk`,
    action:L==="cs"?"→ Políčko nebo koupit na trhu":"→ Field task or buy at market"});

  // ── LEVÝ SLOUPEC: attention banner + hint (se stránkováním) + pivovar ──
  const leftOverview=h("div",{class:"sec fj-overview-ledger",style:{display:"flex",flexDirection:"column",gap:"6px"}});
  if(attItems.length>0){
    const banner=h("div",{class:"attention-banner"});
    banner.append(h("div",{class:"att-title"},
      "⚠️ "+(L==="cs"?"Vyžaduje pozornost":"Requires attention")));
    attItems.slice(0,4).forEach(item=>{
      const row=h("div",{class:"attention-item"+(item.critical?" critical":"")});
      row.append(
        h("span",{},item.text),
        h("span",{class:"att-action"},item.action)
      );
      banner.append(row);
    });
    leftOverview.append(banner);
  }

  // Hint-box se stránkováním šipkami
  const hints=hs.filter(Boolean);
  const hintPage=G._hintPage===undefined?(p.round%12):G._hintPage;   // default: hint of the current month
  const hintTotal=hints.length;
  const hintText=hints[hintPage%hintTotal]||"";
  const hintWrap=h("div",{class:"fj-overview-hint",style:{borderLeft:"3px solid "+(isP?"#4a7a3a":"#8b5e34"),
    padding:"4px 8px",fontSize:"10px",lineHeight:"1.4",position:"relative"}});
  hintWrap.append(h("div",{style:{paddingRight:"36px",minHeight:"32px",color:"#3a2a14"}},hintText));
  if(hintTotal>1){
    const nav=h("div",{style:{display:"flex",gap:"4px",marginTop:"4px",justifyContent:"flex-end",alignItems:"center"}});
    nav.append(
      h("button",{style:{background:"none",border:"none",cursor:"pointer",fontSize:"13px",color:"#8b5e34",padding:"0 3px"},
        onClick:()=>{G._hintPage=((hintPage-1)+hintTotal)%hintTotal;render();}},"←"),
      h("span",{style:{fontSize:"9px",color:"#8b5e34"}},`${(hintPage%hintTotal)+1}/${hintTotal}`),
      h("button",{style:{background:"none",border:"none",cursor:"pointer",fontSize:"13px",color:"#8b5e34",padding:"0 3px"},
        onClick:()=>{G._hintPage=(hintPage+1)%hintTotal;render();}},"→"));
    hintWrap.append(nav);
  }
  leftOverview.append(hintWrap);

  // Pivovar — přesunut do levého sloupce
  leftOverview.append(h("div",{class:"sec-title",style:{margin:"4px 0 3px 0"}},
    "🍺 "+(L==="cs"?"Pivovar":"Brewery")));
  const beerCostR=BEER[p.beer].cost*Math.ceil(p.workers.length/3);
  leftOverview.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",marginBottom:"4px"}},
    `💰 ${L==="cs"?"Náklad":"Cost"}: ${beerCostR>0?beerCostR+"g/"+(L==="cs"?"kolo":"round"):"zdarma"} · ${L==="cs"?"nálada":"mood"} ${BEER[p.beer].m>=0?"+":""}${BEER[p.beer].m}`));
  const bRowR=h("div",{style:{display:"flex",gap:"3px",flexWrap:"wrap",marginBottom:"4px"}});
  [L==="cs"?"Žádné":"None",L==="cs"?"1 džbán":"1 mug",L==="cs"?"2 džbány":"2 mugs",L==="cs"?"3+ džb.":"3+ mugs"].forEach((lb,i)=>{
    bRowR.append(h("button",{class:"btn btn-s"+(p.beer===i?" btn-active":""),
      style:{flex:"1 1 auto"},onClick:()=>{setBeerLevel(i);}},
      lb+" ",h("span",{style:{fontSize:"9px",color:BEER[i].m>=0?"#4a7a3a":"#a03020"}},
        (BEER[i].m>=0?"+":"")+BEER[i].m)));
  });
  leftOverview.append(bRowR);

  // ── Aktivní zakázky widget ──
  if((p.contracts||[]).length>0||(p.avail||[]).length>0){
    const conWidget=h("div",{style:{marginTop:"4px",padding:"6px 8px",
      background:"rgba(42,26,10,.05)",borderRadius:"4px",
      border:"1px solid rgba(139,94,52,.18)"}});
    conWidget.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"4px"}},
      "📜 "+(L==="cs"?"Zakázky":"Contracts")));
    if((p.contracts||[]).length>0){
      p.contracts.forEach(c=>{
        const roundsLeft=Math.max(0,c.due-p.round);
        const urgent=contractUrgent(roundsLeft);
        const inv=c.item==="crystal"?p.crystal:c.item==="waldglas"?p.waldglas:(p[c.item]||[]);
        const have=Math.min(inv.length,c.qty);
        conWidget.append(h("div",{style:{fontSize:"10px",color:urgent?"#a03020":"#5a3a1a",
          marginBottom:"2px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
          h("span",{style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,
            maxWidth:"140px"}},
            (c.buyer==="Opat"?"⛪":c.buyer==="Slechtic"?"🏰":c.buyer==="Hoffmann"?"🏙️":"🛒")+
            " "+(L==="cs"?c.cs:c.en).split(":")[0]),
          h("span",{style:{flexShrink:0,marginLeft:"4px",fontWeight:"700"}},
            have+"/"+c.qty+" ⏳"+roundsLeft)));
      });
    }
    if((p.avail||[]).length>0&&(p.contracts||[]).length<3){
      conWidget.append(h("div",{style:{fontSize:"10px",color:"#c9952b",marginTop:"3px",
        cursor:"pointer",textDecoration:"underline"},
        onClick:()=>{G.tab="market";render();}},
        L==="cs"?"→ "+p.avail.length+"× nová zakázka na Trhu":"→ "+p.avail.length+"× new contract at Market"));
    }
    leftOverview.append(conWidget);
  }

  topCols.append(leftOverview);

  // ── PRAVÝ SLOUPEC: Dřevo/Pec (pivovar přesunut doleva) ──
  const rightOverview=h("div",{class:"sec fj-overview-operations",style:{display:"flex",flexDirection:"column",gap:"6px"}});

  // Dřevo + Pec (collapsible)
  const quickRow=h("div",{});
  const qState=G._quickOpen===undefined?true:G._quickOpen;
  const qHdr=h("div",{class:"fj-overview-toggle",role:"button",tabindex:"0","aria-expanded":String(qState),style:{display:"flex",justifyContent:"space-between",alignItems:"center",
    cursor:"pointer",userSelect:"none",marginBottom:qState?"8px":"0"},
    onClick:()=>{G._quickOpen=!qState;render();}});
  qHdr.append(
    h("div",{class:"sec-title",style:{margin:0}},
      "🪵 "+(L==="cs"?"Dřevo  ·  🔥 Pec":"Wood  ·  🔥 Furnace")),
    h("span",{style:{fontSize:"11px",color:"#8b5e34"}},qState?"▲":"▼"));
  quickRow.append(qHdr);
  if(qState){
    const twoCol=h("div",{class:"fj-overview-resource-columns",style:{display:"flex",gap:"10px"}});
    const leftCol=h("div",{class:"fj-overview-allocations",style:{flex:"2",minWidth:0}});
    const aLabels={fuel:L==="cs"?"Palivo":"Fuel",potash:L==="cs"?"Potaš":"Potash",build:L==="cs"?"Stavba":"Build"};
    ["fuel","potash","build"].forEach(k=>{
      const aRow=h("div",{style:{display:"flex",alignItems:"center",gap:"4px",marginBottom:"5px",fontSize:"11px"}});
      aRow.append(
        h("span",{style:{width:"42px",flexShrink:0,color:"#8b5e34"}},aLabels[k]),
        h("input",{type:"range",min:"0",max:"100",value:""+p.wa[k],"aria-label":aLabels[k],
          style:{flex:1,accentColor:"#8b5e34"},
          onInput:e=>setAlloc(k,+e.target.value)}),
        h("strong",{style:{width:"30px",textAlign:"right",flexShrink:0}},p.wa[k]+"%"));
      leftCol.append(aRow);
    });
    // Co podíly znamenají — čísla pro aktuální stav (podíl se počítá ze zásoby dřeva v každém kole)
    {
      const wInfo=h("div",{style:{fontSize:"10px",lineHeight:"1.45",color:"#8b5e34"}});
      const wood=p.res.wood||0;
      if(isP){
        wInfo.append(h("div",{},"🔥 "+(L==="cs"
          ?`Kampaň spálí ≈ ${campaignFuelTotal(p.seasonTier||0,ft)} 🪵 (${fuelNeedPerRound(PREP-1,ft)}/kolo, od května ${fuelNeedPerRound(6,ft)}). Podíl se počítá ze zásoby v každém kole.`
          :`Campaign burns ≈ ${campaignFuelTotal(p.seasonTier||0,ft)} 🪵 (${fuelNeedPerRound(PREP-1,ft)}/round, ${fuelNeedPerRound(6,ft)} from May). The share applies to the stock each round.`)));
      }else{
        const fNeed=fuelNeedPerRound(p.round,ft), fGot=Math.floor(wood*p.wa.fuel/100), fOk=fGot>=fNeed;
        wInfo.append(h("div",{style:{color:fOk?"#4a7a3a":"#a03020"}},"🔥 "+(L==="cs"
          ?`Palivo: potřeba ${fNeed} 🪵/kolo · při ${p.wa.fuel} % vyjde ${fGot} 🪵 ${fOk?"✓":"⚠️ pec nepoběží"}`
          :`Fuel: need ${fNeed} 🪵/round · ${p.wa.fuel}% gives ${fGot} 🪵 ${fOk?"✓":"⚠️ furnace won't run"}`)));
      }
      const potBatches=Math.floor((p.res.potash||0)/2), potOver=(p.res.potash||0)>=12;
      wInfo.append(h("div",{style:{color:potOver?"#c9952b":"#8b5e34"}},"🌿 "+(L==="cs"
        ?`Potaš ${p.res.potash||0} ks = ${potBatches} várek · Loužírna spálí ${p.wa.potash} % zásoby dřeva (6 🪵 = 1 potaš)${potOver?" — máš dost, sniž podíl":""}`
        :`Potash ${p.res.potash||0} = ${potBatches} batches · Potash worker burns ${p.wa.potash}% of the wood stock (6 🪵 = 1 potash)${potOver?" — enough, lower the share":""}`)));
      wInfo.append(h("div",{style:{color:p.forest<=20?"#a03020":"#8b5e34"}},"🌲 "+(L==="cs"
        ?`Hvozd ${p.forest}/${p.forestMax||INIT_FOREST} parcel · 1 parcela = 4 🪵 · Stavba = zbytek zůstává ve skladu`
        :`Forest ${p.forest}/${p.forestMax||INIT_FOREST} parcels · 1 parcel = 4 🪵 · Build = the rest stays in stock`)));
      leftCol.append(wInfo);
    }
    const rightCol=h("div",{class:"fj-overview-furnace",style:{flex:"1",minWidth:0}});
    const furnSlotsDisplay=ft.maxSlots||1;
    const slotsColor=furnSlotsDisplay>=4?"#4a7a3a":furnSlotsDisplay>=2?"#c9952b":"#8b5e34";
    const fRows=[
      {label:L==="cs"?"Typ":"Type",val:L==="cs"?ft.name:ft.nameEn,color:"#c9952b"},
      {label:L==="cs"?"Zaběh.":"Run-in",val:p.furnace.runIn+"%",color:"#8b5e34"},
      {label:L==="cs"?"Šamot":"Shamot",val:p.furnace.shamotWear+"%",color:p.furnace.shamotWear>70?"#a03020":"#8b5e34"},
      {label:L==="cs"?"Sloty":"Slots",val:"⬜".repeat(furnSlotsDisplay)+" "+furnSlotsDisplay+"×",color:slotsColor},
      {label:L==="cs"?"Eff.":"Eff.",val:fEff+"%",color:fEff>65?"#4a7a3a":fEff>45?"#c9952b":"#a03020"}
    ];
    fRows.forEach(r=>{
      rightCol.append(h("div",{class:"fj-overview-stat-row",style:{display:"flex",justifyContent:"space-between",
        fontSize:"11px",marginBottom:"5px",borderBottom:"1px solid rgba(42,26,10,.06)",paddingBottom:"3px"}},
        h("span",{style:{color:"#8b5e34"}},r.label),
        h("strong",{style:{color:r.color}},r.val)));
    });
    twoCol.append(leftCol,rightCol);
    quickRow.append(twoCol);
  }
  rightOverview.append(quickRow);
  topCols.append(rightOverview);

  content.append(topCols);

  // Dělníci — collapsible
  const wSec=h("div",{class:"sec fj-overview-roster"});
  const wState=G._workersOpen===undefined?true:G._workersOpen;
  const wHdr=h("div",{class:"fj-overview-toggle",role:"button",tabindex:"0","aria-expanded":String(wState),style:{display:"flex",justifyContent:"space-between",alignItems:"center",
    cursor:"pointer",userSelect:"none",marginBottom:wState?"8px":"0"},
    onClick:()=>{G._workersOpen=!wState;render();}});
  wHdr.append(
    h("div",{class:"sec-title",style:{margin:0}},(L==="cs"?"Dělníci":"Workers")+" ("+p.workers.length+")"),
    h("span",{style:{fontSize:"11px",color:"#8b5e34"}},wState?"▲":"▼"));
  wSec.append(wHdr);
  if(wState){
    const wGrid=h("div",{class:isDesktop?"workers-grid":""});
    p.workers.forEach(w=>{
      const card=h("div",{class:"worker-card","data-worker-id":w.id});
    const fatPct=Math.round(w.fat*100);
    const fatColor=w.fat>.7?"#a03020":w.fat>.4?"#c9952b":"#4a7a3a";
    const npc=NPC_ROSTER.find(n=>n.id===w.npcId);
    const xpNeeded=XP_PER_LEVEL[w.lv-1]||999;
    const xpPct=w.lv>=10?100:Math.round(((w.xp||0)/xpNeeded)*100);
    const loyalty=w.loyalty||75;
    const health=w.health||100;
    const unpaid=w.unpaidDebt||0;

    // Primární tasky dle role (pravidla v workerTaskOptions)
    const taskOpts=workerTaskOptions(w);
    const REST_TASKS=new Set(["idle","reforest","field"]);

    // Helper — task button (emoji + label, stejná výška)
    const makeTaskBtn=(t,ovLabel,disabled)=>{
      const isActive=w.task===t;
      const icon=TASK_ICON[t]||"";
      const label=ovLabel||(icon+" "+(L==="cs"?TASK_CS[t]:TASK_EN[t]));
      const btn=h("button",{
        class:"btn btn-s"+(isActive?" btn-active":""),
        style:{fontSize:"9px",padding:"3px 4px",width:"100%",textAlign:"left",
          lineHeight:"1.3",...(disabled?{opacity:.35,cursor:"not-allowed"}:{})},
        title:(L==="cs"?TASK_INFO_CS[t]:TASK_INFO_EN[t])||"",
        onClick:(evt)=>{
          if(disabled)return;
          spawnPills(evt,t);
          setWorkerTask(w.id,t);
        }},label);
      return btn;
    };

    // ── HORNÍ ČÁST: portrét + jméno + bary ──
    const topRow=h("div",{style:{display:"flex",gap:"8px",alignItems:"flex-start",marginBottom:"6px"}});

    // Portrét — fixní šířka, prázdné místo pod citátem = rezerva pro hero info
    const colPortrait=document.createElement("div");
    colPortrait.style.cssText="flex-shrink:0;width:76px;display:flex;flex-direction:column;gap:2px;";
    if(npc?.portrait){
      const pd=document.createElement("div");
      pd.style.cssText="line-height:0;border-radius:4px;overflow:hidden;width:72px;height:72px;background:#1a0e06;";
      const imgEl=document.createElement("img");
      if(window.FajrumPortraits)FajrumPortraits.configure(imgEl,w);else imgEl.src=`img/workers/${npc.portrait}.jpg`;
      imgEl.alt=w.name;
      imgEl.style.cssText="width:100%;height:100%;object-fit:cover;object-position:top center;display:block;";
      imgEl.onerror=function(){
        this.style.display="none";
        if(NPC_SVG[npc.portrait]){pd.innerHTML=NPC_SVG[npc.portrait];}
      };
      pd.append(imgEl);
      colPortrait.append(pd);
    }
    if(npc){
      const q=document.createElement("div");
      q.style.cssText="font-size:8px;font-style:italic;color:#c9952b;line-height:1.2;";
      q.textContent=`„${L==="cs"?npc.quote_cs:npc.quote_en}"`;
      colPortrait.append(q);
    }
    // Prázdné místo — rezerva pro hero info (budoucí použití)
    colPortrait.append(h("div",{style:{flex:"1"}}));
    topRow.append(colPortrait);

    // Jméno + profese + bary
    const colInfo=h("div",{style:{flex:"1",minWidth:0}});
    colInfo.append(
      h("div",{style:{display:"flex",alignItems:"center",gap:"5px",flexWrap:"wrap",marginBottom:"1px"}},
        h("div",{style:{fontWeight:"700",fontSize:"11px",color:"#3a2a14"}},w.name+" "+"★".repeat(Math.max(0,w.lv||0))),
        ...(w.traits?.map(t=>{
          const td=TRAITS[t];if(!td)return null;
          const tw=h("span",{class:"tip-wrap"});
          tw.append(
            h("span",{style:{fontSize:"11px",cursor:"default"},onClick:()=>tw.classList.toggle("open")},td.icon),
            h("span",{class:"tip"},`${L==="cs"?td.cs:td.en}: ${L==="cs"?td.desc_cs:td.desc_en}`));
          return tw;
        }).filter(Boolean)||[])),
      h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"4px"}},
        getProfLabel(w,L)));
    [{label:L==="cs"?"Únava":"Fat.",v:fatPct,c:fatColor},
     {label:"XP",v:xpPct,c:"#c9952b"},
     {label:L==="cs"?"Loaj.":"Loy.",v:loyalty,c:loyalty>60?"#4a7a3a":loyalty>35?"#c9952b":"#a03020"},
     {label:L==="cs"?"Zdraví":"HP",v:health,c:health>70?"#4a7a3a":health>40?"#c9952b":"#a03020"}
    ].forEach(m=>{
      colInfo.append(h("div",{style:{display:"flex",alignItems:"center",gap:"3px",marginBottom:"2px"}},
        h("span",{style:{fontSize:"8px",color:"#8b5e34",width:"28px",flexShrink:0}},m.label),
        h("div",{style:{flex:1,height:"4px",background:"rgba(0,0,0,.1)",borderRadius:"2px"}},
          h("div",{style:{width:m.v+"%",height:"100%",background:m.c,borderRadius:"2px"}})),
        h("span",{style:{fontSize:"8px",color:m.c,width:"22px",textAlign:"right",flexShrink:0}},m.v+"%")));
    });
    if(unpaid>0){
      colInfo.append(h("div",{style:{
        marginTop:"3px",padding:"2px 5px",borderRadius:"3px",
        background:"rgba(160,0,0,.12)",border:"1px solid rgba(160,0,0,.3)",
        fontSize:"8px",color:"#a03020",fontWeight:"700"}},
        "💸 "+(L==="cs"?"dluh":"owed")+": "+unpaid+"g"));
    }
    topRow.append(colInfo);
    card.append(topRow);

    // ── DOLNÍ ČÁST: 4 sloupce (rezerva | prim | výrobní | příroda) ──
    const taskGrid=h("div",{class:"fj-task-grid",style:{display:"grid",gridTemplateColumns:"76px 1fr 1fr 1fr",gap:"3px"}});

    // Sloupec 1 — prázdná rezerva (šířka portrétu)
    const col0=h("div",{});

    // Sloupec 2 — primární role tasky
    const col1=h("div",{style:{display:"flex",flexDirection:"column",gap:"2px"}});
    taskOpts.primary.forEach(({t,disabled})=>{
      col1.append(makeTaskBtn(t,undefined,disabled));
    });
    if(taskOpts.werkstat){
      col1.append(makeTaskBtn("werkstat",undefined,taskOpts.werkstat.disabled));
    }

    // Sloupec 3+4 — výrobní + příroda tasky, rovnoměrně rozdělené
    const col2=h("div",{style:{display:"flex",flexDirection:"column",gap:"2px"}});
    const col3=h("div",{style:{display:"flex",flexDirection:"column",gap:"2px"}});

    // Sesbírat všechny tasky které nejdou do col1
    const remainTasks=[...taskOpts.others];
    // Přidat ghost pánev v kampani
    if(taskOpts.panevGhost) remainTasks.push("__panev_ghost__");

    // Rovnoměrně do col2 a col3
    const half=Math.ceil(remainTasks.length/2);
    remainTasks.forEach((t,i)=>{
      const col=i<half?col2:col3;
      if(t==="__panev_ghost__"){
        col.append(h("button",{class:"btn btn-s",
          style:{fontSize:"9px",padding:"3px 4px",width:"100%",opacity:.35,cursor:"not-allowed"},
          title:L==="cs"?"Jen v přípravě":"Prep only"},
          "🏺 "+(L==="cs"?TASK_CS["panev"]:TASK_EN["panev"])));
      }else{
        col.append(makeTaskBtn(t));
      }
    });
    // Idle do col3 pokud není v primary
    if(taskOpts.idleExtra){
      col3.append(makeTaskBtn("idle",undefined,taskOpts.idleExtra.disabled));
    }

    taskGrid.append(col0,col1,col2,col3);
    card.append(taskGrid);
    wGrid.append(card);
    }); // end workers.forEach
    wSec.append(wGrid);
  } // end wState
  content.append(wSec);

  // Pivo
  const bSec=h("div",{class:"sec"});
  bSec.append(h("div",{class:"sec-title"},"🍺 "+(L==="cs"?"Pivovar":"Brewery")));
  const bRow=h("div",{style:{display:"flex",gap:"3px",flexWrap:"wrap"}});
  [L==="cs"?"Žádné":"None",L==="cs"?"1 džbán":"1 mug",L==="cs"?"2 džbány":"2 mugs",L==="cs"?"3+ džb.":"3+ mugs"].forEach((lb,i)=>{
    bRow.append(h("button",{class:"btn btn-s"+(p.beer===i?" btn-active":""),style:{flex:"1 1 auto"},
      onClick:()=>{setBeerLevel(i);}},lb+" ",h("span",{style:{fontSize:"9px",color:BEER[i].m>=0?"#4a7a3a":"#a03020"}},(BEER[i].m>=0?"+":"")+BEER[i].m)));
  });
  bSec.append(bRow);
  if(!isDesktop) content.append(bSec); // na desktopu je pivovar v pravém sloupci nahoře

  // Specializované profese
  const specProfs=["formar","foukac","brusic","rytec"];
  const specSec=h("div",{class:"sec fj-overview-specialists"});
  const spState=G._specOpen===undefined?true:G._specOpen;
  const spHdr=h("div",{class:"fj-overview-toggle",role:"button",tabindex:"0","aria-expanded":String(spState),style:{display:"flex",justifyContent:"space-between",alignItems:"center",
    cursor:"pointer",userSelect:"none",marginBottom:spState?"8px":"0"},
    onClick:()=>{G._specOpen=!spState;render();}});
  spHdr.append(
    h("div",{class:"sec-title",style:{margin:0}},"⚒️ "+(L==="cs"?"Specializované profese":"Specialist Roles")),
    h("span",{style:{fontSize:"11px",color:"#8b5e34"}},spState?"▲":"▼"));
  specSec.append(spHdr);

  if(spState){
    specProfs.forEach(profKey=>{
      const sp=SPEC_PROFS[profKey];
      const inHutte=p.workers.filter(w=>sp.profCodes.includes(w.prof));
      const isAvailable=p.round>=sp.availRound;
      const monthLabel=sp.availRound===0
        ?(L==="cs"?"od startu":"from start")
        :(L==="cs"?MONTHS_CS[sp.availRound]:MONTHS_EN[sp.availRound]);
      const card=h("div",{style:{
        padding:"8px",marginBottom:"6px",borderRadius:"4px",
        background:isAvailable?"rgba(0,0,0,.03)":"rgba(0,0,0,.015)",
        border:`1px solid ${isAvailable?sp.color+"44":"rgba(42,26,10,.08)"}`,
        opacity:isAvailable?1:.7}});

      const cardHdr=h("div",{style:{display:"flex",alignItems:"center",gap:"6px",marginBottom:"5px"}});
      cardHdr.append(
        h("span",{style:{fontSize:"16px"}},sp.icon),
        h("div",{style:{flex:"1"}},
          h("div",{style:{fontWeight:"700",fontSize:"12px",color:sp.color}},
            L==="cs"?sp.label_cs:sp.label_en),
          h("div",{style:{fontSize:"9px",color:"#8b5e34"}},
            (L==="cs"?"Nástup: ":"Start: ")+monthLabel)),
        h("span",{class:"pill"+(isAvailable?" ok":" warn"),style:{fontSize:"9px",flexShrink:0}},
          isAvailable
            ?(inHutte.length>0?(inHutte.length+"× "+(L==="cs"?"v huti":"in foundry")):(L==="cs"?"dostupné":"available"))
            :(L==="cs"?"ještě nepřišli":"not yet")));
      card.append(cardHdr);

      card.append(h("div",{style:{fontSize:"10px",color:"#6a4a28",lineHeight:"1.5",
        padding:"4px 6px",background:"rgba(139,94,52,.06)",borderRadius:"3px",marginBottom:"5px"}},
        L==="cs"?sp.bonus_cs:sp.bonus_en));

      if(inHutte.length>0){
        inHutte.forEach(w=>{
          const xpNeeded=XP_PER_LEVEL[w.lv-1]||999;
          const xpPct=w.lv>=10?100:Math.round(((w.xp||0)/xpNeeded)*100);
          const wRow=h("div",{style:{display:"flex",alignItems:"center",gap:"6px",
            fontSize:"11px",padding:"3px 0",borderTop:"1px solid rgba(42,26,10,.06)"}});
          wRow.append(
            h("span",{style:{flex:"1",fontWeight:"600"}},`${w.name} ${"★".repeat(Math.max(0,w.lv||0))}`),
            h("span",{style:{fontSize:"9px",color:"#8b5e34",flexShrink:0}},L==="cs"?PROF_CS[w.prof]:PROF_EN[w.prof]),
            h("div",{style:{width:"50px",height:"4px",background:"rgba(0,0,0,.1)",borderRadius:"2px",flexShrink:0}},
              h("div",{style:{width:xpPct+"%",height:"100%",background:sp.color,borderRadius:"2px"}})),
            h("span",{style:{fontSize:"9px",color:"#8b5e34",width:"28px",textAlign:"right"}},`${xpPct}%`));
          card.append(wRow);
        });
      } else if(isAvailable){
        card.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic"}},
          L==="cs"?"— najmi v mezisezóně":"— hire during off-season"));
      }
      specSec.append(card);
    });
  }
  content.append(specSec);
}
