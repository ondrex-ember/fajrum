// ════════════════════════════════════════════════════════════
// FURNACE AUDIO ENGINE — integrated from audio_sklarska-pec-v2
// Přepracovaný: méně white noise, organické praskání, reálné pauzy
// ════════════════════════════════════════════════════════════
const FurnaceAudio=(()=>{
  let _ctx=null,_engine=null,_running=false;
  let _volume=0.7,_enabled=true,_temp=0,_phase='off';

  function _tN(){return _temp/100;}

  class Engine{
    constructor(){
      this.master=_ctx.createGain(); this.master.gain.value=_volume;
      this.comp=_ctx.createDynamicsCompressor();
      this.comp.threshold.value=-12; this.comp.ratio.value=3;
      this.comp.attack.value=0.01; this.comp.release.value=0.2;
      this.master.connect(this.comp); this.comp.connect(_ctx.destination);
      this.fireGain=_ctx.createGain(); this.fireGain.gain.value=0.75;
      this.fireGain.connect(this.master);
      // Konvolver — kamenná vyzdívka
      this.echoBus=_ctx.createGain(); this.echoBus.gain.value=0;
      const rL=_ctx.sampleRate*2.5;
      const rB=_ctx.createBuffer(2,rL,_ctx.sampleRate);
      for(let c=0;c<2;c++){const d=rB.getChannelData(c);for(let i=0;i<rL;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/rL,5);}
      this.conv=_ctx.createConvolver(); this.conv.buffer=rB;
      this.echoBus.connect(this.conv); this.conv.connect(this.master);
      this.loops={}; this.intervals=[];
      this.rumbleGain=null; this.rumbleFilter=null;
      this.hissGain=null; this.hissFilter=null;
    }

    start(){
      this._startRumble(); this._startHiss();
      this._scheduleCrackle(); this._scheduleBubble(); this._scheduleMetal();
      this._scheduleDraft();
    }

    stop(){
      this.intervals.forEach(id=>clearInterval(id)); this.intervals=[];
      Object.values(this.loops).forEach(n=>{try{n.stop();}catch(e){}});
      this.loops={};
    }

    setVolume(v){
      if(this.master)this.master.gain.setTargetAtTime(v,_ctx.currentTime,0.2);
    }

    update(){
      if(!_running)return;
      const t=_tN(), now=_ctx.currentTime, isPc=_phase==='campaign';
      // Rumble: tiché v přípravě, silné v kampani
      if(this.rumbleGain){
        const rGain=isPc?t*0.35:t*0.06;
        this.rumbleGain.gain.setTargetAtTime(rGain,now,0.5);
      }
      if(this.rumbleFilter){
        this.rumbleFilter.frequency.setTargetAtTime(28+t*30,now,0.6);
      }
      // Hiss: velmi jemný
      if(this.hissGain){
        this.hissGain.gain.setTargetAtTime(isPc?t*0.012:t*0.004,now,0.4);
      }
      if(this.hissFilter){
        this.hissFilter.frequency.setTargetAtTime(1400+t*1200,now,0.4);
      }
      // Echo — kamenná vyzdívka rezonuje při vyšší teplotě
      const echoE=t>0.2?Math.min(1,(t-0.2)*1.1):0;
      this.echoBus.gain.setTargetAtTime(isPc?echoE*0.7:0,now,0.6);
    }

    // Brownian noise — sub-bass tělo pece
    _startRumble(){
      const sr=_ctx.sampleRate, bL=sr*3;
      const buf=_ctx.createBuffer(1,bL,sr);
      const d=buf.getChannelData(0); let last=0;
      for(let i=0;i<bL;i++){
        const w=Math.random()*2-1;
        d[i]=(last+(0.018*w))/1.018; last=d[i]; d[i]*=3.2;
      }
      const src=_ctx.createBufferSource(); src.buffer=buf; src.loop=true;
      this.rumbleFilter=_ctx.createBiquadFilter();
      this.rumbleFilter.type='lowpass'; this.rumbleFilter.frequency.value=35;
      this.rumbleGain=_ctx.createGain(); this.rumbleGain.gain.value=0;
      src.connect(this.rumbleFilter); this.rumbleFilter.connect(this.rumbleGain);
      this.rumbleGain.connect(this.fireGain); src.start();
      this.loops.rumble=src;
    }

    // Jemný brownian hiss — povrchová textura ohně
    _startHiss(){
      const sr=_ctx.sampleRate, bL=sr*2;
      const buf=_ctx.createBuffer(1,bL,sr);
      const d=buf.getChannelData(0); let last=0;
      for(let i=0;i<bL;i++){
        const w=Math.random()*2-1;
        d[i]=(last+(0.018*w))/1.018; last=d[i];
      }
      const src=_ctx.createBufferSource(); src.buffer=buf; src.loop=true;
      this.hissFilter=_ctx.createBiquadFilter();
      this.hissFilter.type='bandpass'; this.hissFilter.frequency.value=1600; this.hissFilter.Q.value=0.5;
      this.hissGain=_ctx.createGain(); this.hissGain.gain.value=0;
      src.connect(this.hissFilter); this.hissFilter.connect(this.hissGain);
      this.hissGain.connect(this.fireGain); src.start();
      this.loops.hiss=src;
    }

    // Praskání: stochastické skupiny s reálnými pauzami
    _scheduleCrackle(){
      const tick=()=>{
        if(!_running)return;
        const t=_tN(), isPc=_phase==='campaign';
        const crackleE=t>0.1?Math.min(1,(t-0.1)*1.4):0;
        // Tiché pauzy — realita: oheň není nepřetržitý
        const prob=isPc?0.25+crackleE*0.45:crackleE*0.1;
        if(Math.random()<prob){
          const now=_ctx.currentTime;
          const type=Math.random()>0.45?'sharp':'deep';
          this._crack(type,now+Math.random()*0.1,crackleE);
          // Skupina 2–3 prasků
          if(Math.random()<0.4){
            this._crack(Math.random()>0.5?'sharp':'deep',now+0.09+Math.random()*0.1,crackleE);
            if(Math.random()<0.3){
              this._crack('sharp',now+0.22+Math.random()*0.12,crackleE*0.7);
            }
          }
        }
        // Variabilní interval: 1.2–5s — reálné pauzy
        const next=1200+Math.random()*3800+(1-crackleE)*1500;
        this.intervals.push(setTimeout(tick,next));
      };
      this.intervals.push(setTimeout(tick,800+Math.random()*1200));
    }

    _crack(type,time,energy){
      const bS=_ctx.sampleRate*0.18;
      const buf=_ctx.createBuffer(1,bS,_ctx.sampleRate);
      const d=buf.getChannelData(0);
      const decay=type==='sharp'?35+Math.random()*25:6+Math.random()*4;
      for(let i=0;i<bS;i++)d[i]=(Math.random()*2-1)*Math.exp(-(i/bS)*decay);
      const src=_ctx.createBufferSource(); src.buffer=buf;
      const flt=_ctx.createBiquadFilter(); flt.type='bandpass';
      if(type==='sharp'){flt.frequency.value=2200+Math.random()*3500+_tN()*1200;flt.Q.value=0.9+Math.random();}
      else{flt.frequency.value=100+Math.random()*180;flt.Q.value=0.4+Math.random()*0.4;}
      const soft=_ctx.createBiquadFilter(); soft.type='lowpass';
      soft.frequency.value=4500+_tN()*1800;
      const g=_ctx.createGain();
      const vol=(type==='sharp'?0.2:0.35)*energy+Math.random()*0.08;
      g.gain.value=vol;
      src.connect(flt);flt.connect(soft);soft.connect(g);g.connect(this.fireGain);
      if(vol>0.3){const s=_ctx.createGain();s.gain.value=vol*0.5;g.connect(s);s.connect(this.echoBus);}
      src.start(time);
    }

    // Draft — pomalý průvan pecí (příprava i kampaň)
    _scheduleDraft(){
      const tick=()=>{
        if(!_running)return;
        const t=_tN(), breathE=t>0.15?Math.min(1,(t-0.15)*0.9):0;
        if(breathE>0.05&&Math.random()<0.3+breathE*0.2){
          const now=_ctx.currentTime;
          const dur=2.5+Math.random()*3.5;
          const bS=_ctx.sampleRate*dur;
          const buf=_ctx.createBuffer(1,bS,_ctx.sampleRate);
          const d=buf.getChannelData(0);let last=0;
          for(let i=0;i<bS;i++){const w=Math.random()*2-1;d[i]=(last+(0.015*w))/1.015;last=d[i];}
          const src=_ctx.createBufferSource();src.buffer=buf;
          const flt=_ctx.createBiquadFilter();flt.type='bandpass';
          flt.frequency.value=600+Math.random()*800+_tN()*600;flt.Q.value=0.3;
          const g=_ctx.createGain();
          const pk=0.008+breathE*0.012;
          g.gain.setValueAtTime(0,now);
          g.gain.linearRampToValueAtTime(pk,now+dur*0.35);
          g.gain.exponentialRampToValueAtTime(0.0001,now+dur);
          src.connect(flt);flt.connect(g);g.connect(this.fireGain);
          g.connect(this.echoBus);
          src.start(now);
        }
        this.intervals.push(setTimeout(tick,3000+Math.random()*5000));
      };
      this.intervals.push(setTimeout(tick,1500));
    }

    // Bublání skloviny — jen při vysoké teplotě
    _scheduleBubble(){
      const id=setInterval(()=>{
        if(!_running||_phase!=='campaign')return;
        const bubE=_tN()>0.5?Math.min(1,(_tN()-0.5)*2.5):0;
        if(bubE<0.05||Math.random()>bubE*0.4)return;
        const now=_ctx.currentTime;
        const freq=160+Math.random()*300+_tN()*180;
        const dur=0.05+Math.random()*0.1;
        const osc=_ctx.createOscillator();osc.type='sine';
        osc.frequency.setValueAtTime(freq,now);
        osc.frequency.exponentialRampToValueAtTime(freq*0.3,now+dur);
        const g=_ctx.createGain();
        g.gain.setValueAtTime(bubE*0.04,now);
        g.gain.exponentialRampToValueAtTime(0.001,now+dur);
        osc.connect(g);g.connect(this.fireGain);
        osc.start(now);osc.stop(now+dur+0.01);
      },300+Math.random()*400);
      this.intervals.push(id);
    }

    // Kovové zvuky — nástroje, kleště, pánev
    _scheduleMetal(){
      const id=setInterval(()=>{
        if(!_running||_phase!=='campaign')return;
        const metE=_tN()>0.7?Math.min(1,(_tN()-0.7)*3.5):0;
        if(metE<0.05||Math.random()>metE*0.2)return;
        const now=_ctx.currentTime;
        const freq=600+Math.random()*1600;
        const dur=0.15+Math.random()*0.35;
        [1,2.76,5.4].forEach((mult,i)=>{
          const osc=_ctx.createOscillator();osc.type='sine';
          osc.frequency.value=freq*mult;
          const g=_ctx.createGain();
          const d=dur/(1+i*1.2);
          g.gain.setValueAtTime(metE*0.025/(i+1),now);
          g.gain.exponentialRampToValueAtTime(0.001,now+d);
          osc.connect(g);g.connect(this.fireGain);
          const s=_ctx.createGain();s.gain.value=0.35;
          g.connect(s);s.connect(this.echoBus);
          osc.start(now);osc.stop(now+d+0.01);
        });
      },900+Math.random()*800);
      this.intervals.push(id);
    }
  }

  // Public API
  function _ensureCtx(){
    if(!_ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return false;
      _ctx=new AC({latencyHint:'interactive'});
    }
    if(_ctx.state==='suspended')_ctx.resume();
    return true;
  }

  return{
    setEnabled(v){
      _enabled=v;
      if(!v&&_running){this.stop();}
    },
    setVolume(v){
      _volume=clamp(v,0,1);
      if(_engine)_engine.setVolume(_volume);
    },
    setTemp(t){
      _temp=clamp(t,0,100);
      if(_engine)_engine.update();
    },
    setPhase(ph){
      // ph: 'off'|'prep'|'campaign'
      const wasOff=_phase==='off';
      _phase=ph;
      if(ph==='off'){this.stop();return;}
      if(!_enabled)return;
      if(!_running){
        if(!_ensureCtx())return;
        _engine=new Engine(); _engine.start(); _running=true;
      }
      if(_engine)_engine.update();
    },
    stop(){
      if(_engine){_engine.stop();_engine=null;}
      _running=false;
    },
    get enabled(){return _enabled;},
    get volume(){return _volume;}
  };
})();

