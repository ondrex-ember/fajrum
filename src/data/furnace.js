// furnace.js — furnace types, efficiency, upgrades, season tiers, zones, beer, colour-glass recipes.
// Verbatim data moved out of core/ (no logic). Classic script: plain top-level consts in the shared global scope; load order is fixed by build.js.

// Účinnost pece: 0.3 (nová) → 0.9 (zaběhnutá + dobrá pánev)
// furnaceEff = 0.35 + (runIn/100 * 0.35) + (panev_quality/5 * 0.2) + (shamotBonus)
const EFF_BASE=0.35, EFF_RUNIN=0.35, EFF_PANEV=0.20, EFF_SHAMOT=0.10;

const FURNACE_TYPES={
  primitive:{name:"Primitivní pec",nameEn:"Primitive furnace",maxRunIn:60,maxTemp:87,fuelMult:1.0, maxSlots:1},
  stone:    {name:"Zděná pec",    nameEn:"Stone furnace",    maxRunIn:85,maxTemp:92,fuelMult:0.85, maxSlots:2},
  master:   {name:"Mistrovská pec",nameEn:"Master furnace",  maxRunIn:100,maxTemp:99,fuelMult:0.70, maxSlots:4}
};
const UPGRADE_COST={stone:{wood:20,limestone:8,clay:6,grose:15},master:{wood:30,limestone:12,clay:10,grose:40}};

// ── ROZŠÍŘENÍ SEZÓNY A STAVEBNÍ TIERS ─────────────────────────
const SEASON_TIERS={
  0:{
    tier:0,
    name_cs:"Tradiční lesní kampaň",
    name_en:"Traditional Forest Season",
    desc_cs:"Tavení pouze od sv. Jiří (duben) do sv. Havla/Martina (říjen). 7 měsíců tavby, 5 měsíců zimního klidu.",
    desc_en:"Smelting only from St. George (April) to St. Gall/Martin (October). 7 months melting, 5 months winter prep.",
    months_cs:"Duben – Říjen (7 měsíců)",
    months_en:"April – October (7 months)",
    badge:"Tier 0",
    icon:"🪵",
    reqFurnace:"primitive",
    cost:{},
    benefit_cs:"Základní provoz huti dle starých cechovních zvyklostí.",
    benefit_en:"Basic foundry schedule under traditional customs."
  },
  1:{
    tier:1,
    name_cs:"Zastřešená huť & Podzimní kampaň (Listopad)",
    name_en:"Roofed Foundry & Autumn Campaign (November)",
    desc_cs:"Krytá sušárna bukového dříví a kamenná podezdívka prodlužují tavbu přes celý Listopad (+1 měsíc). Umožňuje splnit předvánoční jarmarky a prodat zboží před příchodem závějí.",
    desc_en:"Covered hardwood drying shed and stone foundation extend melting through November (+1 month). Fulfill lucrative pre-Christmas orders.",
    months_cs:"Duben – Listopad (8 měsíců)",
    months_en:"April – November (8 months)",
    badge:"Tier 1",
    icon:"🪨",
    reqFurnace:"stone",
    cost:{stone:15,wood:20,clay:8,grose:25},
    benefit_cs:"+1 měsíc tavby (Listopad) · Prodej před zimou · Těžba lomového kamene v Lůmku",
    benefit_en:"+1 month smelting (November) · Pre-winter sales · Quarry stone mining"
  },
  2:{
    tier:2,
    name_cs:"Panské privilegium & Jarní předtápění (Březen)",
    name_en:"Noble Privilege & Early Spring Smelting (March)",
    desc_cs:"Vrchnostenský glejt od hejtmana/opata a temperační pec na suché dříví umožňují roztopit huť již v Březnu (+1 měsíc). Huť má náskok před veškerou konkurencí v celém kraji.",
    desc_en:"Noble charter from the governor/abbot and dry-wood tempering kiln allow lighting as early as March (+1 month). Edge over regional rivals.",
    months_cs:"Březen – Listopad (9 měsíců)",
    months_en:"March – November (9 months)",
    badge:"Tier 2",
    icon:"📜",
    reqFurnace:"stone",
    reqTier:1,
    reqFama:40,
    cost:{stone:20,dryWood:12,grose:45},
    benefit_cs:"Kampaň začíná již v Březnu (9 měsíců tavby) · Prémiové jarní zakázky · Možnost sušit buková polena",
    benefit_en:"Campaign begins in March (9 months smelting) · Premium spring contracts · Hardwood curing"
  },
  3:{
    tier:3,
    name_cs:"Celoroční císařská huť & Zimní tavba (12 měsíců)",
    name_en:"All-Year Imperial Glasshouse & Winter Smelting (12 Months)",
    desc_cs:"Zastřešený vodní náhon, šamotové žáruvzdorné kvádry a smůlová izolace. Pec hoří nepřetržitě všech 12 měsíců! Zima přináší boj se zámrzem stoup a prémiové dvorské zakázky.",
    desc_en:"Covered water flumes, refractory firebrick vaults, and pitch weatherproofing. Continuous 12-month operation with frost challenges & royal profits.",
    months_cs:"Celoroční provoz (12 měsíců)",
    months_en:"All-year continuous (12 months)",
    badge:"Tier 3",
    icon:"👑",
    reqFurnace:"master",
    reqTier:2,
    reqFama:60,
    cost:{stone:30,firebrick:10,dryWood:15,pitch:8,grose:85},
    benefit_cs:"12 měsíců nepřetržité tavby · Žádná ztráta zaběhnutí pece v mezisezóně · +25% prémie za zimní dodávky",
    benefit_en:"12 months continuous smelting · 100% furnace run-in retention · +25% winter contract bonus"
  }
};

