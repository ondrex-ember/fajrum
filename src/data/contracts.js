// contracts.js — contracts, buyers, reputation (Fama), endgame deliveries.
// Verbatim data moved out of core/ (no logic). Classic script: plain top-level consts in the shared global scope; load order is fixed by build.js.

const MAX_CONTRACTS=3;

// Fama za reputační / endgame zakázky (používá processRound, krok 7b, i karta zakázky)
const REP_FAMA_GAIN=5, REP_FAMA_LOSS=-6, EG_FAMA_GAIN=15, EG_FAMA_LOSS=-10;

const CONTRACT_COLOR_NAMES={
  jantar:{cs:"jantarové sklo",en:"amber glass"},
  modra:{cs:"modré sklo",en:"blue glass"},
  smaragd:{cs:"smaragdové sklo",en:"emerald glass"},
  lattimo:{cs:"lattimo (mléčné sklo)",en:"lattimo (milk glass)"},
  rubin:{cs:"rubínové sklo",en:"ruby glass"}
};

const CONTRACT_OPTIONS=[
  {months:1,  mult:1.0,  label_cs:"1 měsíc",   label_en:"1 month"},
  {months:3,  mult:2.5,  label_cs:"3 měsíce",  label_en:"3 months"},
  {months:6,  mult:4.0,  label_cs:"6 měsíců",  label_en:"6 months"},
  {months:8,  mult:5.0,  label_cs:"8 měsíců",  label_en:"8 months"},
  {months:10, mult:6.0,  label_cs:"10 měsíců", label_en:"10 months"},
  {months:12, mult:8.0,  label_cs:"12 měsíců", label_en:"12 months"},
];

const CONTRACT_POOL=[
  // Weiss — kramar z Haidy
  {id:"c1",item:"waldglas",qty:3,reward:18,due:7,buyer:"Weiss",
   cs:"Kupec Weiss: 3× lesní sklo",en:"Merchant Weiss: 3× forest glass"},
  {id:"c2",item:"waldglas",qty:5,reward:32,due:8,buyer:"Weiss",
   cs:"Kupec Weiss: 5× lesní sklo",en:"Merchant Weiss: 5× forest glass"},
  {id:"c4",item:"waldglas",qty:2,reward:12,due:6,buyer:"Weiss",
   cs:"Kupec Weiss: 2× lesní sklo",en:"Merchant Weiss: 2× forest glass"},
  {id:"c7",item:"waldglas",qty:4,reward:22,due:7,buyer:"Weiss",
   cs:"Kupec Weiss: 4× lesní sklo",en:"Merchant Weiss: 4× forest glass"},
  {id:"c17",item:"waldglas",qty:1,reward:7,due:4,buyer:"Weiss",
   cs:"Kupec Weiss: 1× sklo — rychlá dodávka",en:"Merchant Weiss: 1× glass — quick delivery"},
  // Hoffmann — drážďanský faktor
  {id:"c3",item:"crystal",qty:2,reward:45,due:8,buyer:"Hoffmann",
   cs:"Faktor Hoffmann: 2× křišťál",en:"Factor Hoffmann: 2× crystal"},
  {id:"c5",item:"crystal",qty:1,reward:28,due:7,buyer:"Hoffmann",
   cs:"Faktor Hoffmann: 1× křišťál",en:"Factor Hoffmann: 1× crystal"},
  {id:"c6",item:"crystal",qty:3,reward:70,due:8,buyer:"Hoffmann",
   cs:"Faktor Hoffmann: 3× křišťál",en:"Factor Hoffmann: 3× crystal"},
  {id:"c8",item:"crystal",qty:2,reward:50,due:7,buyer:"Hoffmann",
   cs:"Faktor Hoffmann: 2× křišťál",en:"Factor Hoffmann: 2× crystal"},
  {id:"c18",item:"crystal",qty:1,reward:22,due:5,buyer:"Hoffmann",
   cs:"Faktor Hoffmann: 1× křišťál — spěšná zásilka",en:"Factor Hoffmann: 1× crystal — rush order"},
  // Opat z Lemberka
  {id:"c9",item:"crystal",qty:1,reward:35,due:6,buyer:"Opat",
   cs:"Opat z Lemberka: 1× křišťál na kalich",en:"Abbot of Lemberk: 1× crystal for chalice"},
  {id:"c10",item:"waldglas",qty:4,reward:20,due:5,buyer:"Opat",
   cs:"Opat z Lemberka: 4× sklo na oltář",en:"Abbot of Lemberk: 4× glass for altar"},
  // Šlechtic von Harrach
  {id:"c11",item:"crystal",qty:2,reward:60,due:8,buyer:"Slechtic",
   cs:"Šlechtic von Harrach: 2× křišťál na pohár",en:"Noble von Harrach: 2× crystal goblet"},
  {id:"c12",item:"crystal",qty:1,reward:40,due:6,buyer:"Slechtic",
   cs:"Šlechtic von Harrach: 1× křišťál na slavnost",en:"Noble von Harrach: 1× crystal for a feast"},
  // Foukané
  {id:"c13",item:"cise",qty:2,reward:38,due:7,buyer:"Weiss",
   cs:"Kupec Weiss: 2× foukané číše",en:"Merchant Weiss: 2× blown goblets"},
  {id:"c14",item:"dzban",qty:1,reward:22,due:6,buyer:"Opat",
   cs:"Opat z Lemberka: 1× džbán na svěcenou vodu",en:"Abbot of Lemberk: 1× jug for holy water"},
  {id:"c15",item:"koule",qty:3,reward:28,due:7,buyer:"Weiss",
   cs:"Kupec Weiss: 3× skleněné koule — zboží na jarmark",en:"Merchant Weiss: 3× glass balls — fair goods"},
  // Broušené
  {id:"c16",item:"brus_hrana_cise",qty:1,reward:55,due:8,buyer:"Slechtic",
   cs:"Šlechtic von Harrach: 1× broušená číše — dárek",en:"Noble von Harrach: 1× cut goblet — gift"}];

