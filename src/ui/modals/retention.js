// retention.js — retention modal (a worker considers leaving).
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderRetentionModal(ctx,wId,rw){
  const {L,p}=ctx;
  const modal=h("div",{class:"modal-bg",style:{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",
    display:"flex",alignItems:"center",justifyContent:"center",zIndex:210}});
  const box=h("div",{class:"retention-modal-box"});
  // Portrét + jméno
  const headRow=h("div",{style:{display:"flex",gap:"12px",alignItems:"flex-start",marginBottom:"12px",
    paddingBottom:"10px",borderBottom:"1px solid rgba(42,26,10,.2)"}});
  const portBox=h("div",{style:{width:"56px",height:"56px",borderRadius:"5px",overflow:"hidden",
    background:"#1a0e06",flexShrink:0}});
  const imgEl=document.createElement("img");
  if(window.FajrumPortraits)FajrumPortraits.configure(imgEl,rw);else imgEl.src=`img/workers/${rw.portrait||"unknown"}.jpg`;
  imgEl.style.cssText="width:100%;height:100%;object-fit:cover;object-position:top center;";
  imgEl.onerror=function(){this.style.display="none";};
  portBox.appendChild(imgEl);
  headRow.append(portBox);
  const headInfo=h("div",{style:{flex:1}});
  const tier=workerTier(rw.lv);
  headInfo.append(
    h("div",{style:{fontWeight:"700",fontSize:"13px",color:"#3a2010",marginBottom:"2px"}},
      "👋 "+rw.name),
    h("div",{style:{fontSize:"10px",color:"#8b5e34",marginBottom:"4px"}},
      `${tier.cs} · ${tier.de} lv.${rw.lv} · ${(L==="cs"?"Loaj.":"Loy.")}: ${rw.loyalty}%`),
    h("div",{style:{fontSize:"10px",color:"#5a3a1a",fontStyle:"italic",lineHeight:"1.5"}},
      `"${rw[L==="cs"?"quote_cs":"quote_en"]||"..."}"`)
  );
  headRow.append(headInfo); // E1c: originally omitted; show the existing name, rank and quote beside the portrait.
  box.append(headRow);
  // Situace
  const unpaid=rw.unpaidDebt||0;
  const sitText=rw.loyalty<20
    ?(L==="cs"?"Tenhle člověk má sbalené věci. Teď nebo nikdy.":"This man has his bags packed. Now or never.")
    :(L==="cs"?"Přemýšlí o odchodu do jiné hutě. Slyšel o místě ve Falknově.":"He's thinking about leaving for another foundry. Heard of a spot in Falknov.");
  box.append(h("div",{style:{fontSize:"11px",color:"#5a2a10",marginBottom:"10px",lineHeight:"1.6",
    padding:"8px",background:"rgba(160,48,32,.07)",borderRadius:"4px",border:"1px solid rgba(160,48,32,.15)"}},
    "⚠️ "+sitText));
  if(unpaid>0){
    box.append(h("div",{style:{fontSize:"11px",color:"#a03020",marginBottom:"8px",fontWeight:"600"}},
      `💸 ${L==="cs"?"Dlužné mzdy":"Owed wages"}: ${unpaid}g — ${L==="cs"?"to ho drásá nejvíc":"this hurts him most"}`));
  }
  // Kontrakt volby
  box.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"5px"}},
    L==="cs"?"📜 Nabídni kontrakt (záloha):":"📜 Offer contract (advance payment):"));
  const contractGrid=h("div",{style:{marginBottom:"10px"}});
  let selectedMonths=null;
  CONTRACT_OPTIONS.forEach(opt=>{
    const cost=contractCost(rw,opt.months);
    const canAfford=p.grose>=cost;
    const btn=h("div",{class:"contract-btn"+(canAfford?"":" disabled"),
      style:{opacity:canAfford?1:0.45,cursor:canAfford?"pointer":"not-allowed"},
      onClick:()=>{
        if(!canAfford) return;
        signContract(wId,opt.months);
      }});
    const lbl=L==="cs"?opt.label_cs:opt.label_en;
    const moodBonus=Math.min(opt.months,12);
    btn.append(
      h("span",{style:{fontWeight:"600"}},lbl),
      h("span",{style:{color:"#8b5e34",fontSize:"10px"}},`${cost}g · +20 loaj. +${moodBonus} nál.`)
    );
    contractGrid.append(btn);
  });
  box.append(contractGrid);
  // Spodní akce
  const actRow=h("div",{style:{display:"flex",flexDirection:"column",gap:"4px"}});
  if(unpaid>0&&p.grose>=unpaid){
    actRow.append(h("button",{class:"btn btn-p",style:{fontSize:"11px"},
      onClick:()=>{retentionPayDebt(wId);}},`💸 ${L==="cs"?"Splatit dluh":"Pay debt"} (${unpaid}g) ${L==="cs"?"— zůstane":"— he stays"}`));
  }
  actRow.append(
    h("button",{class:"btn",style:{fontSize:"11px",opacity:.75},
      onClick:()=>{retentionPromise(wId);}},L==="cs"?"🤝 Slíbit zlepšení (+5 loaj., váhá)":"🤝 Promise improvement (+5 loy., hesitates)"),
    h("button",{class:"btn",style:{fontSize:"11px",opacity:.55},
      onClick:()=>{retentionIgnore(wId);}},L==="cs"?"Neřešit nyní…":"Ignore for now…")
  );
  box.append(actRow);
  modal.append(box);
  app.append(modal);
  return;
}
