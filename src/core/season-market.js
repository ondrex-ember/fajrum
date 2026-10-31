function startNewSeason(){
  const p=G;
  const newSeason=p.season+1;
  const newContracts=freshContracts(p);

  // Náklady na sklad: 1g za každý kus skla přeneseného do nové sezóny
  const blownStored=BLOWN_TYPES.reduce((s,k)=>s+(p[k]?.length||0),0);
  const groundStored=GROUND_TYPES.reduce((s,k)=>s+(p[k]?.length||0),0);
  const engraveStored=ENGRAVE_INPUTS.reduce((s,k)=>s+(p["rytina_"+k]?.length||0),0);
  const newColourStored=Object.keys(FajrumCatalog.blown).reduce((sum,key)=>sum+(BLOWN_ITEMS[key].inputs||[]).filter(c=>c!=="waldglas").reduce((n,c)=>n+(p[key+"_"+c]?.length||0),0),0);
  const newSpecialStored=Object.keys(FajrumCatalog.special).reduce((sum,key)=>sum+(p[key]?.length||0),0);
  const storedItems=p.waldglas.length+p.crystal.length+blownStored+groundStored+engraveStored+newColourStored+newSpecialStored;
  const storageCost=storedItems*STORAGE_COST_PER_ITEM;
  const newGrose=Math.max(0,p.grose-storageCost);

  // Kronika se přenáší, přidáme hlavičku nové sezóny
  const oldLog=[...p.log];
  oldLog.push(`__SEASON__${newSeason}·${1679+newSeason}`);
  if(storedItems>0){
    oldLog.push(`__ECO__🏭 ${p.lang==="cs"?`Sklad: ${storedItems}× skla přeneseno, náklad ${storageCost}g`:`Storage: ${storedItems}× glass carried over, cost ${storageCost}g`}`);
  }

  // Reputační zakázky přenesené z minulé sezóny: termín je v absolutních kolech, nová sezóna začíná kolem 0
  // → posunout o ROUNDS; co je po termínu, propadá hned (s postihem reputace), ne až "nikdy".
  const famaNew={...(p.fama||{church:0,noble:0,trade:0})};
  const repCarried=[];
  (p.repContracts||[]).forEach(rc=>{
    const nd=(rc.due||0)-ROUNDS;
    if(nd>=0){repCarried.push({...rc,due:nd});return;}
    famaNew[rc.cat]=Math.max(0,(famaNew[rc.cat]||0)+(rc.isEndgame?EG_FAMA_LOSS:REP_FAMA_LOSS));
    oldLog.push(`__EVT__⭐ ${p.lang==="cs"?(rc.isEndgame?"ENDGAME zakázka propadla":"Reputační zakázka propadla")+" — termín vypršel s koncem sezóny":(rc.isEndgame?"ENDGAME contract expired":"Rep contract expired")+" — deadline passed at season end"} (${FAMA_ICON[rc.cat]||""})`);
  });

  G._contractModalPending=true;
  // Sezónní statistiky (skóre sezóny) se s novou sezónou nulují; celoherní součty zůstávají v totalW/totalC/totalDone.
  // Staré savy: tW/tC byly dosud kumulativní → převedeme je do celoherních součtů.
  const carryTotalW=Math.max(G.totalW||0,G.tW||0), carryTotalC=Math.max(G.totalC||0,G.tC||0);
  Object.assign(G,{
    season:newSeason,
    round:0,
    tW:0, tC:0, tQS:0, tQN:0, done:0, totalW:carryTotalW, totalC:carryTotalC,
    phase:"playing",
    interseason:null,
    // sklo se přenáší, jen nedozrálé pánve propadají
    waldglas:[...p.waldglas],
    crystal:[...p.crystal],
    // Foukané základní + barevné varianty
    ...Object.fromEntries(BLOWN_TYPES.map(k=>[k,[...(p[k]||[])]])),
    ...Object.fromEntries(BLOWN_TYPES.flatMap(k=>
      (BLOWN_ITEMS[k].inputs||[]).filter(c=>c!=="waldglas").map(c=>{
        const sk=k+"_"+c; return [sk,[...(p[sk]||[])]];
      })
    )),
    ...Object.fromEntries(Object.keys(SPECIAL_ITEMS).map(k=>[k,[...(p[k]||[])]])),
    // Broušené a rytiny přeneseny
    ...Object.fromEntries(GROUND_TYPES.map(k=>[k,[...(p[k]||[])]])),
    ...Object.fromEntries(ENGRAVE_INPUTS.map(k=>["rytina_"+k,[...(p["rytina_"+k]||[])]])),
    pAging:[],
    contracts:[], avail:newContracts,
    // Pravidelné dodávky po endgame — generovat pro každou splněnou kategorii
    repContracts:(()=>{
      const carried=[...repCarried];
      const eg=p.endgame||{};
      ["church","noble","trade"].forEach(cat=>{
        if(!eg[cat]) return; // endgame nesplněn
        const deliveries=REGULAR_DELIVERIES[cat]||[];
        deliveries.forEach(tmpl=>{
          // Přidej pokud ještě není aktivní
          if(!carried.some(r=>r.id===tmpl.id)){
            carried.push({
              ...tmpl,
              cat,
              due: 8, // termín v kolech nové sezóny
              isRegular: true
            });
          }
        });
      });
      return carried;
    })(),
    fama:famaNew, // fama přetrvává (po případném postihu za propadlé zakázky)
    endgame:{...(p.endgame||{church:false,noble:false,trade:false})},
    shop:genShop(),
    morale:clamp(p.morale+5,30,100),
    fActive:(p.seasonTier||0)>=3,
    fTemp:(p.seasonTier||0)>=3 ? Math.max(72, p.fTemp||75) : 0,
    quickSellUsed:false, // reset na začátku každé sezóny
    grose:newGrose,
    log:oldLog
  });
  Fx.render();
}

