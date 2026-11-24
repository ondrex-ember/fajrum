// Obchodní partneři jako postavy (vztah, metriky, historie). Obsah ladí ručně — stejná data jako Android content/PARTNERS.json.
// Na partnera: name, role_*, emoji, portrait, buyer (klíč `buyer` zakázek), quote_*, bio_*, startTrust, tiers[{min,cs,en,line_*}], events{id:{delta,cs,en}}.
// Fáze A: vztah se jen ZAZNAMENÁVÁ a zobrazuje; do pravidel (ceny, úroky) nezasahuje a nesahá na RNG.
const PARTNERS={
 "weiss": {
  "name": "Weiss",
  "role_cs": "Kupec",
  "role_en": "Merchant",
  "emoji": "🧑‍🌾",
  "portrait": "partners/weiss.webp",
  "quote_cs": "Sklo je jako chleba. Čerstvé se prodá samo, staré musíš vnutit.",
  "quote_en": "Glass is like bread. Fresh, it sells itself; stale, you have to push it.",
  "bio_cs": "Weiss objíždí hutě a trhy s vozem a dvěma koňmi. Vykupuje lesní sklo, vozí sůl, železo a dřevo, když dojde. Platí hned, ale smlouvá o každý groš. Kdo mu dodá včas, toho si pamatuje. Kdo ne, o toho se příště nezastaví.",
  "bio_en": "Weiss travels between glassworks and markets with a cart and two horses. He buys forest glass and brings salt, iron and wood when it runs out. He pays on the spot but haggles over every groat. He remembers who delivers on time, and passes by those who do not.",
  "startTrust": 20,
  "tiers": [
   {
    "min": 0,
    "cs": "Cizí",
    "en": "Stranger",
    "line_cs": "Neznám tě. Ukaž zboží, pak si promluvíme.",
    "line_en": "I do not know you. Show me the goods, then we talk."
   },
   {
    "min": 25,
    "cs": "Známý",
    "en": "Acquaintance",
    "line_cs": "Tvoje huť už má u mě jméno. Malé, ale má.",
    "line_en": "Your foundry has a name with me now. A small one, but a name."
   },
   {
    "min": 50,
    "cs": "Spolehlivý dodavatel",
    "en": "Reliable supplier",
    "line_cs": "S tebou se dá počítat. To se v tomhle kraji cení.",
    "line_en": "One can count on you. That is worth something in these parts."
   },
   {
    "min": 75,
    "cs": "Obchodní přítel",
    "en": "Trade friend",
    "line_cs": "Tvoje sklo beru jako první. A říkám o něm dál.",
    "line_en": "I take your glass first. And I speak of it elsewhere."
   }
  ],
  "events": {
   "contractDone": {
    "delta": 3,
    "cs": "Splněná zakázka",
    "en": "Contract delivered"
   },
   "contractExpired": {
    "delta": -6,
    "cs": "Propadlá zakázka",
    "en": "Contract missed"
   },
   "quickSell": {
    "delta": 1,
    "cs": "Rychlý výkup skladu",
    "en": "Quick buy-out of stock"
   },
   "visit": {
    "delta": 0,
    "cs": "Přijel na trh",
    "en": "Came to the market"
   },
   "woodBought": {
    "delta": 0,
    "cs": "Prodal nouzové dřevo",
    "en": "Sold emergency wood"
   }
  },
  "buyer": "Weiss"
 },
 "reichel": {
  "name": "Reichel",
  "role_cs": "Faktor",
  "role_en": "Factor",
  "emoji": "🧐",
  "portrait": "partners/reichel.webp",
  "quote_cs": "Půjčím každému. Jednou.",
  "quote_en": "I lend to anyone. Once.",
  "bio_cs": "Faktor Reichel zastupuje v kraji obchodní dům a jeho peníze. Zálohuje hutím suroviny a mzdy přes zimu a splátky si bere z prodaného skla. Tvému otci půjčil na první pec a dluh přešel na tebe. Účty vede sám a nezapomíná.",
  "bio_en": "Factor Reichel represents a trading house and its money in the region. He advances glassworks their materials and winter wages and takes his instalments from the glass they sell. He lent your father the money for the first furnace, and the debt passed to you. He keeps the ledger himself and forgets nothing.",
  "startTrust": 20,
  "tiers": [
   {
    "min": 0,
    "cs": "Dlužník",
    "en": "Debtor",
    "line_cs": "Dluh tvého otce je teď tvůj. Uvidíme, co jsi zač.",
    "line_en": "Your father's debt is yours now. We shall see what you are made of."
   },
   {
    "min": 25,
    "cs": "Platící dlužník",
    "en": "Paying debtor",
    "line_cs": "Splácíš. To je víc, než mohu říct o jiných.",
    "line_en": "You pay. That is more than I can say of others."
   },
   {
    "min": 50,
    "cs": "Spolehlivý klient",
    "en": "Reliable client",
    "line_cs": "S tvou hutí už nepočítám jako s rizikem.",
    "line_en": "I no longer book your foundry as a risk."
   },
   {
    "min": 75,
    "cs": "Důvěryhodný hutmistr",
    "en": "Trusted master",
    "line_cs": "Řekni si, kolik potřebuješ. O úroku se domluvíme.",
    "line_en": "Name what you need. We will agree on the interest."
   }
  ],
  "events": {
   "loan": {
    "delta": -1,
    "cs": "Nová půjčka",
    "en": "New loan"
   },
   "repay": {
    "delta": 2,
    "cs": "Předčasná splátka",
    "en": "Early repayment"
   },
   "autopay": {
    "delta": 0.5,
    "cs": "Řádná splátka",
    "en": "Regular instalment"
   },
   "cleared": {
    "delta": 8,
    "cs": "Dluh zcela splacen",
    "en": "Debt fully cleared"
   },
   "moratorium": {
    "delta": -4,
    "cs": "Odklad splátek",
    "en": "Repayment deferral"
   },
   "advanceDone": {
    "delta": 3,
    "cs": "Zakázka se zálohou dodána",
    "en": "Advance contract delivered"
   },
   "advanceMissed": {
    "delta": -6,
    "cs": "Zakázka se zálohou nedodána",
    "en": "Advance contract missed"
   }
  }
 },
 "hoffmann": {
  "name": "Hoffmann",
  "role_cs": "Faktor",
  "role_en": "Factor",
  "emoji": "🎩",
  "portrait": "partners/hoffmann.webp",
  "buyer": "Hoffmann",
  "quote_cs": "V Drážďanech se ptají po českém křišťálu. Po dobrém.",
  "quote_en": "In Dresden they ask for Bohemian crystal. The good kind.",
  "bio_cs": "Faktor Hoffmann nakupuje pro drážďanský obchodní dům. Lesní sklo ho nezajímá, chce křišťál a chce ho včas, protože vozy na sever nečekají. Platí lépe než trh, ale jedinou propadlou zásilku si pamatuje dlouho.",
  "bio_en": "Factor Hoffmann buys for a Dresden trading house. Forest glass does not interest him; he wants crystal and wants it on time, for the wagons north do not wait. He pays better than the market, but remembers a single missed shipment for a long time.",
  "startTrust": 20,
  "tiers": [
   {
    "min": 0,
    "cs": "Neznámá huť",
    "en": "Unknown foundry",
    "line_cs": "O vaší huti jsem zatím neslyšel nic. Ani dobrého, ani zlého.",
    "line_en": "I have heard nothing of your foundry yet. Neither good nor ill."
   },
   {
    "min": 25,
    "cs": "Zkoušený dodavatel",
    "en": "Supplier on trial",
    "line_cs": "První zásilky dorazily. Uvidíme, jestli to vydrží.",
    "line_en": "The first shipments arrived. We shall see whether it lasts."
   },
   {
    "min": 50,
    "cs": "Stálý dodavatel",
    "en": "Regular supplier",
    "line_cs": "Vaše sklo má v Drážďanech své kupce.",
    "line_en": "Your glass has its buyers in Dresden."
   },
   {
    "min": 75,
    "cs": "Dvorní dodavatel domu",
    "en": "Supplier to the house",
    "line_cs": "Náš dům vaše sklo nabízí jako první.",
    "line_en": "Our house offers your glass first."
   }
  ],
  "events": {
   "contractDone": {
    "delta": 3,
    "cs": "Splněná zakázka",
    "en": "Contract delivered"
   },
   "contractExpired": {
    "delta": -6,
    "cs": "Propadlá zakázka",
    "en": "Contract missed"
   }
  }
 },
 "opat": {
  "name": "z Lemberka",
  "role_cs": "Opat",
  "role_en": "Abbot",
  "emoji": "⛪",
  "portrait": "partners/abbot.webp",
  "buyer": "Opat",
  "quote_cs": "Sklo na oltáři má být čisté jako úmysl toho, kdo je dělal.",
  "quote_en": "Glass upon the altar should be as pure as the intent of its maker.",
  "bio_cs": "Opat z Lemberka objednává sklo pro klášter: kalichy, lampy a později i okna. Neplatí nejvíc, ale jeho slovo má váhu u církve i u vrchnosti. Co slíbíš klášteru a nedodáš, to se v kraji rozkřikne.",
  "bio_en": "The Abbot of Lemberk orders glass for the monastery: chalices, lamps and later windows. He does not pay the most, but his word carries weight with the Church and the lords. What you promise the monastery and fail to deliver becomes known across the region.",
  "startTrust": 20,
  "tiers": [
   {
    "min": 0,
    "cs": "Světský řemeslník",
    "en": "Lay craftsman",
    "line_cs": "Bůh žehnej vaší práci. Uvidíme, jaká je.",
    "line_en": "God bless your work. We shall see what it is."
   },
   {
    "min": 25,
    "cs": "Známý kláštera",
    "en": "Known to the monastery",
    "line_cs": "Bratři o vašem skle mluví s uznáním.",
    "line_en": "The brothers speak well of your glass."
   },
   {
    "min": 50,
    "cs": "Sklář kláštera",
    "en": "Glassmaker to the monastery",
    "line_cs": "Pro klášter už jiné sklo nehledáme.",
    "line_en": "We look for no other glass for the monastery."
   },
   {
    "min": 75,
    "cs": "Pod ochranou kláštera",
    "en": "Under the monastery's protection",
    "line_cs": "Vaše huť má v klášteře přímluvce.",
    "line_en": "Your foundry has an advocate in the monastery."
   }
  ],
  "events": {
   "contractDone": {
    "delta": 3,
    "cs": "Splněná zakázka",
    "en": "Contract delivered"
   },
   "contractExpired": {
    "delta": -6,
    "cs": "Propadlá zakázka",
    "en": "Contract missed"
   }
  }
 },
 "harrach": {
  "name": "von Harrach",
  "role_cs": "Šlechtic",
  "role_en": "Nobleman",
  "emoji": "👑",
  "portrait": "partners/nobleman.webp",
  "buyer": "Slechtic",
  "quote_cs": "Na mém stole se pije jen z toho nejlepšího.",
  "quote_en": "At my table one drinks only from the best.",
  "bio_cs": "Pán von Harrach objednává poháry a číše pro svůj stůl a hosty. Platí dobře a chce kvalitu, kterou lze ukázat. Spokojený šlechtic znamená další objednávky, zklamaný si najde jinou huť.",
  "bio_en": "Lord von Harrach orders goblets and cups for his table and his guests. He pays well and wants quality that can be shown off. A satisfied nobleman means further orders; a disappointed one finds another foundry.",
  "startTrust": 20,
  "tiers": [
   {
    "min": 0,
    "cs": "Bezejmenná huť",
    "en": "Nameless foundry",
    "line_cs": "Vaše jméno mi nic neříká.",
    "line_en": "Your name means nothing to me."
   },
   {
    "min": 25,
    "cs": "Vyzkoušený sklář",
    "en": "Tried glassmaker",
    "line_cs": "Poháry obstály. Hosté se ptali, odkud jsou.",
    "line_en": "The goblets held up. My guests asked where they came from."
   },
   {
    "min": 50,
    "cs": "Dodavatel panského stolu",
    "en": "Supplier to the lord's table",
    "line_cs": "Na zámku se pije z vašeho skla.",
    "line_en": "At the manor one drinks from your glass."
   },
   {
    "min": 75,
    "cs": "Oblíbenec panství",
    "en": "Favourite of the estate",
    "line_cs": "Doporučil jsem vás u dvora.",
    "line_en": "I have recommended you at court."
   }
  ],
  "events": {
   "contractDone": {
    "delta": 3,
    "cs": "Splněná zakázka",
    "en": "Contract delivered"
   },
   "contractExpired": {
    "delta": -6,
    "cs": "Propadlá zakázka",
    "en": "Contract missed"
   }
  }
 }
};
const PARTNER_LOG_MAX=30;
