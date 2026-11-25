# Fajrum (web) — vývojářská příručka

`index.html` je od teď **generovaný soubor**. Kód se edituje v `src/` a `index.html` vzniká příkazem `node build.js`.
Hra se nasazuje stejně jako dřív (statický `index.html` + `ui/*.js` + `sw.js` …), žádný bundler ani runtime závislosti nepřibyly.

## Rychlý start

```bash
node build.js            # sestaví ./index.html
node build.js --check    # ověří, že ./index.html == výsledek buildu (hodí se před commitem)
node build.js --watch    # přestaví index.html při každé změně v src/ (chyby vypíše a běží dál)
```

Potřebuješ jen Node.js (LTS). Soubory musí být UTF-8 bez BOM, konce řádků LF a každý modul končí novým řádkem
(build to hlídá a řekne přesně který soubor je špatně; `.editorconfig` + `.gitattributes` to nastaví za tebe).

## Struktura

```
index.html              GENEROVANÝ — needitovat ručně, vždy ho commitni spolu se src/
build.js                sestavení + seznam a POŘADÍ modulů (JS_MAIN)
src/
  template.html         HTML + CSS + kostra <script>; řádek @@MAIN_SCRIPT@@ = sem se vloží hlavní skript
  boot.js               start hry (G=initState(), první render, autosave)
  core/                 herní logika — bez DOMu a zvuku (běží i v Node: golden testy)
    fx.js               sběrnice efektů Fx (viz níže)
    rules-base.js       pravidla měsíců/kampaně, mzdy, nákup parcel …
    state.js            initState, výpočet účinnosti pece, kronika, G
    process-round.js    uzavření kola (jedna velká funkce, záměrně celá pohromadě)
    craft.js            výroba foukaného/broušeného/rytého/speciálního
    crew.js             dělníci, NPC, profese, ranky
    contracts*.js       zakázky (přijetí, plnění, podpis kontraktů)
    interseason.js      mezisezónní fáze, barevné sklo, rubín
    season-market.js    skóre sezóny, prodej, trh
    save.js, player-actions.js, achievements.js, events-alloc.js
  data/                 herní data — doslovné tabulky, žádná logika
    constants.js calendar.js furnace.js market.js contracts.js crew.js glass.js texts.js achievements-wiki.js
  audio/                sfx.js, furnace.js (zvuk pece), music.js
  ui/
    dom.js fx.js molten.js render.js layout.js render-original.js …
    screens/            celé obrazovky (intro, event, gameover, interseason, summary)
    modals/             modaly (contract, loyalty, retention, strike, welcome, help)
    chrome/             rám kolem záložek (header, round-bar, resource-bar, season-panel, tabs)
    tabs/               obsah záložek (overview, production, storage, furnace, market, log, accounts, parta, hrac, archiv, settings)
  pwa/install.js        instalační lišta PWA
ui/                     původní externí skripty (fajrum-*.js) — beze změny, načítají se přes <script src>
```

## Základní pravidla

1. **Jeden globální scope.** Moduly nejsou ES moduly; build je spojí v pořadí `JS_MAIN` do jednoho `<script>`.
   Funkce jsou hoistované (na pořadí nezáleží), ale **`const`/`let` na nejvyšší úrovni ano** — tabulka musí být před
   kódem, který ji čte při načtení (typicky odvozené konstanty, např. `HINTS_CS` z `MONTH_DATA`). Proto je `data/` před `core/`.
2. **`core/` a `data/` nesmí sahat na DOM, zvuk ani `ui/`.** Logika oznamuje, co se stalo, přes `Fx`:
   `Fx.render()`, `Fx.sound(...)`, `Fx.float(...)`, `Fx.toast(...)`, `Fx.musicEnabled(...)`.
   Handlery registruje `src/ui/fx-bindings.js`. (Headless testy načítají jen `core/`+`data/`, takže porušení pravidla typicky spadne na `ReferenceError`.)
3. **Nová data patří do tabulek v `data/`**, ne do podmínek v kódu. Android čte stejné tabulky jako JSON (`tools/extract-content.js`).
4. **Pořadí a počet volání `Math.random` je součást pravidel** (golden testy jsou seedované). Změna logiky = golden `--check` ukáže DIFF;
   pokud je změna záměrná, přegeneruj golden a stejnou změnu zapiš do Android enginu (`PARITY.md`).
