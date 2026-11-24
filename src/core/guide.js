// ── Průvodce „Mistr Kunc" (Easy: zapnutý; Normal: nabídka v úvodním modálu). Stejná pravidla jako Android Guide.kt: ──
//  * výběr kroku (guideCurrentStep) je ČISTÁ funkce stavu: žádné RNG, žádné zápisy; volá ho UI
//  * jediný stav, který průvodce vlastní: G.guide = { on, done:[id], snooze:{id: monthIndex} }
//  * CTA dělá obyčejné akce hry (setWorkerTask, setAlloc, buyItem, …) přesně jako hráč
//  * texty jsou v GUIDE_STEPS (data/guide.js), podmínky tady jako pojmenované funkce
const _gWs=()=>G.workers||[];
const _gRes=k=>(G.res&&G.res[k])||0;
const _gOnTask=t=>_gWs().filter(w=>w.task===t).length;
const _gPrep=()=>isPrepMonth(G.round,G.seasonTier||0);
const _gFoodNeed=()=>Math.ceil(_gWs().length*0.5);
const _gHasBlower=()=>_gWs().some(w=>typeof w.prof==="string"&&w.prof.startsWith("foukat_"));
const _gInv=k=>Array.isArray(G[k])?G[k].length:0;
const _gPans=()=>(G.pReady||0)+(G.pAging||[]).length+(G.furnSlotPanev||[]).filter(x=>x!==null&&x!==undefined).length;
const _gBlowerOffer=()=>(G.trhuNPC||[]).filter(c=>typeof c.prof==="string"&&c.prof.startsWith("foukat_")).sort((a,b)=>a.hireCost-b.hireCost)[0]||null;
const _gMonthIndex=()=>(G.season-1)*ROUNDS+G.round;
const _gWa=k=>(G.wa&&G.wa[k])||0;
const _gDoneHas=id=>!!(G.guide&&Array.isArray(G.guide.done)&&G.guide.done.includes(id));
const _gForestMax=()=>G.forestMax||INIT_FOREST;
const _gFurnType=()=>(G.furnace&&G.furnace.type)||"primitive";

// Výnos políčka na dělníka a měsíc (stejná tabulka jako processRound; průvodce ji jen čte)
const GUIDE_FIELD_YIELD=[0,0,0,0,1,1,2,2,2,2,1,0];
const _gFieldYield=()=>GUIDE_FIELD_YIELD[Math.max(0,Math.min(11,G.round|0))];

// Nejužitečnější úkol pro dělníka, který není potřeba tam, kde je (stejné pořadí jako měřená „guided" strategie)
function _gNeededTask(){
  if(_gFieldYield()>0&&_gRes("food")<_gFoodNeed()*4&&_gOnTask("field")<2)return"field";
  if(_gRes("wood")<30&&G.forest>0&&_gOnTask("logging")===0)return"logging";
  if((_gRes("sand")<30||_gRes("limestone")<16)&&_gOnTask("quarry")===0)return"quarry";
  if(_gRes("water")<16&&_gOnTask("water")===0)return"water";
  if(_gPrep()&&_gRes("clay")<8&&_gOnTask("clay")===0)return"clay";
  if(_gForestMax()>0&&G.forest<_gForestMax()*0.7&&_gOnTask("reforest")===0)return"reforest";
  return"idle";
}
const _gTaskLabel=t=>(G.lang==="cs"?TASK_CS:TASK_EN)[t]||t;
// dělá dělník něco, co teď nemůže nic vyrobit (úkol jen pro přípravu v kampani, …)?
function _gWasted(w){
  const t=w.task;if(!t)return false;
  if(t==="idle"||t==="werkstat")return false;
  return !(_gPrep()?TASKS_PREP:TASKS_CAMP).includes(t);
}
// je zásoba, kterou tento úkol vyrábí, už bohatá? Takový dělník se hodí jinam.
function _gSurplus(w){
  switch(w.task){
    case"quarry":return _gRes("sand")>=60&&_gRes("limestone")>=30;
    case"water":return _gRes("water")>=50;
    case"logging":return _gRes("wood")>=100;
    case"potash":return _gRes("potash")>=24;
    case"clay":return _gRes("clay")>=20;
    case"panev":return _gPans()>=3*furnaceSlotCount();
    default:return false;
  }
}
// dělník, kterého lze přeřadit na [task], aniž by trpěl úkol, který je jediný svého druhu:
// nejdřív odpočívající, pak zbytečná nebo přebytečná práce, pak sázeč, pak zdvojený úkol
function _gFreeWorkerFor(task){
  const w=_gWs().filter(x=>x.task!==task);
  const groups=new Map();w.forEach(x=>{if(!groups.has(x.task))groups.set(x.task,[]);groups.get(x.task).push(x);});
  const dup=[...groups.values()].find(g=>g.length>1);
  return w.find(x=>x.task==="idle")||w.find(_gWasted)||w.find(_gSurplus)||w.find(x=>x.task==="reforest")||(dup?dup[dup.length-1]:null)||null;
}
function _gAssignTo(task){const w=_gFreeWorkerFor(task);if(w)setWorkerTask(w.id,task);}
function allocPreset(){setAlloc("build",0);setAlloc("potash",40);}   // palivo 60 / potaš 40 / stavba 0 (palivo = zbytek)
function craftBlownBatch(itemKey,color,count){
  const it=BLOWN_ITEMS[itemKey];if(!it)return;
  const needsForma=!!it.requiresMould||["dzban","misa","dzban_forma"].includes(itemKey);
  for(let i=0;i<count;i++){
    if(_gInv(color)>=it.qty&&(!needsForma||(G.res.formy||0)>0))craftBlown(itemKey,color);
  }
}

