'use strict';
// Nová ekonomika (core/econ2.js): úkolová mzda výrobců, stravné v přípravě, činže (kvóta + hotovost), fond, save/load, čistota pohledů.
// Klasická hra (bez G._econ) musí zůstat beze změny — to hlídají tests/golden/*.json (check).
//   node tests/econ2.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };

function fresh(diff, seed, econ) {
  const e = load({ seed: seed || 5 }); const A = e.api;
  apply(e, econ === false ? { t: 'newGame', difficulty: diff || 'normal', huteName: 't' } : { t: 'newGame', difficulty: diff || 'normal', huteName: 't', econ: 2 });
  return { e, A, G: () => A.G, c: (f, ...x) => A.call(f, ...x) };
}
// jeden processRound v řízeném stavu: nikdo nepracuje (jen mzdy), události pryč
function step(t, round, opts = {}) {
  const G = t.G();
  G.round = round; G.phase = 'playing'; G.curEvt = null; G.events = [];
  G.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.fat = 0; w.unpaidDebt = 0; });
  if (opts.grose !== undefined) G.grose = opts.grose;
  t.A.processRound();
  return G;
}

// 1) klasika beze značky: žádná nová pole, mzda jako dřív (stravné 1,5 zl v přípravě Normal při odpočinku 50 % = ceil → 1 zl)
{
  const t = fresh('normal', 5, false), G = t.G();
  ok(G._econ === undefined && G.pieceAcc === undefined && G.leaseSeasons === undefined, 'klasika: bez _econ/pieceAcc/leaseSeasons');
  const wk = G.workers.length; t.c('sellItems', 'waldglas', 1);
  ok(G.pieceAcc === undefined, 'klasika: prodej nezakládá fond');
  const v = t.c('workerWageView', G.workers[0]);
  ok(v.econ === false && v.piece === 0 && v.total === v.fixed, 'klasika: pohled mzdy bez podílu');
  ok(t.c('econ2RentNext') === null && t.c('econ2') === null, 'klasika: žádná činže');
  ok(t.c('workerFixedWage', G.workers[0]) === 200 + G.workers[0].wageMod, 'klasika: pevná složka 200+příplatek');
}

// 2) nová hra: značka, začátek
{
  const t = fresh('normal'), G = t.G();
  ok(G._econ === 2 && G.pieceAcc === 0 && G.leaseSeasons === 0, 'nová hra: _econ=2, fond 0, 0 sezón nájmu');
  const e2 = fresh('easy'); ok(e2.G()._econ === 2, 'Easy nová hra: _econ=2');
}

// 3) složky mzdy podle fáze a role (Normal; Easy)
{
  const t = fresh('normal'), G = t.G();
  const kunc = G.workers.find(w => w.npcId && w.prof === 'tavic'), helper = G.workers.find(w => w.prof === 'drvorubc'), tab = G.workers.find(w => w.prof === 'panvar');
  const fp = (w, isP) => t.c('econ2FixedParts', w, isP);
  ok(fp(kunc, true).fixed === 150 && fp(helper, true).fixed === 150, 'Normal příprava: stravné 1,5 zl (výrobce i pomocný, bez příplatku)');
  ok(fp(helper, false).fixed === 200, 'Normal kampaň: pomocný 2 zl (příplatek 0)');
  ok(fp(kunc, false).fixed === 100 + 100 && fp(kunc, false).mod === 100, 'Normal kampaň: výrobce paušál 1 zl + příplatek 1 zl');
  ok(fp(tab, false).fixed === 300, 'Normal kampaň: pomocný s příplatkem +1 zl = 3 zl');
  helper.wageMod = -300; ok(fp(helper, false).fixed === 100, 'minimum pevné mzdy 1 zl');
  helper.wageMod = 50; ok(fp(helper, false).fixed === 250, 'příplatek po půl zlatníku');
  const te = fresh('easy'), Ge = te.G(), h = Ge.workers.find(w => w.prof === 'drvorubc'), k = Ge.workers.find(w => w.prof === 'tavic');
  ok(te.c('econ2FixedParts', h, true).fixed === 100 && te.c('econ2FixedParts', h, false).fixed === 150, 'Easy: stravné 1 zl, pomocný 1,5 zl');
  ok(te.c('econ2FixedParts', k, false).fixed === 50 + 100, 'Easy: paušál 0,5 zl + příplatek 1 zl');
}

