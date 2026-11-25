'use strict';
// Guide Kunc: a bot that does only what the guide card says (like Android `guideFollower`), plus invariants:
// selection is pure (state unchanged by guideCurrentStep), every enabled CTA runs without error, no step loops forever.
//   node tests/guide.js [seeds=10] [seasons=8]
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
const seeds = +(process.argv[2] || 10), maxSeasons = +(process.argv[3] || 8);
const out = {};
function run(diff, seed, withGuide) {
  const e = load({ seed }); const A = e.api;
  apply(e, { t: 'newGame', difficulty: diff, huteName: 'test' });
  if (withGuide && !A.G.guide.on) apply(e, { t: 'setGuide', value: true });
  const used = {}; let guard = 0, loans = 0, pureErr = 0;
  while (guard++ < 4000) {
    const G = A.G, ph = G.phase;
    if (ph === 'game_over' || G.season > maxSeasons) break;
    if (ph === 'event') { apply(e, { t: G.curEvt && G.curEvt.crack ? 'dismissCrackLoss' : 'dismissEvt' }); continue; }
    if (ph === 'summary') { apply(e, { t: 'ackSummary' }); continue; }
    if (ph === 'interseasonPhase') { apply(e, { t: 'startInterseason' }); continue; }
    if (ph === 'interseason') { apply(e, { t: 'startNewSeason' }); continue; }
    // playing: follow the guide (max 12 steps), like the Android bot
    let last = '';
    for (let i = 0; i < 12; i++) {
      const before = JSON.stringify(A.G);
      const g = A.call('guideView');
      if (JSON.stringify(A.G) !== before) pureErr++;
      if (!g) break;
      if (g.id === last && !g.ctaEnabled) break;
      if (!g.ctaEnabled) { apply(e, { t: 'guideSnooze', id: g.id }); last = g.id; continue; }
      last = g.id; used[g.id] = (used[g.id] || 0) + 1;
      apply(e, { t: 'guideDo', id: g.id });
    }
    const cur = A.G;
    if (cur.grose < 500 && cur.debt < 6000) { A.call('takeLoan', 1500, A.call('loanRateAccounts')); loans++; }
    if (!A.get('MARKET_CLOSED')[cur.round]) for (const k of Object.keys(A.call('marketSalePrices'))) if (Array.isArray(cur[k]) && cur[k].length) A.call('sellItems', k, 999);
    apply(e, { t: 'nextRound' });
  }
  const G = A.G;
  return { season: G.season, phase: G.phase, tier: G.seasonTier || 0, grose: G.grose, loans, used, pureErr };
}
// ── no ping-pong: "field" (food low) and "forest_low" (forest ≤ 30 %) must not keep taking each other's worker ──
// State: 5 workers on distinct useful tasks, one on field, one on reforest, food 0, forest 20 %, round with field yield. Following the card
// without advancing the month must reach a state where no enabled CTA remains (or the same CTA never returns to a state seen before).
function pingPong(forestLow) {
  const e = load({ seed: 3 }); const A = e.api;
  apply(e, { t: 'newGame', difficulty: 'easy', huteName: 't' });
  const G = A.G; G.phase = 'playing'; G.curEvt = null; G.season = 1; G.round = 5; G.seasonTier = 0; G.grose = 50000;
  G.guide.on = true; G.guide.snooze = {}; G.guide.done = Object.keys(A.get('GUIDE_STEPS')).filter(id => id !== 'field' && id !== 'forest_low');
  const tasks = ['field', 'reforest', 'logging', 'quarry', 'water'];
  G.workers.forEach((w, i) => { w.task = tasks[i % tasks.length]; });
  G.res.food = 0; G.res.wood = 60; G.res.sand = 40; G.res.limestone = 20; G.res.water = 30;
  G.forestMax = 40; G.forest = forestLow ? 8 : 40;
  const seen = new Set(), trail = []; let cycle = false, n = 0;
  for (; n < 30; n++) {
    const g = A.call('guideView'); if (!g || !g.ctaEnabled) break;
    const key = g.id + '|' + G.workers.map(w => w.task).join(',');
    if (seen.has(key)) { cycle = true; break; } seen.add(key); trail.push(g.id);
    apply(e, { t: 'guideDo', id: g.id });
  }
  return { cycle, n, trail, tasks: G.workers.map(w => w.task), forestLow, reforest: G.workers.filter(w => w.task === 'reforest').length, field: G.workers.filter(w => w.task === 'field').length };
}
let pp = 0;
for (const fl of [true, false]) {
  const r = pingPong(fl);
  const okPP = !r.cycle && r.n < 30 && (!fl || r.reforest >= 1);   // low forest: the reforest worker stays; the field step must not take him
  console.log(`ping-pong (forest ${fl ? 'low' : 'ok'}): ${okPP ? 'OK' : 'FAIL'} steps=${r.n} trail=${r.trail.join('>')} field=${r.field} reforest=${r.reforest}`);
  if (!okPP) pp++;
}
// fuzz: random task layouts, forest and food levels — following the card never revisits a state
{
  let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  let cyc = 0, runs = 0;
  for (let i = 0; i < 300; i++) {
    const e = load({ seed: 3 }); const A = e.api; apply(e, { t: 'newGame', difficulty: 'easy', huteName: 't' });
    const G = A.G; G.phase = 'playing'; G.curEvt = null; G.season = 1; G.round = 4 + Math.floor(rnd() * 6); G.grose = 50000;
    G.guide.on = true; G.guide.snooze = {}; G.guide.done = Object.keys(A.get('GUIDE_STEPS')).filter(id => id !== 'field' && id !== 'forest_low');
    const T = ['field', 'reforest', 'logging', 'quarry', 'water', 'potash', 'idle', 'clay'];
    G.workers.forEach(w => { w.task = T[Math.floor(rnd() * T.length)]; });
    G.res.food = Math.floor(rnd() * 6); G.res.wood = 20 + Math.floor(rnd() * 100); G.res.sand = 20 + Math.floor(rnd() * 60); G.res.limestone = 10 + Math.floor(rnd() * 30); G.res.water = 10 + Math.floor(rnd() * 50);
    G.forestMax = 40; G.forest = Math.floor(rnd() * 41);
    const seen = new Set(); runs++;
    for (let n = 0; n < 30; n++) {
      const g = A.call('guideView'); if (!g || !g.ctaEnabled) break;
      const key = g.id + '|' + G.workers.map(w => w.task).join(',');
      if (seen.has(key)) { cyc++; break; } seen.add(key);
      apply(e, { t: 'guideDo', id: g.id });
    }
  }
  console.log(`ping-pong fuzz: ${cyc ? 'FAIL' : 'OK'} ${cyc} cycles in ${runs} random states`);
  if (cyc) pp++;
}
let bad = pp;
for (const diff of ['easy', 'normal']) {
  let survived = 0, tier1 = 0, pure = 0, gSum = 0; const usedAll = {};
  for (let s = 1; s <= seeds; s++) {
    const r = run(diff, s, true);
    if (r.phase !== 'game_over' && r.season > maxSeasons) survived++;
    if (r.tier >= 1) tier1++;
    pure += r.pureErr; gSum += r.grose;
    for (const [k, v] of Object.entries(r.used)) usedAll[k] = (usedAll[k] || 0) + v;
  }
  console.log(`${diff}: survived ${survived}/${seeds} to season ${maxSeasons}, tier>=1 ${tier1}/${seeds}, purity violations ${pure}, avg cash ${(gSum / seeds / 100).toFixed(0)} zl`);
  console.log('  CTA used:', JSON.stringify(usedAll));
  if (pure) bad++;
}
process.exit(bad ? 1 : 0);
