// fate-card.js — W2: panel události s volbou na Přehledu (jen nová ekonomika). Každá volba ukazuje cenu, doznívající efekt a šanci; zašedlé = nelze (chybí zásoby / podmínka).
function fateCardNode(){
  const v=fatePendingView();if(!v)return null;
  const cs=G.lang==="cs";
  const box=h("div",{class:"fj-fate-card","data-fate-kind":v.kind,style:{margin:"4px 0 6px",padding:"8px 10px",borderRadius:"4px",background:"rgba(160,48,32,.07)",border:"2px solid rgba(160,48,32,.45)"}});
  box.append(h("div",{style:{fontWeight:"700",fontSize:"12px",color:"#7a2a18"}},`${v.icon} ${v.title}`),
    h("div",{style:{fontSize:"10px",color:"#5a3a1a",margin:"2px 0 6px",lineHeight:"1.4"}},v.desc));
  const wx=wxFx(),wl=wx.kind!=="normal"?wxEffectLines(wx):[];
  if(wl.length)box.append(h("div",{style:{fontSize:"9px",color:"#8b5e34",marginBottom:"5px"}},`${WX_ICON[wx.kind]} ${wl.map(l=>l.icon+" "+l.text).join(" · ")}`));
  v.options.forEach(o=>{
    const row=h("button",{class:"fj-fate-opt btn btn-s","data-fate-opt":o.id,
      style:{display:"block",width:"100%",textAlign:"left",margin:"0 0 4px",padding:"5px 8px",opacity:o.ok?1:.5,cursor:o.ok?"pointer":"not-allowed"},
      onClick:()=>{fateChoose(o.id);}});
    if(!o.ok)row.setAttribute("disabled","");   // h() by atribut zapsal i pro false
    row.append(h("div",{style:{fontWeight:"700",fontSize:"11px"}},o.label));
    row.append(h("div",{style:{fontSize:"10px",color:"#5a3a1a",lineHeight:"1.35"}},o.desc));
    const chips=h("div",{style:{fontSize:"10px",marginTop:"2px",display:"flex",gap:"8px",flexWrap:"wrap"}});
    o.costParts.forEach(c=>chips.append(h("span",{class:"fj-fate-cost",style:{color:c.ok?"#3a2a14":"#a03020"}},`${c.icon} ${c.text}`)));
    if(o.risk)chips.append(h("span",{class:"fj-fate-risk",style:{color:o.risk.p>0?"#a03020":"#4a7a3a"}},
      o.risk.p>0?`🎲 ${Math.round(o.risk.p*100)} %${o.risk.hit?": "+o.risk.hit:""}`:`🎲 0 %`));
    if(o.extra)chips.append(h("span",{style:{color:"#3a2a14"}},o.extra.text));
    if(!o.cost.zl&&!o.cost.wood&&!o.cost.food&&!o.risk&&!o.extra)chips.append(h("span",{style:{color:"#4a7a3a"}},cs?"zdarma":"free"));
    row.append(chips);
    if(!o.ok&&o.why)row.append(h("div",{class:"fj-fate-why",style:{fontSize:"9px",color:"#a03020"}},"⛔ "+o.why));
    box.append(row);
  });
  return box;
}