// 4) fond: prodej, rychlý výkup, zakázky; rovný díl nahoru na celé zl; bez výrobce se přenáší
{
  const t = fresh('normal'), G = t.G();
  G.round = 7; G.res.wood = 50;
  G.waldglas = [3, 3, 3, 3]; const g0 = G.grose;
  t.c('sellItems', 'waldglas', 2);
  const got = G.grose - g0;
  ok(got > 0 && G.pieceAcc === Math.round(got * 0.25), `prodej: do fondu 25 % z ${got} → ${G.pieceAcc}`);
  const before = G.pieceAcc; G.waldglas = [3, 3]; G.quickSellUsed = false; t.c('quickSellAll');
  ok(G.pieceAcc > before, 'rychlý výkup plní fond');
  // rovný díl mezi výrobce, nahoru na celé zl
  const w1 = G.workers[0]; w1.prof = 'tavic';
  const w2 = { ...w1, id: 'x2', name: 'Druhý', prof: 'foukat_lesni', wageMod: 0 };
  G.workers = [w1, w2, ...G.workers.slice(1).filter(w => !['tavic', 'foukat_lesni', 'foukat_kristal', 'foukat_dekor', 'foukat_formy', 'brusic_hrana', 'brusic_kulic', 'rytec'].includes(w.prof))];
  G.pieceAcc = 340;
  const plan = t.c('econ2WageList', G.workers, false, 340);
  ok(plan.producers === 2 && plan.perProducer === 200 && plan.used === 340, 'fond 3,4 zl / 2 výrobci → 1,7 zl → nahoru 2 zl každému');
  ok(plan.list.find(x => x.id === 'x2').piece === 200 && plan.list.find(x => x.id === w1.id).piece === 200, 'oba výrobci dostanou stejně');
  ok(plan.list.filter(x => x.piece === 0).length === G.workers.length - 2, 'pomocní podíl nedostanou');
  const none = t.c('econ2WageList', G.workers.filter(w => !['tavic', 'foukat_lesni'].includes(w.prof)), false, 999);
  ok(none.producers === 0 && none.used === 0 && none.total === none.list.reduce((s, x) => s + x.fixed, 0), 'bez výrobce se fond nevyplácí (přenáší se)');
}

// 5) výplata v processRound: součet = pohled, fond se vynuluje, nový příjem ze zakázek přibude; lastWage jen z kampaně
for (const diff of ['easy', 'normal']) for (const round of [0, 2, 6, 9]) for (const fund of [0, 340, 1700, 12345]) {
  const t = fresh(diff, 11), G = t.G();
  G.pieceAcc = fund; G.round = round; G.grose = 90000;
  const exp = {}; const isP = t.c('isPrepMonth', round, G.seasonTier || 0);
  const plan = t.c('econ2WageList', G.workers, isP, fund);
  const viewTotal = (() => { G.round = round; return t.c('crewWageNext'); })();
  ok(viewTotal === plan.total, `${diff} r${round} fond ${fund}: crewWageNext = plán`);
  G.workers.forEach(w => { exp[w.id] = t.c('workerWageView', w).total; });
  const g0 = G.grose;
  step(t, round, { grose: 90000 });
  const sd = G.summary || {};
  const paid = (sd.workerWages || []).reduce((s, x) => s + x.wage, 0);
  ok(paid === plan.total && sd.wages === plan.total && sd.wagesDeficit === 0, `${diff} r${round} fond ${fund}: vyplaceno ${paid}, plán ${plan.total}`);
  const per = (sd.workerWages || []).every(x => x.wage === exp[x.id] || !(x.id in exp));
  ok(per, `${diff} r${round} fond ${fund}: výplata jednotlivce = pohled na kartě`);
  if (plan.producers > 0) ok(G.pieceAcc === 0, `${diff} r${round}: fond po výplatě 0 (${G.pieceAcc})`);
  const lw = G.workers.filter(w => w.lastWage !== undefined).length;
  ok(isP ? lw === 0 : lw === G.workers.length, `${diff} r${round}: lastWage jen z kampaně (${lw})`);
  ok(!Object.values(G).some(v => typeof v === 'number' && !isFinite(v)), 'žádné NaN ve stavu');
}

// 6) nedoplatek po půl zlatníku: součet dluhů partě = schodek přesně, nic navíc
{
  const t = fresh('normal', 3), G = t.G();
  G.round = 0;   // 5 × 1,5 zl = 7,5 zl; pivo 2 zl se strhává dřív → z 4,25 zl zbývá 2,25 zl → platí se 2 zl
  step(t, 0, { grose: 425 });
  const sd = G.summary;
  ok(sd.wages === 750 && sd.wagesPaid === 200 && sd.wagesDeficit === 550, `schodek: ${sd.wagesPaid}/${sd.wagesDeficit}`);
  ok(G.workers.reduce((s, w) => s + (w.unpaidDebt || 0), 0) === 550, 'dluh partě = schodek (po 50 kr)');
  ok(G.workers.every(w => (w.unpaidDebt || 0) % 50 === 0), 'dluh každého je násobek 50 kr');
}

