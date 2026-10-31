// Wires the core effect bus (src/core/fx.js) to the browser: redraw, sound, floating text, toast, music.
// Must load after every module whose functions it calls and before boot.js. Not loaded by the headless test tools.
Fx.on('render',(...a)=>render(...a));
Fx.on('sound',(...a)=>FajrumSfx.play(...a));
Fx.on('float',(...a)=>spawnFloatText(...a));
Fx.on('toast',(...a)=>showToast(...a));
Fx.on('musicEnabled',(...a)=>GlassHutMusic.setEnabled(...a));
