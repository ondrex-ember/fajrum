// ═══════════════════════════════════════════════════════
// ACHIEVEMENTS & WIKI DATA
// ═══════════════════════════════════════════════════════

const ACHIEVEMENTS=[
  // ── Výrobní milestony ──
  {id:"ignis_mutat_res", icon:"🔥", cat:"production",
   cs:"Ignis mutat res", en:"Ignis mutat res",
   desc_cs:"První úspěšná várka skla. Oheň mění věci — a tebe s nimi.",
   desc_en:"First successful glass batch. Fire changes things — and you with them.",
   latin:"Ignis mutat res",
   hint_cs:"Uvar první várku waldglas nebo křišťálu.",
   hint_en:"Complete your first batch of waldglas or crystal.",
   img_id:"ach_ignis_mutat_res", available:true},

  {id:"tercikár", icon:"🪟", cat:"production",
   cs:"Terčíkář", en:"Window-Disc Maker",
   desc_cs:"Okenní terčíky Ø8–10 cm. Nejmasovější sortiment každé hutě v Čechách. Nepodařené kusy se neházely — specialista je přímo na místě přetvaroval na výplňové tvary.",
   desc_en:"Window discs Ø8–10 cm. The most mass-produced item of every Bohemian foundry. Rejects weren't discarded — a specialist reshaped them as filler pieces on site.",
   latin:"Vitrum fenestrale",
   src_cs:"Vepřeková, Pražský hrad 2015",
   src_en:"Vepřeková, Prague Castle 2015",
   hint_cs:"Prodej okenní terčíky (kristal/waldglas panel).",
   hint_en:"Sell window disc panels.",
   img_id:"ach_tercikár", available:true},

  {id:"speculum", icon:"🪞", cat:"production",
   cs:"Speculum", en:"Speculum",
   desc_cs:"Zrcadlo — luxus, který si málokdo mohl dovolit. Zadní strana: amalgám rtuti a cínu. Rtuť bylo nutné dovézt — bez kupce žádné zrcadlo.",
   desc_en:"A mirror — a luxury few could afford. Rear side: mercury-tin amalgam. Mercury had to be imported — no merchant, no mirror.",
   latin:"Speculum — fortuna vitrea est",
   src_cs:"Vepřeková, CP_13II2015",
   src_en:"Vepřeková, CP_13II2015",
   hint_cs:"Vyžaduje rtuť od kupce a čiré sklo.",
   hint_en:"Requires mercury from merchant and clear glass.",
   img_id:"ach_speculum", available:true},

  {id:"kunckel", icon:"💎", cat:"production",
   cs:"Kunkelovo tajemství", en:"Kunckel's Secret",
   desc_cs:"Zlatý rubín — barva se tvoří až při druhém, pomalém zahřátí (náběhu). Koloidní nanočástice zlata v tavenině narostou na správnou velikost. Kunckel popsal postup v Ars Vitraria Experimentalis (1679). Zlato musí být přesně dávkováno — jinak rubín nevznikne.",
   desc_en:"Gold ruby — the colour forms only on a second, slow reheating (striking). Colloidal gold nanoparticles in the melt grow to the right size. Kunckel described the process in Ars Vitraria Experimentalis (1679). Gold must be precisely dosed — otherwise no ruby.",
   latin:"Donec fiat vitrum pellucidum",
   src_cs:"Kunckel 1679, Babořák 2023",
   src_en:"Kunckel 1679, Babořák 2023",
   hint_cs:"Uspěj s rubínovým sklem (strike glass).",
   hint_en:"Successfully produce ruby glass (strike glass).",
   img_id:"ach_kunckel", available:true},

  {id:"reticello", icon:"🕸️", cat:"production",
   cs:"Vetro a reticello", en:"Vetro a reticello",
   desc_cs:"Nejsložitější filigránové sklo — dvě zkřížené vrstvy kroucených nitek vytvářejí síťový vzor. Tyčinky musí být přesně seřazeny a nataveny. V Čechách od přelomu 17. stol. — novinka roku 1680.",
   desc_en:"The most complex filigree glass — two crossed layers of twisted threads form a net pattern. Canes must be precisely aligned and fused. In Bohemia from the turn of the 17th century — a novelty in 1680.",
   latin:"Vetro a reticello — Murano",
   src_cs:"Whitty, Istituto Veneto 2015",
   src_en:"Whitty, Istituto Veneto 2015",
   hint_cs:"Filigrán — přijde v další verzi.",
   hint_en:"Filigree glass — coming in next version.",
   img_id:"ach_reticello", available:false,
   future_cs:"Filigránové sklo — přijde v další verzi",
   future_en:"Filigree glass — coming in next version"},

  // ── Technologické přechody ──
  {id:"barokni_prelom", icon:"⚗️", cat:"tech",
   cs:"Barokní přelom", en:"Baroque Turning Point",
   desc_cs:"Kolem roku 1680 přešly čechy od renesanční technologie (draselno-vápenatá s bukovým popelem) na barokní sklo bez popela — čistý křišťál vhodný pro broušení a rytí. Přelom dvou epoch v jedné dílně.",
   desc_en:"Around 1680 Bohemia shifted from Renaissance technology (potash-lime with beech ash) to Baroque glass without ash — pure crystal suitable for cutting and engraving. The turning point of two epochs in one workshop.",
   latin:"In igne probatur",
   src_cs:"Sedláčková & Rohanová, Istituto Veneto 2015",
   src_en:"Sedláčková & Rohanová, Istituto Veneto 2015",
   hint_cs:"Přijde v další verzi — technologie barokního skla.",
   hint_en:"Coming in next version — Baroque glass technology.",
   img_id:"ach_barokni_prelom", available:false,
   future_cs:"Barokní technologie — přijde v další verzi",
   future_en:"Baroque technology — coming in next version"},

  {id:"ceska_pec", icon:"🏗️", cat:"tech",
   cs:"Česká pec", en:"Bohemian Furnace",
   desc_cs:"Centrální rošt po celé délce tavicí pece umožňuje spalování velkých polen — spotřeba dřeva klesá o 50 %. Konec 17. stol. — technologická revoluce. V roce 1680 ještě novinka.",
   desc_en:"A central grate along the full length of the melting furnace enables burning of large logs — wood consumption drops by 50%. End of 17th century — a technological revolution. In 1680 still a novelty.",
   latin:"Clarior e tenebris",
   src_cs:"Valentová 2019, Kunckel 1689",
   src_en:"Valentová 2019, Kunckel 1689",
   hint_cs:"Přijde v další verzi — upgrade stavebního stromu.",
   hint_en:"Coming in next version — building tree upgrade.",
   img_id:"ach_ceska_pec", available:false,
   future_cs:"Česká pec — přijde v další verzi",
   future_en:"Bohemian furnace — coming in next version"},

  {id:"cerenic_arsenem", icon:"🧪", cat:"tech",
   cs:"Čeřič arsenem", en:"Arsenic Finer",
   desc_cs:"Arsenový oxid (As₂O₃) — nejúčinnější čeřidlo, 0,1–1 % hmotnosti. Odstraňuje bubliny a dekoloruje zbytkové železo, takže křišťál je čistší. V Čechách od cca 1680. Vzácný a jedovatý — tavič se při čeření víc unaví.",
   desc_en:"Arsenic oxide (As₂O₃) — the most effective fining agent, 0.1–1% by weight. Removes bubbles and decolours residual iron, so the crystal is clearer. In Bohemia from ca. 1680. Rare and poisonous — the smelter tires faster while fining.",
   latin:"Solve et coagula",
   src_cs:"Hujová & Vernerová 2017, Sedláčková 2015",
   src_en:"Hujová & Vernerová 2017, Sedláčková 2015",
   hint_cs:"Vyčeř křišťál arsenem (Baranovský ho nabízí od sezóny 2).",
   hint_en:"Fine crystal with arsenic (Baranovský offers it from season 2).",
   img_id:"ach_cerenic_arsenem", available:true},

  // ── Obchodní a sociální ──
  {id:"vilkum", icon:"🏰", cat:"trade",
   cs:"Vilkum", en:"Vilkum",
   desc_cs:"Vítací pohár — reprezentativní sklo s erbem, datem a nápisem. Pohár nesměl chybět u žádného důležitého aktu stvrzeného přípitkem. Symbol rodu, výzva pro skláře.",
   desc_en:"Welcome goblet — representational glass with coat of arms, date and inscription. No important occasion sealed with a toast was complete without a goblet. Symbol of the house, a challenge for the glassmaker.",
   latin:"Vivas multis annis",
   src_cs:"Vepřeková, CP_13II2015",
   src_en:"Vepřeková, CP_13II2015",
   hint_cs:"Splň šlechtickou zakázku na rytý pohár s erbem.",
   hint_en:"Fulfil a noble contract for an engraved goblet with crest.",
   img_id:"ach_vilkum", available:true},

  {id:"kobaltova_serie", icon:"💙", cat:"trade",
   cs:"Kobaltová série", en:"Cobalt Series",
   desc_cs:"Sériová výroba kobaltového skla — historicky doložena. Novokřtěnci ve Strachotíně měli sérii 15+ kobaltových džbánků. Kobalt ze Saska — dálkový obchod jako základ průmyslu.",
   desc_en:"Serial production of cobalt glass — historically documented. Anabaptists at Strachotín had a series of 15+ cobalt jugs. Cobalt from Saxony — long-distance trade as the basis of industry.",
   latin:"Corpus fit vitrum",
   src_cs:"Sedláčková, CP_13II2015",
   src_en:"Sedláčková, CP_13II2015",
   hint_cs:"Prodej celkem 15 nebo více kusů kobaltového skla.",
   hint_en:"Sell a total of 15 or more pieces of cobalt glass.",
   img_id:"ach_kobaltova_serie", available:true},

  {id:"faccon_de_venise", icon:"👑", cat:"trade",
   cs:"À la façon de Venise", en:"À la façon de Venise",
   desc_cs:"Sklo v benátském stylu — na celé Evropě se kopírovala benátská produkce. Čeští skláři pracovali s 'krátkým' draselno-vápenatým sklem místo sody, přesto zvládli napodobit benátské tvary.",
   desc_en:"Glass in the Venetian style — Venetian production was copied across all of Europe. Bohemian glassmakers worked with 'short' potash-lime glass instead of soda, yet managed to imitate Venetian forms.",
   latin:"Omnia in vitrum transeunt",
   src_cs:"Vepřeková, CP_13II2015; Valentová 2019",
   src_en:"Vepřeková, CP_13II2015; Valentová 2019",
   hint_cs:"Splň obchodní endgame zakázku (Hoffmann/export).",
   hint_en:"Complete the trade endgame contract (Hoffmann/export).",
   img_id:"ach_faccon_de_venise", available:true},

  // ── Speciální / meta ──
  {id:"relikvar", icon:"⛪", cat:"endgame",
   cs:"Relikviář", en:"Reliquary",
   desc_cs:"Kompletní skleněná schránka pro ostatky — kobalt, křišťál, rubínový panel. Klášterní zakázka nejvyšší třídy.",
   desc_en:"Complete glass relic shrine — cobalt, crystal, ruby panel. Monastery commission of the highest order.",
   latin:"Pie zeses",
   hint_cs:"Splň klášterní endgame zakázku.",
   hint_en:"Complete the monastery endgame contract.",
   img_id:"ach_relikvar", available:true},

  {id:"lustr", icon:"🕯️", cat:"endgame",
   cs:"Lustr Harrachů", en:"Harrach Chandelier",
   desc_cs:"Kompletní lustrová sada pro velký sál — broušené díly, kobaltové poháry, rytý pohár s erbem. Arnsdorfské sklo ozdobí sál po generace.",
   desc_en:"Complete chandelier set for the great hall — cut parts, cobalt goblets, engraved goblet with crest. Arnsdorf glass will grace this hall for generations.",
   latin:"Fortuna vitrea est; tum cum splendet, frangitur",
   hint_cs:"Splň šlechtickou endgame zakázku.",
   hint_en:"Complete the noble endgame contract.",
   img_id:"ach_lustr", available:true},

  {id:"export_drezdany", icon:"🌍", cat:"endgame",
   cs:"Export — Drážďany", en:"Export — Dresden",
   desc_cs:"Konzistentní kvalita na zahraničním trhu. Hoffmann potvrdil: české křišťálové sklo konkuruje Benátkám.",
   desc_en:"Consistent quality on the foreign market. Hoffmann confirmed: Bohemian crystal glass rivals Venice.",
   latin:"Clarior e tenebris",
   hint_cs:"Splň exportní endgame zakázku.",
   hint_en:"Complete the export endgame contract.",
   img_id:"ach_export_drezdany", available:true},
];

