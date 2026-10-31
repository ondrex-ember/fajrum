// crew.js — professions, traits, NPC roster/bonds/bios/assessments, tasks.
// Verbatim data moved out of core/ (no logic). Classic script: plain top-level consts in the shared global scope; load order is fixed by build.js.

// Co odemykají levely jednotlivých profesí (záložka Parta → Rozvoj); index = level (0 nepoužit)
const PROF_UNLOCKS={
  tavic:{cs:[null,"Tavení křišťálu","Snižuje spotřebu dřeva","Bonus kvalita +1","Mistrovský tavič — rubínové sklo"],
         en:[null,"Crystal melting","Lower wood consumption","Quality bonus +1","Master smelter — ruby glass"]},
  drvorubc:{cs:[null,"Těžba +1 dřevo/kolo","Milíř — rychlejší uhlí","Bonus parcela lesa","Lesní znalec — 0% ztráta"],
         en:[null,"Logging +1 wood/round","Charcoal kiln — faster charcoal","Forest plot bonus","Forest expert — 0% loss"]},
  panvar:{cs:[null,"Pánev kvality 2","Pánev kvality 3","Speciální pánev (+2 várky)","Mistrovská pánev"],
         en:[null,"Crucible quality 2","Crucible quality 3","Special crucible (+2 batches)","Master crucible"]},
  popelar:{cs:[null,"Potaš +1/kolo","Lepší loužení","Potaš z listí","Čistá potaš — bonus sklu"],
         en:[null,"Potash +1/round","Better leaching","Potash from leaves","Pure potash — glass bonus"]},
  foukat_lesni:{cs:[null,"Foukání misek","Foukání lahví","Foukání dekor","Mistrovský tvar"],
         en:[null,"Blowing bowls","Blowing bottles","Blowing decor","Master shaping"]},
  foukat_kristal:{cs:[null,"Čiré nádoby","Foukání číší","Tenké stěny","Sada 6ks"],
         en:[null,"Clear vessels","Blowing goblets","Thin walls","Set of 6"]},
  foukat_dekor:{cs:[null,"Dekor niťování","Barevné prstence","Filigrán základ","Benátská niť"],
         en:[null,"Thread decoration","Coloured rings","Filigree basics","Venetian thread"]},
  foukat_formy:{cs:[null,"Formy+1","Tvarové série","Rychlé formy","Mistrovská forma"],
         en:[null,"Moulds+1","Shape series","Fast moulds","Master mould"]},
  brusic_hrana:{cs:[null,"Fazeta","Hrana+1","Geometrické řezy","Lustrový řez"],
         en:[null,"Facet","Edge+1","Geometric cuts","Chandelier cut"]},
  brusic_kulic:{cs:[null,"Koule","Váza profil","Mísa hluboká","Mistrovský tvar"],
         en:[null,"Sphere","Vase profile","Deep bowl","Master shaping"]},
  rytec:{cs:[null,"Hladký vzor","Rostlinný motiv","Erb/iniciály","Mistrovská rytina"],
         en:[null,"Plain pattern","Plant motif","Coat of arms/initials","Master engraving"]},
  hornik:{cs:[null,"Těžba rud","Vzácné rudy","Hlubinná šachta","Plná šachta"],
         en:[null,"Ore mining","Rare ores","Deep shaft","Full shaft"]},
  obchodnik:{cs:[null,"Cena +5%","Nový odběratel","Zahraniční kontakt","Exportní síť"],
         en:[null,"Price +5%","New buyer","Foreign contact","Export network"]},
  formar:{cs:[null,"Forma+1 slot","Odolnější formy","Série forem","Mistrovská forma"],
         en:[null,"Mould+1 slot","Sturdier moulds","Mould series","Master mould"]},
  _default:{cs:[null,"Zkušenost +1","Bonusová efektivita","Speciální schopnost","Mistr"],
         en:[null,"Experience +1","Bonus efficiency","Special ability","Master"]}
};

