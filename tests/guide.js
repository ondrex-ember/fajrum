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
let bad = 0;
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
