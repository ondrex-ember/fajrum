// round-bar.js — month / round bar.
// Moved verbatim out of renderOriginal() (ui/render-original.js); locals shared with it arrive through `ctx`.

function renderRoundBar(ctx){
  const {L,p,isP,ms,isDesktop}=ctx;
  // Round bar
  // Round bar — 12 měsíců
  const ABBR_CS=["Lis","Pro","Led","Úno","Bře","Dub","Kvě","Čvn","Čvc","Srp","Zář","Říj"];
  const ABBR_EN=["Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"];
  const abbr=L==="cs"?ABBR_CS:ABBR_EN;
  const rb=h("div",{class:"round-bar"});
  const tierBadgeText=p.seasonTier>=3?(L==="cs"?"👑 Celoroční provoz":"👑 All-Year"):p.seasonTier===2?(L==="cs"?"📜 Březen–Listopad":"📜 Mar–Nov"):p.seasonTier===1?(L==="cs"?"🔨 Duben–Listopad":"🔨 Apr–Nov"):(L==="cs"?"Tradiční sezóna":"Traditional");
  rb.append(h("div",{class:"round-bar-top"},
    h("div",{style:{display:"flex",alignItems:"center",gap:"6px"}},
      h("span",{style:{color:isP?"#4a7a3a":"#8b5e34",fontWeight:"700",fontSize:"12px"}},
        ms[p.round]+(isP?" · "+(L==="cs"?"Příprava":"Prep"):" · "+(L==="cs"?"Kampaň":"Campaign"))),
      h("span",{style:{fontSize:"10px",padding:"1px 6px",borderRadius:"6px",background:"rgba(201,149,43,.15)",color:"#8b5e34",fontWeight:"600"}},tierBadgeText)),
    h("div",{style:{display:"flex",gap:"8px",fontSize:"11px",alignItems:"center"}},
      h("span",null,
        h("span",{style:{color:"#8b5e34"}},L==="cs"?"Groše: ":"Groats: "),
        h("strong",{class:"fj-money-value",style:{color:p.grose<20?"#a03020":"#3a2a14",fontSize:"13px"}},
          window.FajrumUI?.resourceIcon?FajrumUI.resourceIcon("coins","💰"):"💰 ",
          h("span",null,p.grose+"g"))),
      h("span",null,
        h("span",{style:{color:"#8b5e34"}},L==="cs"?"Dluhy: ":"Debts: "),
        h("strong",{style:{color:(p.debt>0||liabilities(p).crew>0)?"#a03020":"#4a7a3a"}},
          (p.debt>0||liabilities(p).crew>0)?((p.debt>0?"📜 "+p.debt+"g":"")+(p.debt>0&&liabilities(p).crew>0?" · ":"")+(liabilities(p).crew>0?"👥 "+liabilities(p).crew+"g":"")):"✓")))));
  const pips=h("div",{style:{display:"flex",gap:"2px",width:"100%"}});
  for(let i=0;i<ROUNDS;i++){
    const cur=i===p.round, done2=i<p.round;
    const prep=isPrepMonth(i, p.seasonTier||0);
    const camp=isCampaignMonth(i, p.seasonTier||0);
    pips.append(h("div",{class:"round-pip",style:{
      flex:"1",
      background:cur?(camp?"#c9952b":"#4a7a3a"):done2?(camp?"rgba(201,149,43,.35)":"rgba(74,122,58,.25)"):"rgba(0,0,0,.04)",
      color:cur?"#f0deb8":done2?(camp?"#8b5e34":"#4a7a3a"):"#aaa",
      fontWeight:cur?"700":"400",
      borderTop:camp?"2px solid rgba(201,149,43,.6)":"2px solid rgba(74,122,58,.3)"}},
      abbr[i]));
  }
  rb.append(pips);
  if(!isDesktop&&window.FajrumUI)FajrumUI.calendar(rb,p);
  app.append(rb);
}