// Traity dělníků
const TRAITS={
  silak:    {cs:"Siláč",    en:"Strong",      desc_cs:"Těžba +50%",                    desc_en:"Mining +50%",                 icon:"💪"},
  pedant:   {cs:"Pedant",   en:"Perfectionist",desc_cs:"Kvalita +1, rychlost -20%",    desc_en:"Quality +1, speed -20%",      icon:"🔍"},
  opilec:   {cs:"Opilec",   en:"Drinker",     desc_cs:"Pivo mu +2 nálady, 20% nehoda", desc_en:"Beer +2 morale, 20% accident",icon:"🍺"},
  ucitel:   {cs:"Učitel",   en:"Teacher",     desc_cs:"Blízcí levelují rychleji",       desc_en:"Nearby workers level faster", icon:"📖"},
  znalec:   {cs:"Znalec",   en:"Connoisseur", desc_cs:"Křišťál kvalita +1",            desc_en:"Crystal quality +1",          icon:"✨"},
  vytrvalec:{cs:"Vytrvalý", en:"Tireless",    desc_cs:"Únava -30%",                    desc_en:"Fatigue -30%",                icon:"🏃"},
  lakomec:  {cs:"Lakomec",  en:"Miser",       desc_cs:"Mzda -1g, nálada -5",           desc_en:"Wage -1g, morale -5",         icon:"💰"},
  hasic:    {cs:"Hasič",    en:"Safety man",  desc_cs:"Nehody u pece -50%",            desc_en:"Furnace accidents -50%",      icon:"🛡️"},
  obchodnik:{cs:"Obchodník",en:"Trader",      desc_cs:"Prodejní cena +10%",            desc_en:"Sell price +10%",             icon:"🗣️"},
  kovak:    {cs:"Kovák",    en:"Smith",       desc_cs:"Pánev kvalita +1",              desc_en:"Crucible quality +1",         icon:"🔨"},
  mlady:    {cs:"Mladík",   en:"Young",       desc_cs:"Levný, pomalý růst",            desc_en:"Cheap hire, slow growth",     icon:"🌱"},
  houzevatny:{cs:"Houževnatý",en:"Stubborn",  desc_cs:"Nikdy neodejde, nelze propustit",desc_en:"Never leaves, can't fire",  icon:"⚓"},
  filigranar: {cs:"Filigrán",   en:"Filigree",  desc_cs:"Umí pracovat s nitěmi a lattimem",desc_en:"Skilled with lattimo threads and filigree", icon:"🕸️"}
};

// ── NPC ROSTER — pevné postavy ──────────────────────────────
const NPC_SVG={
  formar1:  `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#2a1608" rx="6"/><text x="24" y="40" text-anchor="middle" font-size="32">🧑‍🔧</text></svg>`,
  formar2:  `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#2a1608" rx="6"/><text x="24" y="40" text-anchor="middle" font-size="32">👦</text></svg>`,
  foukac1:  `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#1a0e06" rx="6"/><text x="24" y="38" text-anchor="middle" font-size="28">💨</text><text x="24" y="52" text-anchor="middle" font-size="10" fill="#c9952b">FOUKAČ</text></svg>`,
  foukac2:  `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#1a0e06" rx="6"/><text x="24" y="38" text-anchor="middle" font-size="28">🫧</text><text x="24" y="52" text-anchor="middle" font-size="10" fill="#c9952b">FOUKAČ</text></svg>`,
  foukac3:  `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#1a0e06" rx="6"/><text x="24" y="38" text-anchor="middle" font-size="28">🧑‍🏭</text><text x="24" y="52" text-anchor="middle" font-size="10" fill="#c9952b">FOUKAČ</text></svg>`,
  foukac4:  `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#1a0e06" rx="6"/><text x="24" y="38" text-anchor="middle" font-size="28">👩‍🏭</text><text x="24" y="52" text-anchor="middle" font-size="10" fill="#c9952b">FOUKAČ</text></svg>`,
  brusic1:  `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#0e1a1a" rx="6"/><text x="24" y="38" text-anchor="middle" font-size="28">💎</text><text x="24" y="52" text-anchor="middle" font-size="10" fill="#3a6a9a">BRUSIČ</text></svg>`,
  brusic2:  `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#0e1a1a" rx="6"/><text x="24" y="38" text-anchor="middle" font-size="28">🔬</text><text x="24" y="52" text-anchor="middle" font-size="10" fill="#3a6a9a">BRUSIČ</text></svg>`,
  rytec1:   `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#1a1a0e" rx="6"/><text x="24" y="38" text-anchor="middle" font-size="28">✂️</text><text x="24" y="52" text-anchor="middle" font-size="10" fill="#8b7a2a">RYTEC</text></svg>`,
  kunc:     `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#2a1608" rx="6"/><text x="24" y="40" text-anchor="middle" font-size="32">👴</text></svg>`,
  komar:    `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#2a1608" rx="6"/><text x="24" y="40" text-anchor="middle" font-size="32">🧑</text></svg>`,
  kaninsky: `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#2a1608" rx="6"/><text x="24" y="40" text-anchor="middle" font-size="32">🧔</text></svg>`,
  taborsky: `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#2a1608" rx="6"/><text x="24" y="40" text-anchor="middle" font-size="32">👦</text></svg>`,
  smrkovsky:`<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#2a1608" rx="6"/><text x="24" y="40" text-anchor="middle" font-size="32">👨</text></svg>`,
  baranovsky:`<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#2a1608" rx="6"/><text x="24" y="40" text-anchor="middle" font-size="32">🧓</text></svg>`,
  mana:     `<svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="56" fill="#2a1608" rx="6"/><text x="24" y="40" text-anchor="middle" font-size="32">👩</text></svg>`
};