// ───────── kroky (prio: nižší = naléhavější; blokující problémy před učením) ─────────
const GUIDE_STEP_DEFS=[
  {id:"welcome",prio:5,oneShot:true,appears:()=>G.season<=1&&G.round<=1},
  // past: palivo 100 % nechá potaš na 0 % → dělníci na potaši hlásí „málo dřeva" a sklo se nesvaří
  {id:"alloc_fix",prio:8,appears:()=>_gRes("potash")<12&&_gWa("potash")<15,resolved:()=>_gWa("potash")>=15||_gRes("potash")>=12,act:()=>allocPreset()},
  {id:"food",prio:10,appears:()=>_gRes("food")<_gFoodNeed(),resolved:()=>_gRes("food")>=_gFoodNeed()*2,
   canAct:()=>{const f=G.shop&&G.shop.food;return !!f&&f.stock>0&&G.grose>=f.price;},
   act:()=>{for(let i=0;i<3;i++)if(_gRes("food")<_gFoodNeed()*2)buyItem("food");},
   vars:()=>({need:String(_gFoodNeed())})},
  // políčko je jediný volný zdroj jídla: 1–2 jídla na dělníka a měsíc od dubna do listopadu
  {id:"field",prio:11,appears:()=>_gFieldYield()>0&&_gOnTask("field")<2&&_gRes("food")<_gFoodNeed()*4,
   resolved:()=>_gOnTask("field")>=2||_gRes("food")>=_gFoodNeed()*4,
   canAct:()=>_gFreeWorkerFor("field")!==null,act:()=>_gAssignTo("field"),vars:()=>({need:String(_gFoodNeed())})},
  {id:"wages",prio:12,appears:()=>totalWorkerDebt()>0,resolved:()=>totalWorkerDebt()<=0,
   canAct:()=>G.grose>=totalWorkerDebt(),act:()=>payAllOwedWages(),vars:()=>({debt:mny(totalWorkerDebt())})},
  // pánve se dělají jen v přípravě, zrají PANEV_AGE měsíců a vydrží PANEV_DUR taveb
  {id:"crucibles",prio:20,appears:()=>_gPrep()&&G.round<=3&&_gPans()<3*furnaceSlotCount()&&_gOnTask("panev")===0,
   resolved:()=>_gPans()>=3*furnaceSlotCount()||_gOnTask("panev")>0,
   canAct:()=>_gRes("clay")>=2&&_gRes("food")>=1&&_gFreeWorkerFor("panev")!==null,
   act:()=>{const smith=_gWs().find(w=>w.prof==="panvar"&&w.task!=="panev")||_gFreeWorkerFor("panev");if(smith)setWorkerTask(smith.id,"panev");},
   vars:()=>({pans:String(_gPans()),age:String(PANEV_AGE),dur:String(PANEV_DUR)})},
  // klíčová lekce: foukané zboží se prodává za násobek ceny surového skla; chce najatého foukače
  {id:"blowers",prio:25,appears:()=>!_gPrep()&&!_gHasBlower()&&_gBlowerOffer()!==null,resolved:()=>_gHasBlower(),
   canAct:()=>{const o=_gBlowerOffer();return !!o&&G.grose>=o.hireCost&&G.workers.length<MAX_WORKERS;},
   act:()=>{const o=_gBlowerOffer();if(o)hireMarketSpecialist(o.id);},
   vars:()=>{const o=_gBlowerOffer();return{cost:mny(o?o.hireCost:0),name:o?o.name:""};}},
  {id:"first_blow",prio:26,oneShot:true,appears:()=>_gHasBlower()&&!_gPrep()&&!!G.fActive&&_gInv("waldglas")>=1,
   act:()=>craftBlownBatch("holba","waldglas",_gInv("waldglas")),vars:()=>({n:String(_gInv("waldglas"))})},
  // každý měsíc vyjde z pece nové sklo: nejdřív ho vyfoukat, pak prodat
  {id:"blow_more",prio:27,appears:()=>_gDoneHas("first_blow")&&_gHasBlower()&&!_gPrep()&&!!G.fActive&&_gInv("waldglas")>=1,
   act:()=>craftBlownBatch("holba","waldglas",_gInv("waldglas")),vars:()=>({n:String(_gInv("waldglas"))})},
  // zděná pec má druhý slot: dvakrát tolik skla za měsíc (chce i druhou pánev)
  {id:"furnace_stone",prio:28,appears:()=>_gHasBlower()&&_gFurnType()==="primitive"&&G.grose>=4000&&_gRes("wood")>=20&&_gRes("limestone")>=8&&_gRes("clay")>=6,
   resolved:()=>_gFurnType()!=="primitive",act:()=>upgradeFurnace("stone")},
  {id:"low_sand",prio:30,appears:()=>(_gRes("sand")<18||_gRes("limestone")<8)&&_gOnTask("quarry")===0,
   resolved:()=>(_gRes("sand")>=30&&_gRes("limestone")>=16)||_gOnTask("quarry")>0,
   canAct:()=>_gFreeWorkerFor("quarry")!==null,act:()=>_gAssignTo("quarry")},
  {id:"low_potash",prio:31,appears:()=>_gRes("potash")<8&&_gRes("wood")>=18&&_gOnTask("potash")===0,
   resolved:()=>_gRes("potash")>=14||_gOnTask("potash")>0,
   canAct:()=>_gFreeWorkerFor("potash")!==null,act:()=>{_gAssignTo("potash");if(_gWa("potash")<30)allocPreset();}},
  {id:"low_water",prio:32,appears:()=>_gRes("water")<8&&_gOnTask("water")===0,
   resolved:()=>_gRes("water")>=16||_gOnTask("water")>0,
   canAct:()=>_gFreeWorkerFor("water")!==null,act:()=>_gAssignTo("water")},
  // hlína: pánve (2 kusy), zděná pec (6), tier 1 (8)
  {id:"low_clay",prio:35,appears:()=>_gRes("clay")<8&&_gOnTask("clay")===0,
   resolved:()=>_gRes("clay")>=14||_gOnTask("clay")>0,
   canAct:()=>_gFreeWorkerFor("clay")!==null,act:()=>_gAssignTo("clay")},
  {id:"low_wood",prio:33,appears:()=>_gRes("wood")<30&&G.forest>0&&_gOnTask("logging")===0,
   resolved:()=>_gRes("wood")>=60||_gOnTask("logging")>0,
   canAct:()=>_gFreeWorkerFor("logging")!==null,act:()=>_gAssignTo("logging")},
  // potaš pálí 6 dřev na kus: zásoba dvou tuctů stačí, dělník je potřeba jinde
  {id:"potash_enough",prio:34,appears:()=>_gRes("potash")>=24&&_gOnTask("potash")>=1,
   resolved:()=>_gRes("potash")<18||_gOnTask("potash")===0,
   act:()=>{const w=_gWs().filter(x=>x.task==="potash").pop();if(w)setWorkerTask(w.id,_gNeededTask());},
   vars:()=>{const w=_gWs().filter(x=>x.task==="potash").pop();return{potash:String(_gRes("potash")),worker:w?w.name:"",task:_gTaskLabel(_gNeededTask())};}},
  {id:"unsold_glass",prio:40,appears:()=>!_gPrep()&&_gInv("waldglas")>=3&&G.grose<2000,
   resolved:()=>_gInv("waldglas")<3||G.grose>=2000,vars:()=>({n:String(_gInv("waldglas"))})},
  {id:"forest_low",prio:45,appears:()=>_gForestMax()>0&&G.forest<=_gForestMax()*0.3&&_gOnTask("reforest")===0,
   resolved:()=>_gOnTask("reforest")>0||G.forest>_gForestMax()*0.5,
   canAct:()=>_gFreeWorkerFor("reforest")!==null,act:()=>_gAssignTo("reforest"),
   vars:()=>({forest:String(G.forest),max:String(_gForestMax())})},
  {id:"tier1",prio:50,appears:()=>(G.seasonTier||0)===0&&_gFurnType()!=="primitive"&&_gRes("stone")>=15&&_gRes("wood")>=20&&_gRes("clay")>=8&&G.grose>=2500,
   resolved:()=>(G.seasonTier||0)>=1,act:()=>upgradeSeasonTier(1)},
  {id:"contracts_fama",prio:60,oneShot:true,lesson:true,appears:()=>(G.avail||[]).length>0},
];
const _GUIDE_BY_ID=Object.fromEntries(GUIDE_STEP_DEFS.map(s=>[s.id,s]));
const _guideCanAct=s=>!s.canAct||s.canAct();

