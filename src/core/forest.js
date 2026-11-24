// forest.js — správa lesa (Etapa 1c; port Android Forest.kt + PresentForest.kt). Bez DOMu, bez RNG.
// Každá parcela je v právě jednom stádiu:
//   těžitelný = G.forest        (starý jediný klíč: Průvodce, pills, skóre i těžba ho čtou beze změny; 4 🪵/parcela)
//   mlází     = G.forest2.y     (příští zima → těžitelný)
//   sazenice  = G.forest2.z     (příští zima → mlází)
//   paseka    = forestMax − forest − y − z   (odvozeno)
// Lesní práce (LP): ruční (`man`, plní se každou sezónu) + nádeníci (`hands`, `pool`). Akce utrácejí LP a účinkují hned.
// Hráč, který záložku Les neotevře, hraje přesně jako dřív: stádia vznikají jen z toho, co hráč sám zasadí / koupí.
// Čísla jsou v data/forest-rules.js.

function forestRule(key,def){return typeof FOREST_RULES!=="undefined"&&FOREST_RULES[key]!==undefined?FOREST_RULES[key]:def;}
function _fL(cs,en){return G.lang==="cs"?cs:en;}

function forestInitRecord(){
  return{y:0,z:0,man:forestRule("manualLP",3),hands:0,pool:0,plants:0,thins:0,resins:0,reserve:0,emerg:false,hist:[]};
}
// Očištění záznamu z uloženého/importovaného savu (validateGameSave): chybějící klíče výchozí, čísla do mezí, hist ≤ histMax čísel.
function forestSanitize(raw){
  const d=forestInitRecord();
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return d;
  const int=(v,lo,hi,def)=>typeof v==="number"&&isFinite(v)?Math.min(hi,Math.max(lo,Math.floor(v))):def;
  const handMax=forestRule("handMax",2), handLP=forestRule("handLP",3), manLP=forestRule("manualLP",3);
  const hands=int(raw.hands,0,handMax,0);
  const hist=(Array.isArray(raw.hist)?raw.hist:[]).filter(x=>typeof x==="number"&&isFinite(x)).map(x=>Math.min(200,Math.max(0,x)));
  return{y:int(raw.y,0,200,0),z:int(raw.z,0,200,0),man:int(raw.man,0,manLP,manLP),hands,pool:int(raw.pool,0,hands*handLP,hands*handLP),
    plants:int(raw.plants,0,100,0),thins:int(raw.thins,0,100,0),resins:int(raw.resins,0,100,0),
    reserve:int(raw.reserve,0,2,0),emerg:raw.emerg===true,hist:hist.slice(-forestRule("histMax",8))};
}
// Záznam lesa; starý save bez klíče se doplní výchozím (validateGameSave to dělá při načtení, tady pojistka)
function forestRec(){
  if(!G.forest2||typeof G.forest2!=="object"||Array.isArray(G.forest2))G.forest2=forestInitRecord();
  return G.forest2;
}
function _fn(v){return typeof v==="number"&&isFinite(v)?v:0;}
function forestMaxParcels(){return G.forestMax||INIT_FOREST;}
function forestPaseka(){const f=forestRec();return Math.max(0,forestMaxParcels()-G.forest-_fn(f.y)-_fn(f.z));}
// Kolik parcel zasadí jedna akce (nebo jeden pracovní měsíc nádeníka)
function forestPlantPer(){return G.difficulty==="easy"?forestRule("plantEasy",3):forestRule("plantNormal",2);}
// Výstavky: 0/1/2 stupně = 0/10/20 % těžitelného se nekácí
function forestProtect(standing){
  const tier=_fn(forestRec().reserve);
  if(tier<=0||standing<=0)return 0;
  return Math.min(standing,Math.ceil(standing*forestRule("reservePct",10)/100*tier));
}
function forestLP(){const f=forestRec();return _fn(f.man)+_fn(f.pool);}
function forestAllowed(){return G.phase!=="intro"&&G.phase!=="game_over";}

