// Mobile presentation wraps the original renderer; all game rules/actions are retained.
function render(){
  const visualScroll=app.querySelector('.content')?.scrollTop||0;
  if(window.FajrumCrew)FajrumCrew.beforeRender();
  if(window.FajrumUI)FajrumUI.beforeRender();
  const result=renderOriginal();
  if(window.FajrumUI)FajrumUI.finish(app,G,key=>{G.tab=key;render();});
  if(window.FajrumProducts)FajrumProducts.finish(app,G);
  if(window.FajrumRecipeUI)FajrumRecipeUI.finish(app,G);
  if(window.FajrumCrew)FajrumCrew.finish(app,G,{taskOptions:workerTaskOptions,assign:setWorkerTask,profile:id=>{G._partaDetail=id;G._partaSubtab="profil";G.tab="parta";render();}});
  if(window.FajrumMarket)FajrumMarket.finish(app,G,{quote:marketSaleQuote,prices:marketSalePrices,sell:sellItems,lines:contractLines,status:contractStatus});
  if(window.FajrumVisuals)FajrumVisuals.finish(app,G,{prep:isPrepMonth(G.round,G.seasonTier||0),marketClosed:!!MARKET_CLOSED[G.round],stockKeys:Object.keys(marketSalePrices())});
  if(window.FajrumPortraits)FajrumPortraits.finish(app,G);
  if(window.FajrumWorksites)FajrumWorksites.finish(app,G);
  if(window.FajrumArt?.finish)FajrumArt.finish(app,G);
  if(window.FajrumStories)FajrumStories.finish(app,G);
  if(window.FajrumPartners)FajrumPartners.finish(app,G);
  if(window.FajrumDesktop)FajrumDesktop.finish(app,G);
  if(window.FajrumC2a)FajrumC2a.finish(app,G);
  if(window.FajrumOverview)FajrumOverview.finish(app,G);
  if(window.FajrumC2b)FajrumC2b.finish(app,G);
  if(window.FajrumC3)FajrumC3.finish(app,G);
  if(window.FajrumD1)FajrumD1.finish(app,G);
  if(window.FajrumD2)FajrumD2.finish(app,G);
  if(window.FajrumD3)FajrumD3.finish(app,G);
  if(window.FajrumD4)FajrumD4.finish(app,G);
  if(window.FajrumD5)FajrumD5.finish(app,G);
  if(window.FajrumD6)FajrumD6.finish(app,G);
  if(window.FajrumD7)FajrumD7.finish(app,G);
  if(window.FajrumE1c)FajrumE1c.finish(app,G);
  if(visualScroll>0){const view=app.querySelector('.content');if(view)view.scrollTop=visualScroll;}
  return result;
}
