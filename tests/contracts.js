'use strict';
// Zakázky 1b-1 (core/contracts.js, process-round krok 7): minQ, nejnižší vyhovující kus, Fama podle odměny, 5 nabídek, druhá vlna, staré zakázky.
//   node tests/contracts.js
const { load } = require('./lib/engine.js');
const { apply } = require('./golden.js');
let fail = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fail++; console.log('FAIL: ' + msg); } };
const fresh = (seed, diff) => { const e = load({ seed }); apply(e, { t: 'newGame', difficulty: diff || 'normal', huteName: 'test' }); return e; };
const call = (e, f, ...a) => e.api.call(f, ...a);

// pool + pravidla
{
  const e = fresh(1); const A = e.api, pool = A.get('CONTRACT_POOL'), R = A.get('CONTRACT_RULES');
  ok(pool.length === 24, 'pool 24: ' + pool.length);
  ok(pool.every(c => c.minQ >= 3 && c.minQ <= 5 && c.due >= 7 && c.due <= 11), 'každá zakázka má minQ 3–5 a termín 7–11');
  ok(pool.every(c => new RegExp('★'.repeat(c.minQ) + '\\)').test(c.cs) && /min ★/.test(c.en)), 'texty uvádějí minQ');
  ok(new Set(pool.map(c => c.id)).size === 24, 'ID jsou unikátní');
  ok(R.offers === 5 && R.famaBase === 2 && R.famaPer === 2000 && R.famaMax === 8 && R.wave2Round === 4 && R.wave2Offers === 2 && R.wave2MinLeft === 3, 'tabulka pravidel');
  ok(A.G.avail.length === 5, 'čistý start: 5 nabídek (' + A.G.avail.length + ')');
  ok(new Set(A.G.avail.map(c => c.id)).size === 5, 'nabídky bez duplicit');
}

// have / take
{
  const e = fresh(2); const c4 = { id: 'x', item: 'waldglas', qty: 3, reward: 6100, due: 9, buyer: 'Weiss', minQ: 4 };
  const inv = [3, 5, 4, 5];
  ok(call(e, 'contractHave', inv, c4) === 3, 'have: [3,5,4,5] od ★4 = 3');
  call(e, 'contractTake', inv, c4); ok(JSON.stringify(inv) === '[3]', 'take: odevzdá 4,5,5? zůstane 3 — ' + JSON.stringify(inv));
  const inv2 = [3, 5, 4, 5, 4, 3]; call(e, 'contractTake', inv2, { ...c4, qty: 3 });
  ok(JSON.stringify(inv2.slice().sort()) === '[3,3,5]', 'take: nejnižší vyhovující (4,4,5), lepší zůstanou — ' + JSON.stringify(inv2));
  ok(call(e, 'contractHave', [3, 3, 5, 5], c4) === 2, 'have: [3,3,5,5] od ★4 = 2');
  const old = { id: 'o', item: 'waldglas', qty: 2, reward: 1800, due: 7, buyer: 'Weiss' };
  ok(call(e, 'contractHave', [1, 2, 3], old) === 3, 'starý save bez minQ: jakýkoli kus');
  const inv3 = [1, 2, 3]; call(e, 'contractTake', inv3, old); ok(JSON.stringify(inv3) === '[1]', 'starý save: odevzdají se poslední kusy');
}

// Fama
{
  const e = fresh(3); const g = r => call(e, 'contractFamaGain', { reward: r });
  ok(g(2700) === 3 && g(6100) === 5 && g(10200) === 7 && g(15700) === 8 && g(40000) === 8 && g(0) === 2, `Fama: ${g(2700)},${g(6100)},${g(10200)},${g(15700)},${g(40000)} (čekám 3,5,7,8,8)`);
}

