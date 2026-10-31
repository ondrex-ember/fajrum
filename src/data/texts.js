// texts.js — intro/about/codex texts, player ranks and chronicle texts.
// Verbatim data moved out of core/ (no logic). Classic script: plain top-level consts in the shared global scope; load order is fixed by build.js.

// Úvodní obrazovka: úvodní text a popisy obtížností (čte i Android)
const INTRO_TEXT={
  intro:{cs:"Rok 1680. Otec ti zanechal recept, dluh a starou pec v Arnsdorfu. Kolem šumí hvozd — tvůj poklad i prokletí. Každý strom, co pokácíš, ti dá dřevo. Ale les pomalu dorůstá zpět.",
         en:"Year 1680. Your father left you a recipe, a debt, and an old furnace in Arnsdorf. The forest is your treasure and your curse. Every tree gives wood — and it slowly grows back."},
  easy:{cs:"🕯️ Štědré dědictví: pec zaběhnutá, 140 grošů v pokladně, nízký dluh 30g, plná spižírna i sklad. Zlevněné zimní mzdy, vyšší výkupní ceny (+20%) a zakázkový bonus (+25%). Klidný čas na učení sklářského umění.",
        en:"🕯️ Generous inheritance: run-in furnace, 140 coins in treasury, low debt 30g, full pantry and store. Discounted winter wages, higher selling prices (+20%), and contract bonuses (+25%). Relaxed time to master glassmaking."},
  normal:{cs:"⚔️ Vyvážený start: otcova stará huť, 65 grošů na rozběh, dluh 40g, skromné zásoby na zimu. Vhodné pro strategickou správu lesa a pece.",
          en:"⚔️ Balanced start: father's old foundry, 65 coins to start, 40g debt, modest winter stores. Ideal for strategic management of woods and furnace."}
};

