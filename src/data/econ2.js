// econ2.js — tabulka „nové ekonomiky“ (Android ECON2.json, jen hodnoty). Platí jen pro nové hry (G._econ===2); staré savy zůstávají v klasické ekonomice.
// Peníze v krejcarech (1 zl = 100 kr); hodnoty s rozlišením {easy,normal}. Stravné, paušál a pevné sazby jsou násobky 50 kr.
const ECON2={
  piece:{
    share:0.25,                       // podíl z tržeb (prodej + dodané zakázky) do společného fondu výrobců
    helper:{easy:150,normal:200},     // pomocní: pevná mzda v kampani
    prepCash:{easy:100,normal:150},   // stravné v přípravě (všichni; bez osobního příplatku)
    retainer:{easy:50,normal:100}     // paušál výrobců v kampani (+ osobní příplatek wageMod, min. 1 zl)
  },
  rent:{
    rounds:[5,11],                    // sv. Jiří (duben), sv. Havel (říjen): hotovost i kvóta v jednom termínu
    cash:{easy:2000,normal:2500},
    wood:{easy:25,normal:20},         // kvóta dříví do skladu
    potash:{easy:5,normal:4},         // kvóta popela (potaše) do skladu
    graceSeasons:1,                   // v první sezóně hotovostní činže odpadá (kvóta chodí)
    famaQuota:0.25,                   // kvóta × (1 + famaQuota × min(1, součet Famy / famaFull))
    famaFull:60
  }
};
