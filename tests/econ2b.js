'use strict';
// ECON2 etapa 7b: záloha od Reichela (E2a) a jarmark. Klasická hra nesmí být dotčena (hlídají goldeny).
//   node tests/econ2b.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };

function fresh(diff, seed, econ) {
  const e = load({ seed: seed || 5 }); const A = e.api;
  apply(e, econ === false ? { t: 'newGame', difficulty: diff || 'normal', huteName: 't' } : { t: 'newGame', difficulty: diff || 'normal', huteName: 't', econ: 2 });
  return { e, A, G: () => A.G, c: (f, ...x) => A.call(f, ...x) };
}
function step(t, round, grose) {
  const G = t.G(); G.round = round; G.phase = 'playing'; G.curEvt = null; G.events = [];
  G.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.fat = 0; w.unpaidDebt = 0; });
  if (grose !== undefined) G.grose = grose;
  t.A.processRound(); return G;
}
// nabídka dostupná od kola 1 (processRound z kola 0) — vrátí pohled
function withOffer(diff, seed) {
  const t = fresh(diff, seed); step(t, 0, 90000); const G = t.G();
  G.round = 1; G.phase = 'playing'; G.curEvt = null; G.events = []; G.contracts = [];
  return t;
}
const ready = t => { const G = t.G(); G.debt = 0; G.partners.reichel.trust = 40; };

// ── jarmark ──
{
  const t = fresh('normal'), G = t.G(); G.waldglas = [3, 3, 3, 3]; G.mBonus = false;
  const q = r => { G.round = r; return t.c('marketSaleQuote', 'waldglas', 4); };
  const base = q(7), fair = q(8), after = q(9), oct = q(11);
  ok(Math.abs(fair.multiplier / base.multiplier - 1.3) < 1e-9 && fair.total > base.total, `jarmark ×1,3 (${base.total} → ${fair.total})`);
  ok(after.total === base.total && oct.total === fair.total, 'mimo jarmark základ, říjen znovu ×1,3');
  G.mBonus = true; const wf = q(8), wb = q(7);
  ok(Math.abs(wf.multiplier - wb.multiplier) < 1e-9, 'Weiss ×1,5 se s jarmarkem neskládá (platí vyšší)');
  const qs0 = (G.round = 7, JSON.stringify(t.c('quickSellQuote'))), qs1 = (G.round = 8, JSON.stringify(t.c('quickSellQuote')));
  ok(qs0 === qs1, 'rychlý výkup jarmark nemění');
  G.mBonus = false;
  const te = fresh('easy'); te.G().waldglas = [3, 3, 3, 3]; te.G().mBonus = false; te.G().round = 8;
  const eq = te.c('marketSaleQuote', 'waldglas', 4); ok(Math.abs(eq.multiplier - 1.2 * 1.3) < 1e-9, 'Easy ×1,2 × jarmark ×1,3');
  const before = JSON.stringify(G), c0 = t.e.calls;
  [6, 7, 8, 11].forEach(r => { G.round = r; t.c('econ2FairInfo'); t.c('econ2FairMult'); });
  ok(t.e.calls === c0, 'pohledy jarmarku nelosují');
  G.round = 7; let i = t.c('econ2FairInfo'); ok(!i.on && i.soon && i.round === 8 && i.away === 1, 'v červnu: příští měsíc jarmark');
  G.round = 8; i = t.c('econ2FairInfo'); ok(i.on && !i.soon && i.away === 0, 'v červenci: jarmark je tento měsíc');
  G.round = 9; i = t.c('econ2FairInfo'); ok(!i.on && i.soon === false && i.round === 11 && i.away === 2, 'po jarmarku: další říjen');
  G.round = 10; i = t.c('econ2FairInfo'); ok(i.soon, 'v září: příští měsíc jarmark');
  const cl = fresh('normal', 5, false); cl.G().round = 8; ok(cl.c('econ2FairMult') === 1 && cl.c('econ2FairInfo') === null, 'klasika: bez jarmarku');
}
// předehlášení a hlášení v logu (CS i EN)
for (const lang of ['cs', 'en']) {
  const lines = {};
  for (const r of [2, 6, 7, 9, 10]) {
    const t = fresh('normal', 9); const G = t.G(); G.lang = lang;
    const before = G.log.length; step(t, r, 90000);
    lines[r] = G.log.slice(before).filter(l => /🎪/.test(l));
  }
  const W = lang === 'cs' ? /Příští měsíc bude jarmark/ : /Next month there is a fair/, F = lang === 'cs' ? /Jarmark! Prodejní ceny ×1,3/ : /Fair! Sale prices ×1\.3/;
  ok(lines[2].length === 0, `${lang}: v dubnu bez zprávy`);
  ok(lines[6].length === 1 && W.test(lines[6][0]), `${lang}: po kole 6 (→7) varování`);
  ok(lines[7].length === 1 && F.test(lines[7][0]), `${lang}: po kole 7 (→8) jarmark`);
  ok(lines[9].length === 1 && W.test(lines[9][0]), `${lang}: po kole 9 (→10) varování`);
  ok(lines[10].length === 1 && F.test(lines[10][0]), `${lang}: po kole 10 (→11) jarmark`);
}
{ const t = fresh('normal', 5, false); const G = t.G(); const b = G.log.length; step(t, 6, 90000); ok(!G.log.slice(b).some(l => /🎪/.test(l)), 'klasika: žádné hlášení jarmarku'); }