// Deník hráče (záložka Deník): ranky Tomislava Břeťánka + schopnosti ranku
const ABOUT_INFO={
 "place": "Haida, Arnsdorf, Blottendorf · Novoborsko · Anno Domini 1680",
 "intro": {
  "cs": "Historická resource management hra zasazená do světa lesních sklářských hutí 17. století v severních Čechách.",
  "en": "A historical resource management game set in the world of 17th century forest glassworks in northern Bohemia."
 },
 "systemsTitle": {
  "cs": "Herní systémy:",
  "en": "Game systems:"
 },
 "systems": [
  {
   "icon": "🗓️",
   "cs": "12 kol · 5 příprava (listopad–březen) · 7 kampaň (duben–říjen)",
   "en": "12 rounds · 5 prep (Nov–Mar) · 7 campaign (Apr–Oct)"
  },
  {
   "icon": "🔥",
   "cs": "Dynamická pec — zaběhnutost, šamot, 3 typy (primitivní/zděná/mistrovská)",
   "en": "Dynamic furnace — run-in, shamot, 3 types (primitive/brick/master)"
  },
  {
   "icon": "🌲",
   "cs": "Hvozd — konečný zdroj, zalesňování, vyčerpání hvozdu",
   "en": "Forest — finite resource, reforestation, depletion"
  },
  {
   "icon": "🏺",
   "cs": "Výroba pánví — zrání 6 měsíců, kvalita závisí na pánvaři",
   "en": "Crucible system — 6 month curing, quality by crucible-maker"
  },
  {
   "icon": "🎨",
   "cs": "Barevné sklo — 6 receptur (jantar/modrá/smaragd/lattimo/rubín/stříbrná žluť · Neri 1612, Kunckel 1679)",
   "en": "Coloured glass — 6 recipes (amber/blue/emerald/lattimo/ruby/silver stain · Neri 1612, Kunckel 1679)"
  },
  {
   "icon": "👷",
   "cs": "Dělníci — foukači, formaři, brusiči, rytec · 10 levelů · traity",
   "en": "Workers — blowers, moulders, grinders, engraver · 10 levels · traits"
  },
  {
   "icon": "🍺",
   "cs": "Pivovar · pivo jako naturální mzda · opilost snižuje kvalitu",
   "en": "Brewery · beer as natural wage · drunkenness lowers quality"
  },
  {
   "icon": "📜",
   "cs": "Zakázky — 18 kontraktů, 4 kupci, termíny, progress",
   "en": "Contracts — 18 contracts, 4 buyers, deadlines, progress"
  },
  {
   "icon": "🗣️",
   "cs": "Baranovský — obchodník s přísadami · progression barev",
   "en": "Baranovský — additives trader · colour progression"
  },
  {
   "icon": "📖",
   "cs": "Kronika · historické události · alchymistické citáty (Kunckel, Neri, Baranovský)",
   "en": "Chronicle · historical events · alchemical quotes (Kunckel, Neri, Baranovský)"
  }
 ],
 "creatorTitle": {
  "cs": "Tvůrce & konzultace",
  "en": "Creator & Consultation"
 },
 "creator": [
  {
   "cs": "Ondřej Panuška — design, kód, herní mechaniky",
   "en": "Ondřej Panuška — design, kód, herní mechaniky"
  },
  {
   "cs": "Jaromír Panuška - tatínek — historická a technologická konzultace (technolog skla)",
   "en": "Father — historical & technical consultation (glass technologist)"
  }
 ],
 "email": "ondrej.panuska@gmail.com",
 "thanks": {
  "cs": "Hra čerpá z Kunckelovy Ars Vitraria Experimentalis (1679), Neriho L'Arte Vetraria (1612) a dobových sklářských privilegií severních Čech.",
  "en": "The game draws on Kunckel's Ars Vitraria Experimentalis (1679), Neri's L'Arte Vetraria (1612) and period glassmaking privileges of northern Bohemia."
 },
 "links": [
  {
   "icon": "🔥",
   "label": "Ember PA",
   "url": "https://ember-pa.cz/"
  },
  {
   "icon": "📜",
   "label": "Scriptorium",
   "url": "https://myscriptorium.cz/"
  },
  {
   "icon": "📰",
   "label": "Jouza News&Radio 📻",
   "url": "https://newsandradio.cz"
  },
  {
   "icon": "⛧",
   "label": "Occultix",
   "url": "https://occultix.app"
  },
  {
   "icon": "🧩",
   "label": "Fractout",
   "url": "https://fractout.com/"
  },
  {
   "icon": "🔮",
   "label": "Oracoolio",
   "url": "https://oracoolio.com"
  }
 ],
 "made": "Vyvíjeno s ❤️ v Novém Boru · Ondrex",
 "aboutLink": {
  "cs": "O hře — about.html →",
  "en": "About the game →"
 }
};
const HRAC_RANKS=[
  {id:"pomocnik",  cs:"Pomocník",    en:"Helper",       minSeason:0,  minGrose:0,    icon:"🪓",
   desc_cs:"Přišel jsem do hutě s prázdnýma rukama. Kunc mi dá šanci — ale jen jednu.",
   desc_en:"I came to the foundry empty-handed. Kunc gives me a chance — but only one."},
  {id:"ucen",      cs:"Učeň",        en:"Apprentice",   minSeason:1,  minGrose:50,   icon:"🔥",
   desc_cs:"Začínám rozumět ohni. Pánev praská méně. Kunc mě přestává hlídat každý krok.",
   desc_en:"I'm starting to understand the fire. Crucibles crack less. Kunc stops watching every step."},
  {id:"tovarys",   cs:"Tovaryš",     en:"Journeyman",   minSeason:2,  minGrose:200,  icon:"💨",
   desc_cs:"Umím foukat základní tvary. Lidé v huti mi říkají Tomáš, ne 'ten nový'.",
   desc_en:"I can blow basic shapes. People in the foundry call me Tomáš, not 'the new one'."},
  {id:"mistr",     cs:"Mistr hutě",  en:"Foundry Master",minSeason:4, minGrose:600,  icon:"⚗️",
   desc_cs:"Huť je moje. Křišťál teče z pece jako voda. Baranovský mi nabízí zakázku pro Harrache.",
   desc_en:"The foundry is mine. Crystal flows from the furnace like water. Baranovský offers a Harrach commission."},
  {id:"velmistr",  cs:"Velmistr",    en:"Glasmaster",   minSeason:8,  minGrose:2000, icon:"💎",
   desc_cs:"Jméno Břeťánek zní po celém Novoborsku. Rubín, filigrán, zrcadla — vše.",
   desc_en:"The name Břeťánek rings across all of Novoborsko. Ruby, filigree, mirrors — all of it."},
];
const RANK_ABILITIES={
  pomocnik:{cs:"Ještě žádné schopnosti. Přežij první sezónu.",en:"No abilities yet. Survive the first season."},
  ucen:    {cs:"⚡ Morale +2/kolo — Tomislav aktivně pomáhá v huti.",en:"⚡ Morale +2/round — Tomislav actively helps in the foundry."},
  tovarys: {cs:"⚡ Morale +2/kolo\n📖 Mentor — brzy možnost ručně přiřadit mentora dělníkovi.",en:"⚡ Morale +2/round\n📖 Mentor — soon: manually assign a mentor to any worker."},
  mistr:   {cs:"⚡ Morale +2/kolo\n📖 Mentor — brzy možnost ručně přiřadit mentora dělníkovi.\n🎯 Boost — brzy: jednou za kolo posílit výstup jednoho dělníka.",en:"⚡ Morale +2/round\n📖 Mentor — soon: manually assign mentor.\n🎯 Boost — soon: once per round boost one worker's output."},
  velmistr:{cs:"⚡ Morale +2/kolo\n💰 Prodejní ceny +5% — jméno Břeťánek otevírá dveře.\n📖 Mentor & 🎯 Boost odemčeny.",en:"⚡ Morale +2/round\n💰 Sell prices +5% — the Břeťánek name opens doors.\n📖 Mentor & 🎯 Boost unlocked."},
};

