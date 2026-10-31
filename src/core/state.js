const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const zone=t=>ZONES.find(z=>t<=z.max)||ZONES[7];
const stars=q=>{const n=Math.max(0,Math.min(5,Math.round(q||0)));return"★".repeat(n)+"☆".repeat(5-n);};
const tAcc=t=>{const d=Math.abs(t-76);return Math.max(0,1-d/40);};
const qRoll=(ta,wl,mor,pq)=>clamp(Math.round(ta*2+wl*.6+(mor/100)+pq*.4+(Math.random()-.3)*1.5),1,5);

// Výpočet účinnosti pece — srdce v4
function calcFurnaceEff(furnace, panevQuality){
  const ft=FURNACE_TYPES[furnace.type];
  const runInNorm=furnace.runIn/ft.maxRunIn; // 0..1
  const shamotBonus=furnace.shamotWear<30?EFF_SHAMOT:(furnace.shamotWear<60?EFF_SHAMOT*.5:0);
  const eff=EFF_BASE+(runInNorm*EFF_RUNIN)+((panevQuality/5)*EFF_PANEV)+shamotBonus;
  return Math.min(eff, 0.92); // hard cap
}

// Sestavit literární zápis do kroniky
function buildChronicleEntry(round, isP, L, productionLines, economyLines, eventLines){
  const ms=L==="cs"?MONTHS_CS:MONTHS_EN;
  const lines=[];
  const prepTexts=L==="cs"?CHRON_PREP_CS:CHRON_PREP_EN;
  const campTexts=L==="cs"?CHRON_CAMP_CS:CHRON_CAMP_EN;
  const flavor=isP?prepTexts[round%prepTexts.length]:campTexts[(((round-4)%campTexts.length)+campTexts.length)%campTexts.length]; // kampaň může začít před kolem 4 (vyšší tier) → záporný index

  // Humorné příhody — šance závisí na pivu
  const beerLvl=G?.beer||0;
  const beerChance=[0.05,0.15,0.30,0.50][Math.min(beerLvl,3)];
  const roll=Math.random();
  let humorLine=null;
  if(roll<beerChance){
    const r2=Math.random();
    if(r2<0.4){
      const hi=Math.floor(Math.random()*CHRON_HUMOR_CS.length);
      const h=L==="cs"?CHRON_HUMOR_CS[hi]:CHRON_HUMOR_EN[hi];
      humorLine=`__FLAVOR__😄 ${h}`;
    }else if(r2<0.7){
      const ev=CHRON_HUMOR_BAD[Math.floor(Math.random()*CHRON_HUMOR_BAD.length)];
      humorLine=`__FLAVOR__🍺😬 ${L==="cs"?ev.cs:ev.en}`;
      if(G){
        if(ev.effect==="morale")G.morale=Math.max(0,G.morale+ev.val);
        else if(ev.effect==="panev")G.pReady=Math.max(0,G.pReady+ev.val);
        else if(ev.effect==="potash")G.res.potash=Math.max(0,G.res.potash+ev.val);
        else if(ev.effect==="charcoal")G.res.charcoal=Math.max(0,G.res.charcoal+ev.val);
        else if(ev.effect==="sand")G.res.sand=Math.max(0,G.res.sand+ev.val);
        else if(ev.effect==="varka")G.waldglas=G.waldglas.slice(0,Math.max(0,G.waldglas.length+ev.val));
      }
    }else{
      const ev=CHRON_HUMOR_GOOD[Math.floor(Math.random()*CHRON_HUMOR_GOOD.length)];
      humorLine=`__FLAVOR__🍺😄 ${L==="cs"?ev.cs:ev.en}`;
      if(G){
        if(ev.effect==="morale")G.morale=Math.min(100,G.morale+ev.val);
        else if(ev.effect==="wood")G.res.wood+=ev.val;
        else if(ev.effect==="clay")G.res.clay+=ev.val;
        else if(ev.effect==="grose")G.grose+=ev.val;
      }
    }
  }
  // Správné pořadí: měsíc → produkce → ekonomika → eventy → atmosféra
  lines.push(`__MONTH__${ms[round]}`);
  productionLines.forEach(l=>lines.push(`__PROD__${l}`));
  economyLines.forEach(l=>lines.push(`__ECO__${l}`));
  eventLines.forEach(l=>lines.push(`__EVT__${l}`));
  lines.push(`__FLAVOR__${flavor}`);
  if(humorLine) lines.push(humorLine);
  return lines;
}

function genShop(){
  const s={};
  Object.entries(MERCH).forEach(([k,v])=>{
    s[k]={...v,stock:2+Math.floor(Math.random()*3),price:v.b+Math.floor(Math.random()*2)};
  });
  return s;
}

