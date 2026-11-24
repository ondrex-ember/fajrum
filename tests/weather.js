'use strict';
// ECON2 etapa 8a / W1: počasí. Klasická hra nesmí být dotčena (hlídají goldeny).
//   node tests/weather.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };

function fresh(econ, seed) {
  const e = load({ seed: seed || 5 }); const A = e.api;
  apply(e, econ === false ? { t: 'newGame', difficulty: 'normal', huteName: 't' } : { t: 'newGame', difficulty: 'normal', huteName: 't', econ: 2 });
  return { e, A, G: () => A.G, c: (f, ...x) => A.call(f, ...x) };
}
const KIND = (t, s, season, round) => t.c('weatherKindFor', s, season, round);
function seedFor(t, kind, season, round, from) { for (let s = from || 1; s < 5000; s++) if (KIND(t, s, season, round) === kind) return s; throw new Error('no seed ' + kind); }
// jedno kolo: stejný RNG (stejný load seed), jen jiný wSeed; vrací G po processRound
function month(wSeed, round, setup, season) {
  const t = fresh(true, 11), G = t.G();
  G.wSeed = wSeed; G.season = season || 1; G.round = round; G.phase = 'playing'; G.curEvt = null; G.events = [];
  G.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.fat = 0; w.unpaidDebt = 0; });
  G.grose = 900000; G.morale = 80; G.res.wood = 60; G.res.food = 30; G.forest = 40;
  if (setup) setup(G);
  t.A.processRound(); return t.G();
}