function forestSpendLP(){
  const f=forestRec();
  if(_fn(f.man)>0){f.man=f.man-1;return true;}
  if(_fn(f.pool)>0){f.pool=f.pool-1;return true;}
  G.log.push(`__EVT__🪓 ${_fL("Došly lesní práce — počkej na další sezónu nebo najmi nádeníka.","Out of forest labour — wait for the next season or hire a hand.")}`);
  return false;
}

// ── akce hráče ───────────────────────────────────────────────
// 🌱 Sázet: paseka → sazenice (1 LP). Každá [plantBonusEvery]. výsadba sezóny dá o parcelu víc.
function forestPlant(){
  if(!forestAllowed())return;
  const f=forestRec(), pas=forestPaseka();
  if(pas<=0){G.log.push(`__EVT__▫️ ${_fL("Není kam sázet — v lese není žádná paseka.","Nowhere to plant — the forest has no clearing.")}`);Fx.render();return;}
  if(!forestSpendLP()){Fx.render();return;}
  const n=_fn(f.plants)+1, every=forestRule("plantBonusEvery",2);
  const bonus=every>0&&n%every===0?1:0;
  const put=Math.min(pas,forestPlantPer()+bonus);
  f.plants=n;f.z=_fn(f.z)+put;
  G.log.push(`__PROD__🌱 ${_fL("Výsadba","Planting")}: +${put} ${_fL("sazenic","seedlings")}`);
  Fx.render();
}
// ✂️ Probírka: jedna parcela mlází dorůstá hned (1 LP, omezeno na sezónu)
function forestThin(){
  if(!forestAllowed())return;
  const f=forestRec();
  if(_fn(f.y)<1){G.log.push(`__EVT__🌿 ${_fL("Žádné mlází k probírce.","No saplings to thin.")}`);Fx.render();return;}
  if(_fn(f.thins)>=forestRule("thinMax",4)){G.log.push(`__EVT__✂️ ${_fL("Probírka je tuto sezónu vyčerpaná.","Thinning is used up this season.")}`);Fx.render();return;}
  if(!forestSpendLP()){Fx.render();return;}
  f.y=f.y-1;f.thins=_fn(f.thins)+1;
  G.forest=G.forest+1;
  G.log.push(`__PROD__✂️ ${_fL("Probírka: 1 parcela mlází dorostla hned","Thinning: 1 sapling parcel matured at once")}`);
  Fx.render();
}
// 🫙 Smolaření: smůla ze stojícího lesa, parcely zůstanou (1 LP, omezeno na sezónu)
function forestResin(){
  if(!forestAllowed())return;
  const f=forestRec();
  if(G.forest<1){G.log.push(`__EVT__🌲 ${_fL("Není z čeho smolařit — les je vykácený.","Nothing to tap — the forest is gone.")}`);Fx.render();return;}
  if(_fn(f.resins)>=forestRule("resinMax",3)){G.log.push(`__EVT__🫙 ${_fL("Smolaření je tuto sezónu vyčerpané.","Resin tapping is used up this season.")}`);Fx.render();return;}
  if(!forestSpendLP()){Fx.render();return;}
  const y=forestRule("resinYield",1);
  G.res.pitch=(G.res.pitch||0)+y;
  f.resins=_fn(f.resins)+1;
  G.log.push(`__PROD__🫙 ${_fL("Smolaření","Resin tapping")}: +${y} 🌲 ${_fL("smůly","pitch")}`);
  Fx.render();
}
// 🧑‍🌾 Lesní nádeník: nájem na sezónu za pevnou mzdu, není členem party
function forestHire(){
  if(!forestAllowed())return;
  const f=forestRec(), fee=forestRule("handFee",800);
  if(_fn(f.hands)>=forestRule("handMax",2))return;
  if(G.grose<fee){G.log.push(`__EVT__❌ ${_fL("Nedostatek peněz","Not enough money")}`);Fx.render();return;}
  G.grose-=fee;
  f.hands=_fn(f.hands)+1;f.pool=_fn(f.pool)+forestRule("handLP",3);
  G.log.push(`__ECO__🧑‍🌾 ${_fL("Najat lesní nádeník","Forest hand hired")} (-${mny(fee)})`);
  Fx.render();
}
// Propuštění nádeníka (bez náhrady; nevyužitá práce propadá)
function forestDismiss(){
  if(!forestAllowed())return;
  const f=forestRec();
  if(_fn(f.hands)<1)return;
  f.hands=f.hands-1;
  f.pool=Math.min(_fn(f.pool),f.hands*forestRule("handLP",3));
  Fx.render();
}
function forestSetReserve(tier){forestRec().reserve=clamp(Math.round(tier),0,2);Fx.render();}
function forestSetEmergency(on){forestRec().emerg=!!on;Fx.render();}