// Nabídka zakázek na začátek sezóny. Nelosují se zakázky, které nelze reálně splnit:
// bez dostatečné zásoby musí termín nechat dost kol kampaně na výrobu (pec v přípravě netaví).
// waldglas: ~2 ks/kolo, křišťál: ~1 ks/kolo (vlastní receptura: čistý písek + čistá potaš + vápenec).
function contractFeasible(c,st){
  if(c.item!=="waldglas"&&c.item!=="crystal")return true;
  const have=st&&Array.isArray(st[c.item])?st[c.item].length:0;
  if(have>=c.qty)return true;
  const tier=(st&&st.seasonTier)||0;
  let firstProd=0; while(firstProd<ROUNDS&&!isCampaignMonth(firstProd,tier))firstProd++;
  const roundsLeft=c.due-firstProd+1;
  const need=c.item==="crystal"?c.qty:Math.max(1,Math.ceil(c.qty/2));
  return roundsLeft>=need;
}
function freshContracts(st){
  const pool=CONTRACT_POOL.filter(c=>contractFeasible(c,st));
  return [...pool].sort(()=>Math.random()-.5).slice(0,3);
}

let G;
function initState(){
  return{
    phase:"intro", lang:"cs",
    season:1, round:0,
    grose:65, debt:40, morale:65, beer:1,
    _dm:2, exCrewClaims:[], // _dm = verze účetního modelu dluhů (2 = dluh partě odděleně od Weisse); exCrewClaims = pohledávky bývalých zaměstnanců [{id,name,npcId,amount,season,round,reason}]
    debtMoratorium:0, totalDone:0, totalW:0, totalC:0, failureReason:null, failureStats:null,
    forest:INIT_FOREST, forestMax:INIT_FOREST,
    seasonTier:0, noblePrivilege:false,
    res:{wood:50,sand:20,limestone:15,potash:8,water:15,clay:10,shamot:10,food:12,charcoal:0,pureSand:0,refinedPotash:0,formy:0,stone:0,dryWood:0,firebrick:0,pitch:0},
    // Přísady pro barevné sklo (historické dle Neriho a Kunckela)
    additives:{smolka:0,burel:0,aesUstum:0,crocusMartis:0,cin:0,olovo:0,antimon:0,zlato:0,rtut:0,stribro:0,arsen:0},
    // Sklady barevného skla
    jantar:[], zlut:[], modra:[], smaragd:[], lattimo:[], rubin:[], rubin_raw:[], // rubin_raw = bezbarvý polotovar čekající na náběh
    // Odemčené recepty (získávají se od Baranovského nebo výzkumem)
    unlockedRecipes:["jantar"], // jantar je dostupný od začátku — přirozená barva lesní huti
    furnSlotConfig:["waldglas","waldglas","waldglas","waldglas"], // hráč volí typ pro každý slot
    furnAtm:["ox","ox","ox","ox"], // atmosféra pánve: "ox" oxidační (čiré sklo) | "red" redukční (jantar, zakouřené sklo)
    _arsenFined:false, // arsen už jednou použit k čeření (achievement Čeřič arsenem)
    _cerenBonus:0, // uložený bonus kvality příští dávky křišťálu (čeření burelem), max 2
    _activeColorRecipe:null, // aktuálně vybraná barva skloviny v pánvi (co JE v pánvi)
    _nextColorRecipe:null,   // příští várka — co hráč vybral (změní se při prázdné pánvi)
    activeBatches:[], // [{slot:0, type:"waldglas"|"crystal"|"modra"|..., color:meltColorObj}]
    _strikeQueue:null, // pending rubín strike — {q, chance, tempAtStrike}
    // Baranovský — aktuální nabídka
    baranOffer:null,
    wa:{fuel:50,potash:30,build:20},
    // Pánve s kvalitou
    pReady:2, pAging:[], pUses:PANEV_DUR, panevQuality:2,
    furnSlotPanev:null, // per-slot pánve: [{uses,quality}|null,...] inicializuje se při kampani
    formyAging:[], // legacy — formy jsou nyní okamžité
    // Pec jako živý objekt
    furnace:{type:"primitive",runIn:0,shamotWear:0,age:0},
    ...Object.fromEntries(BLOWN_TYPES.flatMap(k=>[[k,[]],...(BLOWN_ITEMS[k].inputs||[]).filter(c=>c!=="waldglas").map(c=>[k+"_"+c,[]])])),
    ...Object.fromEntries(GROUND_TYPES.map(k=>[k,[]])),
    ...Object.fromEntries(Object.keys(SPECIAL_ITEMS).map(k=>[k,[]])),
    waldglas:[], crystal:[],
    // Foukané — okenní sklo
    tercik:[], tercik_vyplne:[], tercik_zebrovy:[],
    // Speciální výrobky
    zrcadlo:[], alembik:[],
    // Nové v7.9
    holba:[], kutrolf:[], kutrolf_waldglas:[], stangenglas:[],
    pateriky:[], pateriky_modra:[], pateriky_smaragd:[], pateriky_lattimo:[],
    // Nové v8
    mucholapka:[], konvice:[], konvice_modra:[], konvice_smaragd:[],
    // Foukané — základní (waldglas vstup)
    cise:[], dzban:[], pullitr:[], romer:[], misa:[], dzban_forma:[],
    banka:[], spunt:[], ozdoba:[],
    // Foukané — crystal vstup
    pohar:[], dekantr:[], romer_krist:[], kalamar:[],
    tezitko:[], vaza_dekor:[],
    // Foukané — dekor waldglas
    koule:[], pucmeloun:[],
    // Foukané — barevné varianty (suffix _barva)
    cise_modra:[], cise_smaragd:[], cise_rubin:[],
    dzban_modra:[], dzban_smaragd:[],
    pohar_modra:[], pohar_smaragd:[], pohar_rubin:[],
    dekantr_modra:[],
    koule_lattimo:[], tezitko_lattimo:[], pucmeloun_lattimo:[],
    vaza_dekor_lattimo:[], vaza_dekor_modra:[],
    romer_crystal:[],
    // Broušené výrobky
    brus_hrana_cise:[], brus_hrana_panel:[], brus_koule:[], brus_tezitko:[],
    brus_lustr_dil:[], brus_pokal:[],
    brus_vaza:[], brus_vaza_velka:[], brus_misa:[], brus_poharak:[],
    // Rytiny (prefix rytina_)
    rytina_brus_hrana_cise:[], rytina_brus_pokal:[],
    rytina_brus_vaza:[], rytina_brus_vaza_velka:[],
    rytina_brus_poharak:[], rytina_pohar:[], rytina_dekantr:[], rytina_cise:[], rytina_zlut:[],
    rytina_cise_modra:[], rytina_cise_smaragd:[], rytina_pohar_modra:[], rytina_pohar_smaragd:[], rytina_dekantr_modra:[],
    fTemp:0, fActive:false,
    workers:[
      {...NPC_ROSTER[0], id:"w1", npcId:NPC_ROSTER[0].id, task:"potash",  xp:0, fat:0, seasonsInFoundry:0, incidents:0, contract:null},
      {...NPC_ROSTER[1], id:"w2", npcId:NPC_ROSTER[1].id, task:"logging", xp:0, fat:0, seasonsInFoundry:0, incidents:0, contract:null},
      {...NPC_ROSTER[6], id:"w3", npcId:NPC_ROSTER[6].id, task:"potash",  xp:0, fat:0, seasonsInFoundry:0, incidents:0, contract:null},
      {...NPC_ROSTER[2], id:"w4", npcId:NPC_ROSTER[2].id, task:"panev",   xp:0, fat:0, seasonsInFoundry:0, incidents:0, contract:null},
      {...NPC_ROSTER[7], id:"w5", npcId:NPC_ROSTER[7].id, task:"idle",    xp:0, fat:0, seasonsInFoundry:0, incidents:0, contract:null}],
      // Jirka Formař je v teamu od začátku ale nastupuje aktivně v březnu (kolo 4)
    shop:genShop(), mBonus:false,
    contracts:[], avail:freshContracts(), done:0,
    fama:{church:0, noble:0, trade:0},
    debtReputation:0, // 0–100: splácení dluhu zlepšuje podmínky půjček u Weisse
    totalDebtPaid:0,  // celkem splaceno (tracking)
    quickSellUsed:false, // rychlý výkup — jednou za sezónu
    endgame:{church:false, noble:false, trade:false},
    repContracts:[], // aktivní reputační zakázky (opravné + endgame dodávky)
    // Multi-sezóna stats
    totalWaldglas:0, totalCrystal:0, totalGrose:0,
    tW:0, tC:0, tQS:0, tQN:0,
    // Hráčské statistiky (Deník)
    totalBatches:0, totalSold:0, totalCracks:0,
    log:[`__SEASON__1·1680`], events:[], curEvt:null, summary:null, interseason:null,
    trhuNPC:[],
    tab:"overview", help:false, showUpgrade:false,
    _partaDetail:null, _partaSubtab:"profil",
    _retentionPending:[], // [workerId,...] — čeká na retention modal
    _loyaltyModalPending:false,
    huteName:"", // Jméno hutmistra — zadá uživatel
    audio:{enabled:true,volume:0.7,musicEnabled:false,musicVolume:0.5,masterVolume:0.8,muted:false},
    firstVisit:true, // welcome modal po prvním vstupu
    difficulty:"normal", // "normal" nebo "easy"
    achievements:[],    // pole splněných achievement ID
    wikiDiscovered:[]   // pole odemčených wiki témat
  };
}