5. **Žádná magie v buildu:** moduly se kopírují doslovně; build nic neminifikuje ani nepřepisuje.
6. **`sw.js` build nikdy nemění.** Při releasu zvedni verzi cache v `sw.js` sám; nový soubor, který se má načítat offline, přidej do `CORE_ASSETS`.
   (`precacheCore` je „všechno nebo nic“ — jeden 404 v seznamu znamená, že se SW nenainstaluje. Proto musí v repu být `manifest.json`.)

## Jak přidat …

**Novou záložku** — `src/ui/tabs/<klic>.js` s `function renderTab<Klic>(ctx){ const {p,L,content}=ctx; … content.append(…) }`;
přidej ji do `JS_MAIN`, do řetězu `else if(p.tab==="<klic>")` v `src/ui/render-original.js` a do `tabLabels`/seznamu tlačítek v `src/ui/chrome/tabs.js`.

**Novou obrazovku nebo modal** — `src/ui/screens/*.js` / `src/ui/modals/*.js`, volání přidej do dispatcheru v `render-original.js`
(obrazovky končí `return;`, modaly také; pořadí podmínek v dispatcheru je pořadí priorit).

**Nový výrobek / recept / zakázku / text** — do příslušné tabulky v `src/data/*.js`. Pokud je to pro Android, spusť `extract-content.js`.

**Nový zvuk / efekt z logiky** — přidej metodu do `src/core/fx.js`, handler do `src/ui/fx-bindings.js`, v `core/` volej `Fx.<metoda>(…)`.

**Nový modul** — soubor do `src/…` + řádek do `JS_MAIN` v `build.js` (build selže, pokud soubor v `src/` není v seznamu, nebo naopak).

## `ctx` ve `renderOriginal()`

`renderOriginal()` (`src/ui/render-original.js`) je dispatcher: spočítá společné hodnoty, uloží je do `ctx` a volá obrazovky/záložky.
Každá funkce si z `ctx` vezme jen to, co používá (`const {p,L,content}=ctx;`).

| v `ctx` | význam |
|---|---|
| `p` | stav hry (`G`), `L` jazyk (`"cs"`/`"en"`) |
| `ms`, `hs` | názvy měsíců a rady měsíce v aktuálním jazyce |
| `isP`, `isC` | příprava / kampaň, `fEff` účinnost pece v %, `ft` typ pece |
| `isDesktop` | šířka ≥ 960 a výška ≥ 500 |
| `_scrollTop` | scroll obsahu před překreslením |
| `sp`, `sitRep`, `tabBar`, `content` | vznikají postupně v `ui/chrome/*` a čtou je záložky a `layout.js` |

## Testy (nástroje z Android repa)

Nástroje `tools/` z Android projektu umí číst rozdělenou verzi: když vedle `index.html` leží `build.js` a `src/template.html`,
načtou logiku a data z `JS_HEADLESS` (= `core/` + `data/`), jinak z původních značek v `index.html`.
Potřebuješ jen vyměnit `tools/lib/engine.js` za verzi v `android-tools/lib/engine.js`.

Spouští se z kořene Android projektu (tam leží `tools/` a `golden/`). Výchozí `--index` je `../../index.html` od složky `tools/`
(Android projekt leží ve složce uvnitř web repa); jinak předej cestu: `--index <cesta k web repu>/index.html`.

```bash
node tools/golden.js --check                          # 7× "same" = logika beze změny
node tools/extract-content.js --check                 # obsah pro Android beze změny
node tools/golden.js --fine /tmp/fine                 # (jednorázově) snapshoty stavů pro DOM test
node tools/web-regress/dom-states.js --fine /tmp/fine --out /tmp/states.json
node tools/web-regress/dom-regress.js --index <web>/index.html --states /tmp/states.json --out /tmp/dom-after.json
node tools/web-regress/dom-regress.js --index <web>/index.html --states /tmp/states.json --out /tmp/click-after0.json --clicks --shard 0/6   # shardy 0..5
```

Pozn.: `--clicks` je pomalé a paměťově náročné; pouštěj shardy po dvou (šest najednou shodí prohlížeč).

