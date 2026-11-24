'use strict';
// Zásoby (core/stock.js): prahy POZOR / ❗ jako Android PresentStock.kt, čistota (žádná změna stavu, žádné RNG), bez RESOURCE_INFO nic nespadne.
//   node tests/stock.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };

const e = load({ seed: 7 }); const A = e.api;
apply(e, { t: 'newGame', difficulty: 'normal', huteName: 'test' });
const st = (k) => A.call('stockCalc', k);
const setRes = (o) => Object.assign(A.G.res, o);

// 1) várky: písek 3/várka, potaš 2, vápenec 1, voda 1; POZOR < 3 várek, ❗ < 1
setRes({ sand: 12, limestone: 5, potash: 8, water: 5 });
ok(st('sand').state === 'ok' && st('sand').reach === 4, 'sand 12 → ok, reach 4');
setRes({ sand: 8 }); ok(st('sand').state === 'warn' && st('sand').reach === 2, 'sand 8 → warn (2 várky)');
setRes({ sand: 2 }); ok(st('sand').state === 'crit' && st('sand').reach === 0, 'sand 2 → crit');
setRes({ potash: 5 }); ok(st('potash').state === 'warn', 'potash 5 → warn (2 várky)');
setRes({ potash: 1 }); ok(st('potash').state === 'crit', 'potash 1 → crit');
setRes({ limestone: 2 }); ok(st('limestone').state === 'warn', 'limestone 2 → warn');
setRes({ limestone: 0 }); ok(st('limestone').state === 'crit', 'limestone 0 → crit');
setRes({ water: 3 }); ok(st('water').state === 'ok', 'water 3 → ok (3 várky)');
setRes({ water: 2 }); ok(st('water').state === 'warn', 'water 2 → warn');

// 2) jídlo: ceil(dělníci×0.5)/kolo; POZOR < 2 kola, ❗ < 1
const need = Math.ceil(A.G.workers.length * 0.5);
setRes({ food: need * 2 }); ok(st('food').state === 'ok', 'food 2 kola → ok');
setRes({ food: need * 2 - 1 }); ok(st('food').state === 'warn', 'food < 2 kola → warn');
setRes({ food: need - 1 }); ok(st('food').state === 'crit', 'food < 1 kolo → crit');

// 3) dřevo: palivo za kolo; POZOR < 3 kola
const fuel = A.call('fuelNeedPerRound', A.G.round, A.get('FURNACE_TYPES')[A.G.furnace.type]);
ok(st('wood').need === fuel, 'wood need = fuelNeedPerRound');
setRes({ wood: fuel * 3 }); ok(st('wood').state === 'ok', 'wood 3 kola → ok');
setRes({ wood: fuel * 3 - 1 }); ok(st('wood').state === 'warn', 'wood < 3 kola → warn');
setRes({ wood: fuel - 1 }); ok(st('wood').state === 'crit', 'wood < 1 kolo → crit');

// 4) les a nálada: absolutní prahy 21/5 a 40/35
A.G.forest = 21; ok(st('forest').state === 'ok', 'forest 21 → ok');
A.G.forest = 20; ok(st('forest').state === 'warn', 'forest 20 → warn');
A.G.forest = 4; ok(st('forest').state === 'crit', 'forest 4 → crit');
A.G.morale = 40; ok(st('morale').state === 'ok', 'morale 40 → ok');
A.G.morale = 39; ok(st('morale').state === 'warn', 'morale 39 → warn');
A.G.morale = 34; ok(st('morale').state === 'crit', 'morale 34 → crit');

// 5) pánve: v kampani ❗ při 0 hotových; v přípravě POZOR při <2 hotových a <2 zrajících
A.G.round = 0; A.G.pReady = 1; A.G.pAging = [];
ok(A.call('isPrepMonth', 0, A.G.seasonTier || 0) && st('crucibles').state === 'warn', 'crucibles prep 1 ready, 0 aging → warn');
A.G.pAging = [1, 2]; ok(st('crucibles').state === 'ok', 'crucibles prep with 2 aging → ok');
A.G.round = 8; A.G.pReady = 0;
ok(!A.call('isPrepMonth', 8, A.G.seasonTier || 0) && st('crucibles').state === 'crit', 'crucibles campaign 0 ready → crit');
A.G.pReady = 1; ok(st('crucibles').state === 'ok', 'crucibles campaign 1 ready → ok');

