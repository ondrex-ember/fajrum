'use strict';
// Golden scenarios for the web game (headless).
//   node tests/golden.js gen <out.json> <seed> <easy|normal> <maxActions> [seasons]   bot plays, records actions + checkpoints
//   node tests/golden.js check [--from-groats] [--no-log] <golden.json>...               replays on the CURRENT web code and compares
// Format is the one Android's GoldenReplay reads: {meta, actions[{t,...}], checkpoints[{i,rngCalls,phase,season,round,logLines,logHash,pendingEvents,state}]}.
const fs = require('fs');
const { load } = require('./lib/engine.js');

// Keys excluded from comparison (UI-only / derived / Android-only records). Same list as Android GoldenReplay.SKIP_KEYS.
const SKIP_KEYS = new Set(['tab', 'help', 'showUpgrade', '_partaDetail', '_partaSubtab', '_sub', 'audio', 'firstVisit',
  'log', '_loyaltyModalPending', 'lang', 'guide', 'partners', 'forest2', '_cur']);
const CHECKPOINT_EVERY = 5;

function logHash(lines) {   // FNV-1a over UTF-16 units of each line + '\n'
  let h = 0x811c9dc5;
  for (const l of lines) {
    for (let i = 0; i < l.length; i++) { h ^= l.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    h ^= 10; h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) { if (SKIP_KEYS.has(k)) continue; o[k] = clean(v[k]); } return o; }
  if (typeof v === 'number' && !Number.isFinite(v)) return '__NONFINITE__';
  return v === undefined ? null : v;
}
function snapshot(e) {
  const G = e.api.G;
  return {
    rngCalls: e.calls, phase: G.phase, season: G.season, round: G.round,
    logLines: (G.log || []).length, logHash: logHash(G.log || []), pendingEvents: (G.events || []).length,
    state: clean(JSON.parse(JSON.stringify(G))),
  };
}
function setPath(root, path, v) {
  const ks = path.split('.'); let o = root;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = v;
}