// ── WIKI ENTRIES ──────────────────────────────────────────────────────────────
const WIKI_ENTRIES={
  waldglas:{
    icon:"🟫", cs:"Lesní sklo (Waldglas)", en:"Forest Glass (Waldglas)",
    body_cs:"Základní produkt každé lesní hutě. Draselno-vápenatá sklovina s bukovým popelem — přirozeně nazelenalá kvůli obsahu oxidu železitého v písku. Bez čeřidla. Levné, rychlé, dostupné.",
    body_en:"The basic product of every forest foundry. Potash-lime glass with beech ash — naturally greenish due to iron oxide in the sand. No fining agent. Cheap, fast, available.",
    src_cs:"Valentová 2019, Sedláčková 2015",
    src_en:"Valentová 2019, Sedláčková 2015",
    trigger:"first_waldglas"},

  crystal:{
    icon:"✨", cs:"Křišťál", en:"Crystal",
    body_cs:"Slavný český křišťál nevznikl těžbou horského křišťálu, ale jako zcela nová receptura českých a šumavských hutí v poslední třetině 17. století; za jeho tvůrce se nejčastěji považuje skelmistr Michael Müller (kolem 1683, Janouškova huť u Vimperku). Čistý písek, bílá potaš a čistý vápenec (křída) dají tvrdé, těžké, čiré sklo bez popela. Burel (MnO₂) jen odbarví zbytky železa. Silné stěny snesou hluboké broušení měděnými kotouči a rytí; fazety lámou světlo jako diamant. Křehké benátské sklo z módy vychází.",
    body_en:"Famous Bohemian crystal was not mined from rock crystal but created as an entirely new recipe in the Bohemian and Šumava glasshouses in the last third of the 17th century; its creator is most often named as master Michael Müller (c. 1683, Janoušek's glasshouse near Vimperk). Pure sand, white potash and pure lime (chalk) give a hard, heavy, clear, ash-free glass. Burel (MnO₂) only decolourises residual iron. Thick walls withstand deep copper-wheel cutting and engraving; facets break light like diamonds. Fragile Venetian glass goes out of fashion.",
    src_cs:"Valentová 2019, Kunckel 1679",
    src_en:"Valentová 2019, Kunckel 1679",
    trigger:"first_crystal"},

  modra:{
    icon:"🔵", cs:"Kobaltová modrá", en:"Cobalt Blue",
    body_cs:"Šmolka (kobaltová ruda CoO) ze Saska. 0,1–0,3 % propůjčuje sklu sytou modř. Historicky doložena sériová výroba 15+ ks (novokřtěnci Strachotín). Dálkový obchod se surovinou.",
    body_en:"Zaffre (cobalt ore CoO) from Saxony. 0.1–0.3% gives glass a rich blue. Series production of 15+ pieces historically documented (Anabaptists, Strachotín). Long-distance trade in the raw material.",
    src_cs:"Sedláčková, CP_13II2015",
    src_en:"Sedláčková, CP_13II2015",
    trigger:"first_modra"},

  smaragd:{
    icon:"🟢", cs:"Smaragdová zeleň", en:"Emerald Green",
    body_cs:"Pálená měď (aes ustum). Čeští skláři ji znali jako 'zelenou měď'. Stabilní, sytá barva. V kombinaci s CoO dává akvamarínový nádech.",
    body_en:"Burnt copper (aes ustum). Bohemian glassmakers knew it as 'green copper'. Stable, rich colour. In combination with CoO gives an aquamarine hue.",
    src_cs:"Valentová 2019",
    src_en:"Valentová 2019",
    trigger:"first_smaragd"},

  lattimo:{
    icon:"⚪", cs:"Lattimo — mléčné sklo", en:"Lattimo — Milk Glass",
    body_cs:"Neprůhledné bílé sklo z cínu a olova. Základ benátských tyčinek pro filigrán. Název z italského 'latte' (mléko). Luxusní, vzácné, žádané pro napodobeniny porcelánu.",
    body_en:"Opaque white glass from tin and lead. The base of Venetian canes for filigree. Name from Italian 'latte' (milk). Luxury, rare, sought-after for porcelain imitation.",
    src_cs:"Whitty, Istituto Veneto 2015",
    src_en:"Whitty, Istituto Veneto 2015",
    trigger:"first_lattimo"},

  rubin:{
    icon:"🔴", cs:"Zlatý rubín (Kunckel)", en:"Gold Ruby (Kunckel)",
    body_cs:"Zlato rozpuštěné v lučavce královské se vysráží cínem na purpurový prášek (později zvaný Cassiův purpur) a přidá se do kmene. Po prvním tavení je sklo téměř bezbarvé nebo slabě nažloutlé. Barva se vyvine až při druhém, opatrném zahřátí hotového předmětu (náběh): nanočástice zlata se shluknou do správné velikosti, pohlcují zelenomodré světlo a propouštějí sytě červené. 0,02 % Au stačí; proces je citlivý a může selhat. Kunckel ho popsal v Ars Vitraria Experimentalis (1679). Ve své době mělo rubínové sklo astronomickou hodnotu.",
    body_en:"Gold dissolved in aqua regia is precipitated with tin to a purple powder (later called purple of Cassius) and added to the batch. After the first melt the glass is almost colourless or faintly yellowish. The colour develops only on a second, careful reheating of the finished piece (striking): gold nanoparticles cluster to the right size, absorb blue-green light and transmit deep red. 0.02% Au is enough; the process is sensitive and can fail. Kunckel described it in Ars Vitraria Experimentalis (1679). In its day ruby glass was worth a fortune.",
    src_cs:"Kunckel 1679, Babořák 2023",
    src_en:"Kunckel 1679, Babořák 2023",
    trigger:"first_rubin"},

  jantar:{
    icon:"🟤", cs:"Jantar — hmotové zbarvení", en:"Amber — colour in the batch",
    body_cs:"Do kmene se přidá železo (Crocus Martis), síra z potaše a uhlík (uhlí, piliny, saze). V redukční atmosféře pece (spalování s nedostatkem kyslíku) vznikne ferri-sulfidový chromofor — sklo je od medové po tmavohnědou. Oxidační atmosféra dává čiré sklo, redukční hnědé a jantarové. Velké dávky burelu (MnO₂) v oxidační peci zbarví sklo do hnědofialova. Levný užitkový jantar a pokus o imitaci přírodního jantaru.",
    body_en:"Iron (Crocus Martis), sulphur from the potash and carbon (charcoal, sawdust, soot) are added to the batch. In a reducing furnace atmosphere (burning with too little oxygen) a ferric-sulphide chromophore forms — from honey to dark brown. An oxidising atmosphere gives clear glass, a reducing one brown and amber. Large doses of burel (MnO₂) in an oxidising furnace tint the glass brown-violet. Cheap utility amber and an imitation of natural amber.",
    src_cs:"Valentová 2019, Hujová 2017",
    src_en:"Valentová 2019, Hujová 2017",
    trigger:"first_jantar"},

  zlut:{
    icon:"🟨", cs:"Stříbrná žluť (lazura)", en:"Silver Stain (glaze)",
    body_cs:"Luxusní barokní sklo dostávalo jantarový odstín jen na povrchu. Sloučeniny stříbra (chlorid, dusičnan) se smíchaly s okrem nebo jemným jílem do kaše, štětcem se nanesly na hotové vychladlé sklo a vypálily v muflové peci kolem 600 °C. Ionty stříbra migrují do povrchu a po redukci vytvoří koloidní částice — brilantní žluto-jantarový povlak. Rytec ho může probrousit až na čiré sklo pod ním: dvoubarevný kontrast detailů.",
    body_en:"Luxury Baroque glass often took its amber tone on the surface only. Silver compounds (chloride, nitrate) were mixed with ochre or fine clay into a paste, brushed onto finished cold glass and fired in a muffle furnace at about 600 °C. Silver ions migrate into the surface and, once reduced, form colloidal particles — a brilliant yellow-amber coating. The engraver can cut through it to the clear glass beneath: a two-colour contrast in the detail.",
    src_cs:"Valentová 2019, Hujová 2017",
    src_en:"Valentová 2019, Hujová 2017",
    trigger:"first_zlut"},

  arsen:{
    icon:"☠️", cs:"Arsen (As₂O₃) — čeřidlo", en:"Arsenic (As₂O₃) — fining agent",
    body_cs:"Arsenová běl (hutní mouka) vzniká pražením rud v krušnohorských hutích. V malém množství (0,1–1 % kmene) vyčeří sklovinu rychleji než burel: odstraní bubliny a zbytkové železo, takže křišťál vychází čistší. Je to ale prudký jed — pracovníci se při čeření unaví víc. Hutě ji přesto používaly běžně; od cca 1680 je i v Čechách. Hodí se i na alembik pro alchymisty a lékárníky.",
    body_en:"White arsenic (smelter's flour) comes from roasting ores in the Ore Mountain smelters. In small amounts (0.1–1% of the batch) it fines the melt faster than burel: it removes bubbles and residual iron, so crystal comes out clearer. But it is a violent poison — workers tire more while fining. Foundries used it routinely anyway; in Bohemia from ca. 1680. It is also needed for the alembic for alchemists and apothecaries.",
    src_cs:"Hujová & Vernerová 2017, Sedláčková 2015",
    src_en:"Hujová & Vernerová 2017, Sedláčková 2015",
    trigger:"first_arsen"},

  potash:{
    icon:"🌿", cs:"Potaš (K₂CO₃)", en:"Potash (K₂CO₃)",
    body_cs:"Základní tavidlo české hutě — loužení bukového popela. Tři kvality: černá (surová) → modrá (obyčejné sklo) → bílá (vícenásobné loužení, křišťál). 10 tun dřeva → 100 kg popela → 3 kg potaše.",
    body_en:"The primary flux of the Bohemian foundry — leaching of beech ash. Three qualities: black (raw) → blue (ordinary glass) → white (multiple leeching, crystal). 10 tonnes of wood → 100 kg ash → 3 kg potash.",
    src_cs:"Valentová 2019, otcovy poznámky",
    src_en:"Valentová 2019, father's notes",
    trigger:"res_potash"},

  panev:{
    icon:"🏺", cs:"Sklářská pánev", en:"Glass Crucible",
    body_cs:"Šamotová nádoba pro tavení skla. Zrání trvá 6 měsíců — pánev se musí pomalu vypalovat a 'učit' pracovat s žárem. V kampani vydrží 2–3 měsíce při kontinuálním provozu. Praskne-li voda při procesu — katastrofa.",
    body_en:"Refractory crucible for glass melting. Ageing takes 6 months — the crucible must be slowly fired and 'taught' to work with heat. In the campaign it lasts 2–3 months of continuous operation. Water added during the process — catastrophe.",
    src_cs:"Valentová 2019, otcovy poznámky",
    src_en:"Valentová 2019, father's notes",
    trigger:"first_panev"},

  endgame_church:{
    icon:"⛪", cs:"Relikviář — klášterní zakázka", en:"Reliquary — Monastery Commission",
    body_cs:"Skleněná schránka pro ostatky — kombinace křišťálu, kobaltu a rubínu. Klášterní liturgické sklo bylo z nejprestižnějších objednávek. Sklo jako 'zamrzlé světlo'.",
    body_en:"Glass relic shrine — combination of crystal, cobalt and ruby. Monastery liturgical glass was among the most prestigious commissions. Glass as 'frozen light'.",
    src_cs:"Vepřeková, CP_13II2015",
    src_en:"Vepřeková, CP_13II2015",
    trigger:"endgame_church"},

  endgame_noble:{
    icon:"⚔️", cs:"Lustr — šlechtická zakázka", en:"Chandelier — Noble Commission",
    body_cs:"Lustrové díly, kobaltové poháry, rytý pohár s erbem. Pohár na hodovní tabuli panovníka — symbol rodu po generace. Rytina diamantem = novinka roku 1680.",
    body_en:"Chandelier parts, cobalt goblets, engraved goblet with crest. Goblet on the ruler's banqueting table — a symbol of the house for generations. Diamond engraving = a novelty of 1680.",
    src_cs:"Vepřeková, CP_13II2015",
    src_en:"Vepřeková, CP_13II2015",
    trigger:"endgame_noble"},

  endgame_trade:{
    icon:"🌍", cs:"Export — drážďanský dvůr", en:"Export — Dresden Court",
    body_cs:"Konzistentní série pro zahraniční trh. České křišťálové sklo 17. stol. konkurovalo Benátkám — tvrdší, vhodné pro broušení, 'krátké' ale mistrovské.",
    body_en:"Consistent series for the foreign market. Bohemian crystal glass of the 17th century rivalled Venice — harder, suitable for cutting, 'short' but masterly.",
    src_cs:"Sedláčková 2015, Valentová 2019",
    src_en:"Sedláčková 2015, Valentová 2019",
    trigger:"endgame_trade"},

  pec_primitive:{
    icon:"🔥", cs:"Primitivní pec", en:"Primitive Furnace",
    body_cs:"Střední Evropa 15.–16. stol. — oválný tvar, topný kanál ze kamenů, klenba z hlíny. Sklovina se tavila dvofázově (frita → dotavení). Závislá na větru pro tah. Max. teplota cca 1200 °C.",
    body_en:"Central Europe 15th–16th c. — oval shape, stone firing channel, clay vault. Glass was melted in two phases (frit → final melt). Wind-dependent for draught. Max temperature ca. 1200°C.",
    src_cs:"Valentová 2019",
    src_en:"Valentová 2019",
    trigger:"have_furnace"},

  baranovsky:{
    icon:"🧪", cs:"Baranovský — tajný rádce", en:"Baranovský — Secret Adviser",
    body_cs:"Potulný znalec skla. Přináší recepty od Benátek po Saska. Kobalt, smaragd, lattimo, antimon — vše přes obchod a znalosti. Historický typ: putující sklář-podomní obchodník.",
    body_en:"Itinerant glass expert. Brings recipes from Venice to Saxony. Cobalt, emerald, lattimo, antimony — all through trade and knowledge. Historical type: travelling glassmaker-pedlar.",
    src_cs:"Kunckel 1679",
    src_en:"Kunckel 1679",
    trigger:"met_baranovsky"},
};