// ── REPUTACE (Fama) ─────────────────────────────────────────
// Buyer → kategorie famy
const BUYER_FAMA={Opat:"church", Slechtic:"noble", Hoffmann:"trade", Weiss:"trade"};

// Splnění zakázky přidá body famy dle kupce
const FAMA_CONTRACT_GAIN=3;
const FAMA_CONTRACT_EXPIRE=-4; // propadlá zakázka
const FAMA_MAX=100;

// Thresholds pro odemčení reputačních zakázek
const FAMA_THRESHOLDS={
  church:[20,40,65,80,90],
  noble: [20,45,65,80,85],
  trade: [15,35,60,75,90]
};

// Ikony kategorií
const FAMA_ICON={church:"🕊️", noble:"⚔️", trade:"🌍"};
const FAMA_LABEL_CS={church:"Církev", noble:"Panstvo", trade:"Obchod"};
const FAMA_LABEL_EN={church:"Church", noble:"Nobility", trade:"Trade"};

// Reputační zakázky — opravné/dílčí (vzácné, 0–2× ročně per kategorie)
// minFama = minimální fama pro výskyt; chance = šance per kolo (≈2–3× za rok)
const REP_CONTRACT_POOL=[
  // ── CÍRKEV ──
  {id:"rc1", cat:"church", minFama:20, chance:0.04,
   item:"crystal", qty:1, reward:40, due:5,
   cs:"Opat z Lemberka: prasklý pohár u oltáře — náhrada",
   en:"Abbot of Lemberk: cracked altar cup — replacement"},
  {id:"rc2", cat:"church", minFama:40, chance:0.03,
   item:"modra", qty:2, reward:65, due:6,
   cs:"Farář z Haidy: 2× kobaltové panely do kaple — oprava okna",
   en:"Haida priest: 2× cobalt panels for chapel — window repair"},
  {id:"rc3", cat:"church", minFama:65, chance:0.025,
   item:"brus_hrana_panel", qty:1, reward:90, due:7,
   cs:"Opat: broušený panel do relikviáře — původní prasknul při procesí",
   en:"Abbot: cut panel for reliquary — original cracked in procession"},
  // ── PANSTVO ──
  {id:"rc4", cat:"noble", minFama:20, chance:0.04,
   item:"pohar", qty:2, reward:50, due:5,
   cs:"Šlechtic von Harrach: 2× poháry — hos ztratil při banketu",
   en:"Noble von Harrach: 2× goblets — lost at banquet"},
  {id:"rc5", cat:"noble", minFama:45, chance:0.03,
   item:"brus_hrana_cise", qty:1, reward:80, due:6,
   cs:"Šlechtična Harrach: broušená číše — rozbitá při honech, náhrada ke svátku",
   en:"Noblewoman Harrach: cut goblet — broken during hunt, needed for feast"},
  {id:"rc6", cat:"noble", minFama:65, chance:0.025,
   item:"rubin", qty:1, reward:120, due:8,
   cs:"Šlechtic von Harrach: rubínové sklo — doplnění sady pro císařskou návštěvu",
   en:"Noble von Harrach: ruby glass — set completion for imperial visit"},
  // ── OBCHOD ──
  {id:"rc7", cat:"trade", minFama:15, chance:0.05,
   item:"waldglas", qty:4, reward:22, due:4,
   cs:"Kupec Weiss: rychlá dodávka — zákazník čeká v Haidě",
   en:"Merchant Weiss: urgent delivery — buyer waiting in Haida"},
  {id:"rc8", cat:"trade", minFama:35, chance:0.035,
   item:"crystal", qty:2, reward:55, due:5,
   cs:"Faktor Hoffmann: doplnění zásilky do Drážďan — 2 kusy chybí",
   en:"Factor Hoffmann: top-up shipment to Dresden — 2 pieces missing"},
  {id:"rc9", cat:"trade", minFama:60, chance:0.025,
   item:"brus_pokal", qty:1, reward:95, due:6,
   cs:"Hoffmann: broušený pohár pro drážďanský dvůr — speciální objednávka",
   en:"Hoffmann: cut goblet for Dresden court — special order"}
];