// NPC_BONDS: explicitní vazby mezi postavami
// type: "affinity" = spolupracují lépe, "tension" = třecí plocha
// effect popisuje herní dopad (tooltip), mentor se nastavuje dynamicky za běhu
const NPC_BONDS=[
  {a:"npc_kunc",   b:"npc_mana",    type:"affinity",
   desc_cs:"Kunc a Máňa — táta a máma hutě. Spolu zvyšují kvalitu tavení o 5 %.",
   desc_en:"Kunc and Máňa — the foundry's father and mother. Together they raise melt quality by 5%."},
  {a:"npc_kanin",  b:"npc_hrana1",  type:"affinity",
   desc_cs:"Oba pedanti. Káninského pánev vydrží o 1 várku déle, pokud Hranař dohleduje chlazení.",
   desc_en:"Both perfectionists. Káninský's crucible lasts 1 extra melt when Hranař oversees cooling."},
  {a:"npc_foukac3",b:"npc_foukac4", type:"affinity",
   desc_cs:"Josef a Kateřina — Kateřina ho učí foukání do formy. Josef leveluje 2× rychleji.",
   desc_en:"Josef and Kateřina — she teaches him mould-blowing. Josef levels up twice as fast."},
  {a:"npc_foukac2",b:"npc_foukac3", type:"tension",
   desc_cs:"Hanns kritizuje Josefovu techniku. Josef má -10 nálady pokud pracují na stejné směně.",
   desc_en:"Hanns criticises Josef's technique. Josef gets -10 mood when they share a shift."},
  {a:"npc_komar",  b:"npc_kanin",   type:"tension",
   desc_cs:"Komár ignoruje Káninského instrukce. 10 % šance na chybu v práci.",
   desc_en:"Komár ignores Káninský's instructions. 10% chance of a work error."},
  {a:"npc_kanin",  b:"npc_foukac4", type:"tension",
   desc_cs:"Strejda jí nedůvěřuje. Kateřinina loajalita klesá o 1 za kolo pokud Káninský velí.",
   desc_en:"Old man doesn't trust her. Kateřina's loyalty drops 1/round when Káninský leads."},
];

// Osobní nálada (0–100): vyvíjí se každé kolo (viz processRound), neutrální 60 = výkon beze změny; ±1 % výkonu za každých 5 bodů.
const MOOD_NEUTRAL=60;