// Codex (záložka Archiv): statické sekce, názvy glass klíčů a štítky specializací
const CODEX_GLASS_CS={waldglas:"lesní sklo",crystal:"křišťál",modra:"tmavá modř",
  smaragd:"smaragd",lattimo:"lattimo",rubin:"rubín",jantar:"jantar"};
const CODEX_SPEC={foukat_kristal:{cs:"foukač křišťálu",en:"crystal blower"},foukat_dekor:{cs:"foukač dekor",en:"decor blower"},foukat_formy:{cs:"formař",en:"mould-blower"},brusic_hrana:{cs:"hranař",en:"edge-cutter"},brusic_kulic:{cs:"kulič",en:"sphere-grinder"}};
const CODEX_STATIC={
  melt:{
    title_cs:"🔥 Sklovina — surové sklo", title_en:"🔥 Glass melt — raw glass",
    items:[
      {icon:"🟫",cs:"Lesní sklo (Waldglas)",en:"Forest glass (Waldglas)",price:"~3.5g/★",
       recipe_cs:"3× písek + 2× potaš + 1× vápenec → pánev → tavení",
       recipe_en:"3× sand + 2× potash + 1× limestone → crucible → smelting",
       note_cs:"Základní surovina. Nazelenalá barva od Fe a S. Potaš černá/modrá postačí.",
       note_en:"Base material. Greenish colour from Fe and S. Black/blue potash sufficient."},
      {icon:"✨",cs:"Křišťál (čiré sklo)",en:"Crystal (clear glass)",price:"~9g/★",
       recipe_cs:"3× čistý písek + 2× čistá potaš + 1× vápenec + 1× uhlí → pánev → tavení (65%+ fTemp)",
       recipe_en:"3× pure sand + 2× refined potash + 1× limestone + 1× charcoal → crucible → smelting (65%+ fTemp)",
       note_cs:"Samostatná receptura, ne vyčištěný waldglas. Burel (čeření) zlepší příští dávku. Technologický přelom ~1680, Müller 1683.",
       note_en:"A recipe of its own, not purified waldglas. Burel (fining) improves the next batch. Tech turning point ~1680, Müller 1683."},
    ]
  },
  special:{
    title_cs:"🪟 Okenní sklo & speciální výrobky", title_en:"🪟 Window glass & special items",
    items:[
      {key:"tercik",icon:"🪟",cs:"Okenní terčík",en:"Window disc",
       price:"6g/★ · výplně 2g · žebrové 9g", price_en:"6g/★ · fillers 2g · ribbed 9g",
       recipe_cs:"2× lesní sklo → foukání → Ø8–10 cm. Kval.≤2 → výplně, kval.≥4 → žebrové.",
       recipe_en:"2× waldglas → blowing → Ø8–10 cm. Qual.≤2 → fillers, qual.≥4 → ribbed.",
       note_cs:"Hromadný odbyt každé hutě. Kláštery, měšťanské domy, Haida trh. (CP_13II2015)",
       note_en:"Bulk product of every foundry. Monasteries, townhouses, Haida market. (CP_13II2015)"},
      {key:"zrcadlo",icon:"🪞",cs:"Zrcadlo (sezóna 3+)",en:"Mirror (season 3+)",
       price:"~65g",
       recipe_cs:"2× křišťál + 1× rtuť + 1× cín + hranař",
       recipe_en:"2× crystal + 1× mercury + 1× tin + edge-cutter",
       note_cs:"Amalgám rtuti+cínu na zadní stranu. Rtuť z Idrie = import. Vzácný luxus pro šlechtu.",
       note_en:"Mercury-tin amalgam on reverse. Mercury from Idrija = import. Rare noble luxury."},
      {key:"alembik",icon:"⚗️",cs:"Alembik (sezóna 2+)",en:"Alembic (season 2+)",
       price:"~55g",
       recipe_cs:"2× křišťál + 1× arsen (As₂O₃) + foukač křišťálu",
       recipe_en:"2× crystal + 1× arsenic (As₂O₃) + crystal blower",
       note_cs:"Destilační helma. Nejstarší nález stř. Evropy: klarisy Bratislava ~1290. (Sedláčková 2021)",
       note_en:"Distillation helmet. Oldest Central European find: Poor Clares Bratislava ~1290. (Sedláčková 2021)"},
    ]
  }
};