// Nákup parcel (Trh/Les). stage "Z": levnější sazenice, dorostou za 2 zimy; jinak hotové těžitelné parcely.
function buyParcely(n,stage){
  const seedlings=stage==="Z";
  const cur=seedlings?forestMaxParcels():G.forest, max=200;
  if(cur>=max){G.log.push(`__EVT__🌲 ${_fL("Hvozd je na maximu (200 parcel)","Forest at maximum (200 parcels)")}`);Fx.render();return;}
  const buy=Math.min(n,max-cur);
  const price=buy*(seedlings?forestRule("buyZPrice",400):800);
  if(G.grose<price){G.log.push(`__EVT__❌ ${_fL("Nedostatek peněz","Not enough money")}`);Fx.render();return;}
  G.grose-=price;
  if(seedlings){const f=forestRec();f.z=_fn(f.z)+buy;}else G.forest+=buy;
  G.forestMax=forestMaxParcels()+buy;   // koupené parcely navyšují strop
  G.log.push(`__ECO__🌲 ${_fL("Zakoupeno","Bought")} ${buy} ${seedlings?_fL("parcel sazenic","seedling parcels"):_fL("parcel lesa","forest parcels")} (-${mny(price)})`);
  Fx.render();
}

// ── zimní přírůstek (nahrazuje starý blok regenerace v startInterseason) ──
// Vrací čísla pro mezisezónní obrazovku. Nelosuje.
function forestGrow(){
  const f=forestRec(), isEasy=G.difficulty==="easy", per=forestPlantPer(), maxF=forestMaxParcels(), s0=G.forest;
  // nádeníci: mzda se platí, kdo se nedá zaplatit, odejde; práce, kterou nevyužili, sází sama
  const fee=forestRule("handFee",800);
  let groats=G.grose, fees=0, kept=0;
  const hired=_fn(f.hands);
  for(let i=0;i<hired;i++){if(groats>=fee){groats-=fee;fees+=fee;kept++;}}
  const dropped=hired-kept;
  G.grose=groats;
  const autoLP=_fn(f.pool);
  // dorůstání: mlází → těžitelný, sazenice → mlází
  const matured=_fn(f.y);
  let s=s0+matured;
  const y=_fn(f.z);
  let z=0;
  let pas=Math.max(0,maxF-s-y);
  // automatický přírůstek je přesně ten starý (přirozený osev + parta na Výsadbě, rovnou do těžitelného); výstavky přidávají k osevu
  const crew=Math.min(Math.min(G.reforestWorkers||0,4)*per,pas);
  const seedBase=s0>0?(isEasy?forestRule("seedEasy",6):FOREST_REGEN_BASE):forestRule("seedNoStanding",2);
  const seedPlan=seedBase+(s0>0?_fn(f.reserve)*forestRule("reserveSeed",1):0);
  const seed=Math.min(seedPlan,pas-crew);
  s+=crew+seed;pas-=crew+seed;
  // výsadba hráče (vlastní práce, nádeníci): sazenice, které potřebují dvě zimy
  const hand=Math.min(autoLP*per,pas);z+=hand;pas-=hand;
  G.forest=s;
  f.y=y;f.z=z;
  f.man=forestRule("manualLP",3);f.hands=kept;f.pool=kept*forestRule("handLP",3);
  f.plants=0;f.thins=0;f.resins=0;
  if(!Array.isArray(f.hist))f.hist=[];
  f.hist.push(s);
  while(f.hist.length>forestRule("histMax",8))f.hist.shift();
  if(dropped>0)G.log.push(`__EVT__🧑‍🌾 ${_fL("Lesní nádeník odešel — nebylo mu čím zaplatit.","A forest hand left — there was nothing to pay him with.")}`);
  G.log.push(`__PROD__🌲 ${_fL("Les dorůstá","The forest grows")}: +${matured+crew+seed} ${_fL("těžitelných","mature")}`+(hand>0?` · +${hand} ${_fL("sazenic","seedlings")}`:""));
  return{matured:matured+crew+seed,crew,hand,seed,fees,dropped};
}

