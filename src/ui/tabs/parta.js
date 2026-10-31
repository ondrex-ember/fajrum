// parta.js — tab "parta".
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabParta(ctx){
  const {p,L,content}=ctx;
  const partaSec=h("div",{class:"sec"});

  // ── Globální souhrn ──
  const totalDebt=liabilities(p).crew;   // aktuální dělníci + pohledávky bývalých
  const avgMood=p.workers.length?Math.round(p.workers.reduce((s,w)=>s+(w.mood||60),0)/p.workers.length):0;
  const moodCol=avgMood>=65?"#4a7a3a":avgMood>=40?"#c89628":"#a03020";
  const sumRow=h("div",{class:"parta-summary"});
  sumRow.append(
    h("div",{class:"parta-sum-pill"},`👥 ${p.workers.length} ${L==="cs"?"v partě":"in crew"}`),
    h("div",{class:"parta-sum-pill",style:{color:moodCol}},`😊 ${L==="cs"?"Nálada":"Mood"}: ${avgMood}%`),
    totalDebt>0
      ?h("div",{class:"parta-sum-pill",style:{color:"#a03020"}},`💸 ${L==="cs"?"Dluhy":"Owed"}: ${totalDebt}g`)
      :h("div",{class:"parta-sum-pill",style:{color:"#4a7a3a"}},`✅ ${L==="cs"?"Vše splaceno":"All paid"}`)
  );
  partaSec.append(sumRow);

  // ── Vazby panel (přehled) ──
  const bondsInPlay=NPC_BONDS.filter(b=>{
    const wa=p.workers.find(w=>w.npcId===b.a);
    const wb=p.workers.find(w=>w.npcId===b.b);
    return wa&&wb;
  });
  if(bondsInPlay.length){
    const bondsBox=h("div",{class:"fj-crew-bonds",style:{marginBottom:"10px",padding:"8px 10px",
      background:"rgba(0,0,0,.04)",borderRadius:"6px",border:"1px solid rgba(42,26,10,.1)"}});
    bondsBox.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"5px"}},
      L==="cs"?"⚗️ Vazby v partě:":"⚗️ Bonds in crew:"));
    bondsInPlay.forEach(b=>{
      const wa=p.workers.find(w=>w.npcId===b.a);
      const wb=p.workers.find(w=>w.npcId===b.b);
      const icon=b.type==="affinity"?"🟢":"🔴";
      const row=h("div",{style:{display:"flex",alignItems:"flex-start",gap:"5px",marginBottom:"4px",
        fontSize:"10px",color:"#5a3a1a",lineHeight:"1.4"},
        title:L==="cs"?b.desc_cs:b.desc_en});
      row.append(
        h("span",{},icon),
        h("span",{style:{fontWeight:"600"}},`${wa.name} ↔ ${wb.name}`),
        h("span",{style:{color:"#8b5e34",marginLeft:"4px"}},L==="cs"?b.desc_cs:b.desc_en)
      );
      bondsBox.append(row);
    });
    // Mentor vztahy
    const mentored=p.workers.filter(w=>w.mentorId);
    mentored.forEach(w=>{
      const mentorW=p.workers.find(x=>x.npcId===w.mentorId);
      if(!mentorW) return;
      const row=h("div",{style:{display:"flex",alignItems:"flex-start",gap:"5px",marginBottom:"4px",
        fontSize:"10px",color:"#5a3a1a",lineHeight:"1.4"},
        title:L==="cs"?`${mentorW.name} mentoruje ${w.name} — XP +15%`:`${mentorW.name} mentors ${w.name} — XP +15%`});
      row.append(
        h("span",{},"📖"),
        h("span",{style:{fontWeight:"600"}},`${mentorW.name} → ${w.name}`),
        h("span",{style:{color:"#8b5e34",marginLeft:"4px"}},
          L==="cs"?"Mentorství aktivní — XP +15%":"Mentorship active — XP +15%")
      );
      bondsBox.append(row);
    });
    partaSec.append(bondsBox);
  }

  // ── Hromadné vyplacení dlužných mezd ──
  const debtedNow=p.workers.filter(w=>(w.unpaidDebt||0)>0);
  const claimsNow=p.exCrewClaims||[];
  if(debtedNow.length||claimsNow.length){
    const totalOwed=debtedNow.reduce((s,w)=>s+(w.unpaidDebt||0),0)+claimsTotal(p);
    const canPayAll=p.grose>=totalOwed;
    const nPeople=debtedNow.length+claimsNow.length;
    const payAllBtn=h("div",{style:{marginBottom:"10px"}});
    payAllBtn.append(h("button",{
      class:"btn",
      style:{width:"100%",opacity:canPayAll?1:0.5,cursor:canPayAll?"pointer":"not-allowed",
        fontSize:"12px",padding:"7px 10px",
        background:canPayAll?"#4a7a3a":"#8b5e34",color:"#f5e8c8"},
      onClick:()=>{
        if(!canPayAll) return;
        payAllOwedWages();
      }},
      L==="cs"?`💸 Vyplatit dlužné mzdy · ${totalOwed}g (${nPeople} ${nPeople===1?"osoba":"osoby/osob"})`
             :`💸 Pay owed wages · ${totalOwed}g (${nPeople} ${nPeople===1?"person":"people"})`
    ));
    if(!canPayAll) payAllBtn.append(h("div",{style:{fontSize:"9px",color:"#a03020",marginTop:"3px",textAlign:"center"}},
      L==="cs"?`Chybí ${totalOwed-p.grose}g do pokladny.`:`Need ${totalOwed-p.grose}g more in treasury.`));
    partaSec.append(payAllBtn);
  }
  // ── Kniha pohledávek bývalých zaměstnanců ──
  if((p.exCrewClaims||[]).length){
    const claimsBox=h("div",{class:"parta-claims",style:{marginBottom:"10px",padding:"6px 8px",border:"1px solid rgba(42,26,10,.25)",borderRadius:"6px",background:"rgba(139,94,52,.08)"}});
    claimsBox.append(h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#8b5e34",marginBottom:"4px"}},
      "📒 "+(L==="cs"?"Pohledávky bývalých zaměstnanců":"Former employees' claims")+" · "+claimsTotal(p)+"g"));
    p.exCrewClaims.forEach(c=>{
      const canPayC=p.grose>=c.amount;
      claimsBox.append(h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"6px",fontSize:"11px",padding:"2px 0"}},
        h("span",{},`${c.name} · ${L==="cs"?"sezóna":"season"} ${c.season}, ${L==="cs"?"kolo":"round"} ${c.round} · `,h("strong",{style:{color:"#a03020"}},c.amount+"g")),
        h("button",{class:"btn btn-s"+(canPayC?" btn-p":""),style:{fontSize:"10px",opacity:canPayC?1:0.5,cursor:canPayC?"pointer":"not-allowed"},
          onClick:()=>{if(canPayC)payExClaim(c.id);}},L==="cs"?"💸 Splatit":"💸 Pay")));
    });
    claimsBox.append(h("div",{style:{fontSize:"9px",color:"#8b5e34",marginTop:"3px",fontStyle:"italic"}},
      L==="cs"?"Dluh odešlého dělníka zůstává v knize — nezmizí a počítá se do závazků i skóre.":"A departed worker's debt stays on the books — it does not vanish and counts toward liabilities and score."));
    partaSec.append(claimsBox);
  }

  // ── Mřížka postav ──
  const grid=h("div",{class:"parta-grid"});

  p.workers.forEach(w=>{
    const mood=Number.isFinite(w.mood)?w.mood:60;
    const moodCls=mood>=65?"mood-ok":mood>=40?"mood-warn":"mood-bad";
    const unpaid=w.unpaidDebt||0;
    const profLabel=getProfLabel(w,L);
    const tier=workerTier(w.lv);
    const tierLabel=`${tier.cs} · ${tier.de} lv.${w.lv}`;
    const card=h("div",{class:`parta-card ${moodCls}`,"data-worker-id":w.id,onClick:()=>{G._partaDetail=w.id;G._partaSubtab="profil";render();}});

    // Portrét
    const portBox=h("div",{class:"parta-portrait"});
    const imgEl=document.createElement("img");
    if(window.FajrumPortraits)FajrumPortraits.configure(imgEl,w);else imgEl.src=`img/workers/${w.portrait||"unknown"}.jpg`;
    imgEl.alt=w.name;
    imgEl.onerror=function(){
      this.style.display="none";
      const svg=NPC_SVG[w.portrait];
      if(svg){const d=document.createElement("div");d.className="parta-portrait-svg";d.innerHTML=svg;portBox.appendChild(d);}
    };
    portBox.appendChild(imgEl);
    if(unpaid>0) portBox.append(h("div",{class:"parta-debt-badge"},`💸${unpaid}g`));
    card.append(portBox);

    // Info pod portrétem
    const info=h("div",{class:"parta-info"});
    info.append(h("div",{class:"parta-name"},w.name));
    info.append(h("div",{class:"parta-prof"},profLabel));
    info.append(h("div",{class:"parta-stars",style:{fontSize:"10px",color:"#c9952b",fontWeight:"600"}},tierLabel));
    // Vazby pipy
    const wBondsCard=NPC_BONDS.filter(b=>(b.a===w.npcId||b.b===w.npcId)&&
      p.workers.some(x=>x.npcId===(b.a===w.npcId?b.b:b.a)));
    if(wBondsCard.length||w.mentorId){
      const bondPips=h("div",{style:{display:"flex",gap:"2px",flexWrap:"wrap",marginTop:"2px"}});
      wBondsCard.forEach(b=>{
        const partnerId=b.a===w.npcId?b.b:b.a;
        const partnerNPC=NPC_ROSTER.find(n=>n.id===partnerId);
        const pip=h("span",{
          style:{fontSize:"9px",cursor:"default",lineHeight:"1"},
          title:`${b.type==="affinity"?"🟢 Afinita":"🔴 Tenze"}: ${partnerNPC?.name||partnerId} — ${L==="cs"?b.desc_cs:b.desc_en}`
        },b.type==="affinity"?"🟢":"🔴");
        bondPips.append(pip);
      });
      if(w.mentorId){
        const mNPC=NPC_ROSTER.find(n=>n.id===w.mentorId);
        bondPips.append(h("span",{style:{fontSize:"9px",cursor:"default"},
          title:`📖 Mentorství: ${mNPC?.name||w.mentorId}`},"📖"));
      }
      info.append(bondPips);
    }

    // Mini bary: mood + fatigue
    const mkBar=(lbl,val,color)=>{
      const row=h("div",{class:"parta-bar-row"});
      const fill=h("div",{class:"parta-bar-fill",style:{width:val+"%",background:color}});
      const bar=h("div",{class:"parta-bar"});
      bar.append(fill);
      row.append(h("span",{class:"parta-bar-lbl"},lbl),bar);
      return row;
    };
    const fat=Math.round(Math.max(0,Math.min(1,Number(w.fat)||0))*100);
    info.append(mkBar("😊",mood,mood>=65?"#4a7a3a":mood>=40?"#c89628":"#a03020"));
    info.append(mkBar("😓",fat,fat<=40?"#4a7a3a":fat<=70?"#c89628":"#a03020"));
    card.append(info);
    grid.append(card);
  });
  partaSec.append(grid);
  content.append(partaSec);

  // ── Detail modal ──
  if(G._partaDetail){
    const w=p.workers.find(x=>x.id===G._partaDetail);
    if(w){
      const stab=G._partaSubtab||"profil";
      const profLabel=getProfLabel(w,L);
      const unpaid=w.unpaidDebt||0;
      const mood=Number.isFinite(w.mood)?w.mood:60;
      const fat=Math.round(Math.max(0,Math.min(1,Number(w.fat)||0))*100);
      const health=w.health??100;
      const loyalty=w.loyalty??70;
      const npc=NPC_ROSTER.find(n=>n.id===w.npcId||n.id===w.id)||{};

      const bg=h("div",{class:"modal-bg fj-crew-profile-bg",onClick:e=>{if(e.target===bg){G._partaDetail=null;render();}}});
      const modal=h("div",{class:"modal fj-crew-profile",style:{maxWidth:"580px"}});

      // Hlavička s portrétem
      const head=h("div",{style:{display:"flex",gap:"12px",marginBottom:"12px",alignItems:"flex-start"}});
      const portBig=h("div",{class:"detail-portrait-big"});
      const bigImg=document.createElement("img");
      if(window.FajrumPortraits)FajrumPortraits.configure(bigImg,w);else bigImg.src=`img/workers/${w.portrait||"unknown"}.jpg`;
      bigImg.alt=w.name;
      bigImg.onerror=function(){
        this.style.display="none";
        const svg=NPC_SVG[w.portrait];
        if(svg){portBig.innerHTML=svg;}
      };
      portBig.appendChild(bigImg);
      const headInfo=h("div",{style:{flex:1}});
      headInfo.append(h("div",{style:{fontWeight:"700",fontSize:"15px",marginBottom:"2px"}},w.name));
      headInfo.append(h("div",{style:{fontSize:"11px",color:"var(--warm)",marginBottom:"4px"}},profLabel));
      const starsDiv=h("div",{style:{fontSize:"13px",letterSpacing:"-1px",color:"#c9952b"}});
      starsDiv.textContent="★".repeat(Math.min(w.lv,5))+"☆".repeat(Math.max(0,5-w.lv));
      headInfo.append(starsDiv);
      if(npc.quote_cs||npc.quote_en){
        headInfo.append(h("div",{style:{fontSize:"10px",fontStyle:"italic",color:"#8b5e34",marginTop:"4px",lineHeight:"1.3"}},
          `"${L==="cs"?(npc.quote_cs||npc.quote_en):(npc.quote_en||npc.quote_cs)}"`));
      }
      head.append(portBig,headInfo);

      // Zavřít — v header řadě vpravo
      const closeBtn=h("button",{class:"btn btn-s",style:{alignSelf:"flex-start",flexShrink:0,fontSize:"15px",padding:"2px 7px",marginLeft:"auto"},
        onClick:()=>{G._partaDetail=null;render();}},"✕");
      head.append(closeBtn);
      modal.append(head);

      // Subtaby
      const stabRow=h("div",{class:"detail-subtabs"});
      [["profil","rozvoj","vazby","kontrakt","dluh","onem"]].flat().forEach(s=>{
        const lbl={profil:L==="cs"?"Profil":"Profile",rozvoj:L==="cs"?"Rozvoj":"Skills",
                   vazby:L==="cs"?"Vazby":"Bonds",kontrakt:L==="cs"?"Kontrakt":"Contract",
                   dluh:L==="cs"?"Dluh":"Debt",onem:L==="cs"?"O něm/ní":"About"}[s];
        const btn=h("button",{class:"detail-subtab"+(stab===s?" active":""),onClick:()=>{G._partaSubtab=s;render();}},lbl);
        stabRow.append(btn);
      });
      modal.append(stabRow);

      // ── SUBTAB: PROFIL ──
      if(stab==="profil"){
        const mkStat=(lbl,val,max,color)=>{
          const row=h("div",{style:{marginBottom:"5px"}});
          const top=h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"10px",marginBottom:"2px"}});
          top.append(h("span",{style:{color:"#8b5e34"}},lbl),h("span",{style:{color,fontWeight:"700"}},val+"/"+max));
          row.append(top);
          const track=h("div",{style:{height:"4px",background:"rgba(0,0,0,.15)",borderRadius:"2px",overflow:"hidden"}});
          const fill=h("div",{style:{height:"100%",width:(val/max*100)+"%",background:color,borderRadius:"2px"}});
          track.append(fill); row.append(track);
          return row;
        };
        modal.append(
          mkStat(L==="cs"?"Nálada":"Mood",mood,100,mood>=65?"#4a7a3a":mood>=40?"#c89628":"#a03020"),
          mkStat(L==="cs"?"Zdraví":"Health",health,100,health>=70?"#4a7a3a":health>=40?"#c89628":"#a03020"),
          mkStat(L==="cs"?"Loajalita":"Loyalty",loyalty,100,loyalty>=70?"#4a7a3a":loyalty>=40?"#c89628":"#a03020"),
          mkStat(L==="cs"?"Únava":"Fatigue",fat,100,fat<=40?"#4a7a3a":fat<=70?"#c89628":"#a03020")
        );
        // Traity
        if(w.traits&&w.traits.length){
          modal.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontWeight:"700",marginTop:"8px",marginBottom:"4px"}},
            L==="cs"?"Vlastnosti:":"Traits:"));
          const traitRow=h("div",{style:{display:"flex",flexWrap:"wrap",gap:"2px"}});
          w.traits.forEach(t=>{
            const td=TRAITS[t];
            if(!td) return;
            const badge=h("span",{class:"trait-badge",title:L==="cs"?td.desc_cs:td.desc_en},
              `${td.icon} ${L==="cs"?td.cs:td.en}`);
            traitRow.append(badge);
          });
          modal.append(traitRow);
        }
        // Mzda
        const wage=2+(w.wageMod||0);
        modal.append(h("div",{style:{marginTop:"10px",padding:"6px 8px",background:"rgba(0,0,0,.04)",borderRadius:"4px",fontSize:"10px",color:"#8b5e34"}},
          `💰 ${L==="cs"?"Mzda":"Wage"}: ${wage}g/${L==="cs"?"kolo":"round"}`));
      }

      // ── SUBTAB: ROZVOJ ──
      else if(stab==="rozvoj"){
        const xpTbl=XP_PER_LEVEL;
        const curLv=w.lv||1;
        const xp=w.xp||0;
        const xpNeeded=xpTbl[curLv-1]||99;
        const pct=Math.min(100,Math.round(xp/xpNeeded*100));
        modal.append(h("div",{style:{fontWeight:"600",fontSize:"12px",color:"var(--warm)",marginBottom:"6px"}},
          `${L==="cs"?"Level":"Level"} ${curLv} — ${pct}% ${L==="cs"?"do dalšího":"to next"}`));
        // XP pips
        const xpTrack=h("div",{class:"xp-track",style:{marginBottom:"10px"}});
        for(let i=0;i<xpNeeded;i++){
          xpTrack.append(h("div",{class:"xp-pip"+(i<xp?" filled":"")}));
        }
        modal.append(xpTrack);
        // Co odemyká
        const lvlList=(PROF_UNLOCKS[w.prof]||PROF_UNLOCKS._default)[L==='cs'?'cs':'en'];
        const nextLvl=lvlList[curLv];
        const box=h("div",{style:{background:"rgba(0,0,0,.04)",borderRadius:"4px",padding:"8px",marginBottom:"8px"}});
        box.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontWeight:"600",marginBottom:"4px"}},
          L==="cs"?"Postup levelů:":"Level progress:"));
        lvlList.forEach((txt,i)=>{
          if(i===0) return;
          const done=i<curLv, current=i===curLv;
          const row=h("div",{style:{display:"flex",gap:"6px",alignItems:"center",marginBottom:"3px",
            opacity:done?0.5:1}});
          row.append(
            h("span",{style:{fontSize:"11px"}},done?"✅":current?"🔥":"⬜"),
            h("span",{style:{fontSize:"10px",color:current?"var(--warm)":"#8b5e34",fontWeight:current?"700":"400"}},
              `Lv${i}: ${txt}`)
          );
          box.append(row);
        });
        modal.append(box);
        if(curLv<10){
          modal.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic"}},
            `${L==="cs"?"Leveluje prací — každých":"Levels up through work — every"} ${xpNeeded} ${L==="cs"?"kol aktivní směny.":"active rounds."}`));
        } else {
          modal.append(h("div",{style:{fontSize:"11px",color:"#c9952b",fontWeight:"700"}},
            L==="cs"?"💎 Velmistr / Glasmeister — výše nelze.":"💎 Velmistr / Glasmeister — no further development."));
        }
      }

      // ── SUBTAB: VAZBY ──
      else if(stab==="vazby"){
        const wBonds=NPC_BONDS.filter(b=>b.a===w.npcId||b.b===w.npcId);
        const partnerIds=wBonds.map(b=>b.a===w.npcId?b.b:b.a);
        const inCrew=partnerIds.filter(id=>p.workers.some(x=>x.npcId===id));
        const notInCrew=partnerIds.filter(id=>!p.workers.some(x=>x.npcId===id));

        if(wBonds.length===0){
          modal.append(h("div",{style:{textAlign:"center",padding:"20px",color:"#8b5e34",fontSize:"11px",fontStyle:"italic"}},
            L==="cs"?"Žádné známé vazby k ostatním.":"No known bonds to others."));
        } else {
          const bondsTitle=h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"6px"}},
            L==="cs"?"Vazby s ostatními dělníky:":"Bonds with other workers:");
          modal.append(bondsTitle);
          wBonds.forEach(b=>{
            const partnerId=b.a===w.npcId?b.b:b.a;
            const partnerNPC=NPC_ROSTER.find(n=>n.id===partnerId);
            const partnerW=p.workers.find(x=>x.npcId===partnerId);
            const isInCrew=!!partnerW;
            const icon=b.type==="affinity"?"🟢":"🔴";
            const typeLabel=b.type==="affinity"
              ?(L==="cs"?"Afinita":"Affinity")
              :(L==="cs"?"Tenze":"Tension");
            const card=h("div",{style:{marginBottom:"8px",padding:"7px 8px",
              background:b.type==="affinity"?"rgba(74,122,58,.08)":"rgba(160,48,32,.07)",
              borderRadius:"5px",border:`1px solid ${b.type==="affinity"?"rgba(74,122,58,.2)":"rgba(160,48,32,.2)"}`}});
            const header=h("div",{style:{display:"flex",alignItems:"center",gap:"5px",marginBottom:"4px"}});
            header.append(
              h("span",{style:{fontSize:"14px"}},icon),
              h("span",{style:{fontWeight:"700",fontSize:"11px",color:"#3a2010"}},
                partnerNPC?.name||partnerId),
              h("span",{style:{fontSize:"9px",color:b.type==="affinity"?"#4a7a3a":"#a03020",
                fontWeight:"600",background:b.type==="affinity"?"rgba(74,122,58,.12)":"rgba(160,48,32,.1)",
                padding:"1px 5px",borderRadius:"3px"}},typeLabel),
              h("span",{style:{fontSize:"9px",color:isInCrew?"#4a7a3a":"#a03020",marginLeft:"auto"}},
                isInCrew?(L==="cs"?"✓ v huti":"✓ in crew"):(L==="cs"?"✗ není v huti":"✗ not hired"))
            );
            card.append(header);
            card.append(h("div",{style:{fontSize:"10px",color:"#5a3a1a",lineHeight:"1.5"}},
              L==="cs"?b.desc_cs:b.desc_en));
            modal.append(card);
          });
        }
        // Mentor status
        const mentorSection=h("div",{style:{marginTop:"10px",padding:"7px 8px",
          background:"rgba(0,0,0,.04)",borderRadius:"5px"}});
        if(w.mentorId){
          const mentorW=p.workers.find(x=>x.npcId===w.mentorId);
          const mentorNPC=NPC_ROSTER.find(n=>n.id===w.mentorId);
          mentorSection.append(
            h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"3px"}},"📖 "+
              (L==="cs"?"Mentorství:":"Mentorship:")),
            h("div",{style:{fontSize:"10px",color:"#5a3a1a"}},
              `${mentorW?.name||mentorNPC?.name||w.mentorId} ${L==="cs"?"— XP +15% za každé kolo":"— XP +15% per round"}`)
          );
        } else {
          const mentorRounds=w.mentorRounds||0;
          mentorSection.append(
            h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"3px"}},"📖 "+
              (L==="cs"?"Mentorství:":"Mentorship:")),
            h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic"}},
              mentorRounds>0
                ?(L==="cs"?`Možný mentor se formuje… (${mentorRounds} kol spolu)`:`Possible mentor forming… (${mentorRounds} rounds together)`)
                :(L==="cs"?"Žádné aktivní mentorství.":"No active mentorship."))
          );
        }
        modal.append(mentorSection);
      }

      // ── SUBTAB: KONTRAKT ──
      else if(stab==="kontrakt"){
        const contract=w.contract;
        // Aktivní kontrakt
        if(contract&&contract.roundsLeft>0){
          const paidBox=h("div",{style:{background:"rgba(74,122,58,.1)",borderRadius:"5px",
            padding:"10px",marginBottom:"10px",border:"1px solid rgba(74,122,58,.25)"}});
          paidBox.append(
            h("div",{style:{fontSize:"11px",fontWeight:"700",color:"#3a6a2a",marginBottom:"4px"}},
              "📜 "+(L==="cs"?"Aktivní kontrakt":"Active contract")),
            h("div",{style:{fontSize:"13px",fontWeight:"700",color:"#2a5a1a",marginBottom:"3px"}},
              `${contract.months} ${L==="cs"?"měsíců":"months"} · ${L==="cs"?"zbývá":"remaining"}: ${contract.roundsLeft} ${L==="cs"?"kol":"rounds"}`),
            h("div",{style:{fontSize:"10px",color:"#5a8a4a"}},
              `${L==="cs"?"Zaplaceno":"Paid"}: ${contract.paid}g · ${L==="cs"?"Loajalita chráněna (min 30%)":"Loyalty protected (min 30%)"}`)
          );
          // Progress bar
          const pct=Math.round((1-contract.roundsLeft/contract.months)*100);
          const prog=h("div",{style:{height:"4px",background:"rgba(0,0,0,.1)",borderRadius:"2px",
            overflow:"hidden",marginTop:"6px"}});
          prog.append(h("div",{style:{height:"100%",width:pct+"%",background:"#4a7a3a",borderRadius:"2px"}}));
          paidBox.append(prog);
          modal.append(paidBox);
        } else {
          modal.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",marginBottom:"8px",
            fontStyle:"italic",padding:"6px 0"}},
            L==="cs"?"Žádný aktivní kontrakt. Nabídni níže.":"No active contract. Offer one below."));
        }
        // Osobní hodnocení
        const assessment=workerAssessment(w,L);
        const assessBox=h("div",{style:{background:"rgba(0,0,0,.04)",borderRadius:"4px",
          padding:"8px",marginBottom:"10px",fontSize:"10px",color:"#5a3a1a",
          lineHeight:"1.6",fontStyle:"italic",borderLeft:"3px solid #c9952b"}});
        assessBox.append(
          h("div",{style:{fontSize:"9px",fontWeight:"700",color:"#8b5e34",marginBottom:"3px",fontStyle:"normal"}},
            L==="cs"?"📋 Hodnocení hutmistra:":"📋 Foundry master's assessment:"),
          h("div",{},`"${assessment}"`)
        );
        // Statistiky
        assessBox.append(h("div",{style:{marginTop:"5px",fontStyle:"normal",color:"#8b5e34",fontSize:"9px"}},
          `${L==="cs"?"Sezóny v huti":"Seasons here"}: ${w.seasonsInFoundry||0} · ${L==="cs"?"Incidenty":"Incidents"}: ${w.incidents||0} · ${L==="cs"?"Nálada":"Mood"}: ${Math.round(w.mood==null?MOOD_NEUTRAL:w.mood)}`));
        modal.append(assessBox);
        // Nabídka kontraktu
        if(!contract||contract.roundsLeft===0){
          modal.append(h("div",{style:{fontSize:"10px",fontWeight:"700",color:"#8b5e34",marginBottom:"6px"}},
            L==="cs"?"📜 Nabídnout kontrakt:":"📜 Offer contract:"));
          CONTRACT_OPTIONS.forEach(opt=>{
            const cost=contractCost(w,opt.months);
            const canAfford=p.grose>=cost;
            const wage=2+(w.wageMod||0);
            const btn=h("div",{class:"contract-btn",
              style:{opacity:canAfford?1:0.45,cursor:canAfford?"pointer":"not-allowed"},
              onClick:()=>{if(canAfford)signContract(w.id,opt.months);}});
            const lbl=L==="cs"?opt.label_cs:opt.label_en;
            btn.append(
              h("span",{style:{fontWeight:"600"}},lbl),
              h("div",{style:{display:"flex",gap:"8px",fontSize:"9px",color:"#8b5e34",marginTop:"1px"}},
                h("span",{},`${cost}g záloha`),
                h("span",{style:{color:canAfford?"#4a7a3a":"#a03020"}},canAfford?"✓ dost grošů":"✗ chybí grošů"),
                h("span",{},`+20 loaj.`)
              )
            );
            modal.append(btn);
          });
        }
      }

      // ── SUBTAB: DLUH ──
      else if(stab==="dluh"){
        const wage=2+(w.wageMod||0);
        if(unpaid===0){
          modal.append(
            h("div",{style:{textAlign:"center",padding:"20px",color:"#4a7a3a",fontSize:"13px",fontWeight:"700"}},"✅ "+
              (L==="cs"?"Všechny mzdy splaceny.":"All wages paid.")),
            h("div",{style:{textAlign:"center",fontSize:"10px",color:"#8b5e34",marginTop:"4px"}},
              `${L==="cs"?"Aktuální mzda":"Current wage"}: ${wage}g/${L==="cs"?"kolo":"round"}`)
          );
        } else {
          const canPayAll=p.grose>=unpaid;
          const canPay5=p.grose>=5;
          const canPay10=p.grose>=10;
          modal.append(
            h("div",{style:{background:"rgba(160,48,32,.07)",borderRadius:"4px",padding:"10px",marginBottom:"10px",
              border:"1px solid rgba(160,48,32,.2)"}},
              h("div",{style:{fontSize:"11px",color:"#8b5e34",marginBottom:"4px"}},L==="cs"?"Dlužné mzdy:":"Wages owed:"),
              h("div",{style:{fontSize:"20px",fontWeight:"700",color:"#a03020"}},unpaid+"g"),
              h("div",{style:{fontSize:"9px",color:"#8b5e34",marginTop:"3px",fontStyle:"italic"}},
                L==="cs"?"Nastřádáno z kol, kdy huť nestačila platit."
                        :"Accumulated from rounds when the foundry couldn't pay.")
            )
          );
          const payRow=h("div",{style:{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"8px"}});
          [
            {amt:5,lbl:"5g"},
            {amt:10,lbl:"10g"},
            {amt:unpaid,lbl:(L==="cs"?"Vše ("+unpaid+"g)":"All ("+unpaid+"g)")}
          ].forEach(({amt,lbl})=>{
            if(amt<=0) return;
            const can=p.grose>=amt;
            payRow.append(h("button",{class:"btn btn-s",
              style:{opacity:can?1:0.4,cursor:can?"pointer":"not-allowed",fontSize:"11px"},
              onClick:()=>{
                if(!can) return;
                payWorkerWage(w.id,amt);
              }},lbl));
          });
          modal.append(payRow);
          modal.append(h("div",{style:{fontSize:"10px",color:"#8b5e34",fontStyle:"italic"}},
            L==="cs"
              ?"Splacení dluhu zvýší loajalitu +8 a náladu +5."
              :"Paying debt raises loyalty +8 and mood +5."));
        }
        // Příští mzda
        modal.append(h("div",{style:{marginTop:"10px",padding:"6px 8px",background:"rgba(0,0,0,.04)",
          borderRadius:"4px",fontSize:"10px",color:"#8b5e34"}},
          `⏭️ ${L==="cs"?"Příští mzda":"Next wage"}: ${wage}g — ${L==="cs"?"kasa":"cash"}: ${p.grose}g`));
      }
      else if(stab==="onem"){
        const bioDiv=h("div",{style:{padding:"4px 2px",lineHeight:"1.7",fontSize:"11px",color:"#4a2e18"}});
        bioDiv.innerHTML=getNpcBio(w,L);
        // Citát nahoře pokud existuje
        if(w.quote_cs||w.quote){
          const quoteDiv=h("div",{style:{
            fontStyle:"italic",color:"#8b5e34",fontSize:"10px",
            borderLeft:"3px solid rgba(201,149,43,.4)",paddingLeft:"8px",
            marginBottom:"10px",lineHeight:"1.5"
          }},`„${L==="cs"?(w.quote_cs||w.quote):(w.quote_en||w.quote_cs||w.quote)}"`);
          modal.append(quoteDiv);
        }
        modal.append(bioDiv);
      }

      bg.append(modal);
      content.append(bg);
    }
  }
}