const CHRON_PREP_CS=["Ruce se chystají na práci. Les čeká tichý a tmavý.","Přípravy jsou v plném proudu. Každý ví, co dělat.","Zásoby rostou pomalu, ale jistě. Les dává, co může.","Poslední přípravy před kampaní. Vzduch páchne pryskyřicí a popelem."];
const CHRON_CAMP_CS=["Pec hřeje. Dělníci se tísní u žáru, tváře červené jako střep.","Noc a den splývají. Jen pec nikdy nespí.","Zima se dere dovnitř. Pec ji drží za dveřmi — zatím.","Zásoby dřeva povážlivě ubývají. Každá polena se počítá.","Kampaň doznívá. Pec chladne. Sklo čeká na kramáře."];
const CHRON_PREP_EN=["Hands ready for work. The forest waits, dark and silent.","Preparations in full swing. Everyone knows their task.","Supplies grow slowly but surely. The forest gives what it can.","Final preparations before the campaign. The air smells of resin and ash."];
const CHRON_CAMP_EN=["The furnace glows. Workers huddle near the heat, faces red as a shard.","Night and day blend together. Only the furnace never sleeps.","Winter presses at the door. The furnace keeps it out — for now.","Wood supplies dwindle dangerously. Every log counts.","The campaign fades. The furnace cools. The glass awaits the merchant."];

