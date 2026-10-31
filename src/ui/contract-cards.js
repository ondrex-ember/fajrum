// Karta aktivní zakázky: co dodat, kolik máš, do kdy, odměna, reputace, co dělat
function renderContractCard(c,kind){
  const L=G.lang, cs=L==="cs";
  const st=contractStatus(c);
  const warn=!st.ready&&(st.state==="blocked"||st.state==="last"||contractUrgent(st.remaining));
  const colMain=st.ready?"#4a7a3a":(warn?"#a03020":"#8b5e34");
  const fama=contractFamaInfo(c,kind);
  const reward=contractReward(c,kind);
  const total=st.lines.reduce((s,x)=>s+x.need,0);
  const got=st.lines.reduce((s,x)=>s+Math.min(x.have,x.need),0);
  const pct=total>0?Math.round(got/total*100):0;
  const box=h("div",{class:"fj-contract-card","data-contract-id":c.id,"data-contract-kind":kind,"data-state":st.state,style:{padding:"8px 10px",marginBottom:"6px",borderRadius:"4px",
    background:warn?"rgba(160,48,32,.07)":(st.ready?"rgba(74,122,58,.07)":"rgba(0,0,0,.04)"),
    border:"1px solid "+(warn?"rgba(160,48,32,.25)":(st.ready?"rgba(74,122,58,.25)":"rgba(42,26,10,.12)"))}});
  // Hlavička: kdo chce co + termín
  box.append(h("div",{class:"fj-contract-heading",style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px",marginBottom:"5px"}},
    h("div",{class:"fj-contract-name",style:{fontSize:"11px",fontWeight:"700",color:warn?"#a03020":"#3a2a14",lineHeight:"1.35",flex:1}},
      contractIcon(c)+" "+(cs?c.cs:c.en)),
    h("div",{class:"fj-contract-deadline",style:{fontSize:"10px",color:colMain,fontWeight:warn?"700":"400",textAlign:"right",flexShrink:0}},
      "⏳ "+contractDeadlineText(c,st.remaining))));
  // Co dodat
  box.append(h("div",{style:{fontSize:"9px",fontWeight:"700",color:"#8b5e34",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"2px"}},
    cs?"Dodat:":"Deliver:"));
  st.lines.forEach(x=>{
    box.append(h("div",{class:"fj-contract-line","data-item":x.item,"data-have":x.have,"data-need":x.need,style:{fontSize:"10px",color:x.done?"#4a7a3a":"#5a3a1a",marginBottom:"1px"}},
      (x.done?"✅ ":"⬜ ")+x.label+" — "+(cs?"na skladě ":"in stock ")+x.have+"/"+x.need));
  });
  // Průběh
  box.append(h("div",{class:"fj-contract-progress",role:"progressbar","aria-label":cs?"Plnění zakázky":"Contract progress","aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":pct,style:{height:"5px",background:"rgba(0,0,0,.1)",borderRadius:"3px",margin:"5px 0"}},
    h("div",{style:{width:pct+"%",height:"100%",borderRadius:"3px",
      background:st.ready?"#4a7a3a":(warn?"#a03020":"#c9952b")}})));
  // Odměna a reputace
  let famaTxt="";
  if(fama.cat){
    famaTxt=" · "+FAMA_ICON[fama.cat]+" "+(cs?"reputace ":"reputation ")+(cs?FAMA_LABEL_CS[fama.cat]:FAMA_LABEL_EN[fama.cat])
      +" +"+fama.gain+" / "+(cs?"při propadnutí ":"if missed ")+fama.loss;
  }
  box.append(h("div",{class:"fj-contract-reward",style:{fontSize:"10px",color:"#8b5e34",marginBottom:"3px"}},"💰 +"+reward+"g"+famaTxt));
  // Co dělat
  const where=contractWhere(st.lines,L);
  let msg;
  if(st.state==="ready"){
    msg=cs?"✅ Máš vše. Odevzdá se samo při uzavření měsíce — tyto kusy neprodávej."
          :"✅ You have it all. It is delivered automatically at month end — do not sell these pieces.";
  }else if(st.state==="blocked"){
    msg=cs?`❌ Do termínu pec netaví — splnit jde jen ze zásoby. Chybí ${st.missing} ks.`
          :`❌ The furnace will not run before the deadline — only stock can fill this. ${st.missing} missing.`;
  }else if(st.state==="last"){
    msg=cs?`⚠️ Poslední měsíc! Chybí ${st.missing} ks — vyrob je teď (${where}), odevzdání proběhne na konci tohoto měsíce.`
          :`⚠️ Last month! ${st.missing} missing — make them now (${where}); delivery happens at the end of this month.`;
  }else{
    msg=cs?`🔨 Chybí ${st.missing} ks — vyrob je (${where}) a nech na skladě.`
          :`🔨 ${st.missing} missing — make them (${where}) and keep them in stock.`;
  }
  box.append(h("div",{class:"fj-contract-guidance",style:{fontSize:"10px",fontWeight:"600",color:colMain,lineHeight:"1.4"}},msg));
  if(c.isEndgame&&!st.ready){
    box.append(h("div",{style:{fontSize:"9px",color:"#8b5e34",fontStyle:"italic",marginTop:"2px"}},
      cs?"Odevzdá se, až budou na skladě všechny komponenty najednou."
        :"Delivered once all components are in stock at the same time."));
  }
  return box;
}

// Řádek nabídky (nepřijatá tržní zakázka) s tlačítkem Přijmout
function contractOfferRow(c){
  const L=G.lang, cs=L==="cs";
  const can=canAcceptContract();
  const fama=contractFamaInfo(c,"market");
  const dueTxt=contractDueText(c.due);
  const row=h("div",{class:"fj-contract-offer","data-contract-id":c.id,style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"8px",
    padding:"6px 8px",borderRadius:"4px",marginBottom:"4px",
    background:"rgba(42,26,10,.04)",border:"1px solid rgba(42,26,10,.1)"}});
  row.append(
    h("div",{style:{flex:1,minWidth:0}},
      h("div",{style:{fontSize:"10px",color:"#3a2a14",lineHeight:"1.35"}},contractIcon(c)+" "+(cs?c.cs:c.en)),
      h("div",{style:{fontSize:"9px",color:"#8b5e34"}},
        "💰 +"+contractReward(c,"market")+"g"+(dueTxt?" · ⏳ "+dueTxt:"")
        +(fama.cat?" · "+FAMA_ICON[fama.cat]+" +"+fama.gain:""))),
    h("button",{class:"btn btn-s"+(can?" btn-p":""),...(can?{}:{disabled:true}),
      style:{fontSize:"9px",flexShrink:0,opacity:can?1:0.45,cursor:can?"pointer":"not-allowed"},
      onClick:()=>{acceptContract(c.id);}},cs?"Přijmout":"Accept"));
  return row;
}