// ── SKÓRE ───────────────────────────────────────────────────
function calcSeasonScore(){
  const p=G;
  return{
    waldglas:p.tW*5,
    crystal:p.tC*15,
    quality:p.tQN?Math.round((p.tQS/p.tQN)*10):0,
    contracts:p.done*20,
    grose:Math.round(p.grose*1.5),
    debt:Math.max(0,(50-p.debt-totalWorkerDebt())*2),   // skóre počítá oba závazky: Weiss + parta
    morale:Math.round(p.morale*.8),
    forest:p.forest*3,
    furnaceRunIn:Math.round(p.furnace.runIn*.5)
  };
}
function totalScore(sc){return Object.values(sc).reduce((a,b)=>a+b,0);}

// ── AKCE ────────────────────────────────────────────────────
function marketSalePrices(){
  // Ceny: základní suroviny + foukané (s color multiplikátorem) + broušené + rytiny
  const basePrices={waldglas:3.5,crystal:9,jantar:10,zlut:30,modra:14,smaragd:16,lattimo:22,rubin:50};
  // Foukané — základní (waldglas) a barevné varianty
  Object.entries(BLOWN_ITEMS).forEach(([k,v])=>{
    basePrices[k]=v.base; // waldglas verze
    v.inputs.forEach(col=>{
      if(col!=="waldglas"){
        const stateKey=k+"_"+col;
        basePrices[stateKey]=Math.round(v.base*COLOR_MULT[col]);
      }
    });
  });
  // Broušené
  Object.entries(GROUND_ITEMS).forEach(([k,v])=>{basePrices[k]=v.base;});
  // Rytiny — motiv basic = ×1.4, ostatní dle ENGRAVE_MOTIFS
  ENGRAVE_INPUTS.forEach(k=>{
    const srcBase=GROUND_ITEMS[k]?.base||basePrices[k]||10;
    basePrices["rytina_"+k]=Math.round(srcBase*engraveBonus(k));
  });
  Object.entries(SPECIAL_ITEMS).forEach(([key,it])=>{basePrices[key]=it.base;});
  // Okenní sklo a speciální výrobky
  basePrices["tercik"]=6;
  basePrices["tercik_vyplne"]=2;
  basePrices["tercik_zebrovy"]=9;
  basePrices["zrcadlo"]=65;
  basePrices["alembik"]=55;
  basePrices["holba"]=12;
  basePrices["kutrolf"]=28;
  basePrices["kutrolf_waldglas"]=18;
  basePrices["stangenglas"]=22;
  basePrices["pateriky"]=2;
  basePrices["pateriky_modra"]=4;
  basePrices["pateriky_smaragd"]=5;
  basePrices["pateriky_lattimo"]=6;
  return basePrices;
}
function marketSaleQuote(type,n){
  // Read-only quote. Selling and the market display use the same prices and rounding.
  const inv=[...(G[type]||[])];
  const cnt=Math.min(n,inv.length);
  inv.sort((a,b)=>b-a);
  const selling=inv.slice(0,cnt),rest=inv.slice(cnt);
  const hasObchodnik=G.workers.some(w=>w.traits?.includes("obchodnik"));
  const bp=marketSalePrices()[type]||3.5;
  const isVelmistr=getTomislavRank(G)==="velmistr";
  const easyPriceMult = G.difficulty === "easy" ? 1.20 : 1.0;
  const mul=(G.mBonus?1.5:1)*(hasObchodnik?1.1:1)*(isVelmistr?1.05:1)*easyPriceMult;
  const total=selling.reduce((s,q)=>s+Math.max(1, Math.round(q*bp*mul)),0);
  return {count:cnt,total,rest,base:bp,multiplier:mul};
}
// Display name of an inventory key for the chronicle (never the raw key): blown (+colour), ground, engraved, stained, special, colour glass.
function logItemName(key,lang){
  const cs=(lang||G.lang)==="cs";
  if(key==="waldglas")return"waldglas";
  if(key==="crystal")return cs?"křišťál":"crystal";
  const nm=it=>it?(cs?it.cs:it.en):null;
  if(key.startsWith("rytina_"))return logItemName(key.slice(7),lang)+(cs?" (rytina)":" (engraved)");
  const direct=nm(BLOWN_ITEMS[key])||nm(GROUND_ITEMS[key])||nm(STAINED_ITEMS[key])||nm(COLORED_ENGRAVE_ITEMS[key])||nm(SPECIAL_ITEMS[key])||nm(COLOR_RECIPES[key]);
  if(direct)return direct;
  for(const k of BLOWN_TYPES){
    if(key.startsWith(k+"_")){const col=key.slice(k.length+1);return nm(BLOWN_ITEMS[k])+(COLOR_ICON[col]?" "+COLOR_ICON[col]:"");}
  }
  return key;
}
// Sale / engraving log lines carry the raw inventory key (the achievements read them); the chronicle shows the item name instead.
function chronShow(entry){
  return entry
    .replace(/^(__ECO__💰 \d+× )([a-z_]+)( → )/,(m,a,k,b)=>a+logItemName(k)+b)
    .replace(/^(__PROD__✂️ [^:]+: (?:rytina na|engraved) )([a-z_]+)( )/,(m,a,k,b)=>a+logItemName(k)+b);
}
function sellItems(type,n){
  if(!G[type].length)return;
  const md=MONTH_DATA[G.round];
  if(MARKET_CLOSED[G.round]){
    G.log.push(`__EVT__⛔ ${G.lang==="cs"?md.trh_cs:md.trh_en}`);
    Fx.render(); return;
  }
  const {count:cnt,total,rest}=marketSaleQuote(type,n);
  G[type]=rest; G.grose+=total;
  G.totalSold=(G.totalSold||0)+cnt;
  G.log.push(`__ECO__💰 ${cnt}× ${type} → ${total}g`);
  checkAchievements();
  Fx.render();
}
function buyItem(k){
  const it=G.shop[k];if(!it||it.stock<=0||G.grose<it.price)return;
  it.stock--; G.grose-=it.price; G.res[k]=(G.res[k]||0)+1;
  G.log.push(`__ECO__🛒 ${merchName(k,G.lang)} → -${it.price}g`);
  Fx.sound("coin", 0.5);
  Fx.float(`-${it.price}g 🛒`, null, "neg");
  Fx.render();
}
