'use strict';
// Bubliny „proč nejde úkol“ (core/task-block.js): pravidla proti Android PresentTaskBlock.kt, čistota, česká/anglická čísla.
//   node tests/taskblock.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };
const e = load({ seed: 3 }); const A = e.api;
apply(e, { t: 'newGame', difficulty: 'normal', huteName: 'test' });
const G = () => A.G, W = () => A.G.workers[0];
const tb = (t, w) => A.call('taskBlock', w || W(), t);
const set = o => Object.assign(A.G.res, o);

// formař: kola 0–3 tvrdé, od 4 měkké při nedostatku zásob
A.G.round = 1; let b = tb('formar');
ok(b && b.hard && /března/.test(b.whenText) && /za 3 kola/.test(b.whenText), 'formař v prosinci: tvrdé, od března za 3 kola — ' + (b && b.whenText));
A.G.round = 0; b = tb('formar'); ok(/za 4 kola/.test(b.whenText), 'formař v listopadu: za 4 kola');
A.G.round = 3; b = tb('formar'); ok(/za 1 kolo/.test(b.whenText), 'formař v únoru: za 1 kolo');
A.G.round = 7; set({ wood: 1, water: 0, food: 0 }); b = tb('formar');
ok(b && !b.hard && /Chybí/.test(b.reason) && /2🪵 \(máš 1\)/.test(b.reason) && /2💧 \(máš 0\)/.test(b.reason) && /1🍞/.test(b.reason), 'formař měkké — chybí: ' + (b && b.reason));
set({ wood: 5, water: 5, food: 5 }); ok(tb('formar') === null, 'formař se zásobami volný');

// políčko: zima tvrdé, příští výnos
A.G.round = 1; b = tb('field'); ok(b && b.hard && /března/.test(b.whenText), 'políčko v zimě: tvrdé od března');
A.G.round = 11; b = tb('field'); ok(b && b.hard && /března/.test(b.whenText) && /za 5 kol/.test(b.whenText), 'políčko v říjnu: od března za 5 kol — ' + (b && b.whenText));
A.G.round = 6; ok(tb('field') === null, 'políčko v květnu volné');

// pánvař: jen příprava; měkké bez jílu
A.G.round = 2; set({ clay: 0, food: 0 }); b = tb('panev'); ok(b && !b.hard, 'pánvař v přípravě bez jílu: měkké');
set({ clay: 4, food: 3 }); ok(tb('panev') === null, 'pánvař volný');
A.G.round = 8; b = tb('panev'); ok(b && b.hard, 'pánvař v kampani: tvrdé');
// čeření: jen kampaň, bez přísady měkké, plná zásoba bonusu měkké
b = tb('cereni'); ok(b && !b.hard && /burel/.test(b.reason), 'čeření bez přísady: měkké');
A.G.additives = Object.assign({}, A.G.additives, { burel: 2 }); ok(tb('cereni') === null, 'čeření s burelem volné');
A.G._cerenBonus = 2; b = tb('cereni'); ok(b && !b.hard && /plná/.test(b.reason), 'čeření: zásoba bonusu plná'); A.G._cerenBonus = 0;
A.G.round = 2; b = tb('cereni'); ok(b && b.hard, 'čeření v přípravě: tvrdé');
// kácení a výsadba
A.G.forest = 0; b = tb('logging'); ok(b && b.hard && /vykácený/.test(b.reason), 'kácení bez lesa: tvrdé');
A.G.forest = 50; ok(tb('logging') === null, 'kácení s lesem volné');
A.G.forest = A.G.forestMax || A.get('INIT_FOREST'); b = tb('reforest'); ok(b && b.hard && /paseka/.test(b.reason), 'výsadba bez pasek: tvrdé');
A.G.forest = 40; ok(tb('reforest') === null, 'výsadba s pasekou volná');
A.G.workers.slice(1, 6).forEach(x => x.task = 'reforest'); A.G.workers.forEach(x => { if (x.id === W().id) x.task = 'idle'; });
if (A.G.workers.filter(x => x.task === 'reforest').length >= 4) { b = tb('reforest'); ok(b && !b.hard, 'výsadba: už sázejí 4 → měkké'); }
// loužírna
A.G.wa.potash = 0; set({ wood: 50 }); b = tb('potash'); ok(b && !b.hard && /0 %/.test(b.reason), 'loužírna podíl 0 %');
A.G.wa.potash = 10; set({ wood: 20 }); b = tb('potash'); ok(b && !b.hard && /jen 2 🪵/.test(b.reason), 'loužírna: floor(20×10 %)=2 < 6 — ' + (b && b.reason));
A.G.wa.potash = 40; set({ wood: 20 }); ok(tb('potash') === null, 'loužírna: 8 ≥ 6 volná');
// odpočinek, verštat podle únavy
W().fat = 0.1; b = tb('idle', W()); ok(b && b.hard && /10 %/.test(b.reason), 'odpočinek při 10 % únavy: tvrdé');
W().fat = 0.3; ok(tb('idle', W()) === null, 'odpočinek při 30 % volný');
const tav = Object.assign({}, W(), { prof: 'tavic', fat: 0.5 }); b = tb('werkstat', tav); ok(b && b.hard, 'verštat tavič při 50 % únavy: tvrdé');
const fouk = Object.assign({}, W(), { prof: 'foukat_lesni', fat: 0.2 }); A.G.waldglas = []; set({ formy: 0 });
b = tb('werkstat', fouk); ok(b && !b.hard && /waldglas/.test(b.reason) && /forma/.test(b.reason), 'verštat foukač bez waldglas a formy: měkké — ' + (b && b.reason));
A.G.waldglas = [3]; set({ formy: 2 }); ok(tb('werkstat', fouk) === null, 'verštat foukač se vstupy volný');
const ryt = Object.assign({}, W(), { prof: 'rytec', fat: 0.2 }); set({ food: 0 }); b = tb('werkstat', ryt); ok(b && !b.hard && /sklo k rytí/.test(b.reason) && /jídlo/.test(b.reason), 'verštat rytec: nic k rytí + jídlo');
// aktivní varování
A.G.round = 1; W().task = 'field'; const aw = A.call('taskActiveWarn', W()); ok(aw && /nic nevyrobí/.test(aw) && /března/.test(aw), 'aktivní varování: ' + aw);
W().task = 'idle'; W().fat = 0.5; ok(A.call('taskActiveWarn', W()) === null, 'idle při únavě bez varování');
// EN
A.G.lang = 'en'; A.G.round = 0; b = tb('formar'); ok(/Available from March/.test(b.whenText) && /in 4 rounds/.test(b.whenText), 'EN: ' + b.whenText);
A.G.round = 3; b = tb('formar'); ok(/in 1 round\b/.test(b.whenText), 'EN 1 round'); A.G.lang = 'cs';
// čistota: žádný zápis, žádné RNG
{
  const calls = e.rnd.calls, before = JSON.stringify(A.G);
  for (const w of A.G.workers) for (const t of ['formar', 'field', 'panev', 'cereni', 'logging', 'reforest', 'potash', 'idle', 'werkstat', 'quarry', 'water', 'clay']) { A.call('taskBlock', w, t); A.call('taskActiveWarn', w); }
  ok(JSON.stringify(A.G) === before && e.rnd.calls === calls, 'výpočet bublin nemění stav a nelosuje');
}
console.log(fail ? `taskblock: ${fail}/${n} FAIL` : `taskblock: ${n} checks OK`);
process.exit(fail ? 1 : 0);
