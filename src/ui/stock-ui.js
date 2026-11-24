// stock-ui.js — pills s bublinou zásob a panel „📦 Zásoby“ na Přehledu (výpočet je v core/stock.js, tady jen kreslení).
// Pill: klik otevře bublinu (stav, rada, odkud se bere, k čemu slouží, nabídka Weisse, tlačítko do Skladu) — místo dřívějšího prostého tooltipu.
// Zdroj bez pravidel v RESOURCE_INFO → stockPill se vrátí ke starému pillTip (žádný pád, jen starý tooltip).

// Karty, kam může tlačítko v bublině vést (Les přibude s etapou lesa; do té doby se tlačítko pro „forest“ nenabízí)
const STOCK_OPEN_TABS=["overview","furnace","production","storage","forest","market","log","accounts","parta","hrac","archiv","settings"];

function _stkArt(key,glyph){
  const artKey=key==="crucibles"?"panev":key;
  return window.FajrumUI&&FajrumUI.resourceIcon?FajrumUI.resourceIcon(artKey,glyph):h("span",null,glyph);
}
function _stkMark(state){
  if(state==="crit")return h("span",{class:"stk-mark crit","aria-hidden":"true"},"!");
  if(state==="warn")return h("span",{class:"stk-mark warn","aria-hidden":"true"},"⚠");
  return null;
}

// Pill zásoby. key = klíč v RESOURCE_INFO (forest, wood, sand, …, crucibles, formy, additives, colors, morale)
function stockPill(key,emoji,val,fallbackCls,fallbackTip,artKey){
  const c=stockCalc(key);
  if(!c)return pillTip(emoji,val,fallbackCls,fallbackTip,artKey);
  const cls=c.state==="crit"?"ember":c.state==="warn"?"warn":(fallbackCls==="key"?"key":"");
  const w=h("span",{class:"tip-wrap stk-wrap"});
  const label=_stkTxt(c.info,"name")+": "+_stkValue(key)+(c.state!=="ok"?" · "+_stkStateLabel(c).replace(/[⚠️❗]/g,"").trim():"");
  const pill=h("span",{class:"pill stk-pill"+(cls?" "+cls:""),role:"button",tabindex:"0","aria-label":label,"data-stock":key,
    onClick:()=>openStockBubble(key),
    onKeyDown:e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();e.stopPropagation();openStockBubble(key);}}});
  if(artKey)pill.setAttribute("data-fajrum-resource",artKey);
  pill.append(_stkArt(artKey||key,emoji)," ",h("strong",null,val));
  const mk=_stkMark(c.state);
  if(mk)pill.append(mk);
  w.append(pill);
  return w;
}

function _stkRow(label,text,cls){
  return h("div",{class:"stk-row"+(cls?" "+cls:"")},h("div",{class:"stk-row-label"},label),h("div",{class:"stk-row-text"},text));
}

// Obsah bubliny jako DOM + titulek
function stockBubbleBody(key,close){
  const v=resourceInfoView(key);
  if(!v)return null;
  const box=h("div",{class:"stk-bubble","data-stock":key});
  const head=h("div",{class:"stk-head"});
  head.append(h("div",{class:"stk-head-art"},_stkArt(key==="crucibles"?"panev":key,v.icon)),
    h("div",{class:"stk-head-main"},
      h("div",{class:"stk-amount"},v.amount),
      h("div",{class:"stk-state "+v.state},v.stateLabel+(v.reach?" · "+v.reach:""))));
  box.append(head);
  if(v.hint)box.append(h("div",{class:"stk-hint "+v.state},"💡 "+v.hint));
  box.append(_stkRow(_stkL("Odkud se bere","Where it comes from"),v.source));
  box.append(_stkRow(_stkL("K čemu slouží","What it is for"),v.usage));
  if(v.detail)box.append(_stkRow(_stkL("Ve skladu","In stock"),v.detail));
  if(v.buy)box.append(h("div",{class:"stk-buy"},v.buy));
  if(STOCK_OPEN_TABS.includes(v.openTab)){
    box.append(h("button",{class:"btn btn-p stk-open",onClick:()=>{
      if(close)close();
      goTab(v.openTab,v.openSub);
    }},v.openLabel));
  }
  return {title:v.icon+" "+v.name,body:box};
}

function openStockBubble(key){
  const b=stockBubbleBody(key,()=>{if(window._stkDismiss){window._stkDismiss();}});
  if(!b)return;
  if(window.FajrumUI&&FajrumUI.sheet){window._stkDismiss=FajrumUI.sheet(b.title,b.body,app);return;}
  // záloha bez FajrumUI: jednoduchý modál
  const bg=h("div",{class:"modal-bg",onClick:e=>{if(e.target===bg)bg.remove();}});
  const m=h("div",{class:"modal"});m.append(h("h3",null,b.title),b.body,h("button",{class:"btn",onClick:()=>bg.remove()},"×"));
  bg.append(m);app.append(bg);
  window._stkDismiss=()=>bg.remove();
}

// Panel „📦 Zásoby“ na Přehledu: nahoře problémy (❗ první, pak POZOR) s radou, pod nimi dlaždice s ukazatelem dosahu.
// Bez RESOURCE_INFO vrací null (panel se nevykreslí).
function stockPanelEl(){
  const v=stockPanelView();
  if(!v.tiles.length)return null;
  const sec=h("div",{class:"sec fj-stock-panel"});
  sec.append(h("div",{class:"sec-title"},v.title));
  v.alerts.forEach(a=>{
    const row=h("div",{class:"stk-alert "+a.state,role:"button",tabindex:"0",onClick:()=>openStockBubble(a.key),
      onKeyDown:e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();openStockBubble(a.key);}}});
    row.append(h("div",{class:"stk-alert-text"},(a.state==="crit"?"❗ ":"⚠️ ")+a.text));
    if(a.hint)row.append(h("div",{class:"stk-alert-hint"},"→ "+a.hint));
    sec.append(row);
  });
  const grid=h("div",{class:"stk-grid"});
  v.tiles.forEach(t=>{
    const tile=h("button",{type:"button",class:"stk-tile "+t.state,"data-stock":t.key,onClick:()=>openStockBubble(t.key),
      "aria-label":t.name+": "+t.value+(t.reach?" · "+t.reach:"")});
    tile.append(h("div",{class:"stk-tile-top"},_stkArt(t.key==="crucibles"?"panev":t.key,t.icon),
      h("div",{class:"stk-tile-name"},t.name)),
      h("div",{class:"stk-tile-val"},t.value));
    if(t.reach)tile.append(h("div",{class:"stk-tile-reach"},t.reach));
    if(t.state!=="ok")tile.append(h("div",{class:"stk-tile-state"},t.stateLabel));
    if(t.fill!==null)tile.append(h("div",{class:"stk-tile-bar"},h("div",{class:"stk-tile-fill",style:{width:Math.round(t.fill*100)+"%"}})));
    grid.append(tile);
  });
  sec.append(grid);
  return sec;
}
