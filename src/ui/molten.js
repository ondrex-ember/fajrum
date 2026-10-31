// ── MOLTEN CANVAS — kombinace Bézier víření + canvas částice ──
let _moltenRaf=null;
let _moltenRafs=[]; // pole RAF handles pro více pánví
function startMoltenCanvas(canvas,temp,mc,seed){
  if(!mc||mc.speed===0)return null;
  // Seeded pseudo-random — každá pánev jiná bez závislosti na externích lib
  seed=seed||0;
  function sr(n){
    let x=Math.sin(seed*9301+n*49297+seed*n*233)*233280;
    return x-Math.floor(x);
  }
  const ctx=canvas.getContext("2d");
  const W=140,H=140;
  canvas.width=W;canvas.height=H;
  const cx=W/2,cy=H/2,R=W/2-3;
  // Per-slot variace — seed ovlivní charakter animace
  const swirlDir=sr(0)>0.5?1:-1;           // směr vývěrů (CW/CCW)
  const swirlSpeed=0.28+sr(1)*0.24;         // rychlost rotace (pomalejší/rychlejší)
  const bubbleRate=temp>60?(0.28+sr(2)*0.24):(0.08+sr(2)*0.12); // hustota bublin
  const blobScale=0.8+sr(3)*0.5;            // velikost vývěrů
  const particleSizeMult=0.7+sr(4)*0.7;     // velikost částic
  const tOffset=sr(5)*100;                  // časový offset (jiná fáze animace)
  const centerBias=sr(6)>0.5;              // vývěry spíš uprostřed nebo na okraji
  let t=tOffset;
  const pal={bg:[mc.c1,mc.c2,mc.c3],hot:mc.c3,glow:mc.glow};
  function mkParticle(){
    const angle=sr(Math.random()*999)*Math.PI*2;
    const rBias=centerBias?0.4:0.75;
    const r=sr(Math.random()*997)*R*rBias;
    const speed=(0.15+sr(Math.random()*993)*0.65)*(temp/60);
    const isBubble=sr(Math.random()*991)<bubbleRate;
    // Směr dle swirlDir — vývěry mají rotační složku
    const tangentX=swirlDir*Math.sin(angle)*speed*0.3;
    const tangentY=-swirlDir*Math.cos(angle)*speed*0.3;
    return{
      x:cx+Math.cos(angle)*r,
      y:cy+Math.sin(angle)*r,
      vx:(Math.random()-.5)*speed*.6+tangentX,
      vy:isBubble?-(speed*.7+Math.random()*.5):(Math.random()-.5)*speed+tangentY,
      life:Math.random(),
      maxLife:.35+Math.random()*.65,
      size:isBubble?(1+sr(Math.random()*989)*3.5)*particleSizeMult:(2.5+Math.random()*8)*particleSizeMult,
      isBubble,
      wobble:(Math.random()-.5)*.025*swirlDir,
      phase:Math.random()*Math.PI*2
    };
  }
  const pCount=Math.round((temp>80?28:temp>60?20:temp>40?13:8)*(0.8+sr(7)*0.4));
  const particles=[];
  for(let i=0;i<pCount;i++) particles.push(mkParticle());
  function drawMolten(){
    const grad=ctx.createRadialGradient(cx,cy*.9,0,cx,cy,R);
    grad.addColorStop(0,pal.bg[0]);
    grad.addColorStop(.5,pal.bg[1]);
    grad.addColorStop(1,pal.bg[2]);
    ctx.save();
    ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();
    ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    if(temp>15){
      for(let s=0;s<3;s++){
        // Každý slot má jiné fáze a rádius blobů
        const phaseOff=sr(s+8)*Math.PI*2;
        const rMult=blobScale*(0.28+s*.09);
        const sx=cx+Math.cos(t*swirlSpeed*(0.4+s*.3)*swirlDir+phaseOff)*R*rMult;
        const sy=cy+Math.sin(t*swirlSpeed*(0.35+s*.25)*swirlDir+phaseOff+s*1.7)*R*(rMult*.85);
        const sr2=R*(.25+s*.1)*blobScale;
        const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,sr2);
        const alpha=Math.min(.18,(temp/100)*.22);
        function hx(h,a){const r2=parseInt(h.slice(1,3),16),g2=parseInt(h.slice(3,5),16),b2=parseInt(h.slice(5,7),16);return`rgba(${r2},${g2},${b2},${a})`;}
        sg.addColorStop(0,hx(pal.hot,alpha));
        sg.addColorStop(1,"rgba(0,0,0,0)");
        ctx.beginPath();ctx.arc(sx,sy,sr2,0,Math.PI*2);
        ctx.fillStyle=sg;ctx.fill();
      }
    }
    ctx.restore();
  }
  function frame(){
    const raf=requestAnimationFrame(frame);
    canvas._moltenRaf=raf;
    t+=0.016;
    ctx.clearRect(0,0,W,H);
    drawMolten();
    ctx.save();
    ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.clip();
    particles.forEach((p,i)=>{
      p.life+=.006+Math.random()*.004;
      p.x+=p.vx+Math.sin(t*.9+p.phase)*(.25+sr(i%17)*.2);
      p.y+=p.vy;
      p.vx+=p.wobble;
      const dx=p.x-cx,dy=p.y-cy,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>R-p.size){p.vx-=(dx/dist)*.15;p.vy-=(dy/dist)*.15;}
      if(p.life>=p.maxLife){particles[i]=mkParticle();return;}
      const fadeIn=p.life<.2?p.life/.2:1;
      const fadeOut=p.life>p.maxLife*.7?1-(p.life-p.maxLife*.7)/(p.maxLife*.3):1;
      const alpha=fadeIn*fadeOut;
      if(p.isBubble){
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.strokeStyle=pal.hot;ctx.globalAlpha=alpha*.5;ctx.lineWidth=.8;ctx.stroke();
        ctx.beginPath();ctx.arc(p.x-p.size*.3,p.y-p.size*.3,p.size*.25,0,Math.PI*2);
        ctx.fillStyle="#ffffff";ctx.globalAlpha=alpha*.3;ctx.fill();
      }else{
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        const g=ctx.createRadialGradient(p.x-p.size*.3,p.y-p.size*.3,0,p.x,p.y,p.size);
        g.addColorStop(0,pal.hot);g.addColorStop(1,pal.bg[0]);
        ctx.fillStyle=g;ctx.globalAlpha=alpha*.25;ctx.fill();
      }
      ctx.globalAlpha=1;
    });
    ctx.restore();
    ctx.beginPath();ctx.arc(cx,cy,R-1,0,Math.PI*2);
    ctx.strokeStyle="#2a1608";ctx.lineWidth=3;ctx.stroke();
  }
  frame();
  return canvas;
}