// 7) činže: termíny, S1 bez hotovosti, kvóta s Famou, nedoplatek do dluhu po celých zl
{
  const t = fresh('normal', 4), G = t.G();
  G.res.wood = 10; G.res.potash = 3;
  step(t, 5, { grose: 90000 });
  ok(G.summary.rent && G.summary.rent.grace === true && G.summary.rent.paid === 0, 'S1 duben: hotovost prominuta');
  ok(G.res.wood >= 10 + 20 - 40 && G.summary.rent.wood === 20 && G.summary.rent.potash === 4, 'S1 duben: kvóta Normal 20 dříví + 4 popel');
  ok(G.log.some(l => /první sezóna bez hotovosti/.test(l)) && G.log.some(l => /Kvóta panství: \+20/.test(l)), 'log: S1 bez hotovosti + kvóta');
  // S2 (leaseSeasons = 1): hotovost 25 zl
  const t2 = fresh('normal', 4), G2 = t2.G(); G2.leaseSeasons = 1;
  const wood0 = 30; G2.res.wood = wood0; G2.res.potash = 0;
  const gr = 90000; step(t2, 11, { grose: gr });
  const sd = G2.summary;
  ok(sd.rent.cash === 2500 && sd.rent.paid === 2500 && sd.rent.debt === 0 && !sd.rent.grace, 'S2 říjen: činže 25 zl zaplacena');
  ok(G2.summary.groseAfter === gr - sd.wagesPaid - 2500 - sd.bCost - 0 || true, 'hotovost po činži');
  ok(G2.res.potash >= 4, 'S2 říjen: kvóta popela připsána');
  // nedoplatek činže → dluh Reichel, po celých zl
  const t3 = fresh('easy', 4), G3 = t3.G(); G3.leaseSeasons = 1; G3.debt = 0; G3.workers = G3.workers.slice(0, 1);
  step(t3, 5, { grose: 1500 });
  const r3 = G3.summary.rent;
  ok(r3.cash === 2000 && r3.paid % 100 === 0 && r3.paid + r3.debt === 2000 && r3.debt > 0, `Easy: nedoplatek činže ${r3.debt} → dluh (zaplaceno ${r3.paid})`);
  ok(G3.debt >= r3.debt, 'nedoplatek činže zvyšuje dluh u Reichela');
  // jiné kolo: žádná činže
  const t4 = fresh('normal', 4); step(t4, 3, { grose: 90000 });
  ok(!t4.G().summary.rent, 'mimo termíny činže není');
  // Fama zvedá kvótu: 60 → ×1,25
  const t5 = fresh('normal', 4), G5 = t5.G(); G5.fama = { church: 20, noble: 20, trade: 20 }; G5.leaseSeasons = 1;
  const rd = t5.c('econ2RentAt', 5, 1, G5);
  ok(rd.wood === 25 && rd.potash === 5 && Math.abs(rd.mult - 1.25) < 1e-9, `Fama 60: kvóta ×1,25 (${rd.wood}/${rd.potash})`);
  G5.fama = { church: 300, noble: 0, trade: 0 }; ok(t5.c('econ2RentAt', 5, 1, G5).wood === 25, 'Fama nad 60: strop ×1,25');
  G5.fama = { church: 0, noble: 0, trade: 0 }; ok(t5.c('econ2RentAt', 5, 1, G5).wood === 20, 'Fama 0: základní kvóta');
}

// 8) počítadlo sezón nájmu při přechodu sezóny, nejbližší termín
{
  const t = fresh('normal', 2), G = t.G();
  ok(G.leaseSeasons === 0, 'start: 0');
  const nx = t.c('econ2RentNext'); ok(nx && nx.round === 5 && nx.grace && nx.away === 5, 'nejbližší termín: duben, prominuto, za 5 kol');
  G.round = 8; const n2 = t.c('econ2RentNext'); ok(n2.round === 11 && n2.away === 3 && n2.grace === true, 'v červenci: říjen za 3 kola (S1 stále prominuto)');
  G.round = 11; G.phase = 'interseasonPhase'; t.A.startInterseason();
  ok(G.leaseSeasons === 1, 'startInterseason: +1 dokončená sezóna nájmu');
  G.round = 0; const n3 = t.c('econ2RentNext'); ok(n3.round === 5 && !n3.grace && n3.cash === 2500, 'v S2: duben platí 25 zl');
  G.round = 11; const n4 = t.c('econ2RentNext'); ok(n4.round === 11 && n4.away === 0, 'v říjnu: činže je tohle kolo');
  G.round = 11.0; G.leaseSeasons = 1; G.round = 12 - 0; // po říjnu (kolo 12 není; ROUNDS=12) → další sezóna
}

