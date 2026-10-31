// calendar.js — months, market calendar, per-month data and hints.
// Verbatim data moved out of core/ (no logic). Classic script: plain top-level consts in the shared global scope; load order is fixed by build.js.

// Kalendář: Listopad(0)→Říjen(11)
// Příprava = kola 0–4 (Listopadu–Březen), Kampaň = kola 5–11 (Duben–Říjen)
const MONTHS_CS=["Listopad","Prosinec","Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen"];
const MONTHS_EN=["November","December","January","February","March","April","May","June","July","August","September","October"];

// Trh: Listopad zavřen, Prosinec otevřen (vánoční), Leden+Únor zavřeny, Březen+ otevřen
const MARKET_CLOSED=[true,false,false,true,false,false,false,false,false,false,false,false];   // leden = Tříkrálový trh (kupec přijíždí, KUPEC_ROUNDS)

// Speciální kupec: Prosinec(1), Tři králové=Leden(2), Velikonoce≈Duben(5)
const KUPEC_ROUNDS=[1,2,5];

const MONTH_DATA=[
  {// 0 - Listopad
   icon:"❄️", phase_cs:"Příprava · Zima", phase_en:"Prep · Winter",
   priority_cs:"Svoz dřeva! Na sněhu jedou sáně — těžba +50 %. Hvozd je konečný: kácej jen na palivo a potaš, které opravdu spotřebuješ.",
   priority_en:"Haul wood! Sleds on snow — logging +50%. The forest is finite: cut only what fuel and potash will actually use.",
   tip_cs:"Pec vyhasnutá. Čas na opravu vyzdívky a sušení pánví.",
   tip_en:"Furnace cold. Time to repair lining and dry crucibles.",
   trh_cs:"⛔ Trh uzavřen — cesty zasněženy", trh_en:"⛔ Market closed — roads snowed in"},
  {// 1 - Prosinec
   icon:"🎄", phase_cs:"Příprava · Vánoce", phase_en:"Prep · Christmas",
   priority_cs:"Vánoční trhy otevřeny! Prodej zásoby. Těžba +50%.",
   priority_en:"Christmas markets open! Sell stock. Logging +50%.",
   tip_cs:"Kupec přijíždí na trhy. Jíl se v zimě vymrazí — pánve budou kvalitnější.",
   tip_en:"Merchant comes to market. Frost purifies clay — better crucibles.",
   trh_cs:"✅ Vánoční trhy — kupci jedou z údolí", trh_en:"✅ Christmas markets — merchants from the valley"},
  {// 2 - Leden
   icon:"⛄", phase_cs:"Příprava · Tři králové", phase_en:"Prep · Epiphany",
   priority_cs:"Tři králové — kupec přijíždí naposledy. Těžba +50%.",
   priority_en:"Epiphany — merchant's last winter visit. Logging +50%.",
   tip_cs:"Palivo na celou kampaň musí být na skladě do března (primitivní pec ≈ 40 🪵: 4/kolo, od května 6/kolo). Přebytečné dřevo nepřeváděj na potaš.",
   tip_en:"Fuel for the whole campaign must be in stock by March (primitive furnace ≈ 40 🪵: 4/round, 6/round from May). Don't turn surplus wood into potash.",
   trh_cs:"✅ Tříkrálový trh (6. ledna)", trh_en:"✅ Epiphany market (Jan 6th)"},
  {// 3 - Únor
   icon:"🌬️", phase_cs:"Příprava · Masopust", phase_en:"Prep · Carnival",
   priority_cs:"Poslední přípravy. Dokonči pánve, zkontroluj pec.",
   priority_en:"Final preparations. Finish crucibles, check the furnace.",
   tip_cs:"Cesty stále nesjízdné. Žádný prodej — jen zásobování.",
   tip_en:"Roads still impassable. No sales — only stockpiling.",
   trh_cs:"⛔ Trh uzavřen — masopust, cesty rozbahněny", trh_en:"⛔ Market closed — carnival, muddy roads"},
  {// 4 - Březen
   icon:"🌱", phase_cs:"Příprava · Jaro", phase_en:"Prep · Spring",
   priority_cs:"Trhy otevřeny! Doplň zásoby u Weisse. Připrav kmen.",
   priority_en:"Markets open! Restock from Weiss. Prepare the batch.",
   tip_cs:"Pec se zahřívá. Za měsíc sv. Jiří — rozžehneme!",
   tip_en:"Furnace warms up. St. George's day next month — we light it!",
   trh_cs:"✅ Jarní trhy otevřeny", trh_en:"✅ Spring markets open"},
  {// 5 - Duben — sv. Jiří
   icon:"🔥", phase_cs:"Kampaň · Sv. Jiří", phase_en:"Campaign · St. George",
   priority_cs:"Sv. Jiří (24.4.) — pec se rozežíná! Začíná kampaň.",
   priority_en:"St. George (Apr 24) — furnace lit! Campaign begins.",
   tip_cs:"Velikonoce — kupec přijíždí. Prodej co máš ve skladu.",
   tip_en:"Easter — merchant arrives. Sell what you have in storage.",
   trh_cs:"✅ Velikonoční trhy — kupec přijíždí!", trh_en:"✅ Easter market — merchant arrives!"},
  {// 6 - Květen
   icon:"🌸", phase_cs:"Kampaň · Jaro", phase_en:"Campaign · Spring",
   priority_cs:"Pec se zabíhá. Waldglas teče. Hlídej písek a potaš (várka = 3 písek + 2 potaš). Od května pec pálí o 2 🪵 víc.",
   priority_en:"Furnace running in. Waldglas flowing. Watch sand and potash (batch = 3 sand + 2 potash). From May the furnace burns 2 🪵 more.",
   tip_cs:"Účinnost pece roste s každou várkou — nevynechávej.",
   tip_en:"Furnace efficiency grows with each batch — don't skip.",
   trh_cs:"✅ Trh otevřen", trh_en:"✅ Market open"},
  {// 7 - Červen
   icon:"☀️", phase_cs:"Kampaň · Léto", phase_en:"Campaign · Summer",
   priority_cs:"Vrchol sezóny. Maximální produkce — pánve nesmíš vynechat.",
   priority_en:"Peak season. Maximum output — don't skip crucibles.",
   tip_cs:"Horko — dělníci unavenější. Pivo pomáhá.",
   tip_en:"Heat — workers tire faster. Beer helps.",
   trh_cs:"✅ Trh otevřen — nejlepší ceny sezóny", trh_en:"✅ Market open — best prices of season"},
  {// 8 - Červenec
   icon:"🌻", phase_cs:"Kampaň · Léto", phase_en:"Campaign · Summer",
   priority_cs:"Plný provoz. Šamot se opotřebovává — sleduj stav.",
   priority_en:"Full operation. Shamot wearing — watch the state.",
   tip_cs:"Letos vyprodej vše — zima trhy zavírá.",
   tip_en:"Sell everything this year — winter closes markets.",
   trh_cs:"✅ Trh otevřen", trh_en:"✅ Market open"},
  {// 9 - Srpen
   icon:"🌾", phase_cs:"Kampaň · Žně", phase_en:"Campaign · Harvest",
   priority_cs:"Zásoby jídla! Pole a chlévy se plní před zimou.",
   priority_en:"Food supplies! Fields and stables before winter.",
   tip_cs:"Výsadba (i v kampani) přidá v mezisezóně +2–3 parcely za kolo, max. 4 kola za sezónu. Pošli na ni dělníka, který nemá jinou práci.",
   tip_en:"Reforesting (also in campaign) adds +2–3 parcels per round in the off-season, max. 4 rounds per season. Send a worker with nothing better to do.",
   trh_cs:"✅ Trh otevřen — žňové trhy", trh_en:"✅ Market open — harvest fairs"},
  {// 10 - Září
   icon:"🍂", phase_cs:"Kampaň · Podzim", phase_en:"Campaign · Autumn",
   priority_cs:"Poslední várky před Sv. Havlem. Prodej vše!",
   priority_en:"Last batches before St. Gall. Sell everything!",
   tip_cs:"Sv. Havel (16.10.) — tradiční konec kampaně se blíží.",
   tip_en:"St. Gall (Oct 16) — traditional campaign end approaches.",
   trh_cs:"✅ Trh otevřen — podzimní trhy", trh_en:"✅ Market open — autumn fairs"},
  {// 11 - Říjen — sv. Havel/Martin
   icon:"🕯️", phase_cs:"Kampaň · Sv. Havel", phase_en:"Campaign · St. Gall",
   priority_cs:"Sv. Havel (16.10.) / Sv. Martin (11.11.) — kampaň končí.",
   priority_en:"St. Gall (Oct 16) / St. Martin (Nov 11) — campaign ends.",
   tip_cs:"Pec zhasni, prodej zásoby. Zima přichází — připrav sáně.",
   tip_en:"Douse the furnace, sell stock. Winter comes — ready the sleds.",
   trh_cs:"✅ Poslední podzimní trhy", trh_en:"✅ Last autumn markets"}
];

const HINTS_CS=MONTH_DATA.map(m=>m.priority_cs);
const HINTS_EN=MONTH_DATA.map(m=>m.priority_en);

// Termín zakázky = konec měsíce MONTHS[due] (dodání se vyhodnocuje při uzavření kola, round<=due)
const MONTHS_GEN_CS=["listopadu","prosince","ledna","února","března","dubna","května","června","července","srpna","září","října"];
