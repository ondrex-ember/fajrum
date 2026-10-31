// ── INIT ──
G=initState();
let _saveguardStarted=false;
try{
  const stored=localStorage.getItem(SAVEGUARD_KEY);
  if(stored){
    const parsed=JSON.parse(stored);
    _saveguardStarted=saveguardLoad(parsed,false);
  }
}catch(e){console.warn("Saved game could not be read:",e);}
if(!_saveguardStarted)render();

