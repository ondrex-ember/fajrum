// log.js — tab "log".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabLog(ctx){
  const {L,p,content}=ctx;
  const lSec=h("div",{class:"sec"});
  lSec.append(h("div",{class:"sec-title"},"📜 "+(L==="cs"?"Kronika hutě":"Chronicle of the Foundry")));
  const box=h("div",{id:"logBox",style:{maxHeight:"420px",overflowY:"auto",paddingRight:"2px"}});
  if(!p.log.length){
    box.append(h("span",{style:{color:"#8b5e34",fontSize:"12px"}},L==="cs"?"Kronika je prázdná...":"Chronicle is empty..."));
  }else{
    // Renderuj strukturované záznamy
    p.log.forEach(entry=>{
      entry=chronShow(entry);
      if(entry.startsWith("__SEASON__")){
        const parts=entry.replace("__SEASON__","").split("·");
        const div=h("div",{class:"log-season-hdr"},`⸻ ${L==="cs"?"Sezóna":"Season"} ${parts[0].trim()} · ${parts[1]?.trim()||""} ⸻`);
        box.append(div);
      }else if(entry.startsWith("__MONTH__")){
        const month=entry.replace("__MONTH__","");
        const div=h("div",{style:{fontSize:"11px",fontWeight:"700",color:"var(--warm)",
          marginTop:"10px",marginBottom:"2px",letterSpacing:".5px"}},`— ${month} —`);
        box.append(div);
      }else if(entry.startsWith("__FLAVOR__")){
        const text=entry.replace("__FLAVOR__","");
        const div=h("div",{style:{fontSize:"12px",fontStyle:"italic",color:"#6a4a28",
          lineHeight:"1.6",marginBottom:"4px",paddingLeft:"8px",
          borderLeft:"2px solid rgba(139,94,52,.2)"}},text);
        box.append(div);
      }else if(entry.startsWith("__PROD__")){
        const text=entry.replace("__PROD__","");
        box.append(h("div",{style:{fontSize:"11px",color:"#4a7a3a",paddingLeft:"4px",lineHeight:"1.5"}},text));
      }else if(entry.startsWith("__ECO__")){
        const text=entry.replace("__ECO__","");
        box.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",paddingLeft:"4px",lineHeight:"1.5"}},text));
      }else if(entry.startsWith("__EVT__")){
        const text=entry.replace("__EVT__","");
        box.append(h("div",{style:{fontSize:"11px",color:"#a03020",paddingLeft:"4px",lineHeight:"1.5",fontWeight:"600"}},text));
      }else if(entry.trim()){
        // Legacy záznamy z v4.0
        box.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",paddingLeft:"4px",
          fontFamily:"'Courier New',monospace",lineHeight:"1.5"}},entry));
      }
    });
  }
  lSec.append(box);
  content.append(lSec);
  setTimeout(()=>{const lb=document.getElementById("logBox");if(lb)lb.scrollTop=lb.scrollHeight;},10);
}