// ───────── stav ─────────
function guideState(){
  if(!G.guide||typeof G.guide!=="object")G.guide={on:false,done:[],snooze:{}};
  if(!Array.isArray(G.guide.done))G.guide.done=[];
  if(!G.guide.snooze||typeof G.guide.snooze!=="object")G.guide.snooze={};
  return G.guide;
}
const guideOn=()=>!!(G.guide&&G.guide.on===true);
// nová hra: Easy zapnuto, Normal vypnuto (nabízí se v úvodním modálu)
function guideInitForDifficulty(diff){G.guide={on:diff==="easy",done:[],snooze:{}};}

// Krok, který se má teď ukázat, nebo null. Čistá funkce stavu. Krok, jehož tlačítko nejde použít, se ukáže jen když není žádný jiný.
function guideCurrentStep(){
  if(!guideOn())return null;
  if(G.phase!=="playing")return null;
  const done=G.guide.done||[], snooze=G.guide.snooze||{}, now=_gMonthIndex();
  let blocked=null, lesson=null;
  for(const s of [...GUIDE_STEP_DEFS].sort((a,b)=>a.prio-b.prio)){
    if(done.includes(s.id))continue;
    const until=snooze[s.id];
    if(until!==undefined&&now<=Math.trunc(until))continue;
    if(!s.appears())continue;
    if(s.resolved&&s.resolved())continue;
    if(s.lesson){if(!lesson)lesson=s;continue;}
    if(!s.act||_guideCanAct(s))return s;
    if(!blocked)blocked=s;
  }
  return blocked||lesson;
}

