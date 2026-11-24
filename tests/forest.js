'use strict';
// Lesnictví (core/forest.js): akce a pracovní body, nádeníci, výstavky, nouzová seč, nákup sazenic, zimní přírůstek
// (shodný se starou regenerací, když hráč nic nedělá), čistota forestView(), save/load.
//   node tests/forest.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };

function fresh(diff, seed) {
  const e = load({ seed: seed || 5 }); const A = e.api;
  apply(e, { t: 'newGame', difficulty: diff || 'normal', huteName: 'test' });
  return { e, A, G: () => A.G, c: (n, ...x) => A.call(n, ...x), rec: () => A.call('forestRec') };
}

// 1) výchozí záznam + práce (3 LP/sezónu), sázení, bonus každé 2. výsadby
{
  const t = fresh('normal');
  const f = t.rec(), G = t.G();
  ok(f.man === 3 && f.hands === 0 && f.pool === 0 && f.y === 0 && f.z === 0 && f.reserve === 0 && f.emerg === false, 'výchozí záznam lesa');
  ok(t.c('forestLP') === 3, 'LP na začátku = 3');
  G.forestMax = 30; G.forest = 20;              // paseka 10
  ok(t.c('forestPaseka') === 10, 'paseka = max − těžitelné − mlází − sazenice');
  const g0 = t.e.calls;
  t.c('forestPlant'); ok(f.z === 2 && f.man === 2 && f.plants === 1, 'sázení 1: +2 sazenice, −1 LP');
  t.c('forestPlant'); ok(f.z === 5, 'sázení 2: bonus +1 (celkem +3)');
  t.c('forestPlant'); ok(f.z === 7 && f.man === 0, 'sázení 3: +2');
  t.c('forestPlant'); ok(f.z === 7 && f.man === 0, 'bez LP se nesází');
  ok(G.log.some(l => /Došly lesní práce/.test(l)), 'hláška o došlé práci');
  ok(t.e.calls === g0, 'akce lesa nelosují');
}

// 2) Easy sází 3, paseka omezí výsadbu
{
  const t = fresh('easy');
  const G = t.G(), f = t.rec();
  G.forestMax = 12; G.forest = 10;               // paseka 2
  t.c('forestPlant'); ok(f.z === 2, 'Easy: výsadba omezená pasekou (2)');
  t.c('forestPlant'); ok(f.z === 2 && f.man === 2, 'bez paseky se LP neutrácí');
  ok(G.log.some(l => /žádná paseka/.test(l)), 'hláška bez paseky');
}

// 3) probírka (mlází → těžitelný hned, max/sezónu), smolaření (smůla)
{
  const t = fresh('normal');
  const G = t.G(), f = t.rec();
  G.forestMax = 30; G.forest = 10; f.y = 3; f.man = 10;
  const pitch0 = G.res.pitch || 0;
  for (let i = 0; i < 6; i++) t.c('forestThin');
  ok(f.thins === 4 && f.y === 0 + 0 || f.thins === 3, 'probírka: omezená mlázím/limitem (' + f.thins + ')');
  ok(G.forest === 10 + (3 - f.y), 'probírka přidává těžitelné parcely 1:1');
  f.man = 10;
  for (let i = 0; i < 5; i++) t.c('forestResin');
  ok(f.resins === 3 && G.res.pitch === pitch0 + 3, 'smolaření: max 3/sezónu, +1 smůla');
  G.forest = 0; f.resins = 0; t.c('forestResin'); ok(f.resins === 0, 'smolaření bez lesa nic nedá');
}

// 4) nádeníci: mzda, strop 2, propuštění, mzda v zimě, bez peněz odejde
{
  const t = fresh('normal');
  const G = t.G(), f = t.rec(), fee = 800;
  G.grose = 5000;
  t.c('forestHire'); ok(f.hands === 1 && f.pool === 3 && G.grose === 5000 - fee, 'nádeník: −800 kr, +3 LP');
  t.c('forestHire'); t.c('forestHire'); ok(f.hands === 2 && f.pool === 6, 'strop 2 nádeníků');
  t.c('forestDismiss'); ok(f.hands === 1 && f.pool === 3, 'propuštění zkrátí fond');
  G.grose = 100; t.c('forestHire'); ok(f.hands === 1, 'bez peněz nenajmeš');
  // zima: nezaplatí → odejde
  G.forestMax = 30; G.forest = 10; G.grose = fee - 1;
  const r = t.c('forestGrow');
  ok(r.dropped === 1 && f.hands === 0 && f.pool === 0 && r.fees === 0, 'bez peněz nádeník v zimě odejde');
  G.grose = 2000; t.c('forestHire'); const gr = G.grose; t.c('forestGrow');
  ok(G.grose === gr - fee && f.hands === 1 && f.pool === 3 && f.man === 3, 'mzda se platí v zimě, nádeník zůstane, LP se obnoví');
}