DOM a klikací test se spouští **před** a **po** úpravě a oba výstupy musí být identické (`diff`). Pro refaktor bez změny chování
je to nejrychlejší důkaz; pro změny hry slouží `golden --check` jako upozornění, co se změnilo.

## Testy ve web repu (`tests/`)

Od portu Android → web má web repo vlastní headless testy (bez DOMu, jen Node). Nahrazují nástroje z Android repa, které tu nejsou.

```bash
node tests/golden.js check tests/golden/*.json          # přehraje scénáře na aktuálním kódu a porovná stav + počet volání Math.random
node tests/golden.js gen out.json <seed> <easy|normal> <maxAkcí> [sezón] [careful|chaos]   # nový scénář robotem
```

- `tests/lib/engine.js` načte `JS_HEADLESS` (core + data) a `ui/fajrum-recipes.js` (katalog receptur, `core/` na něm závisí) do Node `vm`, s `Math.random` = mulberry32 (stejný jako Android `Mulberry32`) a řízeným `Date.now`.
- Scénář = seznam akcí (slovník jako Android `Actions.kt`) + kontrolní body (`rngCalls`, fáze, stav bez `SKIP_KEYS`). Formát čte i Android `GoldenReplay`.
- `tests/golden/` = základní scénáře. Změna pravidel hry je rozdíl v `check`; je-li záměrná, přegeneruj scénáře (`gen`) a stejnou změnu zapiš do Android enginu (`PARITY.md`).
- Křížová kontrola proti Kotlinu: stejný JSON přehraj `GoldenReplay` na Android enginu s obsahem odpovídajícím webu.

### Krejcary (měna) a testy kolem nich

- `tests/golden/` je od kroku „krejcary" nahrávané v krejcarech (1 zl = 100 kr; meta `currency:"krejcary"`). `tests/golden-groats/` jsou stejné scénáře před převodem (v groších) — slouží jako vstup pro:
- **Zakázky 1b-1** (24 zakázek s `minQ`, 5 nabídek, druhá vlna, Fama podle odměny) změnily pořadí RNG: `tests/golden/` je přegenerované (`gen`, meta `currency:"krejcary"`) a `check --from-groats` už neplatí (porovnává s pravidly před 1b-1). Staré savy ověřuje `node tests/oldsaves.js tests/golden-groats/*.json --loose` (načtení = kontrolní bod, hra pokračuje bez výjimky/NaN; průběh se neporovnává). Pravidla zakázek hlídá `node tests/contracts.js`.
- **Lesnictví (etapa 6)** — nová záložka Les (`ui/tabs/forest.js`, sub-záložky Práce/Správa), pravidla v `data/forest-rules.js`, logika v `core/forest.js` (`forestView()` je čistý pohled bez RNG; akce `forestPlant/Thin/Resin/Hire/Dismiss`, výstavky `forestSetReserve`, nouzová seč `forestSetEmergency`, nákup `buyParcely(n,"Z")`, zimní přírůstek `forestGrow()`, `forestSanitize()` pro save). Stav je `G.forest2` (y mlází, z sazenice, man/pool pracovní body, hands nádeníci, reserve, emerg, hist). Bez zásahu hráče je zimní přírůstek **přesně** stará regenerace (RNG se nemění) — ověřeno přehráním starých golden scénářů (stejný stav kromě textů logu a `forest2`); texty logu se změnily, proto je `tests/golden/` přegenerované. Pravidla hlídá `node tests/forest.js`, UI `FOREST=1 MOBILE=1 node tests/uismoke.js`. Blok „Hvozd & Dřevo“ z Trhu › Kupec Weiss je přesunut do Les › Správa (v Trhu zůstal odkaz).
  - `node tests/golden.js check --from-groats tests/golden-groats/*.json` — přepočte scénář ×100 (stejné pravidlo jako Android `scaleGolden`) a ověří, že se stav i počet volání RNG shodují bit po bitu (text logu se neporovnává);
  - `node tests/golden.js rebase tests/golden-groats tests/golden` — z groat scénářů znovu vytvoří krejcarové (stav se ověří, nové hashe logu se převezmou, protože text logu obsahuje částky);
  - `node tests/oldsaves.js tests/golden-groats/*.json --every 5 --ahead 6` — z kontrolních bodů složí staré savy (bez `_cur`), načte je přes `validateGameSave` (migrace ×100) a ověří, že hra pokračuje.
