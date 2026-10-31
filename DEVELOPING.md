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
