// glass.js — glass products: colour multipliers, blown/ground/engraved/special item catalogues and derived type lists.
// Verbatim data moved out of core/ (no logic). Classic script: plain top-level consts in the shared global scope; load order is fixed by build.js.

// ── FOUKANÉ VÝROBKY ─────────────────────────────────────────
// base = cena za ★ při prodeji
// input = waldglas nebo crystal (počet kusů)
// spec = která profese dostává ×2.5 bonus (null = základní, všichni)
// specOnly = true → vyrábí jen specializace
// Cenové multiplikátory dle vstupního materiálu/barvy
// waldglas = základní, crystal = čirý luxus, barvy = prémiové
const COLOR_MULT={
  waldglas:1.0, crystal:2.5,
  jantar:1.6, zlut:3.0,
  modra:3.5, smaragd:3.2, lattimo:4.0, rubin:10.0
};

// Ikony barev pro UI
const COLOR_ICON={waldglas:"🟫",crystal:"✨",jantar:"🟤",zlut:"🟨",modra:"🔵",smaragd:"🟢",lattimo:"⚪",rubin:"🔴"};

// Pravidla: které barvy lze brousit / rytí
const COLOR_CAN_GRIND={waldglas:false,crystal:true,jantar:false,zlut:false,modra:false,smaragd:false,lattimo:false,rubin:false};
const COLOR_CAN_ENGRAVE={waldglas:false,crystal:true,jantar:false,zlut:true,modra:true,smaragd:true,lattimo:false,rubin:false};

