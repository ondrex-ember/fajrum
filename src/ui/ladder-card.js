// ladder-card.js — E3: karta „Cesta z dluhů“ (Trh › Faktor) a připomínka v měsíčním souhrnu. Jen nová ekonomika; ukáže se jen v potížích (dluh partě / chybí hotovost na mzdy+pivo).
function ladderCardNode(){
  const v=ladderView();if(!v)return null;
  const cs=G.lang==="cs",t=v.trouble;
  const box=h("div",{class:"fj-ladder-card","data-ladder":"1",style:{margin:"4px 0 8px",padding:"8px 10px",borderRadius:"4px",background:"rgba(160,48,32,.07)",border:"2px solid rgba(160,48,32,.4)"}});
  box.append(h("div",{style:{fontWeight:"700",fontSize:"12px",color:"#7a2a18"}},"🪜 "+(cs?"Cesta z dluhů":"Way out of debt")));
  const why=[];
  if(t.owed>0)why.push(cs?`dluh partě na mzdách ${mny(t.owed)}`:`unpaid crew wages ${mny(t.owed)}`);
  if(t.short)why.push(cs?`v kase ${mny(t.cash)}, minulý měsíc šlo na mzdy a pivo ${mny(t.need)}`:`cash ${mny(t.cash)}, last month's wages and beer ${mny(t.need)}`);
  box.append(h("div",{style:{fontSize:"10px",color:"#5a3a1a",margin:"2px 0 6px",lineHeight:"1.4"}},
    (cs?"Pokladna je v tísni: ":"The purse is under pressure: ")+why.join(" · ")+(cs?". Zkus tyto kroky v tomto pořadí.":". Try these steps in this order.")));
  const step=(n,icon,title,txt,btn)=>{
    const row=h("div",{class:"fj-ladder-step","data-ladder-step":n,style:{padding:"4px 6px",marginBottom:"4px",background:"rgba(255,255,255,.35)",borderRadius:"3px"}});
    row.append(h("div",{style:{fontWeight:"700",fontSize:"11px"}},`${n}. ${icon} ${title}`),h("div",{style:{fontSize:"10px",color:"#5a3a1a",lineHeight:"1.35"}},txt));
    if(btn)row.append(btn);
    box.append(row);
  };
  // 1) odklad splátek
  const m=v.mora;
  if(m.state==="active")step(1,"⏳",cs?"Odklad splátek":"Debt moratorium",cs?`Aktivní, zbývá ${m.left} kol bez automatických srážek.`:`Active, ${m.left} rounds left without auto-deductions.`);
  else if(m.state==="offer"){
    const b=h("button",{class:"btn btn-s fj-ladder-mora",style:{marginTop:"3px",fontSize:"10px"},onClick:()=>{negotiateMoratorium();}},"⏳ "+(cs?`Odložit splátky na 2 kola (${m.cost>0?mny(m.cost):"zdarma"})`:`Defer for 2 rounds (${m.cost>0?mny(m.cost):"free"})`));
    step(1,"⏳",cs?"Odklad splátek":"Debt moratorium",cs?"Reichel na dva měsíce nesráží splátky; uvolníš hotovost na mzdy.":"Reichel skips repayments for two months; frees cash for wages.",b);
  }else step(1,"⏳",cs?"Odklad splátek":"Debt moratorium",cs?"Nemáš u Reichela dluh, není co odkládat.":"No debt to Reichel, nothing to defer.");
  // 2) výkup u Weisse
  const bo=v.buyout;
  if(bo.state==="offer"){
    const b=h("button",{class:"btn btn-s fj-ladder-buyout",style:{marginTop:"3px",fontSize:"10px"},onClick:()=>{quickSellAll();}},"🐴 "+(cs?`Prodat vše Weissovi (${bo.pct} %)`:`Sell all to Weiss (${bo.pct} %)`));
    step(2,"🐴",cs?"Výkup u Weisse":"Weiss buyout",cs?`Na skladě ${bo.count} ks → ${mny(bo.total)} hned. Jednou za sezónu.`:`${bo.count} pcs in stock → ${mny(bo.total)} now. Once per season.`,b);
  }else step(2,"🐴",cs?"Výkup u Weisse":"Weiss buyout",
    bo.state==="used"?(cs?"Tuto sezónu už použit.":"Already used this season."):bo.state==="closed"?(cs?"Za moru se neobchoduje.":"No trade during plague."):(cs?"Nemáš co prodat.":"Nothing to sell."));
  // 3) půjčka u Reichela (jen text; tlačítka jsou níže)
  step(3,"🪙",cs?"Půjčka u Reichela":"Reichel loan",cs?`Poslední možnost — úrok teď ${v.loan.pct} %, dluh roste. Tlačítka jsou níže.`:`Last resort — rate now ${v.loan.pct} %, debt grows. Buttons below.`);
  box.append(h("div",{class:"fj-ladder-fall",style:{fontSize:"9px",color:"#a03020",marginTop:"2px"}},
    "⚠️ "+(cs?`Dluh ${mny(v.foreclose.debt)}. Při dluhu ${mny(v.foreclose.soft)}–${mny(v.foreclose.hard)} (podle hotovosti, zásob a dělníků) přijde exekuce a huť padne.`
            :`Debt ${mny(v.foreclose.debt)}. At ${mny(v.foreclose.soft)}–${mny(v.foreclose.hard)} (by stock and crew) foreclosure ends the hut.`)));
  return box;
}
// Řádek do měsíčního souhrnu
function ladderReminderNode(){
  const t=ladderTrouble();if(!t)return null;
  const cs=G.lang==="cs";
  return h("div",{class:"fj-ladder-reminder",style:{fontSize:"10px",color:"#a03020",marginTop:"4px",fontWeight:"700",background:"rgba(160,48,32,.08)",padding:"3px 5px",borderRadius:"3px"}},
    "🪜 "+(cs?"Cesta z dluhů: odklad splátek → výkup u Weisse → půjčka (Trh › Faktor).":"Way out of debt: moratorium → Weiss buyout → loan (Market › Factor)."));
}
