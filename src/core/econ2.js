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
  G._econ=2;G.pieceAcc=0;G.leaseSeasons=0;G.fate=fateInit();G.fall=fallInit();
  // W1: osud světa (počasí, osudové události). Záměrně BEZ Math.random — pořadí RNG zůstává (klasické goldeny sdílí Android); zdrojem je čas startu.
  G.wSeed=(_wxMix(Date.now()%4294967296,7,(typeof performance!=="undefined"&&performance.now?Math.floor(performance.now()*1000):0),0,0));
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

// ── jarmark: v měsících E.fair.rounds jsou prodejní ceny ×priceMult; s Weissem se neskládá (marketSaleQuote bere vyšší) ──
function econ2FairMult(){const e=econ2();return e&&e.fair.rounds.includes(G.round)?e.fair.priceMult:1;}
// {on: jarmark je tento měsíc, soon: příští měsíc, mult, round: nejbližší termín (tento nebo příští), away}
function econ2FairInfo(){
  const e=econ2();
  if(!e)return null;
  const rs=[...e.fair.rounds].sort((a,b)=>a-b), nxt=rs.find(r=>r>=G.round);
  return{on:rs.includes(G.round),soon:rs.includes(G.round+1),mult:e.fair.priceMult,round:nxt===undefined?null:nxt,away:nxt===undefined?null:nxt-G.round};
}

// ── E2a: záloha od Faktora Reichela ──
// Stav G.adv = {season, id, taken}: nabídka se zakládá bez RNG v prvním měsíci okna (kolo fromRound) a platí do untilRound.
function econ2AdvPrice(c){   // viditelná cena (Easy včetně +25 %) × (1 − sleva), celé zl
  const e=econ2().advance, vis=c.reward+(G.difficulty==="easy"?Math.round(inZl(c.reward)*0.25)*KR:0);
  return Math.max(KR,Math.round(inZl(vis*(1-e.discount)))*KR);
}
function econ2AdvAmount(price){return Math.floor(price*econ2().advance.share/KR)*KR;}
// Výběr nabídky pro sezónu season v kole round: pool[(season*7+round) mod n]; null, když není co nabídnout. st = stav pro posouzení proveditelnosti.
function econ2AdvPick(season,round,st){
  const e=econ2().advance;
  const taken=new Set([...(G.avail||[]),...(G.contracts||[])].map(x=>x.id));
  const pool=CONTRACT_POOL.filter(c=>!taken.has(c.id)&&c.due>=round+e.minLeft&&c.due<=e.maxDue&&contractFeasible(c,st||G));
  return pool.length?pool[(season*7+round)%pool.length]:null;
}
// Nabídka pro nové kolo nr (volá processRound; vrací nový záznam adv nebo null = beze změny)
function econ2AdvRoll(season,nr,st){
  const e=econ2();
  if(!e)return null;
  const a=e.advance, cur=G.adv;
  if(nr<a.fromRound||nr>a.untilRound)return null;
  if(cur&&cur.season===season)return null;
  const c=econ2AdvPick(season,nr,st);
  return{season,id:c?c.id:null,taken:false};
}
function econ2AdvActive(){return (G.contracts||[]).find(c=>c.adv)||null;}
// Pohled na nabídku: {state:"none"|"offer"|"active"|"done"|"closed", offer, price, advance, blockers[]}. Čistá funkce.
function econ2AdvanceView(){
  const e=econ2();
  if(!e)return null;
  const a=e.advance, act=econ2AdvActive();
  if(act)return{state:"active",contract:act,price:act.reward,advance:act.adv.paid,remaining:act.reward-act.adv.paid,blockers:[]};
  const cur=G.adv;
  if(!cur||cur.season!==G.season||!cur.id)return{state:"none",blockers:[]};
  if(cur.taken)return{state:"done",blockers:[]};
  const c=CONTRACT_POOL.find(x=>x.id===cur.id);
  if(!c||G.round>a.untilRound||c.due<G.round+a.minLeft)return{state:"closed",blockers:[]};
  const price=econ2AdvPrice(c), advance=econ2AdvAmount(price), blockers=[];
  const st=(G.partners&&G.partners.reichel)||{trust:PARTNERS.reichel?PARTNERS.reichel.startTrust:0};
  if((st.trust||0)<a.minTrust)blockers.push({k:"trust",need:a.minTrust,have:Math.floor(st.trust||0)});
  if((G.debt||0)>a.maxDebt)blockers.push({k:"debt",need:a.maxDebt,have:G.debt||0});
  if(!canAcceptContract())blockers.push({k:"slots"});
  return{state:"offer",contract:c,price,advance,remaining:price-advance,blockers};
}
// Přijetí: záloha do kasy hned, zakázka mezi aktivní (pevná cena, bez Easy bonusu a zimní prémie)
function econ2AdvanceAccept(){
  const v=econ2AdvanceView();
  if(!v||v.state!=="offer"||v.blockers.length)return false;
  const L=G.lang, c=v.contract;
  G.contracts.push({...c,id:"adv_"+c.id,buyer:"Reichel",reward:v.price,adv:{paid:v.advance,price:v.price,season:G.season,round:G.round}});
  G.grose+=v.advance;
  G.adv={...G.adv,taken:true};
  G.log.push(`__ECO__📜 ${L==="cs"?"Záloha od Reichela: ":"Advance from Reichel: "}+${mny(v.advance)} · ${L==="cs"?c.cs:c.en} (${L==="cs"?"zbytek":"balance"} ${mny(v.remaining)})`);
  Fx.render();
  return true;
}