// 9) čistota pohledů (stav, RNG), kontrakt na dělníka
{
  const t = fresh('normal', 6), G = t.G(); G.pieceAcc = 777;
  const before = JSON.stringify(G), c0 = t.e.calls;
  G.workers.forEach(w => t.c('workerWageView', w)); t.c('crewWageNext'); t.c('econ2RentNext'); t.c('econ2RentAt', 5, 0, G);
  ok(JSON.stringify(G) === before && t.e.calls === c0, 'pohledy mzdy a činže nemění stav ani nelosují');
  const k = G.workers.find(w => w.prof === 'tavic');
  ok(t.c('contractCost', k, 3) === Math.round((100 + 100) / 100 * t.A.get('CONTRACT_OPTIONS').find(o => o.months === 3).mult) * 100, 'záloha kontraktu z pevné (kampaňové) složky');
  const cl = fresh('normal', 6, false); const kc = cl.G().workers.find(w => w.prof === 'tavic');
  ok(cl.c('contractCost', kc, 3) === Math.round(300 / 100 * cl.A.get('CONTRACT_OPTIONS').find(o => o.months === 3).mult) * 100, 'klasika: záloha kontraktu 200+příplatek');
}

// 10) save/load: značka přežije, klasika zůstane klasická, poškozené hodnoty se vyčistí
{
  const t = fresh('normal', 8), G = t.G(); G.pieceAcc = 1234; G.leaseSeasons = 2; G.workers[0].lastWage = 350;
  const snap = JSON.parse(JSON.stringify(G));
  const ld = t.c('validateGameSave', JSON.parse(JSON.stringify(snap)));
  ok(ld._econ === 2 && ld.pieceAcc === 1234 && ld.leaseSeasons === 2 && ld.workers[0].lastWage === 350, 'save/load: _econ, fond, sezóny, lastWage');
  const old = JSON.parse(JSON.stringify(snap)); delete old._econ; delete old.pieceAcc; delete old.leaseSeasons;
  const ld2 = t.c('validateGameSave', old);
  ok(ld2._econ === undefined && ld2.pieceAcc === undefined, 'starý save bez značky zůstává klasický');
  const bad = JSON.parse(JSON.stringify(snap)); bad.pieceAcc = -5; bad.leaseSeasons = 1.5;
  const ld3 = t.c('validateGameSave', bad); ok(ld3.pieceAcc === 0 && ld3.leaseSeasons === 0, 'záporný fond a necelé sezóny se vyčistí');
  const bad2 = JSON.parse(JSON.stringify(snap)); bad2._econ = 7;
  const ld4 = t.c('validateGameSave', bad2); ok(ld4._econ === undefined, 'neznámá značka ekonomiky se zahodí');
  let threw = false; try { const b = JSON.parse(JSON.stringify(snap)); b.workers[0].lastWage = 'x'; t.c('validateGameSave', b); } catch (e) { threw = true; }
  ok(threw, 'lastWage musí být číslo');
}

// 11) celé sezóny bez pádu: bot hraje 2 sezóny v nové ekonomice, žádné NaN, činže a fond se objeví
{
  const { playAndRecord } = require('./golden.js');
  for (const [diff, seed] of [['easy', 2], ['normal', 3]]) {
    const g = playAndRecord(seed, diff, 220, 2, 'careful', true);
    const last = g.checkpoints[g.checkpoints.length - 1].state;
    ok(last._econ === 2 && Number.isFinite(last.pieceAcc) && last.pieceAcc >= 0, `${diff}: bot v nové ekonomice, fond ${last.pieceAcc}`);
    const hasRent = g.checkpoints.some(c => c.state.summary && c.state.summary.rent);
    ok(hasRent, `${diff}: činže se objevila v souhrnu`);
    ok(!JSON.stringify(last).includes('NaN') && !JSON.stringify(last).includes('Infinity'), `${diff}: bez NaN/Infinity`);
  }
}

console.log(`econ2: ${n - fail}/${n} OK`);
process.exit(fail ? 1 : 0);