// 5) výstavky a nouzová seč při těžbě (processRound)
{
  const t = fresh('normal', 11);
  const G = t.G(), f = t.rec();
  ok(t.c('forestProtect', 10) === 0 && t.c('forestProtect', 0) === 0, 'bez výstavků se nic nechrání');
  f.reserve = 1; ok(t.c('forestProtect', 10) === 1 && t.c('forestProtect', 25) === 3, '10 % (nahoru)');
  f.reserve = 2; ok(t.c('forestProtect', 10) === 2 && t.c('forestProtect', 1) === 1, '20 %, max = stojící');
  t.c('forestSetReserve', 9); ok(f.reserve === 2, 'stupeň výstavků se ořízne na 0–2');
  t.c('forestSetReserve', -3); ok(f.reserve === 0, 'záporný stupeň → 0');
}
{
  const t = fresh('normal', 11);
  const G = t.G(), f = t.rec();
  G.round = 3; G.forestMax = 40; G.forest = 6; f.reserve = 2;     // chráněné 2
  const w = G.workers[0]; t.c('setWorkerTask', w.id, 'logging');
  if (w.task !== 'logging') { w.task = 'logging'; }
  for (let i = 0; i < 3; i++) { G.workers.forEach(x => { if (x.id !== w.id) x.task = 'idle'; }); t.A.processRound(); while ((G.events || []).length) t.A.dismissEvt(); if (G.phase !== 'playing') break; w.task = 'logging'; }
  ok(G.forest >= 2, 'výstavky se nepokácí (zůstalo ' + G.forest + ')');
}
{
  const t = fresh('normal', 11);
  const G = t.G(), f = t.rec();
  G.round = 3; G.forestMax = 40; G.forest = 1; f.reserve = 2;     // jediná parcela je chráněná
  const w = G.workers[0]; w.task = 'logging';
  G.workers.forEach(x => { if (x.id !== w.id) x.task = 'idle'; });
  t.A.processRound();
  ok(G.forest === 1 && G.log.some(l => /zbývají jen výstavky/.test(l)), 'zbývají jen výstavky → kácení nic nepokácí');
}
{
  const t = fresh('normal', 12);
  const G = t.G(), f = t.rec();
  G.round = 3; G.forestMax = 40; G.forest = 0; f.y = 5; f.emerg = true;
  const w = G.workers[0]; w.task = 'logging';
  G.workers.forEach(x => { if (x.id !== w.id) x.task = 'idle'; });
  t.A.processRound();
  ok(f.y < 5 && G.log.some(l => /nouzová seč mlází/.test(l)), 'nouzová seč kácí mlází (zbývá ' + f.y + ')');
}
{
  const t = fresh('normal', 12);
  const G = t.G(), f = t.rec();
  G.round = 3; G.forestMax = 40; G.forest = 0; f.y = 5; f.emerg = false;
  const w = G.workers[0]; w.task = 'logging';
  G.workers.forEach(x => { if (x.id !== w.id) x.task = 'idle'; });
  t.A.processRound();
  ok(f.y === 5 && G.log.some(l => /les vyčerpán/.test(l)), 'bez povolení mlází zůstane');
}

// 6) nákup: sazenice (400/parcela, +strop), hotové parcely (800), strop 200
{
  const t = fresh('normal');
  const G = t.G(), f = t.rec();
  G.grose = 10000; const max0 = G.forestMax || t.A.get('INIT_FOREST');
  t.c('buyParcely', 5, 'Z');
  ok(f.z === 5 && G.grose === 10000 - 2000 && G.forestMax === max0 + 5, 'sazenice: 5×400 kr, +5 do stropu, +5 sazenic');
  const s0 = G.forest; t.c('buyParcely', 2);
  ok(G.forest === s0 + 2 && G.grose === 8000 - 1600 && G.forestMax === max0 + 7, 'hotové parcely 800 kr');
  G.grose = 100; const z0 = f.z; t.c('buyParcely', 5, 'Z'); ok(f.z === z0 && G.grose === 100, 'bez peněz se nekupuje');
  G.grose = 1e7; G.forestMax = 198; t.c('buyParcely', 10, 'Z'); ok(G.forestMax === 200, 'strop 200 (nákup oříznut)');
  t.c('buyParcely', 5, 'Z'); ok(G.forestMax === 200, 'na stropu se nic nekoupí');
}

