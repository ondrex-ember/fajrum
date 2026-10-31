// market.js — market goods, prices and seasonal offers.
// Verbatim data moved out of core/ (no logic). Classic script: plain top-level consts in the shared global scope; load order is fixed by build.js.

const MERCH={sand:{b:2,e:"🏖️"},limestone:{b:2,e:"🟩"},clay:{b:2,e:"🧱"},pureSand:{b:5,e:"✨"},
  refinedPotash:{b:4,e:"🌿"},charcoal:{b:3,e:"⚫"},wood:{b:WOOD_EMERGENCY_PRICE,e:"🌲"},water:{b:1,e:"💧"},
  food:{b:2,e:"🍞"},stone:{b:2,e:"🪨"},dryWood:{b:3,e:"🔥"},firebrick:{b:4,e:"🧱"},pitch:{b:3,e:"🌲"}};

// Názvy a popisky zboží kramáře Weisse (CS/EN) — jedno místo pro Trh i kroniku
const MERCH_INFO={
  sand:         {cs:"Písek",           en:"Sand",           d_cs:"Waldglas: 3 ks na várku",                d_en:"Waldglas: 3 per batch"},
  limestone:    {cs:"Vápenec",         en:"Limestone",      d_cs:"Tavidlo: 1 ks na várku",                 d_en:"Flux: 1 per batch"},
  clay:         {cs:"Jíl",             en:"Clay",           d_cs:"Pánve (2 ks) a formy",                   d_en:"Crucibles (2 each) and moulds"},
  pureSand:     {cs:"Čistý písek",     en:"Pure sand",      d_cs:"Křišťál: 3 ks na várku",                 d_en:"Crystal: 3 per batch"},
  refinedPotash:{cs:"Čistá potaš",     en:"Refined potash", d_cs:"Křišťál: 2 ks na várku",                 d_en:"Crystal: 2 per batch"},
  charcoal:     {cs:"Uhlí",            en:"Charcoal",       d_cs:"Křišťál: 1 ks na várku",                 d_en:"Crystal: 1 per batch"},
  wood:         {cs:"Dřevo",           en:"Wood",           d_cs:"Palivo a potaš; hvozd je levnější",      d_en:"Fuel and potash; the forest is cheaper"},
  water:        {cs:"Voda",            en:"Water",          d_cs:"Waldglas: 1 ks na várku, formy",         d_en:"Waldglas: 1 per batch, moulds"},
  food:         {cs:"Jídlo",           en:"Food",           d_cs:"Živí dělníky",                           d_en:"Feeds the workers"},
  stone:        {cs:"Lomový kámen",    en:"Quarry stone",   d_cs:"Stavba pece a šamotové kvádry",          d_en:"Furnace building and firebricks"},
  dryWood:      {cs:"Suché dříví",     en:"Dry hardwood",   d_cs:"Rozšíření sezóny a zimní žár",           d_en:"Season extension and winter heat"},
  firebrick:    {cs:"Šamotové kvádry", en:"Firebrick",      d_cs:"Mistrovská pec a celoroční provoz",      d_en:"Master furnace and year-round operation"},
  pitch:        {cs:"Smůla",           en:"Pitch",          d_cs:"Izolace náhonu proti mrazu",             d_en:"Insulates the flume against frost"}
};

// Baranovský — nabídky dle sezóny
const BARAN_OFFERS=[
  // Sezóna 1-2: základní přísady
  {season:1, item:"burel",     qty:2, price:10, cs:"Přivezl jsem burel z Čech. Jen se ptejte.", en:"Brought burel from Bohemia. Just ask."},
  {season:1, item:"crocusMartis",qty:2,price:8, cs:"Crocus Martis — ze saských dolů.", en:"Crocus Martis from Saxon mines."},
  // Sezóna 2: vzácnější
  {season:2, item:"smolka",    qty:1, price:22, cs:"Šmolka ze Saska — stojí to za to.", en:"Zaffre from Saxony — worth every penny."},
  {season:2, item:"aesUstum",  qty:1, price:16, cs:"Pálená měď — sám jsem ji připravil.", en:"Burnt copper — prepared it myself."},
  {season:2, item:"cin",       qty:2, price:14, cs:"Cín čistý. Lattimo uděláte jako Benátčani.", en:"Pure tin. You'll make lattimo like Venice."},
  {season:2, item:"arsen",    qty:1, price:26, cs:"Arsenová běl z Krušných hor. Opatrně s ní — jed, ale čeří jako nic jiného.", en:"White arsenic from the Ore Mountains. Careful — poison, but nothing fines like it."},
  {season:2, item:"stribro",   qty:2, price:20, cs:"Stříbro z Kutné Hory. Na křišťál se žlutou lazurou — rytci po ní šílí.", en:"Silver from Kutná Hora. For crystal with a yellow stain — engravers go mad for it."},
  // Sezóna 3: exkluzivní
  {season:3, item:"olovo",     qty:2, price:12, cs:"Olovo z Krumlova. První třídy.", en:"Lead from Krumlov. First class."},
  {season:3, item:"antimon",   qty:1, price:18, cs:"Antimon — vzácné. Kunckelova věc.", en:"Antimony — rare. Kunckel's thing."},
  {season:3, item:"rtut",      qty:1, price:22, cs:"Rtuť z Idrie. Drahá, ale bez ní zrcadlo neuděláte.", en:"Mercury from Idrija. Costly, but no mirror without it."},
  // Sezóna 4: zlatý prach
  {season:4, item:"zlato",     qty:1, price:45, cs:"Zlatý prach. Za tuhle cenu vám ho nikdo jiný nedá.", en:"Gold dust. Nobody else will give it this cheap."}
];
