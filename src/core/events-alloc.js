function dismissEvt(){
  if(G.events.length){G.curEvt=G.events.shift();}
  else{G.curEvt=null; G.phase=G.round>=ROUNDS?"interseasonPhase":"summary";}
  Fx.render();
}
function setAlloc(key,val){
  const a={...G.wa}; a[key]=clamp(val,0,100);
  const oth=Object.keys(a).filter(k=>k!==key);
  const rem=100-a[key], os=oth.reduce((s,k)=>s+a[k],0);
  if(os>0)oth.forEach(k=>{a[k]=Math.round(a[k]/os*rem);});
  else oth.forEach(k=>{a[k]=Math.round(rem/oth.length);});
  const tot=Object.values(a).reduce((x,y)=>x+y,0);
  if(tot!==100)a[oth[0]]+=100-tot;
  G.wa=a; Fx.render();
}