const NPC_ROSTER=[
  // ── STARTOVNÍ PARTA (kolo 1) ──────────────────────────────────────────────
  {id:"npc_kunc",   name:"František Kunc",    prof:"tavic",    lv:6, traits:["houzevatny","ucitel"],
   subtitle_cs:"Tavič / Foukač", subtitle_en:"Smelter / Glassblower",
   quote_cs:"U pece třicet let. Sklo mi zpívá.",
   quote_en:"Thirty years at the furnace. I hear the glass sing.",
   hireCost:18, wageMod:1, portrait:"kunc",     loyalty:90, health:75, mood:70},
  {id:"npc_komar",  name:"Milan Komár",        prof:"drvorubc", lv:1, traits:["silak","vytrvalec"],
   quote_cs:"Padne to nebo ne?",
   quote_en:"Will it fall or not?",
   hireCost:12, wageMod:0, portrait:"komar",    loyalty:75, health:95, mood:65},
  {id:"npc_kanin",  name:"Strejda Káninský",   prof:"panvar",   lv:2, traits:["pedant","kovak"],
   quote_cs:"To se dělá takhle. Ne tak.",
   quote_en:"This is how it's done. Not like that.",
   hireCost:16, wageMod:1, portrait:"kaninsky", loyalty:80, health:80, mood:60},
  {id:"npc_tabor",  name:"Ferda Táborský",     prof:"popelar",  lv:1, traits:["mlady","ucitel"],
   quote_cs:"Jasně, hned... co jsem to měl dělat?",
   quote_en:"Sure, right away... what was I doing?",
   hireCost:6,  wageMod:-1,portrait:"taborsky", loyalty:60, health:100,mood:80},
  {id:"npc_smrk",   name:"Tonda Smrkovský",    prof:"hornik",   lv:1, traits:["vytrvalec","hasic"],
   quote_cs:"Hmm.",
   quote_en:"Hmm.",
   hireCost:10, wageMod:0, portrait:"smrkovsky",loyalty:85, health:85, mood:50},
  {id:"npc_baran",  name:"Strejda Baranovský", prof:"obchodnik",lv:1, traits:["obchodnik","lakomec"],
   quote_cs:"Já to seženu. Za příplatek.",
   quote_en:"I'll get it. For a fee.",
   hireCost:14, wageMod:-1,portrait:"baranovsky",loyalty:55, health:90, mood:70},
  {id:"npc_mana",   name:"Máňa",               prof:"popelar",  lv:1, traits:["ucitel","houzevatny"],
   quote_cs:"Tak, hoši, do práce.",
   quote_en:"Right then, lads. Back to work.",
   hireCost:10, wageMod:0, portrait:"mana",     loyalty:95, health:90, mood:75, gender:"f"},
  // ── FORMAŘI (od startu, sezóna 1) ─────────────────────────────────────────
  {id:"npc_formar1",name:"Jirka Formař",        prof:"formar",   lv:1, traits:["kovak","vytrvalec"],
   quote_cs:"Forma musí sedět. Jinak to nefoukneš.",
   quote_en:"The mould must fit. Or you can't blow it.",
   hireCost:10, wageMod:0, portrait:"formar1",  loyalty:75, health:90, mood:70, availRound:0, availSeason:1},
  {id:"npc_formar2",name:"Péťa Dřevák",         prof:"formar",   lv:1, traits:["silak","mlady"],
   quote_cs:"Jedu, jedu, jedu.",
   quote_en:"Working, working, working.",
   hireCost:7,  wageMod:-1,portrait:"formar2",  loyalty:70, health:100,mood:75, availRound:0, availSeason:1},
  // ── FOUKAČI (od kola 5, sezóna 1) ─────────────────────────────────────────
  {id:"npc_foukac1",name:"Václav Puchýř",       prof:"foukat_lesni",   lv:1, traits:["znalec","vytrvalec"],
   quote_cs:"Sklo tváří jako matka děcko. Teplé ruce, lehký dech.",
   quote_en:"Glass shaped like a mother shapes a child. Warm hands, gentle breath.",
   hireCost:20, wageMod:2, portrait:"foukac1",  loyalty:80, health:85, mood:70, availRound:5, availSeason:1},
  {id:"npc_foukac2",name:"Hanns Glaser",         prof:"foukat_kristal", lv:1, traits:["pedant","hasic"],
   quote_cs:"Saský způsob. Lepší forma, čistší střep.",
   quote_en:"Saxon method. Better mould, cleaner piece.",
   hireCost:16, wageMod:1, portrait:"foukac2",  loyalty:65, health:90, mood:60, availRound:5, availSeason:1},
  {id:"npc_foukac3",name:"Josef Sklenář",        prof:"foukat_dekor",   lv:1, traits:["mlady","silak"],
   quote_cs:"Foukal jsem u Riedlů. Tady to zkusím taky.",
   quote_en:"I blew at Riedel's. I'll try here too.",
   hireCost:10, wageMod:0, portrait:"foukac3",  loyalty:60, health:100,mood:75, availRound:5, availSeason:1},
  {id:"npc_foukac4",name:"Kateřina Sklenářová",  prof:"foukat_formy",   lv:1, traits:["ucitel","obchodnik"],
   quote_cs:"Ženy foukají od pradávna. Jen se to neříká.",
   quote_en:"Women have always blown glass. It's just not spoken of.",
   hireCost:14, wageMod:0, portrait:"foukac4",  loyalty:85, health:88, mood:80, availRound:5, availSeason:1, gender:"f"},
  {id:"npc_foukac5",name:"Elias Böhm",           prof:"foukat_kristal", lv:2, traits:["znalec","houzevatny"],
   quote_cs:"Křišťál nesnáší spěch. Já taky ne.",
   quote_en:"Crystal does not tolerate haste. Neither do I.",
   hireCost:28, wageMod:2, portrait:"foukac2",  loyalty:70, health:85, mood:55, availRound:7, availSeason:2},
  {id:"npc_foukac6",name:"Marie Wagnerová",      prof:"foukat_kristal", lv:1, traits:["ucitel","filigranar"],
   quote_cs:"Benátská niť se neutrhne — pokud víte jak ji vést.",
   quote_en:"The Venetian thread won't break — if you know how to guide it.",
   hireCost:24, wageMod:1, portrait:"foukac4",  loyalty:75, health:90, mood:70, availRound:9, availSeason:2, gender:"f"},
  // ── BRUSIČI + RYTEC (od kola 7, sezóna 2) ─────────────────────────────────
  {id:"npc_hrana1", name:"Ignác Hranař",         prof:"brusic_hrana",   lv:1, traits:["pedant","znalec"],
   quote_cs:"Jeden špatný tah a střep je na odpis. Rychlost není ctnost.",
   quote_en:"One bad stroke and the piece is waste. Speed is not virtue.",
   hireCost:22, wageMod:2, portrait:"brusic1",  loyalty:75, health:80, mood:55, availRound:7, availSeason:2},
  {id:"npc_kulic1", name:"Anička Kuličková",     prof:"brusic_kulic",   lv:1, traits:["vytrvalec","lakomec"],
   quote_cs:"Osm hodin denně s brusným kamenem. Víc nepotřebuju.",
   quote_en:"Eight hours a day at the stone. That's enough.",
   hireCost:14, wageMod:-1,portrait:"brusic2",  loyalty:70, health:90, mood:65, availRound:7, availSeason:2, gender:"f"},
  {id:"npc_rytec1", name:"Kryštof Rytíř",        prof:"rytec",          lv:1, traits:["pedant","znalec"],
   quote_cs:"Diamantový hrot a trpělivost. Nic víc nepotřebuješ.",
   quote_en:"Diamond point and patience. Nothing more is needed.",
   hireCost:28, wageMod:3, portrait:"rytec1",   loyalty:70, health:80, mood:50, availRound:7, availSeason:2}
];

