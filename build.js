'use strict';
// FAJRUM web build — assembles index.html from src/template.html and the ordered main-script modules.
//
//   node build.js                 write ./index.html
//   node build.js --check         build in memory and compare with ./index.html (exit 1 on any difference)
//   node build.js --out <file>    write somewhere else
//   node build.js --watch         rebuild ./index.html on every change under src/ (errors are printed, the watcher keeps running)
//
// Rules (they keep the cut verifiable):
// - The main script is the concatenation of JS_MAIN in the order below. Order matters: eager consts
//   (HINTS_*, the FajrumCatalog merges, `app`) and the boot code at the end depend on it.
// - Every src/**/*.js file must be listed exactly once, and every listed file must exist (no orphans).
// - Modules are copied verbatim. The build never edits, minifies or reformats code.
// - Nothing here touches sw.js: its cache version and CORE_ASSETS stay under the owner's control.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const TEMPLATE = path.join(SRC, 'template.html');
const MARKER = '@@MAIN_SCRIPT@@';

const JS_MAIN = [
  // Effects bus — must be first: core/ announces what happened, ui/ and audio/ decide how to show it
  'src/core/fx.js',

  // Data tables — verbatim game content (no logic); they load before the logic that reads them
  'src/data/constants.js',
  'src/data/calendar.js',
  'src/data/furnace.js',
  'src/data/market.js',
  'src/data/contracts.js',
  'src/data/crew.js',
  'src/data/glass.js',
  'src/data/texts.js',
  'src/data/achievements-wiki.js',

  // Game logic — headless (runs in Node for the golden/extract tests); no DOM, no sound, talks to the UI only through Fx
  'src/core/rules-base.js',
  'src/core/crew.js',
  'src/core/craft.js',
  'src/core/state.js',
  'src/core/process-round.js',
  'src/core/contracts-sign.js',
  'src/core/interseason.js',
  'src/core/season-market.js',
  'src/core/contracts.js',
  'src/core/events-alloc.js',
  'src/core/save.js',
  'src/core/player-actions.js',
  'src/core/achievements.js',

  // Audio
  'src/audio/sfx.js',
  'src/audio/furnace.js',
  'src/audio/music.js',

  // UI: DOM helpers, effects, shared drawing helpers and the render() entry point
  'src/ui/dom.js',
  'src/ui/fx.js',
  'src/ui/molten.js',
  'src/ui/season-upgrades.js',
  'src/ui/contract-cards.js',
  'src/ui/render.js',

  // UI: full-screen views (renderOriginal() dispatches to them)
  'src/ui/screens/event.js',
  'src/ui/screens/gameover.js',
  'src/ui/screens/interseason.js',
  'src/ui/screens/intro.js',
  'src/ui/screens/summary.js',

  // UI: modals
  'src/ui/modals/contract.js',
  'src/ui/modals/help.js',
  'src/ui/modals/loyalty.js',
  'src/ui/modals/retention.js',
  'src/ui/modals/strike.js',
  'src/ui/modals/welcome.js',

  // UI: frame around the tabs (header, round bar, resources, season panel, tab bar)
  'src/ui/chrome/header.js',
  'src/ui/chrome/resource-bar.js',
  'src/ui/chrome/round-bar.js',
  'src/ui/chrome/season-panel.js',
  'src/ui/chrome/tabs.js',

  // UI: tab contents
  'src/ui/tabs/accounts.js',
  'src/ui/tabs/archiv.js',
  'src/ui/tabs/furnace.js',
  'src/ui/tabs/hrac.js',
  'src/ui/tabs/log.js',
  'src/ui/tabs/market.js',
  'src/ui/tabs/overview.js',
  'src/ui/tabs/parta.js',
  'src/ui/tabs/production.js',
  'src/ui/tabs/settings.js',
  'src/ui/tabs/storage.js',

  // UI: layout assembly and the renderOriginal() dispatcher
  'src/ui/layout.js',
  'src/ui/render-original.js',
  'src/ui/placeholders.js',

  // Wiring: Fx bus handlers -> ui/audio, then boot, then the PWA install prompt
  'src/ui/fx-bindings.js',
  'src/boot.js',
  'src/pwa/install.js'
];

