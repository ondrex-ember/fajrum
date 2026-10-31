// strike.js — ruby strike modal.
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderStrikeModal(ctx){
  const {p}=ctx;
  const sq=p._strikeQueue;
  const L=p.lang;
  let strikeResolved=false;
  let strikeTimer=null;

  const strikeModal=h("div",{class:"modal-bg"},
    h("div",{class:"modal",style:{maxWidth:"340px",textAlign:"center"},onClick:e=>e.stopPropagation()},
      // Hlavička
      h("div",{style:{fontSize:"13px",fontWeight:"700",color:"#3a2a14",marginBottom:"6px"}},
        L==="cs"?"🔴 Zlatý rubín — chlazení skla":"🔴 Gold Ruby — glass cooling"),
      h("div",{style:{fontSize:"11px",color:"#8b5e34",fontStyle:"italic",marginBottom:"14px",lineHeight:"1.6"}},
        L==="cs"
          ?"Polotovar se pomalu znovu zahřívá. Barva rubínu se vyvíjí až při náběhu — nanočástice koloidního zlata rostou na správnou velikost. Tavič čeká. Bude to rubín, nebo popel?"
          :"The blank is slowly reheated. The ruby colour develops only on striking — colloidal gold nanoparticles grow to the right size. The master waits. Will it be ruby, or ash?"),
      // Vizuál — chladnoucí sklo
      h("div",{style:{margin:"0 auto 14px",width:"80px",height:"80px",position:"relative"}},
        (()=>{
          const div=document.createElement("div");
          div.innerHTML=`<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
              <defs>
                <radialGradient id="strikeGrad" cx="50%" cy="50%" r="50%">
                  <animate attributeName="fx" values="45%;55%;45%" dur="2s" repeatCount="indefinite"/>
                  <stop offset="0%" stop-color="#fff0a0" stop-opacity="0.9">
                    <animate attributeName="stop-color" values="#fff0a0;#e08020;#c04010;#800808;#400404" dur="4s" fill="freeze"/>
                    <animate attributeName="stop-opacity" values="0.9;0.8;0.7;0.8;0.9" dur="4s" fill="freeze"/>
                  </stop>
                  <stop offset="60%" stop-color="#c04010" stop-opacity="0.7">
                    <animate attributeName="stop-color" values="#c04010;#800808;#600606;#3a0404;#200202" dur="4s" fill="freeze"/>
                  </stop>
                  <stop offset="100%" stop-color="#200202" stop-opacity="1"/>
                </radialGradient>
              </defs>
              <circle cx="40" cy="40" r="34" fill="url(#strikeGrad)" stroke="#4a0808" stroke-width="2"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,200,100,0.3)" stroke-width="1">
                <animate attributeName="r" values="34;30;34" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0.0;0.6" dur="3s" repeatCount="indefinite"/>
              </circle>
              <text x="40" y="45" text-anchor="middle" font-size="22" fill="rgba(255,240,180,0.6)">
                🔴<animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.5s" repeatCount="indefinite"/>
              </text>
            </svg>`;
          return div.firstChild;
        })()),
      // Šance info
      h("div",{style:{fontSize:"10px",color:"#8b5e34",marginBottom:"14px"}},
        L==="cs"
          ?`Šance na strike: ${Math.round(sq.chance*100)}% · Teplota při tavení: ${sq.tempAtStrike}%`
          :`Strike chance: ${Math.round(sq.chance*100)}% · Temp at melt: ${sq.tempAtStrike}%`),
      // Tlačítko — reveal
      h("button",{
        class:"btn btn-p",
        style:{width:"100%",fontSize:"13px",letterSpacing:"0.5px"},
        onClick:()=>{
          if(strikeResolved)return;
          strikeResolved=true;
          resolveRubyStrike();
        }},
        L==="cs"?"🔴 Odhalit — bylo to rubín?":"🔴 Reveal — did it strike?")));

  app.append(strikeModal);
}
