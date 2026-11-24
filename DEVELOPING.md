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
