// Texty průvodce Kunce (krok → cs/en, CTA, nápověda, anim, tab; `{proměnné}` doplňuje core/guide.js). Obsah ladí ručně; stejná data jako Android content/GUIDE_STEPS.json.
const GUIDE_STEPS={
 "welcome": {
  "anim": "talk",
  "cs": "Já jsem Kunc, tvůj tavič. Sezóna má pět měsíců příprav a sedm měsíců kampaně, kdy hoří pec. Dej na mě: nejdřív zaplatit lidi a nakrmit je, pak zásoby, pak teprve sklo na prodej.",
  "en": "I am Kunc, your master melter. A season has five months of preparation and seven of campaign, when the furnace burns. Listen to me: pay and feed the crew first, then stock up, only then sell glass.",
  "cta_cs": "Rozumím",
  "cta_en": "Got it"
 },
 "alloc_fix": {
  "anim": "react",
  "cs": "Pozor na dřevo. Potaš teď nedostává žádné a bez ní se sklo nesvaří. Nastav palivo na zhruba 60 % a potaš na 40 %.",
  "en": "Mind the wood. Potash gets none right now, and without it no glass can be melted. Set fuel to about 60% and potash to 40%.",
  "cta_cs": "Nastavit 60 / 40",
  "cta_en": "Set 60 / 40"
 },
 "food": {
  "anim": "react",
  "cs": "Lidé mají hlad. Potřebujeme {need} jídla měsíčně. Bez jídla klesá nálada a chlapi odcházejí. Kup zásobu, pole rodí jen od jara do podzimu.",
  "en": "The crew is hungry. We need {need} food per month. Without it morale drops and men leave. Buy a stock; the field only yields from spring to autumn.",
  "cta_cs": "Koupit jídlo",
  "cta_en": "Buy food",
  "hint_cs": "Zatím to nejde: chybí peníze nebo je jídlo vyprodané.",
  "hint_en": "Not possible yet: not enough coin or the food is sold out."
 },
 "wages": {
  "anim": "react",
  "cs": "Dlužíme partě {debt} na mzdách. Co není zaplaceno, ubírá loajalitu a kdo odejde, odnese dluh s sebou.",
  "en": "We owe the crew {debt} in wages. Unpaid wages eat loyalty, and whoever leaves takes the debt along.",
  "cta_cs": "Vyplatit mzdy",
  "cta_en": "Pay the wages",
  "hint_cs": "Nemáš dost peněz. Prodej sklo na Trhu.",
  "hint_en": "Not enough coin. Sell glass at the Market."
 },
 "crucibles": {
  "anim": "talk",
  "cs": "Bez pánve pec nevaří. Pánev se dělá jen v přípravě, zraje {age} měsíců a vydrží {dur} taveb. Máš jich {pans}. Pošli pánvaře dělat další.",
  "en": "Without a crucible the furnace cannot melt. Crucibles are made only in preparation, ripen for {age} months and last {dur} melts. You have {pans}. Put the crucible-maker to work.",
  "cta_cs": "Poslat pánvaře",
  "cta_en": "Assign crucible-maker",
  "hint_cs": "Chybí hlína, jídlo nebo volný dělník.",
  "hint_en": "Missing clay, food or a free worker."
 },
 "blowers": {
  "anim": "talk",
  "cs": "Surové sklo se prodává za málo, ale foukané předměty vynášejí několikrát víc. Na trhu je foukač {name} za {cost}. Najmi ho, vyplatí se to hned na první várce.",
  "en": "Raw glass sells for little, but blown ware earns several times more. There is a glassblower, {name}, at the market for {cost}. Hire him; it pays off on the first batch.",
  "cta_cs": "Najmout foukače",
  "cta_en": "Hire the glassblower",
  "hint_cs": "Našetři {cost} na výplatu nebo uvolni místo v partě.",
  "hint_en": "Save up {cost} for the hire or free a place in the crew."
 },
 "first_blow": {
  "anim": "talk",
  "cs": "Máš foukače, tak foukej! Z {n}× čirého skla udělá holby. Jedna se prodá za mnohem víc než surové sklo. Pak je prodej na Trhu.",
  "en": "You have a glassblower, so blow! He turns {n} clear glass into tavern mugs. One sells for far more than raw glass. Then sell them at the Market.",
  "cta_cs": "Vyfouknout holby",
  "cta_en": "Blow the mugs"
 },
 "low_sand": {
  "anim": "react",
  "cs": "Dochází písek nebo vápenec, a bez nich se sklo nesvaří. Pošli někoho do lomu.",
  "en": "Sand or limestone is running out, and glass cannot be melted without them. Send someone to the quarry.",
  "cta_cs": "Poslat do lomu",
  "cta_en": "Send to the quarry",
  "hint_cs": "Nemáš volného dělníka.",
  "hint_en": "No free worker."
 },
 "low_potash": {
  "anim": "react",
  "cs": "Potaš dochází. Pálí se ze dřeva a každá tavba jí chce dvě. Dej někoho na loužírnu a nech jí podíl dřeva.",
  "en": "Potash is running out. It is burned from wood and each melt needs two. Put someone on the potash station and leave it a share of the wood.",
  "cta_cs": "Poslat na potaš",
  "cta_en": "Send to potash",
  "hint_cs": "Nemáš volného dělníka.",
  "hint_en": "No free worker."
 },
 "low_water": {
  "anim": "react",
  "cs": "Vody je na dně. Pošli někoho k potoku.",
  "en": "Water is nearly gone. Send someone to the stream.",
  "cta_cs": "Poslat pro vodu",
  "cta_en": "Send for water",
  "hint_cs": "Nemáš volného dělníka.",
  "hint_en": "No free worker."
 },
 "low_wood": {
  "anim": "react",
  "cs": "Dřevo dochází. Bez něj nepálíš ani potaš, ani pec. Pošli někoho kácet.",
  "en": "Wood is running out. Without it neither potash nor the furnace can be fed. Send someone to log.",
  "cta_cs": "Poslat kácet",
  "cta_en": "Send logging",
  "hint_cs": "Nemáš volného dělníka.",
  "hint_en": "No free worker."
 },
 "unsold_glass": {
  "anim": "talk",
  "cs": "Máš {n}× sklo ve skladu a prázdnou kapsu. Jdi na Trh a prodej.",
  "en": "You have {n} glass in stock and an empty purse. Go to the Market and sell.",
  "cta_cs": "Otevřít Trh",
  "cta_en": "Open the Market",
  "tab": "market"
 },
 "forest_low": {
  "anim": "react",
  "cs": "Hvozd není nekonečný. Zbývá {forest} z {max} parcel a dorůstá jen pomalu. Pošli někoho sázet stromky, jinak dřevo za pár sezón dojde.",
  "en": "The forest is not endless. {forest} of {max} parcels remain and it regrows slowly. Send someone to plant trees, or the wood will run out in a few seasons.",
  "cta_cs": "Poslat sázet",
  "cta_en": "Send planting",
  "hint_cs": "Nemáš volného dělníka.",
  "hint_en": "No free worker."
 },
 "tier1": {
  "anim": "talk",
  "cs": "Pec stojí zděná a máš materiál. Povýšením na tier 1 prodloužíš tavbu o listopad, tedy o měsíc víc prodeje.",
  "en": "The furnace is built of stone and you have the materials. Tier 1 extends melting through November: one more month of sales.",
  "cta_cs": "Povýšit na tier 1",
  "cta_en": "Upgrade to tier 1"
 },
 "contracts_fama": {
  "anim": "talk",
  "cs": "Zakázky platí napevno, často méně než trh, ale přinášejí Famu. Fama otevírá vyšší tiery a velké zakázky. Pro začátek ji nepotřebuješ.",
  "en": "Contracts pay a fixed price, often less than the market, but they bring Fama. Fama opens higher tiers and big commissions. You do not need it to start.",
  "cta_cs": "Rozumím",
  "cta_en": "Got it"
 },
 "field": {
  "anim": "react",
  "cs": "Jídlo máme na pokraji. Pole rodí od dubna do listopadu, jeden člověk přinese jedno až dvě jídla měsíčně. Pošli někoho na pole, ať máme čím krmit {need} krků měsíčně.",
  "en": "Food is running thin. The field yields from April to November, one or two food per worker per month. Send someone to the field so we can feed the crew, {need} per month.",
  "cta_cs": "Poslat na pole",
  "cta_en": "Send to the field",
  "hint_cs": "Nemáš volného dělníka.",
  "hint_en": "No free worker."
 },
 "blow_more": {
  "anim": "talk",
  "cs": "Z pece přibylo {n}× sklo. Vyfoukni ho dřív, než ho prodáš. Surové se prodává za zlomek.",
  "en": "{n} new glass came out of the furnace. Blow it before you sell it; raw glass sells for a fraction.",
  "cta_cs": "Vyfouknout",
  "cta_en": "Blow it"
 },
 "furnace_stone": {
  "anim": "talk",
  "cs": "Zděná pec má druhý slot, tedy dvakrát tolik skla za měsíc. Stojí 20 dřeva, 8 vápence, 6 hlíny a 15 zl. Pamatuj, že druhý slot potřebuje i druhou pánev.",
  "en": "A stone furnace has a second slot, twice the glass per month. It costs 20 wood, 8 limestone, 6 clay and 15 fl. Remember that the second slot needs a second crucible too.",
  "cta_cs": "Postavit zděnou pec",
  "cta_en": "Build the stone furnace"
 },
 "potash_enough": {
  "anim": "talk",
  "cs": "Potaše máš {potash} a to stačí. Pálí se z ní šest dřev za kus. {worker} je potřeba jinde, ať jde na: {task}.",
  "en": "You have {potash} potash, which is plenty. Each piece burns six wood. {worker} is needed elsewhere: {task}.",
  "cta_cs": "Přeřadit",
  "cta_en": "Reassign"
 },
 "low_clay": {
  "anim": "react",
  "cs": "Dochází hlína. Potřebuješ ji na pánve, na zděnou pec i na povýšení hutě. Pošli někoho kopat.",
  "en": "Clay is running low. You need it for crucibles, the stone furnace and the tier upgrade. Send someone to dig.",
  "cta_cs": "Poslat pro hlínu",
  "cta_en": "Send for clay",
  "hint_cs": "Nemáš volného dělníka.",
  "hint_en": "No free worker."
 }
};