// splnění přes processRound: nejnižší vyhovující kus, Fama, odměna, zůstatek
{
  const e = fresh(4); const A = e.api;
  A.G.round = 2;   // příprava: pec netaví, zásoba se v kole nemění
  A.G.waldglas = [3, 5, 4, 5]; A.G.crystal = [];
  A.G.contracts = [{ id: 'c1', item: 'waldglas', qty: 3, reward: 6100, due: 9, buyer: 'Weiss', minQ: 4, cs: 'x', en: 'x' }];
  A.G.fama = { church: 0, noble: 0, trade: 0 }; A.G.workers.forEach(w => { w.task = 'idle'; }); A.G.fActive = false;
  const g0 = A.G.grose; A.processRound();
  ok(A.G.contracts.length === 0, 'zakázka splněna');
  ok(JSON.stringify(A.G.waldglas) === '[3]', 'v zásobě zůstal kus ★3 — ' + JSON.stringify(A.G.waldglas));
  ok(A.G.fama.trade === 5, 'Fama obchod +5 (2+floor(6100/2000)) = ' + A.G.fama.trade);
  ok(A.G.summary.contractIncome === 6100, 'odměna na Normal bez bonusu Easy: ' + A.G.summary.contractIncome);
}
// nesplnitelná (málo kvalitních kusů): nic se neodevzdá
{
  const e = fresh(5); const A = e.api;
  A.G.round = 2;   // příprava: pec netaví, zásoba se v kole nemění
  A.G.waldglas = [3, 3, 5, 5]; A.G.crystal = [];
  A.G.contracts = [{ id: 'c1', item: 'waldglas', qty: 3, reward: 6100, due: 9, buyer: 'Weiss', minQ: 4, cs: 'x', en: 'x' }];
  A.G.workers.forEach(w => { w.task = 'idle'; }); A.G.fActive = false; A.processRound();
  ok(A.G.contracts.length === 1 && JSON.stringify(A.G.waldglas) === '[3,3,5,5]', 'málo ★4+ kusů → nesplněno, sklad beze změny');
  const lines = call(e, 'contractLines', A.G.contracts[0]); ok(lines[0].have === 2 && lines[0].need === 3 && lines[0].minQ === 4, 'počítadlo ukazuje jen kusy ★4+: ' + lines[0].have);
}
// vypršení: −4 Fama beze změny
{
  const e = fresh(6); const A = e.api;
  A.G.round = 3; A.G.waldglas = []; A.G.contracts = [{ id: 'c1', item: 'waldglas', qty: 3, reward: 6100, due: 2, buyer: 'Opat', minQ: 4, cs: 'x', en: 'x' }];
  A.G.fama = { church: 6, noble: 0, trade: 0 }; A.G.workers.forEach(w => { w.task = 'idle'; }); A.G.fActive = false; A.processRound();
  ok(A.G.contracts.length === 0 && A.G.fama.church === 2, 'vypršení −4: ' + A.G.fama.church);
}
// starý save: zakázka bez minQ + stará Fama (tabulka pravidel ji ale škáluje i tady)
{
  const e = fresh(7); const A = e.api;
  A.G.round = 2;   // příprava: pec netaví, zásoba se v kole nemění
  A.G.waldglas = [1, 1]; A.G.crystal = [];
  A.G.contracts = [{ id: 'c4', item: 'waldglas', qty: 2, reward: 1200, due: 9, buyer: 'Weiss', cs: 'x', en: 'x' }];
  A.G.workers.forEach(w => { w.task = 'idle'; }); A.G.fActive = false; A.processRound();
  ok(A.G.contracts.length === 0, 'stará zakázka bez minQ se splní libovolnými kusy');
}

// druhá vlna: kolo 4, max 2 nové, bez duplicit, due ≥ kolo+3, jen jednou
{
  let waves = 0, total = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const e = fresh(seed, seed % 2 ? 'easy' : 'normal'); const A = e.api; A.G._contractModalPending = false;
    A.G.workers.forEach(w => { w.task = 'idle'; });
    const before0 = A.G.avail.map(c => c.id);
    for (let r = 0; r < 4; r++) { A.G.curEvt = null; A.G.events = []; A.G.phase = 'playing'; A.processRound(); if (A.G.phase === 'game_over') break; }
    if (A.G.phase === 'game_over') continue;
    // po zpracování kola 3 (round → 4) vlna ještě není
    ok(A.G.avail.length === 5 + 0 || A.G.avail.length === 5, `seed ${seed}: před vlnou ${A.G.avail.length} nabídek`);
    A.G.curEvt = null; A.G.events = []; A.G.phase = 'playing'; A.G.log = A.G.log || [];
    ok(A.G.round === 4, 'kolo 4 před zpracováním: ' + A.G.round);
    const had = A.G.avail.length; A.processRound(); total++;
    const added = A.G.avail.length - had;
    ok(added >= 0 && added <= 2, `seed ${seed}: vlna přidala ${added}`);
    ok(new Set(A.G.avail.map(c => c.id)).size === A.G.avail.length, `seed ${seed}: bez duplicit`);
    ok(A.G.avail.slice(had).every(c => c.due >= 4 + 3 && !(A.G.contracts || []).find(x => x.id === c.id)), `seed ${seed}: nové nabídky mají splatnost ≥ 7`);
    if (added) { waves++; ok(A.G.log.some(l => /Kupci přinesli další zakázky/.test(l)), 'událost vlny v logu'); }
    // další kolo vlnu neopakuje
    A.G.curEvt = null; A.G.events = []; A.G.phase = 'playing'; const n5 = A.G.avail.length; A.processRound(); ok(A.G.avail.length === n5, `seed ${seed}: vlna jen jednou`);
  }
  ok(waves >= 15, `vlna proběhla ve ${waves}/${total} hrách`);
}

// limit slotů a přijetí
{
  const e = fresh(8); const A = e.api; A.G.contracts = [];
  const ids = A.G.avail.map(c => c.id); let acc = 0;
  ids.forEach(id => { if (call(e, 'acceptContract', id)) acc++; });
  ok(acc === 3 && A.G.contracts.length === 3 && A.G.avail.length === 2, `přijmout lze 3 ze 5 (přijato ${acc})`);
  ok(A.G.contracts.every(c => c.minQ > 0), 'přijaté mají minQ');
}
// přechod sezóny: znovu 5 nabídek
{
  const e = fresh(9); const A = e.api; A.G.workers.forEach(w => { w.task = 'idle'; });
  ok(call(e, 'freshContracts', A.G).length === 5, 'freshContracts: 5 nabídek');
}
// čistota pohledu
{
  const e = fresh(10); const A = e.api; const s = JSON.stringify(A.G);
  A.G.contracts.push({ ...A.G.avail[0] }); const t = JSON.stringify(A.G);
  call(e, 'contractStatus', A.G.contracts[0]); call(e, 'contractFamaInfo', A.G.contracts[0], 'market');
  ok(JSON.stringify(A.G) === t && s !== '', 'contractStatus/contractFamaInfo nemění stav');
}
console.log(`contracts: ${n - fail}/${n} checks ${fail ? 'FAILED' : 'OK'}`);
process.exit(fail ? 1 : 0);