// One player action → web function (vocabulary of Android Actions.kt).
function apply(e, a) {
  const A = e.api, c = (n, ...x) => A.call(n, ...x);
  switch (a.t) {
    case 'newGame': { const G0 = A.initState(); G0.huteName = a.huteName || 'Hutmistr'; A.G = G0; A.startGame(a.difficulty); if (a.econ !== 2) { const g = A.G; delete g._econ; delete g.pieceAcc; delete g.leaseSeasons; } break; }   // klasika, pokud scénář výslovně nechce econ:2
    case 'setTask': c('setWorkerTask', a.id, a.task); break;
    case 'setAlloc': c('setAlloc', a.key, a.val); break;
    case 'allocRecommended': c('setAlloc', 'build', 0); c('setAlloc', 'potash', 40); break;
    case 'craftBlown': c('craftBlown', a.key, a.color); break;
    case 'sell': c('sellItems', a.type, a.n); break;
    case 'acceptContract': c('acceptContract', a.id); break;
    case 'nextRound': A.processRound(); break;
    case 'dismissEvt': A.dismissEvt(); break;
    case 'dismissCrackLoss': c('dismissCrackLoss'); break;
    case 'ackSummary': c('continueFromSummary'); break;
    case 'setGuide': c('setGuide', a.value); break;
    case 'guideSnooze': c('guideSnooze', a.id); break;
    case 'guideDo': c('guideDo', a.id); break;
    case 'startInterseason': A.startInterseason(); break;
    case 'startNewSeason': A.startNewSeason(); break;
    case 'patch': for (const [p, v] of Object.entries(a.set)) setPath(A.G, p, JSON.parse(JSON.stringify(v))); break;
    case 'setBeer': c('setBeerLevel', a.level); break;
    case 'setSlot': c('setFurnSlotType', a.slot, a.type); break;
    case 'ensureSlots': c('ensureFurnSlotConfig'); break;
    case 'setAtm': c('setFurnAtm', a.slot, a.atm); break;
    case 'strikeRuby': c('strikeRuby'); break;
    case 'toggleRecipe': c('toggleColorRecipe', a.key); break;
    case 'clearRecipe': c('clearColorRecipe'); break;
    case 'buyItem': c('buyItem', a.key); break;
    case 'craftColor': c('craftColorGlass', a.key); break;
    case 'craftGround': c('craftGround', a.key); break;
    case 'craftEngrave': c('craftEngrave', a.key); break;
    case 'craftSpecial': c('craftSpecial', a.key); break;
    case 'hireInterseason': { e.setClock(a.clock); const cand = A.G.interseason.candidates.find(x => x.id === a.id); c('hireWorker', cand); break; }
    case 'hireMarket': e.setClock(a.clock); c('hireMarketSpecialist', a.id); break;
    case 'fire': c('fireWorker', a.id); break;
    case 'signContract': c('signContract', a.id, a.months); break;
    case 'buyBaran': c('buyBaranOffer'); break;
    case 'repairShamot': c('repairShamot'); break;
    case 'upgradeFurnace': c('upgradeFurnace', a.type); break;
    case 'upgradeTier': c('upgradeSeasonTier', a.tier); break;
    case 'buyParcely': c('buyParcely', a.n); break;
    case 'acceptEndgame': c('acceptEndgameContract', a.cat); break;
    case 'loan': c('takeLoan', a.amt, a.kind === 'market' ? c('loanRateMarket') : c('loanRateAccounts')); break;
    case 'moratorium': c('negotiateMoratorium'); break;
    case 'clearDebt': c('clearAllDebt'); break;
    case 'repay': c('repayDebt', a.amt); break;
    case 'buyWood': c('buyEmergencyWood'); break;
    case 'quickSell': c('quickSellAll'); break;
    case 'payDebtsSummary': c('payWorkerDebtsSummary'); break;
    case 'loyaltyPayAll': c('loyaltyModalPayAll'); break;
    case 'loyaltyPromise': c('loyaltyModalPromise'); break;
    case 'loyaltyDismiss': c('loyaltyModalDismiss'); break;
    case 'retentionPay': c('retentionPayDebt', a.id); break;
    case 'retentionPromise': c('retentionPromise', a.id); break;
    case 'retentionIgnore': c('retentionIgnore', a.id); break;
    case 'payAllWages': c('payAllOwedWages'); break;
    case 'payWage': c('payWorkerWage', a.id, a.amt); break;
    case 'payClaim': c('payExClaim', a.id); break;
    case 'resolveStrike': c('resolveRubyStrike'); break;
    default: throw new Error("unknown action '" + a.t + "'");
  }
}

