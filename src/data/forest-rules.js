// forest-rules.js — pravidla správy lesa (Etapa 1c; Android content/FOREST_RULES.json). Všechna čísla pro core/forest.js, žádná logika.
// Stádia parcel: S těžitelný (G.forest) · Y mlází (forest2.y) · Z sazenice (forest2.z) · P paseka (odvozeno).
const FOREST_RULES={
  manualLP:3,
  handLP:3,
  handFee:800,
  handMax:2,
  plantEasy:3,
  plantNormal:2,
  plantBonusEvery:2,
  thinMax:4,
  resinMax:3,
  resinYield:1,
  reservePct:10,
  reserveSeed:1,
  emergWood:2,
  seedEasy:6,
  seedNoStanding:2,
  buyZPrice:400,
  histMax:8,
  stages:{
    S:{icon:"🌲",name_cs:"Těžitelný",name_en:"Mature"},
    Y:{icon:"🌿",name_cs:"Mlází",name_en:"Saplings"},
    Z:{icon:"🌱",name_cs:"Sazenice",name_en:"Seedlings"},
    P:{icon:"▫️",name_cs:"Paseka",name_en:"Clearing"},
  }
};