const ZONES=[
  {max:10,l:"🟤",c:"#3a2a14"},{max:25,l:"🔴",c:"#8b2020"},{max:40,l:"🔴",c:"#cc3322"},
  {max:55,l:"🟠",c:"#dd6600"},{max:70,l:"🟡",c:"#ddaa00"},{max:82,l:"🟡",c:"#eebb22"},
  {max:92,l:"⚪",c:"#ffdd88"},{max:100,l:"⚪",c:"#ffffcc"}];
const BEER=[{m:-10,cost:0,acc:0},{m:5,cost:1,acc:0},{m:10,cost:2,acc:.1},{m:-8,cost:4,acc:.25}];

// ── NOVÉ SUROVINY — barevné sklo ─────────────────────────────
// Historické přísady dle Neriho (1612) a Kunckela (1679)
const ADDITIVES={
  smolka:   {cs:"Šmolka (Zaffre)",  en:"Zaffre (Cobalt)",    icon:"🔵", base:18, rare:true,
             desc_cs:"Surový oxid kobaltnatý — ze Saska. Základ modré.", desc_en:"Raw cobalt oxide from Saxony. Base of blue glass."},
  burel:    {cs:"Burel (MnO₂)",     en:"Burel (MnO₂)",       icon:"🟣", base:8,  rare:false,
             desc_cs:"Oxid manganičitý — odbarvovač i modifikátor barvy.", desc_en:"Manganese dioxide — decolorizer and color modifier."},
  aesUstum: {cs:"Pálená měď",       en:"Aes Ustum (Cu)",     icon:"🟢", base:12, rare:true,
             desc_cs:"Spálená měď v pomocné peci. Základ smaragdu.", desc_en:"Copper burnt in auxiliary furnace. Base of emerald green."},
  crocusMartis:{cs:"Crocus Martis", en:"Crocus Martis (Fe)", icon:"🟤", base:6,  rare:false,
             desc_cs:"Pražený síran železnatý — teplá zelená.", desc_en:"Roasted iron sulphate — warm green tone."},
  cin:      {cs:"Cín (Sn)",         en:"Tin (Sn)",            icon:"⚪", base:10, rare:false,
             desc_cs:"Čistý cín pro lattimo (mléčné sklo).", desc_en:"Pure tin for lattimo (milk glass)."},
  olovo:    {cs:"Olovo (Pb)",       en:"Lead (Pb)",           icon:"⬛", base:8,  rare:false,
             desc_cs:"Olovo pro lattimo a rubín — zvyšuje lesk.", desc_en:"Lead for lattimo and ruby — increases brilliance."},
  antimon:  {cs:"Antimon (Sb)",     en:"Antimony (Sb)",       icon:"🔘", base:14, rare:true,
             desc_cs:"Stabilizátor pro rubínové sklo (Kunckel).", desc_en:"Stabilizer for ruby glass (Kunckel)."},
  zlato:    {cs:"Zlatý prach (Au)", en:"Gold dust (Au)",      icon:"🟡", base:40, rare:true,
             desc_cs:"Zlato pro purpurový prášek (později zvaný Cassiův purpur) — základ rubínového skla.", desc_en:"Gold for the purple powder (later called purple of Cassius) — base of ruby glass."},
  stribro:  {cs:"Stříbro (Ag)",     en:"Silver (Ag)",         icon:"🪙", base:16, rare:true,
             desc_cs:"Chlorid nebo dusičnan stříbrný — v pastě s okrem dává povrchovou stříbrnou žluť (jantarovou lazuru).", desc_en:"Silver chloride or nitrate — in a paste with ochre it gives the surface silver stain (amber glaze)."},
  arsen:    {cs:"Arsen (As₂O₃)",  en:"Arsenic (As₂O₃)",     icon:"☠️", base:24, rare:true,
             desc_cs:"Arsenová běl (hutní mouka) z krušnohorských hutí. Nejúčinnější čeřidlo — dvě dávky bonusu najednou — ale jedovatá (únava taviče). Potřebná také na alembik.", desc_en:"White arsenic from the Ore Mountain smelters. The most effective fining agent — two bonus charges at once — but poisonous (smelter fatigue). Also needed for the alembic."},
  rtut:     {cs:"Rtuť (Hg)",        en:"Mercury (Hg)",        icon:"🩶", base:20, rare:true,
             desc_cs:"Amalgám rtuti a cínu — zadní strana zrcadla. Nutný import, nelze vyrobit na místě.", desc_en:"Mercury-tin amalgam — rear of mirror. Must be imported, cannot be produced locally."}
};