// ── bot (own PRNG, independent of the game's Math.random) ──
function botRng(seed) { let s = (seed * 2654435761 + 12345) >>> 0; return () => { s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0; return s / 4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

function botNext(e, r, mode) {
  const chaos = mode === 'chaos';
  const A = e.api, G = A.G, ph = G.phase;
  if (ph === 'game_over') return null;
  if (ph === 'event') return { t: G.curEvt && G.curEvt.crack ? 'dismissCrackLoss' : 'dismissEvt' };
  if (ph === 'summary') return { t: 'ackSummary' };
  if (ph === 'interseasonPhase') return { t: 'startInterseason' };
  if (ph === 'interseason') {
    const ci = G.interseason || {}; const x = r();
    const cands = ci.candidates || [];
    if (x < 0.15 && cands.length) { const cd = pick(r, cands); return { t: 'hireInterseason', id: cd.id, clock: 1700000000000 + Math.floor(r() * 1e6) }; }
    if (x < 0.25) return { t: 'repairShamot' };
    if (x < 0.28 && (G.marketNpc || G.trhuNPC || []).length) return { t: 'hireMarket', id: pick(r, G.marketNpc || G.trhuNPC).id, clock: 1700000000000 + Math.floor(r() * 1e6) };
    if (x < 0.32) return { t: 'upgradeFurnace', type: pick(r, ['stredni', 'velka', 'regeneracni']) };
    if (x < 0.38) return { t: 'upgradeTier', tier: 1 + Math.floor(r() * 3) };
    if (x < 0.44) return { t: 'buyBaran' };
    if (x < 0.50) return { t: 'buyParcely', n: 1 + Math.floor(r() * 3) };
    if (x < 0.55) return { t: 'strikeRuby' };
    if (x < 0.60) return { t: 'craftColor', key: pick(r, ['cervene', 'modre', 'zelene']) };
    return { t: 'startNewSeason' };
  }
  // playing
  const x = r();
  const wk = G.workers || [];
  if (!chaos) {   // careful play: keep the hut alive so several seasons are covered
    if (G.round === 0 && !r.init) { r.init = 1; return { t: 'allocRecommended' }; }
    if (G.res.wood < 12 && G.grose >= 20 && x < 0.5) return { t: 'buyWood' };
    if (x < 0.14) return { t: 'nextRound' };
    if (x < 0.40) return { t: 'craftBlown', key: pick(r, ['cise', 'dzban', 'pullitr', 'pohar', 'holba', 'romer']), color: pick(r, ['waldglas', 'waldglas', 'crystal']) };
    if (x < 0.55) return { t: 'sell', type: pick(r, ['waldglas', 'crystal', 'cise', 'dzban', 'pullitr', 'pohar']), n: 1 + Math.floor(r() * 4) };
    if (x < 0.62 && (G.avail || []).length) return { t: 'acceptContract', id: pick(r, G.avail).id };
    if (x < 0.70) return { t: 'nextRound' };
  }
  if (x < 0.22) return { t: 'nextRound' };
  if (x < 0.30 && wk.length) { const w = pick(r, wk); const o = A.call('workerTaskOptions', w); const ts = [...o.primary.filter(p => !p.disabled).map(p => p.t), ...o.others]; if (ts.length) return { t: 'setTask', id: w.id, task: pick(r, ts) }; }
  if (x < 0.36) return { t: 'allocRecommended' };
  if (x < 0.42) return { t: 'setAlloc', key: pick(r, Object.keys(G.wa)), val: Math.floor(r() * 10) * 10 };
  if (x < 0.50) return { t: 'sell', type: pick(r, ['waldglas', 'crystal']), n: 1 + Math.floor(r() * 3) };
  if (x < 0.56 && (G.avail || []).length) return { t: 'acceptContract', id: pick(r, G.avail).id };
  if (!chaos && x > 0.60) return { t: 'nextRound' };
  if (x < 0.60) return { t: 'loan', amt: pick(r, [15, 25, 40]), kind: pick(r, ['accounts', 'market']) };
  if (x < 0.64) return { t: 'repay', amt: pick(r, [5, 10, 20]) };
  if (x < 0.68) return { t: pick(r, ['payAllWages', 'buyWood', 'quickSell', 'moratorium', 'clearDebt', 'payDebtsSummary']) };
  if (x < 0.74) return { t: 'craftBlown', key: pick(r, ['cise', 'dzban', 'pullitr', 'pohar']), color: pick(r, ['waldglas', 'crystal']) };
  if (x < 0.76) { const y = r(); if (y < 0.4) return { t: 'craftGround', key: pick(r, Object.keys(A.get('GROUND_ITEMS'))) }; if (y < 0.7) return { t: 'craftEngrave', key: pick(r, Object.keys(A.get('BLOWN_ITEMS'))) }; return { t: 'craftSpecial', key: pick(r, Object.keys(A.get('SPECIAL_ITEMS'))) }; }
  if (x < 0.78) return { t: 'setBeer', level: Math.floor(r() * 3) };
  if (x < 0.82 && wk.length) return { t: 'signContract', id: pick(r, wk).id, months: pick(r, [3, 6, 12]) };
  if (x < 0.85) return { t: 'patch', set: { grose: pick(r, [0, 3, 14, 120]), debt: pick(r, [0, 40, 160, 220]) } };
  if (x < 0.88 && G._loyaltyModalPending) return { t: pick(r, ['loyaltyPayAll', 'loyaltyPromise', 'loyaltyDismiss']) };
  return { t: 'nextRound' };
}

function playAndRecord(seed, diff, maxActions, maxSeasons, mode, econ) {
  const e = load({ seed }); const r = botRng(seed);
  const actions = [], checkpoints = [];
  const doApply = a => { apply(e, a); actions.push(a); };
  doApply(econ ? { t: 'newGame', difficulty: diff, huteName: 'test', econ: 2 } : { t: 'newGame', difficulty: diff, huteName: 'test' });
  checkpoints.push(Object.assign({ i: 0 }, snapshot(e)));
  let guard = 0, last = '';
  while (actions.length < maxActions && guard++ < maxActions * 10) {
    const G = e.api.G;
    if (G.season > maxSeasons || G.phase === 'game_over') break;
    const a = botNext(e, r, mode); if (!a) break;
    const before = JSON.stringify(e.api.G), cnt = e.calls;
    try { apply(e, a); } catch (err) {   // invalid in this state: restore (only safe when no RNG was used)
      if (e.calls !== cnt) throw new Error('action ' + JSON.stringify(a) + ' threw after using RNG: ' + err.message);
      e.api.G = JSON.parse(before); continue;
    }
    actions.push(a);
    const i = actions.length - 1;
    if (i % CHECKPOINT_EVERY === 0 || a.t === 'nextRound' && e.api.G.phase !== 'playing') checkpoints.push(Object.assign({ i }, snapshot(e)));
    last = a.t;
  }
  const i = actions.length - 1;
  if (!checkpoints.some(c => c.i === i)) checkpoints.push(Object.assign({ i }, snapshot(e)));
  return { meta: { name: `${mode || 'careful'}-${diff}-seed${seed}${econ ? '-econ2' : ''}`, seed, difficulty: diff, mode: mode || 'careful', source: 'web tests/golden.js', currency: 'krejcary', ...(econ ? { econ: 2 } : {}) }, actions, checkpoints, final: { season: e.api.G.season, phase: e.api.G.phase } };
}

function deepDiff(a, b, p, out) {
  if (out.length > 20) return;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) out.push(p + '.' + k + ': <missing> vs ' + JSON.stringify(b[k]).slice(0, 80));
      else if (!(k in b)) out.push(p + '.' + k + ': ' + JSON.stringify(a[k]).slice(0, 80) + ' vs <missing>');
      else deepDiff(a[k], b[k], p + '.' + k, out);
    }
  } else if (a !== b) out.push(p + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
}

