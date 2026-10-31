// layout.js — content container wiring and bottom action bar.
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderLayout(ctx){
  const {isDesktop,content,sp,p,sitRep,_scrollTop,L,ms,ft,tabBar}=ctx;
  // Keep the complete existing season panel inside the scrolling mobile content.
  if(!isDesktop)content.prepend(window.FajrumUI?FajrumUI.context(sp,p,sitRep):sp);
  if(window.FajrumArt&&(p.tab==="overview"||p.tab==="furnace")){
    const artworkOptions={inPrep:isPrepMonth(p.round,p.seasonTier||0),tempering:isTemperingMonth(p.round,p.seasonTier||0),furnaceType:ft,
      select:key=>{G.tab=key;content.scrollTop=0;render();}};
    content.prepend(p.tab==="overview"?FajrumArt.hut(p,artworkOptions):FajrumArt.furnace(p,artworkOptions));
  }
  app.append(content);
  // Obnovit scroll pozici po překreslení
  if(_scrollTop>0){
    const _newContent=app.querySelector(".content");
    if(_newContent)_newContent.scrollTop=_scrollTop;
  }
  const actionLabel=p.round>=ROUNDS-1
    ?(L==="cs"?"Uzavřít sezónu →":"End Season →")
    :(L==="cs"?`${ms[(p.round+1)%ROUNDS]} — Další měsíc →`:`${ms[(p.round+1)%ROUNDS]} — Next Month →`);
  const actionBar=h("div",{class:"action-bar"},
    h("button",{class:"btn btn-p",style:{width:"100%",padding:"11px",fontSize:"14px",letterSpacing:".5px"},
      onClick:processRound},actionLabel));

  // Sestav layout — desktop: tabs vlevo + content vpravo, mobil: stack
  if(isDesktop){
    app.classList.add("desktop");
    const contentShell=h("div",{class:"content-shell"});
    contentShell.append(content,actionBar);
    const shell=h("div",{class:"desktop-shell"});
    shell.append(tabBar,contentShell);
    app.append(shell);
  }else{
    app.classList.remove("desktop");
    const contentShell=h("div",{class:"content-shell mobile-shell"});
    if(window.FajrumUI){
      const mobileNav=FajrumUI.navigation({tabBar,state:p,app,select:key=>{G.tab=key;render();}});
      if(mobileNav.subnav)contentShell.append(mobileNav.subnav);
      contentShell.append(content,actionBar,mobileNav.nav);
      app.append(contentShell);
    }else{
      contentShell.append(content,actionBar);
      app.append(tabBar,contentShell);
    }
  }
}
