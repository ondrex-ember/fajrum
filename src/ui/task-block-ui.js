// task-block-ui.js — bublina „proč nejde úkol“ (výpočet je v core/task-block.js, tady jen zobrazení).
// taskBlockClick(w,t) vrací true, když úkol nejde přidělit rovnou (bublina se otevřela místo přidělení); jinak false.
// Měkká blokace nabídne „Přesto přidělit“ — přidělení pak proběhne obyčejnou akcí setWorkerTask, jako když hráč klepne na volný čip.
function taskBlockBubble(w,t,blk){
  const cs=G.lang!=="en";
  const body=h("div",{class:"tb-bubble","data-task":t});
  body.append(h("div",{class:"tb-reason"},blk.reason));
  if(blk.whenText)body.append(h("div",{class:"tb-when"},blk.whenText));
  if(blk.tip)body.append(h("div",{class:"tb-tip"},"💡 "+blk.tip));
  if(!blk.hard){
    body.append(h("div",{class:"tb-note"},cs?"Zásoby se v kole mění podle pořadí dělníků, takže úkol může nakonec vyjít.":"Stock changes during the round depending on the worker order, so the task may still work out."));
    const row=h("div",{class:"tb-actions"});
    row.append(h("button",{class:"btn btn-p tb-assign",type:"button",onClick:()=>{
      if(window._tbDismiss)window._tbDismiss();
      setWorkerTask(w.id,t);
    }},cs?"Přesto přidělit":"Assign anyway"));
    row.append(h("button",{class:"btn tb-cancel",type:"button",onClick:()=>{if(window._tbDismiss)window._tbDismiss();}},cs?"Zrušit":"Cancel"));
    body.append(row);
  }
  const title=blk.title+" · "+w.name;
  if(window.FajrumUI&&FajrumUI.sheet){window._tbDismiss=FajrumUI.sheet(title,body,app);return;}
  const bg=h("div",{class:"modal-bg",onClick:e=>{if(e.target===bg)bg.remove();}});
  const m=h("div",{class:"modal"});m.append(h("h3",null,title),body,h("button",{class:"btn",onClick:()=>bg.remove()},"×"));
  bg.append(m);app.append(bg);
  window._tbDismiss=()=>bg.remove();
}
function taskBlockClick(w,t,forceHard){
  const blk=taskBlock(w,t);
  if(!blk&&!forceHard)return false;
  const cs=G.lang!=="en";
  taskBlockBubble(w,t,blk||{hard:true,title:(TASK_ICON[t]||"")+" "+((cs?TASK_CS:TASK_EN)[t]||t),reason:cs?"Tento úkol teď nelze přidělit.":"This task cannot be assigned now.",whenText:null,tip:null});
  return true;
}