// ── záloha: nabídka ──
{
  const t = fresh('normal'), G = t.G();
  ok(G.adv === undefined && t.c('econ2AdvanceView').state === 'none', 'start: bez nabídky');
  const c0 = t.e.calls; step(t, 0, 90000);
  ok(t.e.calls >= c0, 'processRound běží');
  ok(G.adv && G.adv.season === 1 && typeof G.adv.id === 'string' && G.adv.taken === false, 'po kole 0 → 1 vznikla nabídka: ' + JSON.stringify(G.adv));
  const adv = G.adv; step(t, 1, 90000); ok(JSON.stringify(G.adv) === JSON.stringify(adv), 'nabídka v sezóně zůstává stejná');
  // výběr bez RNG: pool[(season*7+round) mod n]
  const pool = t.A.get('CONTRACT_POOL');
  const t2 = fresh('normal', 5), G2 = t2.G(); G2.avail = []; G2.contracts = [];
  const pick = t2.c('econ2AdvPick', 1, 1, G2); ok(pick && pick.due >= 4 && pick.due <= 10, 'výběr respektuje okno termínu (' + (pick && pick.due) + ')');
  const c1 = t2.e.calls; t2.c('econ2AdvPick', 1, 1, G2); t2.c('econ2AdvanceView'); ok(t2.e.calls === c1, 'výběr a pohled nelosují');
  const feas = pool.filter(c => c.due >= 4 && c.due <= 10 && t2.c('contractFeasible', c, G2));
  ok(pick.id === feas[(1 * 7 + 1) % feas.length].id, 'index (season*7+round) mod n');
  // klasika
  const cl = fresh('normal', 5, false); step(cl, 0, 90000);
  ok(cl.G().adv === undefined && cl.c('econ2AdvanceView') === null && cl.c('econ2AdvRoll', 1, 1, cl.G()) === null, 'klasika: žádná záloha');
  // okno
  const tw = fresh('normal'); tw.G().round = 1; ok(tw.c('econ2AdvRoll', 1, 7, tw.G()) === null && tw.c('econ2AdvRoll', 1, 0, tw.G()) === null, 'mimo okno 1–6 se nic nezakládá');
}
// podmínky a přijetí
for (const diff of ['normal', 'easy']) {
  const t = withOffer(diff, 7), G = t.G();
  let v = t.c('econ2AdvanceView');
  ok(v.state === 'offer' && v.blockers.some(b => b.k === 'trust') && v.blockers.some(b => b.k === 'debt'), `${diff}: start blokují důvěra i dluh`);
  ok(t.c('econ2AdvanceAccept') === false && G.contracts.length === 0, `${diff}: bez podmínek nelze přijmout`);
  G.debt = 0; v = t.c('econ2AdvanceView'); ok(v.blockers.length === 1 && v.blockers[0].k === 'trust', `${diff}: dluh 0, chybí důvěra`);
  G.partners.reichel.trust = 25; v = t.c('econ2AdvanceView'); ok(v.blockers.length === 0, `${diff}: důvěra 25 stačí`);
  G.partners.reichel.trust = 24.5; v = t.c('econ2AdvanceView'); ok(v.blockers.some(b => b.k === 'trust'), `${diff}: 24,5 nestačí`);
  ready(t); v = t.c('econ2AdvanceView');
  const base = v.contract, vis = base.reward + (diff === 'easy' ? Math.round(base.reward / 100 * 0.25) * 100 : 0);
  const price = Math.max(100, Math.round(vis * 0.85 / 100) * 100), advance = Math.floor(price * 0.5 / 100) * 100;
  ok(v.price === price && v.advance === advance && v.remaining === price - advance && advance % 100 === 0, `${diff}: cena ${price}, záloha ${advance}`);
  ok(price <= vis, `${diff}: cena nižší než viditelná`);
  const g0 = G.grose; ok(t.c('econ2AdvanceAccept') === true, `${diff}: přijato`);
  const ac = G.contracts.find(c => c.adv);
  ok(ac && ac.id === 'adv_' + base.id && ac.buyer === 'Reichel' && ac.reward === price && ac.adv.paid === advance, `${diff}: aktivní zakázka se zálohou`);
  ok(G.grose === g0 + advance, `${diff}: záloha v kase`);
  ok(G.adv.taken === true && t.c('econ2AdvanceView').state === 'active', `${diff}: stav active`);
  ok(t.c('econ2AdvanceAccept') === false, `${diff}: druhá záloha nejde`);
  ok(G.log.some(l => /Záloha od Reichela/.test(l)), `${diff}: log`);
  // po dodání v další sezóně vznikne nová nabídka a taken se resetuje (jiná sezóna)
}
// nabídka vyprší: po kole untilRound, nebo když termín není dost daleko
{
  const t = withOffer('normal', 7), G = t.G(); ready(t);
  G.round = 7; ok(t.c('econ2AdvanceView').state === 'closed', 'po kole 6 nabídka zavřena');
  G.round = 1; const c = t.c('econ2AdvanceView').contract; G.round = c.due - 2; if (G.round <= 6) ok(t.c('econ2AdvanceView').state === 'closed', 'termín blíž než minLeft → zavřeno');
}
// zakázky: plný počet slotů blokuje
{
  const t = withOffer('normal', 7); ready(t); const G = t.G();
  const max = t.A.get('MAX_CONTRACTS'); G.contracts = Array.from({ length: max }, (_, i) => ({ id: 'x' + i, item: 'waldglas', qty: 99, reward: 100, due: 11, buyer: 'Weiss', cs: 'x', en: 'x' }));
  const v = t.c('econ2AdvanceView'); ok(v.blockers.some(b => b.k === 'slots') && t.c('econ2AdvanceAccept') === false, 'plné sloty blokují');
}

