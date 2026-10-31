const app=document.getElementById("app");
function h(tag,attrs,...kids){
  const el=document.createElement(tag);
  if(attrs)Object.entries(attrs).forEach(([k,v])=>{
    if(k==="style"&&typeof v==="object")Object.assign(el.style,v);
    else if(k.startsWith("on"))el.addEventListener(k.slice(2).toLowerCase(),v);
    else el.setAttribute(k,v);
  });
  kids.flat(9).forEach(c=>{if(c!=null)el.append(typeof c==="string"||typeof c==="number"?document.createTextNode(c):c);});
  return el;
}
function pill(emoji,val,cls){return h("span",{class:"pill"+(cls?" "+cls:"")},emoji," ",h("strong",null,val));}
function pillTip(emoji,val,cls,tipText,resourceKey){
  const w=h("span",{class:"tip-wrap"});
  const art=resourceKey&&window.FajrumUI?.resourceIcon?FajrumUI.resourceIcon(resourceKey,emoji):emoji;
  const attrs={class:"pill"+(cls?" "+cls:""),onClick:()=>{w.classList.toggle("open");}};
  if(resourceKey){attrs["data-fajrum-resource"]=resourceKey;attrs["aria-label"]=tipText;}
  w.append(h("span",attrs,art," ",h("strong",null,val)));
  if(tipText)w.append(h("span",{class:"tip"},tipText));
  return w;
}
function bar(val,max,color){
  return h("div",{class:"bar-track"},h("div",{class:"bar-fill",style:{width:clamp(val/max*100,0,100)+"%",background:color}}));
}
function effBar(pct,color){
  return h("div",{class:"eff-bar"},h("div",{class:"eff-fill",style:{width:pct+"%",background:color}}));
}

function hireFromMarket(candidate){
  if(G.workers.length>=MAX_WORKERS||G.grose<candidate.hireCost)return;
  G.grose-=candidate.hireCost;
  G.workers.push({...candidate,id:"w"+Date.now()});
  G.trhuNPC=(G.trhuNPC||[]).filter(c=>c.id!==candidate.id);
  G.log.push(`__ECO__👷 ${candidate.name} ${G.lang==="cs"?"přijat do hutě":"hired"} (-${candidate.hireCost}g)`);
  render();
}

function buildCandidateCard(c,body,p,L){
  const canHire=p.grose>=c.hireCost&&p.workers.length<MAX_WORKERS;
  const isSpec=["foukat_lesni","foukat_kristal","foukat_dekor","foukat_formy","brusic_hrana","brusic_kulic","rytec"].includes(c.prof);
  const card=h("div",{class:"fj-hiring-candidate","data-candidate-id":c.id,style:{
    padding:"8px",marginBottom:"5px",borderRadius:"4px",
    background:isSpec?"rgba(201,149,43,.04)":"rgba(0,0,0,.03)",
    border:`1px solid ${isSpec?"rgba(201,149,43,.2)":"rgba(42,26,10,.1)"}`}});
  const topRow=h("div",{class:"fj-hiring-head",style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"4px"}});
  const nameBlock=h("div",{class:"fj-hiring-name",style:{flex:"1"}},
    h("div",{style:{fontWeight:"700",fontSize:"12px"}},
      `${c.name} · ${stars(c.lv)} · ${L==="cs"?PROF_CS[c.prof]||c.prof:PROF_EN[c.prof]||c.prof}`),
    h("div",{style:{fontSize:"10px",color:"#8b5e34",marginTop:"2px"}},
      c.traits.map(t=>{
        const tr=TRAITS[t];
        return tr?`${tr.icon} ${L==="cs"?tr.cs:tr.en}: ${L==="cs"?tr.desc_cs:tr.desc_en}`:"";
      }).filter(Boolean).join(" · ")||"—"));
  const hireBtn=h("button",{
    class:"btn btn-s"+(canHire?" btn-p":""),
    style:{opacity:canHire?1:.4,flexShrink:0,marginLeft:"8px"},
    onClick:()=>{if(canHire)hireWorker(c);}},
    `${L==="cs"?"Najmout":"Hire"} ${c.hireCost}g`);
  topRow.append(nameBlock,hireBtn);
  card.append(topRow);
  if(c.wageMod!==0){
    card.append(h("div",{style:{fontSize:"10px",color:c.wageMod<0?"#4a7a3a":"#a03020"}},
      `${L==="cs"?"Mzda":"Wage"}: ${c.wageMod>0?"+":""}${c.wageMod}g/kolo`));
  }
  body.append(card);
}