// inputs[] = seznam povolených vstupních surovin/barev (první = výchozí)
// base = základní cena při waldglas×1.0; skutečná cena = base × COLOR_MULT[color] × quality
const BLOWN_ITEMS={
  // ── FOUKAT_LESNI — základní nádoby ──
  cise:       {cs:"Číše",           en:"Goblet",        icon:"🥃",
               inputs:["waldglas","jantar","crystal","modra","smaragd","rubin"],
               qty:1, base:5,  spec:"foukat_lesni", specOnly:false},
  dzban:      {cs:"Džbán",          en:"Jug",            icon:"🫙",
               inputs:["waldglas","jantar","modra","smaragd"],
               qty:1, base:5,  spec:"foukat_lesni", specOnly:false},
  pullitr:    {cs:"Půllitr",        en:"Pint mug",       icon:"🍺",
               inputs:["waldglas"],
               qty:1, base:4,  spec:"foukat_lesni", specOnly:false},
  romer:      {cs:"Römer",          en:"Römer glass",    icon:"🍶",
               inputs:["waldglas","crystal"],
               qty:1, base:6,  spec:"foukat_lesni", specOnly:false},
  // ── FOUKAT_KRISTAL — křišťálové a barevné poháry ──
  pohar:      {cs:"Pohár",          en:"Crystal cup",    icon:"🍷",
               inputs:["crystal","modra","smaragd","rubin"],
               qty:1, base:14, spec:"foukat_kristal", specOnly:true},
  dekantr:    {cs:"Dekantér",       en:"Decanter",       icon:"🍾",
               inputs:["crystal","modra"],
               qty:1, base:20, spec:"foukat_kristal", specOnly:true},
  romer_krist:{cs:"Römer křišťál", en:"Crystal Römer",  icon:"🔮",
               inputs:["crystal"],
               qty:1, base:16, spec:"foukat_kristal", specOnly:true},
  kalamar:    {cs:"Kalamář",        en:"Inkwell",        icon:"🖋️",
               inputs:["crystal"],
               qty:1, base:12, spec:"foukat_kristal", specOnly:true},
  // ── FOUKAT_DEKOR — dekorativní kusy ──
  koule:      {cs:"Skleněná koule", en:"Glass sphere",   icon:"🔮",
               inputs:["waldglas","lattimo"],
               qty:1, base:10, spec:"foukat_dekor", specOnly:true},
  tezitko:    {cs:"Těžítko",        en:"Paperweight",    icon:"💠",
               inputs:["crystal","lattimo"],
               qty:1, base:18, spec:"foukat_dekor", specOnly:true},
  pucmeloun:  {cs:"Skleněná figurka", en:"Glass figurine", icon:"🐦",
               inputs:["waldglas","lattimo"],
               qty:1, base:8,  spec:"foukat_dekor", specOnly:true},
  vaza_dekor: {cs:"Váza",           en:"Vase",           icon:"🏺",
               inputs:["crystal","lattimo","modra"],
               qty:1, base:22, spec:"foukat_dekor", specOnly:true},
  // ── FOUKAT_FORMY — tvarované do forem ──
  misa:       {cs:"Mísa",           en:"Bowl",           icon:"🥣",
               inputs:["waldglas","crystal"],
               qty:1, base:5,  spec:"foukat_formy", specOnly:false},
  dzban_forma:{cs:"Džbán (forma)",  en:"Mould jug",      icon:"🫗",
               inputs:["waldglas"],
               qty:2, base:7,  spec:"foukat_formy", specOnly:true},
  // ── OKENNÍ SKLO — hromadný odbyt ──
  tercik:     {cs:"Okenní terčík",  en:"Window disc",    icon:"🪟",
               inputs:["waldglas"],
               qty:2, base:3, spec:"foukat_lesni", specOnly:false,
               bulkNote_cs:"Ø8–10 cm, vsazují se do olova. Kláštery, měšťanské domy, Haida trh. Nepodařené kusy → výplně.",
               bulkNote_en:"Ø8–10 cm, set in lead cames. Monasteries, town houses, Haida market. Rejects → filler pieces."},
  // ── DROBNÉ ZBOŽÍ — rychlá výroba, hromadný odbyt ──
  banka:      {cs:"Baňka",          en:"Flask",           icon:"🧪",
               inputs:["waldglas","crystal"],
               qty:2, base:4,  spec:"foukat_lesni", specOnly:false,
               bulkNote_cs:"Lékárníci a poutníci berou po tuctech.",
               bulkNote_en:"Apothecaries and pilgrims buy by the dozen."},
  spunt:      {cs:"Špunt",          en:"Stopper",         icon:"🔴",
               inputs:["waldglas"],
               qty:3, base:2,  spec:"foukat_formy", specOnly:false,
               bulkNote_cs:"Kramáři berou hromadně — rychlý groš.",
               bulkNote_en:"Merchants buy in bulk — quick coin."},
  ozdoba:     {cs:"Ozdoba",         en:"Glass ornament",  icon:"🎄",
               inputs:["waldglas","modra","smaragd","lattimo"],
               qty:2, base:6,  spec:"foukat_dekor", specOnly:false,
               bulkNote_cs:"Vánoční zboží, šlechtické dary, Haida trh.",
               bulkNote_en:"Christmas goods, noble gifts, Haida market."},
  // ── NOVÉ VÝROBKY v7.9 ──
  holba:      {cs:"Holba",          en:"Stein mug",       icon:"🍻",
               inputs:["waldglas"],
               qty:1, base:12, spec:"foukat_lesni", specOnly:false,
               bulkNote_cs:"Válcová nádoba s uchem — šenky a hostince. Od pol. 17. stol. standard.",
               bulkNote_en:"Cylindrical mug with handle — taverns and inns. Standard from mid-17th c."},
  kutrolf:    {cs:"Kutrolf",        en:"Kuttrolf",        icon:"🫗",
               inputs:["crystal","waldglas"],
               qty:1, base:28, spec:"foukat_kristal", specOnly:true,
               bulkNote_cs:"Lahev se zkrouceným hrdlem — zpomaluje výtok. Doložen v Brně i Bratislavě.",
               bulkNote_en:"Bottle with twisted neck — slows pouring. Documented in Brno and Bratislava."},
  stangenglas:{cs:"Stangenglas",    en:"Stangenglas",     icon:"🥂",
               inputs:["crystal"],
               qty:1, base:22, spec:"foukat_kristal", specOnly:true,
               bulkNote_cs:"Vysoký štíhlý pohár s nálepy — oblíbený v kostelech a na šlechtických dvorech.",
               bulkNote_en:"Tall slender prunted beaker — popular in churches and noble courts."},
  pateriky:   {cs:"Páteříky",       en:"Glass beads",     icon:"📿",
               inputs:["waldglas","modra","smaragd","lattimo"],
               qty:5, base:2,  spec:"foukat_dekor", specOnly:false,
               bulkNote_cs:"Skleněné korálky — kramáři, poutníci, obchodní trasy. Hromadný odbyt.",
               bulkNote_en:"Glass beads — merchants, pilgrims, trade routes. Bulk product."},
  // ── NOVÉ VÝROBKY v8 ──
  mucholapka: {cs:"Mucholapka",      en:"Flycatcher",      icon:"🫧",
               inputs:["waldglas"],
               qty:1, base:5,  spec:"foukat_lesni", specOnly:false,
               bulkNote_cs:"Hygienické sklo — nádobka s úzkým otvorem, lapá mouchy. Sériová výroba od 16. stol. Odbytiště: lékárníci, ranhojiči, domácnosti.",
               bulkNote_en:"Hygienic glass — narrow-necked vessel trapping flies. Mass-produced since 16th c. Market: apothecaries, barber-surgeons, households."},
  konvice:    {cs:"Konvice",         en:"Pitcher",         icon:"🫖",
               inputs:["waldglas","jantar","modra","smaragd"],
               qty:1, base:9,  spec:"foukat_lesni", specOnly:false,
               bulkNote_cs:"Baňaté tělo, zúžené hrdlo, hubička — na vodu, víno, olej. Doložena z Rejdic i Brna. Výroba z nazelenalé skloviny s optickým dekorem žeber. Sedláčková 2003.",
               bulkNote_en:"Bulbous body, narrow neck, spout — water, wine, oil. Documented from Rejdice and Brno. Greenish glass with ribbed optical decor. Sedláčková 2003."},
};