// Golden recorded in groats (before the krejcar step) → krejcary: same rule as Android GoldenReplay.scaleGolden.
const MONEY_KEYS = new Set(['grose', 'debt', 'totalGrose', 'totalDebtPaid', 'reward', 'price', 'b', 'amount', 'hireCost', 'wageMod', 'unpaidDebt',
  'bCost', 'contractIncome', 'dPay', 'debtAfter', 'groseAfter', 'groseDelta', 'wages', 'wagesDeficit', 'wagesPaid', 'wage', 'shortfall', 'amt', 'paid', 'debtPaid']);
function scaleGolden(v, key, parent) {
  if (Array.isArray(v)) return v.map(x => scaleGolden(x, key, parent));
  if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = scaleGolden(v[k], k, key); return o; }
  if (typeof v === 'number' && ((MONEY_KEYS.has(key) && parent !== 'snooze' && parent !== 'seasonScore') || parent === 'sum')) return v * 100;
  return v;
}
function check(file, opts = {}) {
  let g = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (opts.scale) g = { ...g, actions: scaleGolden(g.actions), checkpoints: g.checkpoints.map(c => ({ ...c, state: scaleGolden(c.state) })) };
  const e = load({ seed: g.meta.seed });
  const cps = new Map(g.checkpoints.map(c => [c.i, c]));
  for (let i = 0; i < g.actions.length; i++) {
    try { apply(e, g.actions[i]); } catch (err) { return { ok: false, msg: `${g.meta.name}: action #${i} ${JSON.stringify(g.actions[i])} threw ${err.message}` }; }
    const cp = cps.get(i); if (!cp) continue;
    const s = snapshot(e), diffs = [];
    for (const k of ['rngCalls', 'phase', 'season', 'round', 'logLines', 'pendingEvents']) deepDiff(cp[k], s[k], k, diffs);
    if (!opts.noLog) deepDiff(cp.logHash, s.logHash, 'logHash', diffs);
    deepDiff(cp.state, s.state, 'state', diffs);
    if (diffs.length) return { ok: false, msg: `${g.meta.name}: FAIL at action #${i} ${JSON.stringify(g.actions[i])}\n  ` + diffs.slice(0, 12).join('\n  ') };
  }
  return { ok: true, msg: `${g.meta.name}: PASS ${g.actions.length} actions, ${g.checkpoints.length} checkpoints` };
}

