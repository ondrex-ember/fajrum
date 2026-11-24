// welcome.js — first-visit welcome modal.
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderWelcomeModal(ctx){
  const {L}=ctx;
  const wModal=h("div",{class:"modal-bg"},
    h("div",{class:"modal",onClick:e=>e.stopPropagation(),style:{maxWidth:"340px"}},
      h("div",{style:{textAlign:"center",marginBottom:"10px",fontSize:"20px"}},"🔥"),
      h("h3",{style:{margin:"0 0 4px",fontSize:"15px",textAlign:"center"}},
        L==="cs"?"Vítej na huti":"Welcome to the Foundry"),
      h("div",{style:{fontSize:"11px",fontStyle:"italic",color:"#8b5e34",textAlign:"center",
        marginBottom:"12px",letterSpacing:"0.3px"}},
        "\u201eIgnis mutat res.\u201c"),
      h("div",{style:{fontSize:"12px",lineHeight:"1.7",marginBottom:"10px",color:"#3a2a14"}},
        L==="cs"
          ?"Máš pec, dluhy a hvozd kolem dokola. Každá sezóna má dvě fáze:"
          :"You have a furnace, debts, and forest all around. Each season has two phases:"),
      h("div",{style:{fontSize:"11px",lineHeight:"1.6",background:"rgba(0,0,0,.04)",
        borderRadius:"4px",padding:"8px 10px",marginBottom:"8px"}},
        h("div",{style:{marginBottom:"4px"}},
          L==="cs"?"🌿 Příprava (Listopad–Březen): kácej dřevo, vypal potaš, vyrob pánve."
                  :"🌿 Prep (Nov–Mar): log wood, burn potash, make crucibles."),
        h("div",null,
          L==="cs"?"🔥 Kampaň (Duben–Říjen): pec hoří, taví, prodávej na trhu."
                  :"🔥 Campaign (Apr–Oct): furnace burns, smelt, sell at market.")),
      h("div",{style:{fontSize:"11px",lineHeight:"1.6",marginBottom:"12px",color:"#5a3a1a"}},
        L==="cs"
          ?"Dřevo rozděluješ na záložce Přehled (palivo / potaš / stavba). V kampani potřebuje pec palivo, ale potaš nesmí zůstat na 0 %, jinak se sklo brzy nesvaří."
          :"Allocate wood in the Overview tab (fuel / potash / build). In campaign the furnace needs fuel, but never leave potash at 0%, or glass soon cannot be melted."),
      h("div",{style:{fontSize:"11px",lineHeight:"1.6",marginBottom:"12px",color:"#5a3a1a",fontStyle:"italic"}},
        guideOn()
          ?(L==="cs"?"Průvodcem ti bude mistr Kunc. Najdeš ho nahoře na Přehledu a vypnout ho můžeš v Nastavení."
                   :"Master Kunc will guide you. You will find him at the top of the Overview, and you can turn him off in Settings.")
          :(L==="cs"?"Chceš, aby tě provázel mistr Kunc? Radí krok za krokem podle toho, co se v huti děje."
                   :"Would you like master Kunc to guide you? He advises step by step based on what is happening.")),
      guideOn()?null:h("button",{class:"btn",style:{width:"100%",marginBottom:"8px"},onClick:()=>setGuide(true)},
        L==="cs"?"Zapnout průvodce":"Turn on the guide"),
      h("button",{class:"btn btn-p",style:{width:"100%"},
        onClick:()=>{G.firstVisit=false;render();}},
        L==="cs"?"OK — Vstoupit do hutě":"OK — Enter the Foundry")));
  app.append(wModal);
}
