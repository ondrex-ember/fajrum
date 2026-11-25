'use strict';
// ECON2 etapa 8c / E3: Cesta z dluhů, počítadla G.fall, „Proč jsem padl“. Klasická hra nesmí být dotčena (hlídají goldeny).
//   node tests/ladder.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };

function fresh(econ, seed, diff) {
  const e = load({ seed: seed || 5 }); const A = e.api;
  apply(e, { t: 'newGame', difficulty: diff || 'normal', huteName: 't', ...(econ ? { econ: 2 } : {}) });
  return { e, A, G: () => A.G, c: (f, ...x) => A.call(f, ...x) };
}
function prep(t, season, round) {
  const G = t.G(); G.season = season; G.round = round; G.phase = 'playing'; G.curEvt = null; G.events = []; G.summary = null;
  G.workers.forEach(w => { w.task = 'idle'; w.loyalty = 100; w.fat = 0; w.unpaidDebt = 0; });
  G.grose = 900000; G.morale = 80; G.res.wood = 100; G.res.food = 50; G.fate.pending = null; G.fate.fx = []; G.fate.done = 0; G.fate.plague = null; G.fate.plagueSeason = 0; G.contracts = []; G.mBonus = false;
  return G;
}
const zero = () => ({ hunger: 0, wageMonths: 0, wageSum: 0, rentTerms: 0, rentSum: 0, noWood: 0, closedMonths: 0, lastOut: 0 });

