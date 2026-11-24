// constants.js — scalar game rules (forest, wages, winter bonuses, storage).
// Verbatim data moved out of core/ (no logic). Classic script: plain top-level consts in the shared global scope; load order is fixed by build.js.

// Měna: celé krejcary (1 zlatník = 100 kr). Stav i všechny peněžní tabulky počítají v krejcarech; zaokrouhlování pravidel se dělá po zlatnících.
const KR=100;
function inZl(kr){return kr/KR;}   // krejcary → zlatníky jako desetinné číslo (350 kr = 3.5)

const ROUNDS=12, PREP=5, PANEV_AGE=6, PANEV_DUR=5, FORMA_AGE=1, FUEL_BASE=4, WOOD_PER_POTASH=6;
const INIT_FOREST=80, FOREST_REGEN_BASE=3;

// Mzdy — odpočívající dělník (idle) nic nevyrábí, ale bere poloviční mzdu (zaokrouhleno nahoru na celý zlatník, min. 1 zl)
const IDLE_WAGE_FACTOR=0.5;

const FOREST_WARN=4;
const WOOD_EMERGENCY_PRICE=400;

// Zimní bonus těžby (Listopad-Leden: sáně po sněhu)
const WINTER_LOG_MULT=[1.5,1.5,1.5,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0];

// Bonus kvality pánví vyrobených v zimě (mrznutí jílu čistí)
const WINTER_PANEV_BONUS=[1,1,1,0,0,0,0,0,0,0,0,0];

const STORAGE_COST_PER_ITEM=100;
