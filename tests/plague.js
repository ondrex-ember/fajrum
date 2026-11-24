'use strict';
// ECON2 etapa 8b / W3: mor a zákaz plavby po Labi. Klasická hra nesmí být dotčena (hlídají goldeny).
//   node tests/plague.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };

function fresh(diff, seed) {
  const e = load({ seed: seed || 5 }); const A = e.api;
  apply(e, { t: 'newGame', difficulty: diff || 'normal', huteName: 't', econ: 2 });
  return { e, A, G: () => A.G, c: (f, ...x) => A.call(f, ...x) };
}
function prep(t, season, round) {
  const G = t.G(); G.season = season; G.round = round; G.phase = 'playing'; G.curEvt = null; G.events = []; G.summary = null;
  G.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.fat = 0; w.unpaidDebt = 0; });
  G.grose = 900000; G.morale = 80; G.res.wood = 100; G.res.food = 50; G.fate.pending = null; G.fate.fx = []; G.fate.done = 0; G.fate.plague = null; G.fate.plagueSeason = 0; G.contracts = []; G.mBonus = false;
  return G;
}
const pend = (t, kind, season, round) => { t.G().fate.pending = { kind, season, round }; };
const seedWhere = (f) => { for (let s = 1; s < 60000; s++) if (f(s)) return s; throw new Error('no seed'); };
const hof = (id, reward) => ({ id, item: 'crystal', qty: 1, reward, due: 10, buyer: 'Hoffmann', minQ: 4, cs: 'H', en: 'H' });
const wei = (id, reward) => ({ id, item: 'waldglas', qty: 1, reward, due: 10, buyer: 'Weiss', minQ: 1, cs: 'W', en: 'W' });

