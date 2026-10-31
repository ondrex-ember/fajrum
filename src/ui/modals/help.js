// help.js — help modal.
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderHelpModal(ctx){
  const {L}=ctx;
  const modal=h("div",{class:"modal-bg",onClick:()=>{G.help=false;render();}},
    h("div",{class:"modal",style:{maxWidth:"380px",maxHeight:"85vh",overflowY:"auto"},onClick:e=>e.stopPropagation()},
      h("h3",{style:{margin:"0 0 10px",fontSize:"15px",borderBottom:"1px solid rgba(42,26,10,.15)",paddingBottom:"8px"}},
        "📖 "+(L==="cs"?"Nápověda · v8.0":"Help · v8.0")),

      // Rytmus hry
      h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#3a2a14",marginBottom:"4px"}},
        L==="cs"?"⏱️ Rytmus hry":"⏱️ Game rhythm"),
      h("div",{style:{fontSize:"11px",color:"#8b5e34",lineHeight:"1.7",marginBottom:"10px"}},
        L==="cs"
          ?"5 kol přípravy (listopad–březen): kácej dřevo, zásobuj, vyrob pánve, připrav kmen. 7 kol kampaně (duben–říjen): pec hoří, taví se, prodávej. S lepší pecí se příprava zkracuje. Pak mezisezóna: oprav šamot, objednej přísady, uzavři kontrakty."
          :"5 prep rounds (Nov–Mar): log wood, stockpile, make crucibles, prepare batch. 7 campaign rounds (Apr–Oct): furnace burns, smelt, sell. A better furnace shortens prep. Then off-season: repair shamot, order additives, sign contracts."),

      // Výroba skla
      h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#3a2a14",marginBottom:"6px"}},
        L==="cs"?"🔥 Výrobní recepty":"🔥 Production recipes"),
      h("div",{style:{fontSize:"11px",color:"#6b3a10",marginBottom:"3px",fontFamily:"monospace",background:"rgba(42,26,10,.06)",padding:"4px 6px",borderRadius:"3px"}},
        "🟫 Waldglas: 3🏖️ písek + 2🌿 potaš + 1🪨 vápenec + 1💧 voda + 🏺 pánev"),
      h("div",{style:{fontSize:"11px",color:"#6b3a10",marginBottom:"3px",fontFamily:"monospace",background:"rgba(42,26,10,.06)",padding:"4px 6px",borderRadius:"3px"}},
        "✨ Křišťál: 3🏖️ + 2🌿raf + 1🪨 + 1⚫ uhlí · min 65% teplota"),
      h("div",{style:{fontSize:"11px",color:"#6b3a10",marginBottom:"3px",fontFamily:"monospace",background:"rgba(42,26,10,.06)",padding:"4px 6px",borderRadius:"3px"}},
        "🏺 Pánev: 2🧱 jíl + 1🍞 základ · zraje 6 měsíců"),
      h("div",{style:{fontSize:"11px",color:"#6b3a10",marginBottom:"8px",fontFamily:"monospace",background:"rgba(42,26,10,.06)",padding:"4px 6px",borderRadius:"3px"}},
        "🟤 Jantar: 2🟫 waldglas + Crocus Martis + 1⚫ uhlí · pánev v redukci"),

      // Pec
      h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#3a2a14",marginBottom:"4px"}},
        L==="cs"?"🔥 Pec & účinnost":"🔥 Furnace & efficiency"),
      h("div",{style:{fontSize:"11px",color:"#8b5e34",lineHeight:"1.7",marginBottom:"10px"}},
        L==="cs"
          ?"Účinnost pece = zaběhnutost + kvalita pánve + stav šamotu. Zaběhnutost roste každou kampaní (max ~58% u primitivní pece). Šamot degraduje — oprav v mezisezóně (jíl + vápenec). Přetopení (>85%) → prasklá pánev → ztráta várky."
          :"Furnace efficiency = run-in + crucible quality + shamot condition. Run-in grows each campaign (max ~58% for primitive). Shamot degrades — repair off-season (clay + limestone). Overheating (>85%) → cracked crucible → lost batch."),

      // Barevné sklo
      h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#3a2a14",marginBottom:"4px"}},
        L==="cs"?"🎨 Barevné sklo":"🎨 Coloured glass"),
      h("div",{style:{fontSize:"11px",color:"#8b5e34",lineHeight:"1.7",marginBottom:"10px"}},
        L==="cs"
          ?"🟤 Jantar — waldglas + Fe (Crocus Martis), dostupné od začátku. 🔵 Modrá — křišťál + šmolka (kobalt), odemkne Baranovský. 🟢 Smaragd — křišťál + pálená měď. ⚪ Lattimo — křišťál + cín + olovo. 🔴 Rubín — strike glass! Barva se tvoří až při chladnutí koloidního zlata. Při tavení vypadá čiré — nevíš jestli se povedlo, dokud nevychladne."
          :"🟤 Amber — waldglas + Fe (Crocus Martis), available from start. 🔵 Blue — crystal + zaffre (cobalt), unlocked by Baranovský. 🟢 Emerald — crystal + burnt copper. ⚪ Lattimo — crystal + tin + lead. 🔴 Ruby — strike glass! Colour forms only as colloidal gold crystallises on cooling. Looks clear during melt — you won't know if it worked until it cools."),

      // Kontrakty
      h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#3a2a14",marginBottom:"4px"}},
        L==="cs"?"📜 Zakázky (Trh)":"📜 Contracts (Market)"),
      h("div",{style:{fontSize:"11px",color:"#8b5e34",lineHeight:"1.7",marginBottom:"10px"}},
        L==="cs"
          ?"Na začátku každé sezóny přijdou nabídky od kupců — přijmi max 3 aktivní zakázky. Splnění do termínu = bonus groše. Nesplnění = ztráta reputace. Kupci: Weiss (waldglas), Hoffmann (křišťál), Opat z Lemberka (liturgie), Šlechtic von Harrach (luxus)."
          :"At each season start, buyers make offers — accept max 3 active contracts. Fulfil by deadline = bonus groschen. Failure = reputation loss. Buyers: Weiss (waldglas), Hoffmann (crystal), Abbot of Lemberk (liturgy), Noble von Harrach (luxury)."),

      h("div",{style:{textAlign:"right",marginTop:"10px",borderTop:"1px solid rgba(42,26,10,.1)",paddingTop:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
        h("a",{href:"/about.html",target:"_blank",style:{fontSize:"11px",color:"#c9952b",textDecoration:"none"}},
          "📖 "+(L==="cs"?"Více o hře →":"More about the game →")),
        h("button",{class:"btn btn-p",style:{fontSize:"12px"},onClick:()=>{G.help=false;render();}},"OK"))));
  app.append(modal);
}