// Všechny foukané typy pro state/sell
Object.assign(BLOWN_ITEMS,FajrumCatalog.blown);
const BLOWN_TYPES=Object.keys(BLOWN_ITEMS);

// ── BROUŠENÉ & RYTECKÉ VÝROBKY ──────────────────────────────
// spec: která profese dělá (brusic_hrana / brusic_kulic)
// input: crystal nebo blown item key
const GROUND_ITEMS={
  // ── Hranař (brusic_hrana) — hrany, fazety, koule, těžítka, lustr, pokal ──
  brus_hrana_cise:  {cs:"Broušená číše",     en:"Cut goblet",       icon:"🔷", input:"crystal", qty:1, base:20, spec:"brusic_hrana"},
  brus_hrana_panel: {cs:"Fazetový panel",    en:"Faceted panel",    icon:"🪟", input:"crystal", qty:1, base:22, spec:"brusic_hrana"},
  brus_koule:       {cs:"Broušená koule",    en:"Cut sphere",       icon:"🔵", input:"crystal", qty:1, base:25, spec:"brusic_hrana"},
  brus_tezitko:     {cs:"Broušené těžítko",  en:"Cut paperweight",  icon:"💎", input:"crystal", qty:1, base:28, spec:"brusic_hrana"},
  brus_lustr_dil:   {cs:"Lustrový díl",      en:"Chandelier piece", icon:"💡", input:"crystal", qty:1, base:35, spec:"brusic_hrana"},
  brus_pokal:       {cs:"Pokal s víkem",     en:"Covered goblet",   icon:"🏆", input:"crystal", qty:2, base:45, spec:"brusic_hrana"},
  // ── Kulič (brusic_kulic) — kulaté tvary, vázy, mísy ──
  brus_vaza:        {cs:"Broušená váza",     en:"Cut vase",         icon:"🏺", input:"crystal", qty:1, base:30, spec:"brusic_kulic"},
  brus_vaza_velka:  {cs:"Velká broušená váza",en:"Large cut vase",  icon:"🪔", input:"crystal", qty:2, base:48, spec:"brusic_kulic"},
  brus_misa:        {cs:"Broušená mísa",     en:"Cut bowl",         icon:"🥗", input:"crystal", qty:1, base:20, spec:"brusic_kulic"},
  brus_poharak:     {cs:"Broušený pohárek",  en:"Cut cup",          icon:"🫗", input:"crystal", qty:1, base:18, spec:"brusic_kulic"},
};
Object.assign(GROUND_ITEMS,FajrumCatalog.ground);
const GROUND_TYPES=Object.keys(GROUND_ITEMS);

