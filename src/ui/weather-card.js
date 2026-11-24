// weather-card.js — W1: karta počasí na Přehledu (jen nová ekonomika). Aktuální měsíc + jeho vlivy + tabulka rizik příštího měsíce (bez předpovědi).
function weatherRiskText(round){
  const cs=G.lang==="cs";
  return weatherRisk(round).filter(x=>x.kind!=="normal"&&x.p>0).map(x=>`${WX_ICON[x.kind]} ${Math.round(x.p*100)} %`).join("  ")||(cs?"žádné výkyvy":"no swings");
}
function weatherCardNode(){
  const fx=wxFx(),cs=G.lang==="cs",extreme=fx.kind!=="normal";
  const tone=fx.kind==="frost"?"rgba(90,140,190,.12)":fx.kind==="wet"?"rgba(90,120,150,.12)":fx.kind==="dry"?"rgba(201,149,43,.14)":fx.kind==="storm"?"rgba(110,90,150,.14)":"rgba(42,26,10,.04)";
  const box=h("div",{class:"fj-weather-card","data-wx":fx.kind,style:{margin:"4px 0",padding:"5px 8px",borderRadius:"4px",background:tone,border:"1px solid rgba(139,94,52,.2)",fontSize:"10px",lineHeight:"1.4"}});
  box.append(h("div",{style:{fontWeight:"700",color:"#3a2a14"}},
    `${WX_ICON[fx.kind]} ${cs?"Počasí":"Weather"}: ${(WX_NAME[fx.kind]||WX_NAME.normal)[cs?"cs":"en"]}`));
  if(extreme){
    const lines=wxEffectLines(fx);
    if(lines.length)box.append(h("div",{class:"fj-weather-fx",style:{color:"#5a3a1a",marginTop:"2px"}},lines.map(l=>`${l.icon} ${l.text}`).join(" · ")));
  }
  const nx=(G.round+1)%12;
  box.append(h("div",{class:"fj-weather-risk",style:{color:"#8b5e34",marginTop:"2px"}},
    `${cs?"Příští měsíc, riziko":"Next month, risk"} (${(cs?MONTHS_CS:MONTHS_EN)[nx]}): ${weatherRiskText(nx)}`));
  return box;
}
