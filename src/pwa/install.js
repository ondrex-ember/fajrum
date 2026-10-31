// ── PWA INSTALL PROMPT ──────────────────────────────────────
let _installPrompt=null;
let _installBanner=null;
const PWA_DISMISS_MS=7*86400000; // po zavření bannery 7 dní nevracet

function pwaIsStandalone(){
  try{return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;}catch(e){return false;}
}
function pwaIsIos(){
  const ua=navigator.userAgent||"";
  return /iPad|iPhone|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
}
function pwaDismissed(key){
  try{
    const t=parseInt(localStorage.getItem(key)||"0",10);
    return !!t&&Date.now()-t<PWA_DISMISS_MS;
  }catch(e){return false;}
}
function pwaMarkDismissed(key){
  try{localStorage.setItem(key,String(Date.now()));}catch(e){}
}
function pwaPush(ev){
  try{(window.dataLayer=window.dataLayer||[]).push({event:ev});}catch(e){}
}
// Ochrana savu proti eviction (Chrome přidělí tiše; vyžádáno jen ve standalone / po instalaci)
function pwaRequestPersist(){
  try{
    if(navigator.storage&&navigator.storage.persist&&navigator.storage.persisted){
      navigator.storage.persisted().then(p=>{if(!p)return navigator.storage.persist();}).catch(()=>{});
    }
  }catch(e){}
}

window.addEventListener("beforeinstallprompt",(e)=>{
  e.preventDefault();
  _installPrompt=e;
  showInstallBanner();
});

function showInstallBanner(){
  if(_installBanner||!_installPrompt)return;
  // Nejdřív rozhodnutí o souhlasu (consent banner), pak PWA banner
  if(typeof shConsentDecided==="function"&&!shConsentDecided())return;
  // Nezobrazovat pokud už je nainstalováno nebo bylo nedávno zavřeno
  if(pwaIsStandalone()||pwaDismissed("sh_pwa_dismissed"))return;
  const cs=!(typeof G!=="undefined"&&G&&G.lang==="en");

  _installBanner=document.createElement("div");
  _installBanner.style.cssText=`
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:linear-gradient(145deg,#3a2510,#2a1608);
    color:#f0deb8;border-radius:8px;padding:12px 16px;
    display:flex;align-items:center;gap:12px;
    box-shadow:0 4px 20px rgba(0,0,0,.5);
    border:1px solid rgba(201,149,43,.3);
    font-family:'Palatino Linotype','Book Antiqua',Georgia,serif;
    font-size:13px;z-index:9999;max-width:340px;width:calc(100% - 32px);
  `;
  _installBanner.innerHTML=`
    <span style="font-size:24px">🏺</span>
    <div style="flex:1">
      <div style="font-weight:700;font-size:12px;color:#c9952b;letter-spacing:.5px;text-transform:uppercase;margin-bottom:2px">Sklářská Huť</div>
      <div style="font-size:11px;opacity:.8">${cs?"Přidat na plochu — hrát offline":"Add to home screen — play offline"}</div>
    </div>
    <button id="pwa-install-btn" style="
      background:linear-gradient(180deg,#c9952b,#8b5e34);
      color:#f0deb8;border:none;border-radius:4px;
      padding:6px 12px;cursor:pointer;font-size:12px;font-weight:700;
      font-family:inherit;white-space:nowrap;
    ">${cs?"Přidat":"Add"}</button>
    <button id="pwa-dismiss-btn" style="
      background:none;border:none;color:rgba(240,222,184,.4);
      cursor:pointer;font-size:18px;padding:0 4px;line-height:1;
    ">×</button>
  `;
  document.body.appendChild(_installBanner);

  document.getElementById("pwa-install-btn").onclick=async()=>{
    const ev=_installPrompt;
    if(!ev)return;
    _installPrompt=null;
    if(_installBanner){_installBanner.remove();_installBanner=null;}
    try{
      ev.prompt();
      const result=await ev.userChoice;
      if(!result||result.outcome!=="accepted")pwaMarkDismissed("sh_pwa_dismissed");
    }catch(e){}
  };
  document.getElementById("pwa-dismiss-btn").onclick=()=>{
    if(_installBanner){_installBanner.remove();_installBanner=null;}
    pwaMarkDismissed("sh_pwa_dismissed");
  };
}

// iOS: Safari nemá beforeinstallprompt → jednorázový návod (ukáže se max 1× za 7 dní, mizí sám)
function showIosHint(){
  if(!pwaIsIos()||pwaIsStandalone()||pwaDismissed("sh_ios_hint"))return;
  if(typeof shConsentDecided==="function"&&!shConsentDecided())return;
  if(typeof window.shPwaNotice!=="function"||document.getElementById("sh-ios"))return;
  const cs=!(typeof G!=="undefined"&&G&&G.lang==="en");
  pwaMarkDismissed("sh_ios_hint");
  window.shPwaNotice("sh-ios",
    cs?"📲 Hraj jako aplikaci a ochraň si uloženou hru před smazáním Safari: Sdílet ⬆️ → Přidat na plochu"
      :"📲 Play as an app and keep your save safe from Safari clean-up: Share ⬆️ → Add to Home Screen",
    [{label:"OK",primary:true}],12000);
}

window.addEventListener("load",()=>{
  // Spuštěno jako nainstalovaná aplikace → event pro GTM (tagy řídí Consent Mode) + ochrana savu
  if(pwaIsStandalone()){pwaPush("pwa_launch");pwaRequestPersist();}
  setTimeout(showIosHint,4000);
});

window.addEventListener("appinstalled",()=>{
  if(_installBanner){_installBanner.remove();_installBanner=null;}
  _installPrompt=null;
  pwaPush("pwa_install");
  pwaRequestPersist();
});
