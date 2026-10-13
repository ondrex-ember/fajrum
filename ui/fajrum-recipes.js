/* Additional catalogue recipes. Values are game balancing, not historical prices. */
(function(){
 'use strict';
 const blown={
  krautstrunk:{cs:'Krautstrunk (zelný košťál)',en:'Krautstrunk',icon:'🍵',inputs:['waldglas','crystal'],qty:1,base:6,spec:'foukat_lesni',specOnly:false},
  berkemeyer:{cs:'Berkemeyer',en:'Berkemeyer',icon:'🍷',inputs:['waldglas','crystal'],qty:1,base:6,spec:'foukat_lesni',specOnly:false},
  passglas:{cs:'Passglas (číše s ryskami)',en:'Passglas (banded beaker)',icon:'🥂',inputs:['waldglas','crystal'],qty:2,base:10,spec:'foukat_dekor',specOnly:true},
  cise_ceska:{cs:'Číše českého typu',en:'Bohemian-type beaker',icon:'🥂',inputs:['waldglas','crystal'],qty:2,base:12,spec:'foukat_lesni',specOnly:true},
  maigelein:{cs:'Maigelein (miskovitá číše)',en:'Maigelein (drinking bowl)',icon:'🥣',inputs:['waldglas','crystal'],qty:1,base:4,spec:'foukat_formy',specOnly:false,requiresMould:true},
  humpen:{cs:'Humpen (velká pivní číše)',en:'Humpen (large beer beaker)',icon:'🍺',inputs:['waldglas','crystal'],qty:2,base:10,spec:'foukat_lesni',specOnly:true},
  matula:{cs:'Matula (lékařská baňka)',en:'Matula (urine flask)',icon:'⚗️',inputs:['waldglas','crystal'],qty:1,base:5,spec:'foukat_lesni',specOnly:false},
  cucurbita:{cs:'Cucurbita (varná baňka)',en:'Cucurbit (boiling flask)',icon:'⚗️',inputs:['waldglas','crystal'],qty:2,base:10,spec:'foukat_kristal',specOnly:true},
  retorta:{cs:'Křivule (retorta)',en:'Retort',icon:'⚗️',inputs:['waldglas','crystal'],qty:2,base:14,spec:'foukat_kristal',specOnly:true},
  fiala:{cs:'Fiala (lékárenská lahvička)',en:'Phial (medicine vial)',icon:'🧪',inputs:['waldglas','crystal'],qty:1,base:4,spec:'foukat_lesni',specOnly:false},
  tabule:{cs:'Válcové tabulové sklo',en:'Cylinder-method window sheet',icon:'🪟',inputs:['waldglas','crystal'],qty:3,base:13,spec:'foukat_formy',specOnly:true,resCost:{wood:1}},
  lampa:{cs:'Věčné světlo (skleněná lampa)',en:'Sanctuary oil lamp',icon:'🕯️',inputs:['waldglas','crystal'],qty:1,base:6,spec:'foukat_lesni',specOnly:false},
  ampulka:{cs:'Poutnická ampulka',en:'Pilgrim ampoule',icon:'🧪',inputs:['waldglas','crystal'],qty:1,base:6,spec:'foukat_formy',specOnly:true,requiresMould:true}
 };
 const ground={
  hladitko:{cs:'Hladítko na prádlo',en:'Linen smoother',icon:'🍄',input:'waldglas',qty:2,base:12,spec:'brusic_kulic',needsHeat:true,resCost:{formy:1},action_cs:'Vytvarovat a leštit',action_en:'Shape and polish'},
  cteci_kamen:{cs:'Čtecí kámen (skleněná čočka)',en:'Reading stone (glass lens)',icon:'🔍',input:'crystal',qty:1,base:18,spec:'brusic_kulic',resCost:{water:1}},
  herni_kameny:{cs:'Hrací kameny (sada)',en:'Glass gaming counters (set)',icon:'🎲',input:'waldglas',qty:2,base:10,spec:'brusic_kulic',needsHeat:true,resCost:{formy:1},action_cs:'Vytvarovat a leštit',action_en:'Shape and polish'}
 };
 const special={
  hodiny:{cs:'Přesýpací hodiny',en:'Hourglass',icon:'⌛',base:22,sell_cs:22,sell_en:22,inputs:{fiala:2,sand:1,wood:1},workers:['foukat_kristal','formar'],minSeason:1,desc_cs:'Dvě samostatné baňky spojené v hrdlech, jemný písek a dřevěný rám.',desc_en:'Two separate flasks joined at the necks, fine sand and a wooden frame.'}
 };
 for(const item of [...Object.values(blown),...Object.values(ground)])item.manualOnly=true;
 function resourceCost(item,state){return Object.entries(item.resCost||{}).find(([key,n])=>(Number(state.res[key])||0)<n);}
 function consumeResources(item,state){for(const [key,n]of Object.entries(item.resCost||{}))state.res[key]-=n;}
 function specialHave(state,key){if(Array.isArray(state[key]))return state[key].length;if(key in (state.additives||{}))return Number(state.additives[key])||0;return Number(state.res[key])||0;}
 function specialConsume(state,key,qty){if(Array.isArray(state[key]))state[key]=[...state[key]].sort((a,b)=>b-a).slice(qty);else if(key in (state.additives||{}))state.additives[key]-=qty;else state.res[key]-=qty;}
 window.FajrumCatalog={blown,ground,special,resourceCost,consumeResources,specialHave,specialConsume};
})();