// ── HUMORNÉ PŘÍHODY ─────────────────────────────────────────
// Neutrální (10) — jen baví
const CHRON_HUMOR_CS=[
  "Ferda Táborský nesl díži s pivem od pivovaru k peci. Cestou zakopl o hafen co někdo nechal na zemi. Díže ulétla, pivo se rozlilo po celém verkštatu. Strejda Káninský přišel z druhé strany, podívá se pod nohy a povídá: ‚Tak to je výborná moření podlahy. Ale příště ať je to křišťál.'",
  "Milan Komár si spletl vědro s vodou na chlazení forem a vědro s Máňiným hrachovým vývárem. Nalil ho rovnou na rozžhavenou pánev. Pec vydala zvuk jako rozhněvaný kanec a z komína vyletěl zelený oblak. Kunc se ani neotočil od taveniny: ‚Hrachový den. Dobrej kmen bude.'",
  "Strejda Baranovský přivezl z Haidy ‚speciální přísadu na modrání skloviny'. Za osm grošů. Tavič Kunc přísadu přičichl, ochutnal a pravil: ‚To je šmolka. A tohle jsem prodával já tobě loni.' Baranovský se usmál: ‚Jenže já to přivezl z Drážďan. To je rozdíl.'",
  "Tonda Smrkovský usnul vestoje u milíře. Nikdo si toho hodinu nevšiml, protože Smrkovský vypadá stejně ať spí nebo ne. Ferda Táborský ho nakonec zavolal ke snídani. Smrkovský otevřel oči a řekl: ‚Hmm.' Zavřel je a spal dál.",
  "Strejda Káninský trval na tom, že pánev musí schnout přesně čtyřiadvacet hodin, ne třiadvacet ani pětadvacet. Měl u sebe přesýpací hodiny. Ferda Táborský přesýpací hodiny omylem použil jako těžítko na voskovaný papír. Káninský přišel na to po dvou dnech. ‚Hmm,' řekl výjimečně Smrkovský.",
  "Máňa uvařila guláš pro celou huť. Dal se jíst přímo od pece — horký jak sklovina. Milan Komár snědl tři porce a pak se zeptal co to bylo. ‚Zajíc,' řekla Máňa. Komár přikývl. ‚Byl to ten co žral naše zelí?' ‚Byl.' ‚Dobře mu tak.'",
  "Ferda Táborský přišel za Kuncem s otázkou: ‚Mistře, jak poznám že je kmen správně namíchaný?' Kunc se podíval na Ferdu, pak na kmen, pak zase na Ferdu. ‚Tak jak je to namíchaný ty, to poznáš tak, že to rovnou vyhoď a začni znova.'",
  "Baranovský přinesl do hutě novou várku potaše a tvrdil že je z Bavorska, první třídy. Káninský ochutnal prst potaše, zamyslel se a řekl: ‚To je od Weisse ze sousední huti. Cena?' ‚Dvanáct grošů.' ‚Weiss to prodává za šest.' Baranovský: ‚Ale já to přivezl osobně. To má hodnotu.'",
  "Při noční fukách zapomněl Táborský zamknout sklad s jídlem. Ráno chyběl celý bochník chleba a polovina sýra. Stopy vedly ke psí boudě. Pes vypadal spokojeně. Káninský navrhl psovi strhout ze mzdy. Máňa mu vysvětlila že psi mzdu nedostávají. ‚Tak ať příště hlídá líp,' řekl Káninský.",
  "Kunc učil Táborského jak poznat správnou teplotu pece bez teploměru. ‚Podíváš se na barvu.' ‚A jaká má být?' ‚Taková... správná.' ‚A jak vypadá správná?' Kunc se zamyslel. ‚Jako když je správná. To pochopíš za pět let.' Táborský si zapsal do zápisníku: správná = pět let."
];

