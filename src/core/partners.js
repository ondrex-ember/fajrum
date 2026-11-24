// ── Obchodní partneři (fáze A): vztah se jen zaznamenává. Nic odsud se nečte zpět do pravidel a nesahá se na RNG. ──
// Stav: G.partners = { <id>: { trust 0–100, n:{událost: počet}, sum:{událost: krejcary}, log:[{s,r,ev,amt,d}] (max 30) } }
function partnerIds(){return Object.keys(PARTNERS);}
// id partnera podle klíče `buyer` zakázky ("Weiss", "Hoffmann", "Opat", "Slechtic"); null, když ho nikdo nemá
function partnerByBuyer(buyer){
  if(!buyer)return null;
  for(const id of Object.keys(PARTNERS))if(PARTNERS[id].buyer===buyer)return id;
  return null;
}
function partnerFresh(def){return{trust:def.startTrust||0,n:{},sum:{},log:[]};}
function partnersInit(){const all={};for(const id of Object.keys(PARTNERS))all[id]=partnerFresh(PARTNERS[id]);return all;}
// uložený vztah; vznikne při prvním použití (starý save, partner přidaný do obsahu později)
function partnerState(id){
  const def=PARTNERS[id];if(!def)return null;
  if(!G.partners||typeof G.partners!=="object")G.partners={};
  return G.partners[id]||(G.partners[id]=partnerFresh(def));
}
// Mezi hráčem a partnerem se něco stalo. Neznámý partner / událost se ignoruje (rozhoduje obsah).
function partnerEvent(id,ev,amount=0){
  const def=PARTNERS[id];if(!def)return;
  const evDef=def.events&&def.events[ev];if(!evDef)return;
  const st=partnerState(id);if(!st)return;
  const before=st.trust||0;
  const after=Math.max(0,Math.min(100,before+(evDef.delta||0)));
  st.trust=after;
  if(!st.n)st.n={};if(!st.sum)st.sum={};if(!Array.isArray(st.log))st.log=[];
  st.n[ev]=(st.n[ev]||0)+1;
  if(amount!==0)st.sum[ev]=(st.sum[ev]||0)+amount;
  st.log.push({s:G.season,r:G.round,ev,amt:amount,d:after-before});
  while(st.log.length>PARTNER_LOG_MAX)st.log.shift();
}
// pásmo důvěry (nejvyšší tier s min <= trust)
function partnerTier(id,trust){
  const def=PARTNERS[id];let t=def.tiers[0];
  for(const x of def.tiers)if(trust>=x.min)t=x;
  return t;
}