// Modules the headless test tools (tools/golden.js, tools/extract-content.js) evaluate in a Node vm, without a DOM:
// the game logic (core/) and its data (data/). Anything that draws, plays sound or needs the browser lives in
// ui/, audio/, pwa/ or boot.js and is never loaded there; core/ reaches it only through the Fx bus (core/fx.js).
const JS_HEADLESS = JS_MAIN.filter(f => /^src\/(core|data)\//.test(f));

let THROW_ON_FAIL = false; // --watch: report the error and keep watching instead of exiting
function fail(msg) { if (THROW_ON_FAIL) throw new Error(msg); console.error('build: ' + msg); process.exit(2); }

function listJs(dir, out) {
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) listJs(p, out);
    else if (name.endsWith('.js')) out.push(path.relative(ROOT, p).split(path.sep).join('/'));
  }
  return out;
}

function assemble() {
  const dup = JS_MAIN.filter((f, i) => JS_MAIN.indexOf(f) !== i);
  if (dup.length) fail('duplicate module in JS_MAIN: ' + dup.join(', '));
  const onDisk = listJs(SRC, []);
  const orphans = onDisk.filter(f => !JS_MAIN.includes(f));
  if (orphans.length) fail('module(s) in src/ missing from JS_MAIN: ' + orphans.join(', '));
  const missing = JS_MAIN.filter(f => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length) fail('module(s) listed in JS_MAIN but not found: ' + missing.join(', '));

  const parts = JS_MAIN.map(f => {
    const buf = fs.readFileSync(path.join(ROOT, f));
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) fail(f + ': BOM is not allowed');
    const text = buf.toString('utf8');
    if (text.includes('\r')) fail(f + ': CR characters are not allowed (use LF)');
    if (!text.endsWith('\n')) fail(f + ': must end with a newline');
    if (/<\/script/i.test(text)) fail(f + ': contains "</script" which would end the inline script');
    return text;
  });

  const tpl = fs.readFileSync(TEMPLATE, 'utf8');
  const needle = '\n' + MARKER + '\n';
  const at = tpl.indexOf(needle);
  if (at < 0) fail('marker line "' + MARKER + '" not found in src/template.html');
  if (tpl.indexOf(needle, at + 1) >= 0) fail('marker line "' + MARKER + '" appears more than once');
  return tpl.slice(0, at + 1) + parts.join('') + tpl.slice(at + needle.length);
}

function main() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outFile = outIdx >= 0 ? path.resolve(args[outIdx + 1] || fail('--out needs a path')) : path.join(ROOT, 'index.html');
  const built = assemble();

  if (args.includes('--check')) {
    const current = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : null;
    if (current === built) { console.log('build --check: OK, ' + path.basename(outFile) + ' is identical (' + built.length + ' chars)'); return; }
    if (current === null) { console.error('build --check: ' + outFile + ' does not exist'); process.exit(1); }
    const a = current.split('\n'), b = built.split('\n');
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    console.error('build --check: DIFFERENT. First difference at line ' + (i + 1));
    console.error('  file : ' + JSON.stringify((a[i] || '').slice(0, 120)));
    console.error('  built: ' + JSON.stringify((b[i] || '').slice(0, 120)));
    process.exit(1);
  }

  fs.writeFileSync(outFile, built, 'utf8');
  console.log('build: wrote ' + path.relative(process.cwd(), outFile) + ' (' + built.length + ' chars, ' + JS_MAIN.length + ' modules)');
}

function watch() {
  const outFile = path.join(ROOT, 'index.html');
  THROW_ON_FAIL = true;
  let timer = null;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const built = assemble();
        fs.writeFileSync(outFile, built, 'utf8');
        console.log('build: wrote index.html (' + built.length + ' chars) at ' + new Date().toLocaleTimeString());
      } catch (e) { console.error('build: ' + e.message); }
    }, 150);
  };
  rebuild();
  fs.watch(SRC, { recursive: true }, rebuild);
  console.log('build: watching src/ (Ctrl+C to stop)');
}

if (require.main === module) { if (process.argv.includes('--watch')) watch(); else main(); }
module.exports = { JS_MAIN, JS_HEADLESS, assemble };