// EN twin of CHRON_HUMOR_CS (same order: the random index picks the same joke in both languages)
const CHRON_HUMOR_EN=[
  "Ferda Táborský was carrying a tub of beer from the brewery to the furnace. On the way he tripped over a crucible somebody had left on the floor. The tub flew, and the beer spread across the whole workshop. Uncle Káninský came in from the other side, looked down at his feet and said: ‘Well, that is a fine pickling of the floor. But next time, let it be crystal.’",
  "Milan Komár mixed up the bucket of mould-cooling water with the bucket of Máňa’s pea soup. He poured it straight onto the glowing crucible. The furnace made a sound like an angry boar and a green cloud shot out of the chimney. Kunc did not even turn away from the melt: ‘Pea day. It will make a fine batch.’",
  "Uncle Baranovský brought a ‘special additive for bluing the glass’ from Haida. Eight groschen for it. Smelter Kunc sniffed it, tasted it and said: ‘That is smalt. And I sold you the same stuff last year.’ Baranovský smiled: ‘Yes, but I brought this from Dresden. That makes a difference.’",
  "Tonda Smrkovský fell asleep standing up by the charcoal kiln. Nobody noticed for an hour, because Smrkovský looks the same whether he sleeps or not. Ferda Táborský finally called him to breakfast. Smrkovský opened his eyes and said: ‘Hmm.’ He closed them and slept on.",
  "Uncle Káninský insisted the crucible must dry for exactly twenty-four hours, not twenty-three or twenty-five. He kept an hourglass for it. Ferda Táborský accidentally used the hourglass as a paperweight for waxed paper. Káninský found out after two days. ‘Hmm,’ said Smrkovský, for once.",
  "Máňa cooked goulash for the whole hut. It could be eaten straight from the furnace — hot as molten glass. Milan Komár ate three portions and then asked what it was. ‘Hare,’ said Máňa. Komár nodded. ‘The one that ate our cabbage?’ ‘The very one.’ ‘Serves him right.’",
  "Ferda Táborský came to Kunc with a question: ‘Master, how do I know the batch is mixed right?’ Kunc looked at Ferda, then at the batch, then at Ferda again. ‘The way you have mixed it, you will know by throwing it out right away and starting over.’",
  "Baranovský brought a new batch of potash to the hut and claimed it was first-class, from Bavaria. Káninský tasted a fingertip of it, thought for a moment and said: ‘This is from Weiss at the next hut. Price?’ ‘Twelve groschen.’ ‘Weiss sells it for six.’ Baranovský: ‘But I brought it personally. That has value.’",
  "During the night shift Táborský forgot to lock the food store. In the morning a whole loaf of bread and half a cheese were missing. The tracks led to the doghouse. The dog looked content. Káninský proposed docking the dog’s pay. Máňa explained that dogs do not get paid. ‘Then he should keep better watch next time,’ said Káninský.",
  "Kunc was teaching Táborský how to read the right furnace temperature without a thermometer. ‘You look at the colour.’ ‘And what should it be?’ ‘The... right one.’ ‘And what does the right one look like?’ Kunc thought. ‘Like when it is right. You will understand in five years.’ Táborský wrote in his notebook: right = five years."
];

// Poškozující výkon (5) — alkohol → chyba u práce, efekt: -kvalita nebo -surovina
const CHRON_HUMOR_BAD=[
  {cs:"Ferda Táborský si spletl sáček s burelem za sáček s pepřem co Máňa nechala v nářaďovně. Nasypat do taveniny. Barva skla: hnědá. Strejda Kunc na to přišel až při odpichu. Várka znehodnocena.",
   en:"Ferda Táborský mixed up a bag of manganese with a bag of pepper that Máňa had left in the tool shed. He tipped it into the melt. Glass colour: brown. Uncle Kunc noticed only at the tapping. Batch ruined.", effect:"varka", val:-1},
  {cs:"Komár se po druhém džbánu rozhodl ‚zkusit foukat'. Vzal trubici foukače, foukl usilovně — baňka vylétla přes werkštat a rozbila se o Káninského novou pánev co právě donesl ze sušárny. Káninský neřekl nic. Ale ještě čtyři dny na Komára nekoukal.",
   en:"After his second tankard Komár decided to ‘try blowing’. He took the blower’s pipe and puffed hard — the glass bulb flew across the workshop and smashed against Káninský’s new crucible, which he had just brought from the drying shed. Káninský said nothing. But for four more days he would not look at Komár.", effect:"panev", val:-1},
  {cs:"Strejda Baranovský po slavnostním přídělu otevřel špatný sklad. Místo potaše nabral půlku zásoby soli co Máňa chystala na zabijačku. Nasypali to do kmene. Kunc si toho všiml až při tavenině. Potaš je potaš, sůl je sůl. Dnes ne.",
   en:"After the festive ration Uncle Baranovský opened the wrong store. Instead of potash he scooped half of the salt Máňa had been saving for the pig slaughter. They tipped it into the batch. Kunc noticed only at the melt. Potash is potash, salt is salt. Not today.", effect:"potash", val:-2},
  {cs:"Smrkovský po druhém džbánu zapomněl zavřít milíř. Ráno — místo uhlí hromada popela. Smrkovský se podíval, řekl ‚Hmm' a šel na snídani. Dvě kola výroby uhlí ztraceny.",
   en:"After his second tankard Smrkovský forgot to close the charcoal kiln. In the morning — instead of charcoal, a heap of ash. Smrkovský looked, said ‘Hmm’ and went to breakfast. Two rounds of charcoal production lost.", effect:"charcoal", val:-3},
  {cs:"Táborský vysvětloval Komárovi jak se míchá kmen, gestikuloval, shodil celý připravený Gemenge z váhy na podlahu. Kunc přišel, podíval se, odešel. Vrátil se s novou pánví a řekl pouze: ‚Znova.' Suroviny ztraceny.",
   en:"Táborský was explaining to Komár how to mix the batch, gesticulated and knocked the whole prepared Gemenge off the scale onto the floor. Kunc came, looked, left. He came back with a fresh crucible and said only: ‘Again.’ Materials lost.", effect:"sand", val:-2}
];