// Endgame zakázky — dostupné po endgame.X === false a fama >= threshold
// Po splnění → endgame.X = true → otevře pravidelné dodávky
const ENDGAME_CONTRACTS={
  church:{
    id:"eg_church", minFama:90, minFurnace:"master",
    cs:"RELIKVIÁŘ — Klášter sv. Vojtěcha: kompletní schránka pro ostatky",
    en:"RELIQUARY — St. Vojtěch Monastery: complete relic shrine",
    components:[
      {item:"crystal",    qty:2, cs:"Křišťálová schránka (2× křišťál)", en:"Crystal case (2× crystal)"},
      {item:"modra",      qty:2, cs:"Kobaltové výplně (2× modrá)", en:"Cobalt fills (2× blue)"},
      {item:"brus_hrana_panel", qty:1, cs:"Broušený panel (1×)", en:"Cut panel (1×)"},
      {item:"rubin",      qty:1, cs:"Rubínový panel víka (1×)", en:"Ruby lid panel (1×)"}
    ],
    reward:180, due:10,
    completionText_cs:"Opat Benedikt praví: \u201eTvé sklo je jako zamrzlé světlo.\u201c Relikviář putuje do kaple.",
    completionText_en:"Abbot Benedict says: \"Your glass is like frozen light.\" The reliquary joins the chapel."
  },
  noble:{
    id:"eg_noble", minFama:85, minFurnace:"stone",
    cs:"LUSTR — Hrabě Harrach: kompletní lustrová sada pro velký sál",
    en:"CHANDELIER — Count Harrach: complete chandelier set for great hall",
    components:[
      {item:"brus_lustr_dil", qty:4, cs:"Broušené díly lustru (4×)", en:"Cut chandelier parts (4×)"},
      {item:"pohar_modra",    qty:2, cs:"Kobaltové poháry (2×)", en:"Cobalt goblets (2×)"},
      {item:"rytina_brus_pokal", qty:1, cs:"Rytý pohál s erbem (1×)", en:"Engraved goblet with crest (1×)"},
      {item:"brus_koule",     qty:3, cs:"Broušené koule (3×)", en:"Cut spheres (3×)"}
    ],
    reward:220, due:12,
    completionText_cs:"Hrabě Harrach: \u201eArnsdorfské sklo ozdobí sál po generace.\u201c Řemeslo je proslaveno.",
    completionText_en:"Count Harrach: \"Arnsdorf glass will grace this hall for generations.\" The craft is renowned."
  },
  trade:{
    id:"eg_trade", minFama:90, minFurnace:"stone",
    cs:"EXPORTNÍ SÉRIE — Hoffmann: 20 pohárů pro drážďanský dvůr, konzistentní kvalita",
    en:"EXPORT SERIES — Hoffmann: 20 goblets for Dresden court, consistent quality",
    components:[
      {item:"pohar", qty:10, cs:"Foukané poháry — první várka (10×)", en:"Blown goblets — first batch (10×)"},
      {item:"crystal", qty:5, cs:"Křišťálový základ (5×)", en:"Crystal base (5×)"},
      {item:"brus_hrana_cise", qty:5, cs:"Broušené číše (5×)", en:"Cut goblets (5×)"}
    ],
    reward:250, due:14,
    completionText_cs:"Hoffmann: \u201eKonečně někdo z Čech kdo ví co dělá. Podepíšeme smlouvu.\u201c",
    completionText_en:"Hoffmann: \"Finally someone from Bohemia who knows their craft. We sign a contract.\""
  }
};

// Pravidelné dodávky po endgame — generují se každou sezónu
const REGULAR_DELIVERIES={
  church:[
    {id:"rd_church1", item:"crystal", qty:1, reward:38, due:6,
     cs:"Klášter sv. Vojtěcha: pravidelná dodávka — 1× křišťál", en:"St. Vojtěch: regular delivery — 1× crystal"},
    {id:"rd_church2", item:"modra", qty:1, reward:50, due:7,
     cs:"Klášter: kobaltový panel — roční výzdoba", en:"Monastery: cobalt panel — annual decor"}
  ],
  noble:[
    {id:"rd_noble1", item:"brus_hrana_cise", qty:1, reward:70, due:7,
     cs:"Hrabě Harrach: roční doplnění soupravy", en:"Count Harrach: annual set replenishment"},
    {id:"rd_noble2", item:"pohar", qty:2, reward:45, due:6,
     cs:"Harrach: 2× poháry pro letní bankety", en:"Harrach: 2× goblets for summer banquets"}
  ],
  trade:[
    {id:"rd_trade1", item:"pohar", qty:5, reward:60, due:8,
     cs:"Hoffmann: pravidelná zásilka do Drážďan", en:"Hoffmann: regular Dresden shipment"},
    {id:"rd_trade2", item:"crystal", qty:2, reward:50, due:7,
     cs:"Hoffmann: křišťál pro drážďanské faktory", en:"Hoffmann: crystal for Dresden factors"}
  ]
};
