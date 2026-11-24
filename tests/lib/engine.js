'use strict';
// Headless web engine: evaluates the game logic (src/core + src/data, JS_HEADLESS from build.js) in a Node vm
// without DOM, with a seeded Math.random (mulberry32, counted) and a controllable Date.now.
// Shared by tools/golden.js (golden scenarios) and the stage test scripts.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JS_HEADLESS } = require('../../build.js');
const ROOT = path.join(__dirname, '..', '..');

// Same generator as Android `Mulberry32` (bit-exact; golden checkpoints compare results and call counts).
function mulberry32(seed) {
  let a = seed | 0;
  const f = () => {
    f.calls++;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.calls = 0;
  return f;
}

// Appended to the concatenated modules so it shares their global lexical scope (`let G` is not a context property).
const API = `
;globalThis.__api = {
  get G(){return G;}, set G(v){G=v;},
  initState, startGame, processRound, dismissEvt, startInterseason, startNewSeason,
  call(name,...args){ return eval(name).apply(null,args); },
  has(name){ try{ return typeof eval(name)==="function"; }catch(e){ return false; } },
  get(name){ return eval(name); }
};`;

function load(opts = {}) {
  const seed = opts.seed === undefined ? 1 : opts.seed;
  const rnd = mulberry32(seed);
  let clock = 1700000000000;
  const store = {};
  const DateStub = function () {};
  DateStub.now = () => clock;
  const sandbox = {
    console, Math: Object.create(Math), Date: DateStub, JSON, Object, Array, Number, String, Boolean, Set, Map, Symbol,
    Error, RegExp, parseInt, parseFloat, isNaN, isFinite, setTimeout: () => 0, clearTimeout: () => {},
    localStorage: {
      getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
  };
  sandbox.Math.random = rnd;
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;   // ui/fajrum-recipes.js (catalogue data + helpers used by core/data) registers itself on window
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'ui/fajrum-recipes.js'), 'utf8'), ctx, { filename: 'fajrum-recipes.js' });
  const code = JS_HEADLESS.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + API;
  vm.runInContext(code, ctx, { filename: 'headless.js' });
  return {
    api: sandbox.__api, ctx, rnd,
    get calls() { return rnd.calls; },
    setClock(ms) { clock = ms; },
    store,
  };
}

module.exports = { load, mulberry32 };
