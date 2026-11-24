// ── Bubliny „proč nejde úkol“: jen ZOBRAZENÍ, nic nemění v pravidlech ani v savech (stejné jako Android view/PresentTaskBlock.kt). ──
// Dělník nemůže úkol vykonat → čip zešedne (alfa .5), ale zůstane klepnutelný; klepnutí otevře bublinu s důvodem místo přidělení.
//   tvrdé (hard)  = nelze přidělit (mimo sezónu, vykácený les, únava, …)
//   měkké (soft)  = zešedlé, bublina nabídne „Přesto přidělit“ (zásoby se v kole mění podle pořadí dělníků, např. kácení přidá dřevo)
// Přidělený úkol, který nic nevyrobí, má žluté ⚠ s důvodem pod čipy (taskActiveWarn). Čísla drž v souladu s process-round.js.
// taskBlock(w,t) → null | {hard,title,reason,whenText,tip}
function _tbL(c,e){return G.lang==="en"?e:c;}
function _tbRoundsText(n){
  if(G.lang==="en")return n===1?"in 1 round":"in "+n+" rounds";
  return n===1?"za 1 kolo":n>=2&&n<=4?"za "+n+" kola":"za "+n+" kol";
}
function taskBlock(w,t){
  const res=G.res||{}, have=k=>res[k]||0, cs=G.lang!=="en";
  const label=(TASK_ICON[t]||"")+" "+((cs?TASK_CS:TASK_EN)[t]||t);
  const hard=(reason,whenText,tip)=>({hard:true,title:label,reason,whenText:whenText||null,tip:tip||null});
  const soft=(reason,whenText,tip)=>({hard:false,title:label,reason,whenText:whenText||null,tip:tip||null});
  // „Chybí: 2🪵 (máš 0), …“ nebo null, když nic nechybí
  const missing=(...need)=>{
    const lack=need.filter(([k,,n])=>have(k)<n);
    if(!lack.length)return null;
    return _tbL("Chybí","Missing")+": "+lack.map(([k,ic,n])=>n+ic+" "+_tbL("(máš","(have")+" "+have(k)+")").join(", ");
  };
  const round=G.round|0, tier=G.seasonTier||0;
  const isP=isPrepMonth(round,tier);
  const monthsFrom=cs?MONTHS_GEN_CS:MONTHS_EN;
  const from=_tbL("Půjde od","Available from");
  const tipBuy=_tbL("Chybějící zásoby dej do skladu nebo koupi (Trh).","Get the missing stock into storage or buy it (Market).");
  const fat=w.fat||0;
  const fs=G.forest2||null, fy=fs&&fs.y||0, fz=fs&&fs.z||0;   // dorůstající porost (mlází, sazenice) — přibude s lesem; do té doby 0

  switch(t){
    case"formar":{
      if(round<4)return hard(_tbL("Formař začíná až na jaře.","Mould-making only starts in spring."),from+" "+monthsFrom[4]+" ("+_tbRoundsText(4-round)+").");
      const m=missing(["wood","🪵",2],["water","💧",2],["food","🍞",1]);
      if(m)return soft(m,null,tipBuy);
      break;
    }
    case"field":{
      const y=GUIDE_FIELD_YIELD[Math.max(0,Math.min(11,round))];
      if(y<=0){
        let next=0;for(let i=1;i<=12;i++)if(GUIDE_FIELD_YIELD[(round+i)%12]>0){next=i;break;}
        return hard(_tbL("Políčko teď neplodí (zima).","The field yields nothing now (winter)."),from+" "+monthsFrom[(round+next)%12]+" ("+_tbRoundsText(next)+").");
      }
      break;
    }
    case"panev":{
      if(!isP)return hard(_tbL("Pánve se dělají jen v přípravě před kampaní.","Crucibles are made only in the preparation phase before the campaign."));
      const m=missing(["clay","🧱",2],["food","🍞",1]);
      if(m)return soft(m,null,tipBuy);
      break;
    }
    case"cereni":{
      if(!isCampaignMonth(round,tier))return hard(_tbL("Čeření jen v kampani.","Fining only during the campaign."));
      const ad=G.additives||{};
      if((G._cerenBonus||0)>=2)return soft(_tbL("Zásoba bonusu čeření je plná (2★).","The fining bonus store is full (2★)."),null,_tbL("Bonus se spotřebuje při příštím křišťálu.","The bonus is used up by the next crystal."));
      if(["burel","antimon","arsen"].every(k=>(ad[k]||0)<1))return soft(_tbL("Chybí burel, antimon nebo arsen.","No manganese, antimony or arsenic."),null,_tbL("Přísady se kupují na Trhu.","Additives are bought at the Market."));
      break;
    }
    case"logging":{
      const forest=G.forest||0;
      if(forest<=0)return hard(_tbL("Hvozd je vykácený — není co kácet.","The forest is gone — nothing to fell."),_tbL("Znovu poroste po zimním přírůstku.","It regrows in the winter turn."),_tbL("Pošli dělníka na Výsadbu nebo dřevo kup.","Send a worker to Reforest or buy wood."));
      break;
    }
    case"reforest":{
      const maxF=G.forestMax||INIT_FOREST;
      if(maxF-(G.forest||0)-fy-fz<1)return hard(_tbL("Není paseka — všechny parcely jsou osázené nebo porostlé.","No clearing left — every parcel is planted or grown."),null,_tbL("Sázet má smysl po vykácení.","Planting makes sense after logging."));
      const others=(G.workers||[]).filter(x=>x.task==="reforest"&&x.id!==w.id).length;
      if(others>=4)return soft(_tbL("Už sází 4 dělníci — další se nepočítá.","4 workers already plant — more do not count."));
      break;
    }
    case"potash":{
      const alloc=(G.wa&&G.wa.potash)||0, wood=have("wood");
      const forPotash=Math.floor(wood*(alloc/100));
      if(forPotash<WOOD_PER_POTASH)return soft(
        alloc<=0?_tbL("Podíl dřeva na potaš je 0 %.","The wood share for potash is 0 %.")
          :_tbL("Na potaš je z dřeva jen "+forPotash+" 🪵, potřeba "+WOOD_PER_POTASH+" 🪵 (podíl "+alloc+" % ze "+wood+" 🪵).",
                "Only "+forPotash+" 🪵 of the wood goes to potash, "+WOOD_PER_POTASH+" 🪵 needed (share "+alloc+" % of "+wood+" 🪵)."),
        null,_tbL("Kácení v tomtéž kole dřevo přidá.","Logging in the same round adds wood."));
      break;
    }
    case"idle":{
      if(fat<0.25){const pc=Math.round(fat*100);return hard(_tbL("Odpočinek má smysl až při únavě od 25 % (teď "+pc+" %).","Resting makes sense from 25 % fatigue (now "+pc+" %)."));}
      break;
    }
    case"werkstat":{
      const prof=w.prof||"", max=prof==="tavic"?0.5:0.75;
      if(fat>=max)return hard(_tbL("Příliš unavený na verštat ("+Math.round(fat*100)+" %, max "+Math.round(max*100)+" %).","Too tired for the workshop ("+Math.round(fat*100)+" %, max "+Math.round(max*100)+" %)."),null,_tbL("Nech ho odpočinout.","Let him rest."));
      const wg=(G.waldglas||[]).length, cr=(G.crystal||[]).length, lack=[];
      switch(prof){
        case"tavic":case"foukat_lesni":if(wg<1)lack.push(_tbL("waldglas","waldglass"));if(have("formy")<1)lack.push(_tbL("forma","mould"));break;
        case"foukat_kristal":if(cr<1)lack.push(_tbL("křišťál","crystal"));break;
        case"foukat_dekor":if(wg<1)lack.push(_tbL("waldglas","waldglass"));break;
        case"brusic_hrana":case"brusic_kulic":if(cr<1)lack.push(_tbL("křišťál","crystal"));if(have("water")<1)lack.push(_tbL("voda","water"));break;
        case"rytec":{
          if(!ENGRAVE_INPUTS.some(k=>(G[k]||[]).length>0))lack.push(_tbL("sklo k rytí","glass to engrave"));
          if(have("food")<1)lack.push(_tbL("jídlo","food"));
          break;
        }
      }
      if(lack.length)return soft(_tbL("Verštat nemá z čeho pracovat — chybí: ","The workshop has nothing to work on — missing: ")+lack.join(", "),null,
        _tbL("Zásoby se v kole mění; sklo z tavby přibude až po kole.","Stock changes within the round; glass from the melt arrives after it."));
      break;
    }
  }
  return null;
}
// žluté ⚠ pod čipy: přidělený úkol, který teď nic nevyrobí (jinak null)
function taskActiveWarn(w){
  if(!w||!w.task)return null;
  const b=taskBlock(w,w.task);
  if(!b)return null;
  return "⚠ "+_tbL("Tento úkol teď nic nevyrobí","This task produces nothing now")+": "+b.reason+(b.whenText?" "+b.whenText:"");
}
