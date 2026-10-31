// ════════════════════════════════════════════════════════════
// FAJRUM PROCEDURAL SOUND SYNTHESIZER (Web Audio API)
// ════════════════════════════════════════════════════════════
const FajrumSfx = (() => {
  let _sfxCtx = null;
  function _getCtx() {
    if (!_sfxCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) _sfxCtx = new AC();
    }
    if (_sfxCtx && _sfxCtx.state === 'suspended') {
      _sfxCtx.resume().catch(() => {});
    }
    return _sfxCtx;
  }

  function play(type, vol = 0.5) {
    if (typeof G !== 'undefined' && G.audio && G.audio.muted) return;
    const ctx = _getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    const userVol = (typeof G !== 'undefined' && G.audio && typeof G.audio.volume === 'number') ? G.audio.volume : 0.7;
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol * userVol)), now);
    masterGain.connect(ctx.destination);

    try {
      if (type === 'glass' || type === 'craft') {
        // Sparkling crystal glass chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(1760, now);
        osc1.frequency.exponentialRampToValueAtTime(3520, now + 0.08);
        osc2.frequency.setValueAtTime(2637, now);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1); gain1.connect(masterGain);
        osc2.connect(gain2); gain2.connect(masterGain);
        osc1.start(now); osc1.stop(now + 0.6);
        osc2.start(now); osc2.stop(now + 0.4);
      } else if (type === 'coin') {
        // Crisp silver groschen coin jingle
        [2400, 3150, 4200].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.04);
          g.gain.setValueAtTime(0.28, now + i * 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.3);
          osc.connect(g); g.connect(masterGain);
          osc.start(now + i * 0.04); osc.stop(now + i * 0.04 + 0.35);
        });
      } else if (type === 'wood' || type === 'fuel') {
        // Deep resonant wood thud
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(340, now);
        g.gain.setValueAtTime(0.55, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(filter); filter.connect(g); g.connect(masterGain);
        osc.start(now); osc.stop(now + 0.22);
      } else if (type === 'hammer' || type === 'stone') {
        // Forge / stone / shamot impact
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.14);
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(g); g.connect(masterGain);
        osc.start(now); osc.stop(now + 0.28);
      } else if (type === 'page' || type === 'tab') {
        // Gentle parchment page rustle
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(750, now);
        filter.frequency.exponentialRampToValueAtTime(280, now + 0.07);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(filter); filter.connect(g); g.connect(masterGain);
        osc.start(now); osc.stop(now + 0.11);
      } else if (type === 'bell' || type === 'season') {
        // Harmonic foundry bell toll
        [440, 880, 1320, 1760].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          g.gain.setValueAtTime(0.35 / (i + 1), now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 1.1 + i * 0.15);
          osc.connect(g); g.connect(masterGain);
          osc.start(now); osc.stop(now + 1.4);
        });
      } else if (type === 'alert') {
        [880, 660].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          g.gain.setValueAtTime(0.25, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.22);
          osc.connect(g); g.connect(masterGain);
          osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.28);
        });
      }
    } catch(e) {}
  }

  return { play, getCtx: _getCtx };
})();