const t0 = fresh('normal');
// ── Labe: způsobilost ──
{
  const G = prep(t0, 2, 6);
  let found = false, wrongNoContract = false;
  for (let s = 1; s < 4000; s++) {
    G.wSeed = s; if (t0.c('weatherKind', 2, 6) === 'frost' || t0.c('weatherKind', 2, 6) === 'dry' || t0.c('weatherKind', 2, 6) === 'storm') continue;
    G.contracts = []; if (t0.c('fateKindFor', 2, 6) === 'elbe') wrongNoContract = true;
    G.contracts = [hof('h1', 10400)]; if (t0.c('fateKindFor', 2, 6) === 'elbe') found = true;
  }
  ok(found, 's otevřenou zakázkou Hoffmann se Labe objeví');
  ok(!wrongNoContract, 'bez zakázky Hoffmann se Labe nikdy nevybere');
  G.wSeed = seedWhere(s => { G.wSeed = s; const k = t0.c('weatherKind', 2, 4); return k !== 'frost' && k !== 'dry' && k !== 'storm'; }); G.contracts = [hof('h1', 10400)];
  let early = false; for (let s = 1; s < 3000; s++) { G.wSeed = s; if (!['normal', 'wet'].includes(t0.c('weatherKind', 2, 4))) continue; if (t0.c('fateKindFor', 2, 4) === 'elbe') early = true; }
  ok(!early, 'Labe až od kola 5');
  G.contracts = [{ ...hof('adv_x', 5000), buyer: 'Hoffmann', adv: { paid: 100, price: 5000 } }]; let advOnly = false; G.round = 6; for (let s = 1; s < 3000; s++) { G.wSeed = s; if (['normal', 'wet'].includes(t0.c('weatherKind', 2, 6)) && t0.c('fateKindFor', 2, 6) === 'elbe') advOnly = true; }
  ok(!advOnly, 'zakázka se zálohou (Reichel) Labe nespouští');
}
// ── Labe: volby ──
{
  const t = fresh('normal'); let G = prep(t, 2, 6);
  G.contracts = [hof('h1', 10400), hof('h2', 5200), wei('w1', 3500), { ...hof('adv_z', 4000), buyer: 'Reichel', adv: { paid: 2000, price: 4000 } }];
  pend(t, 'elbe', 2, 6); const v = t.c('fatePendingView'), o = id => v.options.find(x => x.id === id);
  ok(v.options.length === 3 && o('permit').cost.zl === 1600 && o('land').ok && o('smuggle').risk.p === 0.35, 'Labe: 3 volby, povolení 16 zl, šance 35 %');
  ok(/2×/.test(o('land').extra.text), 'Labe: náhled ukazuje 2 dotčené zakázky');
  t.c('fateChoose', 'permit'); ok(G.grose === 900000 - 1600 && G.contracts[0].reward === 10400 && G.contracts[1].reward === 5200, 'Povolení: −16 zl, odměny beze změny');
  prep(t, 2, 6); G.contracts = [hof('h1', 10400), hof('h2', 5200), wei('w1', 3500), { ...hof('adv_z', 4000), buyer: 'Reichel', adv: { paid: 2000, price: 4000 } }]; pend(t, 'elbe', 2, 6);
  t.c('fateChoose', 'land'); ok(G.contracts[0].reward === 8300 && G.contracts[1].reward === 4200, 'Po souši: Hoffmann −20 % na celé zl (10400 → 8300, 5200 → 4200)');
  ok(G.contracts[2].reward === 3500 && G.contracts[3].reward === 4000, 'Weiss a záloha beze změny');
  ok(G.contracts.every(c => c.reward % 100 === 0), 'odměny zůstávají v celých zlatých');
  const sHit = seedWhere(s => t.c('wxU', s, 4, 2, 6, 0) < 0.35), sSafe = seedWhere(s => t.c('wxU', s, 4, 2, 6, 0) >= 0.35);
  prep(t, 2, 6); G.wSeed = sHit; G.contracts = [hof('h1', 10400)]; pend(t, 'elbe', 2, 6); t.c('fateChoose', 'smuggle'); ok(G.grose === 900000 - 2200 && G.contracts[0].reward === 8300 && G.fate.hist[G.fate.hist.length - 1].hit === true, 'Propašovat (chycen): −22 zl, odměny −20 %');
  prep(t, 2, 6); G.wSeed = sSafe; G.contracts = [hof('h1', 10400)]; pend(t, 'elbe', 2, 6); t.c('fateChoose', 'smuggle'); ok(G.grose === 900000 && G.contracts[0].reward === 10400 && G.fate.hist[G.fate.hist.length - 1].hit === false, 'Propašovat (prošlo): beze změny');
  prep(t, 2, 6); G.contracts = [hof('h1', 10400)]; pend(t, 'elbe', 2, 6); G.grose = 100;
  const v2 = t.c('fatePendingView'); ok(!v2.options.find(x => x.id === 'permit').ok && v2.options.find(x => x.id === 'land').ok, 'bez peněz: povolení zašedlé, po souši jde');
  // doručení po přepsání = nová odměna
  const te = fresh('normal'); const Ge = prep(te, 2, 6); Ge.contracts = [hof('h1', 10400)]; pend(te, 'elbe', 2, 6); te.c('fateChoose', 'land');
  ok(te.c('contractReward', Ge.contracts[0]) === 8300, 'contractReward čte přepsaný stav');
}
// ── Mor z vojska ──
{
  const t = fresh('normal'); let G = prep(t, 2, 6);
  const sR = seedWhere(s => t.c('wxU', s, 7, 2, 6, 0) < 0.4), sN = seedWhere(s => t.c('wxU', s, 7, 2, 6, 0) >= 0.4);
  G.wSeed = sR; pend(t, 'army', 2, 6); t.c('fateChoose', 'tribute');
  const pl = G.fate.plague, d = pl && pl.round - 6;
  ok(pl && pl.season === 2 && d >= 1 && d <= 3 && pl.src === 'army' && G.fate.plagueSeason === 2, 'vojsko: mor naplánován za 1–3 měsíce (' + JSON.stringify(pl) + ')');
  ok(G.log.some(l => l.includes('📣')), 'vojsko: zvěst v kronice');
  prep(t, 2, 6); G.log = []; G.wSeed = sN; pend(t, 'army', 2, 6); t.c('fateChoose', 'tribute'); ok(G.fate.plague === null && !G.log.some(l => l.includes('📣')), 'vojsko: bez zvěsti, když los ≥ 40 %');
  // nejpozději kolo 11
  const sLate = seedWhere(s => t.c('wxU', s, 7, 2, 9, 0) < 0.4 && t.c('wxU', s, 7, 2, 9, 1) >= 0.7);
  prep(t, 2, 9); G.wSeed = sLate; pend(t, 'army', 2, 9); t.c('fateChoose', 'tribute'); ok(G.fate.plague && G.fate.plague.round === 11, 'mor nejpozději v kole 11 (kolo 9 + 3 → 11)');
  // max. jeden za sezónu
  prep(t, 2, 6); G.wSeed = sR; G.fate.plagueSeason = 2; pend(t, 'army', 2, 6); t.c('fateChoose', 'tribute'); ok(G.fate.plague === null, 'druhý mor v téže sezóně se nenaplánuje');
}
// ── Mor z horka ──
{
  const t = fresh('normal'); let G = prep(t, 2, 6);
  const hot = (s, r) => { const k = t.c('weatherKindFor', s, 2, r); return k === 'dry' || k === 'storm'; };
  const second = s => { let c = 0; for (let r = 6; r <= 10; r++) if (hot(s, r)) { c++; if (c === 2) return r; } return -1; };
  const sGo = seedWhere(s => second(s) > 0 && t.c('wxU', s, 6, 2, second(s), 0) < 0.3), sNo = seedWhere(s => second(s) > 0 && t.c('wxU', s, 6, 2, second(s), 0) >= 0.3), sOne = seedWhere(s => { let c = 0; for (let r = 6; r <= 10; r++) if (hot(s, r)) c++; return c === 1; });
  const run = (s, until) => { G.wSeed = s; G.fate.done = 2; G.fate.pending = null; G.fate.plague = null; G.fate.plagueSeason = 0; const out = []; for (let r = 5; r <= until; r++) { G.round = r; t.c('fateOnRound'); out.push(G.fate.pending ? G.fate.pending.kind : null); if (G.fate.pending) G.fate.pending = null; } return out; };
  const r2 = second(sGo); const a = run(sGo, 11);
  ok(a[r2 - 5] === 'plague' && a.filter(x => x === 'plague').length === 1, 'horko: mor v druhém horkém měsíci (kolo ' + r2 + ') jen jednou');
  ok(run(sNo, 11).every(x => x === null), 'horko: los ≥ 30 % → bez moru');
  ok(run(sOne, 11).every(x => x === null), 'horko: jediný horký měsíc nestačí');
  // v sezóně 1 žádný
  G.season = 1; G.wSeed = sGo; G.fate.done = 0; G.fate.plagueSeason = 0; G.round = r2; t.c('fateOnRound'); ok(G.fate.pending === null, 'S1: žádný mor');
  G.season = 2;
  // četnost
  let seasons = 0, plagues = 0;
  for (let s = 1; s <= 4000; s++) { G.wSeed = s * 31; for (const season of [2, 3, 4]) { G.season = season; seasons++; G.fate.plagueSeason = 0; G.fate.plague = null; G.fate.pending = null; G.fate.done = season;
    for (let r = 6; r <= 10; r++) { G.round = r; t.c('fateOnRound'); if (G.fate.pending && G.fate.pending.kind === 'plague') { plagues++; break; } } } }
  const rate = plagues / seasons; ok(rate > 0.03 && rate < 0.15, 'mor z horka v ' + (rate * 100).toFixed(1) + ' % sezón');
  console.log('  (informativně) mor z horka v ' + (rate * 100).toFixed(1) + ' % sezón S2–S4');
}
// ── mor: rozhodnutí a uzavření trhu ──
{
  const t = fresh('normal'); let G = prep(t, 2, 6);
  G.waldglas = [3, 3, 2]; G.crystal = [4, 4]; pend(t, 'plague', 2, 6);
  const v = t.c('fatePendingView'); ok(v.options.length === 2 && v.options.every(o => o.ok), 'mor: 2 volby (Zdravotní lístky vypuštěny)');
  t.c('fateChoose', 'wait'); ok(G.morale === 77, 'Počkat: nálada −3');
  ok(t.c('marketClosedNow', 6) && t.c('marketClosedNow') === true, 'trh zavřený v měsíci události');
  ok(t.c('marketClosedNow', 7), 'trh zavřený i příští měsíc');
  ok(!t.c('marketClosedNow', 8) && !t.c('marketClosedNow', 5), 'trh otevřený před a po (kolo 5 a 8)');
  ok(G.fate.fx.length === 1 && G.fate.fx[0].k === 'marketClosed' && G.fate.fx[0].to - G.fate.fx[0].from === 1, 'fx marketClosed na 2 měsíce');
  const wd = G.waldglas.length, g0 = G.grose; t.c('sellItems', 'waldglas', 3); ok(G.waldglas.length === wd && G.grose === g0 && G.log.some(l => l.includes('⛔') && l.includes('Mor')), 'prodej je blokován a zapsán');
  const qs = G.quickSellUsed; t.c('quickSellAll'); ok(G.quickSellUsed === qs && G.grose === g0, 'rychlý výkup u Weisse blokován');
  G.round = 7; t.c('sellItems', 'waldglas', 3); ok(G.waldglas.length === wd, 'blokace platí i příští měsíc');
  G.round = 8; t.c('sellItems', 'waldglas', 3); ok(G.waldglas.length === 0, 'po 2 měsících se zase prodává');
  // jarmark v době moru: nelze prodat
  const tf = fresh('normal'); const Gf = prep(tf, 2, 7); Gf.waldglas = [3, 3]; Gf.fate.fx = [{ k: 'marketClosed', v: true, from: 2 * 12 + 7, to: 2 * 12 + 8 }]; Gf.round = 8;
  tf.c('sellItems', 'waldglas', 2); ok(Gf.waldglas.length === 2, 'jarmark (kolo 8) za moru: prodej blokován');
  // prodat zásoby
  const ts = fresh('normal'); let Gs = prep(ts, 2, 6); Gs.waldglas = [3, 3, 2]; Gs.crystal = [4, 4]; pend(ts, 'plague', 2, 6);
  const dd = ts.c('fateDumpTotal', ts.A.get('FATE').kinds.plague.opts[0]); ok(Math.abs(dd.rate - 0.8) < 1e-9 && dd.n === 5, 'Prodat zásoby: 80 % (5 ks)');
  const z0 = Gs.grose; ts.c('fateChoose', 'sell');
  ok(Gs.waldglas.length === 0 && Gs.crystal.length === 0 && Gs.grose === z0 + dd.total && Gs.morale === 77 && ts.c('marketClosedNow'), 'Prodat zásoby: sklad pryč, +zl, nálada −3, trh zavřen');
  const te = fresh('easy'); prep(te, 2, 6); te.G().waldglas = [3]; ok(Math.abs(te.c('fateDumpTotal', te.A.get('FATE').kinds.plague.opts[0]).rate - 0.8) < 1e-9, 'Easy bonus se na mor nevztahuje (80 %)');
  const tn = fresh('normal'); const Gn = prep(tn, 2, 6); Gn.waldglas = []; Gn.crystal = []; pend(tn, 'plague', 2, 6);
  const vn = tn.c('fatePendingView'); ok(!vn.options.find(o => o.id === 'sell').ok && vn.options.find(o => o.id === 'wait').ok, 'bez zásob: Prodat zašedlé, Počkat jde');
  // kalendářní zavřený trh se nehlásí jako mor
  ok(!t.c('marketPlagueClosed', 0) && t.c('marketClosedNow', 0), 'kalendářní zavření (leden) není mor');
}
// ── druhá událost a pořadí ──
{
  const t = fresh('normal'); let G = prep(t, 2, 5);
  const s5 = seedWhere(s => { G.wSeed = s; return t.c('fateMonth', 2) === 5 && !['frost', 'dry', 'storm'].includes(t.c('weatherKind', 2, 5)); });
  G.wSeed = s5; G.fate.plague = { season: 2, round: 5, src: 'army' }; G.fate.plagueSeason = 2; G.round = 5; t.c('fateOnRound');
  ok(G.fate.pending && G.fate.pending.kind !== 'plague' && G.fate.plague, 've stejném měsíci má přednost běžná událost, mor čeká');
  t.c('fateChoose', t.c('fatePendingView').options.find(o => o.ok).id); G.round = 6; t.c('fateOnRound');
  ok(G.fate.pending && G.fate.pending.kind === 'plague' && G.fate.plague === null, 'další měsíc přijde mor (druhá událost sezóny)');
  t.c('fateChoose', 'wait'); ok(G.fate.hist.length === 2 && G.fate.hist[1].kind === 'plague', 'obě události v historii');
  // nespuštěný mor z minulé sezóny propadá
  G.fate.plague = { season: 2, round: 11, src: 'army' }; G.season = 3; G.round = 0; t.c('fateOnRound'); ok(G.fate.plague === null, 'mor z minulé sezóny propadne');
}
// ── gate a save ──
{
  const t = fresh('normal'); const G = prep(t, 2, 6); pend(t, 'plague', 2, 6); G.phase = 'playing'; t.A.processRound(); ok(G.round === 6 && t.G().round === 6, 'mor blokuje další měsíc, dokud se nerozhodne');
  G.fate.plague = { season: 2, round: 8, src: 'heat' }; G.fate.plagueSeason = 2;
  const m = t.c('validateGameSave', JSON.parse(JSON.stringify(G))); ok(m.fate.plague && m.fate.plague.round === 8 && m.fate.plagueSeason === 2 && m.fate.pending.kind === 'plague', 'save: naplánovaný mor a čekající mor přežijí');
  const bad = JSON.parse(JSON.stringify(G)); bad.fate.plague = { season: 'x', round: 99 }; bad.fate.plagueSeason = -3; const mb = t.c('validateGameSave', bad);
  ok(mb.fate.plague === null && mb.fate.plagueSeason === 0, 'save: špatný mor se vyčistí');
  const rng = t.e.calls; t.c('fateOnRound'); t.c('marketClosedNow'); ok(t.e.calls === rng, 'mor a Labe nesahají na Math.random');
}
console.log(fail ? `FAILED ${fail}/${n}` : `plague: ${n}/${n} OK`);
process.exit(fail ? 1 : 0);
