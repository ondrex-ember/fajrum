// ════════════════════════════════════════════════════════════
// GLASS HUT MUSIC ENGINE v1.0
// Generativní hudba — dual-path: Desktop (plný) / Mobile (lite)
// Sdílí AudioContext s FurnaceAudio přes _sharedMusicCtx
// Tónový systém: A Frygická dominanta · 88 BPM
// Defaultně VYPNUTO — user musí zapnout v nastavení
// ════════════════════════════════════════════════════════════
const GlassHutMusic=(()=>{
  let _ctx=null,_dest=null,_running=false,_enabled=false;
  let _musicVol=0.5,_masterVol=0.8,_muted=false;
  let _engine=null;
  let _gestureReady=false;

  // ── Platform detection ─────────────────────────────────────
  const _isMobile=(()=>{
    const ua=/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const touch=('ontouchstart' in window)||(navigator.maxTouchPoints>2);
    const narrow=window.innerWidth<768;
    return ua||( touch&&narrow);
  })();

  // ── Ensure AudioContext (shared singleton) ─────────────────
  function _ensureCtx(){
    if(_ctx)return true;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    _ctx=new AC({latencyHint:'interactive',sampleRate:_isMobile?22050:44100});
    _dest=_ctx.destination;
    return true;
  }

  function _resume(){
    if(_ctx&&_ctx.state==='suspended')_ctx.resume();
  }

  // ══════════════════════════════════════════════════════════
  // SHARED MUSIC CORE — harmonický systém, sdílený oběma path
  // ══════════════════════════════════════════════════════════
  const ROOT_BASE=55.0;
  const SCALE_ST=[0,1,4,5,7,8,10,12,13,16,17,19,20,22,24];
  const CHORDS_DEF=[
    {name:'Am', bass:0,  tones:[0,4,7],   color:'tonic'},
    {name:'E5', bass:4,  tones:[4,7,11],  color:'dominant'},
    {name:'F',  bass:5,  tones:[5,8,12],  color:'sub'},
    {name:'Dm', bass:3,  tones:[3,7,10],  color:'sub'},
    {name:'C',  bass:10, tones:[7,10,14], color:'mediant'},
    {name:'G#', bass:8,  tones:[8,11,15], color:'chromatic'},
  ];
  const MARKOV=[
    [1,8,4,3,2,3],[7,1,3,1,2,4],[3,3,1,5,2,1],
    [4,3,2,1,3,1],[2,3,2,3,1,1],[6,2,2,1,1,1],
  ];

  function _nextChordIdx(idx){
    const row=MARKOV[idx%MARKOV.length];
    const tot=row.reduce((a,b)=>a+b,0);
    let r=Math.random()*tot;
    for(let i=0;i<row.length;i++){r-=row[i];if(r<=0)return i;}
    return 0;
  }

  // ══════════════════════════════════════════════════════════
  // DESKTOP ENGINE — plný TavernEngine port s lookahead scheduler
  // ══════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════
  // DESKTOP ENGINE — plný TavernEngine port
  // Původní architektura: cathedral_v6 composer brain
  // ctx + destination jako parametry (ne globální)
  // Lookahead scheduler místo raw setTimeout pro noty
  // ══════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════
  // DESKTOP ENGINE — plný TavernEngine port
  // cathedral_v6 composer brain · A Frygická dominanta · 88 BPM
  // Frekvenční zóny · Auction · Phrase Arc · Woodblock · Zills
  // ctx a destination jako instance vars (ne globální)
  // ══════════════════════════════════════════════════════════
  class DesktopEngine{
    constructor(){
      const ctx=_ctx;
      this.ctx=ctx;
      this.destination=_dest;

      // ── MASTER CHAIN ──────────────────────────────────────
      this.master=ctx.createGain();
      this.master.gain.value=0.0;
      this.compressor=ctx.createDynamicsCompressor();
      this.compressor.threshold.value=-12; this.compressor.knee.value=8;
      this.compressor.ratio.value=5; this.compressor.attack.value=0.004; this.compressor.release.value=0.18;
      this.limiter=ctx.createDynamicsCompressor();
      this.limiter.threshold.value=-1.0; this.limiter.knee.value=0;
      this.limiter.ratio.value=20; this.limiter.attack.value=0.001; this.limiter.release.value=0.05;
      this.tapeFilter=ctx.createBiquadFilter();
      this.tapeFilter.type='lowpass'; this.tapeFilter.frequency.value=12000;
      this.master.connect(this.compressor);
      this.compressor.connect(this.tapeFilter);
      this.tapeFilter.connect(this.limiter);
      this.limiter.connect(this.destination);

      // ── REVERB BUS ────────────────────────────────────────
      this.reverbBus=ctx.createGain(); this.reverbBus.gain.value=1.0;
      const revLen=ctx.sampleRate*1.8;
      const revBuf=ctx.createBuffer(2,revLen,ctx.sampleRate);
      for(let c=0;c<2;c++){
        const d=revBuf.getChannelData(c); let last=0;
        for(let i=0;i<revLen;i++){last=last+0.12*((Math.random()*2-1)-last);d[i]=last*Math.pow(1-i/revLen,4.0);}
      }
      this.convolver=ctx.createConvolver(); this.convolver.buffer=revBuf;
      this.reverbOut=ctx.createGain(); this.reverbOut.gain.value=0.55;
      this.reverbBus.connect(this.convolver); this.convolver.connect(this.reverbOut); this.reverbOut.connect(this.master);

      // ── FREKVENČNÍ ZÓNY ───────────────────────────────────
      this.zones={
        VIOLA:    this._makeBPF(55,200,0.6),
        LUTE:     this._makeBPF(180,700,0.7),
        CEMB:     this._makeBPF(280,1400,0.8),
        SITAR:    this._makeBPF(380,2200,0.9),
        FLUTE:    this._makeBPF(700,4500,1.0),
        BELL:     this._makeHPF(2200,1.2),
        BODHRAN:  this._makeLPF(320,0.85),
        DARBUKA:  this._makeBPF(180,900,0.9),
        SHAKER:   this._makeHPF(3200,0.55),
        WOODBLOCK:this._makeBPF(700,2200,0.75),
        ZILLS:    this._makeHPF(5500,0.6),
      };

      // ── TÓNOVÝ SYSTÉM — A Frygická dominanta ──────────────
      this.ROOT=55.0;
      this.SCALE_ST=[0,1,4,5,7,8,10,12,13,16,17,19,20,22,24];
      this.scale=this.SCALE_ST.map(s=>this.ROOT*Math.pow(2,s/12));
      this.LEADING=this.ROOT*Math.pow(2,11/12);

      // ── AKORDOVÁ GRAMATIKA ────────────────────────────────
      this.CHORDS=[
        {name:'Am', bass:0,  tones:[0,4,7],   color:'tonic'},
        {name:'E5', bass:4,  tones:[4,7,11],  color:'dominant'},
        {name:'F',  bass:5,  tones:[5,8,12],  color:'sub'},
        {name:'Dm', bass:3,  tones:[3,7,10],  color:'sub'},
        {name:'C',  bass:10, tones:[7,10,14], color:'mediant'},
        {name:'G#', bass:8,  tones:[8,11,15], color:'chromatic'},
        {name:'Bb', bass:10, tones:[10,13,17],color:'sub'},
        {name:'Em', bass:4,  tones:[4,7,11],  color:'relative'},
      ];
      this.MARKOV=[
        [1,8,4,3,2,3,1,2],[7,1,3,1,2,4,1,1],[3,3,1,5,2,1,2,1],
        [4,3,2,1,3,1,2,1],[2,3,2,3,1,1,2,2],[6,2,2,1,1,1,1,1],
        [2,2,4,3,2,1,1,1],[4,4,2,2,2,2,1,1],
      ];
      this.chordIdx=0; this.chordMeasure=0; this.chordDur=4;

      // ── MOTIVICKÝ SYSTÉM ──────────────────────────────────
      this.CALLS=[
        [[0,0.5,1.0],[4,0.5,0.9],[7,1.0,1.0],[7,0.25,0.7],[4,0.25,0.8]],
        [[4,0.5,1.0],[7,0.5,1.0],[4,0.5,0.9],[2,1.5,0.8]],
        [[0,1.25,1.0],[4,0.25,0.8],[7,0.5,1.0],[4,0.5,0.8]],
        [[7,0.5,1.0],[5,0.5,0.9],[4,0.5,0.85],[2,0.25,0.8],[0,1.25,0.75]],
        [[0,0.5,0.8],[2,0.5,0.9],[4,0.5,1.0],[5,0.25,1.0],[4,0.25,0.9],[2,0.5,0.8]],
      ];
      this.RESPONSES=[
        [[0,0.5,0.8],[2,0.25,0.9],[4,0.25,0.95],[2,0.5,0.9],[0,1.5,0.7]],
        [[4,0.5,0.85],[2,0.5,0.8],[0,0.5,0.75],[2,1.5,0.7]],
        [[7,0.25,1.0],[5,0.25,0.9],[4,0.25,0.85],[2,0.25,0.8],[0,1.5,0.7]],
        [[0,0.25,0.8],[2,0.25,0.85],[4,0.5,0.9],[7,1.5,1.0]],
        [[2,0.5,0.9],[4,0.25,0.95],[2,0.25,0.9],[0,0.5,0.85],[2,1.0,0.7]],
      ];

      // ── COMPOSER BRAIN ────────────────────────────────────
      this.mood=0.35; this.moodDir=0.006+Math.random()*0.012;
      this.moodHistory=[]; this.instrHistory=[]; this.motifHistory=[];
      this.measure=0; this.measureSinceModul=0; this.measureSinceInter=0;
      this.lastModulInterval=0; this.minMeasuresMod=8;
      this.intermezzoActive=false; this.intermezzoLeft=0;
      this.circleIndex=0; this.circleSteps=[0,7,2,9,4,11,6,1,8,3,10,5];

      // ── COOLDOWNY ─────────────────────────────────────────
      this.cooldown={VIOLA:0,LUTE:0,SITAR:0,CEMB:0,FLUTE:0,BELL:0,BODHRAN:0,DARBUKA:0,SHAKER:0,WOODBLOCK:0,ZILLS:0};

      // ── CEMBALO STATE ─────────────────────────────────────
      this.cembState={lastPattern:-1,lastTones:[],patternCount:0,restFor:0};

      // ── SPACE TRACKING ────────────────────────────────────
      this.nodeFiredThisMeasure=0; this.NODE_LIMIT=5;
      this.measuresSinceSolo=99; this.soloSuppressFor=0; this.foundationActive=false;

      // ── PHRASE STATE ──────────────────────────────────────
      this.solo={active:false,instrKey:null,instrFn:null,octave:1,stage:'idle',stageLeft:0,lastNote:4,direction:1,restFor:0};

      // ── PERKUSNÍ PATTERNY ─────────────────────────────────
      this.PERC_PATTERNS={
        low:{
          bodhran:[2,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0],
          darbuka:[2,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0],
          shaker: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
          woodblock:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          zills:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        },
        mid:{
          bodhran:[2,0,0,1,0,0,2,0,1,0,0,0,2,0,1,0],
          darbuka:[2,0,1,0,0,1,0,0,2,0,0,1,0,0,2,0],
          shaker: [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1],
          woodblock:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
          zills:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        },
        high:{
          bodhran:[2,0,1,0,2,0,1,0,2,1,0,1,2,0,2,0],
          darbuka:[2,0,1,1,0,1,2,0,1,0,2,1,0,1,0,2],
          shaker: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
          woodblock:[0,0,1,0,0,1,0,0,0,0,1,0,1,0,0,1],
          zills:  [0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0],
        },
      };
      this._percLivePattern=null; this._percLiveLevel=null; this._percMutateAt=0;

      // ── RYTMUS ────────────────────────────────────────────
      this.BPM=88; this.beatMs=60000/this.BPM;
      this.step16=0; this.step16Ms=this.beatMs/4;

      // ── AUCTION ───────────────────────────────────────────
      this._auctionDominant='SITAR'; this._auctionDensity=0.5;
      this._auctionTimeout=null; this._timeoutId=null;
      this._schedulerId=null; this._nextTickTime=0;
      this.SCHEDULE_INTERVAL=80; this.LOOKAHEAD=0.12;
    }

    // ── Filtry a routing ──────────────────────────────────────
    _makeBPF(loHz,hiHz,gain=1.0){
      const ctx=this.ctx;
      const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=loHz; hp.Q.value=0.65;
      const lp=ctx.createBiquadFilter(); lp.type='lowpass';  lp.frequency.value=hiHz; lp.Q.value=0.65;
      hp.connect(lp);
      const g=ctx.createGain(); g.gain.value=gain; lp.connect(g); g.connect(this.master);
      const rs=ctx.createGain(); rs.gain.value=0.28; g.connect(rs); rs.connect(this.reverbBus);
      return {in:hp,out:g};
    }
    _makeHPF(loHz,gain=1.0){
      const ctx=this.ctx;
      const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=loHz; hp.Q.value=0.7;
      const g=ctx.createGain(); g.gain.value=gain; hp.connect(g); g.connect(this.master);
      const rs=ctx.createGain(); rs.gain.value=0.15; g.connect(rs); rs.connect(this.reverbBus);
      return {in:hp,out:g};
    }
    _makeLPF(hiHz,gain=1.0){
      const ctx=this.ctx;
      const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=hiHz; lp.Q.value=0.65;
      const g=ctx.createGain(); g.gain.value=gain; lp.connect(g); g.connect(this.master);
      return {in:lp,out:g};
    }
    _toZone(zone,sourceNode){sourceNode.connect(this.zones[zone].in);}
    _sf(idx){return this.scale[Math.max(0,Math.min(idx,this.scale.length-1))];}
    _cf(chordTone,octShift=0){
      const c=this.CHORDS[this.chordIdx];
      const st=c.tones[Math.min(chordTone,c.tones.length-1)];
      return this.ROOT*Math.pow(2,(st+octShift*12)/12);
    }
    _nextChord(){
      const row=this.MARKOV[this.chordIdx];
      const total=row.reduce((a,b)=>a+b,0); let r=Math.random()*total;
      for(let i=0;i<row.length;i++){r-=row[i];if(r<=0)return i;} return 0;
    }

    // ── Melodické nástroje ────────────────────────────────────
    _playViola(freq,durSec,vel=0.38){
      if(!freq||durSec<=0)return;
      const ctx=this.ctx; const t=ctx.currentTime;
      const osc=ctx.createOscillator(); const osc2=ctx.createOscillator();
      const lfo=ctx.createOscillator(); const lfoG=ctx.createGain(); const gain=ctx.createGain();
      osc.type='sawtooth'; osc.frequency.value=freq;
      osc2.type='sawtooth'; osc2.frequency.value=freq*1.0018;
      lfo.type='sine'; lfo.frequency.value=5.0; lfoG.gain.value=freq*0.007;
      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(vel,t+0.22);
      gain.gain.setValueAtTime(vel*0.88,t+durSec-0.15); gain.gain.linearRampToValueAtTime(0,t+durSec);
      const mix=ctx.createGain(); mix.gain.value=0.7;
      osc.connect(gain); osc2.connect(mix); mix.connect(gain);
      this._toZone('VIOLA',gain);
      const rv=ctx.createGain(); rv.gain.value=0.35; gain.connect(rv); rv.connect(this.reverbBus);
      [osc,osc2,lfo].forEach(o=>{o.start(t);o.stop(t+durSec+0.1);});
    }
    _playLute(freq,durSec,vel=0.32){
      if(!freq||durSec<=0)return;
      const ctx=this.ctx; const t=ctx.currentTime;
      const osc1=ctx.createOscillator(); const osc2=ctx.createOscillator(); const gain=ctx.createGain();
      osc1.type='triangle'; osc1.frequency.value=freq;
      osc2.type='sine'; osc2.frequency.value=freq*2.005;
      const o2g=ctx.createGain(); o2g.gain.value=0.22;
      gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(vel,t+0.005);
      gain.gain.exponentialRampToValueAtTime(vel*0.28,t+0.18); gain.gain.exponentialRampToValueAtTime(0.001,t+durSec);
      osc1.connect(gain); osc2.connect(o2g); o2g.connect(gain);
      this._toZone('LUTE',gain);
      [osc1,osc2].forEach(o=>{o.start(t);o.stop(t+durSec+0.1);});
    }
    _playCemb(freq,durSec,vel=0.22){
      if(!freq||durSec<=0)return;
      const ctx=this.ctx; const t=ctx.currentTime;
      const carrier=ctx.createOscillator(); const modOsc=ctx.createOscillator();
      const modAmp=ctx.createGain(); const gain=ctx.createGain();
      carrier.type='sawtooth'; carrier.frequency.value=freq;
      modOsc.type='sine'; modOsc.frequency.value=freq*2.0;
      modAmp.gain.setValueAtTime(freq*0.9,t); modAmp.gain.exponentialRampToValueAtTime(freq*0.04,t+0.25);
      modOsc.connect(modAmp); modAmp.connect(carrier.frequency);
      gain.gain.setValueAtTime(vel,t); gain.gain.exponentialRampToValueAtTime(vel*0.55,t+0.1);
      gain.gain.exponentialRampToValueAtTime(vel*0.12,t+0.6); gain.gain.exponentialRampToValueAtTime(0.001,t+durSec);
      carrier.connect(gain);
      this._toZone('CEMB',gain);
      [carrier,modOsc].forEach(o=>{o.start(t);o.stop(t+durSec+0.1);});
    }
    _playSitar(freq,durSec,vel=0.28){
      if(!freq||durSec<=0)return;
      const ctx=this.ctx; const t=ctx.currentTime; const dur=Math.max(0.2,durSec);
      const osc=ctx.createOscillator(); const buzz=ctx.createOscillator();
      const modO=ctx.createOscillator(); const modG=ctx.createGain();
      const buzzG=ctx.createGain(); const gain=ctx.createGain();
      osc.type='sawtooth'; osc.frequency.value=freq;
      buzz.type='sawtooth'; buzz.frequency.value=freq*1.0032; buzzG.gain.value=0.18;
      modO.type='sine'; modO.frequency.value=6.2; modG.gain.value=freq*0.011;
      modO.connect(modG); modG.connect(osc.frequency);
      gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(vel,t+0.007);
      gain.gain.exponentialRampToValueAtTime(vel*0.38,t+0.16); gain.gain.exponentialRampToValueAtTime(0.001,t+dur);
      osc.connect(gain); buzz.connect(buzzG); buzzG.connect(gain);
      this._toZone('SITAR',gain);
      [osc,buzz,modO].forEach(o=>{o.start(t);o.stop(t+dur+0.1);});
    }
    _playFlute(freq,durSec,vel=0.18){
      if(!freq||durSec<=0)return;
      const ctx=this.ctx; const t=ctx.currentTime;
      const osc=ctx.createOscillator(); const lfo=ctx.createOscillator();
      const lfoG=ctx.createGain(); const gain=ctx.createGain();
      osc.type='sine'; osc.frequency.value=freq;
      lfo.type='sine'; lfo.frequency.value=4.8; lfoG.gain.value=freq*0.005;
      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      const noiseLen=Math.ceil(ctx.sampleRate*0.06);
      const nBuf=ctx.createBuffer(1,noiseLen,ctx.sampleRate); const nd=nBuf.getChannelData(0);
      for(let i=0;i<noiseLen;i++)nd[i]=(Math.random()*2-1)*Math.exp(-i/600);
      const noise=ctx.createBufferSource(); const noiseG=ctx.createGain();
      noise.buffer=nBuf; noiseG.gain.value=vel*0.12;
      gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(vel,t+0.065);
      gain.gain.setValueAtTime(vel*0.92,t+durSec-0.1); gain.gain.linearRampToValueAtTime(0,t+durSec);
      osc.connect(gain); noise.connect(noiseG); noiseG.connect(gain);
      this._toZone('FLUTE',gain);
      const rv=ctx.createGain(); rv.gain.value=0.45; gain.connect(rv); rv.connect(this.reverbBus);
      [osc,lfo].forEach(o=>{o.start(t);o.stop(t+durSec+0.1);}); noise.start(t); noise.stop(t+0.07);
    }
    _playBell(freq,vel=0.18){
      if(!freq)return;
      const ctx=this.ctx; const t=ctx.currentTime; const dur=2.2;
      const carrier=ctx.createOscillator(); const mod1=ctx.createOscillator(); const mod2=ctx.createOscillator();
      const m1A=ctx.createGain(); const m2A=ctx.createGain(); const gain=ctx.createGain();
      carrier.type='sine'; carrier.frequency.value=freq;
      mod1.type='sine'; mod1.frequency.value=freq*2.756;
      mod2.type='sine'; mod2.frequency.value=freq*5.404;
      m1A.gain.setValueAtTime(freq*3.2,t); m1A.gain.exponentialRampToValueAtTime(freq*0.08,t+1.8);
      m2A.gain.setValueAtTime(freq*1.4,t); m2A.gain.exponentialRampToValueAtTime(freq*0.01,t+0.9);
      mod1.connect(m1A); m1A.connect(carrier.frequency); mod2.connect(m2A); m2A.connect(carrier.frequency);
      gain.gain.setValueAtTime(vel,t); gain.gain.exponentialRampToValueAtTime(0.001,t+dur);
      carrier.connect(gain);
      this._toZone('BELL',gain);
      const rv=ctx.createGain(); rv.gain.value=0.55; gain.connect(rv); rv.connect(this.reverbBus);
      [carrier,mod1,mod2].forEach(o=>{o.start(t);o.stop(t+dur+0.1);});
    }

    // ── Perkusní nástroje ─────────────────────────────────────
    _playBodhran(vel=0.5,type='open'){
      const ctx=this.ctx; const t=ctx.currentTime;
      if(type==='open'){
        const osc=ctx.createOscillator(); const gain=ctx.createGain();
        osc.type='sine'; osc.frequency.setValueAtTime(120,t); osc.frequency.exponentialRampToValueAtTime(55,t+0.18);
        gain.gain.setValueAtTime(vel,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.32);
        osc.connect(gain); this._toZone('BODHRAN',gain); osc.start(t); osc.stop(t+0.35);
        const bufLen=Math.ceil(ctx.sampleRate*0.04); const buf=ctx.createBuffer(1,bufLen,ctx.sampleRate);
        const d=buf.getChannelData(0);
        for(let i=0;i<bufLen;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/400);
        const src=ctx.createBufferSource(); const filt=ctx.createBiquadFilter(); const sG=ctx.createGain();
        filt.type='lowpass'; filt.frequency.value=280; src.buffer=buf; sG.gain.value=vel*0.4;
        src.connect(filt); filt.connect(sG); this._toZone('BODHRAN',sG); src.start(t);
      } else {
        const osc=ctx.createOscillator(); const gain=ctx.createGain();
        osc.type='sine'; osc.frequency.setValueAtTime(180,t); osc.frequency.exponentialRampToValueAtTime(90,t+0.06);
        gain.gain.setValueAtTime(vel*0.6,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.1);
        osc.connect(gain); this._toZone('BODHRAN',gain); osc.start(t); osc.stop(t+0.12);
      }
    }
    _playDarbuka(vel=0.45,type='dom'){
      const ctx=this.ctx; const t=ctx.currentTime;
      if(type==='dom'){
        const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type='sine';
        osc.frequency.setValueAtTime(200,t); osc.frequency.exponentialRampToValueAtTime(80,t+0.12);
        gain.gain.setValueAtTime(vel,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.22);
        osc.connect(gain); this._toZone('DARBUKA',gain); osc.start(t); osc.stop(t+0.25);
      } else if(type==='tek'){
        const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type='triangle';
        osc.frequency.setValueAtTime(600,t); osc.frequency.exponentialRampToValueAtTime(220,t+0.05);
        gain.gain.setValueAtTime(vel*0.7,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.09);
        osc.connect(gain); this._toZone('DARBUKA',gain); osc.start(t); osc.stop(t+0.11);
        const bufLen=Math.ceil(ctx.sampleRate*0.015); const buf=ctx.createBuffer(1,bufLen,ctx.sampleRate);
        const d=buf.getChannelData(0);
        for(let i=0;i<bufLen;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/150);
        const src=ctx.createBufferSource(); const sG=ctx.createGain();
        src.buffer=buf; sG.gain.value=vel*0.5; src.connect(sG); this._toZone('DARBUKA',sG); src.start(t);
      } else {
        const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type='sine';
        osc.frequency.setValueAtTime(320,t); osc.frequency.exponentialRampToValueAtTime(180,t+0.04);
        gain.gain.setValueAtTime(vel*0.35,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.07);
        osc.connect(gain); this._toZone('DARBUKA',gain); osc.start(t); osc.stop(t+0.09);
      }
    }
    _playShaker(vel=0.12){
      const ctx=this.ctx; const t=ctx.currentTime;
      const durSec=this.step16Ms/1000*0.7;
      const bufLen=Math.ceil(ctx.sampleRate*durSec); const buf=ctx.createBuffer(1,bufLen,ctx.sampleRate);
      const d=buf.getChannelData(0);
      for(let i=0;i<bufLen;i++){
        const env=Math.exp(-i/(bufLen*0.15))+Math.exp(-(i-bufLen*0.4)/(bufLen*0.1))*0.4;
        d[i]=(Math.random()*2-1)*Math.max(0,env)*0.8;
      }
      const src=ctx.createBufferSource(); const filt=ctx.createBiquadFilter(); const gain=ctx.createGain();
      filt.type='highpass'; filt.frequency.value=4000; filt.Q.value=0.5;
      src.buffer=buf; gain.gain.value=vel*(0.85+Math.random()*0.3);
      src.connect(filt); filt.connect(gain); this._toZone('SHAKER',gain); src.start(t);
    }
    _playWoodblock(vel=0.18){
      const ctx=this.ctx; const t=ctx.currentTime;
      [800,1200].forEach((freq,i)=>{
        const osc=ctx.createOscillator(); const gain=ctx.createGain();
        osc.type='square'; osc.frequency.value=freq;
        gain.gain.setValueAtTime(vel/(i+1),t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.035);
        osc.connect(gain); this._toZone('WOODBLOCK',gain); osc.start(t); osc.stop(t+0.04);
      });
      const bufLen=Math.ceil(ctx.sampleRate*0.008); const buf=ctx.createBuffer(1,bufLen,ctx.sampleRate);
      const d=buf.getChannelData(0);
      for(let i=0;i<bufLen;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/80);
      const src=ctx.createBufferSource(); const sG=ctx.createGain();
      src.buffer=buf; sG.gain.value=vel*0.6; src.connect(sG); this._toZone('WOODBLOCK',sG); src.start(t);
    }
    _playZills(vel=0.14){
      const ctx=this.ctx; const t=ctx.currentTime; const dur=1.4;
      [1800,1812,4200].forEach((freq,i)=>{
        const osc=ctx.createOscillator(); const gain=ctx.createGain();
        osc.type='sine'; osc.frequency.value=freq;
        gain.gain.setValueAtTime(vel/(i*0.8+1),t); gain.gain.exponentialRampToValueAtTime(0.001,t+dur/(i+1));
        osc.connect(gain); this._toZone('ZILLS',gain);
        const rv=ctx.createGain(); rv.gain.value=0.4; gain.connect(rv); rv.connect(this.reverbBus);
        osc.start(t); osc.stop(t+dur+0.05);
      });
    }

    // ── Perkusní tick ─────────────────────────────────────────
    _mutateLivePattern(base){
      const live={};
      for(const [instr,pat] of Object.entries(base)){
        live[instr]=[...pat];
        const mutations=1+Math.floor(Math.random()*2);
        for(let m=0;m<mutations;m++){
          const idx=Math.floor(Math.random()*16);
          if(live[instr][idx]>0){live[instr][idx]=Math.random()<0.5?0:1;}
          else{live[instr][idx]=Math.random()<0.4?1:0;}
        }
      }
      return live;
    }
    _tickPercussion(){
      const level=this.mood<0.32?'low':this.mood<0.65?'mid':'high';
      const s=this.step16;
      if(s===0){
        if(this._percLiveLevel!==level||this.measure>=this._percMutateAt){
          this._percLivePattern=this._mutateLivePattern(this.PERC_PATTERNS[level]);
          this._percLiveLevel=level;
          this._percMutateAt=this.measure+2+Math.floor(Math.random()*3);
        }
      }
      const pat=this._percLivePattern||this.PERC_PATTERNS[level];
      const bodVal=pat.bodhran[s];
      if(bodVal===2)this._playBodhran(0.42+this.mood*0.18,'open');
      else if(bodVal===1)this._playBodhran(0.22+this.mood*0.1,'muted');
      const darbVal=pat.darbuka[s];
      if(darbVal===2)this._playDarbuka(0.38+this.mood*0.15,'dom');
      else if(darbVal===1)this._playDarbuka(0.22+this.mood*0.1,Math.random()<0.6?'tek':'ka');
      if(pat.shaker[s]===1){
        const skip=this.mood<0.25&&Math.random()<0.5;
        if(!skip)this._playShaker((0.06+this.mood*0.08)*(0.7+Math.random()*0.6));
      }
      if(pat.woodblock[s]===1)this._playWoodblock(0.14+this.mood*0.08);
      if(pat.zills&&pat.zills[s]===1&&this.mood>0.45)this._playZills(0.10+this.mood*0.07);
    }

    // ── Composer Brain ────────────────────────────────────────
    _scoreSpace(){
      const density=1-Math.min(1,this.nodeFiredThisMeasure/this.NODE_LIMIT);
      const silence=Math.min(1,this.measuresSinceSolo/5);
      const foundation=this.foundationActive?1:0;
      const tail=Math.min(1,this.measureSinceModul/3);
      return (density*0.35)+(silence*0.35)+(foundation*0.15)+(tail*0.15);
    }
    _scoreModulation(){
      const dist=Math.min(this.circleIndex,12-this.circleIndex);
      const tension=dist/6;
      const hist=this.moodHistory.slice(-8); let trajectory=0;
      if(hist.length>=4){
        const half=Math.floor(hist.length/2);
        const avgOld=hist.slice(0,half).reduce((a,b)=>a+b,0)/half;
        const avgNew=hist.slice(half).reduce((a,b)=>a+b,0)/(hist.length-half);
        trajectory=Math.min(1,Math.abs(avgNew-avgOld)*3);
      }
      const recent=this.instrHistory.slice(-12);
      const saturation=1-(new Set(recent).size/7);
      const stag=Math.min(1,this.measureSinceModul/24);
      return (tension*0.30)+(trajectory*0.25)+(saturation*0.20)+(stag*0.25);
    }
    _scoreIntermezzo(){
      const jumpScore=this.lastModulInterval>=6?1.0:this.lastModulInterval/6;
      const moodPeak=(this.mood>0.78||this.mood<0.18)?1.0:0.3;
      const timeSince=Math.min(1,this.measureSinceInter/20);
      return (jumpScore*0.40)+(moodPeak*0.35)+(timeSince*0.25);
    }
    _evaluateComposer(){
      this.moodHistory.push(this.mood);
      if(this.moodHistory.length>32)this.moodHistory.shift();
      this.measureSinceModul++; this.measureSinceInter++;
      if(this.measureSinceModul<this.minMeasuresMod)return;
      const modScore=this._scoreModulation();
      const intScore=this._scoreIntermezzo();
      const modThresh=0.62-(this.measureSinceModul*0.007);
      if(intScore>0.58&&this.measureSinceInter>=12&&!this.intermezzoActive)this._triggerIntermezzo();
      else if(modScore>modThresh)this._triggerModulation();
    }
    _triggerModulation(){
      let step;
      if(this.mood>0.72)step=Math.random()>0.5?6:5;
      else if(this.mood>0.42)step=Math.random()>0.5?1:2;
      else step=1;
      const dir=Math.random()>0.38?1:-1;
      const prev=this.circleIndex;
      this.circleIndex=(this.circleIndex+step*dir+12)%12;
      const semiShift=this.circleSteps[this.circleIndex]-this.circleSteps[prev];
      this.ROOT=this.ROOT*Math.pow(2,semiShift/12);
      this.scale=this.SCALE_ST.map(s=>this.ROOT*Math.pow(2,s/12));
      this.LEADING=this.ROOT*Math.pow(2,11/12);
      this.lastModulInterval=Math.abs(semiShift);
      this.measureSinceModul=0;
      this.moodDir=(0.006+Math.random()*0.016)*(Math.random()>0.5?1:-1);
    }
    _triggerIntermezzo(){
      this.intermezzoActive=true;
      this.intermezzoLeft=4+Math.floor(Math.random()*5);
      this.measureSinceInter=0;
    }

    // ── Motivický přehrávač ───────────────────────────────────
    _playMotif(motif,instrFn,octave=1,velMult=1.0){
      if(!motif)return; let offsetMs=0;
      for(const [idx,durBeats,vel] of motif){
        const durSec=durBeats*this.beatMs/1000;
        if(idx>=0){
          const freq=this._sf(idx+octave*7); const v=vel*velMult; const ms=offsetMs;
          setTimeout(()=>instrFn(freq,durSec*0.9,v),ms);
        }
        offsetMs+=durBeats*this.beatMs;
      }
    }
    _varyMotif(motif,chord){
      const transpose={tonic:0,dominant:2,sub:1,mediant:3,chromatic:1,relative:2}[chord.color]||0;
      return motif.map(([idx,dur,vel])=>{
        let newIdx=idx>=0?idx+transpose:-1;
        if(idx>=0&&Math.random()<0.12)newIdx+=Math.random()<0.5?1:-1;
        const velMod=vel*(0.72+this.mood*0.38);
        return [Math.max(0,newIdx),dur,velMod];
      });
    }

    // ── Vrstvy ────────────────────────────────────────────────
    _tickFoundation(){
      if(this.step16!==0)return;
      if(this.cooldown.VIOLA>0){this.cooldown.VIOLA--;return;}
      if(this.nodeFiredThisMeasure>=this.NODE_LIMIT)return;
      const chord=this.CHORDS[this.chordIdx];
      const bassFreq=this.ROOT*Math.pow(2,chord.bass/12);
      const quinFreq=bassFreq*Math.pow(2,7/12);
      const durSec=(this.beatMs*2)/1000;
      this._playViola(bassFreq,durSec,0.35+this.mood*0.12);
      this.foundationActive=true; this.nodeFiredThisMeasure++;
      if(this.mood>0.25){
        setTimeout(()=>{this._playViola(quinFreq,durSec*0.7,0.22+this.mood*0.08);this.nodeFiredThisMeasure++;},this.beatMs/2);
      }
      this.cooldown.VIOLA=2; this.instrHistory.push('VIOLA');
    }
    _tickTexture(){
      if(this.step16%4!==0)return;
      if(this.nodeFiredThisMeasure>=this.NODE_LIMIT)return;
      if(this.mood<0.18)return;
      const cs=this.cembState;
      if(cs.restFor>0){cs.restFor--;return;}
      if(this.cooldown.CEMB>0){this.cooldown.CEMB--;return;}
      const chord=this.CHORDS[this.chordIdx]; const base=this.ROOT*2;
      const patterns=['arp_up','arp_down','arp_skip','chord_burst','single_tone','arp_bounce'];
      let weights=[1,1,1,1,1,1];
      if(cs.lastPattern>=0)weights[cs.lastPattern]=0;
      if(this.mood<0.3){weights[3]=0;weights[4]=2;}
      if(this.mood>0.7){weights[4]=0;weights[3]=2;}
      const total=weights.reduce((a,b)=>a+b,0); let r=Math.random()*total; let patIdx=0;
      for(let i=0;i<weights.length;i++){r-=weights[i];if(r<=0){patIdx=i;break;}}
      cs.patternCount=patIdx===cs.lastPattern?cs.patternCount+1:0; cs.lastPattern=patIdx;
      const pat=patterns[patIdx]; const tones=chord.tones;
      const freqs=tones.map(st=>base*Math.pow(2,st/12));
      const humanize=()=>1+(Math.random()-0.5)*0.002;
      const vel=0.14+this.mood*0.09; const durB=(0.7+Math.random()*0.5)*this.beatMs/1000;
      if(pat==='arp_up'){freqs.forEach((f,i)=>setTimeout(()=>this._playCemb(f*humanize(),durB,vel),i*(55+this.mood*30)));}
      else if(pat==='arp_down'){[...freqs].reverse().forEach((f,i)=>setTimeout(()=>this._playCemb(f*humanize(),durB,vel),i*60));}
      else if(pat==='arp_skip'){[0,2,1].map(i=>freqs[Math.min(i,freqs.length-1)]).forEach((f,i)=>setTimeout(()=>this._playCemb(f*humanize(),durB,vel),i*65));}
      else if(pat==='chord_burst'){freqs.forEach((f,i)=>setTimeout(()=>this._playCemb(f*humanize(),durB*0.7,vel*0.9),i*22));}
      else if(pat==='single_tone'){
        const avoidIdx=cs.lastTones[0]||-1; let toneIdx=Math.floor(Math.random()*freqs.length);
        if(toneIdx===avoidIdx&&freqs.length>1)toneIdx=(toneIdx+1)%freqs.length;
        this._playCemb(freqs[toneIdx]*humanize(),durB*1.2,vel*0.85); cs.lastTones=[toneIdx];
      } else if(pat==='arp_bounce'){
        [0,2,1,0].map(i=>freqs[Math.min(i,freqs.length-1)]).forEach((f,i)=>setTimeout(()=>this._playCemb(f*humanize(),durB*0.65,vel),i*70));
      }
      if(chord.color==='dominant'&&Math.random()<0.35&&pat!=='single_tone'&&pat!=='chord_burst'){
        const lFreq=base*Math.pow(2,11/12);
        setTimeout(()=>this._playCemb(lFreq*humanize(),0.22,vel*0.75),tones.length*75);
      }
      this.nodeFiredThisMeasure++;
      this.cooldown.CEMB=Math.floor(1+(1-this.mood)*2);
      cs.restFor=Math.random()<0.25?2+Math.floor(Math.random()*3):0;
      this.instrHistory.push('CEMB'); if(this.instrHistory.length>24)this.instrHistory.shift();
    }

    // ── Phrase Arc ────────────────────────────────────────────
    _phraseNote(stage){
      const s=this.solo; const len=this.scale.length; let idx=s.lastNote;
      if(stage==='intro'){
        if(Math.random()<0.45)return null;
        idx=Math.max(0,Math.min(len-1,idx+s.direction*(1+(Math.random()<0.3?1:0))));
      } else if(stage==='develop'){
        if(Math.random()<0.2)return null;
        const step=s.direction*(1+(Math.random()<0.5?1:0));
        idx=Math.max(2,Math.min(len-3,idx+step));
        if(Math.random()<0.1){
          const f=this._sf(idx)*Math.pow(2,(Math.random()<0.5?1:-1)/12);
          s.lastNote=idx; return f;
        }
      } else if(stage==='peak'){
        if(Math.random()<0.1)return null;
        const target=Math.min(len-1,Math.max(6,idx+2));
        idx=Math.random()<0.6?target:Math.max(4,idx+1);
      } else if(stage==='cadence'){
        if(Math.random()<0.25)return null;
        const target=Math.random()<0.6?0:4;
        idx=idx>target?Math.max(target,idx-(1+(Math.random()<0.4?1:0))):idx;
      }
      s.lastNote=Math.max(0,Math.min(len-1,idx));
      return this._sf(s.lastNote+s.octave*7);
    }
    _phraseDur(stage){
      const b=this.beatMs/1000;
      if(stage==='intro')return b*(1.0+Math.random()*1.0);
      if(stage==='develop')return b*(0.5+Math.random()*0.75);
      if(stage==='peak')return b*(0.25+Math.random()*0.5);
      if(stage==='cadence')return b*(1.0+Math.random()*1.5);
      return b;
    }
    _phraseVel(stage){
      if(stage==='intro')return 0.18+this.mood*0.12;
      if(stage==='develop')return 0.24+this.mood*0.14;
      if(stage==='peak')return 0.32+this.mood*0.18;
      if(stage==='cadence')return 0.16+this.mood*0.08;
      return 0.2;
    }
    _advancePhraseState(){
      const s=this.solo;
      const next={idle:'intro',intro:'develop',develop:Math.random()<0.7?'peak':'develop',peak:'cadence',cadence:'idle'}[s.stage]||'idle';
      s.stage=next;
      const stageDur={intro:2+Math.floor(Math.random()*3),develop:3+Math.floor(Math.random()*4),peak:1+Math.floor(Math.random()*2),cadence:2+Math.floor(Math.random()*2),idle:0};
      s.stageLeft=stageDur[next]||0;
      if(next==='idle'){s.active=false;s.instrKey=null;s.instrFn=null;s.restFor=2+Math.floor(Math.random()*4);this.instrHistory.push('REST');}
      if(next==='develop')s.direction=Math.random()<0.55?1:-1;
      if(next==='peak')s.direction=1;
      if(next==='cadence')s.direction=-1;
    }
    _tickSoloist(){
      if(this.step16!==0)return;
      const s=this.solo;
      if(!s.active&&s.restFor>0){s.restFor--;return;}
      if(!s.active&&s.stage==='idle'){
        if(this._scoreSpace()<0.42)return;
        if(this.nodeFiredThisMeasure>=this.NODE_LIMIT)return;
        let instrKey,instrFn,octave;
        if(this.mood<0.38){
          if(Math.random()<0.5){instrKey='LUTE';octave=1;instrFn=(f,d,v)=>this._playLute(f,d,v);}
          else{instrKey='SITAR';octave=1;instrFn=(f,d,v)=>this._playSitar(f,d,v);}
        } else if(this.mood<0.68){
          if(Math.random()<0.55){instrKey='SITAR';octave=1;instrFn=(f,d,v)=>this._playSitar(f,d,v);}
          else{instrKey='FLUTE';octave=2;instrFn=(f,d,v)=>this._playFlute(f,d,v);}
        } else {
          if(Math.random()<0.45){instrKey='FLUTE';octave=2;instrFn=(f,d,v)=>this._playFlute(f,d,v);}
          else{instrKey='SITAR';octave=2;instrFn=(f,d,v)=>this._playSitar(f,d,v);}
        }
        if(this.cooldown[instrKey]>0)return;
        s.active=true;s.instrKey=instrKey;s.instrFn=instrFn;s.octave=octave;
        s.stage='intro';s.stageLeft=2+Math.floor(Math.random()*3);
        s.lastNote=4;s.direction=Math.random()<0.5?1:-1;s.restFor=0;
        this.instrHistory.push(instrKey); this.measuresSinceSolo=0;
      }
      if(!s.active)return;
      const freq=this._phraseNote(s.stage);
      const dur=this._phraseDur(s.stage); const vel=this._phraseVel(s.stage);
      if(freq){s.instrFn(freq,dur*0.92,vel);this.nodeFiredThisMeasure++;this.cooldown[s.instrKey]=0;}
      s.stageLeft--;
      if(s.stageLeft<=0)this._advancePhraseState();
      this.instrHistory.push(s.instrKey||'REST');
      if(this.instrHistory.length>32)this.instrHistory.shift();
    }
    _tickOrnament(){
      if(this.step16!==0)return;
      if(this.cooldown.BELL>0){this.cooldown.BELL--;return;}
      const shouldRing=this.intermezzoActive?Math.random()<0.7:Math.random()<(0.18+this.mood*0.28);
      if(!shouldRing)return;
      const chord=this.CHORDS[this.chordIdx];
      const bellFreqs=[
        this.ROOT*Math.pow(2,chord.tones[0]/12)*4,
        this.ROOT*Math.pow(2,chord.tones[1%chord.tones.length]/12)*4,
        this.ROOT*Math.pow(2,chord.tones[2%chord.tones.length]/12)*4,
        this.ROOT*Math.pow(2,(chord.tones[0]+12)/12)*4,
      ];
      const count=this.mood>0.65?4:this.mood>0.4?2:1;
      for(let i=0;i<count;i++)setTimeout(()=>this._playBell(bellFreqs[i],0.12+this.mood*0.09),i*75);
      this.cooldown.BELL=6; this.nodeFiredThisMeasure++; this.instrHistory.push('BELL');
    }
    _tickLuteCounter(){
      if(this.step16%4!==2)return;
      if(this.cooldown.LUTE>0){this.cooldown.LUTE--;return;}
      if(this.nodeFiredThisMeasure>=this.NODE_LIMIT)return;
      if(this.mood<0.28)return;
      if(Math.random()>(0.28+this.mood*0.32))return;
      const chord=this.CHORDS[this.chordIdx];
      const intervals=[2,4,7]; const iv=intervals[Math.floor(Math.random()*intervals.length)];
      const st=chord.tones[Math.min(iv,chord.tones.length-1)];
      const freq=this.ROOT*2*Math.pow(2,st/12);
      const dur=(0.3+Math.random()*0.4)*this.beatMs/1000;
      this._playLute(freq,dur,0.22+this.mood*0.1);
      this.nodeFiredThisMeasure++; this.cooldown.LUTE=1; this.instrHistory.push('LUTE');
    }

    // ── Auction Phase ─────────────────────────────────────────
    _generateCandidateDNA(){
      const rootShift=Math.floor(Math.random()*12);
      const root=55.0*Math.pow(2,rootShift/12);
      const startChord=Math.floor(Math.random()*this.CHORDS.length);
      const mood=0.15+Math.random()*0.7;
      const dominants=['SITAR','FLUTE','LUTE'];
      const dominant=dominants[Math.floor(Math.random()*dominants.length)];
      const density=0.25+Math.random()*0.6; const bpmMod=0.92+Math.random()*0.16;
      return {root,rootShift,startChord,mood,dominant,density,bpmMod,score:0,intervalScore:0,spaceScore:0,moodArcScore:0,harmonyScore:0};
    }
    _applyDNA(dna){
      this.ROOT=dna.root;
      this.scale=this.SCALE_ST.map(s=>this.ROOT*Math.pow(2,s/12));
      this.LEADING=this.ROOT*Math.pow(2,11/12);
      this.chordIdx=dna.startChord; this.mood=dna.mood;
      this.moodDir=(0.006+Math.random()*0.012)*(Math.random()>0.5?1:-1);
      this.beatMs=(60000/this.BPM)*dna.bpmMod; this.step16Ms=this.beatMs/4;
      this._auctionDominant=dna.dominant; this._auctionDensity=dna.density;
      this.cembState.lastPattern=-1; this.cembState.restFor=0;
    }
    _initScoring(){return {notes:[],spaceScores:[],moodSamples:[],chordChanges:0};}
    _finalizeScore(scoring,dna){
      const uniqueFreqs=new Set(scoring.notes.map(f=>Math.round(f))).size;
      dna.intervalScore=scoring.notes.length>0?Math.min(1,uniqueFreqs/Math.max(1,scoring.notes.length)*2):0;
      dna.spaceScore=scoring.spaceScores.length>0?scoring.spaceScores.reduce((a,b)=>a+b,0)/scoring.spaceScores.length:0;
      const ms=scoring.moodSamples;
      if(ms.length>=2){
        const range=Math.max(...ms)-Math.min(...ms); const end=ms[ms.length-1];
        dna.moodArcScore=Math.min(1,range*2)*0.6+(end>0.3&&end<0.8?0.4:0.1);
      } else {dna.moodArcScore=0.3;}
      dna.harmonyScore=Math.min(1,scoring.chordChanges/4);
      dna.score=(dna.intervalScore*0.35)+(dna.spaceScore*0.30)+(dna.moodArcScore*0.20)+(dna.harmonyScore*0.15);
      return dna.score;
    }
    _runCandidate(dna,measures,scoring,onDone){
      this._applyDNA(dna); let measuresDone=0; let step=0;
      const tick=()=>{
        if(this._stopped){return;} // guard
        if(step===0){
          this.nodeFiredThisMeasure=0; this.measuresSinceSolo++; this.foundationActive=false;
          this.mood+=this.moodDir;
          if(this.mood>=0.95||this.mood<=0.08)this.moodDir*=-1;
          this.mood=Math.max(0.08,Math.min(0.95,this.mood));
          this.chordMeasure++;
          const prevChord=this.chordIdx; const dur=this.mood<0.4?4:2;
          if(this.chordMeasure>=dur){this.chordIdx=this._nextChord();this.chordMeasure=0;if(this.chordIdx!==prevChord)scoring.chordChanges++;}
          scoring.spaceScores.push(this._scoreSpace()); scoring.moodSamples.push(this.mood);
          measuresDone++;
          if(measuresDone>=measures){this._finalizeScore(scoring,dna);onDone();return;}
        }
        this.step16=step; this._tickFoundation();
        if(step%4===0&&this.mood>=0.18&&this.nodeFiredThisMeasure<this.NODE_LIMIT){
          if(this.cembState.restFor<=0&&this.cooldown.CEMB<=0){
            const chord=this.CHORDS[this.chordIdx]; const base=this.ROOT*2;
            chord.tones.forEach((st,i)=>{
              const f=base*Math.pow(2,st/12); scoring.notes.push(f);
              setTimeout(()=>this._playCemb(f,0.5,0.14+this.mood*0.08),i*60);
            });
            this.nodeFiredThisMeasure++; this.cooldown.CEMB=1+Math.floor((1-this.mood)*2);
          }
        }
        if(step===0&&this.soloSuppressFor<=0&&this._scoreSpace()>=0.42&&Math.random()<(this._auctionDensity||0.5)){
          const dom=this._auctionDominant||'SITAR'; let instrFn,instrKey,octave;
          if(dom==='FLUTE'){instrKey='FLUTE';octave=2;instrFn=(f,d,v)=>{scoring.notes.push(f);this._playFlute(f,d,v);};}
          else if(dom==='LUTE'){instrKey='LUTE';octave=1;instrFn=(f,d,v)=>{scoring.notes.push(f);this._playLute(f,d,v);};}
          else{instrKey='SITAR';octave=1;instrFn=(f,d,v)=>{scoring.notes.push(f);this._playSitar(f,d,v);};}
          if(this.cooldown[instrKey]<=0){
            const chord=this.CHORDS[this.chordIdx];
            const pool=Math.random()<0.5?this.CALLS:this.RESPONSES;
            const motif=this._varyMotif(pool[Math.floor(Math.random()*pool.length)],chord);
            this._playMotif(motif,instrFn,octave,0.8+this.mood*0.2);
            this.nodeFiredThisMeasure++; this.measuresSinceSolo=0;
            this.soloSuppressFor=2+Math.floor(Math.random()*3); this.cooldown[instrKey]=3;
          }
        }
        this._tickPercussion();
        step=(step+1)%16;
        const jitter=(Math.random()-0.5)*10;
        this._auctionTimeout=setTimeout(tick,this.step16Ms+jitter);
      };
      tick();
    }
    _silenceGap(measures,onDone){
      let m=0;
      const tick=()=>{
        if(this._stopped){return;} // guard — pokud byl engine zastaven
        if(m>=measures){onDone();return;}
        if(m===0)this._playBell(this.ROOT*4,0.07);
        m++;
        this._silenceId=setTimeout(tick,this.beatMs*4);
      };
      tick();
    }
    startAuction(){
      const NUM_CANDIDATES=3; const MEASURES_EACH=8; const SILENCE_MEASURES=2;
      this.master.gain.setValueAtTime(0,this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0.38,this.ctx.currentTime+1.2);
      const candidates=Array.from({length:NUM_CANDIDATES},()=>this._generateCandidateDNA());
      const scorings=candidates.map(()=>this._initScoring());
      let current=0;
      const runNext=()=>{
        if(this._stopped){return;} // guard
        if(current>=NUM_CANDIDATES){
          const winnerIdx=candidates.reduce((best,c,i)=>c.score>candidates[best].score?i:best,0);
          if(typeof this.onAuctionResult==='function')this.onAuctionResult({winner:winnerIdx+1,candidates});
          this._silenceGap(1,()=>{
            if(this._stopped){return;} // guard po silence
            this._applyDNA(candidates[winnerIdx]);
            this.master.gain.linearRampToValueAtTime(_musicVol*_masterVol,this.ctx.currentTime+3.5);
            this.step16=0;this.measure=0;this.chordMeasure=0;
            this.measuresSinceSolo=99;this.soloSuppressFor=0;this.nodeFiredThisMeasure=0;
            this.solo.active=false;this.solo.stage='idle';this.solo.restFor=0;this.solo.instrKey=null;
            this._percLivePattern=null;this._percMutateAt=0;
            Object.keys(this.cooldown).forEach(k=>this.cooldown[k]=0);
            this._timeoutId=setTimeout(()=>this._tick(),0);
          });
          return;
        }
        this._runCandidate(candidates[current],MEASURES_EACH,scorings[current],()=>{
          current++;
          if(current<NUM_CANDIDATES)this._silenceGap(SILENCE_MEASURES,runNext);
          else runNext();
        });
      };
      runNext();
    }

    // ── Hlavní tick ───────────────────────────────────────────
    _tick(){
      if(this._stopped){return;} // guard
      if(this.step16===0){
        this.mood+=this.moodDir;
        if(this.mood>=1.0||this.mood<=0.08){
          this.moodDir*=-1;
          if(Math.random()<0.12)this.moodDir=(0.005+Math.random()*0.018)*(Math.random()>0.5?1:-1);
        }
        this.mood=Math.max(0.08,Math.min(0.95,this.mood));
        if(this.intermezzoActive){
          this.intermezzoLeft--;
          if(this.intermezzoLeft<=0){this.intermezzoActive=false;this._triggerModulation();}
        }
        this.chordDur=this.mood<0.35?8:this.mood<0.65?4:2;
        this.chordMeasure++;
        if(this.chordMeasure>=this.chordDur){this.chordIdx=this._nextChord();this.chordMeasure=0;}
        this._evaluateComposer(); this.measure++;
      }
      if(!this.intermezzoActive){
        this._tickFoundation(); this._tickTexture(); this._tickSoloist();
        this._tickLuteCounter(); this._tickOrnament();
      } else {
        if(this.step16===0&&Math.random()<0.5){
          const freq=this._cf(0,0);
          this._playViola(freq,(this.beatMs*4)/1000,0.12);
        }
        this._tickOrnament();
      }
      this._tickPercussion();
      this.step16=(this.step16+1)%16;
      const jitter=(Math.random()-0.5)*11;
      this._timeoutId=setTimeout(()=>this._tick(),this.step16Ms+jitter);
    }

    setVolume(v){
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(v,this.ctx.currentTime,0.08);
    }

    start(){this._stopped=false;this.startAuction();}

    stop(){
      this._stopped=true; // halts all recursive callbacks
      clearTimeout(this._timeoutId);
      clearTimeout(this._auctionTimeout);
      clearTimeout(this._silenceId);
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(this.master.gain.value,this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0,this.ctx.currentTime+0.4);
    }
  }

  // MOBILE ENGINE — lite path, lookahead, polyphony cap 3
  // ══════════════════════════════════════════════════════════
  class MobileEngine{
    constructor(){
      this.ctx=_ctx;
      this.BPM=88;
      this.beatSec=60/this.BPM;
      this.step16Sec=this.beatSec/4;
      this.LOOKAHEAD=0.15;
      this.SCHEDULE_INTERVAL=100;

      this.ROOT=ROOT_BASE;
      this.scale=SCALE_ST.map(s=>this.ROOT*Math.pow(2,s/12));
      this.chordIdx=Math.floor(Math.random()*CHORDS_DEF.length);
      this.chordMeasure=0;
      this.chordDur=4;
      this.mood=0.3+Math.random()*0.4;
      this.moodDir=0.007+Math.random()*0.008;
      this.measure=0;
      this.step16=0;
      this._nextTickTime=this.ctx.currentTime+0.1;
      this._schedulerId=null;
      this._polyCount=0;
      this.POLY_CAP=3;
      this.cd={VIOLA:0,SITAR:0,LUTE:0};

      // Master — simple chain, no convolver
      this.master=this.ctx.createGain();
      this.master.gain.value=_musicVol*_masterVol;
      const comp=this.ctx.createDynamicsCompressor();
      comp.threshold.value=-10; comp.ratio.value=4;
      this.master.connect(comp); comp.connect(_dest);

      // Delay reverb (cheap)
      this.delay=this.ctx.createDelay(0.4);
      this.delay.delayTime.value=0.22;
      this.delayFB=this.ctx.createGain(); this.delayFB.gain.value=0.28;
      this.delayOut=this.ctx.createGain(); this.delayOut.gain.value=0.2;
      this.master.connect(this.delay); this.delay.connect(this.delayFB);
      this.delayFB.connect(this.delay); this.delay.connect(this.delayOut); this.delayOut.connect(this.master);
    }

    setVolume(v){this.master.gain.setTargetAtTime(v,this.ctx.currentTime,0.12);}

    _sf(idx){return this.scale[Math.max(0,Math.min(idx,this.scale.length-1))];}

    _sitar(freq,at,dur,vel=0.19){
      if(!freq||this._polyCount>=this.POLY_CAP)return;
      const c=this.ctx;
      const osc=c.createOscillator(); const lp=c.createBiquadFilter(); const g=c.createGain();
      osc.type='triangle'; osc.frequency.value=freq;
      lp.type='lowpass'; lp.frequency.value=1800; lp.Q.value=0.6;
      g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(vel,at+0.015);
      g.gain.exponentialRampToValueAtTime(vel*0.3,at+0.14); g.gain.exponentialRampToValueAtTime(0.001,at+dur);
      osc.connect(lp); lp.connect(g); g.connect(this.master);
      osc.start(at); osc.stop(at+dur+0.05); this._polyCount++;
      setTimeout(()=>this._polyCount=Math.max(0,this._polyCount-1),(dur+0.1)*1000);
    }

    _viola(freq,at,dur,vel=0.24){
      if(!freq||this._polyCount>=this.POLY_CAP)return;
      const c=this.ctx;
      const osc=c.createOscillator(); const lp=c.createBiquadFilter(); const g=c.createGain();
      osc.type='triangle'; osc.frequency.value=freq;
      lp.type='lowpass'; lp.frequency.value=780; lp.Q.value=0.5;
      g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(vel,at+0.35);
      g.gain.setValueAtTime(vel*0.75,at+dur-0.12); g.gain.linearRampToValueAtTime(0,at+dur);
      osc.connect(lp); lp.connect(g); g.connect(this.master);
      osc.start(at); osc.stop(at+dur+0.05); this._polyCount++;
      setTimeout(()=>this._polyCount=Math.max(0,this._polyCount-1),(dur+0.1)*1000);
    }

    _bodhran(at,vel=0.38,type='open'){
      const c=this.ctx; const osc=c.createOscillator(); const g=c.createGain();
      osc.type='sine';
      osc.frequency.setValueAtTime(type==='open'?110:165,at);
      osc.frequency.exponentialRampToValueAtTime(type==='open'?50:85,at+(type==='open'?0.14:0.05));
      g.gain.setValueAtTime(vel,at); g.gain.exponentialRampToValueAtTime(0.001,at+(type==='open'?0.24:0.08));
      osc.connect(g); g.connect(this.master);
      osc.start(at); osc.stop(at+0.3);
    }

    _shaker(at,vel=0.08){
      const c=this.ctx;
      const bufLen=Math.ceil(c.sampleRate*0.04);
      const buf=c.createBuffer(1,bufLen,c.sampleRate); const d=buf.getChannelData(0);
      for(let i=0;i<bufLen;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(bufLen*0.15))*0.8;
      const src=c.createBufferSource(); const hp=c.createBiquadFilter(); const g=c.createGain();
      hp.type='highpass'; hp.frequency.value=3500;
      src.buffer=buf; g.gain.value=vel;
      src.connect(hp); hp.connect(g); g.connect(this.master); src.start(at);
    }

    _doTick(at){
      if(this.step16===0){
        this.mood+=this.moodDir;
        if(this.mood>=0.92||this.mood<=0.1)this.moodDir*=-1;
        this.mood=Math.max(0.1,Math.min(0.9,this.mood));
        this.chordMeasure++;
        this.chordDur=this.mood<0.4?6:3;
        if(this.chordMeasure>=this.chordDur){this.chordIdx=_nextChordIdx(this.chordIdx);this.chordMeasure=0;}
        this.measure++;
        for(const k of Object.keys(this.cd))if(this.cd[k]>0)this.cd[k]--;
      }

      const s=this.step16;
      const chord=CHORDS_DEF[this.chordIdx];

      // Foundation — bas
      if(s===0&&this.cd.VIOLA<=0){
        const bassF=this.ROOT*Math.pow(2,chord.bass/12);
        this._viola(bassF,at,this.beatSec*2,0.28+this.mood*0.08);
        this.cd.VIOLA=3;
      }

      // Soloist — sitar, ogni 2 misure
      if(s===0&&this.measure%2===0&&this.cd.SITAR<=0&&this._polyCount<2){
        const scIdx=Math.floor(Math.random()*8);
        const freq=this._sf(scIdx+7); // oktáva výš
        const dur=this.beatSec*(0.5+Math.random()*0.8);
        this._sitar(freq,at,dur,0.2+this.mood*0.1);
        this.cd.SITAR=2;
      }

      // Bodhrán
      const bodPat=[2,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0];
      const bodMid=[2,0,0,1,0,0,2,0,1,0,0,0,2,0,1,0];
      const pat=this.mood<0.4?bodPat:bodMid;
      if(pat[s]===2)this._bodhran(at,0.36+this.mood*0.12,'open');
      else if(pat[s]===1)this._bodhran(at,0.18+this.mood*0.06,'muted');

      // Shaker
      const shkPat=[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0];
      if(shkPat[s]===1&&this.mood>0.2&&Math.random()>0.35)
        this._shaker(at,(0.05+this.mood*0.05)*(0.7+Math.random()*0.5));

      this.step16=(this.step16+1)%16;
    }

    _schedule(){
      if(this._stopped){return;}
      const now=this.ctx.currentTime;
      while(this._nextTickTime<now+this.LOOKAHEAD){
        this._doTick(this._nextTickTime);
        this._nextTickTime+=this.step16Sec;
      }
      this._schedulerId=setTimeout(()=>this._schedule(),this.SCHEDULE_INTERVAL);
    }

    setVolume(v){
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(v,this.ctx.currentTime,0.08);
    }

    start(){
      this._stopped=false;
      this._nextTickTime=this.ctx.currentTime+0.15;
      this._schedule();
      this.master.gain.setValueAtTime(0,this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(_musicVol*_masterVol,this.ctx.currentTime+2.5);
    }

    stop(){
      this._stopped=true;
      clearTimeout(this._schedulerId);
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(this.master.gain.value,this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0,this.ctx.currentTime+0.4);
    }
  }

  // ── Public API ─────────────────────────────────────────────
  let _starting=false; // guard proti double-start

  function _startEngine(){
    if(_running||_starting||!_enabled||_muted)return;
    if(!_ensureCtx())return;
    _resume();
    _starting=true;
    _engine=_isMobile?new MobileEngine():new DesktopEngine();
    _engine.start();
    _running=true;
    _starting=false;
  }

  function _stopEngine(){
    if(_engine){
      _engine.stop();
      // engine ref zrušíme až po fade (0.5s) — aby gain stihl dojet
      const dying=_engine;
      setTimeout(()=>{
        if(_engine===dying)_engine=null;
      },600);
    }
    _running=false;
    _starting=false;
  }

  function _syncVolume(){
    if(_engine&&_ctx){
      const v=_muted?0:_musicVol*_masterVol;
      _engine.setVolume(v);
    }
  }

  // User gesture bootstrap — jeden listener, odstraní se po prvním spuštění
  function _setupGestureBootstrap(){
    const handler=()=>{
      _gestureReady=true;
      _resume();
      if(_enabled&&!_muted&&!_running)_startEngine();
      document.body.removeEventListener('click',handler,true);
      document.body.removeEventListener('touchend',handler,true);
    };
    document.body.addEventListener('click',handler,true);
    document.body.addEventListener('touchend',handler,true);
  }

  _setupGestureBootstrap();

  return{
    setEnabled(v){
      _enabled=!!v;
      if(!_enabled)_stopEngine();
      else if(_gestureReady&&!_running&&!_muted)_startEngine();
    },
    setMusicVolume(v){
      _musicVol=Math.max(0,Math.min(1,v));
      _syncVolume();
    },
    setMasterVolume(v){
      _masterVol=Math.max(0,Math.min(1,v));
      _syncVolume();
      // Master ovlivňuje i FurnaceAudio
      if(typeof FurnaceAudio!=='undefined')FurnaceAudio.setVolume(G.audio.volume*_masterVol);
    },
    setMuted(v){
      _muted=!!v;
      if(_muted)_stopEngine();
      else if(_enabled&&_gestureReady&&!_running)_startEngine();
      _syncVolume();
      if(typeof FurnaceAudio!=='undefined')FurnaceAudio.setEnabled(!_muted&&G.audio.enabled);
    },
    get running(){return _running;},
    get isMobile(){return _isMobile;},
  };
})();