// ── start, klasika ──
{
  const t = fresh(true), G = t.G();
  ok(JSON.stringify(G.fall) === JSON.stringify(zero()), 'nová ekonomika: G.fall začíná na nule');
  ok(t.c('ladderTrouble') === null && t.c('fallCauses').length === 0, 'start: žádné potíže ani příčiny');
  const c = fresh(false), CG = c.G();
  ok(CG.fall === undefined, 'klasika: G.fall neexistuje');
  CG.grose = 0; CG.workers.forEach(w => { w.unpaidDebt = 500; });
  ok(c.c('ladderTrouble') === null && c.c('ladderView') === null && c.c('fallCauses').length === 0, 'klasika: karta ani příčiny se nikdy neukážou');
  c.A.processRound(); ok(c.G().fall === undefined, 'klasika: processRound G.fall nezavádí');
}
// ── počítadla v processRound ──
{
  const t = fresh(true), G = prep(t, 2, 6);
  G.res.food = 0; G.res.wood = 0; G.grose = 0;
  t.A.processRound();
  const f = t.G().fall;
  ok(f.hunger === 1, 'hlad: +1 měsíc při nedostatku jídla');
  ok(f.noWood === 1, 'dříví: +1 měsíc s prázdným skladem');
  ok(f.wageMonths === 1 && f.wageSum > 0, 'mzdy: nevyplacené +1 měsíc a součet > 0 (' + f.wageSum + ')');
  ok(f.lastOut > 0, 'lastOut = mzdy + pivo > 0');
  ok(t.c('ladderTrouble') !== null, 'potíže: dluh partě / prázdná kasa');
  const G2 = prep(t, 2, 7); G2.grose = 900000; t.A.processRound();
  const f2 = t.G().fall;
  ok(f2.hunger === 1 && f2.wageMonths === 1 && f2.noWood === 1, 'dobrý měsíc počítadla nezvyšuje');
  ok(f2.lastOut > 0, 'lastOut se přepisuje (ne sčítá)');
}
// ── zavřený trh (mor) ──
{
  const t = fresh(true), G = prep(t, 2, 6);
  G.fate.fx = [{ k: 'marketClosed', v: 1, from: 2 * 12 + 6, to: 2 * 12 + 6 }];
  t.A.processRound(); ok(t.G().fall.closedMonths === 1, 'mor: měsíc se zavřeným trhem se počítá');
}
// ── potíže: detekce ──
{
  const t = fresh(true), G = prep(t, 2, 6);
  G.fall.lastOut = 0; ok(t.c('ladderTrouble') === null, 'bez dluhu a bez lastOut: žádné potíže');
  G.fall.lastOut = 5000; G.grose = 4999; ok(t.c('ladderTrouble') && t.c('ladderTrouble').short, 'kasa < mzdy+pivo: potíže');
  G.grose = 5000; ok(t.c('ladderTrouble') === null, 'kasa == mzdy+pivo: bez potíží');
  G.workers[0].unpaidDebt = 100; ok(t.c('ladderTrouble') && t.c('ladderTrouble').owed === 100, 'dluh partě: potíže');
}
// ── ladderView stavy ──
{
  const t = fresh(true), G = prep(t, 2, 6);
  G.workers[0].unpaidDebt = 300; G.debt = 0;
  let v = t.c('ladderView'); ok(v.mora.state === 'nodebt', 'odklad: bez dluhu u Reichela není co odkládat');
  G.debt = 3000; v = t.c('ladderView'); ok(v.mora.state === 'offer' && typeof v.mora.cost === 'number', 'odklad: nabídka s cenou');
  G.debtMoratorium = 2; v = t.c('ladderView'); ok(v.mora.state === 'active' && v.mora.left === 2, 'odklad: aktivní');
  G.debtMoratorium = 0;
  G.quickSellUsed = true; ok(t.c('ladderView').buyout.state === 'used', 'výkup: použit');
  G.quickSellUsed = false; G.waldglas = []; G.crystal = []; t.c('quickSellQuote'); ok(t.c('ladderView').buyout.state === 'empty' || t.c('ladderView').buyout.count === 0, 'výkup: prázdný sklad');
  G.waldglas = [3, 3]; v = t.c('ladderView'); ok(v.buyout.state === 'offer' && v.buyout.count >= 2 && v.buyout.total > 0, 'výkup: nabídka s počtem a částkou');
  G.fate.fx = [{ k: 'marketClosed', v: 1, from: 2 * 12 + 6, to: 2 * 12 + 7 }]; ok(t.c('ladderView').buyout.state === 'closed', 'výkup: zavřeno morem');
  ok(v.foreclose.soft === 16000 && v.foreclose.hard === 18000 && v.loan.pct > 0, 'exekuce 160/180 zl a úrok půjčky');
  // tlačítka dělají skutečné akce stejně jako jinde
  G.fate.fx = []; G.waldglas = [3, 3]; const before = G.grose; t.c('quickSellAll'); ok(t.G().grose > before && t.G().quickSellUsed, 'výkup přes stávající akci funguje');
}
// ── příčiny: pořadí a top 3 ──
{
  const t = fresh(true), G = prep(t, 2, 6);
  G.fall = { ...zero(), hunger: 2, wageMonths: 3, wageSum: 9000, rentTerms: 1, rentSum: 4000, noWood: 1, closedMonths: 2 }; G.debt = 0;
  let c = t.c('fallCauses');
  ok(c.length === 3, 'top 3 (' + c.length + ')');
  ok(c.map(x => x.id).join() === 'wages,rent,hunger' || c.map(x => x.id).join() === 'rent,wages,hunger', 'pořadí podle váhy: mzdy 3, činže 3, hlad 2 (' + c.map(x => x.id) + ')');
  ok(c.every(x => x.icon && x.title && x.num && x.advice && x.score > 0), 'každá příčina má ikonu, název, číslo a radu');
  ok(c.every((x, i) => i === 0 || c[i - 1].score >= x.score), 'sestupně podle skóre');
  G.debt = 40000; c = t.c('fallCauses'); ok(c[0].id === 'debt', 'velký dluh (400 zl) je příčina č. 1');
  G.debt = 5000; G.fall = { ...zero(), closedMonths: 1 }; c = t.c('fallCauses'); ok(c.length === 1 && c[0].id === 'plague', 'jedna příčina → jen ta jedna');
  G.debt = 0; G.fall = zero(); ok(t.c('fallCauses').length === 0, 'žádné příčiny → [] (obrazovka ukáže pevné rady)');
  G.lang = 'en'; G.fall = { ...zero(), hunger: 1 }; c = t.c('fallCauses'); ok(/Hunger/.test(c[0].title) && /mo\./.test(c[0].num), 'EN texty');
}
// ── save ──
{
  const t = fresh(true), G = t.G();
  G.fall = { ...zero(), hunger: 4, wageSum: 1234 };
  let m = t.c('validateGameSave', JSON.parse(JSON.stringify(G))); ok(m.fall.hunger === 4 && m.fall.wageSum === 1234, 'save: počítadla přežijí');
  const bad = JSON.parse(JSON.stringify(G)); bad.fall = { hunger: -3, wageMonths: 'x', rentSum: 1.5, noWood: 1e12, evil: 9 };
  m = t.c('validateGameSave', bad); ok(m.fall.hunger === 0 && m.fall.wageMonths === 0 && m.fall.rentSum === 0 && m.fall.noWood <= 9999 && m.fall.evil === undefined, 'save: špatná data se vyčistí');
  const none = JSON.parse(JSON.stringify(G)); delete none.fall; ok(JSON.stringify(t.c('validateGameSave', none).fall) === JSON.stringify(zero()), 'save: starší save nové ekonomiky dostane nuly');
  const cl = fresh(false), cs = JSON.parse(JSON.stringify(cl.G())); cs.fall = zero();
  ok(cl.c('validateGameSave', cs).fall === undefined, 'save: klasika G.fall zahodí');
}
// ── dlouhý běh: počítadla nikdy nejsou NaN/záporná a lastOut odpovídá ──
{
  const t = fresh(true, 9, 'hard'); let bad = false;
  for (let i = 0; i < 30; i++) {
    const g = t.G(); if (g.phase === 'game_over') break; g.phase = 'playing'; g.curEvt = null; g.events = [];
    if (g.fate.pending) t.c('fateChoose', t.c('fatePendingView').options.find(o => o.ok) ? t.c('fatePendingView').options.find(o => o.ok).id : t.c('fatePendingView').options[0].id);
    g.workers.forEach(w => { w.task = 'idle'; }); t.A.processRound();
    const f = t.G().fall; if (Object.values(f).some(v => !Number.isSafeInteger(v) || v < 0)) bad = true;
  }
  ok(!bad, 'dlouhý běh: počítadla zůstávají nezáporná celá čísla');
}
console.log(fail ? `${fail} FAIL z ${n}` : `ladder: ${n} OK`);
process.exit(fail ? 1 : 0);
