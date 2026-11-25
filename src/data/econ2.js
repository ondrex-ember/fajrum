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
  },
  advance:{                           // E2a: záloha od Faktora Reichela na zakázku (jedna nabídka za sezónu, nejvýš jedna aktivní)
    share:0.5,                        // záloha = 50 % ceny, vyplácí se při přijetí
    discount:0.15,                    // cena zakázky = viditelná cena × (1 − discount), pevná (bez Easy bonusu a zimní prémie)
    minTrust:25,                      // důvěra u Reichela
    maxDebt:0,                        // dluh u Reichela musí být splacen
    fromRound:1, untilRound:6,        // nabídka v kolech 1–6
    minLeft:3,                        // termín nejdřív za 3 kola od nabídky
    maxDue:10                         // termín nejpozději v kole 10
  },
  fair:{                              // jarmark: prodejní ceny ×priceMult; neskládá se s Weissem ×1,5 (platí vyšší)
    rounds:[8,11],                    // sv. Anna (červenec), sv. Havel (říjen)
    priceMult:1.3
  },
  weather:{                           // W1: počasí měsíce = funkce (wSeed, sezóna, měsíc); neukládá se, hlavní RNG se nedotýká
    order:["frost","storm","dry","wet"],   // pořadí kumulativního losu (jedno rovnoměrné číslo na měsíc)
    kinds:{
      frost:{from:0,to:4,p:0.22},     // listopad–březen
      wet:{from:4,to:11,p:0.10},      // březen–říjen
      dry:{from:6,to:10,p:0.12},      // květen–září
      storm:{from:7,to:9,p:0.10}      // červen–srpen (v sezóně 2+ spouští riziko požáru, W2)
    },
    fx:{
      frost:{wood:4,morale:5,logMult:1.5,crucible:1},
      wet:{logMult:0.7,priceMult:0.9},
      dry:{fieldMult:0.6,fatigue:0.05},
      storm:{}
    }
  },
  ladder:{                            // E3: Cesta z dluhů a „Proč jsem padl“ (jen texty a váhy; žádná nová mechanika)
    foreclose:{soft:16000,hard:18000},   // zrcadlí podmínky exekuce v processRound (dluh v kr)
    weights:{debt:1/4000,wages:1,rent:3,hunger:1,wood:1,plague:0.5},   // pořadí příčin: „měsíc-ekvivalenty“ (dluh: 1 za každých 40 zl)
    debtMin:6000,                     // dluh pod 60 zl (start hry má 40 zl) nepočítáme mezi příčiny pádu
    top:3
  }
};
