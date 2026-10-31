// gameover.js — game over chronicle (phase "game_over").
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderGameOverScreen(ctx){
  const {p,L}=ctx;
  FurnaceAudio.stop();
  const fReason = p.failureReason || "abandoned";
  const st = p.failureStats || {
    season: p.season || 1, round: p.round || 1,
    batches: G.totalBatches || 0, sold: G.totalSold || 0,
    contracts: G.totalDone || 0, debtPaid: G.totalDebtPaid || 0,
    maxFama: 0
  };

  const restartGame = restartAfterFall;

  const hdr = h("div", {class: "hdr", style: {background: "linear-gradient(180deg, rgba(42,26,10,.95) 0%, rgba(20,12,5,.98) 100%)", color: "#e8d8c8", borderBottom: "2px solid #8b3a2a"}},
    h("div", null,
      h("h1", {style: {color: "#e27d60", fontSize: "17px", display: "flex", alignItems: "center", gap: "6px"}},
        "📜 "+(L==="cs"?"KRONIKA SKLÁŘSKÉHO RODU — ZÁNIK HUTĚ":"CHRONICLE OF THE GLASSHOUSE — THE FALL")),
      h("small", {style: {color: "#c9952b", fontSize: "11px"}},
        L==="cs"
          ?`Sezóna ${st.season} · Měsíc ${st.round} · Léta Páně ${1679+st.season}`
          :`Season ${st.season} · Month ${st.round} · Year of our Lord ${1679+st.season}`)));

  const body = h("div", {style: {padding: "14px", overflowY: "auto", flex: "1", background: "#f5eee6"}});

  // Příběhové vyprávění
  let reasonTitle = "";
  let reasonStory = "";
  let reasonIcon = "🏚️";

  if(fReason === "abandoned"){
    reasonIcon = "🏚️";
    reasonTitle = L==="cs" ? "Huť osiřela — taviči a tovaryši odešli" : "Foundry deserted — all glassmakers left";
    reasonStory = L==="cs"
      ? "Huť v hlubokých lužických hvozdech ztichla. Bez jídla, piva a spravedlivých mezd sbalili tovaryši své nářadí a odešli za obživou jinam. Nakonec i starý mistr František Kunc s těžkým srdcem uhasil oheň v peci, zavřel verštat a přes horské hřebeny se vydal do saských hutí. Za první zimy roztrhal mráz studenou pec a huť zarostla mechem a kapradím."
      : "The glasshouse in the deep Lusatian forests fell silent. Without food, beer, or fair wages, the journeymen packed their tools and left to seek bread elsewhere. In the end, even master František Kunc with a heavy heart put out the furnace fire, shuttered the benches, and crossed the mountain ridges to Saxony. In the first winter, frost shattered the cold stones and moss reclaimed the site.";
  } else if(fReason === "foreclosure"){
    reasonIcon = "⚖️";
    reasonTitle = L==="cs" ? "Panská exekuce a zabavení huti věřiteli" : "Manorial foreclosure and confiscation";
    reasonStory = L==="cs"
      ? "Panský hejtman hraběcího panství v doprovodu rychtáře a ozbrojených biřiců přitloukl na vrata huti exekuční pečeť. Pro nesplatitelné dluhy a neuhrazené účty u Faktora Weisse byla celá sklárna zabavena. Pánve a zásoby křišťálu šly do dražby v České Lípě a správu huti převzal cizí faktor."
      : "The estate bailiff, accompanied by the reeve and armed guards, nailed the foreclosure seal upon the foundry gates. For insurmountable debt and unpaid credit to Factor Weiss, the entire glasshouse was confiscated. Crucibles and glass stocks were auctioned in Česká Lípa, and management handed to an outside overseer.";
  } else {
    reasonIcon = "🌋";
    reasonTitle = L==="cs" ? "Zkáza pece a úplný rozpad huti" : "Collapse of the furnace and ruin of the workshop";
    reasonStory = L==="cs"
      ? "Vyčerpaná a popraskaná pec nevydržela žár tavení. Šamotová klenba se zřítila a všechny zbývající pánve byly zničeny. Bez peněz na novou stavbu, bez jílu a bez zralých pánví už huť nemohla obnovit oheň. Místo sklářské slávy zbyly jen ohořelé trámy a hromada střepů."
      : "The exhausted, cracked furnace could not withstand the heat of the melt. The shamot vault caved in, destroying all remaining crucibles. With no coin for rebuilding, no clay, and no ready crucibles, the fire could never be relit. Only charred beams and rubble remain.";
  }

  const storyBox = h("div", {style: {background: "rgba(160,48,32,.08)", border: "1px solid rgba(160,48,32,.25)", borderRadius: "6px", padding: "12px 14px", marginBottom: "14px"}});
  storyBox.append(
    h("div", {style: {display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px"}},
      h("span", {style: {fontSize: "24px"}}, reasonIcon),
      h("h2", {style: {fontSize: "15px", color: "#a03020", margin: 0, fontWeight: "700"}}, reasonTitle)),
    h("p", {style: {fontSize: "12px", color: "#4a2a14", lineHeight: "1.6", margin: 0, fontStyle: "italic"}}, reasonStory)
  );
  body.append(storyBox);

  // Statistiky působení
  const statsSec = h("div", {class: "sec", style: {marginBottom: "14px"}});
  statsSec.append(h("div", {class: "sec-title"}, "📊 "+(L==="cs"?"Zápis v huťské knize (Dosažené výsledky)":"Foundry Chronicle (Tenure Record)")));
  const statGrid = h("div", {style: {display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px"}});
  [
    {label: L==="cs"?"Doba vedení hutě":"Tenure length", val: `${st.season} ${L==="cs"?"sezón":"seasons"} · ${st.round} ${L==="cs"?"měsíců":"months"}`},
    {label: L==="cs"?"Uvařeno skloviny":"Glass batches melted", val: `🔥 ${st.batches} ${L==="cs"?"várek":"batches"}`},
    {label: L==="cs"?"Prodané výrobky":"Glassware sold", val: `✨ ${st.sold} ${L==="cs"?"kusů":"pieces"}`},
    {label: L==="cs"?"Splněné zakázky":"Contracts fulfilled", val: `📜 ${st.contracts}`},
    {label: L==="cs"?"Splaceno dluhů":"Debt repaid", val: `💰 ${st.debtPaid}g`},
    {label: L==="cs"?"Nejvyšší věhlas (Fama)":"Highest Fama", val: `⭐ ${st.maxFama}/100`}
  ].forEach(s => {
    statGrid.append(h("div", {style: {padding: "8px", background: "rgba(0,0,0,.04)", borderRadius: "4px"}},
      h("div", {style: {fontSize: "10px", color: "#8b5e34"}}, s.label),
      h("div", {style: {fontSize: "13px", fontWeight: "700", color: "#2a1a0a", marginTop: "2px"}}, s.val)));
  });
  statsSec.append(statGrid);
  body.append(statsSec);

  // Rady mistrů pro příští pokus
  const tipsBox = h("div", {style: {background: "rgba(74,122,58,.08)", border: "1px solid rgba(74,122,58,.25)", borderRadius: "6px", padding: "12px 14px", marginBottom: "16px"}});
  tipsBox.append(h("div", {style: {fontSize: "11px", fontWeight: "700", color: "#4a7a3a", marginBottom: "8px"}},
    "💡 "+(L==="cs"?"POUČENÍ ZE ZÁNIKU — RADY PRO NOVOU HUŤ":"LESSONS FROM THE FALL — MASTER ADVICE")));

  const tipsList = [
    L==="cs"?"🍞 Zásoba jídla a piva: Nenechávej zásoby jídla na nule. Alespoň 1 díl piva udrží morálku a věrnost dělníků."
           :"🍞 Provisions: Keep food in stock. At least 1 beer ration maintains morale and worker loyalty.",
    L==="cs"?"⏳ Odklad splátek u Faktora Weisse: Pokud v zimě chybí groše na mzdy, vyjednej u Weisse 2 kola odkladu splátek."
           :"⏳ Debt moratorium: When winter cash is tight for wages, negotiate a 2-round repayment deferral with Weiss.",
    L==="cs"?"📦 Neprodávej pozdě: Nenechávej hotové sklo ležet na skladě — proměň ho u Weisse nebo na Trhu v groše pro provoz."
           :"📦 Liquidate inventory: Sell finished glass promptly at Market or quick-sell to Weiss for operational cashflow.",
    L==="cs"?"🏺 Pánve potřebují 2 kola: Káninský musí šlapat jíl dříve, než stará pánev doslouží a praskne."
           :"🏺 Crucibles take time: Have Káninský prepare crucibles well before the working one fractures."
  ];
  tipsList.forEach(tip => tipsBox.append(h("div", {style: {fontSize: "11px", color: "#3a2a14", marginBottom: "5px", lineHeight: "1.4"}}, tip)));
  body.append(tipsBox);

  // Tlačítka akcí
  const btnRow = h("div", {style: {display: "flex", gap: "8px", flexWrap: "wrap"}});
  btnRow.append(
    h("button", {class: "btn btn-p", style: {flex: "1", minWidth: "180px", padding: "12px", fontSize: "14px", fontWeight: "700"},
      onClick: restartGame},
      "🔥 "+(L==="cs"?"Založit novou huť (Zkusit znovu)":"Found New Glasshouse (Retry)")),
    h("button", {class: "btn btn-s", style: {padding: "12px", fontSize: "13px"},
      onClick: () => { G.tab = "log"; G.phase = "playing"; render(); }},
      "📖 "+(L==="cs"?"Prohlédnout Kroniku":"View Chronicle"))
  );
  body.append(btnRow);

  app.append(hdr, body);
  return;
}
