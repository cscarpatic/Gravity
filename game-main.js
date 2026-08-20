(() => {
  'use strict';

  const game=new window.GravityGame();
  const canvas=game.canvas;

  const pointerPos=e=>{
    const r=canvas.getBoundingClientRect();
    return{x:e.clientX-r.left,y:e.clientY-r.top};
  };

  canvas.addEventListener('pointerdown',e=>{
    if(!game.started||game.paused||game.resultLocked)return;
    game.pointer.down=true;
    const q=pointerPos(e);
    let best=null,bestD=Infinity;
    for(const p of game.planets){
      if(!p.draggable)continue;
      const d=Math.hypot(q.x-p.x,q.y-p.y);
      if(d<p.radius+34&&d<bestD){best=p;bestD=d;}
    }
    game.pointer.planet=best;
    if(best){try{canvas.setPointerCapture(e.pointerId);}catch{}game.ui.hint.classList.remove('visible');}
  },{passive:true});

  canvas.addEventListener('pointermove',e=>{
    if(!game.pointer.down||!game.pointer.planet||game.paused||game.resultLocked)return;
    const q=pointerPos(e);
    game.pointer.planet.x=q.x;
    game.pointer.planet.y=q.y;
    game.clampPlanets();
    game.preview();
  },{passive:true});

  const pointerUp=e=>{
    game.pointer.down=false;
    game.pointer.planet=null;
    try{canvas.releasePointerCapture(e.pointerId);}catch{}
  };
  canvas.addEventListener('pointerup',pointerUp,{passive:true});
  canvas.addEventListener('pointercancel',pointerUp,{passive:true});

  game.ui.start.addEventListener('click',()=>game.startRun());
  game.ui.pause.addEventListener('click',()=>game.pause());
  game.ui.resume.addEventListener('click',()=>game.resume());
  game.ui.restart.addEventListener('click',()=>game.restart());
  game.ui.next.addEventListener('click',()=>game.next());

  document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.running)game.pause();});
  window.addEventListener('resize',()=>game.resize(),{passive:true});

  function loop(t){
    const frame=Math.min(.035,(t-game.last)/1000);
    game.last=t;
    if(game.running&&!game.paused){
      game.acc+=frame;
      while(game.acc>=window.GD.DT){game.step(window.GD.DT);game.acc-=window.GD.DT;}
      if(game.hintTimer>0){game.hintTimer-=frame;if(game.hintTimer<=0)game.ui.hint.classList.remove('visible');}
    }
    game.render(t);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();