// ───────── akce ─────────
function setGuide(on){const g=guideState();g.on=!!on;if(on)g.snooze={};Fx.render();}
// „Později": skryj tento krok do konce měsíce
function guideSnooze(id){if(!_GUIDE_BY_ID[id])return;guideState().snooze[id]=_gMonthIndex();Fx.render();}
// tlačítko CTA (nebo „Rozumím" u informačního kroku). Jednorázové kroky zůstanou hotové; krok bez akce, který se může vracet, se jen skryje pro tento měsíc.
function guideDo(id){
  const s=_GUIDE_BY_ID[id];if(!s)return;
  if(!guideOn())return;
  if(s.act&&_guideCanAct(s))s.act();
  if(s.oneShot){const d=guideState().done;if(!d.includes(id))d.push(id);}
  else if(!s.act)guideState().snooze[id]=_gMonthIndex();
  Fx.render();
}
// karta pro UI: text s doplněnými proměnnými, CTA, nápověda, záložka
function guideView(){
  const s=guideCurrentStep();if(!s)return null;
  const t=GUIDE_STEPS[s.id];if(!t)return null;
  const L=G.lang==="en"?"en":"cs";
  const vars=s.vars?s.vars():{};
  const fill=x=>x==null?null:Object.entries(vars).reduce((r,[k,v])=>r.split("{"+k+"}").join(v),x);
  const enabled=!s.act||_guideCanAct(s);
  return{id:s.id,text:fill(t[L])||"",anim:t.anim||"talk",ctaLabel:fill(t["cta_"+L]),ctaEnabled:enabled,
    ctaHint:enabled?null:fill(t["hint_"+L]),openTab:t.tab||null};
}