// Zvyšující výkon (5) — alkohol → uvolněnost → nadstandard
const CHRON_HUMOR_GOOD=[
  {cs:"Po druhém džbánu začal Kunc zpívat starou sklářskou píseň u pece. Celá huť se přidala. Rytmus písně se trefil přesně do tempa míchání skloviny — nejlepší várka týdne. Pec zpívala s nimi.",
   en:"After the second tankard Kunc began to sing an old glassmakers’ song by the furnace. The whole hut joined in. The rhythm of the song hit exactly the tempo of stirring the melt — the best batch of the week. The furnace sang along.", effect:"morale", val:8},
  {cs:"Komár po slavnostním přídavku piva porazil sám o sobě tři stromy navíc ‚protože to šlo'. Zásoby dřeva přibyly. Ráno si ničeho nepamatoval. Dřevo zůstalo.",
   en:"Komár, after the festive extra of beer, felled three extra trees all by himself ‘because it was going well’. The wood stock grew. In the morning he remembered nothing. The wood stayed.", effect:"wood", val:6},
  {cs:"Máňa po dvou džbánech vymyslela zkratku mezi milířem a loužírnou přes zadní dvůr. Ušetří čtvrt hodiny na každé směně. Káninský ji odmítl pochválit, ale příští den tu zkratku používal jako první.",
   en:"After two tankards Máňa came up with a shortcut between the charcoal kiln and the lye house across the back yard. It saves a quarter of an hour on every shift. Káninský refused to praise her, but the next day he was the first to use the shortcut.", effect:"morale", val:6},
  {cs:"Baranovský — uvolněný po pivě — zapomněl obchodní taktiku a řekl kramáři z Haidy skutečnou výkupní cenu skla. Kramář byl tak překvapen upřímností že dal o dva groše víc. Baranovský si myslí že vyjednal výborně.",
   en:"Baranovský — relaxed after beer — forgot his sales tactics and told the pedlar from Haida the real purchase price of glass. The pedlar was so surprised by the honesty that he paid two groschen more. Baranovský thinks he negotiated brilliantly.", effect:"grose", val:4},
  {cs:"Táborský se po slavnostním přídělu vsadil s Komárem kdo nanosí víc jílu za hodinu. Přinesli dvojnásobek denní normy. Druhý den si oba stěžovali na záda, ale zásoby jílu byly plné.",
   en:"After the festive ration Táborský bet Komár who could carry more clay in an hour. They brought double the daily quota. The next day both complained about their backs, but the clay stock was full.", effect:"clay", val:4}
];
