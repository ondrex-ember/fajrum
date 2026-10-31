// archiv.js — tab "archiv".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabArchiv(ctx){
  const {L,content,p}=ctx;
  checkAchievements();
  const archSec=h("div",{class:"sec"});
  archSec.append(h("div",{class:"sec-title"},"📖 "+(L==="cs"?"Archiv — wiki a úspěchy":"Archive — wiki & achievements")));

  // ── Subtabs ──
  if(!G._archivSubtab)G._archivSubtab="achievements";
  const archSubtabs=[
    {id:"achievements", cs:"⭐ Úspěchy",   en:"⭐ Achievements"},
    {id:"codex",        cs:"📋 Codex",      en:"📋 Codex"},
    {id:"wiki",         cs:"📜 Pergamen",   en:"📜 Parchment"},
  ];
  const stabRow=h("div",{class:"detail-subtabs",style:{marginBottom:"10px"}});
  archSubtabs.forEach(s=>{
    const btn=h("button",{class:"detail-subtab"+(G._archivSubtab===s.id?" active":""),
      onClick:()=>{G._archivSubtab=s.id;render();}},
      L==="cs"?s.cs:s.en);
    stabRow.append(btn);
  });
  archSec.append(stabRow);

  if(G._archivSubtab==="achievements"){
  // ── Endgame items placeholder sekce ──
  const endgameSec=h("div",{style:{marginBottom:"14px",padding:"10px",borderRadius:"8px",
    border:"1px solid rgba(201,149,43,.2)",background:"rgba(42,26,10,.15)"}});
  endgameSec.append(h("div",{class:"ach-cat-hdr"},L==="cs"?"🏆 Vrcholné zakázky":"🏆 Pinnacle Commissions"));
  const egRow=h("div",{style:{display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center",padding:"6px 0"}});

  // 3 endgame placeholders s placeholder obrázky
  const egItems=[
    {id:"eg_img_church", icon:"⛪", label:L==="cs"?"Relikviář":"Reliquary",
     done:p.endgame?.church,
     desc:L==="cs"?"Klášter sv. Vojtěcha":"St. Vojtěch Monastery"},
    {id:"eg_img_noble",  icon:"🕯️", label:L==="cs"?"Lustr Harrachů":"Harrach Chandelier",
     done:p.endgame?.noble,
     desc:L==="cs"?"Hrabě Harrach":"Count Harrach"},
    {id:"eg_img_trade",  icon:"🌍", label:L==="cs"?"Export Drážďany":"Dresden Export",
     done:p.endgame?.trade,
     desc:L==="cs"?"Hoffmann":"Hoffmann"},
  ];
  egItems.forEach(eg=>{
    const card=h("div",{class:"fj-commission-card","data-commission":eg.id,style:{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",
      opacity:eg.done?1:.5,filter:eg.done?"none":"grayscale(.7)"}});
    // Placeholder SVG — nahradit <img src="obrazky/endgame_church.png"> až bude obrázek
    const svg=endgamePlaceholder(eg.id, eg.icon, eg.label);
    card.append(svg);
    card.append(h("div",{style:{fontSize:"10px",color:eg.done?"#c9952b":"#6a4830",
      fontWeight:"700",textAlign:"center"}},eg.label));
    card.append(h("div",{style:{fontSize:"9px",color:"rgba(90,58,24,.7)",textAlign:"center"}},
      eg.done?"✓ "+eg.desc:eg.desc));
    egRow.append(card);
  });
  endgameSec.append(egRow);
  archSec.append(endgameSec);

  // ── Achievements sekce ──
  archSec.append(h("div",{class:"ach-cat-hdr"},L==="cs"?"⭐ Úspěchy":"⭐ Achievements"));

  const cats=[
    {id:"production", cs:"Výrobní milestony", en:"Production Milestones"},
    {id:"tech",       cs:"Technologické přechody", en:"Technological Transitions"},
    {id:"trade",      cs:"Obchod & sláva", en:"Trade & Renown"},
    {id:"endgame",    cs:"Endgame", en:"Endgame"},
  ];
  cats.forEach(cat=>{
    const catAchs=ACHIEVEMENTS.filter(a=>a.cat===cat.id);
    if(!catAchs.length)return;
    archSec.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",
      letterSpacing:".5px",textTransform:"uppercase",margin:"8px 0 4px",
      paddingBottom:"2px",borderBottom:"1px solid rgba(139,94,52,.15)"}},
      L==="cs"?cat.cs:cat.en));
    const grid=h("div",{class:"ach-grid"});
    catAchs.forEach(a=>{
      const unlocked=(p.achievements||[]).includes(a.id);
      const isFuture=!a.available;
      let cls="ach-card"+(unlocked?" unlocked":isFuture?" future":" locked");
      const card=h("div",{class:cls,"data-achievement":a.id,
        title:unlocked?(L==="cs"?a.desc_cs:a.desc_en)
          :isFuture?(L==="cs"?(a.future_cs||"Přijde"):(a.future_en||"Coming soon"))
          :(L==="cs"?"🔒 "+a.hint_cs:"🔒 "+a.hint_en)});
      // Placeholder SVG obrázek — nahradit za <img id="${a.img_id}" src="..."> až budou obrázky
      card.append(achPlaceholder(a.img_id, a.icon, L==="cs"?a.cs:a.en, unlocked));
      card.append(h("div",{class:"ach-title"},L==="cs"?a.cs:a.en));
      if(unlocked&&a.latin){
        card.append(h("div",{style:{fontSize:"8px",fontStyle:"italic",color:"rgba(201,149,43,.7)",
          textAlign:"center"}},a.latin));
      }
      if(isFuture){
        card.append(h("div",{style:{fontSize:"8px",color:"rgba(90,58,24,.5)",textAlign:"center"}},
          L==="cs"?"v příštích verzích":"next versions"));
      }
      grid.append(card);
    });
    archSec.append(grid);
  });

  } // end achievements subtab

  // ── CODEX subtab ──
  if(G._archivSubtab==="codex"){
    archSec.append(h("div",{style:{fontSize:"11px",color:"#8b6a3a",fontStyle:"italic",
      marginBottom:"10px",lineHeight:"1.5"}},
      L==="cs"
        ?"📋 Codex — přehled všeho co lze v huti vyrobit a prodat. Ceny jsou orientační (závisí na kvalitě a sezóně)."
        :"📋 Codex — overview of everything you can produce and sell. Prices are indicative (depends on quality and season)."));

    const codexSections=[
      CODEX_STATIC.melt,
      {
        title_cs:"💨 Foukané — základní (všichni foukači)", title_en:"💨 Blown — basic (all blowers)",
        items: Object.entries(BLOWN_ITEMS).filter(([,v])=>!v.specOnly).map(([k,v])=>({
          key:k,glass:v.inputs[0],icon:v.icon, cs:v.cs, en:v.en,
          price:`~${v.base}g${v.inputs.length>1?" (waldglas)":""}`,
          recipe_cs:`${v.qty}× ${v.inputs.map(i=>CODEX_GLASS_CS[i]||i).join(" / ")} → foukání`,
          recipe_en:`${v.qty}× ${v.inputs.join(" / ")} → blowing`,
          note_cs:v.bulkNote_cs||"", note_en:v.bulkNote_en||"",
        }))
      },
      {
        title_cs:"💨 Foukané — specializované", title_en:"💨 Blown — specialist",
        items: Object.entries(BLOWN_ITEMS).filter(([,v])=>v.specOnly).map(([k,v])=>{
          return {
            key:k,glass:v.inputs[0],icon:v.icon,
            cs:`${v.cs} (${CODEX_SPEC[v.spec]?.cs||v.spec})`,
            en:`${v.en} (${CODEX_SPEC[v.spec]?.en||v.spec})`,
            price:`~${v.base}g`,
            recipe_cs:`${v.qty}× ${v.inputs.map(i=>CODEX_GLASS_CS[i]||i).join(" / ")} → foukání`,
            recipe_en:`${v.qty}× ${v.inputs.join(" / ")} → blowing`,
            note_cs:v.bulkNote_cs||"", note_en:v.bulkNote_en||"",
          };
        })
      },
      {
        title_cs:"💎 Broušené (hranař / kulič)", title_en:"💎 Ground wares (edge-cutter / sphere-grinder)",
        items: Object.entries(GROUND_ITEMS).map(([k,v])=>{
          return {
            key:k,glass:v.input,icon:v.icon,
            cs:`${v.cs} (${CODEX_SPEC[v.spec]?.cs||v.spec})`,
            en:`${v.en} (${CODEX_SPEC[v.spec]?.en||v.spec})`,
            price:`~${v.base}g`,
            recipe_cs:"1× křišťál → broušení",
            recipe_en:"1× crystal → grinding",
            note_cs:"", note_en:"",
          };
        })
      },
      {
        title_cs:"✂️ Rytiny (rytec, červen+)", title_en:"✂️ Engravings (engraver, June+)",
        items: ENGRAVE_INPUTS.map(k=>{
          const it=engraveSrc(k);
          const nm=it?(L==="cs"?it.cs:it.en):k;
          return {
            key:"rytina_"+k,icon:"✂️",
            cs:`Rytina: ${nm}`,
            en:`Engraving: ${nm}`,
            price:`~${it?Math.round(it.base*engraveBonus(k)):0}g`,
            recipe_cs:`1× ${nm} → rytí diamantem`,
            recipe_en:`1× ${nm} → diamond engraving`,
            note_cs:"Rytina diamantem masová v Čechách až od posl. čtvrtiny 17. stol. Rok 1680 = novinka.",
            note_en:"Diamond engraving mass-market in Bohemia only from last quarter 17th c. 1680 = novelty.",
          };
        })
      },
      {
        title_cs:CODEX_STATIC.special.title_cs, title_en:CODEX_STATIC.special.title_en,
        items:[
          ...CODEX_STATIC.special.items,
          {key:"hodiny",glass:"waldglas",icon:"⏳",cs:SPECIAL_ITEMS.hodiny.cs,en:SPECIAL_ITEMS.hodiny.en,
           price:"~"+SPECIAL_ITEMS.hodiny.base+"g/★",
           recipe_cs:"",recipe_en:"",note_cs:SPECIAL_ITEMS.hodiny.desc_cs,note_en:SPECIAL_ITEMS.hodiny.desc_en},
        ]
      },
    ];

    codexSections.forEach(sec=>{
      const secDiv=h("div",{style:{marginBottom:"14px"}});
      secDiv.append(h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#8b5e34",
        borderBottom:"1px solid rgba(139,94,52,.2)",paddingBottom:"4px",marginBottom:"6px"}},
        L==="cs"?sec.title_cs:sec.title_en));
      sec.items.forEach(it=>{
        const row=h("div",{class:"fj-codex-row","data-product":it.key||"","data-glass":it.glass||"",style:{display:"flex",gap:"6px",alignItems:"flex-start",
          padding:"5px 6px",borderRadius:"4px",marginBottom:"3px",
          background:"rgba(42,26,10,.03)",border:"1px solid rgba(42,26,10,.06)"}});
        row.append(h("span",{style:{fontSize:"14px",flexShrink:"0",lineHeight:"1.3"}},it.icon));
        const txt=h("div",{style:{flex:1,minWidth:0}});
        const topRow=h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:"4px",flexWrap:"wrap"}});
        topRow.append(
          h("span",{style:{fontSize:"11px",fontWeight:"700",color:"#3a2a14"}},L==="cs"?it.cs:it.en),
          h("span",{style:{fontSize:"10px",color:"#c9952b",fontWeight:"700",flexShrink:"0"}},L==="cs"?it.price:(it.price_en||it.price)));
        txt.append(topRow);
        txt.append(h("div",{class:"fj-codex-recipe",style:{fontSize:"9px",color:"#6a4830",marginTop:"1px"}},
          L==="cs"?it.recipe_cs:it.recipe_en));
        const note=L==="cs"?it.note_cs:it.note_en;
        if(note)txt.append(h("div",{style:{fontSize:"9px",color:"#8b6a3a",fontStyle:"italic",marginTop:"1px"}},note));
        row.append(txt);
        secDiv.append(row);
      });
      archSec.append(secDiv);
    });
  } // end codex subtab

  // ── WIKI subtab ──
  if(G._archivSubtab==="wiki"){
  // ── Wiki sekce ──
  const unlockedWiki=Object.entries(WIKI_ENTRIES).filter(([k])=>
    (p.wikiDiscovered||[]).includes(k));
  if(unlockedWiki.length>0){
    archSec.append(h("div",{class:"ach-cat-hdr",style:{marginTop:"16px"}},
      "📜 "+(L==="cs"?"Pergamen — historické záznamy":"Parchment — historical records")));
    archSec.append(h("div",{style:{fontSize:"10px",color:"#8b6a3a",fontStyle:"italic",
      marginBottom:"8px"}},
      L==="cs"?"Záznamy se odemykají při výrobě a obchodu. Zdroje: Kunckel 1679, Valentová 2019, Vepřeková 2015, Sedláčková 2015."
             :"Entries unlock through production and trade. Sources: Kunckel 1679, Valentová 2019, Vepřeková 2015, Sedláčková 2015."));
    const wikiDiv=h("div",{class:"wiki-grid"});
    unlockedWiki.forEach(([k,entry])=>{
      const card=h("div",{class:"wiki-card"});
      const hdr=h("div",{class:"wiki-card-hdr"});
      hdr.append(h("span",{class:"wiki-card-icon"},entry.icon));
      hdr.append(h("span",{class:"wiki-card-title"},L==="cs"?entry.cs:entry.en));
      card.append(hdr);
      card.append(h("div",{class:"wiki-card-body"},L==="cs"?entry.body_cs:entry.body_en));
      if(entry.src_cs||entry.src_en){
        card.append(h("div",{class:"wiki-card-src"},
          "📚 "+(L==="cs"?entry.src_cs:entry.src_en)));
      }
      wikiDiv.append(card);
    });
    archSec.append(wikiDiv);
  }else{
    archSec.append(h("div",{style:{fontSize:"11px",color:"#8b6a3a",fontStyle:"italic",
      marginTop:"12px",padding:"10px",borderRadius:"6px",
      border:"1px solid rgba(42,26,10,.1)",textAlign:"center"}},
      L==="cs"?"📜 Začni vyrábět — záznamy se odemknou samy.":"📜 Start producing — records will unlock on their own."));
  }
  } // end wiki subtab

  content.append(archSec);
}
