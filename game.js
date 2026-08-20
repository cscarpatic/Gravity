(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = (id) => document.getElementById(id);
  const ui = {
    level: $('levelValue'), sat: $('satValue'), dock: $('dockValue'), score: $('scoreValue'),
    speed: $('speedValue'), speedFill: $('speedFill'), missionCard: $('missionCard'),
    missionTitle: $('missionTitle'), missionText: $('missionText'), start: $('startBtn'),
    pause: $('pauseBtn'), pauseOverlay: $('pauseOverlay'), resume: $('resumeBtn'),
    restart: $('restartBtn'), resultOverlay: $('resultOverlay'), resultIcon: $('resultIcon'),
    resultKicker: $('resultKicker'), resultTitle: $('resultTitle'), resultText: $('resultText'),
    next: $('nextBtn'), hint: $('hint')
  };

  const levels = [
    { name:'Prima orbita', text:'Un satellite, un dock. Impara a piegare la sua traiettoria.', sats:1, docks:1, mass:1250, radius:31, speed:142, dockR:42, maxDock:205, type:'ocean' },
    { name:'Doppio transito', text:'Due satelliti indipendenti, un dock riutilizzabile. Arrivano insieme ma ognuno segue la propria rotta.', sats:2, docks:1, mass:1720, radius:36, speed:150, dockR:40, maxDock:212, type:'rocky' },
    { name:'Gigante gassoso', text:'Tre satelliti indipendenti e due dock. Velocità e angoli iniziali sono diversi.', sats:3, docks:2, mass:2550, radius:49, speed:160, dockR:38, maxDock:224, type:'gas', ring:true },
    { name:'Fionda multipla', text:'Quattro satelliti, due dock. Leggi quattro orbite nello stesso momento.', sats:4, docks:2, mass:2350, radius:40, speed:182, dockR:36, maxDock:242, type:'lava' },
    { name:'Sistema binario', text:'Cinque satelliti, tre dock e due masse. Il secondo pianeta è fisso.', sats:5, docks:3, mass:2200, radius:38, speed:188, dockR:34, maxDock:244, type:'ice', second:true },
    { name:'Gravità estrema', text:'Sei satelliti indipendenti e quattro dock. Nessuna formazione: ogni rotta deve salvarsi da sola.', sats:6, docks:4, mass:3350, radius:46, speed:205, dockR:32, maxDock:258, type:'gas', ring:true, second:true }
  ];

  const palettes = {
    ocean:['#e8fbff','#4a9ce7','#173a84','#79d0b4','#73dcff'],
    rocky:['#ffe8c9','#bd7355','#562d38','#75493f','#ffb080'],
    gas:['#fff1cf','#cf9364','#50365e','#efc58f','#dcb5ff'],
    lava:['#fff0c9','#d95c3d','#411725','#ffad45','#ff765b'],
    ice:['#f5fdff','#73cada','#274c79','#c5f6ff','#a9eeff'],
    violet:['#ffeaff','#a960cc','#43235c','#e5b1ff','#d991ff']
  };

  const G = 108, SOFTEN = 38, DT = 1/120, TRAIL_MAX = 72;
  const anglePattern = [-.075,.052,-.118,.096,-.038,.132,-.15,.018];
  const speedPattern = [.94,1.035,.985,1.075,.955,1.045,1,1.09];
  let W=0,H=0,DPR=1,last=performance.now(),acc=0;
  let levelIndex=0, score=0, running=false, paused=false, started=false, resultLocked=false;
  let stars=[], satellites=[], docks=[], planets=[], previews=[];
  let docked=0,lost=0,hintTimer=0;
  const pointer={down:false,planet:null};

  const rand=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const L=()=>levels[levelIndex];
  const safeTop=()=>W<600?94:104;
  const safeBottom=()=>W<600?100:112;

  function resize(){
    const r=canvas.getBoundingClientRect();
    W=Math.max(320,r.width); H=Math.max(480,r.height); DPR=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(W*DPR); canvas.height=Math.round(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0);
    buildStars(); clampPlanets(); if(started&&!resultLocked) preview();
  }

  function buildStars(){
    const n=Math.round(W*H/360000*(70+levelIndex*9));
    stars=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,r:rand(.35,1.45),a:rand(.25,.9),p:rand(0,6.28),tw:rand(.7,2)}));
  }

  function lanes(count,top,bottom,wobble){
    if(count===1)return[(top+bottom)/2];
    return Array.from({length:count},(_,i)=>top+(bottom-top)*(i+1)/(count+1)+rand(-wobble,wobble));
  }

  function features(radius,type){
    return Array.from({length:type==='gas'?10:7},(_,i)=>({x:rand(-.55,.55)*radius,y:rand(-.55,.55)*radius,rx:rand(.08,.28)*radius,ry:rand(.035,.12)*radius,rot:rand(-.8,.8),a:rand(.08,.24),phase:rand(0,6.28),i}));
  }

  function planet(x,y,mass,radius,{type='ocean',ring=false,draggable=true,tilt=-.3}={}){
    return{x,y,mass,radius,type,ring,draggable,tilt,rot:rand(0,6.28),pulse:rand(0,6.28),features:features(radius,type)};
  }

  function spawn(){
    const l=L(), top=safeTop(), bottom=H-safeBottom(), playH=Math.max(260,bottom-top), mid=(top+bottom)/2;
    docked=0; lost=0; resultLocked=false;
    const dockYs=lanes(l.docks,top+58,bottom-58,Math.min(14,playH*.025));
    docks=dockYs.map((y,i)=>({id:i+1,x:W-Math.max(50,W*.075)-(i%2)*Math.min(28,W*.035),y,r:l.dockR,phase:i*.9,uses:0}));
    const satYs=lanes(l.sats,top+46,bottom-46,Math.min(10,playH*.02));
    satellites=satYs.map((y,i)=>{
      const reference=docks[(i*2+levelIndex)%docks.length];
      const bias=clamp((reference.y-y)/Math.max(620,W*1.45),-.055,.055);
      const angle=bias+anglePattern[i%anglePattern.length]*(levelIndex?.72:.25);
      const speed=l.speed*speedPattern[i%speedPattern.length];
      return{id:i+1,name:`S${i+1}`,x:Math.max(30,W*.047)-(i%2)*Math.min(18,W*.018),y,vx:speed*Math.cos(angle),vy:speed*Math.sin(angle),r:W<600?6.5:7.5,trail:[],rot:angle,status:'flying',lastSpeed:speed,pulse:rand(0,6.28),phase:i*.83};
    });
    const px=W*(H>W?.48:.5), py=clamp(mid+rand(-playH*.055,playH*.055),top+l.radius+16,bottom-l.radius-16);
    planets=[planet(px,py,l.mass,l.radius,{type:l.type,ring:l.ring,tilt:-.3+levelIndex*.025})];
    if(l.second) planets.push(planet(W*.70,clamp(mid-playH*.22,top+42,bottom-42),1400+levelIndex*180,28+levelIndex,{type:'violet',ring:levelIndex===5,draggable:false,tilt:.22}));
    running=false; paused=false; previews=[]; pointer.planet=null; hintTimer=0;
    ui.level.textContent=String(levelIndex+1); ui.sat.textContent=`0/${l.sats}`; ui.dock.textContent=String(l.docks); ui.score.textContent=String(score);
    ui.missionTitle.textContent=l.name; ui.missionText.textContent=l.text; ui.start.textContent=levelIndex?'Lancia i satelliti':'Inizia';
    ui.speed.textContent=l.speed.toFixed(1); ui.speedFill.style.width=`${Math.min(100,l.speed/3)}%`; ui.hint.classList.remove('visible');
  }

  function clampPlanets(){
    for(const p of planets){p.x=clamp(p.x,p.radius+14,W-p.radius-14);p.y=clamp(p.y,safeTop()+12+p.radius,H-safeBottom()-12-p.radius);}
  }

  function gravity(x,y){
    let ax=0,ay=0;
    for(const p of planets){const dx=p.x-x,dy=p.y-y,d2=dx*dx+dy*dy+SOFTEN*SOFTEN,inv=1/Math.sqrt(d2),a=G*p.mass/d2;ax+=a*dx*inv;ay+=a*dy*inv;}
    return{ax,ay};
  }

  function settle(s,status,target=null){
    if(s.status!=='flying')return;
    s.status=status;
    if(status==='docked'){docked++; if(target)target.uses++;} else lost++;
    telemetry();
    if(docked+lost===L().sats){
      if(!lost){const bonus=600+levelIndex*180+L().sats*90;score+=bonus;finish(true,'Tutti in salvo',`Tutti i ${L().sats} satelliti hanno raggiunto un dock con traiettorie indipendenti. Bonus +${bonus}.`);}
      else finish(false,`${docked}/${L().sats} in salvo`,`${lost} satellite${lost===1?'':'i'} pers${lost===1?'o':'i'}. Ogni satellite deve raggiungere autonomamente un dock.`);
    }
  }

  function stepSatellite(s,dt){
    if(s.status!=='flying')return;
    const g=gravity(s.x,s.y); s.vx+=g.ax*dt; s.vy+=g.ay*dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.rot=Math.atan2(s.vy,s.vx); s.lastSpeed=Math.hypot(s.vx,s.vy);
    if(!s.trail.length||Math.hypot(s.x-s.trail.at(-1).x,s.y-s.trail.at(-1).y)>5.5){s.trail.push({x:s.x,y:s.y});if(s.trail.length>TRAIL_MAX)s.trail.shift();}
    for(const p of planets)if(Math.hypot(s.x-p.x,s.y-p.y)<p.radius+s.r+2){settle(s,'lost');return;}
    for(const d of docks)if(Math.hypot(s.x-d.x,s.y-d.y)<d.r-2&&s.lastSpeed<=L().maxDock){const dist=Math.hypot(s.x-d.x,s.y-d.y),precision=Math.max(0,1-dist/d.r),speedBonus=Math.max(0,1-s.lastSpeed/L().maxDock);score+=Math.round(360+precision*280+speedBonus*160);settle(s,'docked',d);return;}
    const m=95;if(s.x<-m||s.x>W+m||s.y<-m||s.y>H+m)settle(s,'lost');
  }

  function step(dt){if(resultLocked)return;for(const s of satellites)stepSatellite(s,dt);telemetry();}
  function telemetry(){ui.sat.textContent=`${docked}/${L().sats}`;ui.score.textContent=String(score);const active=satellites.filter(s=>s.status==='flying'),max=active.length?Math.max(...active.map(s=>s.lastSpeed)):0;ui.speed.textContent=max.toFixed(1);ui.speedFill.style.width=`${Math.min(100,max/3)}%`;}

  function preview(){
    previews=satellites.map(sat=>{
      if(sat.status!=='flying')return[];
      const s={x:sat.x,y:sat.y,vx:sat.vx,vy:sat.vy},path=[];
      for(let i=0;i<132;i++){const g=gravity(s.x,s.y);s.vx+=g.ax/36;s.vy+=g.ay/36;s.x+=s.vx/36;s.y+=s.vy/36;if(i%4===0)path.push({x:s.x,y:s.y});if(planets.some(p=>Math.hypot(s.x-p.x,s.y-p.y)<p.radius+4)||s.x<-20||s.x>W+20||s.y<-20||s.y>H+20)break;}
      return path;
    });
  }

  function finish(ok,title,text){
    resultLocked=true;running=false;ui.resultOverlay.classList.remove('hidden');ui.resultIcon.textContent=ok?'✓':'×';ui.resultIcon.style.color=ok?'var(--success)':'var(--danger)';ui.resultIcon.style.background=ok?'rgba(128,241,192,.12)':'rgba(255,122,145,.12)';ui.resultKicker.textContent=ok?'SATELLITI AGGANCIATI':'MISSIONE INCOMPLETA';ui.resultTitle.textContent=title;ui.resultText.textContent=text;ui.next.textContent=ok?(levelIndex===levels.length-1?'Ricomincia il viaggio':'Livello successivo'):'Riprova';ui.next.dataset.success=ok?'1':'0';
  }

  function startRun(){started=true;running=true;paused=false;ui.missionCard.classList.add('hidden');ui.pauseOverlay.classList.add('hidden');ui.resultOverlay.classList.add('hidden');ui.hint.textContent=L().sats>1?'☝️ Sposta il pianeta · ogni satellite ha la sua rotta':'☝️ Trascina il pianeta';ui.hint.classList.add('visible');hintTimer=3;preview();}
  function restart(){spawn();ui.missionCard.classList.add('hidden');started=true;running=true;preview();}
  function next(){const ok=ui.next.dataset.success==='1';ui.resultOverlay.classList.add('hidden');if(!ok)return restart();levelIndex++;if(levelIndex>=levels.length){levelIndex=0;score=0;}buildStars();spawn();ui.missionCard.classList.remove('hidden');}
  function pause(){if(!started||resultLocked)return;paused=true;running=false;ui.pauseOverlay.classList.remove('hidden');}
  function resume(){paused=false;running=true;ui.pauseOverlay.classList.add('hidden');}

  function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  canvas.addEventListener('pointerdown',e=>{if(!started||paused||resultLocked)return;pointer.down=true;const q=pointerPos(e);let best=null,bestD=Infinity;for(const p of planets){if(!p.draggable)continue;const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<p.radius+34&&d<bestD){best=p;bestD=d;}}pointer.planet=best;if(best){try{canvas.setPointerCapture(e.pointerId)}catch{}ui.hint.classList.remove('visible');}},{passive:true});
  canvas.addEventListener('pointermove',e=>{if(!pointer.down||!pointer.planet||paused||resultLocked)return;const q=pointerPos(e);pointer.planet.x=q.x;pointer.planet.y=q.y;clampPlanets();preview();},{passive:true});
  function pointerUp(e){pointer.down=false;pointer.planet=null;try{canvas.releasePointerCapture(e.pointerId)}catch{}}
  canvas.addEventListener('pointerup',pointerUp,{passive:true});canvas.addEventListener('pointercancel',pointerUp,{passive:true});
  ui.start.addEventListener('click',startRun);ui.pause.addEventListener('click',pause);ui.resume.addEventListener('click',resume);ui.restart.addEventListener('click',restart);ui.next.addEventListener('click',next);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause();});window.addEventListener('resize',resize,{passive:true});

  function background(t){
    ctx.fillStyle='#050816';ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(W*.5,H*.48,20,W*.5,H*.48,Math.max(W,H)*.8);g.addColorStop(0,'rgba(61,82,165,.14)');g.addColorStop(.55,'rgba(29,40,91,.05)');g.addColorStop(1,'rgba(5,8,22,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    for(const s of stars){ctx.globalAlpha=s.a*(.68+.32*Math.sin(t*.001*s.tw+s.p));ctx.fillStyle='#edf1ff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fill();}ctx.globalAlpha=1;
  }

  function drawDock(d,t){
    d.phase+=.014;const r=d.r*(1+Math.sin(t*.004+d.id)*.045);ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.phase);ctx.strokeStyle='rgba(128,241,192,.86)';ctx.lineWidth=2;ctx.setLineDash([9,8]);ctx.beginPath();ctx.arc(0,0,r,0,6.28);ctx.stroke();ctx.setLineDash([]);const rg=ctx.createRadialGradient(0,0,2,0,0,r*1.12);rg.addColorStop(0,'rgba(128,241,192,.15)');rg.addColorStop(1,'rgba(128,241,192,0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(0,0,r*1.12,0,6.28);ctx.fill();ctx.restore();ctx.fillStyle='rgba(220,255,244,.9)';ctx.font='700 9px system-ui';ctx.textAlign='center';ctx.fillText(`D${d.id}`,d.x,d.y+3);
  }

  function gravityWell(p,t){ctx.save();for(let i=1;i<=5;i++){const rr=p.radius+i*(17+p.mass/760);ctx.globalAlpha=.04+(5-i)*.017;ctx.strokeStyle=p.draggable?'#9db2ff':'#dba6ff';ctx.lineWidth=i===1?1.4:1;ctx.beginPath();ctx.ellipse(p.x,p.y,rr+Math.sin(t*.0014+i+p.pulse)*2,rr*(.72+i*.025),p.tilt*.22,0,6.28);ctx.stroke();}ctx.restore();}

  function planetRing(p,front){if(!p.ring)return;const c=palettes[p.type];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.tilt);ctx.scale(1,.31);ctx.lineCap='round';ctx.lineWidth=Math.max(5,p.radius*.16);ctx.strokeStyle=front?`${c[0]}bb`:`${c[3]}66`;ctx.beginPath();ctx.arc(0,0,p.radius*1.58,front?0:Math.PI,front?Math.PI:6.28);ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle=front?'rgba(255,255,255,.54)':'rgba(255,255,255,.16)';ctx.beginPath();ctx.arc(0,0,p.radius*1.76,front?.08:Math.PI+.08,front?Math.PI-.08:6.28-.08);ctx.stroke();ctx.restore();}

  function drawPlanet(p,t){
    gravityWell(p,t);planetRing(p,false);const c=palettes[p.type],r=p.radius;ctx.save();ctx.shadowColor=`${c[4]}88`;ctx.shadowBlur=Math.max(14,r*.58);ctx.fillStyle=c[2];ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.28);ctx.fill();ctx.shadowBlur=0;
    ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.28);ctx.clip();const sphere=ctx.createRadialGradient(p.x-r*.35,p.y-r*.4,r*.05,p.x+r*.2,p.y+r*.2,r*1.2);sphere.addColorStop(0,c[0]);sphere.addColorStop(.27,c[1]);sphere.addColorStop(.72,c[2]);sphere.addColorStop(1,'#080d22');ctx.fillStyle=sphere;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);p.rot+=.0002;
    if(p.type==='gas'){for(let i=-5;i<=5;i++){const yy=p.y+i*r*.18+Math.sin(t*.0007+i)*r*.025;ctx.globalAlpha=.12+(i%2===0?.06:0);ctx.strokeStyle=i%2===0?c[0]:c[3];ctx.lineWidth=Math.max(2,r*.075);ctx.beginPath();ctx.moveTo(p.x-r*1.1,yy);ctx.bezierCurveTo(p.x-r*.35,yy-r*.08,p.x+r*.35,yy+r*.08,p.x+r*1.1,yy);ctx.stroke();}}
    else for(const f of p.features){ctx.save();ctx.translate(p.x+f.x+Math.sin(p.rot+f.phase)*r*.025,p.y+f.y);ctx.rotate(f.rot);ctx.globalAlpha=f.a;ctx.fillStyle=c[3];ctx.beginPath();ctx.ellipse(0,0,f.rx,f.ry,0,0,6.28);ctx.fill();if(p.type==='lava'&&f.i%2===0){ctx.globalAlpha=.3;ctx.strokeStyle=c[0];ctx.stroke();}ctx.restore();}
    ctx.globalAlpha=1;const night=ctx.createLinearGradient(p.x-r,p.y-r,p.x+r,p.y+r);night.addColorStop(0,'rgba(2,4,15,0)');night.addColorStop(.55,'rgba(2,4,15,.03)');night.addColorStop(1,'rgba(2,4,15,.7)');ctx.fillStyle=night;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);const spec=ctx.createRadialGradient(p.x-r*.36,p.y-r*.42,0,p.x-r*.36,p.y-r*.42,r*.52);spec.addColorStop(0,'rgba(255,255,255,.44)');spec.addColorStop(.35,'rgba(255,255,255,.1)');spec.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=spec;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.restore();ctx.strokeStyle=`${c[4]}99`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,r+.5,0,6.28);ctx.stroke();ctx.restore();planetRing(p,true);
    if(pointer.planet===p){ctx.save();ctx.strokeStyle='rgba(255,255,255,.88)';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();ctx.arc(p.x,p.y,r+13,0,6.28);ctx.stroke();ctx.restore();}
  }

  function trails(){ctx.save();ctx.lineWidth=1.7;ctx.lineCap='round';for(const s of satellites){for(let i=1;i<s.trail.length;i++){const a=s.trail[i-1],b=s.trail[i],alpha=(i/s.trail.length)*.38*(.82+.18*Math.sin(i*.55+s.phase));ctx.strokeStyle=`rgba(151,178,255,${alpha})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}ctx.restore();}
  function previewDraw(){ctx.save();for(const path of previews)for(let i=0;i<path.length;i+=2){const p=path[i];ctx.globalAlpha=.14+.3*(1-i/Math.max(1,path.length));ctx.fillStyle='rgba(204,214,255,.8)';ctx.beginPath();ctx.arc(p.x,p.y,1.3,0,6.28);ctx.fill();}ctx.restore();}
  function satelliteDraw(s,t){if(s.status!=='flying')return;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.shadowColor=`rgba(148,174,255,${.72+Math.sin(t*.006+s.pulse)*.18})`;ctx.shadowBlur=12;ctx.fillStyle='#edf1ff';ctx.fillRect(-5.4,-3.6,10.8,7.2);ctx.shadowBlur=0;ctx.fillStyle='#91a8ff';ctx.fillRect(-13,-2.6,6.6,5.2);ctx.fillRect(6.4,-2.6,6.6,5.2);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(3.7,0,1.7,0,6.28);ctx.fill();ctx.restore();ctx.fillStyle='rgba(230,236,255,.8)';ctx.font='700 9px system-ui';ctx.textAlign='center';ctx.fillText(s.name,s.x,s.y-12);}
  function arrow(t){if(!started||resultLocked||pointer.planet||hintTimer<=0)return;const p=planets.find(x=>x.draggable);if(!p)return;ctx.save();ctx.globalAlpha=Math.min(1,hintTimer)*.65;ctx.strokeStyle='#fff';ctx.lineWidth=2;const y=p.y-p.radius-27+Math.sin(t*.006)*4;ctx.beginPath();ctx.moveTo(p.x,y-10);ctx.lineTo(p.x,y+8);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-5,y+3);ctx.lineTo(p.x,y+9);ctx.lineTo(p.x+5,y+3);ctx.stroke();ctx.restore();}

  function render(t){background(t);for(const d of docks)drawDock(d,t);previewDraw();trails();for(const p of planets)drawPlanet(p,t);for(const s of satellites)satelliteDraw(s,t);arrow(t);}
  function loop(t){const frame=Math.min(.035,(t-last)/1000);last=t;if(running&&!paused){acc+=frame;while(acc>=DT){step(DT);acc-=DT;}if(hintTimer>0){hintTimer-=frame;if(hintTimer<=0)ui.hint.classList.remove('visible');}}render(t);requestAnimationFrame(loop);}

  resize();spawn();requestAnimationFrame(loop);
})();
