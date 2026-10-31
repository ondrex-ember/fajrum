// ── INLINE SVG PLACEHOLDER ───────────────────────────────────────────────────
function achPlaceholder(imgId, icon, label, unlocked){
  // Vrací SVG placeholder — nahradit za <img src="..."> až budou obrázky
  const bg=unlocked?"#2a1a08":"#1a1208";
  const border=unlocked?"#c9952b":"#4a3020";
  const textCol=unlocked?"#f0deb8":"#6a4830";
  const glowCol=unlocked?"rgba(201,149,43,.25)":"transparent";
  const el=document.createElement("div");
  el.innerHTML=`<svg id="${imgId}" width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"
    style="border-radius:8px;display:block;filter:${unlocked?"drop-shadow(0 0 6px "+glowCol+")":"grayscale(1) opacity(0.4)"}">
    <rect width="80" height="80" rx="8" fill="${bg}" stroke="${border}" stroke-width="1.5"/>
    <text x="40" y="36" text-anchor="middle" font-size="28" dominant-baseline="middle">${icon}</text>
    <text x="40" y="62" text-anchor="middle" font-size="8" fill="${textCol}" font-family="Georgia,serif"
      style="letter-spacing:.3px">${label.substring(0,14)}</text>
    ${unlocked?`<circle cx="68" cy="12" r="7" fill="#c9952b"/><text x="68" y="12" text-anchor="middle" dominant-baseline="middle" font-size="9">✓</text>`:""}
  </svg>`;
  return el.firstElementChild;
}

// ── ENDGAME ITEM PLACEHOLDER ─────────────────────────────────────────────────
function endgamePlaceholder(imgId, icon, label){
  const el=document.createElement("div");
  el.innerHTML=`<svg id="${imgId}" width="120" height="100" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg"
    style="border-radius:8px;display:block;filter:drop-shadow(0 2px 8px rgba(201,149,43,.3))">
    <rect width="120" height="100" rx="8" fill="#1e1006" stroke="#c9952b" stroke-width="1.5"/>
    <text x="60" y="42" text-anchor="middle" font-size="36" dominant-baseline="middle">${icon}</text>
    <text x="60" y="76" text-anchor="middle" font-size="9" fill="#c9952b" font-family="Georgia,serif"
      letter-spacing=".5">${label}</text>
    <text x="60" y="88" text-anchor="middle" font-size="7" fill="rgba(240,222,184,.3)"
      font-family="Georgia,serif">[ placeholder ]</text>
  </svg>`;
  return el.firstElementChild;
}

