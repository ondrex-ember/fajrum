// econ2.js — nová ekonomika Části 1 (Android ECON2): úkolová mzda výrobců, stravné v přípravě, činže panství (kvóta + hotovost).
// Zapíná se jen v nových hrách (G._econ===2, nastaví startGame/restartAfterFall); staré savy a klasické golden scénáře zůstávají beze změny.
// Nic tu nelosuje (žádné Math.random) — pořadí RNG zůstává. Stav: G.pieceAcc (fond výrobců, kr), G.leaseSeasons (dokončené sezóny nájmu), w.lastWage.

function _e2n(v){return typeof v==="number"&&isFinite(v)?v:0;}
function _e2L(cs,en){return G.lang==="cs"?cs:en;}
function econ2(){return typeof ECON2!=="undefined"&&G&&G._econ===2?ECON2:null;}
function _e2Pick(v){return v&&typeof v==="object"?(G.difficulty==="easy"?v.easy:v.normal):v;}
const _E2_HALF=KR/2;   // nejmenší jednotka mezd (půl zlatníku)
function _e2Round50(x){return Math.max(0,Math.round(x/_E2_HALF)*_E2_HALF);}

// Nová hra: zapne novou ekonomiku (jen když je tabulka k dispozici)
function econ2Init(){
  if(typeof ECON2==="undefined")return;
  G._econ=2;G.pieceAcc=0;G.leaseSeasons=0;
}

function econ2IsProducer(w){return WERKSTAT_PROFS.includes(w.prof);}

// Pevná složka mzdy za jedno kolo: příprava = stravné (všichni, bez příplatku), kampaň = sazba pomocného / paušál výrobce + osobní příplatek (min. 1 zl)
function econ2FixedParts(w,isP){
  const e=econ2(), pc=e.piece;
  if(isP){const b=_e2Round50(_e2Pick(pc.prepCash));return{base:b,mod:0,fixed:b};}
  const b=_e2Round50(_e2Pick(econ2IsProducer(w)?pc.retainer:pc.helper));
  const fixed=Math.max(KR,_e2Round50(b+(w.wageMod||0)));
  return{base:b,mod:fixed-b,fixed};
}

// Výplata všech dělníků za kolo: pevná složka + (výrobci) rovný díl fondu, zaokrouhlený nahoru na celé zl.
// Bez výrobců se fond nevyplácí a přenáší se (used = 0).
function econ2WageList(workers,isP,acc){
  const fund=Math.max(0,_e2n(acc)), prod=workers.filter(econ2IsProducer).length;
  const per=prod>0?Math.ceil(fund/prod/KR)*KR:0;
  let total=0;
  const list=workers.map(w=>{
    const fp=econ2FixedParts(w,isP), isProd=econ2IsProducer(w), piece=isProd?per:0;
    total+=fp.fixed+piece;
    return{id:w.id,wage:fp.fixed+piece,fixed:fp.fixed,piece};
  });
  return{list,total,used:prod>0?fund:0,fund,producers:prod,perProducer:per};
}

// Přírůstek fondu z tržby (prodej, dodaná zakázka)
function econ2PieceAdd(kr){
  const e=econ2();
  if(!e||!(kr>0))return;
  G.pieceAcc=_e2n(G.pieceAcc)+Math.round(kr*e.piece.share);
}

// Pevná složka pro místa mimo výplatu (kontrakt na dělníka): klasika 200+příplatek, nová ekonomika = kampaňová pevná mzda
function workerFixedWage(w){
  if(econ2())return econ2FixedParts(w,false).fixed;
  return 200+(w.wageMod||0);
}

// Pohled na příští výplatu dělníka (karta dělníka, Účty, souhrn). Čistě zobrazení, nemění stav.
function workerWageView(w){
  const isP=isPrepMonth(G.round,G.seasonTier||0), easy=G.difficulty==="easy";
  if(!econ2()){
    const total=workerWageFor(w,baseWageRateFor(isP,easy));
    return{econ:false,isP,producer:false,base:total,mod:0,fixed:total,piece:0,total,fund:0,perProducer:0,producers:0};
  }
  const plan=econ2WageList(G.workers,isP,G.pieceAcc), fp=econ2FixedParts(w,isP), isProd=econ2IsProducer(w);
  const piece=isProd?plan.perProducer:0;
  return{econ:true,isP,producer:isProd,base:fp.base,mod:fp.mod,fixed:fp.fixed,piece,total:fp.fixed+piece,
    fund:plan.fund,perProducer:plan.perProducer,producers:plan.producers,share:Math.round(econ2().piece.share*100)};
}
// Součet příští výplaty celé party (Účty, předpověď)
function crewWageNext(){
  const isP=isPrepMonth(G.round,G.seasonTier||0), easy=G.difficulty==="easy";
  if(!econ2())return G.workers.reduce((s,w)=>s+workerWageFor(w,baseWageRateFor(isP,easy)),0);
  return econ2WageList(G.workers,isP,G.pieceAcc).total;
}

// ── činže panství ──
function econ2FamaSum(p){const f=(p||G).fama||{};return _e2n(f.church)+_e2n(f.noble)+_e2n(f.trade);}
// Činže v daném kole (kola 5 a 11) — null, když tu termín není. leaseSeasons = počet dokončených sezón nájmu.
function econ2RentAt(round,leaseSeasons,p){
  const e=econ2();
  if(!e||!e.rent.rounds.includes(round))return null;
  const rr=e.rent, mult=1+rr.famaQuota*Math.min(1,econ2FamaSum(p)/rr.famaFull);
  const grace=_e2n(leaseSeasons)<rr.graceSeasons;
  return{round,grace,cash:grace?0:_e2Pick(rr.cash),cashFull:_e2Pick(rr.cash),
    wood:Math.round(_e2Pick(rr.wood)*mult),potash:Math.round(_e2Pick(rr.potash)*mult),mult};
}
// Nejbližší termín činže (pro Účty): {round, away (kol), ...} nebo null
function econ2RentNext(){
  const e=econ2();
  if(!e)return null;
  const rs=[...e.rent.rounds].sort((a,b)=>a-b);
  const now=G.round, nxt=rs.find(r=>r>=now);
  const nextSeason=nxt===undefined, round=nextSeason?rs[0]:nxt;
  const rd=econ2RentAt(round,_e2n(G.leaseSeasons)+(nextSeason?1:0),G);
  return rd?{...rd,away:(nextSeason?ROUNDS-now+round:round-now)}:null;
}