// Groat golden → krejcar golden: scale actions+state, verify everything except the log text matches,
// then take the new log hashes (log strings contain money, so they legitimately change).
function rebase(inFile, outFile) {
  const g0 = JSON.parse(fs.readFileSync(inFile, 'utf8'));
  const g = { ...g0, meta: { ...g0.meta, currency: 'krejcary' }, actions: scaleGolden(g0.actions) };
  const scaled = g0.checkpoints.map(c => ({ ...c, state: scaleGolden(c.state) }));
  const e = load({ seed: g.meta.seed });
  const cps = new Map(scaled.map(c => [c.i, c]));
  const out = [];
  for (let i = 0; i < g.actions.length; i++) {
    apply(e, g.actions[i]);
    const cp = cps.get(i); if (!cp) continue;
    const s = snapshot(e), diffs = [];
    for (const k of ['rngCalls', 'phase', 'season', 'round', 'logLines', 'pendingEvents']) deepDiff(cp[k], s[k], k, diffs);
    deepDiff(cp.state, s.state, 'state', diffs);
    if (diffs.length) throw new Error(`${g.meta.name}: rebase mismatch at #${i}\n  ` + diffs.slice(0, 8).join('\n  '));
    out.push({ ...cp, logHash: s.logHash });
  }
  g.checkpoints = out;
  fs.writeFileSync(outFile, JSON.stringify(g));
  return `${g.meta.name}: rebased ${g.actions.length} actions, ${out.length} checkpoints`;
}

module.exports = { apply, snapshot, playAndRecord, check, scaleGolden, rebase, SKIP_KEYS };

if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'gen') {
    const [out, seed, diff, n, seasons, mode, econ] = rest;
    const g = playAndRecord(+seed, diff, +n, +(seasons || 4), mode, econ === 'econ2');
    fs.writeFileSync(out, JSON.stringify(g));
    console.log(`${out}: ${g.actions.length} actions, season ${g.final.season}, phase ${g.final.phase}, ${g.checkpoints.length} checkpoints`);
  } else if (cmd === 'check') {
    let bad = 0;
    const scale = rest.includes('--from-groats'), noLog = rest.includes('--no-log');
    for (const f of rest.filter(x => !x.startsWith('--'))) { const r = check(f, { scale, noLog: noLog || scale }); console.log(r.msg); if (!r.ok) bad++; }
    process.exit(bad ? 1 : 0);
  } else if (cmd === 'rebase') {
    const [inDir, outDir] = rest;
    for (const f of fs.readdirSync(inDir).filter(x => x.endsWith('.json'))) console.log(rebase(inDir + '/' + f, outDir + '/' + f));
  } else { console.error('usage: golden.js gen <out> <seed> <easy|normal> <n> [seasons] [careful|chaos] [econ2] | check <file>... | rebase <groat-dir> <out-dir>'); process.exit(2); }
}