const TASKS_PREP=["logging","quarry","potash","panev","formar","water","clay","field","reforest","idle"];
const TASKS_CAMP=["logging","quarry","potash","formar","water","clay","field","reforest","cereni","idle"];
const WERKSTAT_PROFS=["tavic","foukat_lesni","foukat_kristal","foukat_dekor","foukat_formy","brusic_hrana","brusic_kulic","rytec"];
const TASK_CS={logging:"Kácení",quarry:"Lůmek",potash:"Loužírna",panev:"Pánvař",formar:"Formař",water:"Voda",clay:"Jíl",field:"Políčko",reforest:"Výsadba",idle:"Odpočinek",werkstat:"⚒️ Verštat",cereni:"🫧 Čeření"};
const TASK_EN={logging:"Logging",quarry:"Quarry",potash:"Potash",panev:"Crucible-maker",formar:"Mould-maker",water:"Water",clay:"Clay",field:"Field",reforest:"Reforest",idle:"Rest",werkstat:"⚒️ Workshop",cereni:"🫧 Fining"};
const TASK_INFO_CS={
  logging:  "Kácení — 1 parcela hvozdu = 4 🪵 (1–6 parcel/kolo), +únava. Hvozd je konečný. Zimní bonus ×1.5",
  quarry:   "Lůmek — +vápenec, +jíl, +únava",
  potash:   "Loužírna — spálí podíl Potaš ze zásoby dřeva (6🪵→1🌿). Várka = 2 potaš, víc nepotřebuješ. +únava",
  panev:    "Pánvař — vyrábí pánve (zrají 6 kol)",
  formar:   "Formař — vyrábí formy pro foukání",
  water:    "Voda — +voda do zásobníku",
  clay:     "Jíl — +jíl ze svahu",
  field:    "Políčko — +jídlo pro hutníky",
  reforest: "Výsadba — +les (pomalý efekt)",
  idle:     "Odpočinek — nic nevyrábí, -50% únavy, poloviční mzda",
  werkstat: "Verštat — foukání / broušení / rytí",
  cereni:   "Čeření — burel (MnO₂) nebo antimon odbarví a zlepší příští dávku křišťálu (+1★, max 2 uložené); arsen dá +2★ najednou (tavič se víc unaví). Jen tavič v kampani."
};
const TASK_INFO_EN={
  logging:  "Logging — 1 forest parcel = 4 🪵 (1–6 parcels/round), +fatigue. Forest is finite. Winter bonus ×1.5",
  quarry:   "Quarry — +limestone, +clay, +fatigue",
  potash:   "Potash — burns the Potash share of wood stock (6🪵→1🌿). A batch needs 2 potash, no more. +fatigue",
  panev:    "Crucible — makes crucibles (cure 6 rounds)",
  formar:   "Mould-maker — makes moulds for blowing",
  water:    "Water — +water to reservoir",
  clay:     "Clay — +clay from the hillside",
  field:    "Field — +food for workers",
  reforest: "Reforest — +forest (slow effect)",
  idle:     "Rest — produces nothing, -50% fatigue, half wage",
  werkstat: "Workshop — blowing / grinding / engraving",
  cereni:   "Fining — burel (MnO₂) or antimony decolourises and improves the next crystal batch (+1★, max 2 stored); arsenic gives +2★ at once (smelter tires more). Smelter only, campaign."
};

const TASK_ICON={
  logging:"🌲",quarry:"⛏️",potash:"🌿",panev:"🏺",formar:"🌳",
  water:"💧",clay:"🧱",field:"🌾",reforest:"🌱",idle:"😴",werkstat:"⚒️",cereni:"🫧"
};
const TASK_PILLS={
  logging:  [{l:"+🌲",t:"pos"},{l:"+😓",t:"neg"}],
  quarry:   [{l:"+🪨",t:"pos"},{l:"+🧱",t:"pos"},{l:"+😓",t:"neg"}],
  potash:   [{l:"+🌿",t:"pos"},{l:"-6🪵",t:"neg"},{l:"+😓",t:"neg"}],
  panev:    [{l:"+🏺",t:"pos"},{l:"-🧱",t:"neg"},{l:"-🍞",t:"neg"}],
  formar:   [{l:"+forma",t:"pos"},{l:"-2🪵",t:"neg"},{l:"-💧",t:"neg"}],
  water:    [{l:"+💧",t:"pos"}],
  clay:     [{l:"+🧱",t:"pos"}],
  field:    [{l:"+🍞",t:"pos"}],
  reforest: [{l:"+🌲",t:"pos"}],
  idle:     [{l:"-😓",t:"pos"}],
  werkstat: [{l:"⚒️",t:"neu"}],
  cereni:   [{l:"🫧",t:"pos"},{l:"-burel",t:"neg"},{l:"→+★",t:"pos"}],
};

