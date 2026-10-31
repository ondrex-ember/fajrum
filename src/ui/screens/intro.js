// intro.js — intro screen (phase "intro").
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderIntroScreen(ctx){
  const {L}=ctx;
  FurnaceAudio.stop();

  // SVG logo (původní)
  const intro=INTRO_TEXT.intro[L==="cs"?"cs":"en"];
  const introLogoDiv=document.createElement("div");
  introLogoDiv.style.cssText="margin:10px auto 18px;display:block;width:320px;max-width:100%;cursor:pointer;";
  introLogoDiv.onclick=(e)=>{
    FajrumSfx.play("glass", 0.7);
    spawnFloatText("✨ Vitrum Siliceum: SiO₂ · K₂O · CaO", e, "gold");
  };
  introLogoDiv.innerHTML=`<svg viewBox="0 0 320 112" xmlns="http://www.w3.org/2000/svg" style="width:100%;filter:drop-shadow(0 4px 14px rgba(0,0,0,0.4));">
      <defs>
        <radialGradient id="introCrucibleGrad" cx="45%" cy="38%" r="62%">
          <stop offset="0%" stop-color="#3d1e08"/>
          <stop offset="60%" stop-color="#221004"/>
          <stop offset="100%" stop-color="#120802"/>
        </radialGradient>
        <radialGradient id="introSiNode" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="35%" stop-color="#fcd34d"/>
          <stop offset="75%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#78350f"/>
        </radialGradient>
        <radialGradient id="introONode" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="45%" stop-color="#fef3c7"/>
          <stop offset="85%" stop-color="#d4af37"/>
          <stop offset="100%" stop-color="#543714"/>
        </radialGradient>
        <clipPath id="introLogoClip">
          <circle cx="56" cy="56" r="46"/>
        </clipPath>
        <linearGradient id="introGleam" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="48%" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="50%" stop-color="#fff8db" stop-opacity="0.4"/>
          <stop offset="52%" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Card Parchment Frame -->
      <rect width="320" height="112" rx="10" fill="#f4e4c1" stroke="#8b5e34" stroke-width="1.2"/>
      <rect x="3" y="3" width="314" height="106" rx="8" fill="none" stroke="rgba(139,94,52,0.25)" stroke-width="0.8"/>

      <!-- Circular Crucible Medallion -->
      <circle cx="56" cy="56" r="48" fill="#180b03" stroke="#c9952b" stroke-width="2"/>
      <circle cx="56" cy="56" r="46" fill="url(#introCrucibleGrad)"/>

      <!-- Clipped Vitreous Silicate Matrix -->
      <g clip-path="url(#introLogoClip)">
        <circle cx="56" cy="56" r="36" fill="none" stroke="rgba(217,119,6,0.22)" stroke-width="8">
          <animate attributeName="r" values="32;38;32" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite"/>
        </circle>

        <!-- Siloxane Bonds (Si-O-Si) -->
        <g stroke="#c9952b" stroke-width="1.6" stroke-linecap="round" opacity="0.85">
          <line x1="26" y1="24" x2="42" y2="36"/>
          <line x1="42" y1="36" x2="64" y2="28"/>
          <line x1="64" y1="28" x2="82" y2="40"/>
          <line x1="42" y1="36" x2="34" y2="58"/>
          <line x1="34" y1="58" x2="18" y2="68"/>
          <line x1="34" y1="58" x2="54" y2="66"/>
          <line x1="54" y1="66" x2="72" y2="56"/>
          <line x1="72" y1="56" x2="88" y2="66"/>
          <line x1="72" y1="56" x2="82" y2="40"/>
          <line x1="64" y1="28" x2="72" y2="56"/>
          <line x1="54" y1="66" x2="46" y2="84"/>
          <line x1="46" y1="84" x2="66" y2="90"/>
          <line x1="66" y1="90" x2="82" y2="80"/>
          <line x1="82" y1="80" x2="88" y2="66"/>
          <line x1="18" y1="68" x2="24" y2="86"/>
          <line x1="24" y1="86" x2="46" y2="84"/>
        </g>

        <!-- Energy Pulses -->
        <g stroke="#fffbeb" stroke-width="1.8" opacity="0.85" fill="none" stroke-linecap="round" stroke-dasharray="4 16">
          <line x1="26" y1="24" x2="42" y2="36"><animate attributeName="stroke-dashoffset" values="0;-20" dur="2.2s" repeatCount="indefinite"/></line>
          <line x1="42" y1="36" x2="64" y2="28"><animate attributeName="stroke-dashoffset" values="0;-20" dur="1.9s" repeatCount="indefinite"/></line>
          <line x1="64" y1="28" x2="82" y2="40"><animate attributeName="stroke-dashoffset" values="0;-20" dur="2.4s" repeatCount="indefinite"/></line>
          <line x1="34" y1="58" x2="54" y2="66"><animate attributeName="stroke-dashoffset" values="0;-20" dur="2.0s" repeatCount="indefinite"/></line>
          <line x1="54" y1="66" x2="72" y2="56"><animate attributeName="stroke-dashoffset" values="0;-20" dur="1.8s" repeatCount="indefinite"/></line>
          <line x1="54" y1="66" x2="46" y2="84"><animate attributeName="stroke-dashoffset" values="0;-20" dur="2.1s" repeatCount="indefinite"/></line>
        </g>

        <!-- Oxygen (O) Atoms -->
        <g fill="url(#introONode)" stroke="#2a1608" stroke-width="0.9">
          <circle cx="26" cy="24" r="6"/>
          <circle cx="64" cy="28" r="6"/>
          <circle cx="34" cy="58" r="6"/>
          <circle cx="18" cy="68" r="5.5"/>
          <circle cx="88" cy="66" r="6"/>
          <circle cx="46" cy="84" r="6"/>
          <circle cx="82" cy="80" r="6"/>
          <circle cx="24" cy="86" r="5.5"/>
          <circle cx="66" cy="90" r="6"/>
        </g>

        <!-- Modifier Ions K+ & Ca2+ -->
        <g>
          <circle cx="50" cy="46" r="3.6" fill="#4ade80" stroke="#15803d" stroke-width="0.7">
            <animate attributeName="r" values="3.2;4.0;3.2" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="68" cy="74" r="3.2" fill="#ea580c" stroke="#fed7aa" stroke-width="0.7">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite"/>
          </circle>
        </g>

        <!-- Silicon (Si) Tetrahedral Centers -->
        <g fill="url(#introSiNode)" stroke="#fef08a" stroke-width="1.2">
          <circle cx="42" cy="36" r="7.5"><animate attributeName="r" values="7.2;8.0;7.2" dur="3s" repeatCount="indefinite"/></circle>
          <circle cx="82" cy="40" r="7"/>
          <circle cx="72" cy="56" r="8"><animate attributeName="r" values="7.6;8.4;7.6" dur="2.6s" repeatCount="indefinite"/></circle>
          <circle cx="54" cy="66" r="7.5"/>
        </g>

        <!-- Center SiO2 Formula Badge -->
        <g>
          <rect x="39" y="47" width="34" height="15" rx="4" fill="rgba(18,7,2,0.82)" stroke="#d97706" stroke-width="1"/>
          <text x="56" y="58" text-anchor="middle" font-family="'Palatino Linotype',Georgia,serif" font-size="10.5" font-weight="bold" fill="#fffbeb" letter-spacing="0.6">
            SiO<tspan font-size="7.5" dy="2.4">2</tspan>
          </text>
        </g>

        <!-- Caustic Gleam -->
        <rect x="-40" y="-40" width="200" height="200" fill="url(#introGleam)" pointer-events="none">
          <animateTransform attributeName="transform" type="rotate" from="0 56 56" to="360 56 56" dur="9s" repeatCount="indefinite"/>
        </rect>
      </g>

      <!-- Outer Medallion Border -->
      <circle cx="56" cy="56" r="46" fill="none" stroke="#e5b85c" stroke-width="1.8"/>

      <!-- Title & Chemical Typography on Right -->
      <g transform="translate(114, 22)">
        <text x="0" y="24" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="#2a1608" letter-spacing="0.5">${L==="cs"?"Sklářská Huť":"Glassworks"}</text>
        <text x="0" y="42" font-family="Georgia,serif" font-size="11" font-weight="bold" fill="#8b5e34" letter-spacing="1">FAJRUM · ANNO DOMINI 1680</text>
        <text x="0" y="58" font-family="'Palatino Linotype',Georgia,serif" font-size="9.5" fill="#6a4520" font-style="italic">Haida · Arnsdorf · Novoborsko</text>
        
        <!-- Chemical Formula Ribbon -->
        <g transform="translate(0, 66)">
          <rect x="0" y="0" width="192" height="18" rx="4" fill="rgba(42,22,8,0.08)" stroke="rgba(139,94,52,0.4)" stroke-width="0.8"/>
          <text x="8" y="12.5" font-family="'Palatino Linotype',Georgia,serif" font-size="8.5" font-weight="bold" fill="#543714">
            ⚗️ Vitrum Siliceum: <tspan fill="#8b5e34">SiO₂</tspan> · <tspan fill="#2e7d32">K₂O</tspan> · <tspan fill="#c2410c">CaO</tspan>
          </text>
        </g>
      </g>
    </svg>`;

  // Obrázek pod tlačítky — 702×1175, schová se pokud chybí
  const introImgDiv=document.createElement("div");
  introImgDiv.style.cssText="width:100%;margin-top:16px;border-radius:4px;overflow:hidden;";
  const introImgEl=document.createElement("img");
  introImgEl.src="intro.jpg";
  introImgEl.alt="";
  introImgEl.style.cssText="width:100%;display:block;";
  introImgEl.onerror=()=>{introImgDiv.style.display="none";};
  introImgDiv.appendChild(introImgEl);

  app.append(
    h("div",{style:{textAlign:"center",padding:"28px 20px 16px"}},
      h("div",{style:{textAlign:"right",marginBottom:"4px"}},
        h("a",{href:"/about.html",target:"_blank",style:{fontSize:"10px",color:"#8b5e34",opacity:.6,textDecoration:"none",letterSpacing:"1px"}},". . . About")),
      introLogoDiv,
      h("div",{style:{marginBottom:"12px"}},
        h("label",{style:{fontSize:"11px",color:"#8b5e34",display:"block",marginBottom:"4px"}},
          L==="cs"?"Jméno hutě:":"Name of the foundry:"),
        h("input",{
          type:"text",
          placeholder:L==="cs"?"např. Huť u Zeleného stromu...":"e.g. The Green Tree Foundry...",
          value:G.huteName||"",
          style:{width:"100%",padding:"6px 10px",fontSize:"12px",
            border:"1px solid #c9952b",borderRadius:"4px",
            background:"rgba(201,149,43,.08)",color:"#3a2a14",
            fontFamily:"Georgia,serif",boxSizing:"border-box"},
          onInput:e=>{G.huteName=e.target.value;}
        })),
      h("div",{style:{textAlign:"left",padding:"14px",background:"rgba(0,0,0,.04)",borderRadius:"4px",
        fontSize:"13px",lineHeight:"1.6",marginBottom:"16px",borderLeft:"3px solid #8b5e34"}},intro),
      // Difficulty tlačítka
      h("div",{style:{marginBottom:"12px"}},
        h("div",{style:{fontSize:"10px",color:"#8b5e34",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"1px"}},
          L==="cs"?"Obtížnost:":"Difficulty:"),
        h("div",{style:{display:"flex",gap:"8px",justifyContent:"center"}},
          h("button",{
            class:"btn"+(G.difficulty==="normal"?" btn-active":""),
            style:{flex:1},
            onClick:()=>{G.difficulty="normal";render();}},
            L==="cs"?"⚔️ Normální":"⚔️ Normal"),
          h("button",{
            class:"btn"+(G.difficulty==="easy"?" btn-active":""),
            style:{flex:1},
            onClick:()=>{G.difficulty="easy";render();}},
            L==="cs"?"🕯️ Lehký start":"🕯️ Easy start")),
        h("div",{style:{fontSize:"10px",color:"#8b5e34",marginTop:"4px",fontStyle:"italic",lineHeight:"1.5",
          padding:"6px 8px",background:"rgba(0,0,0,.04)",borderRadius:"3px",borderLeft:"2px solid #8b5e34"}},
          INTRO_TEXT[G.difficulty==="easy"?"easy":"normal"][L==="cs"?"cs":"en"])),
      h("div",{style:{display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap"}},
        h("button",{class:"btn btn-p",onClick:()=>{startGame(G.difficulty||"normal");}},
          L==="cs"?"Vstoupit do hutě →":"Enter the Foundry →"),
        (()=>{
          try{
            const s=localStorage.getItem("sh_v9");
            if(s){
              const sv=JSON.parse(s);
              if(sv&&sv.season){
                validateGameSave(sv);
                const dt=Number.isFinite(sv._savedAt)?new Date(sv._savedAt).toLocaleString("cs-CZ",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"";
                return h("button",{class:"btn",style:{borderColor:"#c9952b",color:"#c9952b"},
                  onClick:()=>{saveguardLoad(sv);}},
                  `▶ ${L==="cs"?"Pokračovat":"Continue"}${dt?` · ${dt}`:""}`);
              }
            }
          }catch(e){}
          return null;
        })(),
        h("button",{class:"btn",onClick:()=>{G.lang=L==="cs"?"en":"cs";render();}},L==="cs"?"EN":"CZ")),
      // Citát nad obrázkem
      h("div",{style:{textAlign:"center",padding:"12px 0 8px",fontSize:"11px",
        fontStyle:"italic",color:"#8b5e34",letterSpacing:"0.3px"}},
        "Ludite et, super omnia, nolite pugnare."),
      // Obrázek POD citátem
      introImgDiv),
    h("div",{style:{textAlign:"center",padding:"8px",fontSize:"10px",color:"#8b5e34",opacity:.5}},
      "v8.0 · Multi-sezóna · Živá pec 🔥 · Barevné sklo 🎨 · ",
      h("a",{href:"/about.html",target:"_blank",style:{color:"#c9952b",opacity:.8,textDecoration:"none"}},". . . About")));
  // Leaderboard
  try{
    const lb=JSON.parse(localStorage.getItem("sh4")||"[]");
    if(lb.length){
      const sec=h("div",{class:"sec"},h("div",{class:"sec-title"},"🏆 "+(L==="cs"?"Nejlepší výsledky":"Best Results")));
      lb.slice(0,5).forEach((e,i)=>{
        sec.append(h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"12px",padding:"1px 0"}},
          h("span",null,(i+1)+". "+e.date+" · S"+e.season),h("strong",null,e.score)));
      });
      app.append(sec);
    }
  }catch{}
  return;
}
