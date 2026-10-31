// contract.js — new-season contract modal.
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderContractModal(ctx){
  const {p,L}=ctx;
  const avail=p.avail||[];
  const top2=[...avail].sort((a,b)=>b.reward-a.reward).slice(0,2);
  const rest=avail.length-top2.length;
  const modal=h("div",{class:"modal-bg fj-d1-contract-modal",style:{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",
    display:"flex",alignItems:"center",justifyContent:"center",zIndex:220}});
  const box=h("div",{class:"fj-d1-contract-dialog",style:{background:"linear-gradient(145deg,#f4e4c1,#e8d5a3)",borderRadius:"6px",
    padding:"20px",maxWidth:"360px",width:"90%",boxShadow:"0 4px 24px rgba(0,0,0,.5)",
    fontFamily:"Georgia,serif",border:"2px solid #8b5e34"}});
  // Hlavička
  box.append(
    h("div",{class:"fj-d1-modal-heading",style:{fontSize:"14px",fontWeight:"700",color:"#3a2a14",marginBottom:"4px",
      borderBottom:"1px solid rgba(42,26,10,.2)",paddingBottom:"8px"}},
      "📜 "+(L==="cs"?"Nové zakázky na trhu":"New Contracts Available")),
    h("div",{class:"fj-d1-modal-intro",style:{fontSize:"10px",color:"#8b5e34",marginBottom:"10px",fontStyle:"italic"}},
      L==="cs"
        ?"Kupci přišli s nabídkami na novou sezónu. Přijmeš?"
        :"Merchants arrived with offers for the new season. Will you accept?")
  );
  if(top2.length===0){
    box.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"10px"}},
      L==="cs"?"Žádné zakázky tento rok.":"No contracts this year."));
  }
  // Top 2 kontrakty
  top2.forEach(c=>{
    const canAccept=canAcceptContract()&&!(p.contracts||[]).find(x=>x.id===c.id);
    const alreadyAccepted=!!(p.contracts||[]).find(x=>x.id===c.id);
    const row=h("div",{class:"fj-d1-contract-option",style:{padding:"8px 10px",marginBottom:"6px",borderRadius:"4px",
      background:"rgba(255,255,255,.35)",border:"1px solid rgba(139,94,52,.25)"}});
    const buyerIcon=c.buyer==="Opat"?"⛪":c.buyer==="Slechtic"?"🏰":c.buyer==="Hoffmann"?"🏙️":"🛒";
    row.append(
      h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#3a2a14",marginBottom:"3px"}},
        buyerIcon+" "+(L==="cs"?c.cs:c.en)),
      h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"4px"}},
        h("span",{style:{fontSize:"10px",color:"#4a7a3a",fontWeight:"700"}},"+"+c.reward+"g"),
        alreadyAccepted
          ?h("span",{style:{fontSize:"10px",color:"#4a7a3a"}},L==="cs"?"✓ Přijato":"✓ Accepted")
          :h("button",{class:"btn btn-s"+(canAccept?" btn-p":""),
              style:{opacity:canAccept?1:0.45,cursor:canAccept?"pointer":"not-allowed",fontSize:"10px"},
              onClick:()=>{
                if(!canAccept)return;
                acceptContract(c.id);
              }},L==="cs"?"Přijmout":"Accept"))
    );
    box.append(row);
  });
  // Slotů info
  const usedSlots=(p.contracts||[]).length;
  if(usedSlots>=MAX_CONTRACTS){
    box.append(h("div",{style:{fontSize:"10px",color:"#a03020",marginBottom:"6px",fontStyle:"italic"}},
      L==="cs"?`⚠️ Plno zakázek (max ${MAX_CONTRACTS}). Splň aktivní před přijetím dalších.`:`⚠️ Contract slots full (max ${MAX_CONTRACTS}).`));
  }
  // Odkaz na Trh + Zavřít
  const btnRow=h("div",{class:"fj-d1-modal-actions",style:{display:"flex",gap:"6px",marginTop:"10px"}});
  if(rest>0){
    btnRow.append(h("button",{class:"btn btn-s",style:{flex:1,fontSize:"10px"},
      onClick:()=>{G._contractModalPending=false;G.tab="market";render();}},
      L==="cs"?"→ Trh ("+rest+" dalších)":"→ Market ("+rest+" more)"));
  }
  btnRow.append(h("button",{class:"btn btn-p",style:{flex:1,fontSize:"11px"},
    onClick:()=>{G._contractModalPending=false;render();}},
    L==="cs"?"Pokračovat →":"Continue →"));
  box.append(btnRow);
  modal.append(box);
  app.append(modal);
  return;
}
