// fate.js — W2: události s volbou (Android FATE.json, jen hodnoty). Platí jen v nové ekonomice (G._econ===2) od sezóny firstSeason.
// Částky: základ pro S2 Normal v zl / kusech; násobí se easyMult (Easy) a (1 + growth × (sezóna − firstSeason)). Šance a morálka se neškálují.
// Volba: cost {zl,wood,food} · morale (okamžitě) · fx [[klíč,hodnota,měsíců]] (doznívá v G.fate.fx; „měsíců“ počítá i tento) · risk {p,pStorm,hit{woodPct,zl,morale}} — jedno hození na událost.
const FATE={
  firstSeason:2, rounds:[2,9], weatherShare:0.65, growth:0.15, easyMult:0.7, glutMin:12,
  // W3: mor je druhá, řetězená událost (nezabírá běžný slot; max. 1 za sezónu). Z vojska: šance armyP, za armyDelay[0..1] měsíců, nejpozději lastRound;
  // z horka: od kola heat.from do heat.to, jakmile jsou ≥ heat.minMonths měsíce sucha/bouře, v prvním takovém měsíci šance heat.p. Zavřený trh = měsíc události + další (closeMonths).
  plague:{armyP:0.40,armyDelay:[1,3],lastRound:11,heat:{from:6,to:10,minMonths:2,p:0.30},closeMonths:2},
  elbeMinRound:5, elbeBuyer:"Hoffmann",
  kinds:{
    frost:{icon:"❄️",cs:"Mrazy",en:"Hard frost",
      dcs:"Tuhý mráz leží na hvozdu i v chatrčích. Čím se zahřejete?",den:"A hard frost lies over the forest and the huts. How do you keep warm?",
      opts:[
        {id:"heat",cs:"Přitopit",en:"Stoke the fires",dcs:"Mrazová ztráta nálady odpadá.",den:"No frost loss of morale.",cost:{wood:6},fx:[["frostMorale",0,1]]},
        {id:"blankets",cs:"Deky a pivo",en:"Blankets and beer",dcs:"Mrazová ztráta nálady jen −2.",den:"Frost loss of morale only −2.",cost:{zl:8},fx:[["frostMorale",2,1]]},
        {id:"endure",cs:"Nechat být",en:"Let it be",dcs:"Nálada −8 místo −5, únava +10 % ten měsíc.",den:"Morale −8 instead of −5, fatigue +10 % this month.",cost:{},fx:[["frostMorale",8,1],["fatigue",0.10,1]]}]},
    fire:{icon:"🔥",cs:"Požár hrozí",en:"Fire danger",
      dcs:"Suchý vzduch a jiskry nad skladem dříví. Hlídat, nebo spoléhat na štěstí?",den:"Dry air and sparks over the wood store. Keep watch, or trust to luck?",
      opts:[
        {id:"watch",cs:"Hlídky",en:"Night watch",dcs:"Požár nehrozí.",den:"No fire risk.",cost:{zl:10},risk:{p:0}},
        {id:"store",cs:"Hasit jen sklad",en:"Guard the store only",dcs:"Při požáru −30 % dříví; únava +5 % ten měsíc.",den:"If it burns −30 % wood; fatigue +5 % this month.",cost:{wood:3},fx:[["fatigue",0.05,1]],risk:{p:0.30,pStorm:0.40,hit:{woodPct:30}}},
        {id:"fate",cs:"Nechat osudu",en:"Leave it to fate",dcs:"Při požáru −25 % dříví a −10 zl.",den:"If it burns −25 % wood and −10 zl.",cost:{},risk:{p:0.35,pStorm:0.45,hit:{woodPct:25,zl:10}}}]},
    forest:{icon:"🌲",cs:"Lesní řád",en:"Forest ordinance",
      dcs:"Lesmistr připomíná panský lesní řád a počítá pařezy.",den:"The forester cites the lord's forest ordinance and counts the stumps.",
      opts:[
        {id:"fee",cs:"Poplatek",en:"Pay the fee",dcs:"Čistý stůl.",den:"Clean slate.",cost:{zl:12}},
        {id:"limit",cs:"Omezit kácení",en:"Limit felling",dcs:"Svoz dříví ×0,7 na 3 měsíce.",den:"Wood haul ×0.7 for 3 months.",cost:{},fx:[["logMult",0.7,3]]},
        {id:"bribe",cs:"Podplatit",en:"Bribe him",dcs:"Při odhalení pokuta −25 zl.",den:"If caught a fine of −25 zl.",cost:{zl:6},risk:{p:0.40,hit:{zl:25}}}]},
    army:{icon:"⚔️",cs:"Vojsko a kontribuce",en:"Soldiers and levies",
      dcs:"Voj táhne krajem a chce kontribuci.",den:"A troop marches through the region demanding levies.",
      opts:[
        {id:"tribute",cs:"Kontribuce",en:"Pay the levy",dcs:"Peníze místo potíží.",den:"Coin instead of trouble.",cost:{zl:15}},
        {id:"goods",cs:"Naturálie",en:"Pay in kind",dcs:"Dříví a jídlo; nálada −3.",den:"Wood and food; morale −3.",cost:{wood:8,food:6},morale:-3},
        {id:"hide",cs:"Schovat zásoby",en:"Hide the stores",dcs:"Při odhalení −30 zl a nálada −5.",den:"If found −30 zl and morale −5.",cost:{},risk:{p:0.50,hit:{zl:30,morale:-5}}}]},
    glut:{icon:"📦",cs:"Přesycení trhu",en:"Market glut",
      dcs:"Sklad přetéká zbožím a kupci se ho nedočkají koupit. Co s ním?",den:"The store overflows and buyers have had enough. What now?",
      opts:[
        {id:"dump",cs:"Prodat celý sklad",en:"Sell the whole stock",dcs:"Za 70 % ceny hned (Easy ×1,2).",den:"At 70 % of price now (Easy ×1.2).",special:"dump",rate:0.70},
        {id:"wait",cs:"Počkat",en:"Wait it out",dcs:"Ceny −8 % na 2 měsíce.",den:"Prices −8 % for 2 months.",cost:{},fx:[["priceMult",0.92,2]]},
        {id:"hold",cs:"Držet do jarmarku",en:"Hold for the fair",dcs:"−15 % kusů se rozbije, do jarmarku ceny −25 %.",den:"−15 % of pieces break, prices −25 % until the fair.",cost:{},special:"hold",breakPct:0.15,priceMult:0.75,fairWithin:3}]},
    elbe:{icon:"🚢",cs:"Zákaz plavby po Labi",en:"Elbe shipping ban",
      dcs:"Vrchnost zakázala plavbu po Labi. Hoffmannův křišťál musí jinou cestou.",den:"The authorities banned shipping on the Elbe. Hoffmann's crystal needs another route.",
      opts:[
        {id:"permit",cs:"Povolení",en:"Buy a permit",dcs:"Zakázky Hoffmanna beze změny.",den:"Hoffmann's contracts unchanged.",cost:{zl:16}},
        {id:"land",cs:"Po souši",en:"Overland",dcs:"Odměny otevřených zakázek Hoffmanna −20 %.",den:"Rewards of open Hoffmann contracts −20 %.",cost:{},rewardMult:0.8},
        {id:"smuggle",cs:"Propašovat",en:"Smuggle it",dcs:"Při chycení −22 zl a odměny Hoffmanna −20 %.",den:"If caught −22 zl and Hoffmann rewards −20 %.",cost:{},risk:{p:0.35,hit:{zl:22,rewardMult:0.8}}}]},
    plague:{icon:"🦠",cs:"Mor v kraji",en:"Plague in the region",
      dcs:"Vrchnost zavřela hranice a trhy. Nikdo nepřijede a nikdo nesmí cestovat; huť to ale nepostihla.",den:"The authorities closed the borders and markets. Nobody arrives and nobody may travel; the hut itself is spared.",
      opts:[
        {id:"sell",cs:"Prodat zásoby",en:"Sell the stock",dcs:"Sklad za 80 % ceny hned, nálada −3. Trh pak 2 měsíce zavřený.",den:"The stock at 80 % of price now, morale −3. Then the market is closed for 2 months.",special:"dump",rate:0.80,noEasy:true,morale:-3,fx:[["marketClosed",true,2]]},
        {id:"wait",cs:"Počkat",en:"Wait it out",dcs:"Nálada −3. Trh 2 měsíce zavřený.",den:"Morale −3. The market is closed for 2 months.",cost:{},morale:-3,fx:[["marketClosed",true,2]]}]}
  }
};
