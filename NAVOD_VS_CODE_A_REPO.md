# Fajrum web — návod: VS Code a aktualizace repa

Balíček je „overlay“: rozbalí se do kořene stávajícího repa `ondrex-ember/fajrum` a přidá/přepíše jen tyto soubory.

| Co | Stav |
|---|---|
| `build.js` | nový — sestavení + pořadí modulů (`JS_MAIN`) |
| `src/` (66 souborů) | nový — celý kód hry rozdělený do 65 modulů; `src/template.html` = HTML + CSS + kostra skriptu |
| `index.html` | přepsaný — nyní **generovaný** z `src/` (`node build.js`) |
| `manifest.json` | nový — v repu chyběl, ale `sw.js` ho má v `CORE_ASSETS` (viz poznámka u `sw.js`) |
| `DEVELOPING.md` | nový — příručka k struktuře a pravidlům |
| `.editorconfig`, `.gitattributes`, `.vscode/` | nové — LF konce řádků, úlohy Build/Check/Watch, doporučená rozšíření |
| `android-tools/lib/engine.js` | **patří do Android repa** jako `tools/lib/engine.js` (viz bod 6) |

Neměněno: `sw.js`, `ui/*`, `img/*`, `about.html`, ikony, `robots.txt`, `sitemap.xml`.

## 1. Příprava

- Node.js LTS (kontrola: `node -v`), Git, VS Code.
- Volitelně rozšíření **Live Server** a **EditorConfig** (VS Code je nabídne sám z `.vscode/extensions.json`).

## 2. Aktualizace repa (doporučeně na větvi, ne rovnou do `main`)

```bash
git clone https://github.com/ondrex-ember/fajrum.git      # nebo: cd fajrum && git pull
cd fajrum
git switch -c modularizace
```

Rozbal `fajrum-web-modular.zip` **do kořene repa** (souhlas s přepsáním `index.html`; složku `android-tools/` si z repa můžeš po zkopírování smazat).
Pak:

```bash
node build.js --check        # očekávaný výstup: "build --check: OK, index.html is identical (…)"
git status                   # nové: build.js, src/, manifest.json, DEVELOPING.md, …; změněné: index.html
git add -A
git commit -m "Modularizace webu: src/ + build.js, doplněn manifest.json"
git push -u origin modularizace      # push a případné pull requesty děláš ty
```

Pozn. k `.gitattributes`: vynutí LF. Všechny stávající soubory v repu už LF mají, takže se nic neřádkuje.

### Poznámky k `sw.js` (rozhodnutí je tvoje, balíček `sw.js` nemění)

- `precacheCore` je „všechno nebo nic“: každý soubor z `CORE_ASSETS` s 404 shodí instalaci service workeru. `'/manifest.json'` v seznamu je,
  v repu ale soubor chyběl → precache na 404 selhal. Tento balíček ho přidává.
- `index.html` se změnil, takže pro uživatele s nainstalovanou PWA je potřeba při releasu zvednout verzi cache v `sw.js`
  (podle komentáře v souboru). Číslo verze jsem nezvyšoval ani nevymýšlel.

## 3. VS Code — denní práce

1. `File → Open Folder…` → kořen repa. Potvrď doporučená rozšíření.
2. **Build:** `Ctrl+Shift+B` (úloha *Fajrum: build*). **Watch:** `Terminal → Run Task → Fajrum: watch` — při každém uložení v `src/` se přestaví `index.html`;
   chyby (např. soubor bez koncového nového řádku) vypíše a watcher běží dál.
3. **Spuštění hry:** pravé tlačítko na `index.html` → *Open with Live Server* (`http://127.0.0.1:5500`).
   Service worker cachuje: v DevTools → *Application → Service Workers* zapni *Update on reload* (nebo *Bypass for network*), případně testuj v anonymním okně.
4. Edituješ **jen `src/`** (nikdy ne `index.html`). Do gitu patří `src/` i vygenerovaný `index.html` společně;
   před commitem `Fajrum: check` — pokud řekne DIFFERENT, spusť build.
5. Kde co je a jak přidat záložku/obrazovku/data: `DEVELOPING.md`.

## 4. Nejčastější hlášky buildu

| Hláška | Příčina / oprava |
|---|---|
| `module(s) in src/ missing from JS_MAIN` | nový soubor v `src/` musí do seznamu `JS_MAIN` v `build.js` (a naopak) |
| `must end with a newline` | modul musí končit prázdným řádkem (EditorConfig to dělá sám) |
| `CR characters are not allowed` | konce řádků musí být LF (`files.eol` v `.vscode/settings.json`) |
| `contains "</script"` | řetězec `</script` v JS ukonči jako `<\/script` |
| ve hře `ReferenceError: X is not defined` hned po načtení | `const`/`let` na nejvyšší úrovni je použit dřív, než se načte jeho modul → uprav pořadí v `JS_MAIN` (tabulky z `data/` musí být před kódem, který je čte při načtení) |

## 5. Co se změnilo v kódu (a co ne)

- Logika a data jsou přesunuty **doslovně** (kontrola: žádný řádek původního kódu nezmizel; přibyly jen obaly funkcí, `Fx` volání a `ctx`).
- `core/` už nevolá `render()`, zvuk, toasty ani plovoucí texty přímo, ale přes sběrnici `Fx` (`src/core/fx.js`; handlery v `src/ui/fx-bindings.js`).
  Odpovídá to `Effect` typům v Android enginu.
- Herní data jsou v `src/data/*.js` (konstanty, kalendář, pec, trh, zakázky, parta, sklo, texty). Zůstávají JavaScriptem — JSON jako zdroj pravdy zatím ne.
- `renderOriginal()` je nyní jen dispatcher (~160 řádků): obrazovky `ui/screens/`, modaly `ui/modals/`, rám `ui/chrome/`, záložky `ui/tabs/`.
- **Záměrně nezměněno** (nejnižší riziko): `processRound` zůstává jednou funkcí; přednastavení v `startGame` a ceny v `sellItems` zůstávají v kódu;
  název `renderOriginal` zůstal kvůli volání z `render()`.

Ověření proti původní verzi (commit `5894236`): golden 7/7 shodných, obsah pro Android shodný (jen pořadí názvů v seznamu `scalars` v `_manifest.json`),
DOM všech 70 stavů × záložek shodný, klikací regrese (kliknutí na každý prvek každého stavu) shodná.
Pozn.: klikací test je při zatížení CPU občas nestabilní (počet volání RNG v kódu kolem zvuku). V průběhu ověřování se objevily dvě takové odchylky; při opakování bez zátěže zmizely a jedna z nich se objevila i mezi dvěma běhy původního kódu.

## 6. Android repo

Zkopíruj `android-tools/lib/engine.js` přes `tools/lib/engine.js` v Android projektu. Je to jediná změna nástrojů:
když vedle `index.html` leží `build.js` a `src/template.html`, načtou se logika a data z `core/` + `data/` (`JS_HEADLESS`),
jinak funguje původní režim podle značek v `index.html`. Příkazy: `DEVELOPING.md`, kapitola *Testy*.

Android `PARITY.md`: pin odkazuje na starší commit webu — po commitu této větve ho aktualizuj podle svého postupu (číslo verze/commit nevymýšlím).

## 7. Návrat zpět

Do `main` se nic nedostane, dokud nezmerguješ větev. Zpět: `git switch main`. Kdyby ses chtěl vrátit po mergi: `git revert <merge-commit>`.