// 6) zdroje jen informační (bez stavu)
for (const k of ['formy', 'clay', 'dryWood', 'pitch', 'stone', 'firebrick', 'additives', 'colors'])
  ok(st(k) && st(k).state === 'ok', k + ' je info-only → ok');
ok(st('neexistuje') === null, 'neznámý klíč → null');

// 7) bublina a panel: obsah, řazení problémů, čistota
setRes({ sand: 2, potash: 5, food: 50, wood: 80, limestone: 5, water: 9, clay: 4 }); A.G.forest = 60; A.G.morale = 60; A.G.round = 8; A.G.pReady = 1;
const panel = A.call('stockPanelView');
ok(panel.tiles.length === 10, 'panel má 10 dlaždic');
ok(panel.alerts.length === 2 && panel.alerts[0].key === 'sand' && panel.alerts[1].key === 'potash', 'problémy: ❗ písek před POZOR potaš');
ok(panel.alerts[0].hint && panel.alerts[1].hint, 'problémy mají radu');
const v = A.call('resourceInfoView', 'sand');
ok(v.state === 'crit' && v.hint && v.source && v.usage && v.openTab === 'storage' && v.openSub === 'raw', 'bublina písku: stav, rada, odkud/k čemu, otevři Sklad › suroviny');
ok(v.buy && /Weiss/.test(v.buy), 'bublina nabízí Weisse');
ok(A.call('resourceInfoView', 'morale').openTab === 'accounts', 'nálada → Huť');
ok(A.call('resourceInfoView', 'forest').openTab === 'forest', 'les → karta Les');
ok(A.call('resourceInfoView', 'neexistuje') === null, 'bublina neznámého klíče → null');
ok(/stačí na \d+ (várku|várky|várek)|nestačí|došlo/.test(A.call('resourceInfoView', 'water').reach || 'x'), 'dosah má správný český tvar');
{ // skloňování: 1 várku, 2–4 várky, 5+ várek
  setRes({ sand: 3 }); const r1 = A.call('resourceInfoView', 'sand').reach;
  setRes({ sand: 6 }); const r2 = A.call('resourceInfoView', 'sand').reach;
  setRes({ sand: 15 }); const r5 = A.call('resourceInfoView', 'sand').reach;
  ok(r1 === 'stačí na 1 várku' && r2 === 'stačí na 2 várky' && r5 === 'stačí na 5 várek', 'skloňování várku/várky/várek: ' + [r1, r2, r5].join(' | '));
}
{ // čistota: žádná změna stavu, žádné RNG
  const calls = e.rnd ? e.rnd.calls : null;
  const before = JSON.stringify(A.G);
  for (const k of ['forest', 'wood', 'sand', 'limestone', 'potash', 'water', 'clay', 'food', 'crucibles', 'formy', 'morale', 'additives', 'colors', 'dryWood']) { A.call('stockCalc', k); A.call('resourceInfoView', k); }
  A.call('stockPanelView');
  ok(JSON.stringify(A.G) === before, 'výpočet zásob nemění stav');
  if (calls !== null) ok(e.rnd.calls === calls, 'výpočet zásob nelosuje');
}
// 8) EN texty
A.G.lang = 'en'; setRes({ sand: 2 });
ok(A.call('resourceInfoView', 'sand').stateLabel === '❗ SHORT', 'EN stateLabel');
ok(/batch/.test(A.call('resourceInfoView', 'water').reach), 'EN reach');
{ // klíč bez pravidel (nebo smazaný): null / ok / panel bez dlaždice, žádný pád
  const RI = A.get('RESOURCE_INFO'), saved = RI.sand; delete RI.sand;
  ok(st('sand') === null && A.call('stockStateOf', 'sand') === 'ok' && A.call('resourceInfoView', 'sand') === null, 'chybějící pravidlo → null/ok');
  ok(A.call('stockPanelView').tiles.every(t => t.key !== 'sand'), 'panel bez dlaždice bez pravidla');
  RI.sand = saved; }
A.G.lang = 'cs';

console.log(fail ? `stock: ${fail}/${n} FAIL` : `stock: ${n} checks OK`);
process.exit(fail ? 1 : 0);