// Rytecké výrobky — motiv přidá bonus k ceně
// Pravidla: rytí jen crystal, stříbrná žluť a modra/smaragd (COLOR_CAN_ENGRAVE) — barevné varianty viz COLORED_ENGRAVE_ITEMS
// Barevné varianty foukaných kusů, které lze rýt (COLOR_CAN_ENGRAVE): klíč = výrobek_barva (např. cise_modra); cena = cena barevného kusu
const COLORED_ENGRAVE_ITEMS={};
["cise","pohar","dekantr"].forEach(k=>{
  const it=BLOWN_ITEMS[k];
  it.inputs.filter(c=>c!=="waldglas"&&c!=="crystal"&&COLOR_CAN_ENGRAVE[c]).forEach(c=>{
    COLORED_ENGRAVE_ITEMS[k+"_"+c]={cs:it.cs+" "+COLOR_ICON[c],en:it.en+" "+COLOR_ICON[c],icon:it.icon,base:Math.round(it.base*COLOR_MULT[c])};
  });
});
const ENGRAVE_INPUTS=["brus_hrana_cise","brus_pokal","brus_vaza","brus_vaza_velka","brus_poharak","pohar","dekantr","cise","zlut",...Object.keys(COLORED_ENGRAVE_ITEMS)];
const ENGRAVE_MOTIFS={
  basic:   {cs:"Základní rytina",  en:"Basic engraving",   mult:1.4},
  hunting: {cs:"Lovecká scéna",    en:"Hunting scene",     mult:1.6},
  floral:  {cs:"Florální motiv",   en:"Floral motif",      mult:1.5},
  coat:    {cs:"Erb (zakázka)",    en:"Coat of arms",      mult:1.8},
};
const ENGRAVE_BONUS=1.4; // základní bonus (zpětná kompatibilita sellItems)

// Stříbrná žluť: rytec probrousí lazuru na čiré sklo → dvoubarevný kontrast (vyšší bonus)
const ENGRAVE_BONUS_KEY={zlut:1.8};

// Žlutěný křišťál (výstup receptu "zlut") — zdroj pro rytí, definice jako u GROUND_ITEMS/BLOWN_ITEMS
const STAINED_ITEMS={zlut:{cs:"Žlutěný křišťál",en:"Stained crystal",icon:"🟨",base:30}};

// ── SPECIÁLNÍ VÝROBKY (SPECIAL_ITEMS) ───────────────────────
// Výrobky které nelze zařadit do blown/ground workflow
// craft: { inputs:{surovina:qty,...}, workers:[profese,...], minSeason }
const SPECIAL_ITEMS={
  zrcadlo:{
    cs:"Zrcadlo",       en:"Mirror",
    icon:"🪞",
    desc_cs:"Luxusní zrcadlo — sklovina litím, přední strana leštěna, zadní strana amalgámem rtuti a cínu. Rtuť z Idrie. Vzácné — málokdo si je mohl dovolit.",
    desc_en:"Luxury mirror — cast glass, front polished, rear coated with mercury-tin amalgam. Mercury from Idrija. Rare — few could afford them.",
    latin:"Speculum — fortuna vitrea est",
    src_cs:"Vepřeková, CP_13II2015",
    inputs:{crystal:2, rtut:1, cin:1},
    workers:["brusic_hrana"],
    minSeason:3,
    base:65,
    sell_cs:65, sell_en:65
  },
  alembik:{
    cs:"Alembik",       en:"Alembic",
    icon:"⚗️",
    desc_cs:"Destilační helma pro alchymisty a lékárníky — křišťálové sklo tvarované do přilby. Nejstarší z celé střední Evropy nalezen v klášteře klarisek v Bratislavě (~1290). Vzácná zakázka.",
    desc_en:"Distillation helm for alchemists and apothecaries — crystal glass shaped into a dome. Oldest from Central Europe found in a Poor Clares convent in Bratislava (~1290). Rare commission.",
    latin:"In igne probatur — per aquam purificatur",
    src_cs:"Sedláčková, Bratislava 2021",
    inputs:{crystal:2, arsen:1},
    workers:["foukat_kristal"],
    minSeason:2,
    base:55,
    sell_cs:55, sell_en:55
  }
};

Object.assign(SPECIAL_ITEMS,FajrumCatalog.special);
