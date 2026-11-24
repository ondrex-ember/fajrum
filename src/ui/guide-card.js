// Karta průvodce Kunce nahoře na Přehledu: portrét, bublina s radou, tlačítko akce, „Později", „Vypnout průvodce".
// Jen zobrazuje; výběr kroku dělá core/guide.js (čistá funkce stavu), akce jsou obyčejné akce hry.
function guideCard(){
  const v=guideView();if(!v)return null;
  const cs=G.lang!=="en";
  const portrait=h("span",{class:"fj-guide-portrait","data-anim":v.anim,style:{width:"44px",height:"54px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",
    fontSize:"24px",background:"rgba(42,26,10,.08)",borderRadius:"4px",overflow:"hidden"}},"🧔");
  const img=h("img",{src:"img/workers/kunc.jpg",alt:"",width:"44",height:"54",loading:"lazy",style:{objectFit:"cover",objectPosition:"center 30%",display:"block"}});
  img.addEventListener("load",()=>{portrait.textContent="";portrait.append(img);},{once:true});

  const actions=h("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center",marginTop:"6px"}});
  if(v.ctaLabel){
    if(v.ctaEnabled)actions.append(h("button",{class:"btn btn-s btn-p",onClick:()=>{if(v.openTab)G.tab=v.openTab;guideDo(v.id);}},v.ctaLabel));
    else actions.append(h("button",{class:"btn btn-s",disabled:true,style:{opacity:.5,cursor:"not-allowed"}},v.ctaLabel));
  }
  const small={fontSize:"10px"};
  actions.append(h("button",{class:"btn btn-s",style:small,onClick:()=>guideSnooze(v.id)},cs?"Později":"Later"),
    h("button",{class:"btn btn-s",style:small,onClick:()=>setGuide(false)},cs?"Vypnout průvodce":"Turn off guide"));

  const body=h("div",{style:{flex:"1",minWidth:"0"}},
    h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#8b5e34",marginBottom:"2px"}},cs?"Mistr Kunc":"Master Kunc"),
    h("div",{style:{fontSize:"12px",lineHeight:"1.5",color:"#3a2a14"}},v.text));
  if(v.ctaHint)body.append(h("div",{style:{fontSize:"10px",color:"#a03020",fontStyle:"italic",marginTop:"4px"}},v.ctaHint));
  body.append(actions);
  return h("div",{class:"fj-guide-card sec","data-guide-step":v.id,style:{display:"flex",gap:"10px",alignItems:"flex-start",
    borderLeft:"3px solid #c9952b",background:"rgba(201,149,43,.08)",marginBottom:"8px"}},portrait,body);
}