// ── pohled na záložku Les (jen zobrazení: nemění stav, nelosuje) ──
function _fnum(n){return String(Math.round(n*10)/10);}
function forestView(){
  const f=forestRec(), L=G.lang;
  const st=(typeof FOREST_RULES!=="undefined"&&FOREST_RULES.stages)||{};
  const icon=(k,d)=>st[k]?st[k].icon:d;
  const name=(k,cs,en)=>st[k]?(L==="cs"?st[k].name_cs:st[k].name_en):(L==="cs"?cs:en);
  const maxF=forestMaxParcels(), s0=G.forest, y0=_fn(f.y), z0=_fn(f.z);
  const pas=Math.max(0,maxF-s0-y0-z0), grose=G.grose, per=forestPlantPer(), inGame=forestAllowed();
  const stages=[
    {k:"S",icon:icon("S","🌲"),name:name("S","Těžitelný","Mature"),n:s0},
    {k:"Y",icon:icon("Y","🌿"),name:name("Y","Mlází","Saplings"),n:y0},
    {k:"Z",icon:icon("Z","🌱"),name:name("Z","Sazenice","Seedlings"),n:z0},
    {k:"P",icon:icon("P","▫️"),name:name("P","Paseka","Clearing"),n:pas}];
  const cells=[];
  for(let i=0;i<s0;i++)cells.push("S");for(let i=0;i<y0;i++)cells.push("Y");for(let i=0;i<z0;i++)cells.push("Z");for(let i=0;i<pas;i++)cells.push("P");
  // práce
  const handLP=forestRule("handLP",3), handMax=forestRule("handMax",2), hands=_fn(f.hands), man=_fn(f.man), pool=_fn(f.pool);
  const lpLeft=man+pool, lpMax=forestRule("manualLP",3)+hands*handLP, fee=forestRule("handFee",800);
  // akce
  const plantsDone=_fn(f.plants), every=forestRule("plantBonusEvery",2);
  const nextBonus=every>0&&(plantsDone+1)%every===0?1:0;
  const plantPut=Math.min(pas,per+nextBonus), thinMax=forestRule("thinMax",4), resinMax=forestRule("resinMax",3);
  const actions=[
    {key:"plant",fn:"forestPlant",icon:"🌱",label:_fL("Sázet","Plant"),
      note:pas<1?_fL("není paseka","no clearing"):`+${plantPut} ${_fL("sazenic","seedlings")} · ${_fL("dorostou za 2 zimy","grow in 2 winters")}`,
      enabled:inGame&&lpLeft>0&&pas>=1},
    {key:"thin",fn:"forestThin",icon:"✂️",label:_fL("Probírka","Thin"),
      note:y0<1?_fL("není mlází","no saplings"):`${_fL("mlází hned dorostlo","a sapling matures at once")} · ${_fnum(_fn(f.thins))}/${thinMax}`,
      enabled:inGame&&lpLeft>0&&y0>=1&&_fn(f.thins)<thinMax},
    {key:"resin",fn:"forestResin",icon:"🫙",label:_fL("Smolařit","Tap resin"),
      note:s0<1?_fL("není z čeho","nothing to tap"):`+${forestRule("resinYield",1)} 🌲 ${_fL("smůly","pitch")} · ${_fnum(_fn(f.resins))}/${resinMax}`,
      enabled:inGame&&lpLeft>0&&s0>=1&&_fn(f.resins)<resinMax}];
  // co přinese příští zima (stejná pravidla jako forestGrow, bez mezd)
  const isEasy=G.difficulty==="easy", s1=s0+y0, pas1=Math.max(0,maxF-s1-z0);
  const crew=Math.min(Math.min(G.reforestWorkers||0,4)*per,pas1);
  const seedBase=s0>0?(isEasy?forestRule("seedEasy",6):FOREST_REGEN_BASE):forestRule("seedNoStanding",2);
  const seedPlan=seedBase+(s0>0?_fn(f.reserve)*forestRule("reserveSeed",1):0);
  const seed=Math.min(seedPlan,pas1-crew), hand=Math.min(pool*per,pas1-crew-seed);
  const flow=[];
  flow.push({tone:"good",text:`${icon("S","🌲")} ${_fL("těžitelných","mature")}: ${_fnum(s0)} → ${_fnum(s1+crew+seed)}  (+${_fnum(y0)} ${_fL("z mlází","from saplings")}, +${_fnum(seed)} ${_fL("samovýsev","natural seeding")}`+(crew>0?`, +${_fnum(crew)} ${_fL("parta","crew")}`:"")+")"});
  if(z0>0||y0>0)flow.push({tone:"neutral",text:`${icon("Y","🌿")} ${_fL("mlází","saplings")}: ${_fnum(y0)} → ${_fnum(z0)}`});
  if(hand>0)flow.push({tone:"neutral",text:`${icon("Z","🌱")} ${_fL("sazenice od nádeníků","seedlings from hands")}: +${_fnum(hand)}`});
  if(hands>0)flow.push({tone:grose>=fee*hands?"muted":"bad",text:`🧑‍🌾 ${_fL("mzda nádeníků","hands' wages")}: ${mny(fee*hands)}`});
  flow.push({tone:"muted",text:_fL("Nevyužité ruční práce propadnou, práce nádeníků sází sama.","Unused hand clicks are lost; the hands' labour plants on its own.")});
  // rozhodnutí
  const tier=_fn(f.reserve), pct=forestRule("reservePct",10), seedPer=forestRule("reserveSeed",1);
  const reserve=[
    {tier:0,label:_fL("Bez výstavků","No seed trees"),note:_fL("káceč bere vše","loggers take everything"),on:tier===0},
    {tier:1,label:pct+" %",note:`+${_fnum(seedPer)} ${_fL("samovýsev za zimu","seeding per winter")}`,on:tier===1},
    {tier:2,label:(pct*2)+" %",note:`+${_fnum(seedPer*2)} ${_fL("samovýsev za zimu","seeding per winter")}`,on:tier===2}];
  const kept2=forestProtect(s0);
  // nákup
  const buyPrice=forestRule("buyZPrice",400), room=200-maxF;
  const hist=(Array.isArray(f.hist)?f.hist:[]).map(_fn);
  return{
    scene:{density:s0<=0?"depleted":(s0/maxF<=.25?"scarce":(s0/maxF<.6?"thinned":"dense"))},
    stages,cells,total:maxF,
    labour:{left:lpLeft,max:lpMax,line:_fL(`Zbývá ${lpLeft} z ${lpMax} prací tuto sezónu`,`${lpLeft} of ${lpMax} labour left this season`),
      slots:Array.from({length:handMax},(_,i)=>i<hands),hands,handMax,fee,canHire:inGame&&hands<handMax&&grose>=fee,canDismiss:hands>0,
      note:_fL(`Nádeník dá ${handLP} prací za sezónu; mzdu platíš v zimě.`,`A hand gives ${handLP} labour per season; wages are paid in winter.`)},
    actions,flow,
    reserve:{choices:reserve,note:tier>0?_fL(`Ponecháno ${_fnum(kept2)} parcel — káceč je nepokácí.`,`${_fnum(kept2)} parcels kept — loggers leave them standing.`)
      :_fL("Část lesa nechat stát, aby se sám osíval.","Leave part of the forest standing so it reseeds itself.")},
    emerg:{on:!!f.emerg,note:_fL(`Když dojde těžitelný les, káceči pokácejí mlází: ${forestRule("emergWood",2)}🌳 za parcelu a ztracená budoucnost lesa.`,
      `When the mature forest runs out, loggers cut saplings: ${forestRule("emergWood",2)}🌳 per parcel and the forest's future lost.`)},
    buy:{price:buyPrice*5,enabled:inGame&&grose>=buyPrice*5&&room>=5,
      note:_fL("Hvozd se rozšíří; sazenice dorostou za 2 zimy. Hotové parcely koupíš níže.","The forest grows larger; seedlings need 2 winters. Ready parcels are sold below.")},
    hist,histMax:maxF};
}
