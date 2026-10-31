// event.js — event screen (phase "event").
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderEventScreen(ctx){
  const {p,L}=ctx;
  // ── CRACK — speciální dramatický modal ──
  if(p.curEvt==="crack"){
    const cl=G._crackLoss||{reason:"chance",wg:[],cr:[]};
    const reasonText={
      heat:{cs:"Pec byla přetopena. Žár přemohl hlínu.",en:"Furnace overheated. The heat overcame the clay."},
      age: {cs:"Pánev dosloužila. Příliš mnoho várek.",en:"The crucible gave out. Too many batches."},
      chance:{cs:"Nikdo neví proč. Tak to prostě je.",en:"No one knows why. That's how it goes."}
    }[cl.reason]||{cs:"",en:""};
    const lostLines=[];
    if(cl.wg?.length) lostLines.push(`💔 ${cl.wg.length}× ${L==="cs"?"lesní sklo":"forest glass"} ${cl.wg.map(q=>"★".repeat(Math.max(0,q||0))).join(", ")}`);
    if(cl.cr?.length) lostLines.push(`💔 ${cl.cr.length}× ${L==="cs"?"křišťál":"crystal"} ${cl.cr.map(q=>"★".repeat(Math.max(0,q||0))).join(", ")}`);
    if(!cl.wg?.length&&!cl.cr?.length) lostLines.push(L==="cs"?"✅ Sklo zachováno — jen pánev odepsána":"✅ Glass preserved — crucible lost");
    lostLines.push(L==="cs"?"🔥 Ostatní sloty pokračují":"🔥 Other slots continue");

    // CSS shake animace
    const styleId="crack-shake-style";
    if(!document.getElementById(styleId)){
      const st=document.createElement("style");
      st.id=styleId;
      st.textContent="@keyframes crackShake{0%,100%{transform:translate(0,0) rotate(0deg)}10%{transform:translate(-6px,2px) rotate(-1.5deg)}20%{transform:translate(6px,-2px) rotate(1deg)}30%{transform:translate(-4px,4px) rotate(-0.8deg)}40%{transform:translate(4px,-1px) rotate(0.5deg)}50%{transform:translate(-3px,2px) rotate(-0.3deg)}60%{transform:translate(3px,-2px) rotate(0.2deg)}80%{transform:translate(-1px,1px) rotate(-0.1deg)}}";
      document.head.appendChild(st);
    }

    // Zvuk — zavolat crack audio pokud dostupný
    try{if(FurnaceAudio&&FurnaceAudio._crack){
      FurnaceAudio._crack('sharp',FurnaceAudio.ctx?.currentTime||0,1.0);
      setTimeout(()=>FurnaceAudio._crack('deep',(FurnaceAudio.ctx?.currentTime||0)+0.08,0.8),80);
    }}catch(e){}

    const crackModal=document.createElement("div");
    crackModal.style.cssText="position:fixed;inset:0;background:rgba(40,4,4,.92);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;";
    const crackBox=document.createElement("div");
    crackBox.className="fj-event-dialog";
    crackBox.style.cssText="background:linear-gradient(145deg,#2a0808,#1a0404);border:2px solid #8b1a1a;border-radius:8px;padding:24px 20px;max-width:340px;width:100%;text-align:center;animation:crackShake 0.6s ease-out;box-shadow:0 0 40px rgba(160,0,0,.5);";

    const icon=document.createElement("div");
    icon.className="fj-event-placeholder";
    icon.style.cssText="font-size:56px;margin-bottom:8px;filter:drop-shadow(0 0 12px #ff4444);";
    icon.textContent="💔";

    const title=document.createElement("div");
    title.style.cssText="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ff6666;margin-bottom:6px;letter-spacing:0.5px;";
    title.textContent=L==="cs"?"Pánev praskla!":"Crucible cracked!";

    const subtitle=document.createElement("div");
    subtitle.style.cssText="font-size:11px;color:#cc4444;font-style:italic;margin-bottom:14px;line-height:1.4;";
    subtitle.textContent=L==="cs"?reasonText.cs:reasonText.en;

    const lossBox=document.createElement("div");
    lossBox.style.cssText="background:rgba(0,0,0,.35);border:1px solid #6b1a1a;border-radius:6px;padding:10px 12px;margin-bottom:14px;text-align:left;";
    lostLines.forEach(line=>{
      const d=document.createElement("div");
      d.style.cssText="font-size:11px;color:#ff8888;margin-bottom:3px;font-family:Georgia,serif;";
      d.textContent=line;
      lossBox.appendChild(d);
    });

    const slotsAff=cl.slotsAffected||1;
    const tempDrop=slotsAff*8;
    const statsRow=document.createElement("div");
    statsRow.style.cssText="display:flex;gap:8px;justify-content:center;margin-bottom:16px;flex-wrap:wrap;";
    [
      {icon:"🌡️",label:(L==="cs"?"-"+tempDrop+"% teplota":"-"+tempDrop+"% temp")},
      {icon:"🏺",label:(L==="cs"?"slot "+(cl.slotIndexes||[1]).join(",")+" prázdný":"slot "+(cl.slotIndexes||[1]).join(",")+" empty")},
      {icon:"🔥",label:(L==="cs"?"ostatní sloty jedou dál":"other slots continue")},
      {icon:"😞",label:(L==="cs"?"-"+(slotsAff*8)+" nálada":"-"+(slotsAff*8)+" morale")}
    ].forEach(s=>{
      const chip=document.createElement("div");
      chip.style.cssText="background:rgba(160,0,0,.2);border:1px solid #6b1a1a;border-radius:4px;padding:3px 8px;font-size:10px;color:#ff8888;";
      chip.textContent=s.icon+" "+s.label;
      statsRow.appendChild(chip);
    });

    const chron=document.createElement("div");
    chron.style.cssText="font-size:10px;color:#884444;font-style:italic;margin-bottom:16px;line-height:1.5;border-top:1px solid #4a1a1a;padding-top:10px;";
    const chronTexts={
      cs:[`„Praskot byl slýšet až na druhém konci hvozdu.“`,`„Hanns se zastavil, podíval se na střepy a neřekl nic.“`,`„Rok 1680. Pánev nevydřela. Sklovina se rozlila po výhni.“`],
      en:["\"The crack echoed through the forest.\"","\"Hanns stopped, looked at the shards, and said nothing.\"","\"Year 1680. The crucible gave out. Glass spilled across the hearth.\""]
    };
    chron.textContent=(L==="cs"?chronTexts.cs:chronTexts.en)[Math.floor(Math.random()*3)];

    const btn=document.createElement("button");
    btn.className="btn btn-danger";
    btn.style.cssText="width:100%;padding:10px;font-size:13px;font-family:Georgia,serif;";
    btn.textContent=L==="cs"?"Smolař — rozumím":"Tough luck — understood";
    btn.onclick=dismissCrackLoss;

    crackBox.append(icon,title,subtitle,lossBox,statsRow,chron,btn);
    crackModal.appendChild(crackBox);
    app.appendChild(crackModal);
    return;
  }

  const evtData={
    crack:{i:"💔",cs:"Prasklá pánev!",en:"Cracked crucible!",
      dcs:"Pánev nevydržela žár. Várka je ztracena.",den:"The crucible cracked. Batch lost."},
    good:{i:"✨",cs:"Vydařená várka!",en:"Excellent batch!",
      dcs:"Dělníci jsou spokojeni. Morálka roste.",den:"Workers are pleased. Morale increases."},
    merchant:{i:"🗣️",cs:"Kupec Weiss přijel!",en:"Merchant Weiss arrived!",
      dcs:"Ceny jsou dnes lepší. Prodej výhodně.",den:"Prices are better today. Sell wisely."},
    winter:{i:"❄️",cs:"Krutá zima!",en:"Harsh winter!",
      dcs:"Mráz pohltil zásoby dřeva a nahlodal morálku.",den:"Frost ate into wood supplies and morale."},
    shamotCrack:{i:"🧱",cs:"Šamot praská!",en:"Shamot cracking!",
      dcs:"Vyzdívka pece je kriticky poškozena. Pec chladne.",den:"Furnace lining critically damaged. Furnace cooling."},
    forestDepleted:{i:"🌲",cs:"Hvozd vyčerpán!",en:"Forest depleted!",
      dcs:`Les je prázdný. Dřevo musíš kupovat od Weisse (${WOOD_EMERGENCY_PRICE}g/ks) nebo sázet nové stromy. Les se obnoví za 2–3 sezóny.`,
      den:`The forest is bare. Buy wood from Weiss (${WOOD_EMERGENCY_PRICE}g/unit) or plant new trees. Recovery takes 2–3 seasons.`},
    svjiri:{i:"💨",cs:"Hlásí se foukači a brusiči — Sv. Jiří",en:"Blowers and grinders apply — St. George",
      dcs:"Kampaň na Sv. Jiří přilákala foukače a brusiče z okolí. Další sezóny mohou být jiné. Na Trhu je možné je najmout co nejdříve.",
      den:"St. George's campaign drew blowers and grinders from the region. Next seasons can be different. Hire them at the Market as soon as possible."}
  };
  const ev=evtData[p.curEvt]||{i:"📜",cs:p.curEvt,en:p.curEvt,dcs:"",den:""};
  const evModal=h("div",{class:"modal-bg",onClick:dismissEvt},
    h("div",{class:"modal fj-event-dialog",style:{maxWidth:"360px",textAlign:"center"},onClick:e=>e.stopPropagation()},
      h("div",{class:"fj-event-placeholder",style:{fontSize:"48px",marginBottom:"10px"}},ev.i),
      h("h2",{style:{fontSize:"18px",margin:"0 0 8px"}},L==="cs"?ev.cs:ev.en),
      h("p",{style:{fontSize:"13px",color:"#8b5e34",marginBottom:"20px",lineHeight:"1.5"}},L==="cs"?ev.dcs:ev.den),
      h("button",{class:"btn btn-p",onClick:dismissEvt},L==="cs"?"Rozumím":"OK")));
  app.append(evModal);
  return;
}