// Primární tasky dle role — zobrazí se pod portrétem, zbytek vpravo
const ROLE_PRIMARY_TASKS={
  tavic:    ["potash","panev","cereni","idle"],
  drvorubc: ["logging","reforest","idle"],
  popelar:  ["potash","clay","idle"],
  panvar:   ["panev","clay","quarry"],
  formar:   ["formar","logging","idle"],
  hornik:   ["quarry","clay","idle"],
  obchodnik:["field","water","idle"],
};
const ROLE_PRIMARY_ICONS={
  logging:"🌲",quarry:"⛏️",potash:"🌿",panev:"🏺",formar:"🪚",
  water:"💧",clay:"🟤",field:"🌾",reforest:"🌱",idle:"😴",werkstat:"⚒️",cereni:"🫧"
};
const PROF_CS={tavic:"Tavič",drvorubc:"Dřevorubec",popelar:"Popelář",panvar:"Pánvař",hornik:"Horník",obchodnik:"Obchodník",formar:"Formař",
  foukat_lesni:"Foukač (lesní)",foukat_kristal:"Foukač (křišťál)",foukat_dekor:"Foukač (dekor)",foukat_formy:"Foukač (formy)",
  brusic_hrana:"Hranař",brusic_kulic:"Kulič",rytec:"Rytec"};
const PROF_EN={tavic:"Smelter",drvorubc:"Logger",popelar:"Potasher",panvar:"Crucible-maker",hornik:"Miner",obchodnik:"Trader",formar:"Mould-maker",
  foukat_lesni:"Blower (forest)",foukat_kristal:"Blower (crystal)",foukat_dekor:"Blower (decor)",foukat_formy:"Blower (moulds)",
  brusic_hrana:"Edge-cutter",brusic_kulic:"Sphere-grinder",rytec:"Engraver"};

// Specializované profese — bonus efekty (skupiny pro Přehled)
const SPEC_PROFS={
  formar:{
    icon:"🪚", color:"#8b5e34", availRound:0,
    label_cs:"Formaři", label_en:"Mould-makers",
    profCodes:["formar"],
    bonus_cs:"Vyrábějí dřevěné formy pro foukání. Bez forem Foukači nemohou tvarovat.",
    bonus_en:"Make wooden moulds for blowing. Without moulds Blowers cannot shape.",
    effect:"mould_slots"
  },
  foukac:{
    icon:"💨", color:"#c9952b", availRound:5,
    label_cs:"Foukači", label_en:"Glassblowers",
    profCodes:["foukat_lesni","foukat_kristal","foukat_dekor","foukat_formy"],
    bonus_cs:"Foukají sklo do výrobků. Každý typ foukače vyrábí jiný sortiment. Nástup: Duben (Sv. Jiří).",
    bonus_en:"Blow glass into pieces. Each type produces different wares. Start: April (St. George).",
    effect:"blown_quality"
  },
  brusic:{
    icon:"💎", color:"#3a6a9a", availRound:7,
    label_cs:"Brusiči", label_en:"Grinders",
    profCodes:["brusic_hrana","brusic_kulic"],
    bonus_cs:"Hranař: broušené hrany, fazety, koule, těžítka. Kulič: kulaté tvary, vázy, mísy. Nástup: Červen.",
    bonus_en:"Edge-cutter: facets, spheres, paperweights. Sphere-grinder: round shapes, vases, bowls. Start: June.",
    effect:"grinding"
  },
  rytec:{
    icon:"✂️", color:"#8b7a2a", availRound:7,
    label_cs:"Rytec", label_en:"Engraver",
    profCodes:["rytec"],
    bonus_cs:"Gravíruje motivy na hotové výrobky → cena rytého skla +40%. Odemkne šlechtické zakázky. Nástup: Červen.",
    bonus_en:"Engraves motifs on finished pieces → price +40%. Unlocks noble court contracts. Start: June.",
    effect:"engraving"
  }
};

const MAX_WORKERS=6;
const XP_PER_LEVEL=[6,10,15,22,32,45,60,80,110,999]; // kola prace pro lv1->2 ... lv9->10; index = lv-1