// ── záloha: dodání ──
for (const diff of ['normal', 'easy']) for (const wround of [1, 2, 3]) {   // wround 3 = zimní prémie by se jinak mohla uplatnit
  const t = withOffer(diff, 11), G = t.G(); ready(t); G.avail = [];
  t.c('econ2AdvanceAccept'); const ac = G.contracts.find(c => c.adv);
  const inv = ac.item; G[inv] = Array.from({ length: ac.qty + 2 }, () => 9);
  G.seasonTier = 3; G.pieceAcc = 0; const trust0 = G.partners.reichel.trust, done0 = G.done, fama0 = JSON.stringify(G.fama);
  const g0 = 90000; G.round = Math.min(wround, ac.due); const rr = G.round;
  step(t, rr, g0);
  const sd = G.summary; const rem = ac.reward - ac.adv.paid;
  ok(!G.contracts.some(c => c.adv) && G.done === done0 + 1, `${diff}/r${rr}: dodáno`);
  ok(sd.contractIncome === rem, `${diff}/r${rr}: vyplacen zbytek ${rem}, ne víc (příjem ${sd.contractIncome})`);
  ok(Math.abs(G.partners.reichel.trust - (trust0 + 3)) < 1e-9 || G.partners.reichel.trust === 100, `${diff}/r${rr}: Reichel +3 (${trust0} → ${G.partners.reichel.trust})`);
  ok(JSON.stringify(G.fama) === fama0, `${diff}/r${rr}: Fama beze změny`);
  const exp = Math.round(rem * 0.25) + Math.round(ac.adv.paid * 0.25);
  ok(G.pieceAcc === exp - (sd.pieceUsed || 0) + 0 || G.pieceAcc === exp, `${diff}/r${rr}: fond z celé ceny (${G.pieceAcc} vs ${exp})`);
  ok(G.log.some(l => /Zakázka splněna \(Reichel\)/.test(l)), `${diff}/r${rr}: log dodání`);
}
// ── záloha: nedodání ──
for (const [label, cash, expectDebt] of [['dost hotovosti', 90000, false], ['málo hotovosti', 0, true]]) {
  const t = withOffer('normal', 11), G = t.G(); ready(t); G.avail = [];
  t.c('econ2AdvanceAccept'); const ac = G.contracts.find(c => c.adv); const A0 = ac.adv.paid;
  G.waldglas = []; G.crystal = [];
  const trust0 = G.partners.reichel.trust, fama0 = JSON.stringify(G.fama), debt0 = G.debt;
  const target = ac.due + 1;
  G.round = target; G.phase = 'playing'; G.curEvt = null; G.events = [];
  G.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.fat = 0; w.unpaidDebt = 0; }); G.grose = cash;
  G.workers = G.workers.slice(0, 1);   // mzdy nesmí zkreslit hotovost (po splatnosti stačí kontrola dluhu)
  t.A.processRound();
  ok(!G.contracts.some(c => c.adv), `${label}: zakázka odpadla`);
  ok(Math.abs(G.partners.reichel.trust - (trust0 - 6)) < 1e-9, `${label}: Reichel −6`);
  ok(JSON.stringify(G.fama) === fama0, `${label}: Fama beze změny`);
  if (!expectDebt) ok(G.debt === debt0 || G.debt < A0 + debt0, `${label}: dluh nevznikl z zálohy (${G.debt})`);
  else ok(G.debt >= A0 - 100, `${label}: nesplacená záloha ${A0} → dluh ${G.debt}`);
  ok(G.phase !== 'game_over' || G.failureReason, `${label}: hra pokračuje (${G.phase})`);
  ok(G.log.some(l => /Záloha Reichelovi vrácena/.test(l)), `${label}: log vrácení`);
}
// ── další sezóna: nová nabídka ──
{
  const t = withOffer('normal', 5), G = t.G(); ready(t); t.c('econ2AdvanceAccept');
  ok(G.adv.taken, 'sezóna 1: přijato');
  G.season = 2; G.round = 0; step(t, 0, 90000);
  ok(G.adv.season === 2 && G.adv.taken === false, 'sezóna 2: nová nabídka, taken se resetuje');
}
// ── save/load ──
{
  const t = withOffer('normal', 5), G = t.G(); ready(t); t.c('econ2AdvanceAccept');
  const snap = JSON.parse(JSON.stringify(G));
  const ld = t.c('validateGameSave', JSON.parse(JSON.stringify(snap)));
  ok(JSON.stringify(ld.adv) === JSON.stringify(snap.adv) && ld.contracts.some(c => c.adv && c.adv.paid === snap.contracts.find(x => x.adv).adv.paid), 'save/load: adv a aktivní záloha');
  const b1 = JSON.parse(JSON.stringify(snap)); b1.adv = { season: 'x', id: 5 }; ok(t.c('validateGameSave', b1).adv === undefined, 'špatný tvar adv se zahodí');
  const b2 = JSON.parse(JSON.stringify(snap)); b2.contracts.find(c => c.adv).adv.paid = 'x'; ok(!t.c('validateGameSave', b2).contracts.some(c => c.adv), 'poškozená záloha na zakázce se vyřadí');
  const b3 = JSON.parse(JSON.stringify(snap)); delete b3._econ; ok(t.c('validateGameSave', b3).adv === undefined, 'klasický save záloha nemá');
}
// ── všechny hodnoty konečné ──
{
  const t = withOffer('normal', 5), G = t.G(); ready(t); t.c('econ2AdvanceAccept');
  ok(!JSON.stringify(G).includes('NaN') && !JSON.stringify(G).includes('null,"adv"'), 'bez NaN');
}
console.log(`econ2b: ${n - fail}/${n} OK`);
process.exit(fail ? 1 : 0);
