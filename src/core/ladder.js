// ladder.js — E3 (Android E3): „Cesta z dluhů“ a „Proč jsem padl“. Jen nová ekonomika (G._econ===2). Žádná nová mechanika — jen počítadla příčin a seřazení stávajících nástrojů.
// G.fall = počítadla za celou hru: hunger (měsíce bez dost jídla), wageMonths/wageSum (měsíce a součet nevyplacených mezd, kr), rentTerms/rentSum (termíny činže bez hotovosti, kr),
// noWood (měsíce s prázdným skladem dříví), closedMonths (měsíce zavřeného trhu kvůli moru), lastOut (mzdy + pivo minulého měsíce, kr). Nic nelosuje.

function fallInit(){return{hunger:0,wageMonths:0,wageSum:0,rentTerms:0,rentSum:0,noWood:0,closedMonths:0,lastOut:0};}
function fallSanitize(f){
  const out=fallInit();
  if(!f||typeof f!=="object"||Array.isArray(f))return out;
  for(const k of Object.keys(out)){const v=f[k];out[k]=Number.isSafeInteger(v)&&v>0?Math.min(k.endsWith("Sum")||k==="lastOut"?1e9:9999,v):0;}
  return out;
}
// Součet za měsíc (volá processRound): vstup = hodnoty právě zpracovaného měsíce
function fallStep(prev,m){
  const f=fallSanitize(prev);
  return{hunger:f.hunger+(m.hungry?1:0),wageMonths:f.wageMonths+(m.wageDeficit>0?1:0),wageSum:f.wageSum+Math.max(0,m.wageDeficit),
    rentTerms:f.rentTerms+(m.rentDebt>0?1:0),rentSum:f.rentSum+Math.max(0,m.rentDebt),noWood:f.noWood+(m.noWood?1:0),
    closedMonths:f.closedMonths+(m.closed?1:0),lastOut:Math.max(0,m.out)};
}

// Potíže = dluží se mzdy dělníkům, nebo hotovost nestačí na mzdy a pivo minulého měsíce. Jinak null (karta se neukazuje).
function ladderTrouble(){
  if(!econ2()||!G.fall)return null;
  const owed=(G.workers||[]).reduce((s,w)=>s+(w.unpaidDebt||0),0),need=G.fall.lastOut||0;
  const short=need>0&&G.grose<need;
  if(owed<=0&&!short)return null;
  return{owed,short,need,cash:G.grose};
}
// Stav třech kroků pro UI: {mora:{state,cost,left}, buyout:{state,count,total,pct}, loan:{pct}, foreclose:{soft,hard,debt}}
function ladderView(){
  const t=ladderTrouble();if(!t)return null;
  const E=ECON2.ladder,q=quickSellQuote();
  const mora=G.debtMoratorium>0?{state:"active",left:G.debtMoratorium}:G.debt>0?{state:"offer",cost:moratoriumCost()}:{state:"nodebt"};
  const buyout=G.quickSellUsed?{state:"used"}:marketPlagueClosed()?{state:"closed"}:q.count>0?{state:"offer",count:q.count,total:q.total,pct:q.ratePct}:{state:"empty"};
  return{trouble:t,mora,buyout,loan:{pct:Math.round(loanRateMarket()*100)},foreclose:{soft:E.foreclose.soft,hard:E.foreclose.hard,debt:G.debt}};
}

// „Proč jsem padl“: až E.top největších příčin s číslem a radou, seřazeno podle váhy; bez zaznamenaných příčin [] (obrazovka pak ukáže pevné rady)
function fallCauses(){
  if(!econ2()||!G.fall)return[];
  const f=fallSanitize(G.fall),E=ECON2.ladder,W=E.weights,cs=G.lang==="cs",out=[];
  const add=(id,icon,score,title,num,advice)=>{if(score>0)out.push({id,icon,score,title:cs?title[0]:title[1],num,advice:cs?advice[0]:advice[1]});};
  add("debt","⚖️",G.debt>=E.debtMin?G.debt*W.debt:0,["Dluh u Reichela","Debt to Reichel"],mny(G.debt),
    ["Dluh přerostl únosnou mez. Splácej při každé příležitosti, nepůjčuj si na provoz a využij odklad splátek, než dluh naroste.","The debt outgrew what the hut could carry. Repay whenever you can, do not borrow for running costs and use the moratorium before the debt snowballs."]);
  add("wages","💸",f.wageMonths*W.wages,["Nezaplacené mzdy","Unpaid wages"],cs?`${f.wageMonths} měs. · ${mny(f.wageSum)}`:`${f.wageMonths} mo. · ${mny(f.wageSum)}`,
    ["Před výplatou měj v kase mzdy a pivo na měsíc dopředu. V nouzi: odklad splátek, výkup u Weisse, půjčka (Trh › Faktor › Cesta z dluhů).","Keep a month of wages and beer in cash before payday. In a pinch: moratorium, Weiss buyout, a loan (Market › Factor › Way out of debt)."]);
  add("rent","🏰",f.rentTerms*W.rent,["Činže bez hotovosti","Rent without cash"],cs?`${f.rentTerms}× · ${mny(f.rentSum)}`:`${f.rentTerms}× · ${mny(f.rentSum)}`,
    ["Před sv. Jiřím a sv. Havlem odlož hotovost na činži (po první sezóně se platí i penězi). Neplacená činže roste do dluhu.","Set cash aside before St George and St Gall (after the first season rent is paid in coin too). Unpaid rent rolls into debt."]);
  add("hunger","🍞",f.hunger*W.hunger,["Hlad v huti","Hunger in the hut"],cs?`${f.hunger} měs.`:`${f.hunger} mo.`,
    ["Nenechávej zásobu jídla na nule; drž aspoň dva měsíce dopředu a před zimou doplň zásoby (políčko, nákup).","Never let food run to zero; keep two months ahead and restock before winter (field, purchase)."]);
  add("wood","🌲",f.noWood*W.wood,["Prázdný sklad dříví","Empty wood store"],cs?`${f.noWood} měs.`:`${f.noWood} mo.`,
    ["Plánuj kácení a nákup dříví dopředu, hlavně před zimou. Bez dříví pec stojí a nic se neprodá.","Plan felling and wood purchases ahead, especially before winter. Without wood the furnace idles and nothing sells."]);
  add("plague","🦠",f.closedMonths*W.plague,["Zavřený trh (mor)","Closed market (plague)"],cs?`${f.closedMonths} měs.`:`${f.closedMonths} mo.`,
    ["Za moru se neprodává. Když se šíří zvěsti o moru nebo je dlouhé horko, drž hotovost na dva měsíce a prodej zásoby včas.","Nothing sells during plague. When rumours spread or a long heat hits, keep two months of cash and sell stock early."]);
  out.sort((a,b)=>b.score-a.score);
  return out.slice(0,E.top);
}