// Task affinity: profese → primární task. Na primárním tasku 1.5× XP, na cizím 0.5×.
// Werkstat profese (foukači, brusiči, rytec, tavič) mají jako "primární" werkstat.
const TASK_AFFINITY={
  drvorubc:"logging", popelar:"potash", panvar:"panev", formar:"formar", hornik:"quarry",
  tavic:"werkstat", foukat_lesni:"werkstat", foukat_kristal:"werkstat",
  foukat_dekor:"werkstat", foukat_formy:"werkstat",
  brusic_hrana:"werkstat", brusic_kulic:"werkstat", rytec:"werkstat",
  obchodnik:null // Baranovský — bez afinity
};

// Osobní hodnocení hutmistra — statická báze per NPC (používá workerAssessment)
const NPC_ASSESS={
    npc_kunc:    {cs:"Kunc nepotřebuje pochvalu. Pec mluví za něj.",         en:"Kunc needs no praise. The furnace speaks for him."},
    npc_komar:   {cs:"Komár padá stromy jako stroje. Přemýšlet mu moc nejde.",en:"Komár fells trees like a machine. Thinking isn't his forte."},
    npc_kanin:   {cs:"Káninský ví o pánvích víc než kdokoliv v kraji.",       en:"Káninský knows more about crucibles than anyone in the region."},
    npc_tabor:   {cs:"Táborský se snaží. Opravdu. Výsledky jsou... různé.",   en:"Táborský tries hard. Really. Results vary."},
    npc_smrk:    {cs:"Smrkovský je spolehlivý. Tichý jako kámen, tvrdý taky.",en:"Smrkovský is reliable. Silent as stone, just as hard."},
    npc_baran:   {cs:"Baranovský umí prodat i sníh. Jen mu důvěřuj opatrně.", en:"Baranovský could sell snow. Trust him carefully."},
    npc_mana:    {cs:"Máňa drží partu pohromadě. Bez ní by to tu dávno skřípalo.",en:"Máňa keeps the crew together. Without her it'd squeak."},
    npc_formar1: {cs:"Formař dělá formy jako hodiny. Přesně, tiše, stále.",   en:"Formař makes moulds like clockwork. Precise, quiet, steady."},
    npc_formar2: {cs:"Péťa je mladý a silný. Hlava přijde časem.",            en:"Péťa is young and strong. The head will come with time."},
    npc_foukac1: {cs:"Puchýř foukne tvar z ničeho. Ruce jako z jiného světa.",en:"Puchýř blows shape from nothing. Hands from another world."},
    npc_foukac2: {cs:"Glaser je precizní. Saský způsob — tvrdší, ale čistší.", en:"Glaser is precise. Saxon method — harder, but cleaner."},
    npc_foukac3: {cs:"Sklenář roste rychle. Chybuje, ale nikdy dvakrát stejně.",en:"Sklenář grows fast. Makes mistakes, never the same one twice."},
    npc_foukac4: {cs:"Sklenářová prodá víc než ostatní dohromady. A ví to.",  en:"Sklenářová sells more than the rest combined. She knows it."},
    npc_foukac5: {cs:"Böhm na houby nechodí. Böhm na houby nechodí ani omylem.",      en:"Böhm doesn't wander. He has never done anything by accident."},
    npc_foukac6: {cs:"Wagnerová odemkla recept, který si Benátčané střežili sto let.", en:"Wagnerová unlocked a recipe Venetians guarded for a century."},
    npc_hrana1:  {cs:"Hranař brousí s modlitbou. Jeden špatný tah ho bolí.",  en:"Hranař grinds like prayer. One bad stroke hurts him."},
    npc_kulic1:  {cs:"Kuličková je vytrvalá. Nikdy si nestěžuje, nikdy nepřestane.",en:"Kuličková is relentless. Never complains, never stops."},
    npc_rytec1:  {cs:"Rytíř rytím žije. Všechno ostatní je jen čekání.",      en:"Rytíř lives for engraving. Everything else is just waiting."},
  };

