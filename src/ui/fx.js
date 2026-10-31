// Floating animated text feedback
function spawnFloatText(text, targetOrEvt, type = 'pos') {
  const el = document.createElement("div");
  el.className = "float-pill " + type;
  el.textContent = text;
  let cx = window.innerWidth / 2;
  let cy = window.innerHeight / 2;
  if (targetOrEvt) {
    if (targetOrEvt.target && targetOrEvt.target.getBoundingClientRect) {
      const rect = targetOrEvt.target.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top;
    } else if (targetOrEvt.getBoundingClientRect) {
      const rect = targetOrEvt.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top;
    } else if (typeof targetOrEvt.clientX === 'number') {
      cx = targetOrEvt.clientX;
      cy = targetOrEvt.clientY;
    }
  }
  el.style.left = Math.max(10, Math.min(window.innerWidth - 80, cx - 25)) + "px";
  el.style.top = Math.max(10, cy - 10) + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

// Global Keyboard Navigation
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if ((e.key === ' ' || e.key === 'Enter') && ['BUTTON', 'A', 'SUMMARY'].includes(document.activeElement?.tagName)) return;
    if (typeof G === 'undefined' || !G || G.phase !== 'playing') return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      processRound();
      FajrumSfx.play('season', 0.6);
    } else if (e.key >= '1' && e.key <= '9') {
      const tabKeys = ['overview', 'furnace', 'production', 'storage', 'market', 'accounts', 'parta', 'log', 'archiv'];
      const idx = parseInt(e.key) - 1;
      if (idx < tabKeys.length) {
        G.tab = tabKeys[idx];
        FajrumSfx.play('page', 0.4);
        render();
      }
    } else if (e.key.toLowerCase() === 'm') {
      G.audio.muted = !G.audio.muted;
      if (G.audio.muted) {
        FurnaceAudio.stop();
      } else {
        FurnaceAudio.setPhase(G.round < PREP ? 'prep' : 'campaign');
      }
      showToast(G.lang === 'cs' ? (G.audio.muted ? '🔇 Zvuk ztlumen' : '🔊 Zvuk zapnut') : (G.audio.muted ? '🔇 Sound muted' : '🔊 Sound enabled'), []);
      render();
    } else if (e.key === 'Escape') {
      if (G._activeModal) {
        G._activeModal = null;
        render();
      }
    }
  });
}

function spawnPills(evt, task){
  const pills=TASK_PILLS[task]||[];
  const rect=evt.target.getBoundingClientRect();
  const cx=rect.left+rect.width/2;
  const cy=rect.top;
  pills.forEach((p,i)=>{
    const el=document.createElement("div");
    el.className="task-pill "+(p.t||"neu");
    el.textContent=p.l;
    const offset=(i-(pills.length-1)/2)*38;
    el.style.left=(cx+offset-16)+"px";
    el.style.top=(cy-4)+"px";
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),950);
  });
}

// Toast systém
let _toastTimer=null;

function showToast(title, lines){
  let tc=document.getElementById("toastContainer");
  if(!tc){tc=document.createElement("div");tc.id="toastContainer";tc.className="toast-container";document.body.appendChild(tc);}
  tc.innerHTML="";
  const t=document.createElement("div");t.className="toast";
  if(title){const tl=document.createElement("div");tl.className="toast-title";tl.textContent=title;t.appendChild(tl);}
  lines.filter(Boolean).slice(0,8).forEach(l=>{const d=document.createElement("div");d.textContent=l;t.appendChild(d);});
  tc.appendChild(t);
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>{if(tc)tc.innerHTML="";},7000);
}
