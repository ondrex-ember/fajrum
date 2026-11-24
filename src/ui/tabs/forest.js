// forest.js — tab "forest" (Les). Renders forestView() (core/forest.js); all actions go through the core functions.
// Sub-tabs: work (labour + actions + next-winter flow) / manage (reserve, emergency felling, purchases, history).

function renderTabForest(ctx){
  const {L,p,content}=ctx;
  const cs=L==="cs";
  const v=forestView();
  {const sb=subTabBar("forest");if(sb)content.append(sb);}

  // ── Práce ──
  if(subOn("forest","work")){
    const sec=h("div",{class:"sec fj-forest-sec","data-worksite":"forestry",id:"fj-forest-work"});
    sec.append(h("div",{class:"sec-title"},"🌲 "+(cs?"Les":"Forest")));
    const dens={dense:cs?"Hustý hvozd":"Dense forest",thinned:cs?"Prořídlý hvozd":"Thinned forest",
      scarce:cs?"Řídký les":"Sparse forest",depleted:cs?"Vykácená paseka":"Clear-cut"};
    sec.append(h("div",{class:"fj-forest-density","data-density":v.scene.density},dens[v.scene.density]));

    // stav parcel
    const counts=h("div",{class:"fj-forest-stages"});
    v.stages.forEach(s=>counts.append(h("div",{class:"fj-forest-stage","data-stage":s.k},
      h("span",{class:"fj-forest-stage-icon"},s.icon),
      h("b",null,String(Math.round(s.n*10)/10)),
      h("span",{class:"fj-forest-stage-name"},s.name))));
    sec.append(counts);
    const grid=h("div",{class:"fj-forest-grid",role:"img","aria-label":cs?"Parcely lesa":"Forest parcels"});
    const icons={};v.stages.forEach(s=>{icons[s.k]=s.icon;});
    v.cells.forEach(k=>grid.append(h("span",{class:"fj-forest-cell","data-stage":k},icons[k])));
    sec.append(grid);
    content.append(sec);

    // práce
    const lab=h("div",{class:"sec fj-forest-sec",id:"fj-forest-labour"});
    lab.append(h("div",{class:"sec-title"},"🪓 "+(cs?"Práce v lese":"Forest labour")));
    lab.append(h("div",{class:"fj-forest-labour-line"},v.labour.line));
    const slots=h("div",{class:"fj-forest-hands"});
    v.labour.slots.forEach(on=>slots.append(h("span",{class:"fj-forest-hand"+(on?" on":"")},on?"🧑‍🌾":"▫️")));
    slots.append(
      h("button",{class:"btn btn-s"+(v.labour.canHire?" btn-active":""),...(v.labour.canHire?{}:{disabled:true}),
        onClick:()=>forestHire()},"+ "+(cs?"Nádeník":"Hand")+" · "+mny(v.labour.fee)),
      h("button",{class:"btn btn-s",...(v.labour.canDismiss?{}:{disabled:true}),
        onClick:()=>forestDismiss()},"− "+(cs?"Propustit":"Dismiss")));
    lab.append(slots);
    lab.append(h("div",{class:"fj-forest-note"},v.labour.note));
    const acts=h("div",{class:"fj-forest-actions"});
    v.actions.forEach(a=>{
      acts.append(h("button",{class:"btn fj-forest-action"+(a.enabled?" btn-active":""),"data-action":a.key,
        ...(a.enabled?{}:{disabled:true}),onClick:()=>{if(a.enabled)window[a.fn]();}},
        h("span",{class:"fj-forest-action-title"},a.icon+" "+a.label),
        h("span",{class:"fj-forest-action-note"},a.note)));
    });
    lab.append(acts);
    content.append(lab);

    // příští zima
    const flow=h("div",{class:"sec fj-forest-sec",id:"fj-forest-flow"});
    flow.append(h("div",{class:"sec-title"},"❄️ "+(cs?"Příští zima":"Next winter")));
    v.flow.forEach(f=>flow.append(h("div",{class:"fj-forest-flow-line tone-"+f.tone},f.text)));
    content.append(flow);
  }

  // ── Správa ──
  if(subOn("forest","manage")){
    const res=h("div",{class:"sec fj-forest-sec",id:"fj-forest-reserve"});
    res.append(h("div",{class:"sec-title"},"🌳 "+(cs?"Výstavky":"Seed trees")));
    const row=h("div",{class:"fj-forest-choices"});
    v.reserve.choices.forEach(c=>row.append(h("button",{class:"btn btn-s fj-forest-choice"+(c.on?" btn-active":""),"data-tier":c.tier,
      "aria-pressed":String(c.on),onClick:()=>forestSetReserve(c.tier)},
      h("b",null,c.label),h("span",null,c.note))));
    res.append(row,h("div",{class:"fj-forest-note"},v.reserve.note));
    content.append(res);

    const em=h("div",{class:"sec fj-forest-sec",id:"fj-forest-emerg"});
    em.append(h("div",{class:"sec-title"},"⚠️ "+(cs?"Nouzová těžba mlází":"Emergency felling")));
    em.append(h("button",{class:"btn btn-s"+(v.emerg.on?" btn-active":""),"aria-pressed":String(v.emerg.on),"data-emerg":v.emerg.on?"on":"off",
      onClick:()=>{
        if(!v.emerg.on&&!confirm(cs?"Povolit káceči kácet mlází, až dojde těžitelný les? Budoucnost lesa se tím ztratí.":"Let loggers cut saplings when mature forest runs out? The forest's future is lost."))return;
        forestSetEmergency(!v.emerg.on);
      }},v.emerg.on?(cs?"Zapnuto":"On"):(cs?"Vypnuto":"Off")));
    em.append(h("div",{class:"fj-forest-note"},v.emerg.note));
    content.append(em);

    const buy=h("div",{class:"sec fj-forest-sec",id:"fj-forest-buy"});
    buy.append(h("div",{class:"sec-title"},"🛒 "+(cs?"Nákup":"Purchases")));
    buy.append(h("div",{class:"fj-forest-buy-row"},
      h("span",null,`🌱 ${cs?"5 parcel sazenic":"5 seedling parcels"} · ${mny(v.buy.price)}`),
      h("button",{class:"btn btn-s"+(v.buy.enabled?" btn-active":""),"data-buy":"seedlings",...(v.buy.enabled?{}:{disabled:true}),
        onClick:()=>buyParcely(5,"Z")},cs?"Koupit":"Buy")));
    buy.append(h("div",{class:"fj-forest-note"},v.buy.note));
    // hotové parcely (přesunuto od kupce Weisse)
    const forestMax=p.forestMax||INIT_FOREST, parcelPrice=800;
    const canParcel=p.grose>=parcelPrice&&p.forest<200;
    buy.append(h("div",{class:"fj-forest-parcel-info"},
      `🌲 ${cs?"Hvozd":"Forest"}: ${p.forest}/${forestMax} ${cs?"parcel":"parcels"} · ${mny(parcelPrice)}/${cs?"parcela":"parcel"}`));
    buy.append(h("div",{class:"fj-forest-buy-btns"},
      [1,5,10].map(n=>h("button",{class:"btn btn-s"+(canParcel?" btn-active":""),style:{opacity:canParcel?1:.4},
        onClick:()=>buyParcely(n)},"+ "+n)),
      p.forest>=200?h("span",{class:"fj-forest-note"},cs?"Maximum dosaženo":"Maximum reached"):null));
    // nouzové dřevo (přesunuto od kupce Weisse)
    const woodPrice=emergencyWoodPrice(), canWood=p.grose>=woodPrice;
    buy.append(h("div",{class:"fj-forest-wood-row",style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"8px"}},
      h("span",{style:{fontSize:"11px"}},`🌳 ${cs?"Nouzové dřevo (5×)":"Emergency wood (5×)"} · ${mny(woodPrice)}`),
      h("button",{class:"btn btn-s"+(canWood?" btn-p":""),...(canWood?{}:{disabled:true}),style:{opacity:canWood?1:.4},
        onClick:()=>{if(canWood)buyEmergencyWood();}},cs?"Koupit":"Buy")));
    content.append(buy);

    if(v.hist.length){
      const hs=h("div",{class:"sec fj-forest-sec",id:"fj-forest-hist"});
      hs.append(h("div",{class:"sec-title"},"📈 "+(cs?"Vývoj těžitelného lesa":"Mature forest history")));
      const bars=h("div",{class:"fj-forest-hist"});
      const mx=Math.max(1,v.histMax,...v.hist);
      v.hist.forEach(n=>bars.append(h("span",{class:"fj-forest-hist-bar",title:String(n),style:{height:Math.max(4,Math.round(n/mx*100))+"%"}})));
      hs.append(bars);
      content.append(hs);
    }
  }
}