- `tests/uismoke.js` — smoke test DOM v jsdom (`npm i jsdom` mimo repo, `NODE_PATH=…/node_modules node tests/uismoke.js`; proměnné `ROUNDS`, `RICH=1`, `DEBT=1`, `EN=1`). Projde všechny záložky přes celé sezóny, shrnutí, události, mezisezónu a game over; hledá `NaN`/`undefined`/`[object` a zbylé částky ve starém tvaru („12g"). Nenahrazuje ruční kontrolu vzhledu.
- Peníze ve stavu i v obsahu jsou celé krejcary. Částku do textu vždy přes `mny(kr)` / `moneyStr(kr,cs)`; zaokrouhlování pravidel se dělá po zlatnících (`Math.round(inZl(x)*k)*KR`), aby výsledek zůstal shodný s původní hrou.

### Obchodní partneři (`G.partners`)

- Data: `src/data/partners.js` (`PARTNERS`, stejná data jako Android `content/PARTNERS.json`; texty, pásma, delty událostí se ladí tady). Logika: `src/core/partners.js` (`partnerEvent`, `partnerByBuyer`, `partnerTier`). Karta: `src/ui/partner-card.js`.
- Fáze A: vztah se jen zaznamenává (nečte se zpět do pravidel, nesahá na RNG). `partners` je v `SKIP_KEYS` goldenů.
- `node tests/partners.js tests/golden/*.json` — ověří, že záznamy odpovídají textům v logu (půjčky, výkup, dřevo, odklad, zakázky podle `buyer`), že důvěra souhlasí s přehráním historie a že log nepřesahuje 30 záznamů.
- Portrét Reichela `img/partners/reichel.webp` zatím chybí → karta ukáže emoji 🧐 (po přidání souboru se obrázek použije sám).

### Průvodce Kunc

- Data: `src/data/guide.js` (`GUIDE_STEPS`: texty, CTA, nápověda, `anim`, `tab`; ladí se ručně, stejná data jako Android `GUIDE_STEPS.json`). Logika: `src/core/guide.js` (kroky `GUIDE_STEP_DEFS` s predikáty, `guideCurrentStep()`, `guideView()`, akce `setGuide`/`guideSnooze`/`guideDo`). Karta: `src/ui/guide-card.js` (nahoře na Přehledu), přepínač v Nastavení, nabídka v úvodním modálu.
- Stav `G.guide = {on, done:[id], snooze:{id: měsíc}}`; Easy = zapnuto, Normal = vypnuto (nabídka v modálu), starý save bez klíče = vypnuto. `guide` je v `SKIP_KEYS` goldenů; výběr kroku je čistá funkce stavu (žádné RNG, žádné zápisy).
- `node tests/guide.js [seedů] [sezón]` — bot, který dělá jen to, co radí karta (jako Android `guideFollower`), a kontroluje čistotu výběru. Očekávání (shodné s Androidem): Easy přežije 8 sezón bez půjček a dosáhne tieru 1; Normal s průvodcem nepřežije (zůstává tvrdý).

### Nová ekonomika (ECON2, etapa 7a) — jen nové hry (`G._econ===2`)

- Data: `src/data/econ2.js` (`ECON2`: podíl do fondu 25 %, pomocný 150/200, stravné v přípravě 100/150, paušál výrobce 50/100, činže kola 5 a 11 + hotovost 2000/2500 a kvóta dříví 25/20, popel 5/4, S1 bez hotovosti, Fama ×1,25 do 60). Logika: `src/core/econ2.js` — čisté pohledy bez RNG a zápisů (`workerWageView`, `crewWageNext`, `econ2RentAt/Next`, `econ2WageList`), zápis jen přes `econ2Init`, `econ2PieceAdd`, `processRound` (krok 5 mzdy, 5b činže) a `startInterseason` (`leaseSeasons`).
- Stav: `G._econ=2`, `G.pieceAcc` (fond v kr), `G.leaseSeasons`, `w.lastWage` (jen z kampaně). Starý save bez `_econ` zůstává klasický (mzda 200+příplatek, odpočinek ½). `validateGameSave` ostatní hodnoty čistí.
- Fond: 25 % z každého prodeje (`sellItems`, `quickSellAll`) a ze zakázek (`contractIncomeTick`) → výplata rovným dílem mezi výrobce (nahoru na celé zl, bez výrobce se fond přenáší). Mzdy se dělí po půl zlatníku (`wageUnit`), schodek `allocateShortfalls(...,unit)`.
- Testy: `node tests/econ2.js` (pravidla, 248 kontrol), `tests/golden-econ2/*.json` (`node tests/golden.js gen <out> <seed> <easy|normal> 250 4 <careful|chaos> econ2`; `check` je přehraje jako ostatní), UI `ECON2=1 node tests/uismoke.js`. Klasické goldeny se ECON2 nedotkl (stejný stav, stejný počet RNG).
- UI: blok „Mzda“ na kartě dělníka (`wageBlockNode` v `ui/tabs/parta.js`: verdikt 🟢🟡🔴, složky, co hradí huť navíc, vzorec fondu, odhad za sezónu), Účty (předpověď mezd přes `crewWageNext`, řádek a předpověď činže), souhrn kola (rozpis pevná část + podíl, karta Činže panství), toast při odpočinku (odpočinek mzdu nesnižuje).

### Záloha od Reichela a jarmark (ECON2, etapa 7b) — jen nové hry

- Data: `ECON2.advance` (podíl zálohy 0,5, sleva 0,15, důvěra ≥25, dluh 0, kola 1–6, termín ≥3 kola daleko a ≤ kolo 10) a `ECON2.fair` (kola 8 a 11, ceny ×1,3) v `data/econ2.js`; události Reichela `advanceDone` (+3) a `advanceMissed` (−6) v `data/partners.js` (stejná data musí dostat Android `PARTNERS.json`).
- Záloha (`core/econ2.js`): `G.adv={season,id,taken}`. Nabídku zakládá `econ2AdvRoll` v `processRound` při přechodu do kola 1 (`pool[(season*7+round) mod n]`, **bez RNG**); `econ2AdvanceView()` je čistý pohled (stav none/offer/active/done/closed + blokace trust/debt/slots), `econ2AdvanceAccept()` vyplatí zálohu a přidá do `G.contracts` zakázku `id:"adv_<id>"`, `buyer:"Reichel"`, `reward`=cena, `adv:{paid,price,season,round}`.
- Dodání (`processRound` krok 7): vyplatí se `reward − adv.paid` (bez Easy bonusu a zimní prémie), Reichel +3, bez Famy; fond dostane podíl z zbytku i ze zálohy (`advFund`). Nedodání: záloha se vrací z kasy po celých zl, zbytek jde do `debt`, Reichel −6, Fama beze změny, hra pokračuje.
- Jarmark: `econ2FairMult()` ve `marketSaleQuote` (bere `max(Weiss 1,5; jarmark 1,3)` — neskládá se; rychlý výkup beze změny). Měsíc předem a v měsíci jarmarku zpráva v kronice; banner v Trh › Prodej (`.fj-fair-banner[data-fair=soon|on]`).
- Save: `validateGameSave` čistí `adv` a vyřazuje zakázky s poškozenou zálohou; klasický save `adv` nemá.
- Testy: `node tests/econ2b.js` (114 kontrol), `ECON2B=1 node tests/uismoke.js`, `tests/golden-econ2/` přegenerované (bot v ECON2 nabídku využije: akce `acceptAdvance`, případně jednou za sezónu `patch` dluhu a důvěry; neposouvá RNG ostatních akcí).

### Počasí a události s volbou (ECON2, etapa 8a: W1 + W2) — jen nové hry

- **Žádný RNG navíc.** `wSeed` (uint32) vzniká při startu hry v `econ2Init` z `Date.now()` (+ `performance.now()`), ne z `Math.random` — pořadí RNG zůstává a klasické goldeny (sdílené s Androidem) se nemění. Android losuje `wSeed` z vlastního RNG; web se tedy **neshoduje bit po bitu** (viz PARITY). Starší save nové ekonomiky bez `wSeed` ho dostane odvozeně ze sezóny (`validateGameSave`). Klasický save `wSeed` ani `fate` nenese.
- **Počasí (`core/weather.js`, data `ECON2.weather`).** Druh měsíce = `weatherKindFor(wSeed, sezóna, kolo)`: jedno rovnoměrné číslo `wxU` (hash → mulberry32) proti kumulativním pravděpodobnostem v pořadí `frost, storm, dry, wet`. Rozsahy: mráz 0–4, mokro 4–11, sucho 6–10, bouře 7–9; p = 0,22 / 0,10 / 0,12 / 0,10 → ≈ 2,8 extrémních měsíců za sezónu (měřeno v `tests/weather.js`). Nic se neukládá.
- Vlivy (`wxFx(sezóna,kolo)`): mráz = dříví −4, nálada −5, kácení ×1,5, nové pánve +1★; mokro = kácení ×0,7, prodejní ceny ×0,9 (trh i rychlý výkup); sucho = políčko ×0,6 (zaokrouhleno), únava +0,05; bouře = jen zpráva v kronice. V nové ekonomice nahrazují pevné `WINTER_LOG_MULT` / `WINTER_PANEV_BONUS` a náhodnou „Krutou zimu“ (chybí tedy jedno `Math.random` — econ2 goldeny přegenerované). Klasika: `wxFx` vrací původní zimní tabulky, nic jiného.
- **Události s volbou (`core/fate.js`, data `data/fate.js` = `FATE`).** Jedna za sezónu od S2 v kolech 2–9. Měsíc `fateMonth(sezóna)`: v 65 % sezón první měsíc s mrazem/suchem/bouří (`weatherShare`), jinak měsíc ze zrna. Druh při příchodu měsíce: mráz → Mrazy, sucho/bouře → Požár, jinak kalendář (Lesní řád; od kola 5 Vojsko; od kola 5 a ≥ 12 kusů zboží Přesycení). `fateOnRound()` na konci `processRound` založí `G.fate.pending={kind,season,round}`; `processRound` se pak **nespustí** (gate na začátku), dokud `fateChoose(id)` neprojde. UI: panel na Přehledu (`.fj-fate-card`, volby `.fj-fate-opt[data-fate-opt]`), tlačítko „Další měsíc“ nahrazeno `.fj-fate-block` („Nejdřív rozhodni: …“, vede na Přehled), mezerník stejně.
- Stav `G.fate={fx:[{k,v,from,to}],pending,done,hist}`; `from/to` = absolutní měsíce `sezóna*12+kolo`. Klíče fx: `logMult/priceMult/fieldMult` (násobí), `fatigue` (sčítá), `frostMorale` (přepis ztráty z mrazu), `marketClosed` (W3). `fateSanitize` čistí save.
- Náklady: základ S2 Normal; Easy ×0,7; +15 % za každou další sezónu (zl, dříví i jídlo; šance a morálka se neškálují). Šance: **jedno hození na událost** `wxU(wSeed,4,sezóna,kolo)` shodné pro všechny volby (nižší riziko nikdy nedopadne hůř). Volba bez peněz/zásob je zašedlá s důvodem; vždy existuje volba zdarma.
- Odchylky od Androidu (popis ze souhrnů, ne ze zdrojáku): „Nechat být“ u mrazu = `frostMorale 8` (celková ztráta −8, ne −13); „Držet do jarmarku“ rozbije `round(15 % × kusů)` nejhorších kusů; „Prodat sklad“ bere základní ceny × 0,7 (× 1,2 Easy) bez tržních bonusů; ztráta peněz při zásahu je nejvýš zůstatek v kase.
- Testy: `node tests/weather.js` (52), `node tests/fate.js` (75), `ECON2=1 node tests/uismoke.js` (panel, blokace, zašedlé volby), `tests/golden-econ2/` (7 scénářů, akce `fateChoose`; bot careful bere volby střídavě bez `r()`, chaos náhodně; `newGame` nese `wSeed`).

### Mor a zákaz plavby po Labi (ECON2, etapa 8b: W3) — jen nové hry

- Data v `data/fate.js`: `FATE.plague` (armyP 0,40, armyDelay [1,3], lastRound 11, heat {kola 6–10, ≥2 horké měsíce, p 0,30}, closeMonths 2), `FATE.elbeMinRound` 5, `FATE.elbeBuyer` "Hoffmann", druhy `elbe` a `plague`.
- **Labe** (`core/fate.js`): běžná událost, do poolu kalendáře se přidá od kola 5, jen když je ve `G.contracts` otevřená zakázka Hoffmann (`fateElbeContracts`, zakázky se zálohou — Reichel — se nepočítají). Volby: Povolení −16 zl · Po souši (`rewardMult` 0,8) · Propašovat (35 %: −22 zl a `rewardMult` 0,8). `fateElbeApply` přepíše `reward` otevřených zakázek Hoffmanna na celé zl (`round(reward·0,8/KR)·KR`); nové nabídky Hoffmanna se nemění; odevzdání zakázek beze změny (čte stav). Náhled v panelu: počet dotčených zakázek a ztráta.
- **Mor**: druhá, řetězená událost — nezabírá běžný slot (`G.fate.done`), max. jeden za sezónu (`G.fate.plagueSeason`), naplánovaný mor je `G.fate.plague={season,round,src}`. Zdroje: (a) po rozhodnutí Vojska los `wxU(wSeed,7,s,r,0)<0,40`, zpoždění 1–3 měsíce ze `wxU(…,1)`, nejpozději kolo 11, v kronice zvěst; (b) horko: v prvním měsíci kol 6–10, kdy počet horkých měsíců (sucho/bouře) dosáhne 2, los `wxU(wSeed,6,s,r,0)<0,30`. Ve stejném měsíci jako běžná událost má přednost běžná a mor čeká na další měsíc; nespuštěný mor z minulé sezóny propadá. Volby: Prodat zásoby (80 % ceny, bez Easy bonusu, nálada −3) · Počkat (nálada −3); obě přidají fx `marketClosed` na měsíc události + další. Žádné nemoci ani úmrtí.
- **Zavřený trh**: `marketClosedNow()` = kalendář (`MARKET_CLOSED`) nebo fx `marketClosed`; blokuje `sellItems` (tedy i prodej na jarmarku), rychlý výkup u Weisse (jen mor: `marketPlagueClosed()` — kalendářní zavření výkup nikdy neblokovalo a změna by rozbila klasické goldeny), volbu „Prodat“ u Přesycení; UI (stavový řádek trhu, panel sezóny, banner jarmarku, tlačítko výkupu) čte `marketClosedText()` — mor má vlastní text 🦠.
- Chyba nalezená golden testem při vývoji: první verze blokovala výkup i v kalendářně zavřených měsících (klasický golden `chaos-easy-1` spadl). Hlídají to klasické goldeny.
- Testy: `node tests/plague.js` (48), `ECON2=1 node tests/uismoke.js` (panel moru a Labe, zavřený trh), `tests/golden-econ2/` přegenerované (10 scénářů, pokrývají Labe „Po souši“, mor „Počkat“ i „Prodat“).

### Cesta z dluhů a „Proč jsem padl“ (ECON2, etapa 8c: E3) — jen nové hry
- Bez nové mechaniky: jen počítadla příčin a seřazení nástrojů, které už hra měla. Data `ECON2.ladder` (`foreclose` 16000/18000 kr — jen pro text, skutečné podmínky exekuce zůstávají v `processRound`; `weights`; `debtMin` 6000 kr; `top` 3). Kód `core/ladder.js`, UI `ui/ladder-card.js`.
- **`G.fall`** (jen `_econ===2`, `fallInit/fallSanitize/fallStep`): `hunger` (měsíce s jídlem pod potřebou), `wageMonths`/`wageSum` (měsíce a součet `wagesDeficit`), `rentTerms`/`rentSum` (termíny činže s dluhem `rentInfo.debt`), `noWood` (měsíc končí se dřívím ≤ 0), `closedMonths` (`marketPlagueClosed`, jen mor), `lastOut` (mzdy + pivo posledního měsíce). Počítá se na konci `processRound` do `Object.assign(G,…)`; klasika `G.fall` nemá (save ji zahodí).
- **Potíže** (`ladderTrouble()`): některý dělník má `unpaidDebt>0`, nebo `lastOut>0` a `G.grose<lastOut`. Jinak karta není vidět.
- **Karta** (Trh › Reichel, nad zálohou): 1. ⏳ odklad splátek (`negotiateMoratorium`; stavy nabídka/aktivní/bez dluhu) → 2. 🐴 výkup u Weisse (`quickSellAll`; stavy nabídka/použit/mor/prázdno) → 3. 🪙 půjčka (jen text s úrokem `loanRateMarket()`, tlačítka zůstávají níže) + řádek o exekuci a aktuálním dluhu. Připomínka (`ladderReminderNode`) v souhrnu měsíce pod kartou dluhu.
- **Proč jsem padl** (`fallCauses()`, obrazovka konce hry): až 3 příčiny seřazené podle váhy — dluh (kr/4000, jen od `debtMin`), mzdy ×1/měsíc, činže ×3/termín, hlad ×1, dříví ×1, mor ×0,5. Každá má číslo a radu. Bez zaznamenaných příčin (klasika, čistý pád) zůstávají 4 pevné rady.
- Odchylky od Androidu (popis jen ze shrnutí): váhy pořadí jsou moje; `lastOut` je definováno jako mzdy+pivo posledního měsíce; prodej přebytku dříví/popela z karty vynechán; krok „Pád“ je řádek textu, ne tlačítko.
- Testy: `node tests/ladder.js` (39), `ECON2=1 node tests/uismoke.js` (karta, připomínka, game over), `tests/golden-econ2/` přegenerované (stav obsahuje `fall`; průběh her beze změny), klasické goldeny beze změny.

### Etapa 9 — parita, cache, oprava průvodce
- **Parita pro Android:** všechny webové doplňky ECON2 (8a–8c) a jejich odchylky jsou v projektovém dokumentu `claude/web-econ2-parity.md` (PARITY.md patří Android repu; z webu ho needituju). Obsah: nové klíče `G` (`wSeed`, `fate`, `fall`, `adv`), akce (`acceptAdvance`, `fateChoose`), tabulky (`ECON2.weather/fair/advance/ladder`, `FATE`), události Reichela, odchylky (`wSeed` z času, ne z RNG; vlastní generátor `wxU`; váhy příčin pádu), nově zapsané texty kroniky.
- **`sw.js`:** `CORE` = `sklarska-hut-woodland-v1.36-econ2-etapa9`; do `MEDIA_ASSETS` přibyl `/img/materials/forest.webp` (kulatá ikona lesa v pills). `/img/partners/reichel.webp` v repu stále **chybí** (`partners.js` na něj odkazuje, UI spadne na emoji) — do `MEDIA_ASSETS` ho přidej až se soubor objeví, jinak by předběžné cachování hlásilo `failed`. `nav-forest.webp` taky chybí (záložka Les používá SVG náhradu).
- **Průvodce: ping-pong `field` ↔ `forest_low`** (`core/guide.js`, `_gGuarded`): krok „field“ bral přes `_gFreeWorkerFor` sázeče, tím se objevil „forest_low“ a ten vzal zpět dělníka z políčka dalším CTA. Teď `_gFreeWorkerFor` nebere dělníka na `reforest`, dokud je les ≤ 30 % a na výsadbě je nejvýš on. Chránit i dělníka na políčku jsem zkusil (varianta A): cyklům to také zabránilo, ale na Normalu to snížilo `tier≥1` (10/20 proti 13/20 u základu), proto zůstala jen ochrana sázeče (13/20 jako základ). Test `tests/guide.js`: 2 cílené scénáře + fuzz 300 náhodných stavů „krok se nikdy nevrátí do už viděného stavu“ (základ: 28 cyklů, po opravě 0). Měření celé hry (20 semínek, 8 sezón): Easy 20/20 přežilo, průměrná hotovost 580 zl (základ 727 zl — méně přehazování dělníků), Normal 1/20 vs 0/20, `tier≥1` 13/20 vs 13/20.
- **Android:** oprava tam zatím není (nejsem u Android dev stroje). Stejná změna do `Guide.kt` `freeWorkerFor`: vynechat dělníka na `reforest`, když `forest ≤ 0,3·forestMax` a `onTask(reforest) ≤ 1` a `task != reforest`.