// ── NPC BIOGRAFIE — tab "O něm/ní" ─────────────────────────
const NPC_BIO={
  npc_kunc:{
    cs:`<b>Tavič &amp; Foukač — dva mistři v jednom</b><br><br>
František Kunc znal tvého otce ještě z dob kdy huť v Arnsdorfu byla jen snem a hromada kamení. Společně tehdy fouknuli první várku waldglasu — Kunc u pece, táta s trubicí. Kunc zůstal. Táta odešel do světa, vrátil se s dluhem a receptem. Teď jsi tady ty.<br><br>
Kunc je jeden z mála kdo ovládá obě řemesla — taví i fouká. U malé pece to tak bývalo: jeden mistr, všechno. Neučí slovem. Učí přítomností — kdo ho sleduje dost dlouho, začne rozumět peci jako živé věci. Říká se, že pozná správnou teplotu zavřenýma očima. Možná je to pravda.`,
    en:`<b>Smelter &amp; Glassblower — two masters in one</b><br><br>
František Kunc knew your father back when the Arnsdorf foundry was just a dream and a pile of stones. Together they blew the first batch of waldglas — Kunc at the furnace, your father at the pipe. Kunc stayed. Your father went out into the world, came back with debt and a recipe. Now you're here.<br><br>
Kunc is one of the few who masters both crafts — smelting and blowing. At a small furnace it used to be that way: one master, everything. He doesn't teach with words. He teaches with presence — watch him long enough and you'll start to understand the furnace as a living thing.`
  },
  npc_komar:{
    cs:`<b>Dřevorubec — síla bez zbytečných slov</b><br><br>
Milan Komár přišel z Falknova před třemi lety a od té doby pokácel víc stromů než kdokoliv v kraji. Mluví málo, jí hodně, spí tvrdě. V lese je nenahraditelný — mimo les se orientuje hůř než klacek.<br><br>
S pilou v ruce je jako jiný člověk. Bez ní je jen velký, trochu zmatenej chlap co neví kam s rukama. Ale huť bez dřeva stojí — a o to se Komár postará.`,
    en:`<b>Logger — strength without unnecessary words</b><br><br>
Milan Komár came from Falknov three years ago and has since felled more trees than anyone in the region. He talks little, eats a lot, sleeps hard. In the forest he's irreplaceable — outside it he's lost worse than a stick.<br><br>
With a saw in hand he's a different person. Without it he's just a large, slightly confused man who doesn't know what to do with his hands. But a foundry without wood stops — and that's Komár's business.`
  },
  npc_mana:{
    cs:`<b>Popelář — vládkyně loužírny</b><br><br>
Nikdo v Arnsdorfu neví jak se Máňa jmenuje celým jménem. Nikdo se ani neptá. Je tu odjakživa — nebo aspoň tak dlouho, že na to nikdo nepamatuje. Loužírna je její království. Potaš co vyrábí je čistší než z kteréhokoli vedlejšího kraje.<br><br>
Kunc říká, že dobrá potaš je půlka dobrého skla. Máňa to ví — a proto se nikam nežene. Pracuje pomalu, pečlivě, a výsledek mluví za vše.`,
    en:`<b>Potasher — mistress of the leaching shed</b><br><br>
Nobody in Arnsdorf knows Máňa's full name. Nobody asks. She's been here forever — or at least as long as anyone can remember. The leaching shed is her kingdom. The potash she produces is purer than from any neighbouring region.<br><br>
Kunc says good potash is half of good glass. Máňa knows this — which is why she's never in a hurry. She works slowly, carefully, and the result speaks for itself.`
  },
  npc_kanin:{
    cs:`<b>Pánvař — tajemství žáruvzdorné hlíny</b><br><br>
Káninský není z Arnsdorfu. Přišel z Posázaví kde prý pracoval pro tři různé hutě — vždy odešel dřív než musel. Nebo tak říká on. O žáruvzdorné hlíně ví víc než většina tavičů co ho kdy zaměstnala.<br><br>
Jeho pánve drží. Špatná pánev znamená ztracenou várku — a to Káninský ví lépe než kdokoliv. Proto je pedant, proto je přesný, a proto ho huť potřebuje víc než si někdy přizná.`,
    en:`<b>Crucible-maker — the secret of refractory clay</b><br><br>
Káninský isn't from Arnsdorf. He came from Posázaví where he reportedly worked for three different foundries — always leaving before he had to. Or so he says. He knows more about refractory clay than most smelters who ever employed him.<br><br>
His crucibles hold. A bad crucible means a lost batch — and Káninský knows this better than anyone. That's why he's a pedant, that's why he's precise, and that's why the foundry needs him more than it ever admits.`
  },
  npc_formar1:{
    cs:`<b>Formař — rod povolání</b><br><br>
Jirka Formař — ano, to je opravdu jeho příjmení — pochází z rodu formařů. Děda formař, táta formař, Jirka formař. Nikdo v rodině nepřemýšlel jestli by mohl dělat něco jiného. Jirka taky ne.<br><br>
Je spolehlivý, přesný, trochu nudný. Formy co dělá jsou vždy rovné, vždy stejné, vždy správné. V řemesle kde záleží na přesnosti je to víc než dost.`,
    en:`<b>Mould-maker — a family trade</b><br><br>
Jirka Formař — yes, that really is his surname — comes from a family of mould-makers. Grandfather a mould-maker, father a mould-maker, Jirka a mould-maker. Nobody in the family ever wondered if he could do something else. Neither did Jirka.<br><br>
He's reliable, precise, a little dull. The moulds he makes are always straight, always consistent, always right. In a craft where precision matters, that's more than enough.`
  },
};
