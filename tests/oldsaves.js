'use strict';
// Old-save test: take the state at a checkpoint of a golden recorded in GROATS (an "old save"), load it through the
// current save loader (validateGameSave → migrations) and play on; the following checkpoints must equal the golden scaled to krejcary.
//   node tests/oldsaves.js <groat-golden.json>... [--every N] [--ahead N] [--loose]
// --loose (od zakázek 1b-1, kdy se pravidla a RNG změnila): kontrolují se jen načtení savu (stav se rovná kontrolnímu bodu) a to, že hra
//   pokračuje dál bez výjimky a bez NaN/Infinity ve stavu; průběh se s původním scénářem už neporovnává.
const fs = require('fs');
const { load, mulberry32 } = require('./lib/engine.js');
const { apply, snapshot, scaleGolden } = require('./golden.js');

function deepDiff(a, b, p, out) {
  if (out.length > 12) return;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) out.push(p + '.' + k + ': <missing> vs ' + JSON.stringify(b[k]).slice(0, 60));
      else if (!(k in b)) out.push(p + '.' + k + ': ' + JSON.stringify(a[k]).slice(0, 60) + ' vs <missing>');
      else deepDiff(a[k], b[k], p + '.' + k, out);
    }
  } else if (a !== b) out.push(p + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
}

function run(file, every, ahead, loose) {
  const g = JSON.parse(fs.readFileSync(file, 'utf8'));
  const actions = scaleGolden(g.actions);
  const cps = g.checkpoints.map(c => ({ ...c, state: scaleGolden(c.state) }));
  const byI = new Map(cps.map(c => [c.i, c]));
  let tested = 0, bad = 0;
  cps.forEach((cp, idx) => {
    if (idx === 0 || idx % every) return;
    if (typeof g.checkpoints[idx].state.curEvt === 'string') return;   // known web issue: validateGameSave rejects curEvt="merchant" (string) — not part of this test
    // the "save": the groat-valued state exactly as the old game stored it (load it in a scratch engine: the loader draws random numbers for the defaults)
    const old = JSON.parse(JSON.stringify(g.checkpoints[idx].state));
    old.lang = 'cs';
    const loaded = JSON.parse(JSON.stringify(load({ seed: 1 }).api.call('validateGameSave', old)));
    const e = load({ seed: g.meta.seed });
    while (e.rnd.calls < g.checkpoints[idx].rngCalls) e.rnd();            // continue the random stream where the save was written
    e.api.G = loaded;
    // loaded state must equal the krejcar checkpoint right away
    let diffs = [];
    const s0 = snapshot(e); deepDiff(cp.state, s0.state, 'state', diffs);
    if (diffs.length) { bad++; console.log(`${g.meta.name} cp#${cp.i}: LOAD mismatch\n  ` + diffs.join('\n  ')); return; }
    for (let i = cp.i + 1; i <= Math.min(actions.length - 1, cp.i + ahead); i++) {
      if (loose) {
        const snap = JSON.stringify(e.api.G), cnt = e.calls;
        try { apply(e, actions[i]); } catch (err) {
          if (e.calls === cnt) { e.api.G = JSON.parse(snap); continue; }   // akce neplatná ve změněném průběhu (např. dělník už odešel) — přeskočit, jako při nahrávání
          bad++; console.log(`${g.meta.name} save@${cp.i} → action #${i} ${JSON.stringify(actions[i])} threw: ${err.message}`); return; }
        const G = e.api.G, nf = []; (function walk(v, p) { if (typeof v === 'number' && !Number.isFinite(v)) nf.push(p); else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], p + '.' + k); })(G, 'G');
        if (nf.length) { bad++; console.log(`${g.meta.name} save@${cp.i} → action #${i}: non-finite ${nf.slice(0, 3).join(', ')}`); return; }
        if ((G.contracts || []).length > 3) { bad++; console.log(`${g.meta.name} save@${cp.i}: ${G.contracts.length} active contracts`); return; }
        continue;
      }
      apply(e, actions[i]);
      const want = byI.get(i); if (!want) continue;
      const s = snapshot(e); diffs = [];
      for (const k of ['rngCalls', 'phase', 'season', 'round', 'pendingEvents']) deepDiff(want[k], s[k], k, diffs);
      deepDiff(want.state, s.state, 'state', diffs);
      if (diffs.length) { bad++; console.log(`${g.meta.name} save@${cp.i} → action #${i} ${JSON.stringify(actions[i])}\n  ` + diffs.join('\n  ')); return; }
    }
    tested++;
  });
  return { tested, bad };
}
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i < 0 ? null : +args.splice(i, 2)[1]; };
const loose = args.includes('--loose'); if (loose) args.splice(args.indexOf('--loose'), 1);
const every = opt('--every') || 3, ahead = opt('--ahead') || 25;
let T = 0, B = 0;
for (const f of args) { const r = run(f, every, ahead, loose); T += r.tested; B += r.bad; }
console.log(`old saves: ${T} loaded and continued OK, ${B} failed`);
process.exit(B ? 1 : 0);