// 7) zimní přírůstek bez zásahu = stará regenerace (Easy 6 / Normal FOREST_REGEN_BASE / bez stojících 2 / parta)
{
  for (const diff of ['easy', 'normal']) {
    for (const [s0, rw] of [[30, 0], [30, 2], [5, 5], [0, 0], [0, 3], [78, 3]]) {
      const t = fresh(diff);
      const G = t.G(), f = t.rec();
      G.forestMax = 80; G.forest = s0; G.reforestWorkers = rw;
      const per = diff === 'easy' ? 3 : 2, base = s0 > 0 ? (diff === 'easy' ? 6 : t.A.get('FOREST_REGEN_BASE')) : 2;
      const pas = 80 - s0, crew = Math.min(Math.min(rw, 4) * per, pas), seed = Math.min(base, pas - crew);
      const g0 = t.e.calls;
      const r = t.c('forestGrow');
      ok(G.forest === s0 + crew + seed && r.matured === crew + seed && f.z === 0 && f.y === 0, `${diff} s0=${s0} rw=${rw}: ${G.forest} = ${s0 + crew + seed}`);
      ok(t.e.calls === g0, 'forestGrow nelosuje');
    }
  }
}

// 8) pipeline Z → Y → S přes dvě zimy; historie ≤ 8; výstavky zvyšují osev
{
  const t = fresh('normal');
  const G = t.G(), f = t.rec();
  G.forestMax = 40; G.forest = 10; f.z = 4; f.man = 0;
  t.c('forestGrow'); ok(f.y === 4 && f.z === 0, 'zima 1: sazenice → mlází');
  const s1 = G.forest; t.c('forestGrow'); ok(f.y === 0 && G.forest >= s1 + 4, 'zima 2: mlází → těžitelný');
  for (let i = 0; i < 12; i++) t.c('forestGrow'); ok(f.hist.length === 8, 'historie nejvýš 8 zim');
  const a = fresh('normal'); const b = fresh('normal');
  [a, b].forEach(x => { x.G().forestMax = 80; x.G().forest = 30; });
  b.rec().reserve = 2;
  const ra = a.c('forestGrow'), rb = b.c('forestGrow');
  ok(rb.seed === ra.seed + 2, 'rezerva 2 = +2 samovýsev (' + ra.seed + ' → ' + rb.seed + ')');
}

// 9) forestView: čistý (stav, RNG), konzistentní
{
  const t = fresh('normal');
  const G = t.G(), f = t.rec();
  G.forestMax = 40; G.forest = 12; f.y = 3; f.z = 4; G.grose = 5000;
  const before = JSON.stringify(G), g0 = t.e.calls;
  const v = t.c('forestView');
  ok(JSON.stringify(G) === before && t.e.calls === g0, 'forestView nemění stav ani nelosuje');
  ok(v.cells.length === 40 && v.stages.map(s => s.n).join() === '12,3,4,21', 'cells/stages sedí na 40 parcel');
  ok(v.actions.length === 3 && v.actions.every(a => typeof a.fn === 'string' && typeof t.A.has === 'function' && t.A.has(a.fn)), 'akce ukazují na existující funkce');
  ok(v.labour.slots.length === 2 && v.buy.price === 2000 && v.buy.enabled, 'sloty nádeníků + cena 5 sazenic');
  G.phase = 'game_over'; ok(!t.c('forestView').actions.some(a => a.enabled), 'po konci hry nejsou akce aktivní');
}

// 10) save/load: starý save bez forest2, poškozený forest2
{
  const t = fresh('normal');
  const G = t.G(), f = t.rec();
  f.z = 3; f.hands = 1; f.pool = 3; f.reserve = 2; f.emerg = true; f.hist = [1, 2, 3];
  const snap = JSON.parse(JSON.stringify(G));
  const ld = t.c('validateGameSave', JSON.parse(JSON.stringify(snap)));
  ok(JSON.stringify(ld.forest2) === JSON.stringify(snap.forest2), 'forest2 přežije save/load beze změny');
  const old = JSON.parse(JSON.stringify(snap)); delete old.forest2;
  const ld2 = t.c('validateGameSave', old);
  ok(ld2.forest2 && ld2.forest2.man === 3 && ld2.forest2.reserve === 0 && ld2.forest2.emerg === false, 'starý save bez forest2 → výchozí záznam');
  const bad = JSON.parse(JSON.stringify(snap)); bad.forest2 = { y: -5, z: 'x', man: 99, hands: 7, pool: 1e9, reserve: 9, emerg: 'yes', hist: ['a', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };
  const ld3 = t.c('validateGameSave', bad), g = ld3.forest2;
  ok(g.y >= 0 && g.z === 0 && g.man <= 3 && g.hands <= 2 && g.pool <= 6 && g.reserve <= 2 && typeof g.emerg === 'boolean' && g.hist.length <= 8 && g.hist.every(x => typeof x === 'number'),
    'poškozený forest2 se vyčistí: ' + JSON.stringify(g));
}

console.log(`forest: ${n - fail}/${n} OK`);
process.exit(fail ? 1 : 0);
