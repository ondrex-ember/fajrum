// Karta obchodního partnera: portrét (nebo emoji), jméno a role, pásmo důvěry, ukazatel důvěry, replika;
// rozbalovací metriky, historie a životopis. Jen zobrazuje — nic nemění ve hře. Obsah z PARTNERS (data/partners.js).
const _partnerOpen={};   // které karty jsou rozbalené (jen UI, nepatří do savu)
function partnerCard(id){
  const def=PARTNERS[id];if(!def)return null;
  const L=G.lang, cs=L!=="en";
  const st=(G.partners&&G.partners[id])||{trust:def.startTrust||0,n:{},sum:{},log:[]};
  const trust=Math.max(0,Math.min(100,st.trust||0));
  const tier=partnerTier(id,trust);
  const tr=(o,k)=>cs?o[k+"_cs"]:o[k+"_en"];
  const card=h("div",{class:"fj-partner-card","data-partner-card":id,style:{padding:"8px 10px",background:"rgba(42,26,10,.05)",borderRadius:"4px",border:"1px solid rgba(139,94,52,.25)",marginBottom:"8px"}});

  // portrét: obrázek, při chybě emoji
  const portrait=h("span",{style:{width:"40px",height:"48px",flexShrink:"0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",
    background:"rgba(42,26,10,.08)",borderRadius:"4px",overflow:"hidden"}},def.emoji);
  if(def.portrait){
    const img=h("img",{src:"img/"+def.portrait,alt:"",width:"40",height:"48",loading:"lazy",style:{objectFit:"cover",objectPosition:"center 35%",display:"block"}});
    img.addEventListener("load",()=>{portrait.textContent="";portrait.append(img);},{once:true});
  }
  const head=h("div",{style:{display:"flex",gap:"10px",alignItems:"center",marginBottom:"6px"}},portrait,
    h("div",{style:{flex:"1",minWidth:"0"}},
      h("div",{style:{fontSize:"12px",fontWeight:"700",color:"#3a2a14"}},tr(def,"role")+" "+def.name),
      h("div",{style:{fontSize:"10px",color:"#8b5e34"}},cs?tier.cs:tier.en)),
    h("strong",{style:{fontSize:"13px",color:"#8b5e34"}},Math.round(trust)+"/100"));
  card.append(head);

  // ukazatel důvěry s pásmy
  const track=h("div",{style:{position:"relative",height:"6px",borderRadius:"3px",background:"rgba(42,26,10,.12)",marginBottom:"6px"}});
  track.append(h("div",{style:{height:"100%",width:trust+"%",borderRadius:"3px",background:"#c9952b"}}));
  def.tiers.forEach(t=>{if(t.min>0)track.append(h("div",{style:{position:"absolute",left:t.min+"%",top:"-1px",width:"1px",height:"8px",background:"rgba(42,26,10,.35)"}}));});
  card.append(track);
  card.append(h("div",{style:{fontSize:"10px",color:"#5a4a2a",fontStyle:"italic",lineHeight:"1.4",marginBottom:"4px"}},"„"+(cs?tier.line_cs:tier.line_en)+"“"));

  const det=h("details",{style:{fontSize:"10px",color:"#5a4a2a"}});
  if(_partnerOpen[id])det.setAttribute("open","");
  det.addEventListener("toggle",()=>{_partnerOpen[id]=det.open;});
  det.append(h("summary",{style:{cursor:"pointer",color:"#8b5e34",fontWeight:"600"}},cs?"Metriky, historie, o postavě":"Metrics, history, about"));

  // metriky: pro každou událost z obsahu počet (+ součet částek)
  const rows=Object.entries(def.events).map(([ev,d])=>{
    const n=(st.n&&st.n[ev])||0, sum=(st.sum&&st.sum[ev])||0;
    return h("div",{style:{display:"flex",justifyContent:"space-between",gap:"8px",padding:"1px 0"}},
      h("span",null,cs?d.cs:d.en),h("span",null,n+"×"+(sum>0?" · "+mny(sum):"")));
  });
  det.append(h("div",{style:{marginTop:"4px",fontWeight:"600",color:"#8b5e34"}},cs?"Metriky":"Metrics"),...rows);

  // historie: posledních 10 záznamů, nejnovější nahoře
  const log=(st.log||[]).slice(-10).reverse();
  det.append(h("div",{style:{marginTop:"6px",fontWeight:"600",color:"#8b5e34"}},cs?"Historie":"History"));
  if(!log.length)det.append(h("div",{style:{fontStyle:"italic"}},cs?"Zatím nic.":"Nothing yet."));
  log.forEach(r=>{
    const d=def.events[r.ev]||{};
    const month=(cs?MONTHS_CS:MONTHS_EN)[r.r]||"";
    const delta=r.d>0?"+"+r.d:r.d<0?String(r.d):"±0";
    det.append(h("div",{style:{display:"flex",justifyContent:"space-between",gap:"8px",padding:"1px 0"}},
      h("span",null,(cs?"sez. ":"s. ")+r.s+" · "+month+" · "+(cs?d.cs:d.en)+(r.amt>0?" ("+mny(r.amt)+")":"")),
      h("span",{style:{color:r.d>0?"#4a7a3a":r.d<0?"#a03020":"#8b5e34",fontWeight:"600"}},delta)));
  });
  det.append(h("div",{style:{marginTop:"6px",fontWeight:"600",color:"#8b5e34"}},cs?"O postavě":"About"),
    h("div",{style:{lineHeight:"1.4"}},cs?def.bio_cs:def.bio_en),
    h("div",{style:{marginTop:"3px",fontStyle:"italic"}},"„"+(cs?def.quote_cs:def.quote_en)+"“"));
  card.append(det);
  return card;
}
