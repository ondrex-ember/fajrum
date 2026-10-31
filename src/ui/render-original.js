function renderOriginal(){
  // Průběžné ukládání: stav přežije reload i uprostřed měsíce / před prvním kolem (úvodní obrazovku nepřepisuje)
  if(G&&G.phase&&G.phase!=="intro")autoSave();
  const p=G, L=p.lang;
  const ms=L==="cs"?MONTHS_CS:MONTHS_EN, hs=L==="cs"?HINTS_CS:HINTS_EN;
  const tsk=L==="cs"?TASK_CS:TASK_EN;
  const isP=isPrepMonth(p.round,p.seasonTier||0), isC=!isP, z=zone(p.fTemp);
  const fEff=Math.round(calcFurnaceEff(p.furnace,p.panevQuality)*100);
  const ft=FURNACE_TYPES[p.furnace.type];
  // Zachovat scroll pozici content oblasti
  const _prevContent=app.querySelector(".content");
  const _scrollTop=_prevContent?_prevContent.scrollTop:0;
  app.innerHTML="";

  // Desktop detekce — musí být před render sekcemi
  const isDesktop=window.innerWidth>=960&&window.innerHeight>=500;
  if(isDesktop){app.classList.add("desktop");}else{app.classList.remove("desktop");}

  // Intro = scrollovatelný, hra = fixed height
  // Intro: #app nesmí být scroll kontejner, scrolluje dokument (novější Blink jinak neřetězí scroll na dokument).
  // overflow-x:clip ořezává vodorovně bez vzniku scroll kontejneru.
  if(p.phase==="intro"){
    app.style.maxHeight="none";
    app.style.overflowX="clip";
    app.style.overflowY="visible";
  } else {
    app.style.maxHeight="100vh";
    app.style.overflowX="hidden";
    app.style.overflowY="hidden";
  }

  const ctx={p,L,ms,hs,isP,isC,fEff,ft,_scrollTop,isDesktop};

  // ── INTRO ──
  if(p.phase==="intro"){
    renderIntroScreen(ctx);
    return;
  }

  // ── EVENT ──
  if(p.phase==="event"&&p.curEvt){
    renderEventScreen(ctx);
    return;
  }

  // ── KRONIKA SKLÁŘSKÉHO RODU — ZÁNIK HUTĚ (GAME OVER) ──
  if(p.phase==="game_over"){
    renderGameOverScreen(ctx);
    return;
  }

  // ── MEZISEZÓNA ──
  if(p.phase==="interseason"||p.phase==="interseasonPhase"){
    renderInterseasonScreen(ctx);
    return;
  }

  // ── SUMMARY ──
  if(p.phase==="summary"&&p.summary){
    renderSummaryScreen(ctx);
    return;
  }

  // ════════════════════════════════════════════════════════════
  // LOAJALITNÍ MODAL — dělníci s nezaplacenými dluhy
  // ════════════════════════════════════════════════════════════
  if(p._loyaltyModalPending&&p.phase==="playing"){
    const debtedWorkers=p.workers.filter(w=>(w.unpaidDebt||0)>0);
    if(debtedWorkers.length>0){
      renderLoyaltyModal(ctx,debtedWorkers);
      return;
    }else{
      dropStaleLoyaltyModal();
    }
  }

  // ════════════════════════════════════════════════════════════
  // KONTRAKT MODAL — nové zakázky po startu sezóny
  // ════════════════════════════════════════════════════════════
  if(p._contractModalPending&&p.phase==="playing"){
    renderContractModal(ctx);
    return;
  }

  // ════════════════════════════════════════════════════════════
  // RETENTION MODAL — dělník uvažuje o odchodu
  // ════════════════════════════════════════════════════════════
  if(p._retentionPending&&p._retentionPending.length>0&&p.phase==="playing"){
    const wId=p._retentionPending[0];
    const rw=p.workers.find(x=>x.id===wId);
    if(rw){
      renderRetentionModal(ctx,wId,rw);
      return;
    }else{
      dropStaleRetention(wId);
    }
  }

  // Frame (build order = visual order): header, round bar, resources, season panel, tab bar + content container
  renderHeader(ctx);
  renderFailureBanner(ctx);
  renderRoundBar(ctx);
  Object.assign(ctx,renderResourceBar(ctx));
  Object.assign(ctx,renderSeasonPanel(ctx));
  Object.assign(ctx,renderTabsAndContent(ctx));

  // ── TAB: PŘEHLED ──
  if(p.tab==="overview"){
    renderTabOverview(ctx);
  }else if(p.tab==="production"){
    renderTabProduction(ctx);
  }else if(p.tab==="storage"){
    renderTabStorage(ctx);

  // ── TAB: PEC ──
  }else if(p.tab==="furnace"){
    renderTabFurnace(ctx);

  // ── TAB: TRH ──
  }else if(p.tab==="market"){
    renderTabMarket(ctx);
  }else if(p.tab==="log"){
    renderTabLog(ctx);

  // ── TAB: ÚČTY ──
  }else if(p.tab==="accounts"){
    renderTabAccounts(ctx);

  // ── TAB: PARTA ──
  }else if(p.tab==="parta"){
    renderTabParta(ctx);

  // ── TAB: DENÍK HRÁČE (Tomislav Břeťánek) ──
  }else if(p.tab==="hrac"){
    renderTabHrac(ctx);

  // ── TAB: ARCHIV ──
  }else if(p.tab==="archiv"){
    renderTabArchiv(ctx);
  // ── TAB: NASTAVENÍ ──
  }else if(p.tab==="settings"){
    renderTabSettings(ctx);
  }

  // Assemble content + action bar (desktop: tabs left, content right)
  renderLayout(ctx);

  // Welcome modal — jednorázový po prvním vstupu
  if(p.phase==="playing" && p.firstVisit){
    renderWelcomeModal(ctx);
  }

  // ── STRIKE MODAL — Rubínové sklo chlazení ──
  if(p._strikeQueue&&p.phase==="playing"){
    renderStrikeModal(ctx);
  }

  // Help modal
  if(p.help){
    renderHelpModal(ctx);
  }
	const _newContent = app.querySelector(".content");
	if (_newContent && _scrollTop) _newContent.scrollTop = _scrollTop;
}
