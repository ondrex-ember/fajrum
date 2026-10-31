// settings.js — tab "settings".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabSettings(ctx){
  const {L,content,p}=ctx;
  // ── ULOŽENÍ HRY ──
  const saveSec=h("div",{class:"sec"});
  saveSec.append(h("div",{class:"sec-title"},"💾 "+(L==="cs"?"Uložení hry":"Save / Load")));

  // Uložit do JSON
  const saveRow=h("div",{class:"settings-row"});
  saveRow.append(
    h("span",{class:"settings-label"},L==="cs"?"Stáhnout uložení (.json)":"Download save (.json)"),
    h("button",{class:"btn btn-s btn-p",
      onClick:()=>{
        const data=JSON.stringify(G,null,2);
        const blob=new Blob([data],{type:"application/json"});
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url;
        a.download=`sklarska-hut-s${G.season}-r${G.round}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }},L==="cs"?"💾 Uložit":"💾 Save"));
  saveSec.append(saveRow);

  // Uložit do localStorage
  const lsRow=h("div",{class:"settings-row"});
  const lsSaved=localStorage.getItem("sh_v9");
  let lsDate=null;
  try{if(lsSaved){const stamp=JSON.parse(lsSaved)._savedAt;if(Number.isFinite(stamp))lsDate=new Date(stamp).toLocaleString("cs-CZ");}}catch(e){}
  lsRow.append(
    h("span",{class:"settings-label"},
      L==="cs"?"Rychlé uložení (prohlížeč)":"Quick save (browser)",
      lsDate?h("div",{style:{fontSize:"9px",color:"#8b5e34"}},`${L==="cs"?"Uloženo":"Saved"}: ${lsDate}`):""),
    h("button",{class:"btn btn-s",
      onClick:()=>{
        const save={...G,_savedAt:Date.now()};
        localStorage.setItem("sh_v9",JSON.stringify(save));
        G.log.push(`__ECO__💾 ${L==="cs"?"Hra uložena do prohlížeče":"Game saved to browser"}`);
        render();
      }},L==="cs"?"📌 Quick save":"📌 Quick save"));
  saveSec.append(lsRow);

  // Načíst z localStorage
  if(lsSaved){
    const lsLoadRow=h("div",{class:"settings-row"});
    lsLoadRow.append(
      h("span",{class:"settings-label"},L==="cs"?"Načíst quick save":"Load quick save"),
      h("button",{class:"btn btn-s",
        onClick:()=>{
          try{
            const saved=JSON.parse(localStorage.getItem("sh_v9"));
            saveguardLoad(saved);
          }catch(e){alert(L==="cs"?"Chyba načtení":"Load error");}
        }},L==="cs"?"📂 Načíst":"📂 Load"));
    saveSec.append(lsLoadRow);
  }

  // Poslední funkční pozice před importem — samostatná pojistka, ne ruční quick-save slot.
  const preImportBackup=localStorage.getItem(SAVEGUARD_PREIMPORT);
  if(preImportBackup){
    let backupValid=false;
    try{validateGameSave(JSON.parse(preImportBackup));backupValid=true;}catch(e){}
    if(backupValid){
      const backupRow=h("div",{class:"settings-row"});
      backupRow.append(
        h("span",{class:"settings-label"},L==="cs"?"Záloha před posledním importem":"Backup before last import"),
        h("button",{class:"btn btn-s",onClick:()=>{
          if(!confirm(L==="cs"?"Obnovit uloženou pozici před posledním importem?":"Restore the game from before the last import?"))return;
          try{saveguardLoad(JSON.parse(localStorage.getItem(SAVEGUARD_PREIMPORT)),false);}
          catch(e){alert(L==="cs"?"Záloha je nečitelná":"Backup cannot be read");}
        }},L==="cs"?"↶ Obnovit zálohu":"↶ Restore backup")
      );
      saveSec.append(backupRow);
    }
  }

  // Načíst ze souboru
  const fileRow=h("div",{class:"settings-row"});
  const fileInput=h("input",{type:"file",accept:".json",style:{display:"none"},
    onChange:e=>{
      const file=e.target.files[0];if(!file)return;
      e.target.value=""; // selecting the same save again must trigger onChange
      if(file.size>25*1024*1024){alert(L==="cs"?"Soubor je příliš velký":"File is too large");return;}
      const reader=new FileReader();
      reader.onload=ev=>{
        let saved;
        try{saved=JSON.parse(ev.target.result);}
        catch(err){alert(L==="cs"?"Chybný JSON soubor":"Invalid JSON file");return;}
        saveguardLoad(saved,true);
      };
      reader.onerror=()=>alert(L==="cs"?"Chyba čtení souboru":"File read error");
      reader.readAsText(file);
    }});
  fileRow.append(
    h("span",{class:"settings-label"},L==="cs"?"Načíst ze souboru (.json)":"Load from file (.json)"),
    fileInput,
    h("button",{class:"btn btn-s",onClick:()=>fileInput.click()},L==="cs"?"📂 Otevřít":"📂 Open"));
  saveSec.append(fileRow);

  // Reset
  const resetRow=h("div",{class:"settings-row"});
  resetRow.append(
    h("span",{class:"settings-label",style:{color:"#a03020"}},L==="cs"?"Nová hra (smaže vše!)":"New game (deletes everything!)"),
    h("button",{class:"btn btn-s btn-danger",
      onClick:()=>{
        if(confirm(L==="cs"?"Opravdu začít novou hru? Vše bude smazáno.":"Start new game? All progress will be lost.")){
          resetToIntro();
        }
      }},L==="cs"?"🗑️ Reset":"🗑️ Reset"));
  saveSec.append(resetRow);
  content.append(saveSec);

  // Zvuk
  const aSec=h("div",{class:"sec"});
  aSec.append(h("div",{class:"sec-title"},"🔊 "+(L==="cs"?"Zvuk":"Audio")));

  // Ztlumit vše
  const muteRow=h("div",{class:"settings-row"});
  muteRow.append(
    h("span",{class:"settings-label"},L==="cs"?"🔇 Ztlumit vše":"🔇 Mute all"),
    h("button",{
      class:"btn btn-s"+(p.audio.muted?" btn-active":""),
      onClick:()=>{G.audio.muted=!G.audio.muted;render();}},
      p.audio.muted?(L==="cs"?"Ztlumeno":"Muted"):(L==="cs"?"Aktivní":"Active")));
  aSec.append(muteRow);

  // Celkový volume
  const masterRow=h("div",{class:"settings-row",style:{opacity:p.audio.muted?"0.4":"1"}});
  const masterVal=h("span",{class:"settings-val"},Math.round((p.audio.masterVolume??0.8)*100)+"%");
  masterRow.append(
    h("span",{class:"settings-label"},L==="cs"?"📢 Celkový":"📢 Master"),
    h("input",{type:"range",min:"0",max:"100",step:"5",value:""+(Math.round((p.audio.masterVolume??0.8)*100)),
      style:{flex:1,height:"4px",accentColor:"var(--warm)",pointerEvents:p.audio.muted?"none":"auto"},
      onInput:e=>{G.audio.masterVolume=parseInt(e.target.value)/100;masterVal.textContent=e.target.value+"%";GlassHutMusic.setMasterVolume(G.audio.masterVolume);FurnaceAudio.setVolume(G.audio.volume*G.audio.masterVolume);autoSave();}}),
    masterVal);
  aSec.append(masterRow);

  // Zvuk pece
  const sfxBlock=h("div",{style:{opacity:p.audio.muted?"0.4":"1"}});
  const toggleRow=h("div",{class:"settings-row"});
  toggleRow.append(
    h("span",{class:"settings-label"},L==="cs"?"🔥 Zvuk pece":"🔥 Furnace sound"),
    h("button",{
      class:"btn btn-s"+(p.audio.enabled?" btn-active":""),
      onClick:()=>{if(p.audio.muted)return;G.audio.enabled=!G.audio.enabled;FurnaceAudio.setEnabled(G.audio.enabled);render();}},
      p.audio.enabled?(L==="cs"?"Zap":"On"):(L==="cs"?"Vyp":"Off")));
  sfxBlock.append(toggleRow);
  const volRow=h("div",{class:"settings-row"});
  const volVal=h("span",{class:"settings-val"},Math.round(p.audio.volume*100)+"%");
  volRow.append(
    h("span",{class:"settings-label"},L==="cs"?"Hlasitost":"Volume"),
    h("input",{type:"range",min:"0",max:"100",step:"5",value:""+(p.audio.volume*100),
      style:{flex:1,height:"4px",accentColor:"var(--warm)",opacity:p.audio.enabled?"1":"0.5",pointerEvents:(p.audio.muted||!p.audio.enabled)?"none":"auto"},
      onInput:e=>{G.audio.volume=parseInt(e.target.value)/100;volVal.textContent=e.target.value+"%";FurnaceAudio.setVolume(G.audio.volume*(G.audio.masterVolume??0.8));autoSave();}}),
    volVal);
  sfxBlock.append(volRow);
  aSec.append(sfxBlock);

  // Hudba
  const musicBlock=h("div",{style:{opacity:p.audio.muted?"0.4":"1"}});
  const musicToggleRow=h("div",{class:"settings-row"});
  musicToggleRow.append(
    h("span",{class:"settings-label"},L==="cs"?"Hudba (Barokní generátor)":"Music (Baroque generator)"),
    h("button",{
      class:"btn btn-s"+(p.audio.musicEnabled?" btn-p":""),
      style:{pointerEvents:p.audio.muted?"none":"auto"},
      onClick:()=>{
        G.audio.musicEnabled=!G.audio.musicEnabled;
        render();
      }
    },p.audio.musicEnabled?(L==="cs"?"Zap":"On"):(L==="cs"?"Vyp":"Off")));
  musicBlock.append(musicToggleRow);

  // Zvukové efekty (SFX)
  const sfxRow=h("div",{class:"settings-row"});
  sfxRow.append(
    h("span",{class:"settings-label"},L==="cs"?"Zvukové efekty (sklo, mince, pec)":"Sound Effects (glass, coins, furnace)"),
    h("button",{
      class:"btn btn-s",
      onClick:()=>{
        FajrumSfx.play("glass", 0.7);
        setTimeout(()=>FajrumSfx.play("coin", 0.6), 250);
        setTimeout(()=>FajrumSfx.play("bell", 0.5), 500);
      }
    },L==="cs"?"🔊 Vyzkoušet zvuk":"🔊 Test Sound"));
  musicBlock.append(sfxRow);

  // Klávesové zkratky
  const hotkeyRow=h("div",{class:"settings-row",style:{flexDirection:"column",alignItems:"flex-start",gap:"4px"}});
  hotkeyRow.append(
    h("span",{class:"settings-label",style:{fontWeight:"700",color:"var(--warm)"}},L==="cs"?"⌨️ Klávesové zkratky":"⌨️ Keyboard Shortcuts"),
    h("div",{style:{fontSize:"11px",color:"var(--ink)",lineHeight:"1.6"}},
      h("div",{},h("span",{class:"hotkey-badge"},"Mezerník / Enter"), " — ", L==="cs"?"Posunout měsíc / kolo":"Advance month / round"),
      h("div",{},h("span",{class:"hotkey-badge"},"1-9"), " — ", L==="cs"?"Rychlé přepínání záložek":"Quick tab switching"),
      h("div",{},h("span",{class:"hotkey-badge"},"M"), " — ", L==="cs"?"Ztlumit / zapnout zvuk (Mute)":"Mute / unmute audio"),
      h("div",{},h("span",{class:"hotkey-badge"},"Esc"), " — ", L==="cs"?"Zavřít dialog / okno":"Close dialog / modal")
    )
  );
  musicBlock.append(hotkeyRow);
  if(p.audio.musicEnabled){
    const mvolRow=h("div",{class:"settings-row"});
    const mvolVal=h("span",{class:"settings-val"},Math.round((p.audio.musicVolume??0.5)*100)+"%");
    mvolRow.append(
      h("span",{class:"settings-label"},L==="cs"?"Hlasitost":"Volume"),
      h("input",{type:"range",min:"0",max:"100",step:"5",value:""+(Math.round((p.audio.musicVolume??0.5)*100)),
        style:{flex:1,height:"4px",accentColor:"var(--warm)",pointerEvents:p.audio.muted?"none":"auto"},
        onInput:e=>{G.audio.musicVolume=parseInt(e.target.value)/100;mvolVal.textContent=e.target.value+"%";GlassHutMusic.setMusicVolume(G.audio.musicVolume);autoSave();}}),
      mvolVal);
    musicBlock.append(mvolRow);
    musicBlock.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",marginTop:"3px"}},
      GlassHutMusic.isMobile?(L==="cs"?"📱 Lite mód (mobil)":"📱 Lite mode (mobile)"):(L==="cs"?"🖥️ Plný mód":"🖥️ Full mode")));
  }
  aSec.append(musicBlock);

  // Stav audio enginu
  const audioPhase=p.round>=PREP&&p.fActive?'campaign':p.round>=PREP?'prep':'off';
  const phaseLabel={off:L==="cs"?"Pec studená":"Furnace cold",prep:L==="cs"?"Příprava":"Prep",campaign:L==="cs"?"Kampaň — aktivní":"Campaign — active"};
  aSec.append(h("div",{style:{fontSize:"11px",color:"#8b5e34",marginTop:"6px"}},
    `${L==="cs"?"Fáze zvuku":"Audio phase"}: ${phaseLabel[audioPhase]}`));
  content.append(aSec);

  // Jazyk
  const lSec=h("div",{class:"sec"});
  lSec.append(h("div",{class:"sec-title"},L==="cs"?"Jazyk":"Language"));
  const lRow=h("div",{style:{display:"flex",gap:"6px",marginTop:"4px"}});
  ["cs","en"].forEach(lang=>{
    lRow.append(h("button",{
      class:"btn btn-s"+(p.lang===lang?" btn-active":""),
      onClick:()=>{G.lang=lang;render();}},
      lang==="cs"?"🇨🇿 Čeština":"🇬🇧 English"));
  });
  lSec.append(lRow);
  content.append(lSec);

  // Soukromí — souhlas s měřením (GA4 / Consent Mode v2)
  content.append(h("div",{class:"sec"},
    h("div",{class:"sec-title"},"🍪 "+(L==="cs"?"Soukromí":"Privacy")),
    h("div",{class:"settings-row"},
      h("span",{class:"settings-label"},
        L==="cs"?"Měření návštěvnosti (Google Analytics)":"Analytics (Google Analytics)",
        h("div",{style:{fontSize:"9px",color:"#8b5e34"}},
          `${L==="cs"?"Stav":"Status"}: ${typeof shConsentLabel==="function"?shConsentLabel(L):"—"}`)),
      h("button",{class:"btn btn-s",
        onClick:()=>{if(typeof shConsentInfo==="function")shConsentInfo();}},
        L==="cs"?"⚙️ Změnit":"⚙️ Change"))));

  // Info — O hře
  const iSec=h("div",{class:"sec"});
  iSec.append(
    h("div",{class:"sec-title"},L==="cs"?"O hře":"About"),
    h("div",{style:{fontSize:"11px",color:"#8b5e34",lineHeight:"1.8",marginBottom:"8px"}},
      h("strong",{style:{color:"#3a2a14",fontSize:"13px"}},"Sklářská Huť · v8.0"),h("br",null),
      h("em",null,ABOUT_INFO.place),h("br",null),
      ABOUT_INFO.intro[L==="cs"?"cs":"en"]),
    // Novinky v8.0
    h("div",{style:{fontSize:"10px",color:"#3a2a14",fontWeight:"700",marginBottom:"4px",marginTop:"8px"}},
      L==="cs"?"✨ Novinky v8.0:":"✨ What's new in v8.0:"),
    h("div",{style:{fontSize:"10px",color:"#8b5e34",lineHeight:"1.9",marginBottom:"10px",
      paddingBottom:"8px",borderBottom:"1px solid rgba(42,26,10,.1)"}},
      "📜 "+(L==="cs"?"Huť: popisný přehled zakázek — co je potřeba udělat, termíny, stav zásob":"Foundry: descriptive contract list — what to do, deadlines, stock status"),h("br",null),
      "🪵 "+(L==="cs"?"Hinty k dřevu, palivu a potaši s aktuálními čísly · varování před přebytkem potaše":"Wood, fuel and potash hints with live numbers · warning on potash surplus"),h("br",null),
      "🌱 "+(L==="cs"?"Výsadba funguje i v kampani":"Reforestation works in campaign too"),h("br",null),
      "😴 "+(L==="cs"?"Odpočívající dělník bere poloviční mzdu, upozornění při přiřazení":"Resting workers get half wage, warning on assignment"),h("br",null),
      "🔧 "+(L==="cs"?"Opravy statistik, termínů přenesených zakázek a nabídky zakázek":"Fixes: stats, carried-over contract deadlines, contract offers")),
    // Novinky v7.9
    h("div",{style:{fontSize:"10px",color:"#3a2a14",fontWeight:"700",marginBottom:"4px"}},
      L==="cs"?"Dříve — v7.9:":"Earlier — v7.9:"),
    h("div",{style:{fontSize:"10px",color:"#8b5e34",lineHeight:"1.9",marginBottom:"10px",
      paddingBottom:"8px",borderBottom:"1px solid rgba(42,26,10,.1)"}},
      "🟤 "+(L==="cs"?"Jantarové sklo — první barevná skloviny pro lesní huť, dostupné od začátku":"Amber glass — first coloured glass for forest foundry, available from start"),h("br",null),
      "🎨 "+(L==="cs"?"Živá barva skloviny v pánvi — mění se dle aktivního receptu":"Live melt colour in crucible — changes by active recipe"),h("br",null),
      "📜 "+(L==="cs"?"Kontrakty — modal nových zakázek po startu sezóny":"Contracts — new contract modal after season start"),h("br",null),
      "🛒 "+(L==="cs"?"4 kupci s historickými jmény (Weiss, Hoffmann, Opat, Šlechtic)":"4 named buyers (Weiss, Hoffmann, Abbot, Noble)"),h("br",null),
      "📊 "+(L==="cs"?"Zakázky v summary · progress bar · odpočítávání termínu":"Contracts in summary · progress bar · deadline countdown"),h("br",null),
      "🔧 "+(L==="cs"?"Oprava vyplácení kontraktů + waldglas jako vstup receptury":"Contract payout fix + waldglas as recipe input")),
    // Herní systémy v7.x
    h("div",{style:{fontSize:"10px",color:"#3a2a14",fontWeight:"700",marginBottom:"4px"}},
      ABOUT_INFO.systemsTitle[L==="cs"?"cs":"en"]),
    h("div",{style:{fontSize:"10px",color:"#8b5e34",lineHeight:"1.9"}},
      ...ABOUT_INFO.systems.flatMap((s,i)=>[...(i?[h("br",null)]:[]),s.icon+" "+s[L==="cs"?"cs":"en"]])),
    // Autorství
    h("div",{style:{marginTop:"10px",paddingTop:"8px",borderTop:"1px solid rgba(42,26,10,.1)",
      fontSize:"11px",color:"#8b5e34",lineHeight:"1.8"}},
      h("div",{style:{fontWeight:"700",color:"#3a2a14",marginBottom:"4px"}},
        ABOUT_INFO.creatorTitle[L==="cs"?"cs":"en"]),
      ...ABOUT_INFO.creator.map(c=>h("div",null,c[L==="cs"?"cs":"en"])),
      h("a",{href:"mailto:"+ABOUT_INFO.email,style:{color:"#c9952b"}},
        ABOUT_INFO.email)),
    // Poděkování
    h("div",{style:{marginTop:"8px",fontSize:"10px",color:"#8b5e34",lineHeight:"1.6",
      fontStyle:"italic",borderTop:"1px solid rgba(42,26,10,.1)",paddingTop:"8px"}},
      ABOUT_INFO.thanks[L==="cs"?"cs":"en"]),
    // Footer
    h("div",{style:{marginTop:"12px",paddingTop:"10px",borderTop:"1px solid rgba(42,26,10,.15)",
      fontSize:"10px",color:"#8b5e34",lineHeight:"2",textAlign:"center"}},
      h("div",null,
        ...ABOUT_INFO.links.flatMap((l,i)=>[h("span",null,(i?" · ":"")+l.icon+" "),h("a",{href:l.url,style:{color:"#c9952b"}},l.label)])),
      h("div",{style:{marginTop:"4px",fontSize:"10px",color:"#aaa"}},
        `${ABOUT_INFO.made} · v8.0 · ${new Date().getFullYear()}`),
      h("div",{style:{marginTop:"8px"}},
        h("a",{href:"/about.html",target:"_blank",style:{fontSize:"11px",color:"#c9952b",textDecoration:"none",letterSpacing:"0.5px"}},
          "📖 "+ABOUT_INFO.aboutLink[L==="cs"?"cs":"en"]))));
  content.append(iSec);
}
