// ── HERNÍ LOGIKA ────────────────────────────────────────────
function processRound(){
  Fx.sound('bell', 0.45);
  const p=G, r=p.res, round=p.round, isP=isPrepMonth(round, p.seasonTier||0), isC=isCampaignMonth(round, p.seasonTier||0);
  const L=p.lang, ms=L==="cs"?MONTHS_CS:MONTHS_EN;
  let mor=p.morale, forest=p.forest, grose=p.grose, debt=p.debt;
  let pR=p.pReady, pA=[...p.pAging], pU=p.pUses, pQ=p.panevQuality;
  let fT=p.fTemp, fA=p.fActive;
  // Per-slot pánve — inicializujeme/kopírujeme
  // furnSlotPanev = [{uses:N, quality:Q} | null, ...] délka = furnSlots
  let slotPanev = p.furnSlotPanev ? [...p.furnSlotPanev.map(s=>s?{...s}:null)] : null;
  let furnace={...p.furnace};
  const wg=[...p.waldglas], cr=[...p.crystal];
  let tW=p.tW, tC=p.tC, tQS=p.tQS, tQN=p.tQN, done=p.done, mB=false;
  const evts=[]; // deklarujeme brzy — crack handler ho potřebuje před sekci "Náhodné události"
  const con=[...p.contracts];
  const log=[...p.log];
  const newClaims=[]; // pohledávky odcházejících dělníků s nevyplacenou mzdou (→ G.exCrewClaims)
  const roundLogStart=log.length; // log je kopie celé historie — řádky tohoto kola jsou až od tohoto indexu


  // Výpočet aktuální účinnosti pece
  const fEff=calcFurnaceEff(furnace, pQ);
  const ft=FURNACE_TYPES[furnace.type];

  // 1. Dělníci
  let reforestCount=0; // kolik dělníků sází stromy
  const incidentIds=new Set(); // dělníci, kteří měli v tomto kole nehodu (karta dělníka: "Incidenty")
  for(const w of p.workers){
    const eff=(1+w.lv*.3-w.fat*.2)*moodEffMult(w);
    // Vazba Komár × Káninský (tenze): Komár ignoruje pokyny — 10 % šance na chybu, kolo bez výsledku
    if(w.npcId==="npc_komar"&&w.task!=="idle"&&bondActive(p,"npc_komar","npc_kanin")&&Math.random()<0.10){
      log.push(`__EVT__⚠️ ${w.name}: ${L==="cs"?"ignoroval Káninského pokyny — chyba v práci, kolo bez výsledku":"ignored Káninský's instructions — work error, nothing done this round"}`);
      continue;
    }
    if(w.task==="logging"){
      if(forest<=0){
        log.push(`__EVT__🌲 ${w.name}: ${L==="cs"?"les vyčerpán — přesuňte na výsadbu":"forest depleted — reassign to reforest"}!`);
        continue;
      }
      const silakMult=w.traits?.includes("silak")?1.5:1;
      const winterMult=WINTER_LOG_MULT[round]||1;
      const cut=Math.min(clamp(Math.round(2*eff*silakMult*winterMult),1,6),forest);
      forest-=cut; r.wood+=cut*4;
      const winterNote=winterMult>1?` ❄️+${Math.round((winterMult-1)*100)}%`:"";
      log.push(`__PROD__🌲 ${w.name}: -${cut} ${L==="cs"?"parcel":"parcels"} → +${cut*4} 🌳${winterNote} (${forest}/${p.forestMax||INIT_FOREST})`);
      if(Math.random()<0.35){
        r.pitch=(r.pitch||0)+1;
        log.push(`__PROD__🌲 ${w.name}: +1🌲 ${L==="cs"?"smůla a pryskyřice z hvozdu":"pitch & resin gathered"}`);
      }
    }else if(w.task==="reforest"){
      // Výsadba funguje v přípravě i v kampani; efekt se projeví v mezisezóně (max 4 kola výsadby za sezónu)
      reforestCount++;
      const rfPer=p.difficulty==="easy"?3:2;
      log.push(`__PROD__🌱 ${w.name}: ${L==="cs"?`sází stromy (+${rfPer} parcely v mezisezóně)`:`planting trees (+${rfPer} parcels next interseason)`}`);
    }else if(w.task==="quarry"){
      const sa=clamp(Math.round(2*eff),1,4), li=clamp(Math.round(eff),1,2), st=clamp(Math.round(1.5*eff),1,3);
      r.sand+=sa; r.limestone+=li; r.stone=(r.stone||0)+st;
      log.push(`__PROD__⛏️ ${w.name}: +${sa} 🏖️, +${li} 🟩, +${st} 🪨`);
    }else if(w.task==="potash"){
      // Potaš: přímo spotřebuje dřevo z alokace, ne přes koeficient
      const woodForPotash=Math.floor(r.wood*(p.wa.potash/100));
      if(woodForPotash>=WOOD_PER_POTASH){
        const m=Math.floor(woodForPotash/WOOD_PER_POTASH);
        r.wood-=m*WOOD_PER_POTASH; r.potash+=m;
        log.push(`__PROD__🌿 ${w.name}: -${m*WOOD_PER_POTASH} 🪵 → +${m} ${L==="cs"?"potaš":"potash"}`);
      }else log.push(`__EVT__🌿 ${w.name}: ${L==="cs"?"málo dřeva pro potaš":"not enough wood for potash"}`);
    }else if(w.task==="panev"&&isP){
      if(r.clay>=2&&r.food>=1){
        r.clay-=2; r.food-=1;
        if(r.shamot>0)r.shamot--;
        const panvarLv=w.prof==="panvar"?w.lv:1;
        const kovakBonus=w.traits?.includes("kovak")?1:0;
        const pedantBonus=w.traits?.includes("pedant")?1:0;
        const winterBonus=WINTER_PANEV_BONUS[round]||0;
        const pNewQ=clamp(panvarLv+kovakBonus+pedantBonus+winterBonus+Math.floor(Math.random()*2),1,5);
        pA.push({cr:round,rdy:round+PANEV_AGE,q:pNewQ});
        const winterNote=winterBonus>0?` ❄️ (${L==="cs"?"mráz čistí jíl":"frost clears clay"} +1)`:"";
        log.push(`__PROD__🏺 ${w.name}: ${L==="cs"?"pánev kvality":"crucible quality"} ${stars(pNewQ)}${winterNote}`);
      }else log.push(`__EVT__🏺 ${w.name}: ${L==="cs"?"chybí jíl nebo jídlo":"need clay or food"}`);
    }else if(w.task==="formar"){
      // Formař vyrábí dřevěné formy — okamžitě hotové, aktivní od března (kolo 4)
      if(round<4){
        log.push(`__PROD__🌳 ${w.name}: ${L==="cs"?"čeká na jaro — začíná v březnu":"waiting for spring — starts in March"}`);
      }else{
        const FORMA_WOOD=2, FORMA_WATER=2, FORMA_FOOD=1; // 2 voda — 1 na výrobu + 1 na uložení ve vodě
        if(r.wood>=FORMA_WOOD&&r.water>=FORMA_WATER&&r.food>=FORMA_FOOD){
          r.wood-=FORMA_WOOD; r.water-=FORMA_WATER; r.food-=FORMA_FOOD;
          const formarLv=w.prof==="formar"?w.lv:1;
          const kovakBonus=w.traits?.includes("kovak")?1:0;
          const formQ=clamp(formarLv+kovakBonus+Math.floor(Math.random()*2),1,5);
          // Forma je hotová okamžitě — čerstvější = lepší, uchovávána ve vodě
          r.formy=(r.formy||0)+1;
          log.push(`__PROD__🌳 ${w.name}: ${L==="cs"?"forma hotová (čerstvá, uložena ve vodě)":"mould ready (fresh, stored in water)"} ${stars(formQ)}`);
        }else{
          const missing=[];
          if(r.wood<FORMA_WOOD)missing.push("2🪵");
          if(r.water<FORMA_WATER)missing.push("2💧");
          if(r.food<1)missing.push("1🍞");
          log.push(`__EVT__🌳 ${w.name}: ${L==="cs"?"chybí":"missing"} ${missing.join(", ")}`);
        }
      }
    }else if(w.task==="water"){
      const wa=clamp(Math.round(3*eff),2,5);r.water+=wa;
      log.push(`__PROD__💧 ${w.name}: +${wa}`);
    }else if(w.task==="clay"){
      const cl=clamp(Math.round(2*eff),1,3);r.clay+=cl;
      log.push(`__PROD__🧱 ${w.name}: +${cl}`);
      if((r.stone||0)>=1 && r.clay>=3 && Math.random()<0.45){
        r.stone-=1; r.clay-=2; r.firebrick=(r.firebrick||0)+1;
        log.push(`__PROD__🧱 ${w.name}: +1🧱 ${L==="cs"?"vypálen žáruvzdorný šamotový kvádr":"firebrick molded & fired"}`);
      }
    }else if(w.task==="field"){
      // Políčko — zpracováno v samostatné smyčce níže, jen přeskočit
    }else if(w.task==="werkstat"){
      // ── OPILEC + BEER ACCIDENT — jen při dvojitém/trojitém přídělu ──
      const isOpilec=w.traits?.includes("opilec");
      const beerAcc=BEER[p.beer]?.acc||0;
      const accTriggered=isOpilec&&p.beer>=2&&beerAcc>0&&Math.random()<beerAcc;
      if(accTriggered){
        // Najdi první dostupný výstupní kus workera a odstraň ho (rozbil ho)
        const accKeys=["waldglas","crystal","jantar","zlut","modra","smaragd","lattimo","rubin","rubin_raw"];
        incidentIds.add(w.id);
        const accInv=k=>k==="waldglas"?wg:k==="crystal"?cr:(G[k]||[]);   // waldglas/crystal = lokální kopie kola (jinak by se rozbitý kus vrátil)
        const accKey=accKeys.find(k=>accInv(k).length>0);
        if(accKey){
          if(accKey==="waldglas"||accKey==="crystal") accInv(accKey).splice(0,1);
          else {const accStock=[...(G[accKey]||[])]; accStock.splice(0,1); G[accKey]=accStock;}
          log.push(`__EVT__🍺 ${w.name}: ${L==="cs"?"rozjařený — rozbil kus "+logItemName(accKey,L)+"!":"too merry — smashed a "+logItemName(accKey,L)+"!"}`);
        } else {
          // Žádný kus k rozbití — jen log
          log.push(`__EVT__🍺 ${w.name}: ${L==="cs"?"rozjařený — naštěstí nic nerozbil.":"too merry — luckily nothing to break."}`);
        }
      }
      // ── VERŠTAT — automatická výroba dle profese ──────────────────
      const wProf=w.prof;
      const wLv=w.lv||1;
      // pedant: +1 quality bonus na výstupu, 5% šance zachránit jinak zničený kus
      const isPedant=w.traits?.includes("pedant");
      const qLvBonus=Math.round(wLv*0.6)+(isPedant?1:0);

      if(wProf==="tavic"||wProf==="foukat_lesni"){
        // Tavič/Foukač lesní — fouká waldglas nádoby
        const blownKeys=Object.keys(BLOWN_ITEMS).filter(k=>BLOWN_ITEMS[k].spec==="foukat_lesni"&&!BLOWN_ITEMS[k].specOnly&&!BLOWN_ITEMS[k].manualOnly);
        const waldglasAvail=(r.waldglas||[]).length||G.waldglas?.length;
        const waldStock=wg;   // kolo pracuje s lokální kopií skladu; zápis zpět dělá konec kola (jinak by se spotřebované sklo vrátilo)
        if(waldStock.length>=1&&(r.formy||0)>=1){
          const key=blownKeys[Math.floor(Math.random()*blownKeys.length)]||"cise";
          const it=BLOWN_ITEMS[key];
          const used=waldStock.splice(0,1);
          r.formy=Math.max(0,(r.formy||0)-1);
          const outQ=clamp(used[0]+qLvBonus+(Math.random()>.6?1:0),1,5);
          if(!G[key])G[key]=[];
          G[key].push(outQ);
          log.push(`__PROD__${it?.icon||"🫙"} ${w.name}: 1× ${L==="cs"?it?.cs||key:it?.en||key} ${stars(outQ)}`);
        }else if(waldStock.length>=1&&(r.formy||0)<1){
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"verštat — chybí forma":"workshop — no mould"}`);
        }else{
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"verštat — chybí waldglas":"workshop — no waldglas"}`);
        }
      }else if(wProf==="foukat_kristal"){
        const crystalStock=cr;   // viz waldStock — lokální kopie skladu kola
        const blownKeys=Object.keys(BLOWN_ITEMS).filter(k=>BLOWN_ITEMS[k].spec==="foukat_kristal"&&BLOWN_ITEMS[k].specOnly&&!BLOWN_ITEMS[k].manualOnly);
        if(crystalStock.length>=1){
          const key=blownKeys[Math.floor(Math.random()*blownKeys.length)]||"pohar";
          const it=BLOWN_ITEMS[key];
          const used=crystalStock.splice(0,1);
          const outQ=clamp(used[0]+qLvBonus+(Math.random()>.5?1:0),1,5);
          if(!G[key])G[key]=[];
          G[key].push(outQ);
          log.push(`__PROD__${it?.icon||"🥂"} ${w.name}: 1× ${L==="cs"?it?.cs||key:it?.en||key} ${stars(outQ)}`);
        }else{
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"verštat — chybí křišťál":"workshop — no crystal"}`);
        }
      }else if(wProf==="foukat_dekor"){
        const waldStock=wg;   // kolo pracuje s lokální kopií skladu; zápis zpět dělá konec kola (jinak by se spotřebované sklo vrátilo)
        const blownKeys=Object.keys(BLOWN_ITEMS).filter(k=>BLOWN_ITEMS[k].spec==="foukat_dekor"&&BLOWN_ITEMS[k].specOnly&&!BLOWN_ITEMS[k].manualOnly);
        if(waldStock.length>=1){
          const key=blownKeys[Math.floor(Math.random()*blownKeys.length)]||"koule";
          const it=BLOWN_ITEMS[key];
          const used=waldStock.splice(0,1);
          const outQ=clamp(used[0]+qLvBonus+(Math.random()>.5?1:0),1,5);
          if(!G[key])G[key]=[];
          G[key].push(outQ);
          log.push(`__PROD__${it?.icon||"🔮"} ${w.name}: 1× ${L==="cs"?it?.cs||key:it?.en||key} ${stars(outQ)}`);
        }else{
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"verštat — chybí waldglas":"workshop — no waldglas"}`);
        }
      }else if(wProf==="foukat_formy"){
        // Foukač forem — vyrábí formy nebo foukané do forem
        const waldStock=wg;   // kolo pracuje s lokální kopií skladu; zápis zpět dělá konec kola (jinak by se spotřebované sklo vrátilo)
        if(waldStock.length>=1){
          const key="dzban_forma";
          const it=BLOWN_ITEMS[key];
          const used=waldStock.splice(0,1);
          const outQ=clamp(used[0]+qLvBonus+(Math.random()>.5?1:0),1,5);
          if(!G[key])G[key]=[];
          G[key].push(outQ);
          log.push(`__PROD__${it?.icon||"🫙"} ${w.name}: 1× ${L==="cs"?it?.cs||key:it?.en||key} ${stars(outQ)}`);
        }else{
          // Bez waldglas — vyrábí formy
          r.formy=(r.formy||0)+1;
          log.push(`__PROD__🪚 ${w.name}: +1 ${L==="cs"?"forma (verštat)":"mould (workshop)"}`);
        }
      }else if(wProf==="brusic_hrana"||wProf==="brusic_kulic"){
        // Brusič — spotřebuje crystal + water, vyrobí broušený kus
        const crystalStock=cr;   // viz waldStock — lokální kopie skladu kola
        const groundKeys=Object.keys(GROUND_ITEMS).filter(k=>GROUND_ITEMS[k].spec===wProf&&!GROUND_ITEMS[k].manualOnly);
        if(crystalStock.length>=1&&r.water>=1){
          const key=groundKeys[Math.floor(Math.random()*groundKeys.length)];
          const it=GROUND_ITEMS[key];
          const qty=it.qty||1;
          if(crystalStock.length>=qty){
            const used=crystalStock.splice(0,qty);
            r.water=Math.max(0,r.water-1);
            r.food=Math.max(0,r.food-1); // brusič spotřebuje jídlo
            const avgQ=Math.round(used.reduce((s,q)=>s+q,0)/qty);
            const outQ=clamp(avgQ+qLvBonus+(Math.random()>.5?1:0),1,5);
            if(!G[key])G[key]=[];
            G[key].push(outQ);
            log.push(`__PROD__${it.icon} ${w.name}: 1× ${L==="cs"?it.cs:it.en} ${stars(outQ)} (-1💧-1🍞)`);
          }else{
            log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"brusírna — málo křišťálu":"workshop — not enough crystal"}`);
          }
        }else if(r.water<1){
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"brusírna — chybí voda":"workshop — no water"}`);
        }else{
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"brusírna — chybí křišťál":"workshop — no crystal"}`);
        }
      }else if(wProf==="rytec"){
        // Rytec — rytí na existující broušený kus, spotřebuje food
        const engraveAvail=ENGRAVE_INPUTS.find(k=>(G[k]||[]).length>0);
        if(engraveAvail&&r.food>=1){
          const inv=[...(G[engraveAvail]||[])];
          inv.sort((a,b)=>b-a);
          const q=inv[0];
          G[engraveAvail]=inv.slice(1);
          const outKey="rytina_"+engraveAvail;
          if(!G[outKey])G[outKey]=[];
          const outQ=clamp(q+qLvBonus,1,5);
          G[outKey].push(outQ);
          r.food=Math.max(0,r.food-1);
          log.push(`__PROD__✂️ ${w.name}: ${L==="cs"?"rytina na":"engraved"} ${engraveAvail} ${stars(outQ)} (-1🍞)`);
        }else if(!engraveAvail){
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"rytírna — nic k rytí":"workshop — nothing to engrave"}`);
        }else{
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"rytírna — chybí jídlo":"workshop — no food"}`);
        }
      }else{
        log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"verštat":"workshop"}`);
      }
    }else if(w.task==="cereni"){
      // ── ČEŘENÍ — burel (MnO₂), antimon nebo arsen (+2) odbarví a zlepší příští dávku křišťálu (+1★, zásoba max 2) ──────
      if(!isC){
        log.push(`__PROD__⛔ ${w.name}: ${L==="cs"?"čeření jen v kampani":"fining only during campaign"}`);
      }else{
        const hasBurel=(G.additives?.burel||0)>=1;
        const hasAntimon=(G.additives?.antimon||0)>=1; // antimon = alternativní čiřidlo
        const hasArsen=(G.additives?.arsen||0)>=1;      // arsen = nejúčinnější: +2 dávky najednou
        const cerStock=G._cerenBonus||0;
        // arsen má přednost jen při prázdné zásobě (využije celou sílu), jinak je záložní
        const finingAgent=(cerStock===0&&hasArsen)?"arsen":hasBurel?"burel":hasAntimon?"antimon":hasArsen?"arsen":null;
        if(cerStock>=2){
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"čeření — zásoba bonusu je plná (2★)":"fining — bonus store is full (2★)"}`);
        }else if(finingAgent){
          G.additives[finingAgent]=Math.max(0,(G.additives[finingAgent]||0)-1);
          const kuncBonus=w.npcId==="npc_kunc"?1:0; // Kunc čeří lépe
          const agentGain=finingAgent==="arsen"?2:1;
          if(finingAgent==="arsen"){G._arsenFined=true;w.fat=Math.min(1,(w.fat||0)+0.15);} // jedovatý: tavič je víc unavený
          G._cerenBonus=Math.min(2,cerStock+agentGain+kuncBonus);
          const agentLabel=L==="cs"?(finingAgent==="burel"?"burel (MnO₂)":finingAgent==="arsen"?"arsen (As₂O₃) ☠️":"antimon"):(finingAgent==="burel"?"burel (MnO₂)":finingAgent==="arsen"?"arsenic (As₂O₃) ☠️":"antimony");
          log.push(`__PROD__🫧 ${w.name}: ${L==="cs"?"čeření — příští křišťál +★":"fining — next crystal +★"} (${G._cerenBonus}) (-1 ${agentLabel})`);
        }else{
          log.push(`__PROD__⚒️ ${w.name}: ${L==="cs"?"čeření — chybí burel, antimon nebo arsen":"fining — no burel, antimony or arsenic"}`);
        }
      }
    }else{
      log.push(`__PROD__❓ ${w.name}: ${w.task}`);
    }
  }

  // 2b. Pánve dozrávají
  const rdyPanve=pA.filter(x=>round>=x.rdy);
  if(rdyPanve.length){
    pR+=rdyPanve.length;
    // Nová pánev: bereme průměrnou kvalitu dozrálých
    const avgQ=Math.round(rdyPanve.reduce((s,x)=>s+x.q,0)/rdyPanve.length);
    pQ=avgQ;
    log.push(`__PROD__🏺 ${rdyPanve.length}× ${L==="cs"?"pánev dozrálo":"crucible ready"} (${stars(avgQ)})!`);
  }
  pA=pA.filter(x=>round<x.rdy);

  // 3. Kampaň — pec
  let newActiveBatches=[]; // aktivní várky — deklarujeme vždy, plníme jen v kampani
  // Přepni barvu skloviny: _next → _active pouze když pec začíná prázdnou pánev
  if(isC && (!p.activeBatches || p.activeBatches.length===0)){
    p._activeColorRecipe = p._nextColorRecipe || null;
  }
  if(isC){
    // Šamot degraduje v kampani (zima je náročnější)
    const shamotDeg=round>=6?3:1;
    furnace.shamotWear=Math.min(100,furnace.shamotWear+shamotDeg);

    // Palivo: přímá spotřeba z fuel alokace (bez extra koeficientu)
    const fuelAlloc=Math.floor(r.wood*(p.wa.fuel/100));
    const fuelNeed=fuelNeedPerRound(round,ft);
    const fuelUsed=Math.min(fuelAlloc,fuelNeed+3);

    if(fuelUsed>=fuelNeed){
      r.wood-=fuelUsed;
      // Teplota závisí na peci a palivu
      let tgt;
      const lightM=getLightingMonth(p.seasonTier||0);
      if(lightM!==null && round===lightM){
        // Jarní rozžehnutí pece — přímý skok na 72–78% (1100°C+)
        tgt=clamp(72+Math.round(Math.random()*6), 72, ft.maxTemp);
        fT=tgt;
      }else if(lightM!==null && round===lightM+1){
        // Druhý měsíc kampaně — stabilizace teploty
        tgt=clamp(ft.maxTemp*(0.85+(fuelUsed-fuelNeed)*0.04)+Math.random()*4,75,ft.maxTemp);
        fT=Math.round(fT*.15+tgt*.85);
      }else{
        tgt=clamp(ft.maxTemp*(0.78+(fuelUsed-fuelNeed)*0.05)+Math.random()*5,55,ft.maxTemp);
        fT=Math.round(fT*.25+tgt*.75);
      }
      fA=true;
      // Zaběhávání pece — každá kampaňová várka trochu pomáhá
      furnace.runIn=Math.min(ft.maxRunIn, furnace.runIn+2);
      // Pokud pec právě nastartovala (byla off) — resetuj slotPanev aby se doplnily z pReady
      if(!p.fActive && fA){
        slotPanev=Array(ft.maxSlots||1).fill(null);
      }
      log.push(`__PROD__🔥 ${L==="cs"?"Palivo":"Fuel"}: ${fuelUsed}🪵 → ${zone(fT).l} ${fT}% · eff ${Math.round(fEff*100)}%`);
      if((p.seasonTier||0)>=1 && r.wood>=12 && Math.random()<0.65){
        r.dryWood=(r.dryWood||0)+1;
        log.push(`__PROD__🔥 ${L==="cs"?"Krytá sušárna: vyzrálé suché dříví +1🔥":"Drying shed: cured dry hardwood +1🔥"}`);
      }
    }else{
      r.wood=Math.max(0,r.wood-fuelUsed);
      fT=Math.max(0,fT-25);
      if(fT<30)fA=false;
      log.push(`__EVT__⚠️ ${L==="cs"?"Málo paliva! Teplota klesá":"Low fuel! Temp drops"}: ${fT}%`);
    }

    // Varování: šamot
    if(furnace.shamotWear>=80&&!log.some(l=>l.includes("šamot"))){
      log.push(`__EVT__⚠️ ${L==="cs"?"Šamot kriticky opotřeben! Opravit v mezisezóně.":"Shamot critically worn! Repair between seasons."}`);
    }

    // Slot loop — hráč volí typ každého slotu přes furnSlotConfig
    const furnSlots=ft.maxSlots||1;
    if(!p.furnSlotConfig||p.furnSlotConfig.length!==furnSlots){
      p.furnSlotConfig=Array(furnSlots).fill("waldglas");
    }
    const slotCfg=p.furnSlotConfig;
    if(!p.furnAtm||p.furnAtm.length!==furnSlots)p.furnAtm=Array(furnSlots).fill("ox");
    const atmCfg=p.furnAtm;
    const znalecPresent=p.workers.some(w=>w.traits?.includes("znalec")&&w.task!=="idle");
    // Vazby: Kunc + Máňa → +5 % kvalita tavení; Káninský + Hranař → nová pánev vydrží o 1 várku déle
    const meltBond=bondActive(p,"npc_kunc","npc_mana")?1.05:1;
    const panevBond=bondActive(p,"npc_kanin","npc_hrana1");
    let usedSlots=0;
    let noMoreCrucibles=false;

    // ── Per-slot pánve: inicializace nebo doplnění prázdných slotů ──
    // Při prvním kole kampaně nebo po prasknutí — doplnit z pR
    if(!slotPanev||slotPanev.length!==furnSlots){
      slotPanev=Array(furnSlots).fill(null);
    }
    // Doplnit prázdné sloty z dostupných pánví (pR)
    for(let si=0;si<furnSlots;si++){
      if(slotPanev[si]===null&&pR>0){
        slotPanev[si]={uses:PANEV_DUR+(panevBond?1:0), quality:pQ};
        pR--;
        log.push(`__PROD__🏺 ${L==="cs"?"Slot "+(si+1)+": nová pánev vsazena ("+stars(pQ)+")":"Slot "+(si+1)+": new crucible loaded ("+stars(pQ)+")"}`+(panevBond?` 🤝 ${L==="cs"?"Hranař dohlíží chlazení: +1 várka":"Hranař oversees cooling: +1 melt"}`:""));
      }
    }

    for(let si=0;si<furnSlots;si++){
      if(!fA)break;
      const sType=slotCfg[si]||"waldglas";
      if(sType==="crystal"){
        if(fT<65){
          log.push(`__PROD__⛔ ${L==="cs"?"Slot "+(si+1)+": křišťál — min 65% teplota ("+fT+"%)":"Slot "+(si+1)+": crystal — min 65% temp ("+fT+"%)"}`);
          newActiveBatches.push({slot:si,type:"crystal",colorKey:"crystal",blocked:true});
          usedSlots++;continue;
        }
        if(!r.pureSand||r.pureSand<3||!r.refinedPotash||r.refinedPotash<2||r.limestone<1||r.charcoal<1){
          log.push(`__PROD__⛔ ${L==="cs"?"Slot "+(si+1)+": křišťál — chybí suroviny (3× čistý písek, 2× čistá potaš, 1× vápenec, 1× uhlí)":"Slot "+(si+1)+": crystal — missing materials (3 pure sand, 2 refined potash, 1 limestone, 1 charcoal)"}`);
          newActiveBatches.push({slot:si,type:"crystal",colorKey:"crystal",blocked:true});
          usedSlots++;continue;
        }
        if(!slotPanev[si]){
          // Slot bez pánve — přeskočit, neprodukuje
          newActiveBatches.push({slot:si,type:"crystal",colorKey:"crystal",blocked:true});
          log.push(`__PROD__⛔ ${L==="cs"?"Slot "+(si+1)+": bez pánve":"Slot "+(si+1)+": no crucible"}`);
          usedSlots++;continue;
        }
        r.pureSand-=3;r.refinedPotash-=2;r.limestone-=1;r.charcoal-=1;usedSlots++;
        const slotPQ_c=slotPanev[si].quality;
        let qc=clamp(qRoll(tAcc(fT),fEff*3*meltBond,mor,slotPQ_c+1)+(znalecPresent?1:0),1,5);
        let qcNote="";
        if((G._cerenBonus||0)>0){qc=clamp(qc+1,1,5);G._cerenBonus--;qcNote+=` (${L==="cs"?"čeřeno":"fined"} +★)`;}
        if(atmCfg[si]==="red"){qc=clamp(qc-1,1,5);r.wood=Math.max(0,r.wood-1);qcNote+=` (${L==="cs"?"kouřivý žár −★, −1🪵":"smoky fire −★, −1🪵"})`;}
        cr.push(qc);tC++;tQS+=qc;tQN++;
        // Opotřebení pánve v tomto slotu
        slotPanev[si].uses--;
        if(slotPanev[si].uses<=0){
          // Pánev dosloužila — praskne na konci kola (označíme)
          slotPanev[si].exhausted=true;
        }
        newActiveBatches.push({slot:si,type:"crystal",colorKey:"crystal"});
        log.push(`__PROD__✨ → slot ${si+1}: ${L==="cs"?"křišťál":"crystal"} ${stars(qc)}${qcNote}`);
      }else{
        // waldglas (výchozí)
        if(fT<40){
          newActiveBatches.push({slot:si,type:"waldglas",colorKey:"waldglas",blocked:true});
          usedSlots++;continue;
        }
        if(r.sand<3||r.potash<2||r.limestone<1||r.water<1){
          log.push(`__PROD__⛔ ${L==="cs"?"Slot "+(si+1)+": waldglas — chybí suroviny":"Slot "+(si+1)+": waldglas — missing materials"}`);
          newActiveBatches.push({slot:si,type:"waldglas",colorKey:p._activeColorRecipe||"waldglas",blocked:true});
          usedSlots++;continue;
        }
        if(!slotPanev[si]){
          // Slot bez pánve — přeskočit, neprodukuje
          newActiveBatches.push({slot:si,type:"waldglas",colorKey:"waldglas",blocked:true});
          log.push(`__PROD__⛔ ${L==="cs"?"Slot "+(si+1)+": bez pánve":"Slot "+(si+1)+": no crucible"}`);
          usedSlots++;continue;
        }
        r.sand-=3;r.potash-=2;r.limestone-=1;r.water-=1;usedSlots++;
        const slotPQ_w=slotPanev[si].quality;
        let qw=qRoll(tAcc(fT),fEff*3*meltBond,mor,slotPQ_w);
        let qwNote="";
        if(atmCfg[si]==="red"){qw=clamp(qw-1,1,5);r.wood=Math.max(0,r.wood-1);qwNote=` (${L==="cs"?"kouřivý žár −★, −1🪵":"smoky fire −★, −1🪵"})`;}
        wg.push(qw);tW++;tQS+=qw;tQN++;
        // Opotřebení pánve v tomto slotu
        slotPanev[si].uses--;
        if(slotPanev[si].uses<=0){
          slotPanev[si].exhausted=true;
        }
        newActiveBatches.push({slot:si,type:"waldglas",colorKey:p._activeColorRecipe||"waldglas"});
        log.push(`__PROD__🔥 → slot ${si+1}: ${L==="cs"?"lesní sklo":"waldglas"} ${stars(qw)}`+(si===0?` (eff:${Math.round(fEff*100)}%)`:"")+qwNote);
      }
    }
    // ── Per-slot crack/exhaustion handling ──
    // Po skončení slot loopu: vyřídíme všechny exhausted sloty + náhodné cracky
    let crackedSlots=[]; // indexy slotů kde praskla
    for(let si=0;si<furnSlots;si++){
      if(!slotPanev[si])continue;
      const sp=slotPanev[si];
      // Normální opotřebení: uses <= 0
      if(sp.exhausted){
        crackedSlots.push({si,reason:"age"});
        slotPanev[si]=null;
        r.shamot++;
        continue;
      }
      // Náhodný crack: přetopení (fT>=90) nebo náhoda
      const isEasyLocal=G.difficulty==="easy";
      const crackHeat=fT>=90&&Math.random()<(isEasyLocal?0.12:0.20);
      const crackChance=Math.random()<(isEasyLocal?0.01:0.015);
      if(crackHeat||crackChance){
        crackedSlots.push({si,reason:crackHeat?"heat":"chance"});
        slotPanev[si]=null;
        r.shamot++;
      }
    }
    // Zpracovat prasklé sloty
    if(crackedSlots.length>0){
      const firstCrack=crackedSlots[0];
      // Teplota mírně klesne (ne zhasnutí!) — za každou prasklou pánev -8%
      fT=Math.max(30, fT - crackedSlots.length*8);
      // fA zůstává true — ostatní sloty jedou dál
      mor -= crackedSlots.length * 8;
      // Ztráty skla: jen z prasklých slotů (1 kus)
      const lostWg=[],lostCr=[];
      if(wg.length>0&&Math.random()<0.5){
        const q=wg.pop();lostWg.push(q);
      }
      if(cr.length>0&&Math.random()<0.3){
        const q=cr.pop();lostCr.push(q);
      }
      // Modal data
      G._crackLoss={
        reason:firstCrack.reason,
        wg:lostWg, cr:lostCr,
        slotsAffected:crackedSlots.length,
        slotIndexes:crackedSlots.map(c=>c.si+1)
      };
      evts.push("crack");
      G.totalCracks=(G.totalCracks||0)+crackedSlots.length;
      const lossStr=[lostWg.length?lostWg.length+"× waldglas":"",lostCr.length?lostCr.length+"× "+(L==="cs"?"křišťál":"crystal"):""].filter(Boolean).join(", ");
      log.push(`__EVT__💔 ${L==="cs"?"Pánev praskla (slot "+crackedSlots.map(c=>c.si+1).join(",")+")":"Crucible cracked (slot "+crackedSlots.map(c=>c.si+1).join(",")+")"} · ${lossStr||"—"} · ${L==="cs"?"teplota -"+(crackedSlots.length*8)+"%":"temp -"+(crackedSlots.length*8)+"%"}`);
    }
    // Sync pQ = průměrná kvalita aktivních slotů (pro calcFurnaceEff)
    const activeSlotPanve=slotPanev?slotPanev.filter(s=>s!==null):[];
    if(activeSlotPanve.length>0){
      pQ=Math.round(activeSlotPanve.reduce((s,sp)=>s+sp.quality,0)/activeSlotPanve.length);
    }
  }else{
    // Příprava: pec chladne
    if(isTemperingMonth(round, p.seasonTier||0)){
      // Temperování: zahřívá na 300-500°C ekvivalent (30-40% fTemp), 50% paliva
      const fuelNeedTemp=Math.ceil(FUEL_BASE*ft.fuelMult/2);
      const fuelAllocTemp=Math.floor(r.wood*(p.wa.fuel/100));
      const fuelUsedTemp=Math.min(fuelAllocTemp,fuelNeedTemp);
      r.wood=Math.max(0,r.wood-fuelUsedTemp);
      fT=clamp(30+Math.round(Math.random()*10), 30, 40); // 30-40%
      fA=false;
      log.push(`__PROD__🌡️ ${L==="cs"?"Temperování pece":"Furnace tempering"} · -${fuelUsedTemp}🪵 → ${fT}% (~${Math.round(fT*14)}°C)`);
    }else if(round<=1 && (p.seasonTier||0)<3){
      // Listopad/Prosinec — chladnutí
      fT=Math.min(15, Math.max(0, fT-20));
      if(fT<10)fA=false;
    }else if((p.seasonTier||0)<3){
      // Zima — studená pec
      fT=0; fA=false;
    }
  }

  // ── TIER 3: ZIMNÍ PROVOZ & ZIMNÍ VÝZVY (Prosinec, Leden, Únor) ──
  if((p.seasonTier||0)>=3 && (round===1||round===2||round===3)){
    const winterWoodNeed=(r.dryWood&&r.dryWood>=1)?0:2;
    if(winterWoodNeed>0){
      if(r.wood>=winterWoodNeed){
        r.wood-=winterWoodNeed;
        log.push(`__EVT__❄️ ${L==="cs"?"Krutý mráz: pec v zimě spálila +2🪵 syrového dříví navíc.":"Severe frost: furnace burned +2🪵 raw wood extra."}`);
      }else{
        fT=Math.max(25, fT-15);
        log.push(`__EVT__❄️ ${L==="cs"?"Zimní mráz ochlazuje pec pro nedostatek paliva!":"Winter freeze cools furnace due to wood shortage!"}`);
      }
    }else if(r.dryWood&&r.dryWood>=1){
      r.dryWood-=1;
      log.push(`__PROD__🔥 ${L==="cs"?"Suché bukové dříví udrželo dokonalý žár v mrazu (-1🔥).":"Dry cured hardwood maintained perfect heat in the freeze (-1🔥)."}`);
    }

    if(Math.random()<0.30){
      if(r.pitch&&r.pitch>=1){
        log.push(`__EVT__🌲 ${L==="cs"?"Smůlová izolace spolehlivě ochránila vodní náhon stoupy před ledem.":"Pitch coating reliably protected the water flume from ice."}`);
      }else if(r.wood>=1){
        r.wood-=1;
        log.push(`__EVT__🧊 ${L==="cs"?"Tovaryši roztopili oheň pod zamrzlým náhonem stoupy (-1🪵).":"Journeymen lit a thaw fire under the frozen flume (-1🪵)."}`);
      }else{
        log.push(`__EVT__🧊 ${L==="cs"?"Náhon stoupy zamrzl! Tovaryši museli sekat led (+únava).":"Water flume froze! Workers had to chop ice with axes (+fatigue)."}`);
        p.workers.forEach(w=>{if(w.task==="quarry"){w.fat=Math.min(10,(w.fat||0)+1);incidentIds.add(w.id);}});
      }
    }

    // Zimní prémie (Tier 3): +25 % k odměně SPLNĚNÝCH zakázek v prosinci–únoru — viz sekce 7 (žádná pevná částka bez dodávky).
  }

  // 4. Pivo
  const beer=BEER[p.beer]; mor+=beer.m;
  const bCost=beer.cost*Math.ceil(p.workers.length/3); grose-=bCost;

  // 4b. Jídlo — dělníci jedí každé kolo
  const foodNeed=Math.ceil(p.workers.length*0.5); // ~půl jednotky na dělníka
  if(r.food>=foodNeed){
    r.food-=foodNeed;
    if(r.food<=2)log.push(`__EVT__🍞 ${L==="cs"?"Zásoby jídla docházejí!":"Food supplies running low!"}`);
  }else if(r.food>0){
    // Částečné zásobení — menší postih
    r.food=0;
    mor-=5;
    log.push(`__EVT__🍞 ${L==="cs"?"Málo jídla — dělníci hladoví. Nálada -5.":"Not enough food — workers hungry. Morale -5."}`);
  }else{
    // Žádné jídlo — vážný postih
    mor-=10;
    const wkDamaged=p.workers.map(w=>({...w,health:Math.max(20,(w.health||100)-5)}));
    G.workers=wkDamaged;
    log.push(`__EVT__💀 ${L==="cs"?"Hladomor! Žádné jídlo. Nálada -10, zdraví dělníků klesá.":"Famine! No food. Morale -10, worker health declining."}`);
  }

  // Zabijačka — Říjen (kolo 11) nebo Září (kolo 10): automatický bonus jídla
  if(round===10||round===11){
    const zabiBonus=3+Math.floor(Math.random()*3); // 3-5 jednotek
    r.food+=zabiBonus;
    log.push(`__EVT__🐷 ${L==="cs"
      ?`Zabijačka! Podzimní porážka dobytka. +${zabiBonus} jídla na zimu.`
      :`Autumn slaughter! +${zabiBonus} food for winter.`}`);
    // Bonus morálky — sváteční nálada
    mor+=5;
    if(round===10)log.push(`__FLAVOR__${L==="cs"
      ?"Kouř z udírny táhne přes dvůr. Na chvíli je v huti jako o posvícení."
      :"Smoke from the smokehouse drifts across the yard. For a moment it feels like a village feast."}`);
  }

  // Políčko — task "field" přidá jídlo v přípravě i kampani
  for(const w of p.workers){
    if(w.task==="field"){
      // Léto nejlepší, zima nic
      const fieldYield=[0,0,0,0,1,1,2,2,2,2,1,0]; // dle měsíce
      const yld=fieldYield[round]||0;
      if(yld>0){r.food+=yld;log.push(`__PROD__🌾 ${w.name}: +${yld} 🍞 ${L==="cs"?"z políčka":"from field"}`);}
      else log.push(`__PROD__🌾 ${w.name}: ${L==="cs"?"zima — políčko neplodí":"winter — field yields nothing"}`);
    }
  }
  // 5. Mzdy — individuální dle wageMod, zimní příprava a lehká obtížnost
  const isEasyDiff = p.difficulty === "easy";
  const baseWageRate = baseWageRateFor(isP, isEasyDiff);
  let wages=0;
  const workerWages=p.workers.map(w=>{
    const ww=workerWageFor(w, baseWageRate); // odpočinek = poloviční mzda (IDLE_WAGE_FACTOR)
    wages+=ww;
    return{id:w.id,wage:ww};
  });
  // Kolik reálně zaplatíme — pokud grose nestačí, platíme co jde (zbytek = dluh)
  const wagesAvail=Math.max(0,grose); // nemůžeme platit z ničeho
  const wagesPaid=Math.min(wages,Math.floor(wagesAvail)); // celé groše → schodek je vždy celé číslo
  const wagesDeficit=wages-wagesPaid;
  grose-=wagesPaid;
  // Nevyplacené mzdy = DLUH PARTĚ (w.unpaidDebt, splácí se v záložce Parta/Účty). Nepřičítají se k dluhu u Faktora Weisse (p.debt) — jsou to dvě oddělené entity.
  // Per-worker: kolik kdo dostal (proporcionálně)
  const payRatio=wages>0?wagesPaid/wages:1;
  // Schodek se rozpočítá na celé groše metodou největšího zbytku → součet dluhů partě == wagesDeficit přesně (žádný groš se neztratí ani nevytvoří).
  const shortfalls=allocateShortfalls(workerWages.map(ww=>ww.wage),wagesDeficit);
  workerWages.forEach((ww,i)=>{ ww.paid=payRatio>=1; ww.shortfall=shortfalls[i]; });

  // 6. Splácení dluhu u Faktora Weisse (standardní auto-splátka, pokud není aktivní odklad)
  let dPay=0;
  if(debt>0 && grose>5 && !p.debtMoratorium){
    dPay=Math.min(5, grose-2, debt);
    grose-=dPay;
    debt-=dPay;
    // Reputace dlužníka roste při splácení
    if(dPay>0){
      p.totalDebtPaid=(p.totalDebtPaid||0)+dPay;
      p.debtReputation=Math.min(100,Math.floor((p.totalDebtPaid||0)/(isEasyDiff?2:3)));
    }
  }
  if(p.debtMoratorium && p.debtMoratorium>0){
    p.debtMoratorium--;
    if(p.debtMoratorium===0){
      log.push(`__ECO__📜 ${L==="cs"?"Odklad splátek u Faktora Weisse vypršel — obnoveno běžné splácení.":"Debt moratorium with Factor Weiss has expired — regular repayment resumed."}`);
    }
  }
  // 7. Zakázky
  let contractIncomeTick=0;
  // Celoroční huť (Tier 3): zimní dodávky (prosinec–únor) mají +25 % prémii k odměně — platí jen za skutečně splněnou zakázku
  const winterDelivery=(p.seasonTier||0)>=3&&(round===1||round===2||round===3);
  const WINTER_PREMIUM=0.25;
  for(let i=con.length-1;i>=0;i--){
    const c=con[i];
    // Resolve inventory by item type — support all product types
    let inv;
    if(c.item==="crystal") inv=cr;
    else if(c.item==="waldglas") inv=wg;
    else if(p[c.item]&&Array.isArray(p[c.item])) inv=p[c.item];
    else inv=[];
    // Splnění: máme dost kusů A ještě jsme v termínu (round <= due)
    if(inv.length>=c.qty&&round<=c.due){
      for(let j=0;j<c.qty;j++)inv.pop();
      const diffRewardBonus = p.difficulty === "easy" ? Math.round(c.reward * 0.25) : 0;
      const winterBonus = winterDelivery ? Math.round(c.reward * WINTER_PREMIUM) : 0;
      const actualReward = c.reward + diffRewardBonus + winterBonus;
      grose+=actualReward; done++; contractIncomeTick+=actualReward;
      const buyerStr=c.buyer?" ("+c.buyer+")":"";
      const bonusStr = (diffRewardBonus > 0 ? ` (+${diffRewardBonus}g bonus)` : "") + (winterBonus > 0 ? ` (+${winterBonus}g ${L==="cs"?"zimní prémie":"winter premium"} 👑)` : "");
      log.push(`__ECO__📜 ${L==="cs"?"Zakázka splněna":"Contract done"}${buyerStr}! +${actualReward}g${bonusStr}`);
      // Fama gain při splnění zakázky
      const famaCatDone=BUYER_FAMA[c.buyer];
      if(famaCatDone&&p.fama){
        p.fama[famaCatDone]=Math.min(FAMA_MAX,(p.fama[famaCatDone]||0)+FAMA_CONTRACT_GAIN);
      }
      con.splice(i,1);
    } else if(round>c.due){
      const buyerStr=c.buyer?" ("+c.buyer+")":"";
      log.push(`__EVT__📜 ${L==="cs"?"Zakázka vypršela":"Contract expired"}${buyerStr}`);
      // Fama loss při prpadlé zakázce
      const famaCatExp=BUYER_FAMA[c.buyer];
      if(famaCatExp&&p.fama){
        p.fama[famaCatExp]=Math.max(0,(p.fama[famaCatExp]||0)+FAMA_CONTRACT_EXPIRE);
      }
      con.splice(i,1);
    }
  }

  // 7b. Reputační zakázky — zpracovat aktivní repContracts
  const repCon=[...(p.repContracts||[])];
  let repContractIncome=0;
  for(let i=repCon.length-1;i>=0;i--){
    const rc=repCon[i];

    // ── ENDGAME zakázka — multi-komponentní vyhodnocení ──
    if(rc.isEndgame&&rc.components){
      if(round>rc.due){
        log.push(`__EVT__⚠️ ${L==="cs"?"ENDGAME zakázka propadla":"ENDGAME contract expired"} (${FAMA_ICON[rc.cat]})`);
        if(p.fama) p.fama[rc.cat]=Math.max(0,(p.fama[rc.cat]||0)+EG_FAMA_LOSS);
        repCon.splice(i,1);
        continue;
      }
      // Zkontroluj jestli jsou všechny komponenty splněné
      let allDone=true;
      for(const comp of rc.components){
        let inv;
        if(comp.item==="crystal") inv=cr;
        else if(comp.item==="waldglas") inv=wg;
        else if(p[comp.item]&&Array.isArray(p[comp.item])) inv=p[comp.item];
        else inv=[];
        if(inv.length<comp.qty){allDone=false;break;}
      }
      if(allDone){
        // Odečti všechny komponenty
        for(const comp of rc.components){
          let inv;
          if(comp.item==="crystal") inv=cr;
          else if(comp.item==="waldglas") inv=wg;
          else if(p[comp.item]&&Array.isArray(p[comp.item])) inv=p[comp.item];
          else inv=[];
          for(let j=0;j<comp.qty;j++) inv.pop();
        }
        grose+=rc.reward; contractIncomeTick+=rc.reward; repContractIncome+=rc.reward;
        // Endgame splněn!
        if(p.endgame) p.endgame[rc.cat]=true;
        if(p.fama) p.fama[rc.cat]=Math.min(FAMA_MAX,(p.fama[rc.cat]||0)+EG_FAMA_GAIN);
        const egDef=ENDGAME_CONTRACTS[rc.cat];
        const completionMsg=egDef?(L==="cs"?egDef.completionText_cs:egDef.completionText_en):"";
        log.push(`__EVT__🏆 ${L==="cs"?"ENDGAME SPLNĚN":"ENDGAME COMPLETE"} ${FAMA_ICON[rc.cat]} +${rc.reward}g`);
        if(completionMsg) log.push(`__EVT__💬 ${completionMsg}`);
        log.push(`__EVT__📜 ${L==="cs"?"Pravidelné dodávky aktivovány":"Regular deliveries activated"} ${FAMA_ICON[rc.cat]}`);
        repCon.splice(i,1);
      }
      continue;
    }

    // ── Jednoduchá reputační zakázka ──
    let inv;
    if(rc.item==="crystal") inv=cr;
    else if(rc.item==="waldglas") inv=wg;
    else if(p[rc.item]&&Array.isArray(p[rc.item])) inv=p[rc.item];
    else inv=[];
    if(inv.length>=rc.qty&&round<=rc.due){
      for(let j=0;j<rc.qty;j++)inv.pop();
      const rcWinter = winterDelivery ? Math.round(rc.reward * WINTER_PREMIUM) : 0;
      const rcPay = rc.reward + rcWinter;
      grose+=rcPay; contractIncomeTick+=rcPay; repContractIncome+=rcPay;
      log.push(`__ECO__⭐ ${L==="cs"?"Reputační zakázka splněna":"Rep contract done"} (${rc.cat==="church"?"🕊️":rc.cat==="noble"?"⚔️":"🌍"}): +${rcPay}g`+(rcWinter>0?` (+${rcWinter}g ${L==="cs"?"zimní prémie":"winter premium"} 👑)`:""));
      if(p.fama) p.fama[rc.cat]=Math.min(FAMA_MAX,(p.fama[rc.cat]||0)+REP_FAMA_GAIN);
      repCon.splice(i,1);
    } else if(round>rc.due){
      log.push(`__EVT__⭐ ${L==="cs"?"Reputační zakázka propadla":"Rep contract expired"} (${rc.cat==="church"?"🕊️":rc.cat==="noble"?"⚔️":"🌍"})`);
      if(p.fama) p.fama[rc.cat]=Math.max(0,(p.fama[rc.cat]||0)+REP_FAMA_LOSS);
      repCon.splice(i,1);
    }
  }

  // 7c. Generovat nové náhodné reputační zakázky (0–2× ročně per kategorie)
  const newRepCon=[...repCon];
  if(isC){ // jen během kampaně
    REP_CONTRACT_POOL.forEach(template=>{
      // Zkontroluj: fama >= minFama, žádná stejná zakázka není aktivní, náhoda
      const currentFama=(p.fama||{})[template.cat]||0;
      const alreadyActive=newRepCon.some(r=>r.id===template.id);
      // Endgame tohle nepotřebuje — normální reputační zakázky
      if(currentFama>=template.minFama && !alreadyActive && Math.random()<template.chance){
        newRepCon.push({
          ...template,
          due: round+template.due,
          instanceId: template.id+"_"+round
        });
        log.push(`__EVT__⭐ ${L==="cs"?"Nová zakázka přišla":"New order arrived"}: ${L==="cs"?template.cs:template.en}`);
      }
    });
  }

  // 8. Náhodné události
  // evts[] již deklarováno nahoře (crack handler ho potřebuje dříve)

  // Crack event je nyní řešen per-slot v slot loopu (viz výše)

  if(isC&&fA&&mor>65&&(wg.length>p.waldglas.length||cr.length>p.crystal.length)&&Math.random()<.15)evts.push("good");
  if(round<=3&&Math.random()<.25){evts.push("winter");mor-=5;r.wood=Math.max(0,r.wood-4);}
  if(isC&&furnace.shamotWear>=90&&Math.random()<.4){evts.push("shamotCrack");mor-=10;fT=Math.max(0,fT-20);}
  if(forest<=0&&!evts.includes("forestDepleted"))evts.push("forestDepleted");
  // Kupec přijíždí na Vánoce, Tři králové, Velikonoce
  if(KUPEC_ROUNDS.includes(round)&&Math.random()<.8){evts.push("merchant");mB=true;}

  // Přirozená progression barev — kramář/event bez Baranovského
  const hasBaran=p.workers.some(w=>w.npcId==="npc_baran");
  const unl=p.unlockedRecipes||[];

  // Sv. Jiří (kolo 5 = Duben) — modal event + foukači na trhu
  if(round===5&&!unl.includes("_svjiri_foukaci")){
    unl.push("_svjiri_foukaci");
    evts.push("svjiri");
    // Vygeneruj 1–2 NPC na trhu (vždy 1 foukač pokud 2)
    const foukProfs=["foukat_lesni","foukat_kristal","foukat_dekor","foukat_formy"];
    const brusProfs=["brusic_hrana","brusic_kulic","rytec"];
    const availNPC=getAvailableNPC().filter(n=>n.availSeason<=p.season+1);
    const foukCands=availNPC.filter(n=>foukProfs.includes(n.prof));
    const otherCands=availNPC.filter(n=>brusProfs.includes(n.prof)||n.prof==="formar");
    const picked=[];
    if(foukCands.length){picked.push(foukCands[Math.floor(Math.random()*foukCands.length)]);}
    if(otherCands.length&&Math.random()>.4){picked.push(otherCands[Math.floor(Math.random()*otherCands.length)]);}
    else if(foukCands.length>1&&Math.random()>.5){
      const rest=foukCands.filter(n=>!picked.find(x=>x.id===n.id));
      if(rest.length)picked.push(rest[Math.floor(Math.random()*rest.length)]);
    }
    p.trhuNPC=picked.map(npc=>({
      id:"t"+npc.id, npcId:npc.id, name:npc.name, prof:npc.prof, lv:npc.lv,
      traits:npc.traits, hireCost:npc.hireCost, wageMod:npc.wageMod,
      portrait:npc.portrait, quote_cs:npc.quote_cs, quote_en:npc.quote_en,
      loyalty:npc.loyalty, health:npc.health, mood:npc.mood,
      gender:npc.gender||"m", xp:0, fat:0, task:WERKSTAT_PROFS.includes(npc.prof)?"werkstat":"idle",
      seasonsInFoundry:0, incidents:0, contract:null
    }));
  }
  // Kampaňové kolo 3 (Červen=kolo 7) → burel a crocusMartis zdarma
  if(isC&&round===7&&!unl.includes("_burel_free")){
    p.additives.burel=(p.additives.burel||0)+2;
    p.additives.crocusMartis=(p.additives.crocusMartis||0)+2;
    unl.push("_burel_free");
    log.push(`__EVT__🧑‍🌾 ${L==="cs"
      ?"Putující barvíř z Liberce přinesl burel a crocus martis. Říká: zkuste to s křišťálem."
      :"A travelling dyer from Liberec brought burel and crocus martis. Try it with crystal, he says."}`);
  }
  // Kampaňové kolo 5 (Srpen=kolo 9) → šmolka → odemkne modrou
  if(isC&&round===9&&!unl.includes("modra")){
    p.additives.smolka=(p.additives.smolka||0)+1;
    unl.push("modra");
    log.push(`__EVT__🔵 ${L==="cs"
      ?"Saský kramář zastavil u hutě. Prodal hrst šmolky za 3 groše. Recept na modrou je váš!"
      :"A Saxon peddler stopped at the foundry. Sold a handful of zaffre for 3 groats. Blue recipe unlocked!"}`);
    grose=Math.max(0,grose-3);
  }
  // Příští sezóna (season>=2, kolo 6=Květen) → aesUstum → smaragd
  if(p.season>=2&&round===6&&!unl.includes("smaragd")){
    p.additives.aesUstum=(p.additives.aesUstum||0)+1;
    unl.push("smaragd");
    log.push(`__EVT__🟢 ${L==="cs"
      ?"Pánvař Káninský zkusil pálit měď v pomocné peci. Výsledek: smaragdová zeleň! Recept zapsán."
      :"Káninský tried burning copper in the auxiliary furnace. Result: emerald green! Recipe recorded."}`);
  }
  // Filigranar trait → lattimo dřív (Wagnerová na werkstatu od sezóny 2)
  const hasFiligranar=p.workers.some(w=>w.traits?.includes("filigranar")&&w.task==="werkstat");
  if(hasFiligranar&&p.season>=2&&!unl.includes("lattimo")){
    p.additives.cin=(p.additives.cin||0)+1;
    p.additives.olovo=(p.additives.olovo||0)+1;
    unl.push("lattimo");
    log.push(`__EVT__⚪ 🕸️ ${L==="cs"
      ?"Wagnerová zná benátské nitě. Lattimo odemčeno — sezóna dřív!"
      :"Wagnerová knows Venetian threads. Lattimo unlocked — one season early!"}`);
  }
  // Sezóna 3, kolo 5 → lattimo suroviny
  if(p.season>=3&&round===5&&!unl.includes("lattimo")){
    p.additives.cin=(p.additives.cin||0)+1;
    p.additives.olovo=(p.additives.olovo||0)+1;
    unl.push("lattimo");
    log.push(`__EVT__⚪ ${L==="cs"
      ?"Benátský obchodník zanechal recept na lattimo. Cín a olovo jsou v sáčku."
      :"A Venetian trader left a lattimo recipe. Tin and lead in the bag."}`);
  }
  // 1683 (sezóna 4) — Michael Müller, Janouškova huť u Vimperku: křišťál jako nová receptura (čistá potaš + vápenec)
  if(p.season>=4&&round===0&&!unl.includes("_muller")){
    unl.push("_muller");
    log.push(`__EVT__✨ ${L==="cs"
      ?"Ze Šumavy se šíří zpráva: skelmistr Michael Müller z Janouškovy hutě u Vimperku vaří nové, těžké sklo z čisté potaše a vápence. Říkají mu křišťál. Tenké benátské sklo vychází z módy."
      :"News from the Bohemian Forest: master Michael Müller of Janoušek's glasshouse near Vimperk melts a new, heavy glass of pure potash and lime. They call it crystal. Thin Venetian glass is going out of fashion."}`);
  }
  // Rubín — POUZE přes Baranovského (endgame, nikdy přirozeně)

  // Baranovský — bonus: vždy o krok napřed + vzácnější věci
  if(hasBaran&&isC){
    const baranLv=p.workers.find(w=>w.npcId==="npc_baran")?.lv||1;
    // Červen (kolo 7) — B. přiveze šmolku dřív
    if(round===7&&!unl.includes("modra")){
      p.additives.smolka=(p.additives.smolka||0)+2;
      unl.push("modra");
      log.push(`__EVT__🔵 🗣️ ${L==="cs"
        ?"Baranovský: Šmolku ze Saska mám. Modrá bude. Recept na modrou odemčen!"
        :"Baranovský: Got zaffre from Saxony. Blue it is. Blue recipe unlocked!"}`);
    }
    // Srpen (kolo 9) — B. přiveze aesUstum
    if(round===9&&!unl.includes("smaragd")){
      p.additives.aesUstum=(p.additives.aesUstum||0)+2;
      unl.push("smaragd");
      log.push(`__EVT__🟢 🗣️ ${L==="cs"
        ?"Baranovský přivezl pálenou měď z Chomutova. Smaragd odemčen!"
        :"Baranovský brought burnt copper from Chomutov. Emerald unlocked!"}`);
    }
    // S2 start → lattimo rovnou
    if(p.season===2&&round===0&&!unl.includes("lattimo")){
      p.additives.cin=(p.additives.cin||0)+2;
      p.additives.olovo=(p.additives.olovo||0)+2;
      unl.push("lattimo");
      log.push(`__EVT__⚪ 🗣️ ${L==="cs"
        ?"Baranovský: Cín a olovo. Uděláte bílé jako porcelán. Lattimo odemčeno!"
        :"Baranovský: Tin and lead. White like porcelain. Lattimo unlocked!"}`);
    }
    // S3 + vyšší level → antimon (příprava na rubín)
    if(p.season>=3&&baranLv>=3&&round===0&&!unl.includes("_antimon_hint")){
      p.additives.cin=(p.additives.cin||0)+1;
      unl.push("_antimon_hint");
      log.push(`__EVT__⚪ 🗣️ ${L==="cs"
        ?"Baranovský šeptem: Seženu zlatý prach. Kunckelův rubín není legenda — zlato se v lučavce vysráží cínem. Cín na skladě."
        :"Baranovský whispers: I will find gold dust. Kunckel's ruby is no legend — the gold is precipitated with tin in aqua regia. Tin in stock."}`);
    }
  }
  p.unlockedRecipes=unl;

  mor=clamp(mor,0,100); grose=Math.max(0,grose);
  // Tomislavův rank — pasivní efekty
  const tomRank=getTomislavRank(p);
  if(tomRank==="ucen"||tomRank==="tovarys"||tomRank==="mistr"||tomRank==="velmistr"){
    // Učeň+: Tomislav aktivně pomáhá → +2 morale/kolo
    mor=Math.min(100,mor+2);
  }
  // Aktualizuj dělníky: únava, XP, level-up
  const hasUcitel=p.workers.some(w=>w.traits?.includes("ucitel")&&w.task!=="idle");
  const wk=p.workers.map(w=>{
    const isWerkstat=w.task==="werkstat";
    const isIdle=w.task==="idle";
    // Foukač/brusič na Verštatu se unaví na ≥75% → automaticky přepnout na Odpočinek
    const autoIdle=isWerkstat&&(w.fat||0)>=0.75;
    // VERŠTAT = nulová únava: dílna únavu nepřidává, ale ani neubírá (není to odpočinek) — zdraví ani loajalita se tu nereguluje jako při odpočinku.
    // Hook pro budoucí rozšíření: WERKSTAT_FATIGUE>0 by přidalo únavu verštatu.
    const WERKSTAT_FATIGUE=0;
    const fatBase=w.traits?.includes("vytrvalec")?0.07:w.traits?.includes("mlady")?0.115:w.traits?.includes("pedant")?0.08:0.1;
    const newFat=isIdle?Math.max(0,w.fat-0.5):isWerkstat?Math.min(1,w.fat+WERKSTAT_FATIGUE):Math.min(1,w.fat+fatBase);
    const newTask=autoIdle?"idle":w.task;
    // Zdraví — klesá při dlouhé únavě, roste při odpočinku a jídle
    const hasFood=r.food>0;
    let newHealth=w.health||100;
    if(newFat>0.8&&!isIdle&&!isWerkstat) newHealth=Math.max(0,newHealth-3); // přepracování
    if(isIdle) newHealth=Math.min(100,newHealth+5); // odpočinek regeneruje
    if(hasFood&&newHealth<100) newHealth=Math.min(100,newHealth+1); // jídlo pomáhá
    // Loajalita — sdílí směr s morálkou hutě + penalizace za neplacení
    let newLoyalty=w.loyalty||75;
    const moraleDir=mor>60?1:mor>40?0:-1;
    newLoyalty=Math.max(0,Math.min(100,newLoyalty+moraleDir));
    if(isIdle) newLoyalty=Math.min(100,newLoyalty+1);
    // Vazba Káninský × Kateřina (tenze): nedůvěra — loajalita -1 za kolo, dokud Káninský velí
    if(w.npcId==="npc_foukac4"&&bondActive(p,"npc_kanin","npc_foukac4")) newLoyalty=Math.max(0,newLoyalty-1);
    // Neplacení — skokový pád loajality
    const wageEntry=workerWages.find(x=>x.id===w.id);
    const newUnpaid=(w.unpaidDebt||0)+(wageEntry?.shortfall||0);
    if(newUnpaid>0){
      // Čím víc dluží, tím rychleji klesá loajalita
      const loyPenalty=Math.min(20, Math.ceil(newUnpaid/2)*4);
      newLoyalty=Math.max(0,newLoyalty-loyPenalty);
      // Lakomec reaguje 1.5× silněji
      if(w.traits?.includes("lakomec")) newLoyalty=Math.max(0,newLoyalty-Math.ceil(loyPenalty*0.5));
      // Nesplnený slib — horší než žádný slib
      if(w.promisedDebt){
        newLoyalty=Math.max(0,newLoyalty-12);
        G.log.push("__EVT__💔 "+(L==="cs"?w.name+" — slib nebyl splněn. Důvěra padá.":w.name+" — broken promise. Trust drops."));
      }
    } else {
      // Zaplaceno → pomalu odpouštět dluh paměti (odpustit 1g/kolo)
      // newUnpaid zůstane 0
      if(w.promisedDebt) w.promisedDebt=false; // slib splněn — reset
    }
    // Kontrakt tick — snížit roundsLeft, chránit loajalitu
    let newContract=w.contract?{...w.contract}:null;
    if(newContract){
      newContract.roundsLeft=Math.max(0,(newContract.roundsLeft||1)-1);
      if(newContract.roundsLeft<=0) newContract=null; // kontrakt vypršel
    }
    // Kontrakt chrání před odchodem — loajalita neklesne pod 30 při aktivním kontraktu
    const contractActive=!!(newContract&&newContract.roundsLeft>0);
    if(contractActive) newLoyalty=Math.max(30,newLoyalty);

    // Seasons tracking
    const newSeasonsInFoundry=(w.seasonsInFoundry||0);

    // Odchod při nízké loajalitě — BLOKOVÁNO pokud má kontrakt
    const isHouzevatny=w.traits?.includes("houzevatny");
    const isKunc=w.npcId==="npc_kunc";
    // Houževnatí dělníci (Kunc, Máňa) mají pevnou věrnost huti, ale při totálním zanedbání (loyalty <= 0 a hlad/dluhy) nakonec také odejdou
    const leaveThreshold=isHouzevatny?0:20;
    const leaveChance=isHouzevatny
      ?(newLoyalty<=0&&(newUnpaid>=8||newHealth<35||mor<=10)?(isKunc?0.45:0.6):0)
      :(newLoyalty<leaveThreshold?0.35:newLoyalty<35?0.12:0);
    // At-risk warning: loajalita klesla pod 40 → přidat do retention queue (nezávisle na willLeave)
    if(newLoyalty<40&&!contractActive&&!(G._retentionPending||[]).includes(w.id)){
      if(!G._retentionPending) G._retentionPending=[];
      if(!G._retentionPending.includes(w.id)) G._retentionPending.push(w.id);
    }
    const willLeave=!contractActive&&leaveChance>0&&Math.random()<leaveChance;
    // XP: za každé aktivní kolo +1 (učitel bonus); werkstat počítá jako aktivní
    // Afinita bonus XP: Josef+Kateřina
    const hasJosef=p.workers.some(x=>x.npcId==="npc_foukac3"&&x.task!=="idle");
    const hasKate =p.workers.some(x=>x.npcId==="npc_foukac4"&&x.task!=="idle");
    const affinityXpBonus=(w.npcId==="npc_foukac3"&&hasKate)?1:0; // Josef leveluje 2x rychleji
    const mentorBonus=(w.mentorId&&p.workers.some(x=>x.npcId===w.mentorId&&x.task!=="idle"))?0.15:0;
    // Task affinity XP multiplikátor: na primárním tasku 1.5×, na cizím 0.5×
    const primaryTask=TASK_AFFINITY[w.prof]??null;
    const taskAffinityMult=isIdle?1:
      primaryTask===null?1:                   // obchodnik / bez afinity — neutrální
      primaryTask===w.task?1.5:               // primární task → bonus
      0.5;                                    // cizí task → malus
    // mlady trait: +0.5× XP (učí se rychleji, ale unaví se víc)
    const mladyMult=w.traits?.includes("mlady")?1.5:1;
    const xpGain=isIdle?0:((hasUcitel&&!w.traits?.includes("ucitel")?1.5:1)+affinityXpBonus)*(1+mentorBonus)*taskAffinityMult*mladyMult;
    const newXp=(w.xp||0)+xpGain;
    // Level-up?
    let newLv=w.lv;
    const xpNeeded=XP_PER_LEVEL[w.lv-1]||999;
    let newTraits=[...(w.traits||[])];
    if(newLv<10&&newXp>=xpNeeded){
      newLv=Math.min(10,w.lv+1);
      const tier=workerTier(newLv);
      log.push(`__EVT__⭐ ${w.name} ${L==="cs"?"postoupil na":"leveled up to"} ${tier.cs} (${tier.de}) lv.${newLv}!`);
      // Trait unlock na milnících lv3, lv6, lv9 — dle profese
      const LEVEL_TRAITS={
        drvorubc:      {3:"silak",     6:"vytrvalec", 9:"znalec"},
        popelar:       {3:"vytrvalec", 6:"houzevatny",9:"znalec"},
        panvar:        {3:"kovak",     6:"pedant",     9:"znalec"},
        formar:        {3:"kovak",     6:"vytrvalec",  9:"pedant"},
        hornik:        {3:"silak",     6:"vytrvalec",  9:"znalec"},
        tavic:         {3:"znalec",    6:"pedant",     9:"houzevatny"},
        foukat_lesni:  {3:"vytrvalec", 6:"znalec",     9:"pedant"},
        foukat_kristal:{3:"znalec",    6:"pedant",     9:"houzevatny"},
        foukat_dekor:  {3:"znalec",    6:"filigranar", 9:"pedant"},
        foukat_formy:  {3:"kovak",     6:"znalec",     9:"pedant"},
        brusic_hrana:  {3:"pedant",    6:"znalec",     9:"houzevatny"},
        brusic_kulic:  {3:"pedant",    6:"znalec",     9:"houzevatny"},
        rytec:         {3:"pedant",    6:"znalec",     9:"houzevatny"},
      };
      const unlockTrait=(LEVEL_TRAITS[w.prof]||{})[newLv];
      if(unlockTrait&&!newTraits.includes(unlockTrait)){
        newTraits.push(unlockTrait);
        const traitLabel=TRAITS[unlockTrait]?.[L==="cs"?"cs":"en"]||unlockTrait;
        const flavors={
          cs:{silak:"Roky těžké práce se projevily.",vytrvalec:"Naučil se vydržet.",
              znalec:"Léta praxe dala cit pro materiál.",pedant:"Chyby ho naučily přesnosti.",
              kovak:"Ruce poznaly hlínu zevnitř.",houzevatny:"Teď ho nedostanete pryč.",
              filigranar:"Nitě mu poslouchají jako živé."},
          en:{silak:"Years of hard work show.",vytrvalec:"Learned to endure.",
              znalec:"Years of practice gave feel for material.",pedant:"Mistakes taught precision.",
              kovak:"Hands learned clay from within.",houzevatny:"You won't move him now.",
              filigranar:"The threads obey like living things."}
        };
        const flavor=(flavors[L]||flavors.cs)[unlockTrait]||"";
        log.push(`__EVT__🌟 ${w.name}: +${traitLabel} — ${flavor}`);
      }
    }
    // ── MENTOR SYSTÉM ──
    // Kunc může mentorovat taviče, Máňa popelář/formař, Hranař brusiče
    // Base trigger: 4-5 kol společné aktivní práce; zkrácení traity, prodloužení tenzí
    const MENTOR_PAIRS=[
      {mentor:"npc_kunc",   pupil:null,           profMatch:["tavic","foukat_lesni","foukat_kristal","foukat_dekor","foukat_formy"]},
      {mentor:"npc_mana",   pupil:null,           profMatch:["popelar","formar"]},
      {mentor:"npc_hrana1", pupil:"npc_kulic1",   profMatch:["brusic_kulic","rytec"]},
      {mentor:"npc_foukac4",pupil:"npc_foukac3",  profMatch:["foukat_dekor"]},
    ];
    let newMentorId=w.mentorId||null;
    let newMentorRounds=(w.mentorRounds||0);
    if(!newMentorId&&!isIdle){
      const pair=MENTOR_PAIRS.find(mp=>{
        if(mp.profMatch&&!mp.profMatch.includes(w.prof)) return false;
        if(mp.pupil&&mp.pupil!==w.npcId) return false;
        const mentorW=p.workers.find(x=>x.npcId===mp.mentor&&x.task!=="idle");
        if(!mentorW||mentorW.id===w.id) return false;
        return true;
      });
      if(pair){
        newMentorRounds++;
        // Trigger base: 4; -1 pokud oba mají ucitel/znalec; +1 pokud tenze; ±1 random každých 3 kola
        let trigger=4+Math.floor(Math.random()*2); // 4-5 base
        const mentorW=p.workers.find(x=>x.npcId===pair.mentor);
        if(mentorW&&(mentorW.traits?.includes("ucitel")||mentorW.traits?.includes("znalec"))) trigger--;
        if(w.traits?.includes("znalec")) trigger--;
        if(w.traits?.includes("lakomec")) trigger++;
        const hasTension=NPC_BONDS.some(b=>b.type==="tension"&&
          ((b.a===w.npcId&&b.b===pair.mentor)||(b.b===w.npcId&&b.a===pair.mentor)));
        if(hasTension) trigger++;
        trigger=Math.max(2,Math.min(7,trigger));
        if(newMentorRounds>=trigger){
          newMentorId=pair.mentor;
          const mentorName=NPC_ROSTER.find(n=>n.id===pair.mentor)?.name||pair.mentor;
          log.push(`__EVT__📖 ${w.name} ${L==="cs"?"přijal mentorství od":"accepted mentorship from"} ${mentorName}!`);
        }
      }
    }
    // Mentor bonus: +15% XP aplikován přes mentorBonus výše
    if(willLeave){
      let reason="";
      if(w.npcId==="npc_kunc"){
        reason=L==="cs"
          ?"s těžkým srdcem uhasil pec a opustil huť — ani mistr Kunc nemohl tavit bez mezd, jídla a naděje."
          :"with a heavy heart extinguished the furnace and left — even master Kunc could not melt glass without food or pay.";
      }else if(w.traits?.includes("houzevatny")){
        reason=L==="cs"
          ?"si sbalila ranec a odešla z huti — z prázdných hrnců a nezaplacené práce se žít nedá."
          :"packed up and left the foundry — one cannot live on empty pots and unpaid labor.";
      }else if(newUnpaid>0){
        reason=L==="cs"?`odešel — huť mu dluží ${newUnpaid}g.`:`left — the foundry owes him ${newUnpaid}g.`;
      }else{
        reason=L==="cs"?"odešel — nálada v huti byla příliš nízká.":"left — morale was too low.";
      }
      log.push(`__EVT__👋 ${w.name} ${reason}`);
      if(newUnpaid>0){   // dluh neodchází s dělníkem: zapíše se do knihy pohledávek bývalých zaměstnanců
        newClaims.push({id:"c"+p.season+"_"+(round+1)+"_"+w.id,name:w.name,npcId:w.npcId||null,amount:newUnpaid,season:p.season,round:round+1,reason:"left"});
        log.push(`__ECO__📒 ${L==="cs"?`Pohledávka bývalého dělníka ${w.name}: ${newUnpaid}g zapsána v knize dluhů`:`Claim of former worker ${w.name}: ${newUnpaid}g recorded in the ledger`}`);
      }
      return null;
    }
    // Nálada — plynule (30 %/kolo) směřuje k cílové hodnotě: osobní báze NPC ± morálka hutě, únava, hlad, nevyplacené mzdy, kontrakt, tenze s kolegy
    const moodNow=w.mood==null?MOOD_NEUTRAL:w.mood;
    let moodTarget=(NPC_ROSTER.find(n=>n.id===w.npcId)?.mood??MOOD_NEUTRAL)+Math.round((mor-50)*0.3);
    if(newFat>0.7) moodTarget-=15; else if(newFat>0.4) moodTarget-=5;
    if(!hasFood) moodTarget-=10;
    if(newUnpaid>0) moodTarget-=Math.min(25,10+newUnpaid);
    if(contractActive) moodTarget+=5;
    if(w.npcId==="npc_foukac3"&&bondActive(p,"npc_foukac2","npc_foukac3")) moodTarget-=10;   // tenze Hanns × Josef: -10 nálady
    const newMood=clamp(Math.round(moodNow+(moodTarget-moodNow)*0.3),0,100);
    // Incidenty: nehoda v kole (pivo, zamrzlý náhon) nebo začátek přepracování (únava přes 80 %)
    const overworkStart=newFat>0.8&&!isIdle&&!isWerkstat&&(w.fat||0)<=0.8;
    const newIncidents=(w.incidents||0)+(incidentIds.has(w.id)?1:0)+(overworkStart?1:0);
    const healthPenalty=newHealth<50?0.15:newHealth<30?0.3:0;
    return{...w,task:newTask,fat:newFat,mood:newMood,incidents:newIncidents,xp:newLv>w.lv?0:newXp,lv:newLv,
      traits:newTraits,
      health:Math.round(newHealth),loyalty:Math.round(newLoyalty),
      unpaidDebt:newUnpaid,mentorId:newMentorId,mentorRounds:newMentorRounds,
      contract:newContract,seasonsInFoundry:newSeasonsInFoundry};
  }).filter(Boolean);

  const nr=round+1;
  const isLastRound=nr>=ROUNDS;

  // Sestavit toast a kronikový zápis
  const prodLines=[], ecoLines=[], evtLines=[];
  if(isC&&tW>p.tW)prodLines.push(`🔥 ${tW-p.tW}× ${L==="cs"?"waldglas uvařeno":"waldglas melted"}`);
  if(isC&&tC>p.tC)prodLines.push(`✨ ${tC-p.tC}× ${L==="cs"?"křišťál uvařen":"crystal melted"}`);
  if(isC&&fA)prodLines.push(`${L==="cs"?"Pec":"Furnace"}: ${zone(fT).l} ${fT}% · eff ${Math.round(calcFurnaceEff(furnace,pQ)*100)}%`);
  const crewDebtNow=wk.reduce((s,w)=>s+(w.unpaidDebt||0),0)+claimsTotal({exCrewClaims:[...(p.exCrewClaims||[]),...newClaims]});
  ecoLines.push(`💰 ${grose}g`+(debt>0?` · ${L==="cs"?"dluh Weissovi":"debt to Weiss"} ${debt}g`:"")+(crewDebtNow>0?` · ${L==="cs"?"dluh partě":"crew debt"} ${crewDebtNow}g`:""));
  ecoLines.push(`💸 ${L==="cs"?"mzdy":"wages"} ${wagesPaid}g${wagesDeficit>0?` · ⚠️ ${L==="cs"?"nezaplaceno":"unpaid"} ${wagesDeficit}g`:""} · ${L==="cs"?"pivo":"beer"} ${bCost}g`+(dPay?` · ${L==="cs"?"dluh":"debt"} -${dPay}g`:""));
  const logAdditions=buildChronicleEntry(round,isP,L,prodLines,ecoLines,evtLines);

  // Produkce tohoto kola (musí se spočítat PŘED Object.assign — potom je p===G a rozdíl by byl 0)
  const prodW=tW-p.tW, prodC=tC-p.tC;
  const newContractsDone=done-(p.done||0);

  // Produkce tohoto kola pro monthly summary (řez logu od začátku kola; p.workers je tu ještě původní seznam)
  const roundProdLines=log.slice(roundLogStart).filter(l=>l.startsWith("__PROD__")).map(l=>l.replace("__PROD__",""));
  const roundWorkerNames=p.workers.map(w=>w.name+":");
  const roundWorkerProd=roundProdLines.filter(l=>roundWorkerNames.some(n=>l.includes(n)));
  const roundReadyLine=roundProdLines.find(l=>l.includes("pánev dozrálo")||l.includes("crucible ready"));
  const roundNewPanve=roundReadyLine?(parseInt((roundReadyLine.match(/(\d+)×/)||[])[1],10)||0):0;

  Object.assign(G,{
    round:nr, res:r, log:[...log,...logAdditions], morale:mor, forest, grose, debt,
    pReady:pR, pAging:pA, pUses:pU>0?pU:(pR>0?PANEV_DUR:0), panevQuality:pQ,
    furnSlotPanev:slotPanev,
    furnace, fTemp:fT, fActive:fA,
    waldglas:wg, crystal:cr, mBonus:mB,
    tW, tC, tQS, tQN, done, contracts:con, repContracts:newRepCon, workers:wk, shop:genShop(),
    activeBatches:newActiveBatches,
    furnSlotConfig:p.furnSlotConfig,
    reforestWorkers:(G.reforestWorkers||0)+reforestCount,
    unlockedRecipes:unl,
    formyAging:[], // formy jsou okamžité — queue vždy prázdná
    summary:{
      wages, wagesPaid, wagesDeficit, bCost, dPay,
      mDelta:mor-p.morale, fCut:p.forest-forest,
      fEff:Math.round(calcFurnaceEff(furnace,pQ)*100),
      groseDelta:grose-p.grose,
      groseAfter:grose, debtAfter:debt,
      workerWages:[...workerWages],
      contractIncome:contractIncomeTick,
      prodW, prodC, newPanve:roundNewPanve,
      furnTemp:(fA?fT:null),
      workerProd:roundWorkerProd
    },
    events:evts.slice(1), curEvt:evts[0]||null,
    debtMoratorium:p.debtMoratorium||0,
    exCrewClaims:[...(p.exCrewClaims||[]),...newClaims],
    totalDone:(G.totalDone||0)+newContractsDone,
    totalW:(G.totalW||0)+prodW, totalC:(G.totalC||0)+prodC,   // celoherní součty (tW/tC/tQS/tQN/done jsou jen sezónní)
    totalBatches:(G.totalBatches||0)+(prodW+prodC>0?1:0),
    failureReason:wk.length===0?"abandoned":((debt>=160&&grose<=0&&wk.length<=1&&wg.length===0&&cr.length===0)||(debt>=180&&grose<=0)?"foreclosure":(furnace.shamotWear>=100&&pR===0&&pA.length===0&&r.clay<4&&grose<8?"ruined":null)),
    failureStats:(wk.length===0||((debt>=160&&grose<=0&&wk.length<=1&&wg.length===0&&cr.length===0)||(debt>=180&&grose<=0))||(furnace.shamotWear>=100&&pR===0&&pA.length===0&&r.clay<4&&grose<8))?{
      season:p.season, round:nr,
      batches:(G.totalBatches||0)+(prodW+prodC>0?1:0),
      sold:(G.totalSold||0),
      contracts:(G.totalDone||0)+newContractsDone,
      debtPaid:(G.totalDebtPaid||0)+dPay,
      maxFama:Math.max(p.fama?.church||0, p.fama?.noble||0, p.fama?.trade||0)
    }:null,
    phase:(wk.length===0||((debt>=160&&grose<=0&&wk.length<=1&&wg.length===0&&cr.length===0)||(debt>=180&&grose<=0))||(furnace.shamotWear>=100&&pR===0&&pA.length===0&&r.clay<4&&grose<8))
      ?"game_over"
      :(evts[0]?"event":(isLastRound?"interseasonPhase":"summary"))
  });
  checkAchievements();

  autoSave();
  Fx.render();
}

