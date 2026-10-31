// tabs.js — tab bar, audio sync and the content container.
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderTabsAndContent(ctx){
  const {L,p}=ctx;
  // Pec HUD + bars: na desktopu jdou do pravého sloupce overview

  // Tabs
  const tabBar=h("div",{class:"tabs"});
  const tabLabels={overview:L==="cs"?"Přehled":"Overview",production:L==="cs"?"Výroba":"Smelting",
    storage:L==="cs"?"Sklad":"Storage",
    furnace:L==="cs"?"Pec":"Furnace",
    market:L==="cs"?"Trh":"Market",log:L==="cs"?"Kronika":"Chronicle",
    accounts:L==="cs"?"Huť":"Foundry",
    parta:L==="cs"?"Parta":"Crew",
    hrac:L==="cs"?"Deník":"Journal",
    archiv:L==="cs"?"Archiv":"Archive"};
  [{k:"overview",e:"📋"},{k:"production",e:"⚗️"},{k:"storage",e:"📦"},{k:"furnace",e:"🔥"},{k:"market",e:"💰"},{k:"log",e:"📜"},{k:"accounts",e:"🏭"},{k:"parta",e:"👥"},{k:"hrac",e:"📓"},{k:"archiv",e:"📖"}].forEach(({k,e})=>{
    // Číslo u Trhu oznamuje pouze NOVÉ nabídky; přijaté kontrakty
    // zůstávají v Trhu jako aktivní, ale už nejsou notifikací.
    const newOffers=k==="market"&&Array.isArray(p.avail)?p.avail.length:0;
    const isActive=p.tab===k;
    const labelText=tabLabels[k]+(newOffers?` 📜${newOffers}`:"");
    const btn=h("button",{class:"tab"+(isActive?" active":""),onClick:()=>{G.tab=k;render();}});
    btn.append(e);
    btn.append(h("span",{class:"tab-label"},labelText));
    tabBar.append(btn);
  });

  // Synchronizuj audio s herním stavem
  const _muteAll=p.audio.muted;
  FurnaceAudio.setEnabled(p.audio.enabled&&!_muteAll);
  FurnaceAudio.setVolume(p.audio.volume*(p.audio.masterVolume??1));
  FurnaceAudio.setTemp(p.fTemp);
  FurnaceAudio.setPhase(p.round>=PREP&&p.fActive?'campaign':p.round>=PREP?'prep':'off');
  GlassHutMusic.setEnabled(p.audio.musicEnabled&&!_muteAll);
  GlassHutMusic.setMusicVolume(p.audio.musicVolume??0.5);
  GlassHutMusic.setMasterVolume(p.audio.masterVolume??0.8);
  GlassHutMusic.setMuted(!!_muteAll);

  const content=h("div",{class:"content tab-enter"});
  return {content,tabBar};
}
