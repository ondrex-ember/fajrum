// resource-info.js — pravidla zásob (bubliny na pills, panel „📦 Zásoby“). Data zrcadlí Android content/RESOURCE_INFO.json 1:1.
// Klasický skript: obyčejná top-level const ve sdíleném globálním scope; logiku čte core/stock.js. Samá data, žádná logika.
//  per         = spotřeba na jednotku: číslo (na várku) nebo "fuel" / "food" (na kolo, počítá core/stock.js ze stavu hry)
//  warnReach / critReach = POZOR pod N jednotek / ❗ pod N (1 = další jednotka neproběhne)
//  warnBelow / critBelow = totéž v absolutní zásobě (zdroje bez spotřeby na jednotku)
//  open        = kam vede tlačítko v bublině: "karta:podzáložka" (výchozí "storage:raw")
const RESOURCE_INFO={
 "forest": {
  "icon": "🌲",
  "name_cs": "Hvozd",
  "name_en": "Forest",
  "source_cs": "Nedá se koupit. Dorůstá pomalu; v Lese můžeš sázet, probírat, smolařit a najmout nádeníka.",
  "source_en": "Cannot be bought. Regrows slowly; in the Forest tab you can plant, thin, tap resin and hire a hand.",
  "use_cs": "Kácení: 1 parcela = 4 🪵 (1–6 parcel za kolo). Když dojde, dřevo už jen kupuješ.",
  "use_en": "Logging: 1 parcel = 4 🪵 (1–6 parcels a round). Once it is gone, wood has to be bought.",
  "group": "forest",
  "task": "reforest",
  "hint_warn_cs": "Nekácej do zásoby, pošli dělníka na Výsadbu.",
  "hint_warn_en": "Stop logging into stock, send a worker to Reforest.",
  "hint_crit_cs": "Hvozd je skoro pryč — sázej stromy a dřevo kupuj u Weisse.",
  "hint_crit_en": "The forest is nearly gone — plant trees and buy wood from Weiss.",
  "unit_cs": [
   "parcelu",
   "parcely",
   "parcel"
  ],
  "unit_en": [
   "parcel",
   "parcels"
  ],
  "showReach": false,
  "warnBelow": 21,
  "critBelow": 5,
  "open": "forest:"
 },
 "wood": {
  "icon": "🌳",
  "name_cs": "Dřevo",
  "name_en": "Wood",
  "source_cs": "Úkol Kácení (dělník v lese), 1 parcela hvozdu = 4 🪵. Nouzově jde dokoupit u kupce Weisse.",
  "source_en": "Logging task (a worker in the forest), 1 forest parcel = 4 🪵. Can be bought from Weiss in an emergency.",
  "use_cs": "Palivo do pece (každé kolo), potaš (6 🪵 → 1 potaš), formy a pánve.",
  "use_en": "Furnace fuel (every round), potash (6 🪵 → 1 potash), moulds and crucibles.",
  "group": "forest",
  "per": "fuel",
  "warnReach": 3,
  "critReach": 1,
  "task": "logging",
  "unit_cs": [
   "kolo",
   "kola",
   "kol"
  ],
  "unit_en": [
   "round",
   "rounds"
  ],
  "hint_warn_cs": "Pošli dělníka kácet, nebo dokup dřevo u Weisse.",
  "hint_warn_en": "Send a worker logging, or buy wood from Weiss.",
  "hint_crit_cs": "Pec nemá čím topit — kácej, nebo kup nouzové dřevo u Weisse.",
  "hint_crit_en": "No fuel for the furnace — log or buy emergency wood from Weiss."
 },
 "sand": {
  "icon": "🏖️",
  "name_cs": "Písek",
  "name_en": "Sand",
  "source_cs": "Úkol Lůmek: +1–4 písku za kolo (spolu s vápencem a kamenem). Dá se dokoupit u kupce Weisse.",
  "source_en": "Quarry task: +1–4 sand a round (with limestone and stone). Can be bought from Weiss.",
  "use_cs": "3 písku na každou várku lesního skla.",
  "use_en": "3 sand per batch of forest glass.",
  "group": "mats",
  "per": 3,
  "warnReach": 3,
  "critReach": 1,
  "task": "quarry",
  "unit_cs": [
   "várku",
   "várky",
   "várek"
  ],
  "unit_en": [
   "batch",
   "batches"
  ],
  "hint_warn_cs": "Pošli dělníka do Lůmku.",
  "hint_warn_en": "Send a worker to the Quarry.",
  "hint_crit_cs": "Na další várku nestačí — Lůmek, nebo kup u Weisse.",
  "hint_crit_en": "Not enough for the next batch — Quarry, or buy from Weiss."
 },
 "limestone": {
  "icon": "🟩",
  "name_cs": "Vápenec",
  "name_en": "Limestone",
  "source_cs": "Úkol Lůmek: +1–2 vápence za kolo. Dá se dokoupit u kupce Weisse.",
  "source_en": "Quarry task: +1–2 limestone a round. Can be bought from Weiss.",
  "use_cs": "1 vápenec na každou várku.",
  "use_en": "1 limestone per batch.",
  "group": "mats",
  "per": 1,
  "warnReach": 3,
  "critReach": 1,
  "task": "quarry",
  "unit_cs": [
   "várku",
   "várky",
   "várek"
  ],
  "unit_en": [
   "batch",
   "batches"
  ],
  "hint_warn_cs": "Pošli dělníka do Lůmku.",
  "hint_warn_en": "Send a worker to the Quarry.",
  "hint_crit_cs": "Na další várku nestačí — Lůmek, nebo kup u Weisse.",
  "hint_crit_en": "Not enough for the next batch — Quarry, or buy from Weiss."
 },
 "potash": {
  "icon": "🌿",
  "name_cs": "Potaš",
  "name_en": "Potash",
  "source_cs": "Úkol Loužírna: spálí podíl Potaš ze zásoby dřeva (6 🪵 → 1 potaš). Přiřaď dělníka a nastav podíl v rozdělení dřeva. Nekupuje se.",
  "source_en": "Potash task: burns the Potash share of your wood (6 🪵 → 1 potash). Assign a worker and set the share in the wood allocation. Cannot be bought.",
  "use_cs": "2 potaše na každou várku lesního skla.",
  "use_en": "2 potash per batch of forest glass.",
  "group": "mats",
  "per": 2,
  "warnReach": 3,
  "critReach": 1,
  "task": "potash",
  "unit_cs": [
   "várku",
   "várky",
   "várek"
  ],
  "unit_en": [
   "batch",
   "batches"
  ],
  "hint_warn_cs": "Loužírna potřebuje dělníka a dřevo (podíl Potaš).",
  "hint_warn_en": "The Potash station needs a worker and wood (Potash share).",
  "hint_crit_cs": "Bez potaše se netaví — přiřaď dělníka na Loužírnu.",
  "hint_crit_en": "No smelting without potash — assign a worker to Potash."
 },
 "water": {
  "icon": "💧",
  "name_cs": "Voda",
  "name_en": "Water",
  "source_cs": "Úkol Voda: +2–5 vody za kolo. Dá se dokoupit u kupce Weisse.",
  "source_en": "Water task: +2–5 water a round. Can be bought from Weiss.",
  "use_cs": "1 voda na várku; 2 vody na každou formu.",
  "use_en": "1 water per batch; 2 water per mould.",
  "group": "mats",
  "per": 1,
  "warnReach": 3,
  "critReach": 1,
  "task": "water",
  "unit_cs": [
   "várku",
   "várky",
   "várek"
  ],
  "unit_en": [
   "batch",
   "batches"
  ],
  "hint_warn_cs": "Pošli dělníka pro vodu.",
  "hint_warn_en": "Send a worker for water.",
  "hint_crit_cs": "Na další várku nestačí — úkol Voda, nebo kup u Weisse.",
  "hint_crit_en": "Not enough for the next batch — Water task, or buy from Weiss."
 },
 "clay": {
  "icon": "🧱",
  "name_cs": "Jíl",
  "name_en": "Clay",
  "source_cs": "Úkol Jíl: +1–3 jílu za kolo. Dá se dokoupit u kupce Weisse.",
  "source_en": "Clay task: +1–3 clay a round. Can be bought from Weiss.",
  "use_cs": "2 jíly na každou pánev (Pánvař v přípravě); s kamenem i šamotové kvádry.",
  "use_en": "2 clay per crucible (Crucible-maker in preparation); with stone also firebricks.",
  "group": "mats",
  "task": "clay"
 },
 "food": {
  "icon": "🍞",
  "name_cs": "Jídlo",
  "name_en": "Food",
  "source_cs": "Úkol Políčko: dělníci pěstují jídlo. Dá se dokoupit u kupce Weisse.",
  "source_en": "Field task: workers grow food. Can be bought from Weiss.",
  "use_cs": "Každé kolo sní parta půl jídla na dělníka (zaokrouhleno nahoru). Bez jídla klesá nálada.",
  "use_en": "Every round the crew eats half a food per worker (rounded up). Without food morale drops.",
  "group": "mats",
  "per": "food",
  "warnReach": 2,
  "critReach": 1,
  "task": "field",
  "unit_cs": [
   "kolo",
   "kola",
   "kol"
  ],
  "unit_en": [
   "round",
   "rounds"
  ],
  "hint_warn_cs": "Založ políčko, nebo dokup jídlo.",
  "hint_warn_en": "Set up a Field, or buy food.",
  "hint_crit_cs": "Dělníci hladoví — dokup jídlo hned.",
  "hint_crit_en": "Workers will go hungry — buy food now."
 },
 "crucibles": {
  "icon": "🏺",
  "name_cs": "Pánve",
  "name_en": "Crucibles",
  "source_cs": "Úkol Pánvař v přípravné fázi (2 jíly + 1 jídlo na pánev). Pánev zraje 6 kol, než je hotová.",
  "source_en": "Crucible-maker task in the preparation phase (2 clay + 1 food per crucible). A crucible cures for 6 rounds.",
  "use_cs": "Bez hotové pánve pec netaví.",
  "use_en": "Without a ready crucible the furnace cannot smelt.",
  "group": "prod",
  "task": "panev",
  "hint_warn_cs": "Přiřaď Pánváře — pánve zrají 6 kol.",
  "hint_warn_en": "Assign the Crucible-maker — crucibles take 6 rounds to cure.",
  "hint_crit_cs": "Žádná hotová pánev — tavení stojí.",
  "hint_crit_en": "No ready crucible — smelting is halted."
 },
 "formy": {
  "icon": "🌳",
  "name_cs": "Formy",
  "name_en": "Moulds",
  "source_cs": "Úkol Formař (od března): 2 🪵 + 2 💧 + 1 🍞 na formu.",
  "source_en": "Mould-maker task (from March): 2 🪵 + 2 💧 + 1 🍞 per mould.",
  "use_cs": "Foukání spotřebuje jednu formu na kus.",
  "use_en": "Blowing uses one mould per piece.",
  "group": "prod",
  "task": "formar",
  "showTile": true
 },
 "dryWood": {
  "icon": "🔥",
  "name_cs": "Suché dříví",
  "name_en": "Dry wood",
  "source_cs": "Krytá sušárna (vyšší stupeň sezóny) ho občas dozraje; jde i koupit u kupce Weisse.",
  "source_en": "The drying shed (higher season tier) sometimes cures some; can also be bought from Weiss.",
  "use_cs": "Rozšíření sezóny a zimní provoz (drží žár bez syrového dříví).",
  "use_en": "Season extension and winter operation (keeps the heat without raw wood).",
  "group": "other"
 },
 "pitch": {
  "icon": "🌲",
  "name_cs": "Smůla",
  "name_en": "Pitch",
  "source_cs": "Při kácení občas padne (35 % za kácení); jde i koupit u kupce Weisse.",
  "source_en": "Sometimes found while logging (35 % per cut); can also be bought from Weiss.",
  "use_cs": "Rozšíření sezóny; v zimě chrání náhon stoupy před ledem.",
  "use_en": "Season extension; in winter it protects the stamp-mill flume from ice.",
  "group": "other"
 },
 "stone": {
  "icon": "🪨",
  "name_cs": "Lomový kámen",
  "name_en": "Quarry stone",
  "source_cs": "Úkol Lůmek: +1–3 kameny za kolo; jde i koupit u kupce Weisse.",
  "source_en": "Quarry task: +1–3 stone a round; can also be bought from Weiss.",
  "use_cs": "Rozšíření sezóny (zastřešená huť) a šamotové kvádry z jílu.",
  "use_en": "Season extension (roofed foundry) and firebricks made from clay.",
  "group": "other"
 },
 "firebrick": {
  "icon": "🧱",
  "name_cs": "Šamotové kvádry",
  "name_en": "Firebricks",
  "source_cs": "Při těžbě jílu občas vznikne (kámen + 2 jíly); jde i koupit u kupce Weisse.",
  "source_en": "Sometimes made while digging clay (stone + 2 clay); can also be bought from Weiss.",
  "use_cs": "Rozšíření sezóny (nejvyšší stupeň: 10 ks).",
  "use_en": "Season extension (highest tier: 10).",
  "group": "other"
 },
 "additives": {
  "icon": "🧪",
  "name_cs": "Přísady",
  "name_en": "Additives",
  "source_cs": "Získáváš je z událostí kampaně.",
  "source_en": "You get them from campaign events.",
  "use_cs": "Barvení skla, čeření a speciální receptury.",
  "use_en": "Colouring, fining and special recipes.",
  "group": "other"
 },
 "colors": {
  "icon": "🌈",
  "name_cs": "Barevné sklo",
  "name_en": "Coloured glass",
  "source_cs": "Vyrábí se z přísad podle barevných receptur.",
  "source_en": "Made from additives by the colour recipes.",
  "use_cs": "Prodej na trhu a barevné zakázky.",
  "use_en": "Sold on the market and for coloured orders.",
  "group": "other"
 },
 "morale": {
  "icon": "😊",
  "name_cs": "Nálada",
  "name_en": "Morale",
  "source_cs": "Zvedá ji pivo pro partu; klesá hladem, mrazem a nehodami v peci.",
  "source_en": "Raised by beer for the crew; lowered by hunger, frost and furnace accidents.",
  "use_cs": "Nízká nálada zhoršuje kvalitu skla.",
  "use_en": "Low morale lowers glass quality.",
  "group": "hut",
  "hint_warn_cs": "Zkontroluj jídlo, pivo a dluhy partě.",
  "hint_warn_en": "Check food, beer and the crew's debts.",
  "hint_crit_cs": "Nálada je kritická — jídlo, pivo, odpočinek.",
  "hint_crit_en": "Morale is critical — food, beer, rest.",
  "unit_cs": [
   "%",
   "%",
   "%"
  ],
  "unit_en": [
   "%",
   "%"
  ],
  "showReach": false,
  "showTile": false,
  "warnBelow": 40,
  "critBelow": 35,
  "open": "accounts:accounts"
 }
};