// Sklady barevného skla
// modra, smaragd, lattimo, rubin

// ── RECEPTURY BAREVNÉHO SKLA ─────────────────────────────────
// Zdroj: Neri 1612, Kunckel 1679
const COLOR_RECIPES={
  jantar:{
    cs:"Jantarové sklo (ve hmotě)", en:"Amber Glass (in the batch)",
    icon:"🟤", actMin:2,
    desc_cs:"Železo (Crocus Martis), síra z potaše a uhlík (uhlí) v redukční atmosféře vytvoří ferri-sulfidový chromofor — od medové po tmavohnědou. Levný užitkový jantar. Vyžaduje pánev v redukční atmosféře.",
    desc_en:"Iron (Crocus Martis), sulphur from the potash and carbon (charcoal) in a reducing atmosphere form a ferric-sulphide chromophore — from honey to dark brown. Cheap utility amber. Needs a crucible in reducing atmosphere.",
    inputs:{waldglas:2, crocusMartis:1, charcoal:1},
    atm:"red",
    output:"jantar", quality_bonus:0,
    furnaceMin:55,
    unlock_item:null, // dostupné vždy — přirozená barva lesních hutí
    sell_cs:10, sell_en:10,
    latin:"Fortuna vitrea est — tum cum splendet, frangitur"
  },
  modra:{
    cs:"Temná benátská modř", en:"Venetian Dark Blue",
    icon:"🔵", actMin:2,
    desc_cs:"Neri 1612: 60 liber frity + 1 libra šmolky + 2 unce burelu. Provařit 24 hodin.",
    desc_en:"Neri 1612: 60 lb frit + 1 lb zaffre + 2 oz burel. Brew 24 hours.",
    inputs:{crystal:2, smolka:1, burel:1},
    output:"modra", quality_bonus:0,
    furnaceMin:60, // min teplota %
    unlock_item:"smolka", // odemkne až Baranovský přiveze šmolku
    sell_cs:14, sell_en:14,
    latin:"In vase vitreo — kobaltová modrá",
    latinEn:"In vase vitreo — cobalt blue"
  },
  smaragd:{
    cs:"Smaragdová zeleň",   en:"Emerald Green",
    icon:"🟢", actMin:2,
    desc_cs:"Neri 1612: 100 liber křišťálu + 1¼ libry pálenky mědi + 2 unce Crocus Martis.",
    desc_en:"Neri 1612: 100 lb crystal + 1¼ lb Aes Ustum + 2 oz Crocus Martis.",
    inputs:{crystal:2, aesUstum:1, crocusMartis:1},
    output:"smaragd", quality_bonus:0,
    furnaceMin:65,
    unlock_item:"aesUstum",
    sell_cs:16, sell_en:16,
    latin:"Ignis mutat res — měď v ohni",
    latinEn:"Ignis mutat res — copper in the fire"
  },
  lattimo:{
    cs:"Mléčné sklo (Lattimo)", en:"Milk Glass (Lattimo)",
    icon:"⚪", actMin:3,
    desc_cs:"Neri 1612: 400 liber frity + 200 liber calcina (olovo+cín 1:1). Imitace porcelánu.",
    desc_en:"Neri 1612: 400 lb frit + 200 lb calcina (lead+tin 1:1). Porcelain imitation.",
    inputs:{crystal:3, cin:1, olovo:1},
    output:"lattimo", quality_bonus:1,
    furnaceMin:70,
    unlock_item:"cin",
    sell_cs:22, sell_en:22,
    latin:"Corpus fit vitrum — čistá bílá hmota",
    latinEn:"Corpus fit vitrum — pure white matter"
  },
  rubin:{
    cs:"Zlatý rubín (Kunckel)",  en:"Gold Ruby (Kunckel)",
    icon:"🔴", actMin:4,
    desc_cs:"Kunckel 1679: zlato rozpuštěné v lučavce a vysrážené cínem (purpurový prášek, později zvaný Cassiův purpur). Po tavení je sklo téměř bezbarvé — barvu vyvolá až druhé, pomalé zahřátí (náběh).",
    desc_en:"Kunckel 1679: gold dissolved in aqua regia and precipitated with tin (a purple powder, later called purple of Cassius). After melting the glass is almost colourless — the colour comes only on a second, slow reheating (striking).",
    inputs:{crystal:3, zlato:1, cin:1},
    output:"rubin", quality_bonus:2,
    furnaceMin:75,
    unlock_item:"zlato",
    sell_cs:50, sell_en:50,
    latin:"Donec fiat vitrum pellucidum — zlatý rubín",
    latinEn:"Donec fiat vitrum pellucidum — golden ruby"
  },
  zlut:{
    cs:"Stříbrná žluť (lazura)", en:"Silver Stain (glaze)",
    icon:"🟨", actMin:2,
    desc_cs:"Pasta ze stříbra a okru se nanese na hotový křišťál a vypálí v muflové peci (~600 °C). Rytec může lazuru probrousit až na čiré sklo — dvoubarevný kontrast.",
    desc_en:"A paste of silver and ochre is brushed onto finished crystal and fired in a muffle furnace (~600 °C). The engraver can cut through the stain to the clear glass — a two-colour contrast.",
    inputs:{crystal:1, stribro:1, clay:1},
    output:"zlut", quality_bonus:0,
    furnaceMin:0, mufle:true, wood:2, // vlastní muflová pec — nezávisí na hlavní peci, spálí 2 dřeva
    unlock_item:"stribro",
    sell_cs:30, sell_en:30,
    latin:"Clarior e tenebris — stříbro v ohni",
    latinEn:"Clarior e tenebris — silver in the fire"
  }
};

// Vstupy receptů barevného skla: křišťál / waldglas = sklady, charcoal / clay = suroviny (G.res), ostatní = přísady (G.additives)
const COLOR_RES_INPUTS=["charcoal","clay"];

const RUBY_STRIKE_MIN=45; // % pece (~630 °C) — nižší žár barvu nevyvolá
