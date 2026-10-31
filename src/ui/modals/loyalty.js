// loyalty.js — loyalty modal (workers with unpaid wages).
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderLoyaltyModal(ctx,debtedWorkers){
  const {L,p}=ctx;
  const modal=h("div",{class:"modal-bg",style:{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",
    display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}});
  const box=h("div",{style:{background:"linear-gradient(145deg,#f4e4c1,#e8d5a3)",borderRadius:"6px",
    padding:"20px",maxWidth:"340px",width:"90%",boxShadow:"0 4px 24px rgba(0,0,0,.5)",
    fontFamily:"Georgia,serif",border:"2px solid #8b5e34"}});
  box.append(
    h("div",{style:{fontSize:"13px",fontWeight:"700",color:"#3a2a14",marginBottom:"8px",borderBottom:"1px solid rgba(42,26,10,.15)",paddingBottom:"6px"}},
      "⚠️ "+(L==="cs"?"Nespokojení dělníci":"Disgruntled Workers")),
    h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"10px",lineHeight:"1.6"}},
      L==="cs"
        ?"Tito dělníci nedostali plnou mzdu. Uvažují o odchodu do jiné hutě."
        :"These workers did not receive full wages. They are considering leaving for another foundry."));
  debtedWorkers.forEach(w=>{
    box.append(h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",
      padding:"4px 8px",marginBottom:"3px",background:"rgba(160,0,0,.07)",borderRadius:"3px",
      fontSize:"11px",border:"1px solid rgba(160,0,0,.15)"}},
      h("span",{style:{fontWeight:"700",color:"#3a2a14"}},w.name+" "+"★".repeat(Math.max(0,w.lv||0))),
      h("span",{style:{color:"#a03020"}},(L==="cs"?"dluh: ":"owes: ")+(w.unpaidDebt||0)+"g")));
  });
  const totalUnpaid=debtedWorkers.reduce((s,w)=>s+(w.unpaidDebt||0),0);
  const canPayAll=p.grose>=totalUnpaid;
  box.append(h("div",{style:{marginTop:"10px",display:"flex",flexDirection:"column",gap:"5px"}}));
  const btnRow=h("div",{style:{display:"flex",flexDirection:"column",gap:"5px",marginTop:"10px"}});
  if(canPayAll){
    btnRow.append(h("button",{class:"btn btn-p",style:{width:"100%",fontSize:"11px"},
      onClick:loyaltyModalPayAll},L==="cs"?"💸 Splatit vše ("+totalUnpaid+"g) — dělníci zůstanou":"💸 Pay all ("+totalUnpaid+"g) — workers stay"));
  }
  btnRow.append(h("button",{class:"btn",style:{width:"100%",fontSize:"11px"},
    onClick:loyaltyModalPromise},L==="cs"?"🤝 Slíbit doplatek — dělníci váhají (+5 loaj.)":"🤝 Promise payment — workers hesitate (+5 loy.)"));
  btnRow.append(h("button",{class:"btn",style:{width:"100%",fontSize:"11px",opacity:.7},
    onClick:loyaltyModalDismiss},
    L==="cs"?"Pokračovat bez slíbu":"Continue without promise"));
  box.append(btnRow);
  modal.append(box);
  app.append(modal);
  return;
}
