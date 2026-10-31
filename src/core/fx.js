// Effects bus. Core code announces what happened; ui/ and audio/ decide what to do about it
// (handlers are registered in src/ui/fx-bindings.js). Calls are synchronous and sit exactly where the old
// direct calls were, so timing, game state and RNG order are unchanged. With no handler registered
// (headless test tools) every effect is a no-op.
const Fx=(()=>{
  const handlers={};
  const fire=(type,args)=>{const fn=handlers[type];return fn?fn(...args):undefined;};
  return {
    on(type,fn){handlers[type]=fn;},
    render(...a){return fire('render',a);},               // redraw the whole UI
    sound(...a){return fire('sound',a);},                 // (name, volume)
    float(...a){return fire('float',a);},                 // (text, anchor, kind) floating feedback text
    toast(...a){return fire('toast',a);},                 // (title, lines)
    musicEnabled(...a){return fire('musicEnabled',a);},   // (boolean)
  };
})();