const t0 = fresh(true);
// ── nový hra: wSeed ──
{
  const w = t0.G().wSeed;
  ok(Number.isSafeInteger(w) && w >= 0 && w < 4294967296, 'nová hra (ECON2) má wSeed uint32');
  const c = fresh(false);
  ok(c.G().wSeed === undefined && c.G()._econ === undefined, 'klasická hra wSeed nemá');
}
// ── generátor a rozdělení ──
{
  let sum = 0, N = 20000;
  for (let i = 0; i < N; i++) sum += t0.c('wxU', 12345, 1, i, 3, 0);
  ok(Math.abs(sum / N - 0.5) < 0.01, 'wxU má střed 0,5 (' + (sum / N).toFixed(4) + ')');
  ok(t0.c('wxU', 7, 1, 2, 3, 4) === t0.c('wxU', 7, 1, 2, 3, 4), 'wxU je deterministické');
  ok(t0.c('wxU', 7, 1, 2, 3, 4) !== t0.c('wxU', 7, 2, 2, 3, 4), 'sůl mění proud');
  const rng0 = t0.e.calls; for (let i = 0; i < 500; i++) t0.c('weatherKindFor', i, 1 + i % 5, i % 12);
  ok(t0.e.calls === rng0, 'počasí nesahá na Math.random');
}
// ── rozsahy měsíců a průměr extrémních měsíců ──
{
  const W = t0.A.get('ECON2').weather, cnt = { frost: 0, wet: 0, dry: 0, storm: 0, normal: 0 };
  let seasons = 0, extremes = 0, bad = 0, Ns = 3000;
  for (let s = 1; s <= Ns; s++) for (let season = 1; season <= 3; season++) {
    seasons++;
    for (let r = 0; r < 12; r++) {
      const k = KIND(t0, s * 977, season, r); cnt[k]++;
      if (k !== 'normal') { extremes++; if (r < W.kinds[k].from || r > W.kinds[k].to) bad++; }
    }
  }
  const per = extremes / seasons;
  ok(bad === 0, 'druhy jen v povolených měsících');
  ok(per > 2.6 && per < 3.0, 'extrémních měsíců za sezónu ≈2,8 (' + per.toFixed(3) + ')');
  ok(cnt.frost / seasons > 0.95 && cnt.frost / seasons < 1.25, 'mrazů ≈1,1/sezónu (' + (cnt.frost / seasons).toFixed(3) + ')');
  ok(cnt.storm / seasons > 0.2 && cnt.storm / seasons < 0.4, 'bouří ≈0,3/sezónu (' + (cnt.storm / seasons).toFixed(3) + ')');
  for (let r = 0; r < 12; r++) { const s = t0.c('weatherRisk', r).reduce((a, x) => a + x.p, 0); ok(Math.abs(s - 1) < 1e-9, 'riziko měsíce ' + r + ' dává 1'); }
  const rk = t0.c('weatherRisk', 8).map(x => x.kind).join(); ok(rk === 'storm,dry,wet,normal', 'riziko v červenci: ' + rk);
}
// ── klasika: žádné počasí ──
{
  const c = fresh(false); const G = c.G();
  ok(c.c('weatherKind', 1, 1) === 'normal', 'klasika: druh normal');
  const fx = c.c('wxFx', 1, 1);
  ok(fx.logMult === 1.5 && fx.crucible === 1 && fx.priceMult === 1 && fx.fieldMult === 1 && fx.fatigue === 0, 'klasika: wxFx = pevná zimní tabulka');
  const fx3 = c.c('wxFx', 1, 6); ok(fx3.logMult === 1 && fx3.crucible === 0, 'klasika: léto bez bonusu');
}
// ── účinky v processRound ──
const R = 1;      // leden: mráz možný
const kNormal = seedFor(t0, 'normal', 1, R), kFrost = seedFor(t0, 'frost', 1, R);
{
  const a = month(kNormal, R), b = month(kFrost, R);
  ok(a.res.wood - b.res.wood === 4, 'mráz: −4 dříví (' + a.res.wood + ' → ' + b.res.wood + ')');
  ok(a.morale - b.morale === 5, 'mráz: nálada −5 (' + a.morale + ' → ' + b.morale + ')');
  ok(b.log.some(l => l.includes('❄️ Mráz')), 'mráz: řádek v kronice');
  ok(!a.log.some(l => l.includes('Mráz:')), 'normální měsíc: bez řádku počasí');
}
{ // kácení
  const lg = G => { G.workers[1].task = 'logging'; G.workers[1].lv = 1; };
  const kWet = seedFor(t0, 'wet', 1, 5), kNorm5 = seedFor(t0, 'normal', 1, 5);
  const cut = (G0, G1) => G0.forest - G1.forest;
  const base = month(kNormal, R, lg), frost = month(kFrost, R, lg);
  const nw = month(kNorm5, 5, lg), wet = month(kWet, 5, lg);
  const c0 = 40 - base.forest, c1 = 40 - frost.forest, c2 = 40 - nw.forest, c3 = 40 - wet.forest;
  ok(c1 > c0 && c1 >= 1, 'mráz: víc pokácených parcel (' + c0 + ' → ' + c1 + ')');
  ok(c3 < c2, 'mokro: méně pokácených parcel (' + c2 + ' → ' + c3 + ')');
  ok(frost.log.some(l => /🌲.*❄️\+50%/.test(l)), 'mráz: poznámka v řádku kácení');
  ok(wet.log.some(l => /🌲.*🌧️−30%/.test(l)), 'mokro: poznámka v řádku kácení');
}
{ // pánve +1★ v mrazu (stejný RNG → rozdíl přesně 1, pokud nepřeteče strop 5)
  const pv = G => { G.workers.forEach(w => { if (w.task === 'idle') return; }); G.workers[3].task = 'panev'; G.workers[3].lv = 1; G.res.shamot = 20; G.res.clay = 20; G.res.food = 40; };
  const a = month(kNormal, R, pv), b = month(kFrost, R, pv);
  const qa = a.pAging.map(x => x.q), qb = b.pAging.map(x => x.q);
  ok(qa.length > 0 && qa.length === qb.length, 'pánve: obě větve vyrobily pánev (' + qa + ' / ' + qb + ')');
  ok(qa.length > 0 && qa.every((q, i) => qb[i] === Math.min(5, q + 1)), 'mráz: nové pánve +1★ (' + qa + ' → ' + qb + ')');
}
{ // sucho: políčko ×0,6, únava +0,05
  const kDry = seedFor(t0, 'dry', 1, 7), kNorm7 = seedFor(t0, 'normal', 1, 7);
  const fd = G => { G.workers[0].task = 'field'; G.workers[1].task = 'logging'; };
  const a = month(kNorm7, 7, fd), b = month(kDry, 7, fd);
  ok(a.res.food - b.res.food === 1, 'sucho: políčko dá o 1 méně (2 → 1) (' + a.res.food + ' → ' + b.res.food + ')');
  const fa = a.workers[1].fat, fb = b.workers[1].fat;
  ok(Math.abs((fb - fa) - 0.05) < 1e-9, 'sucho: únava +0,05 (' + fa + ' → ' + fb + ')');
  ok(Math.abs(a.workers[0].fat - a.workers[0].fat) < 1e-9 && b.log.some(l => l.includes('☀️ Sucho')), 'sucho: řádek v kronice');
}
{ // bouře: jen zpráva
  const kSt = seedFor(t0, 'storm', 1, 8), kN8 = seedFor(t0, 'normal', 1, 8);
  const a = month(kN8, 8), b = month(kSt, 8);
  ok(a.res.wood === b.res.wood && a.morale === b.morale, 'bouře: bez mechanického vlivu');
  ok(b.log.some(l => l.includes('⛈️ Bouře')), 'bouře: zpráva v kronice');
}
// ── ceny: mokro −10 % (trh i rychlý výkup) ──
{
  const t = fresh(true), G = t.G(); G.waldglas = [3, 3, 3, 3]; G.mBonus = false; G.round = 5; G.season = 1;
  G.wSeed = seedFor(t, 'normal', 1, 5); const q0 = t.c('marketSaleQuote', 'waldglas', 4), s0 = t.c('quickSellQuote');
  G.wSeed = seedFor(t, 'wet', 1, 5); const q1 = t.c('marketSaleQuote', 'waldglas', 4), s1 = t.c('quickSellQuote');
  ok(Math.abs(q1.multiplier / q0.multiplier - 0.9) < 1e-9 && q1.total < q0.total, 'mokro: prodejní cena ×0,9 (' + q0.total + ' → ' + q1.total + ')');
  ok(s1.total < s0.total && s1.ratePct < s0.ratePct, 'mokro: rychlý výkup také (' + s0.ratePct + ' % → ' + s1.ratePct + ' %)');
  const sold = (G.waldglas = [3, 3, 3, 3], G.grose = 0, t.c('sellItems', 'waldglas', 4), G.grose);
  ok(sold === q1.total, 'prodej platí cenu z nabídky (' + sold + ')');
}
// ── doznívající následky (G.fate.fx) ──
{
  const t = fresh(true), G = t.G(); G.wSeed = seedFor(t, 'frost', 1, 1); G.season = 2; G.round = 1;
  G.wSeed = seedFor(t, 'frost', 2, 1);
  const abs = 2 * 12 + 1;
  G.fate = { fx: [{ k: 'logMult', v: 0.7, from: abs, to: abs + 2 }, { k: 'priceMult', v: 0.92, from: abs, to: abs }, { k: 'fatigue', v: 0.1, from: abs, to: abs }, { k: 'frostMorale', v: 2, from: abs, to: abs }, { k: 'marketClosed', v: true, from: abs + 1, to: abs + 1 }] };
  let f = t.c('wxFx', 2, 1);
  ok(Math.abs(f.logMult - 1.05) < 1e-9 && Math.abs(f.priceMult - 0.92) < 1e-9 && Math.abs(f.fatigue - 0.1) < 1e-9 && f.morale === 2 && !f.marketClosed, 'následky: násobení, součet, přepis mrazu');
  G.round = 2; f = t.c('wxFx', 2, 2);
  ok(f.marketClosed === true && f.priceMult !== 0.92, 'následky: platí jen v rozsahu měsíců');
  G.fate.fx = [{ k: 'logMult', v: 0.5, from: 13, to: 13 }];
  const base = (G.fate = { fx: [] }, t.c('wxFx', 1, 1).logMult), s1 = (G.fate.fx = [{ k: 'logMult', v: 0.5, from: 13, to: 13 }], t.c('wxFx', 1, 1).logMult);
  ok(Math.abs(s1 - base * 0.5) < 1e-9, 'následky: efekt platí v cílovém měsíci (S1 kolo 1)');
  G.fate.fx = []; const b2 = t.c('wxFx', 2, 1).logMult; G.fate.fx = [{ k: 'logMult', v: 0.5, from: 13, to: 13 }];
  ok(t.c('wxFx', 2, 1).logMult === b2, 'následky: efekt S1 nezasáhne stejný měsíc S2');
}
// ── save ──
{
  const t = fresh(true), G = t.G(); const w0 = G.wSeed;
  const sv = JSON.parse(JSON.stringify(G));
  ok(t.c('validateGameSave', sv).wSeed === w0, 'save: wSeed projde beze změny');
  const s2 = JSON.parse(JSON.stringify(G)); delete s2.wSeed; const m2 = t.c('validateGameSave', s2);
  ok(Number.isSafeInteger(m2.wSeed) && m2.wSeed >= 0 && m2.wSeed < 4294967296, 'save: chybějící wSeed se doplní');
  const s3 = JSON.parse(JSON.stringify(G)); s3.wSeed = 'x'; ok(Number.isSafeInteger(t.c('validateGameSave', s3).wSeed), 'save: špatný wSeed se opraví');
  const c = fresh(false), sc = JSON.parse(JSON.stringify(c.G())); sc.wSeed = 5; sc.fate = { fx: [] };
  const mc = c.c('validateGameSave', sc); ok(mc.wSeed === undefined && mc.fate === undefined, 'save: klasika wSeed ani fate nenese');
}
console.log(fail ? `FAILED ${fail}/${n}` : `weather: ${n}/${n} OK`);
process.exit(fail ? 1 : 0);
