'use strict';
// Partner records (phase A): hooks fire exactly where the log says the thing happened, trust follows PARTNERS deltas,
// nothing is written outside G.partners. Replays golden scenarios (krejcar) and compares G.partners with the log text.
//   node tests/partners.js tests/golden/*.json
const fs = require('fs');
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let bad = 0, totals = {};
for (const f of process.argv.slice(2)) {
  const g = JSON.parse(fs.readFileSync(f, 'utf8'));
  const e = load({ seed: g.meta.seed });
  const logs = [];
  let seen = 0;
  const flush = () => { const G = e.api.G; if (G.log && G.log.length > seen) { for (const l of G.log.slice(seen)) logs.push(String(l)); } seen = G.log ? G.log.length : 0; };
  for (const a of g.actions) { apply(e, a); const G = e.api.G; if (G.log && G.log.length < seen) seen = 0; flush(); }
  const G = e.api.G, P = e.api.get('PARTNERS');
  const count = re => logs.filter(l => re.test(l)).length;
  const exp = {
    'weiss.contractDone': count(/Zakázka splněna \(Weiss\)|Contract done \(Weiss\)/),
    'weiss.contractExpired': count(/Zakázka vypršela \(Weiss\)|Contract expired \(Weiss\)/),
    'weiss.quickSell': count(/Kupec Weiss vykoupil|Merchant Weiss bought/),
    'weiss.woodBought': count(/nouzové dřevo|emergency wood/),
    'reichel.loan': count(/Půjčka od Faktora Reichela|Loan from Factor Reichel/),
    'reichel.moratorium': count(/Sjednán odklad|Negotiated 2-round/),
    'reichel.cleared': 0,
  };
  const errs = [];
  for (const [k, v] of Object.entries(exp)) {
    const [id, ev] = k.split('.'); if (ev === 'cleared') continue;
    const got = (G.partners[id] && G.partners[id].n[ev]) || 0;
    // log is capped (G.log trimmed) → only compare when we saw every line from the start
    if (got !== v) errs.push(`${k}: record ${got} vs log ${v}`);
    totals[k] = (totals[k] || 0) + got;
  }
  for (const id of Object.keys(P)) {
    const st = G.partners[id];
    if (!st) { errs.push(id + ': missing'); continue; }
    if (!(st.trust >= 0 && st.trust <= 100)) errs.push(id + ': trust out of range ' + st.trust);
    if (st.log.length > 30) errs.push(id + ': log > 30');
    const n = Object.values(st.n).reduce((s, x) => s + x, 0);
    if (st.log.length !== Math.min(30, n)) errs.push(`${id}: log ${st.log.length} vs n ${n}`);
    // trust replay from the full history when the log is complete
    if (n <= 30) {
      let t = P[id].startTrust; for (const r of st.log) t = Math.max(0, Math.min(100, t + P[id].events[r.ev].delta));
      if (Math.abs(t - st.trust) > 1e-9) errs.push(`${id}: trust ${st.trust} vs replay ${t}`);
    }
  }
  if (errs.length) { bad++; console.log(g.meta.name + ': FAIL\n  ' + errs.join('\n  ')); } else console.log(g.meta.name + ': ok ' + Object.keys(P).map(id => id + '=' + G.partners[id].trust).join(' '));
}
console.log('event totals:', JSON.stringify(totals));
process.exit(bad ? 1 : 0);
