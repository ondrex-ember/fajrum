// subtabs.js — podzáložky uvnitř karet Trh, Huť (accounts), Výroba, Pec a Sklad (stejné členění jako Android SubTabs).
// Vykreslí se vždy jen JEDNA podzáložka, takže sekce se nikdy nezdvojí. Zvolená záložka je jen stav UI (G._sub, mimo pravidla hry).
// Karta zavolá subTabBar(tab) na začátku a každou sekci přidá jen když subOn(tab,id). Přehled, Kronika, Deník, Nastavení záložky nemají.
const SUBTABS={
  market:[
    {id:"sell",e:"💰",cs:"Prodej",en:"Sell"},
    {id:"contracts",e:"📜",cs:"Zakázky",en:"Contracts"},
    {id:"weiss",e:"🛒",cs:"Kupec Weiss",en:"Merchant Weiss"},
    {id:"reichel",e:"🪙",cs:"Faktor Reichel",en:"Factor Reichel"},
    {id:"people",e:"💨",cs:"Lidé",en:"People",when:()=>(G.trhuNPC||[]).length>0&&(G.workers||[]).length<MAX_WORKERS}],
  accounts:[
    {id:"contracts",e:"📜",cs:"Zakázky",en:"Contracts"},
    {id:"accounts",e:"📒",cs:"Účty",en:"Accounts"},
    {id:"relations",e:"🤝",cs:"Vztahy",en:"Relations"},
    {id:"fame",e:"⭐",cs:"Pověst a huť",en:"Reputation & foundry"}],
  production:[
    {id:"blow",e:"💨",cs:"Foukání",en:"Blowing"},
    {id:"melt",e:"⚗️",cs:"Tavba a příprava",en:"Melting & preparation"},
    {id:"grind",e:"💎",cs:"Broušení a rytí",en:"Grinding & engraving"},
    {id:"special",e:"🪟",cs:"Speciální",en:"Special"}],
  furnace:[
    {id:"furnace",e:"🔥",cs:"Pec",en:"Furnace"},
    {id:"colors",e:"🎨",cs:"Kmen a barvy",en:"Batch & colours"},
    {id:"develop",e:"🏗️",cs:"Rozvoj hutě",en:"Foundry development"}],
  storage:[
    {id:"glass",e:"🔥",cs:"Sklo a výrobky",en:"Glass & products"},
    {id:"raw",e:"🌲",cs:"Suroviny a pokladna",en:"Raw materials & cash"}],
  forest:[
    {id:"work",e:"🌲",cs:"Práce",en:"Work"},
    {id:"manage",e:"🧰",cs:"Správa",en:"Management"}],
};
function subTabsFor(tab){return (SUBTABS[tab]||[]).filter(s=>!s.when||s.when());}
function subActive(tab){
  const list=subTabsFor(tab);
  if(!list.length)return"";
  const cur=G._sub&&G._sub[tab];
  return (list.find(s=>s.id===cur)||list[0]).id;
}
const subOn=(tab,id)=>subActive(tab)===id;
// odkaz z jiného místa (bublina zásob, Přehled, tlačítka): otevře kartu a rovnou podzáložku
function goTab(tab,sub){
  if(sub){G._sub=G._sub||{};G._sub[tab]=sub;}
  G.tab=tab;render();
}
// badges = {id:počet} → malé číslo u chipu (např. nové nabídky u „Zakázky“)
function subTabBar(tab,badges){
  const list=subTabsFor(tab);
  if(!list.length)return null;
  const act=subActive(tab), cs=G.lang!=="en";
  const bar=h("div",{class:"detail-subtabs fj-sub-chips",role:"tablist","data-subtabs":tab,"aria-label":cs?"Podzáložky":"Sections"});
  list.forEach(s=>{
    const n=badges&&badges[s.id]?badges[s.id]:0;
    const btn=h("button",{type:"button",role:"tab","aria-selected":String(act===s.id),"data-sub":s.id,
      class:"detail-subtab"+(act===s.id?" active":""),
      onClick:()=>{
        if(act===s.id)return;
        G._sub=G._sub||{};G._sub[tab]=s.id;render();
        const c=app.querySelector(".content");if(c)c.scrollTop=0;
      }},s.e+" "+(cs?s.cs:s.en)+(n?" ":""),n?h("span",{class:"fj-sub-badge"},n):null);
    bar.append(btn);
  });
  return bar;
}
