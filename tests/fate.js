'use strict';
// ECON2 etapa 8a / W2: události s volbou. Klasická hra nesmí být dotčena (hlídají goldeny).
//   node tests/fate.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };

function fresh(diff, seed, econ) {
  const e = load({ seed: seed || 5 }); const A = e.api;
  apply(e, econ === false ? { t: 'newGame', difficulty: diff || 'normal', huteName: 't' } : { t: 'newGame', difficulty: diff || 'normal', huteName: 't', econ: 2 });
  return { e, A, G: () => A.G, c: (f, ...x) => A.call(f, ...x) };
}
function prep(t, season, round) {
  const G = t.G(); G.season = season; G.round = round; G.phase = 'playing'; G.curEvt = null; G.events = []; G.summary = null;
  G.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.fat = 0; w.unpaidDebt = 0; });
  G.grose = 900000; G.morale = 80; G.res.wood = 100; G.res.food = 50; G.fate.pending = null; G.fate.fx = []; G.fate.done = 0;
  return G;
}
const pend = (t, kind, season, round) => { const G = t.G(); G.fate.pending = { kind, season, round }; };
const seedWhere = (t, f) => { for (let s = 1; s < 20000; s++) if (f(s)) return s; throw new Error('no seed'); };

const t0 = fresh('normal');
// ── start ──
{
  const G = t0.G();
  ok(G.fate && Array.isArray(G.fate.fx) && G.fate.pending === null && G.fate.done === 0, 'nová hra: G.fate prázdné');
  ok(fresh('normal', 5, false).G().fate === undefined, 'klasika: bez G.fate');
  ok(t0.c('fatePending') === false && t0.c('fatePendingView') === null, 'bez události žádný pohled');
}
// ── měsíc a druh ──
{
  const F = t0.A.get('FATE');
  let wxDriven = 0, N = 0, bad = 0, kinds = {};
  for (let s = 1; s <= 3000; s++) {
    t0.G().wSeed = s * 7919;
    for (let season = 2; season <= 4; season++) {
      const m = t0.c('fateMonth', season); N++;
      if (m < F.rounds[0] || m > F.rounds[1]) bad++;
      const wk = t0.c('weatherKind', season, m); if (wk === 'frost' || wk === 'dry' || wk === 'storm') wxDriven++;
      const k = t0.c('fateKindFor', season, m); kinds[k] = (kinds[k] || 0) + 1;
      if (wk === 'frost' && k !== 'frost') bad++;
      if ((wk === 'dry' || wk === 'storm') && k !== 'fire') bad++;
      if ((wk === 'normal' || wk === 'wet') && (k === 'frost' || k === 'fire')) bad++;
    }
  }
  ok(bad === 0, 'měsíc v 2–9 a druh odpovídá počasí');
  ok(wxDriven / N > 0.5 && wxDriven / N < 0.7, 'sezón řízených počasím ≈56 % (' + (wxDriven / N).toFixed(3) + ')');
  ok(kinds.forest > 0 && kinds.frost > 0 && kinds.fire > 0, 'objeví se mráz, požár i lesní řád: ' + JSON.stringify(kinds));
  const t = fresh('normal'); t.G().wSeed = 12345;
  const a = t.c('fateMonth', 3), b = t.c('fateMonth', 3); ok(a === b, 'fateMonth deterministický');
  const r0 = t.e.calls; for (let i = 0; i < 100; i++) { t.c('fateMonth', 2 + i % 5); t.c('fateKindFor', 2, 5); } ok(t.e.calls === r0, 'plán události nesahá na Math.random');
}
// ── založení události v processRound a brána ──
{
  const t = fresh('normal', 7), G = prep(t, 2, 0);
  const m = t.c('fateMonth', 2); let guard = 0;
  while (t.G().round < m && guard++ < 20) { const g = t.G(); g.phase = 'playing'; g.curEvt = null; g.events = []; g.grose = 900000; g.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.unpaidDebt = 0; }); t.A.processRound(); ok(t.G().fate.pending === null || t.G().round === m, 'událost jen ve svém měsíci'); }
  const g1 = t.G();
  ok(g1.round === m && g1.fate.pending && g1.fate.pending.season === 2 && g1.fate.pending.round === m && g1.fate.done === 2, 'událost založena v měsíci ' + m + ' (' + JSON.stringify(g1.fate.pending) + ')');
  ok(g1.log.some(l => l.includes('⚠️')), 'v kronice je upozornění');
  const rnd = g1.round; g1.phase = 'playing'; t.A.processRound();
  ok(t.G().round === rnd && t.G().fate.pending, 'processRound je blokován, dokud se nerozhodne');
  const v = t.c('fatePendingView'); ok(v && v.options.length === 3 && v.options.some(o => o.ok), 'pohled má 3 volby a aspoň jedna jde');
  const free = v.options.find(o => o.ok && !o.costParts.length);
  ok(t.c('fateChoose', free.id) === true && t.G().fate.pending === null, 'rozhodnutí odblokuje');
  t.G().phase = 'playing'; t.G().curEvt = null; t.G().events = []; t.A.processRound(); ok(t.G().round === rnd + 1, 'měsíc po rozhodnutí běží');
  // jen jedna událost za sezónu
  let cnt = 0; for (let i = 0; i < 9; i++) { const g = t.G(); g.phase = 'playing'; g.curEvt = null; g.events = []; g.grose = 900000; g.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.unpaidDebt = 0; }); if (g.fate.pending) t.c('fateChoose', t.c('fatePendingView').options.find(o => o.ok).id); if (t.G().round >= 11) break; t.A.processRound(); if (t.G().fate.pending) cnt++; }
  ok(cnt === 0, 'v téže sezóně se druhá událost nezaloží');
  // S1 bez událostí
  const t1 = fresh('normal', 9); prep(t1, 1, 0); let any = false;
  for (let i = 0; i < 11; i++) { const g = t1.G(); g.phase = 'playing'; g.curEvt = null; g.events = []; g.grose = 900000; g.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.unpaidDebt = 0; }); t1.A.processRound(); if (t1.G().fate.pending) any = true; }
  ok(!any, 'sezóna 1 bez událostí');
}
// ── ceny a škálování ──
{
  const t = fresh('normal'); let G = prep(t, 2, 5); pend(t, 'frost', 2, 5);
  let v = t.c('fatePendingView'); const find = (v, id) => v.options.find(o => o.id === id);
  ok(find(v, 'heat').cost.wood === 6 && find(v, 'blankets').cost.zl === 800, 'S2 Normal: 6 dříví, 8 zl');
  G.season = 4; v = t.c('fatePendingView'); ok(find(v, 'heat').cost.wood === 8 && find(v, 'blankets').cost.zl === 1000, 'S4 ×1,30 (8 dříví, 10 zl): ' + find(v, 'heat').cost.wood + '/' + find(v, 'blankets').cost.zl);
  const te = fresh('easy'); prep(te, 2, 5); pend(te, 'frost', 2, 5); const ve = te.c('fatePendingView');
  ok(find(ve, 'blankets').cost.zl === 600 && find(ve, 'heat').cost.wood === 4, 'Easy ×0,7 (6 zl, 4 dříví): ' + find(ve, 'blankets').cost.zl + '/' + find(ve, 'heat').cost.wood);
}
// ── mrazy: volby ──
{
  const t = fresh('normal'); const G = prep(t, 2, 5); const rng = t.e.calls;
  const g0 = { grose: G.grose, wood: G.res.wood, mor: G.morale };
  pend(t, 'frost', 2, 5); ok(t.c('fateChoose', 'heat') && G.res.wood === g0.wood - 6 && G.grose === g0.grose, 'Přitopit: −6 dříví');
  ok(G.fate.fx.length === 1 && G.fate.fx[0].k === 'frostMorale' && G.fate.fx[0].v === 0 && G.fate.fx[0].from === 29 && G.fate.fx[0].to === 29, 'Přitopit: frostMorale 0 jen tento měsíc');
  ok(G.fate.hist.length === 1 && G.fate.hist[0].opt === 'heat' && G.fate.pending === null, 'historie zapsána');
  prep(t, 2, 5); pend(t, 'frost', 2, 5); t.c('fateChoose', 'blankets'); ok(G.grose === 900000 - 800 && G.fate.fx[0].v === 2, 'Deky a pivo: −8 zl, ztráta −2');
  prep(t, 2, 5); pend(t, 'frost', 2, 5); t.c('fateChoose', 'endure'); ok(G.fate.fx.length === 2 && G.fate.fx.some(e => e.k === 'fatigue' && e.v === 0.1), 'Nechat být: únava +10 %');
  ok(t.e.calls === rng, 'volba nesahá na Math.random');
  // efekt přes processRound: mrazový měsíc s přitopením vs. bez
  const sfrost = seedWhere(t, s => t.c('weatherKindFor', s, 2, 4) === 'frost');
  const run = opt => { const tt = fresh('normal', 11), g = prep(tt, 2, 4); g.wSeed = sfrost; g.fate.pending = { kind: 'frost', season: 2, round: 4 }; if (opt) tt.c('fateChoose', opt); else g.fate.pending = null; tt.A.processRound(); return tt.G(); };
  const none = run(null), heat = run('heat'), endure = run('endure');
  ok(heat.morale - none.morale === 5, 'mráz + Přitopit: nálada o 5 vyšší než bez volby (' + none.morale + ' → ' + heat.morale + ')');
  ok(none.morale - endure.morale === 3, 'mráz + Nechat být: nálada −8 místo −5 (' + none.morale + ' → ' + endure.morale + ')');
  ok(heat.res.wood === none.res.wood - 6, 'Přitopit: −6 dříví navíc (mráz −4 platí dál)');
  const fx = heat.fate.fx; ok(fx.length === 0, 'efekt po měsíci doznělý a uklizený');
}
// ── požár: riziko, jedno hození ──
{
  const t = fresh('normal');
  const sStorm = seedWhere(t, s => t.c('weatherKindFor', s, 2, 7) === 'storm'), sDry = seedWhere(t, s => t.c('weatherKindFor', s, 2, 7) === 'dry');
  const uOf = (s, season, round) => t.c('wxU', s, 4, season, round, 0);
  // seed, kde u ∈ [0,30; 0,35): „hasit sklad“ obstojí, „nechat osudu“ shoří
  const sMid = seedWhere(t, s => t.c('weatherKindFor', s, 2, 7) === 'dry' && uOf(s, 2, 7) >= 0.30 && uOf(s, 2, 7) < 0.35);
  const run = (id, seed) => { const tt = fresh('normal'), G = prep(tt, 2, 7); G.wSeed = seed; pend(tt, 'fire', 2, 7); const w0 = G.res.wood, z0 = G.grose; tt.c('fateChoose', id); return { w0, z0, G: tt.G(), hit: tt.G().fate.hist[0].hit }; };
  const a = run('watch', sMid), b = run('store', sMid), c = run('fate', sMid);
  ok(a.hit === false && b.hit === false && c.hit === true, 'jedno hození: hlídky/sklad v pořádku, osud shoří (u ∈ [0,30;0,35))');
  ok(a.G.grose === a.z0 - 1000 && a.G.res.wood === a.w0, 'Hlídky: −10 zl, dříví beze změny');
  ok(b.G.res.wood === b.w0 - 3 && b.G.fate.fx.some(e => e.k === 'fatigue' && e.v === 0.05), 'Hasit sklad: −3 dříví, únava +5 %');
  ok(c.G.res.wood === c.w0 - Math.round(c.w0 * 0.25) && c.G.grose === c.z0 - 1000, 'Nechat osudu při požáru: −25 % dříví a −10 zl');
  // monotonie: nižší riziko nikdy nedopadne hůř než vyšší
  let viol = 0, hits = { watch: 0, store: 0, fate: 0 }, N = 600;
  for (let i = 0; i < N; i++) { const s = 31 + i * 13; const w = t.c('weatherKindFor', s, 2, 7); if (w === 'normal' || w === 'wet') continue;
    const h = id => run(id, s).hit; const x = h('watch'), y = h('store'), z = h('fate'); hits.watch += x; hits.store += y; hits.fate += z; if ((x && !y) || (y && !z)) viol++; }
  ok(viol === 0 && hits.watch === 0 && hits.store <= hits.fate, 'monotonie rizik (hlídky 0, sklad ≤ osud): ' + JSON.stringify(hits));
  // bouře: vyšší riziko
  const sStormMid = seedWhere(t, s => t.c('weatherKindFor', s, 2, 8) === 'storm' && uOf(s, 2, 8) >= 0.30 && uOf(s, 2, 8) < 0.40);
  const tt = fresh('normal'); const G = prep(tt, 2, 8); G.wSeed = sStormMid; pend(tt, 'fire', 2, 8); tt.c('fateChoose', 'store'); ok(G.fate.hist[0].hit === true, 'bouře: riziko hasit sklad 40 % (u ∈ [0,30;0,40) shoří)');
  const tv = fresh('normal'); const Gv = prep(tv, 2, 8); Gv.wSeed = sStormMid; pend(tv, 'fire', 2, 8);
  const rv = tv.c('fatePendingView').options.find(o => o.id === 'store').risk; ok(Math.abs(rv.p - 0.40) < 1e-9, 'pohled ukazuje šanci 40 % v bouři');
}
// ── lesní řád, vojsko ──
{
  const t = fresh('normal'); const G = prep(t, 2, 6);
  pend(t, 'forest', 2, 6); t.c('fateChoose', 'fee'); ok(G.grose === 900000 - 1200, 'Lesní řád: poplatek −12 zl');
  prep(t, 2, 6); pend(t, 'forest', 2, 6); t.c('fateChoose', 'limit'); ok(G.fate.fx.length === 1 && G.fate.fx[0].k === 'logMult' && G.fate.fx[0].v === 0.7 && G.fate.fx[0].to - G.fate.fx[0].from === 2, 'Omezit kácení: ×0,7 na 3 měsíce');
  ok(Math.abs(t.c('wxFx', 2, 6).logMult - 0.7) < 1e-9 && Math.abs(t.c('wxFx', 2, 8).logMult - 0.7) < 1e-9 && t.c('wxFx', 2, 9).logMult === 1, 'logMult doznívá 3 měsíce (6,7,8)');
  prep(t, 2, 6); pend(t, 'army', 2, 6); const m0 = G.morale; t.c('fateChoose', 'goods');
  ok(G.res.wood === 100 - 8 && G.res.food === 50 - 6 && G.morale === m0 - 3, 'Naturálie: −8 dříví, −6 jídla, nálada −3');
  prep(t, 2, 6); pend(t, 'army', 2, 6); t.c('fateChoose', 'tribute'); ok(G.grose === 900000 - 1500, 'Kontribuce −15 zl');
  const sHide = seedWhere(t, s => t.c('wxU', s, 4, 2, 6, 0) < 0.5), sSafe = seedWhere(t, s => t.c('wxU', s, 4, 2, 6, 0) >= 0.5);
  prep(t, 2, 6); G.wSeed = sHide; pend(t, 'army', 2, 6); const mm = G.morale; t.c('fateChoose', 'hide'); ok(G.grose === 900000 - 3000 && G.morale === mm - 5, 'Schovat zásoby: odhaleno −30 zl, nálada −5');
  prep(t, 2, 6); G.wSeed = sSafe; pend(t, 'army', 2, 6); t.c('fateChoose', 'hide'); ok(G.grose === 900000 && G.morale === 80, 'Schovat zásoby: neodhaleno bez ztráty');
  prep(t, 2, 6); G.wSeed = seedWhere(t, s => t.c('wxU', s, 4, 2, 6, 0) < 0.4); pend(t, 'forest', 2, 6); t.c('fateChoose', 'bribe'); ok(G.grose === 900000 - 600 - 2500, 'Podplatit: −6 zl a pokuta −25 zl při odhalení');
}
// ── nedostupné volby ──
{
  const t = fresh('normal'); const G = prep(t, 2, 5); pend(t, 'frost', 2, 5);
  G.res.wood = 3; G.grose = 100;
  const v = t.c('fatePendingView'), o = id => v.options.find(x => x.id === id);
  ok(!o('heat').ok && !o('blankets').ok && o('endure').ok && !!o('heat').why, 'bez zásob jsou placené volby zašedlé, zdarma jde vždy');
  const before = JSON.stringify(G); ok(t.c('fateChoose', 'heat') === false && JSON.stringify(t.G()) === before, 'nedostupná volba nic nezmění');
  ok(t.c('fateChoose', 'nope') === false, 'neznámá volba se odmítne');
  for (const k of ['frost', 'fire', 'forest', 'army', 'glut']) { const tk = fresh('normal'); const g = prep(tk, 2, 6); g.res.wood = 0; g.res.food = 0; g.grose = 0; g.waldglas = []; pend(tk, k, 2, 6); const vk = tk.c('fatePendingView'); ok(vk.options.some(x => x.ok), 'vždy existuje volba bez nákladů: ' + k); }
}
// ── přesycení ──
{
  const t = fresh('normal'); const G = prep(t, 2, 6); G.mBonus = false;
  G.waldglas = [3, 3, 2, 2, 1, 1]; G.crystal = [4, 4, 3, 3, 2, 2, 5];
  ok(t.c('fateGoods').length === 13, 'sklad zboží se počítá (13)');
  pend(t, 'glut', 2, 6); const v = t.c('fatePendingView'), o = id => v.options.find(x => x.id === id);
  ok(o('dump').ok && !!o('dump').extra && o('wait').ok, 'prodat a počkat jdou');
  G.waldglas = []; G.crystal = []; const v2 = t.c('fatePendingView'); ok(!v2.options.find(x => x.id === 'dump').ok && v2.options.find(x => x.id === 'dump').why, 'prázdný sklad: prodej zašedlý');
}
{
  const t = fresh('normal'); const G = prep(t, 2, 6); G.mBonus = false;
  G.waldglas = [3, 3, 2, 2, 1, 1]; G.crystal = [4, 4, 3, 3, 2, 2, 5];
  pend(t, 'glut', 2, 6); const v = t.c('fatePendingView'); ok(v.options.find(x => x.id === 'hold').ok, 'kolo 6: jarmark (kolo 8) je do 3 měsíců → Držet jde');
  const d = t.c('fateDumpTotal', t.A.get('FATE').kinds.glut.opts[0]);
  const z0 = G.grose, fund0 = G.pieceAcc; t.c('fateChoose', 'dump');
  ok(G.waldglas.length === 0 && G.crystal.length === 0 && G.grose === z0 + d.total && d.n === 13, 'Prodat sklad: vše pryč, +' + d.total);
  ok(G.pieceAcc > fund0, 'prodej krmí fond výrobců');
  const q = t.c('marketSaleQuote', 'waldglas', 0);
  // 70 % vs. běžná nabídka (Normal, bez bonusů): dump ≤ běžný prodej
  const t2 = fresh('normal'); const G2 = prep(t2, 2, 6); G2.wSeed = seedWhere(t2, q => t2.c('weatherKindFor', q, 2, 6) === 'normal'); G2.mBonus = false; G2.waldglas = [3, 3, 2, 2, 1, 1]; G2.crystal = [];
  const reg = t2.c('marketSaleQuote', 'waldglas', 6).total, dd = t2.c('fateDumpTotal', t2.A.get('FATE').kinds.glut.opts[0]).total;
  ok(Math.abs(dd / reg - 0.7) < 0.08, 'sklad za ≈70 % běžné ceny (' + dd + ' / ' + reg + ')');
  const te = fresh('easy'); const Ge = prep(te, 2, 6); Ge.mBonus = false; Ge.waldglas = [3, 3, 2, 2, 1, 1]; Ge.crystal = [];
  const de = te.c('fateDumpTotal', te.A.get('FATE').kinds.glut.opts[0]); ok(Math.abs(de.rate - 0.84) < 1e-9, 'Easy ×1,2 → 84 %');
  // počkat
  const tw = fresh('normal'); const Gw = prep(tw, 2, 6); Gw.waldglas = [3]; pend(tw, 'glut', 2, 6); tw.c('fateChoose', 'wait');
  ok(Math.abs(tw.c('wxFx', 2, 6).priceMult * 1 - tw.c('wxFx', 2, 6).priceMult) < 1e-9 && Gw.fate.fx[0].to - Gw.fate.fx[0].from === 1, 'Počkat: ceny ×0,92 na 2 měsíce');
  // držet: 13 kusů → rozbije se round(13·0,15)=2 nejhorší; ceny ×0,75 do jarmarku (měsíce 6,7)
  const th = fresh('normal'); const Gh = prep(th, 2, 6); Gh.waldglas = [3, 3, 2, 2, 1, 1]; Gh.crystal = [4, 4, 3, 3, 2, 2, 5]; pend(th, 'glut', 2, 6); th.c('fateChoose', 'hold');
  ok(Gh.waldglas.length + Gh.crystal.length === 11 && Gh.waldglas.filter(x => x === 1).length === 0, 'Držet: rozbijí se 2 nejhorší kusy (13 → 11)');
  const fx = Gh.fate.fx[0]; ok(fx.k === 'priceMult' && fx.v === 0.75 && fx.from === 2 * 12 + 6 && fx.to === 2 * 12 + 7, 'Držet: ×0,75 do měsíce před jarmarkem (6–7)');
  Gh.round = 8; ok(th.c('wxFx', 2, 8).priceMult === (th.c('weatherKind', 2, 8) === 'wet' ? 0.9 : 1), 'v jarmarečním měsíci sleva končí');
  const tk = fresh('normal'); const Gk = prep(tk, 2, 9); Gk.waldglas = Array(14).fill(2); pend(tk, 'glut', 2, 9); const vk = tk.c('fatePendingView');
  ok(vk.options.find(x => x.id === 'hold').ok, 'kolo 9: jarmark říjen (11) je za 2 měsíce');
  const tn = fresh('normal'); const Gn = prep(tn, 2, 8); Gn.waldglas = Array(14).fill(2); pend(tn, 'glut', 2, 8); ok(tn.c('fatePendingView').options.find(x => x.id === 'hold').ok, 'kolo 8: další jarmark (11) je za 3 měsíce → jde');
  const tz = fresh('normal'); const Gz = prep(tz, 2, 5); Gz.waldglas = Array(14).fill(2); pend(tz, 'glut', 2, 5); ok(tz.c('fatePendingView').options.find(x => x.id === 'hold').ok, 'kolo 5: jarmark (8) za 3 měsíce → jde');
}
// ── save ──
{
  const t = fresh('normal'), G = prep(t, 2, 5); pend(t, 'frost', 2, 5); G.fate.fx = [{ k: 'logMult', v: 0.7, from: 29, to: 31 }]; G.fate.hist = [{ season: 2, round: 1, kind: 'fire', opt: 'watch', hit: false }];
  const sv = JSON.parse(JSON.stringify(G)); const m = t.c('validateGameSave', sv);
  ok(m.fate.pending && m.fate.pending.kind === 'frost' && m.fate.fx.length === 1 && m.fate.hist.length === 1, 'save: stav události přežije');
  const bad = JSON.parse(JSON.stringify(G)); bad.fate = { fx: [{ k: 'evil', v: 1, from: 1, to: 2 }, { k: 'logMult', v: NaN, from: 1, to: 2 }, { k: 'logMult', v: 0.5, from: 5, to: 2 }, null], pending: { kind: 'zzz', season: 2, round: 3 }, hist: [3], done: -4 };
  const mb = t.c('validateGameSave', bad); ok(mb.fate.fx.length === 0 && mb.fate.pending === null && mb.fate.hist.length === 0 && mb.fate.done === 0, 'save: špatná data se vyčistí');
  const none = JSON.parse(JSON.stringify(G)); delete none.fate; ok(t.c('validateGameSave', none).fate.pending === null, 'save: starší save nové ekonomiky dostane prázdné fate');
  const rnd = t.e.calls; t.c('fatePendingView'); ok(t.e.calls === rnd, 'pohled nesahá na RNG');
  // načtení savu = stejný výsledek hození
  const a = t.c('wxU', G.wSeed, 4, 2, 5, 0), mm = t.c('validateGameSave', JSON.parse(JSON.stringify(G))); ok(mm.wSeed === G.wSeed && t.c('wxU', mm.wSeed, 4, 2, 5, 0) === a, 'hození po načtení stejné');
}
console.log(fail ? `FAILED ${fail}/${n}` : `fate: ${n}/${n} OK`);
process.exit(fail ? 1 : 0);
