// header.js — header bar with logo and chemistry badge; failure banner.
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderHeader(ctx){
  const {isP,L,isDesktop,p}=ctx;
  const tasks=isP?TASKS_PREP:TASKS_CAMP;

  // Header
  const hdrEl=h("div",{class:"hdr",style:{padding:"7px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}});
  const logoD=document.createElement("div");
  logoD.className="fj-brand";
  logoD.style.cssText="display:flex;align-items:center;gap:8px;";
  // Kruh se sítí — Animované chemické logo skloviny (SiO₂ · K₂O · CaO)
  const svgWrap=document.createElement("div");
  svgWrap.style.cssText="line-height:0;flex-shrink:0;cursor:pointer;";
  svgWrap.title=L==="cs"?"Chemická podstata skla: SiO₂ (křemen) · K₂O (potaš) · CaO (vápenec)":"Chemical nature of glass: SiO₂ (silica) · K₂O (potash) · CaO (lime)";
  svgWrap.onclick=(e)=>{
    FajrumSfx.play("glass", 0.7);
    spawnFloatText(L==="cs"?"✨ Vitrum: SiO₂ · K₂O · CaO":"✨ Vitrum: SiO₂ · K₂O · CaO", e, "gold");
  };
  svgWrap.innerHTML=`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="glass-chemical-logo" style="height:48px;width:48px;display:block;">
    <defs>
      <!-- Molten Crucible Ambient Glow -->
      <radialGradient id="moltenGlassGradH" cx="45%" cy="38%" r="62%">
        <stop offset="0%" stop-color="#3d1e08"/>
        <stop offset="55%" stop-color="#241205"/>
        <stop offset="100%" stop-color="#120702"/>
      </radialGradient>
      <!-- Silicon Atom Gradient (Amber/Gold Si4+) -->
      <radialGradient id="siNodeGradH" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="35%" stop-color="#fcd34d"/>
        <stop offset="75%" stop-color="#d97706"/>
        <stop offset="100%" stop-color="#78350f"/>
      </radialGradient>
      <!-- Oxygen Atom Gradient (Quartz Pearl O2-) -->
      <radialGradient id="oNodeGradH" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="45%" stop-color="#fef3c7"/>
        <stop offset="85%" stop-color="#d4af37"/>
        <stop offset="100%" stop-color="#543714"/>
      </radialGradient>
      <!-- Potash / Lime Ion Gradient (K+ / Ca2+) -->
      <radialGradient id="kModGradH" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#f0fdf4"/>
        <stop offset="45%" stop-color="#4ade80"/>
        <stop offset="85%" stop-color="#15803d"/>
        <stop offset="100%" stop-color="#052e16"/>
      </radialGradient>
      <!-- Circular Clip -->
      <clipPath id="crcHChem">
        <circle cx="32" cy="32" r="28.5"/>
      </clipPath>
      <!-- Optical Gleam Gradient -->
      <linearGradient id="gleamGradH" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.04"/>
        <stop offset="50%" stop-color="#fff8db" stop-opacity="0.45"/>
        <stop offset="52%" stop-color="#ffffff" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- Outer Antique Brass Bezel -->
    <circle cx="32" cy="32" r="31" fill="#180b03" stroke="#c9952b" stroke-width="1.6"/>
    <circle cx="32" cy="32" r="29.2" fill="none" stroke="#8b5e34" stroke-width="0.8" stroke-dasharray="2 1.5"/>

    <!-- Inner Molten Crucible Basin -->
    <circle cx="32" cy="32" r="28.5" fill="url(#moltenGlassGradH)"/>

    <!-- Vitreous Molecular Silicate Lattice (SiO2 Amorphous Network) -->
    <g clip-path="url(#crcHChem)">
      <!-- Pulsing Molten Core Background Aura -->
      <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(217,119,6,0.18)" stroke-width="6">
        <animate attributeName="r" values="18;23;18" dur="3.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.15;0.4;0.15" dur="3.6s" repeatCount="indefinite"/>
      </circle>

      <!-- Siloxane Bonds (Si - O - Si) -->
      <g stroke="#c9952b" stroke-width="1.25" stroke-linecap="round" opacity="0.85">
        <line x1="16" y1="16" x2="26" y2="23"/>
        <line x1="26" y1="23" x2="38" y2="17"/>
        <line x1="38" y1="17" x2="48" y2="24"/>
        <line x1="26" y1="23" x2="20" y2="34"/>
        <line x1="20" y1="34" x2="11" y2="40"/>
        <line x1="20" y1="34" x2="31" y2="39"/>
        <line x1="31" y1="39" x2="42" y2="33"/>
        <line x1="42" y1="33" x2="52" y2="38"/>
        <line x1="42" y1="33" x2="48" y2="24"/>
        <line x1="38" y1="17" x2="42" y2="33"/>
        <line x1="31" y1="39" x2="26" y2="50"/>
        <line x1="26" y1="50" x2="37" y2="54"/>
        <line x1="37" y1="54" x2="47" y2="47"/>
        <line x1="47" y1="47" x2="52" y2="38"/>
        <line x1="11" y1="40" x2="15" y2="52"/>
        <line x1="15" y1="52" x2="26" y2="50"/>
      </g>

      <!-- Dynamic Light & Energy Flow along Bonds -->
      <g stroke="#fffbeb" stroke-width="1.3" opacity="0.8" fill="none" stroke-linecap="round" stroke-dasharray="3 13">
        <line x1="16" y1="16" x2="26" y2="23"><animate attributeName="stroke-dashoffset" values="0;-16" dur="2.2s" repeatCount="indefinite"/></line>
        <line x1="26" y1="23" x2="38" y2="17"><animate attributeName="stroke-dashoffset" values="0;-16" dur="1.9s" repeatCount="indefinite"/></line>
        <line x1="38" y1="17" x2="48" y2="24"><animate attributeName="stroke-dashoffset" values="0;-16" dur="2.4s" repeatCount="indefinite"/></line>
        <line x1="20" y1="34" x2="31" y2="39"><animate attributeName="stroke-dashoffset" values="0;-16" dur="2.0s" repeatCount="indefinite"/></line>
        <line x1="31" y1="39" x2="42" y2="33"><animate attributeName="stroke-dashoffset" values="0;-16" dur="1.8s" repeatCount="indefinite"/></line>
        <line x1="31" y1="39" x2="26" y2="50"><animate attributeName="stroke-dashoffset" values="0;-16" dur="2.1s" repeatCount="indefinite"/></line>
        <line x1="37" y1="54" x2="47" y2="47"><animate attributeName="stroke-dashoffset" values="0;-16" dur="1.9s" repeatCount="indefinite"/></line>
      </g>

      <!-- Bridging Oxygen (O) Atoms -->
      <g class="oxygen-nodes">
        <circle cx="16" cy="16" r="3.8" fill="url(#oNodeGradH)" stroke="#2a1608" stroke-width="0.6"/>
        <circle cx="38" cy="17" r="3.8" fill="url(#oNodeGradH)" stroke="#2a1608" stroke-width="0.6"/>
        <circle cx="20" cy="34" r="3.8" fill="url(#oNodeGradH)" stroke="#2a1608" stroke-width="0.6"/>
        <circle cx="11" cy="40" r="3.4" fill="url(#oNodeGradH)" stroke="#2a1608" stroke-width="0.6"/>
        <circle cx="52" cy="38" r="3.6" fill="url(#oNodeGradH)" stroke="#2a1608" stroke-width="0.6"/>
        <circle cx="26" cy="50" r="3.8" fill="url(#oNodeGradH)" stroke="#2a1608" stroke-width="0.6"/>
        <circle cx="47" cy="47" r="3.8" fill="url(#oNodeGradH)" stroke="#2a1608" stroke-width="0.6"/>
        <circle cx="15" cy="52" r="3.2" fill="url(#oNodeGradH)" stroke="#2a1608" stroke-width="0.6"/>
        <circle cx="37" cy="54" r="3.6" fill="url(#oNodeGradH)" stroke="#2a1608" stroke-width="0.6"/>
      </g>

      <!-- Interstitial Modifier Ions: K+ Potash & Ca2+ Lime -->
      <g class="modifier-nodes">
        <circle cx="29" cy="27" r="2.4" fill="url(#kModGradH)" stroke="#86efac" stroke-width="0.5">
          <animate attributeName="r" values="2.2;2.7;2.2" dur="2.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="39" cy="44" r="2.0" fill="#ea580c" stroke="#fed7aa" stroke-width="0.5">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite"/>
        </circle>
      </g>

      <!-- Silicon (Si) Tetrahedral Centers -->
      <g class="silicon-nodes">
        <circle cx="26" cy="23" r="4.8" fill="url(#siNodeGradH)" stroke="#fef08a" stroke-width="0.8">
          <animate attributeName="r" values="4.6;5.1;4.6" dur="3.0s" repeatCount="indefinite"/>
        </circle>
        <circle cx="48" cy="24" r="4.4" fill="url(#siNodeGradH)" stroke="#fef08a" stroke-width="0.7"/>
        <circle cx="42" cy="33" r="5.0" fill="url(#siNodeGradH)" stroke="#fef08a" stroke-width="0.8">
          <animate attributeName="r" values="4.8;5.3;4.8" dur="2.6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="31" cy="39" r="4.6" fill="url(#siNodeGradH)" stroke="#fef08a" stroke-width="0.7"/>
      </g>

      <!-- Central Chemical Formula Badge -->
      <g class="chem-center-badge">
        <rect x="22" y="27.5" width="20" height="9" rx="2.5" fill="rgba(18,7,2,0.78)" stroke="#d97706" stroke-width="0.6"/>
        <text x="32" y="34.2" text-anchor="middle" font-family="'Palatino Linotype',Georgia,serif" font-size="6.2" font-weight="bold" fill="#fffbeb" letter-spacing="0.3">
          SiO<tspan font-size="4.5" dy="1.4">2</tspan>
        </text>
      </g>

      <!-- Rotating Optical Caustic Refraction Glint -->
      <rect x="-30" y="-30" width="124" height="124" fill="url(#gleamGradH)" pointer-events="none">
        <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="8s" repeatCount="indefinite"/>
      </rect>
    </g>

    <!-- Outer Rim Borders & Cardinal Accents -->
    <circle cx="32" cy="32" r="28.5" fill="none" stroke="#fbbf24" stroke-width="1.1"/>
    <circle cx="32" cy="2" r="1.3" fill="#fffbeb" stroke="#c9952b" stroke-width="0.5"/>
    <circle cx="62" cy="32" r="1.3" fill="#fffbeb" stroke="#c9952b" stroke-width="0.5"/>
    <circle cx="32" cy="62" r="1.3" fill="#fffbeb" stroke="#c9952b" stroke-width="0.5"/>
    <circle cx="2" cy="32" r="1.3" fill="#fffbeb" stroke="#c9952b" stroke-width="0.5"/>
  </svg>`;

  // Text blok s chemickou formulí
  const txtWrap=document.createElement("div");
  txtWrap.className="fj-brand-copy";
  txtWrap.style.cssText="display:flex;flex-direction:column;justify-content:center;";
  const t1=document.createElement("div");
  t1.style.cssText="font-family:Georgia,serif;font-size:16px;color:#f0deb8;letter-spacing:0.3px;line-height:1.1;font-weight:bold;";
  t1.textContent=isDesktop?(L==="cs"?"Sklářská Huť":"Glassworks"):"FAJRUM";
  txtWrap.append(t1);
  if(p.huteName){
    const tName=document.createElement("div");
    tName.style.cssText="font-family:Georgia,serif;font-size:10px;color:#c9952b;letter-spacing:1px;margin-top:1px;font-style:italic;";
    tName.textContent=p.huteName;
    txtWrap.append(tName);
  }
  const t2=document.createElement("div");
  t2.style.cssText="font-family:Georgia,serif;font-size:7px;color:#c9952b;letter-spacing:1px;margin-top:1px;";
  t2.textContent="Haida, Arnsdorf, Blottendorf · Novoborsko";
  const t3=document.createElement("div");
  t3.style.cssText="font-family:Georgia,serif;font-size:7px;color:#8b5e34;letter-spacing:1px;";
  t3.textContent=`Anno Domini ${1679+p.season}`;
  
  // Chemická formule — interaktivní odznak
  const chemPill=document.createElement("div");
  chemPill.className="chem-badge-pill";
  chemPill.title=L==="cs"?"Složení českého skla: Křemen (SiO₂ ~72%), Potaš (K₂O ~18%), Vápenec (CaO ~10%)":"Bohemian glass formula: Silica (SiO₂ ~72%), Potash (K₂O ~18%), Lime (CaO ~10%)";
  chemPill.innerHTML=`<span>⚗️ SiO₂ · K₂O · CaO</span>`;
  chemPill.onclick=(e)=>{
    e.stopPropagation();
    FajrumSfx.play("glass", 0.6);
    spawnFloatText(L==="cs"?"Křemen (SiO₂) · Potaš (K₂O) · Vápenec (CaO)":"Silica (SiO₂) · Potash (K₂O) · Lime (CaO)", e, "gold");
  };

  txtWrap.append(t2, t3, chemPill);

  // Animovaná molekulární síť skla v záhlaví
  const netDiv=document.createElement("div");
  netDiv.className="chem-network-wrap";
  netDiv.style.cssText="opacity:0.55;line-height:0;margin-left:8px;";
  netDiv.title=L==="cs"?"Amorfní křemičitá síť [SiO₄]⁴⁻ lesního skla":"Amorphous silicate [SiO₄]⁴⁻ vitreous lattice";
  netDiv.onclick=(e)=>{
    FajrumSfx.play("glass", 0.65);
    spawnFloatText("✨ [SiO₄]⁴⁻ Silicium", e, "gold");
  };
  netDiv.innerHTML=`<svg width="100" height="42" viewBox="0 0 100 42" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="netPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#c9952b" stop-opacity="0.3"/>
        <stop offset="50%" stop-color="#fff2a8" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#c9952b" stop-opacity="0.3"/>
      </linearGradient>
    </defs>
    <!-- Siloxane Covalent Matrix -->
    <g stroke="#c9952b" stroke-width="0.9" fill="none" stroke-linecap="round">
      <line x1="8" y1="12" x2="24" y2="20"/>
      <line x1="24" y1="20" x2="42" y2="12"/>
      <line x1="42" y1="12" x2="64" y2="22"/>
      <line x1="64" y1="22" x2="88" y2="14"/>
      <line x1="24" y1="20" x2="16" y2="32"/>
      <line x1="16" y1="32" x2="36" y2="36"/>
      <line x1="36" y1="36" x2="42" y2="12"/>
      <line x1="36" y1="36" x2="56" y2="30"/>
      <line x1="56" y1="30" x2="64" y2="22"/>
      <line x1="56" y1="30" x2="78" y2="34"/>
      <line x1="78" y1="34" x2="88" y2="14"/>
      <line x1="8" y1="12" x2="16" y2="32"/>
    </g>
    <!-- Traveling Energy Pulses along Bonds -->
    <g stroke="url(#netPulseGrad)" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-dasharray="3 12">
      <line x1="8" y1="12" x2="24" y2="20"><animate attributeName="stroke-dashoffset" values="0;-15" dur="2.4s" repeatCount="indefinite"/></line>
      <line x1="24" y1="20" x2="42" y2="12"><animate attributeName="stroke-dashoffset" values="0;-15" dur="2.1s" repeatCount="indefinite"/></line>
      <line x1="42" y1="12" x2="64" y2="22"><animate attributeName="stroke-dashoffset" values="0;-15" dur="2.5s" repeatCount="indefinite"/></line>
      <line x1="64" y1="22" x2="88" y2="14"><animate attributeName="stroke-dashoffset" values="0;-15" dur="2.2s" repeatCount="indefinite"/></line>
      <line x1="36" y1="36" x2="56" y2="30"><animate attributeName="stroke-dashoffset" values="0;-15" dur="2.0s" repeatCount="indefinite"/></line>
      <line x1="56" y1="30" x2="78" y2="34"><animate attributeName="stroke-dashoffset" values="0;-15" dur="2.3s" repeatCount="indefinite"/></line>
    </g>
    <!-- Oxygen Bridging Atoms (O) -->
    <g fill="#fef3c7" stroke="#2a1608" stroke-width="0.5">
      <circle cx="8" cy="12" r="2.5"/>
      <circle cx="42" cy="12" r="2.5"/>
      <circle cx="16" cy="32" r="2.5"/>
      <circle cx="36" cy="36" r="2.5"/>
      <circle cx="56" cy="30" r="2.5"/>
      <circle cx="88" cy="14" r="2.5"/>
    </g>
    <!-- Silicon Tetrahedral Atoms (Si) -->
    <g fill="#f59e0b" stroke="#fef08a" stroke-width="0.6">
      <circle cx="24" cy="20" r="3.2"><animate attributeName="r" values="3.0;3.5;3.0" dur="2.8s" repeatCount="indefinite"/></circle>
      <circle cx="64" cy="22" r="3.2"><animate attributeName="r" values="3.0;3.5;3.0" dur="2.5s" repeatCount="indefinite"/></circle>
      <circle cx="78" cy="34" r="2.8"/>
    </g>
    <!-- Modifier Ions K+ / Ca2+ -->
    <g>
      <circle cx="48" cy="22" r="1.8" fill="#4ade80" stroke="#15803d" stroke-width="0.4">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.6s" repeatCount="indefinite"/>
      </circle>
      <circle cx="68" cy="32" r="1.6" fill="#fb923c" stroke="#9a3412" stroke-width="0.4"/>
    </g>
    <!-- Chemical Micro Notation -->
    <text x="86" y="38" font-family="'Palatino Linotype',Georgia,serif" font-size="5.5" font-weight="bold" fill="#c9952b" opacity="0.85">SiO₂</text>
  </svg>`;

  logoD.append(svgWrap, txtWrap, netDiv);
  hdrEl.append(logoD,
    h("div",{style:{display:"flex",gap:"4px"}},
      h("button",{class:"btn btn-s",style:{background:"rgba(255,255,255,.1)",color:"#f0deb8",border:"1px solid rgba(255,255,255,.2)"},
        onClick:()=>{G.help=!G.help;render();}},"?"),
      h("button",{class:"btn btn-s",style:{background:"rgba(255,255,255,.1)",color:"#f0deb8",border:"1px solid rgba(255,255,255,.2)"},
        onClick:()=>{G.tab="settings";render();}},"⚙️"),
      h("button",{class:"btn btn-s",style:{background:"rgba(255,255,255,.1)",color:"#f0deb8",border:"1px solid rgba(255,255,255,.2)"},
        onClick:()=>{G.lang=L==="cs"?"en":"cs";render();}},L==="cs"?"EN":"CZ")));
  app.append(hdrEl);
}

function renderFailureBanner(ctx){
  const {p,L}=ctx;
  // Zánik hutě — informační lišta při prohlížení kroniky
  if(p.failureReason){
    const goBanner = h("div", {
      style: {
        background: "linear-gradient(90deg, rgba(160,48,32,.95) 0%, rgba(100,28,18,.98) 100%)",
        color: "#fff",
        padding: "8px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "11px",
        borderBottom: "1px solid rgba(255,255,255,.2)",
        flexWrap: "wrap",
        gap: "8px"
      }
    });
    goBanner.append(
      h("span", {style: {fontWeight: "700", display: "flex", alignItems: "center", gap: "6px"}},
        "📜 "+(L==="cs"?"Konec hry — Huť zanikla (prohlížení kroniky)":"Game Over — Foundry has fallen (viewing chronicle)")),
      h("div", {style: {display: "flex", gap: "6px"}},
        h("button", {
          class: "btn btn-s",
          style: {background: "rgba(255,255,255,.2)", color: "#fff", border: "1px solid rgba(255,255,255,.4)", fontSize: "10px"},
          onClick: () => { G.phase = "game_over"; render(); }
        }, L==="cs" ? "📜 Zpět na zánik" : "📜 Back to fall screen"),
        h("button", {
          class: "btn btn-s btn-p",
          style: {fontSize: "10px", fontWeight: "700"},
          onClick: restartAfterFall
        }, "🔥 "+(L==="cs"?"Založit novou huť":"New Game"))
      )
    );
    app.append(goBanner);
  }
}
