(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const rand = (a,b) => a + Math.random() * (b-a);
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  const TAU = Math.PI * 2;

  const craftKinds = ['orbiter','shuttle','probe','glider','freighter','comet','capsule','scout','saucer','needle'];
  const craftPaint = [
    {body:'#fff5d8',trim:'#ff7bd5',panel:'#5bb7ff',glow:'#79e6ff',engine:'#ffd85d'},
    {body:'#f7f3ff',trim:'#8a7cff',panel:'#56d5c8',glow:'#9affea',engine:'#ffe28f'},
    {body:'#fff8ef',trim:'#ff9665',panel:'#6fa7ff',glow:'#9cc8ff',engine:'#fff1a6'},
    {body:'#efffff',trim:'#55d8c9',panel:'#8b69df',glow:'#bc9cff',engine:'#ffd36e'},
    {body:'#fff0f7',trim:'#ff72a8',panel:'#6ec56a',glow:'#a6ff9d',engine:'#ffe18c'},
    {body:'#f6fbff',trim:'#61a9ff',panel:'#ff9a4e',glow:'#ffc572',engine:'#fff1a4'}
  ];

  const planetStyles = ['glossy','crater','bubbly','earthy','lava','crystal','marble','bands'];
  const planetPalette = {
    ocean:{base:'#218bd8',light:'#6feaff',shadow:'#135495',accent:'#7affca',outline:'#17386d'},
    rocky:{base:'#d97b50',light:'#ffd2a1',shadow:'#7d3c35',accent:'#ffb472',outline:'#563044'},
    gas:{base:'#d89365',light:'#ffe4b4',shadow:'#68446f',accent:'#f4bdfd',outline:'#50315d'},
    lava:{base:'#e84c1c',light:'#ff9a39',shadow:'#7d1507',accent:'#ffca64',outline:'#57150d'},
    ice:{base:'#77d7e6',light:'#e8ffff',shadow:'#2f6c99',accent:'#b9fbff',outline:'#285170'},
    violet:{base:'#a523b7',light:'#ff70e8',shadow:'#56005f',accent:'#f6a4ff',outline:'#410247'},
    star:{base:'#ffb72e',light:'#fff286',shadow:'#e06100',accent:'#ffd34f',outline:'#75420b'}
  };

  function shuffledKinds(count) {
    const pool = craftKinds.slice();
    for (let i=pool.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [pool[i],pool[j]]=[pool[j],pool[i]];
    }
    const out=[];
    for(let i=0;i<count;i++) out.push(pool[i%pool.length]);
    return out;
  }

  const previousSpawn = P.spawnLevel;
  P.spawnLevel = function() {
    previousSpawn.call(this);
    const kinds = shuffledKinds(this.satellitePlan.length);
    this.satellitePlan = this.satellitePlan.map((s,i)=>({
      ...s,
      kind:kinds[i],
      paint:craftPaint[(i+this.levelIndex+Math.floor(Math.random()*craftPaint.length))%craftPaint.length]
    }));
    this.ui.resultOverlay.classList.remove('success','failure');
    this.planets.forEach((p,i)=>{
      if (p.type==='star') p.visualVariant='star';
      else p.visualVariant=planetStyles[(this.levelIndex*2+i+Math.floor(Math.random()*3))%planetStyles.length];
      p.draggable=true;
      p.visualSeed=rand(0,TAU);
    });
  };

  P.background = function(t) {
    const ctx=this.ctx,W=this.W,H=this.H;
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#120323');
    sky.addColorStop(.52,'#0d031c');
    sky.addColorStop(1,'#070111');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

    const haze=ctx.createRadialGradient(W*.48,H*.44,20,W*.48,H*.44,Math.max(W,H)*.78);
    haze.addColorStop(0,'rgba(119,44,188,.16)');
    haze.addColorStop(.45,'rgba(31,112,210,.07)');
    haze.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=haze;ctx.fillRect(0,0,W,H);

    for(const n of this.nebulae){
      const x=n.x+Math.sin(t*.00007*n.drift+n.phase)*12;
      const y=n.y+Math.cos(t*.00005*n.drift+n.phase)*9;
      const g=ctx.createRadialGradient(x,y,0,x,y,n.r);
      g.addColorStop(0,`hsla(${n.hue},90%,64%,.08)`);
      g.addColorStop(1,`hsla(${n.hue},90%,50%,0)`);
      ctx.fillStyle=g;ctx.fillRect(x-n.r,y-n.r,n.r*2,n.r*2);
    }

    for(const s of this.stars){
      const pulse=.72+.28*Math.sin(t*.001*s.tw+s.p);
      ctx.globalAlpha=s.a*pulse;
      ctx.fillStyle='#fff3c8';
      ctx.beginPath();ctx.arc(s.x,s.y,s.r+.12,0,TAU);ctx.fill();
      if(s.r>.95){
        ctx.strokeStyle='rgba(255,242,199,.48)';ctx.lineWidth=.8;
        ctx.beginPath();ctx.moveTo(s.x-s.r-1.3,s.y);ctx.lineTo(s.x+s.r+1.3,s.y);ctx.moveTo(s.x,s.y-s.r-1.3);ctx.lineTo(s.x,s.y+s.r+1.3);ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
  };

  P.gravityWell = function(p,t) {
    const ctx=this.ctx;ctx.save();
    for(let i=1;i<=4;i++){
      const rr=p.radius+i*(18+p.mass/950);
      ctx.globalAlpha=.09+(4-i)*.028;
      ctx.strokeStyle=i%2?'#ffe89a':'#71d7ff';
      ctx.lineWidth=i===1?2.8:1.8;
      ctx.setLineDash([8,10]);
      ctx.beginPath();ctx.ellipse(p.x,p.y,rr+Math.sin(t*.0012+i+p.pulse)*2,rr*(.83+i*.018),p.tilt*.15,0,TAU);ctx.stroke();
    }
    ctx.setLineDash([]);ctx.globalAlpha=1;ctx.restore();
  };

  function planetPath(ctx,p,r) {
    ctx.beginPath();
    const variant=p.visualVariant;
    if(variant==='crystal'){
      for(let i=0;i<10;i++){
        const a=TAU*i/10;
        const rr=r*(i%2?.92:1.08);
        const x=p.x+Math.cos(a)*rr,y=p.y+Math.sin(a)*rr;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();
    }else if(variant==='bubbly'){
      for(let i=0;i<=36;i++){
        const a=TAU*i/36,rr=r*(1+.055*Math.sin(a*6+p.visualSeed));
        const x=p.x+Math.cos(a)*rr,y=p.y+Math.sin(a)*rr;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.closePath();
    }else ctx.arc(p.x,p.y,r,0,TAU);
  }

  P.drawPlanet = function(p,t) {
    const ctx=this.ctx,r=p.radius,c=planetPalette[p.type]||planetPalette.violet,v=p.visualVariant||'glossy';
    this.gravityWell(p,t);
    ctx.save();

    if(p.type==='star'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t*.00014);
      for(let i=0;i<14;i++){
        ctx.rotate(TAU/14);ctx.fillStyle=i%2?'#ffd84f':'#ff9d1f';ctx.strokeStyle=c.outline;ctx.lineWidth=2.2;
        ctx.beginPath();ctx.moveTo(r*.78,-r*.11);ctx.lineTo(r*1.34,0);ctx.lineTo(r*.78,r*.11);ctx.closePath();ctx.fill();ctx.stroke();
      }
      ctx.restore();
    }

    ctx.fillStyle='rgba(255,255,255,.045)';ctx.beginPath();ctx.arc(p.x,p.y,r*1.42,0,TAU);ctx.fill();
    planetPath(ctx,p,r);ctx.fillStyle=c.base;ctx.fill();ctx.strokeStyle=c.outline;ctx.lineWidth=Math.max(4,r*.1);ctx.stroke();

    ctx.save();planetPath(ctx,p,r-2);ctx.clip();
    const g=ctx.createLinearGradient(p.x-r,p.y-r,p.x+r,p.y+r);
    g.addColorStop(0,c.light);g.addColorStop(.47,c.base);g.addColorStop(1,c.shadow);ctx.fillStyle=g;ctx.fillRect(p.x-r*1.2,p.y-r*1.2,r*2.4,r*2.4);

    if(v==='crater'){
      const holes=[[-.34,-.28,.22],[.27,-.17,.16],[-.04,.24,.18],[.37,.28,.1],[-.38,.18,.11]];
      for(const [ox,oy,rr] of holes){ctx.fillStyle=c.shadow;ctx.beginPath();ctx.ellipse(p.x+r*ox,p.y+r*oy,r*rr,r*rr*.75,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,235,171,.32)';ctx.beginPath();ctx.ellipse(p.x+r*(ox-.03),p.y+r*(oy-.03),r*rr*.58,r*rr*.42,0,0,TAU);ctx.fill();}
    }else if(v==='bubbly'){
      const holes=[[-.32,-.29,.24],[.24,-.25,.16],[.1,.2,.22],[-.38,.2,.12],[.38,.18,.11]];
      for(const [ox,oy,rr] of holes){ctx.fillStyle=c.accent;ctx.beginPath();ctx.ellipse(p.x+r*ox,p.y+r*oy,r*rr,r*rr*.83,0,0,TAU);ctx.fill();ctx.fillStyle=c.outline;ctx.beginPath();ctx.ellipse(p.x+r*(ox+.03),p.y+r*(oy+.02),r*rr*.54,r*rr*.46,0,0,TAU);ctx.fill();}
    }else if(v==='earthy'){
      ctx.fillStyle=c.shadow;
      const polys=[[[-.55,.02],[-.28,-.44],[.08,-.34],[.2,-.08],[-.1,.13],[-.42,.23]],[[-.14,.25],[.12,.08],[.48,.18],[.38,.49],[.1,.55],[-.08,.4]]];
      for(const poly of polys){ctx.beginPath();poly.forEach(([x,y],i)=>i?ctx.lineTo(p.x+r*x,p.y+r*y):ctx.moveTo(p.x+r*x,p.y+r*y));ctx.closePath();ctx.fill();}
      ctx.strokeStyle=c.accent;ctx.lineWidth=Math.max(3,r*.08);ctx.beginPath();ctx.moveTo(p.x-r*.75,p.y+r*.5);ctx.bezierCurveTo(p.x-r*.45,p.y+r*.05,p.x-r*.12,p.y+r*.28,p.x+r*.02,p.y-r*.04);ctx.bezierCurveTo(p.x+r*.2,p.y-r*.35,p.x+r*.4,p.y-r*.55,p.x+r*.58,p.y-r*.7);ctx.stroke();
    }else if(v==='lava'||v==='marble'||v==='bands'||v==='glossy'){
      ctx.strokeStyle=v==='lava'?c.shadow:c.accent;ctx.lineWidth=Math.max(4,r*.1);ctx.lineCap='round';
      for(let i=-2;i<=2;i++){
        const y=p.y+i*r*.24+Math.sin(t*.0006+i+p.visualSeed)*r*.04;
        ctx.beginPath();ctx.moveTo(p.x-r*.9,y);ctx.bezierCurveTo(p.x-r*.25,y-r*.12,p.x+r*.25,y+r*.12,p.x+r*.9,y);ctx.stroke();
      }
    }else if(v==='crystal'){
      const facets=[[[0,-.85],[.58,-.18],[.18,.74],[-.34,.56],[-.66,-.1]],[[-.12,-.5],[.46,-.08],[.04,.15],[-.42,-.1]],[[-.1,.22],[.18,.68],[-.2,.78],[-.43,.3]]];
      facets.forEach((poly,i)=>{ctx.fillStyle=i===0?c.light:i===1?c.accent:c.shadow;ctx.beginPath();poly.forEach(([x,y],j)=>j?ctx.lineTo(p.x+r*x,p.y+r*y):ctx.moveTo(p.x+r*x,p.y+r*y));ctx.closePath();ctx.fill();});
    }

    ctx.fillStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.ellipse(p.x-r*.34,p.y-r*.42,r*.27,r*.16,-.5,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.1)';ctx.beginPath();ctx.ellipse(p.x-r*.08,p.y-r*.14,r*.15,r*.09,-.45,0,TAU);ctx.fill();
    const sh=ctx.createRadialGradient(p.x+r*.28,p.y+r*.32,r*.08,p.x,p.y,r*1.12);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(17,0,28,.23)');ctx.fillStyle=sh;ctx.fillRect(p.x-r*1.2,p.y-r*1.2,r*2.4,r*2.4);
    ctx.restore();

    if(p.ring&&p.type!=='star'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.tilt);ctx.scale(1,.34);ctx.strokeStyle='#ffe6a1';ctx.lineWidth=Math.max(5,r*.12);ctx.beginPath();ctx.arc(0,0,r*1.5,0,TAU);ctx.stroke();ctx.strokeStyle=c.accent;ctx.lineWidth=Math.max(2,r*.04);ctx.stroke();ctx.restore();
    }

    if(this.pointer.planet===p){ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(p.x,p.y,r+13,0,TAU);ctx.stroke();ctx.setLineDash([]);}
    ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle=c.outline;ctx.fillStyle='#fff';ctx.strokeText('↔',p.x,p.y+4);ctx.fillText('↔',p.x,p.y+4);
    ctx.restore();
  };

  P.drawDock = function(d,t) {
    const ctx=this.ctx;d.phase=(d.phase||0)+.014;const ingest=d.ingest||0;const r=d.r*(1+Math.sin(t*.004+d.id)*.05)*(1-ingest*.12);
    ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.phase);
    ctx.fillStyle=`rgba(151,255,210,${.16+ingest*.28})`;ctx.beginPath();ctx.arc(0,0,r*1.3,0,TAU);ctx.fill();
    ctx.strokeStyle='#1d5b50';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
    ctx.strokeStyle='#98ffd4';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
    for(let i=0;i<4;i++){
      ctx.save();ctx.rotate(i*Math.PI/2);ctx.fillStyle='#eafff4';ctx.strokeStyle='#1d5b50';ctx.lineWidth=2.5;ctx.beginPath();ctx.roundRect(r-8,-5*(1-ingest*.45),13,10*(1-ingest*.45),4);ctx.fill();ctx.stroke();ctx.restore();
    }
    ctx.fillStyle=`rgba(255,236,130,${.18+ingest*.5})`;ctx.beginPath();ctx.arc(0,0,r*(.55+ingest*.18),0,TAU);ctx.fill();ctx.restore();
    ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#1d5b50';ctx.fillStyle='#fff';ctx.strokeText(`D${d.id}`,d.x,d.y+4);ctx.fillText(`D${d.id}`,d.x,d.y+4);
  };

  P.drawTrails = function() {
    const ctx=this.ctx;ctx.save();ctx.lineCap='round';
    for(const s of this.satellites){
      const glow=(s.paint&&s.paint.glow)||'#78e4ff';
      for(let i=1;i<s.trail.length;i++){
        const a=s.trail[i-1],b=s.trail[i],alpha=(i/s.trail.length)*.52;
        ctx.lineWidth=4.5;ctx.strokeStyle=`rgba(255,255,255,${alpha*.34})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.lineWidth=2.2;ctx.strokeStyle=glow+Math.round(alpha*255).toString(16).padStart(2,'0');ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
    ctx.restore();
  };

  function craftBody(ctx,kind) {
    ctx.beginPath();
    if(kind==='capsule'){ctx.roundRect(-9,-7,18,14,7);}
    else if(kind==='scout'){ctx.moveTo(-10,-5);ctx.lineTo(3,-7);ctx.lineTo(12,0);ctx.lineTo(3,7);ctx.lineTo(-10,5);ctx.closePath();}
    else if(kind==='saucer'){ctx.ellipse(0,0,12,6,0,0,TAU);}
    else if(kind==='needle'){ctx.moveTo(-12,-4);ctx.lineTo(7,-4);ctx.lineTo(13,0);ctx.lineTo(7,4);ctx.lineTo(-12,4);ctx.closePath();}
    else if(kind==='probe'){ctx.roundRect(-8,-6,18,12,5);}
    else if(kind==='glider'){ctx.moveTo(-11,-5);ctx.lineTo(4,-7);ctx.lineTo(11,0);ctx.lineTo(4,7);ctx.lineTo(-11,5);ctx.closePath();}
    else if(kind==='freighter'){ctx.roundRect(-11,-7,22,14,5);}
    else if(kind==='comet'){ctx.moveTo(-10,-5);ctx.lineTo(5,-6);ctx.quadraticCurveTo(14,0,5,6);ctx.lineTo(-10,5);ctx.quadraticCurveTo(-13,0,-10,-5);ctx.closePath();}
    else {ctx.moveTo(-9,-6);ctx.lineTo(5,-6);ctx.quadraticCurveTo(12,-3,12,0);ctx.quadraticCurveTo(12,3,5,6);ctx.lineTo(-9,6);ctx.quadraticCurveTo(-12,0,-9,-6);ctx.closePath();}
  }

  P.drawSatellite = function(s,t) {
    if(s.status!=='flying')return;
    const ctx=this.ctx,paint=s.paint||craftPaint[0],flare=.55+.45*Math.sin(t*.016+s.pulse),kind=s.kind||'orbiter';
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.lineJoin='round';ctx.lineCap='round';
    ctx.fillStyle=`rgba(255,255,255,${.14+flare*.14+(s.incomingGlow||0)*.14})`;ctx.beginPath();ctx.ellipse(-11,0,16+(s.incomingGlow||0)*5,10+(s.incomingGlow||0)*3,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#2c265f';ctx.lineWidth=3;

    if(kind!=='capsule'&&kind!=='saucer'&&kind!=='needle'){
      ctx.fillStyle=paint.panel;ctx.beginPath();ctx.roundRect(-19,-6,9,12,4);ctx.fill();ctx.stroke();ctx.beginPath();ctx.roundRect(10,-6,9,12,4);ctx.fill();ctx.stroke();
    }

    ctx.fillStyle=paint.body;craftBody(ctx,kind);ctx.fill();ctx.stroke();
    ctx.fillStyle=paint.trim;ctx.beginPath();ctx.roundRect(-10.8,-3.1,3,6.2,1.5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(2,0,3.1,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#80dfff';ctx.beginPath();ctx.arc(2.4,0,1.45,0,TAU);ctx.fill();

    ctx.strokeStyle='#2c265f';ctx.lineWidth=2.2;
    ctx.beginPath();ctx.moveTo(-1.5,-6.5);ctx.lineTo(-1.5,-11.5);ctx.stroke();ctx.fillStyle='#fff2a6';ctx.beginPath();ctx.arc(-1.5,-13,1.7,0,TAU);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(4.8,-2.6);ctx.lineTo(10.6,-6);ctx.stroke();ctx.beginPath();ctx.moveTo(4.8,2.6);ctx.lineTo(10.6,6);ctx.stroke();ctx.beginPath();ctx.arc(10.5,0,6,-.7,.7);ctx.stroke();
    ctx.fillStyle=paint.engine;ctx.beginPath();ctx.moveTo(-9,-2.5);ctx.lineTo(-15,0);ctx.lineTo(-9,2.5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff2a9';ctx.beginPath();ctx.arc(-15.2,0,1.35+flare*.45,0,TAU);ctx.fill();
    ctx.restore();

    ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#2c265f';ctx.fillStyle='#fff';ctx.strokeText(s.name,s.x,s.y-17);ctx.fillText(s.name,s.x,s.y-17);
  };

  let audioCtx=null;
  function getAudio(){
    if(!audioCtx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(AC) audioCtx=new AC();
    }
    if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
    return audioCtx;
  }
  function tone(freq,dur=.08,type='sine',gain=.025,delay=0){
    const ac=getAudio();if(!ac)return;
    const o=ac.createOscillator(),g=ac.createGain(),now=ac.currentTime+delay;
    o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    o.connect(g).connect(ac.destination);o.start(now);o.stop(now+dur+.02);
  }
  function launchSound(){tone(420,.07,'triangle',.018);tone(620,.06,'sine',.014,.04);}
  function dockSound(){tone(520,.08,'triangle',.02);tone(760,.1,'sine',.022,.06);tone(1040,.12,'sine',.016,.13);}
  function crashSound(){tone(150,.16,'sawtooth',.018);tone(92,.22,'square',.012,.03);}
  function successSound(){tone(523,.09,'triangle',.018);tone(659,.1,'triangle',.018,.08);tone(784,.14,'triangle',.02,.17);}
  function failSound(){tone(250,.1,'triangle',.014);tone(190,.13,'triangle',.014,.08);}

  const oldStart=P.startRun;
  P.startRun=function(){getAudio();oldStart.call(this);};
  const oldLaunch=P.launchNextSatellite;
  P.launchNextSatellite=function(){const ok=oldLaunch.call(this);if(ok)launchSound();return ok;};
  const oldExplosion=P.createExplosion;
  if(oldExplosion) P.createExplosion=function(...args){crashSound();return oldExplosion.apply(this,args);};
  const oldSettle=P.settle;
  P.settle=function(s,status,target){if(status==='docked')dockSound();return oldSettle.call(this,s,status,target);};
  const oldFinish=P.finish;
  P.finish=function(ok,title,text){
    this.ui.resultOverlay.classList.toggle('success',!!ok);
    this.ui.resultOverlay.classList.toggle('failure',!ok);
    ok?successSound():failSound();
    return oldFinish.call(this,ok,title,text);
  };
})();
