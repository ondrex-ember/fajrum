// ── ACHIEVEMENT CHECKER ──────────────────────────────────────────────────────
function checkAchievements(){
  const ach=G.achievements||[];
  const wiki=G.wikiDiscovered||[];
  const add=(id)=>{ if(!ach.includes(id)){ach.push(id);G.log.push(`__EVT__🏆 ${G.lang==="cs"?"Splněno:":"Achieved:"} ${ACHIEVEMENTS.find(a=>a.id===id)?.[G.lang==="cs"?"cs":"en"]||id}`);} };
  const addW=(id)=>{ if(!wiki.includes(id)) wiki.push(id); };

  // Wikis — automaticky podle stavu
  if(G.waldglas?.length>0||G.tW>0||G.totalW>0){ addW("waldglas"); }
  if(G.crystal?.length>0||G.tC>0||G.totalC>0){ addW("crystal"); }
  if(G.modra?.length>0){ addW("modra"); }
  if(G.smaragd?.length>0){ addW("smaragd"); }
  if(G.lattimo?.length>0){ addW("lattimo"); }
  if(G.rubin?.length>0){ addW("rubin"); }
  if(G.jantar?.length>0){ addW("jantar"); }
  if(G.zlut?.length>0){ addW("zlut"); }
  if((G.additives?.arsen||0)>0||G._arsenFined){ addW("arsen"); }
  if((G.res?.potash||0)>0||G.tW>0||G.totalW>0){ addW("potash"); }
  if(G.pReady>0||G.pAging?.length>0){ addW("panev"); }
  if(G.furnace){ addW("pec_primitive"); addW("have_furnace"); }
  if(G.baranOffer!==undefined){ addW("baranovsky"); }
  if(G.endgame?.church){ addW("endgame_church"); }
  if(G.endgame?.noble){ addW("endgame_noble"); }
  if(G.endgame?.trade){ addW("endgame_trade"); }

  // Achievements — triggery na stav
  // Ignis mutat res — první várka
  if((G.tW>0||G.tC>0||G.totalW>0||G.totalC>0)&&!ach.includes("ignis_mutat_res")) add("ignis_mutat_res");

  // Terčíkář — první terčík ve skladu nebo prodán
  const hasTercik=(G.tercik?.length>0||G.tercik_vyplne?.length>0||
    G.log?.some(l=>l.includes("terčík")||l.includes("tercik")||l.includes("window disc")));
  if(hasTercik&&!ach.includes("tercikár")) add("tercikár");

  // Speculum — první zrcadlo
  const hasZrcadlo=(G.zrcadlo?.length>0||G.log?.some(l=>l.includes("Zrcadlo")||l.includes("zrcadlo")));
  if(hasZrcadlo&&!ach.includes("speculum")) add("speculum");

  // Kunckel — první rubín
  if(G.rubin?.length>0&&!ach.includes("kunckel")) add("kunckel");

  // Čeřič arsenem — křišťál poprvé vyčeřen arsenem
  if(G._arsenFined&&!ach.includes("cerenic_arsenem")) add("cerenic_arsenem");

  // Vilkum — rytý pohár (rytina_brus_pokal prodán nebo v zásobě)
  const hasVilkum=(G.rytina_brus_pokal?.length>0||
    G.log?.some(l=>l.includes("rytina_brus_pokal")||l.includes("Rytý poh")));
  if(hasVilkum&&!ach.includes("vilkum")) add("vilkum");

  // Kobaltová série — celkem ≥15 kobaltových kusů
  const kobaltTotal=(G.modra?.length||0)+(G.cise_modra?.length||0)
    +(G.dzban_modra?.length||0)+(G.pohar_modra?.length||0)+(G.dekantr_modra?.length||0)
    +(G.log?.filter(l=>l.includes("modra")||l.includes("kobalt")||l.includes("cobalt")).length||0);
  if(kobaltTotal>=15&&!ach.includes("kobaltova_serie")) add("kobaltova_serie");

  // À la façon de Venise — endgame trade splněn
  if(G.endgame?.trade&&!ach.includes("faccon_de_venise")) add("faccon_de_venise");

  // Relikviář
  if(G.endgame?.church&&!ach.includes("relikvar")) add("relikvar");

  // Lustr
  if(G.endgame?.noble&&!ach.includes("lustr")) add("lustr");

  // Export Drážďany
  if(G.endgame?.trade&&!ach.includes("export_drezdany")) add("export_drezdany");

  G.achievements=ach;
  G.wikiDiscovered=wiki;
}
