(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  C.palettes.star = ['#fff9c7','#ffd65a','#f28d2f','#fff0a6','#ffbc45'];

  const originalMakePlanet = P.makePlanet;
  P.makePlanet = function(x, y, mass, radius, options = {}) {
    const p = originalMakePlanet.call(this, x, y, mass, radius, {...options, draggable:true});
    p.draggable = true;
    return p;
  };

  const originalSpawnLevel = P.spawnLevel;
  P.spawnLevel = function() {
    originalSpawnLevel.call(this);
    for (const p of this.planets) p.draggable = true;
    if (this.levelIndex === 4 && this.planets[1]) this.planets[1].type = 'star';
  };

  const roundedBox = (ctx,x,y,w,h,r) => {
    const rr = Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.lineTo(x+w-rr,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+rr);
    ctx.lineTo(x+w,y+h-rr);
    ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
    ctx.lineTo(x+rr,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-rr);
    ctx.lineTo(x,y+rr);
    ctx.quadraticCurveTo(x,y,x+rr,y);
    ctx.closePath();
  };

  P.background = function(t) {
    const ctx=this.ctx,W=this.W,H=this.H;
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#3158bc');
    sky.addColorStop(.52,'#243b8e');
    sky.addColorStop(1,'#142454');
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

    for(const n of this.nebulae){
      const x=n.x+Math.sin(t*.00008*n.drift+n.phase)*18;
      const y=n.y+Math.cos(t*.00006*n.drift+n.phase)*13;
      const rg=ctx.createRadialGradient(x,y,0,x,y,n.r);
      rg.addColorStop(0,`hsla(${n.hue},90%,78%,.28)`);
      rg.addColorStop(.55,`hsla(${n.hue},92%,64%,.11)`);
      rg.addColorStop(1,`hsla(${n.hue},92%,64%,0)`);
      ctx.fillStyle=rg;ctx.fillRect(x-n.r,y-n.r,n.r*2,n.r*2);
    }

    for(const s of this.stars){
      const pulse=.74+.26*Math.sin(t*.001*s.tw+s.p);
      ctx.globalAlpha=s.a*pulse;
      ctx.fillStyle='#fff8cf';
      ctx.beginPath();ctx.arc(s.x,s.y,s.r+.25,0,Math.PI*2);ctx.fill();
      if(s.r>.9){
        ctx.strokeStyle='rgba(255,248,207,.7)';ctx.lineWidth=.9;
        ctx.beginPath();ctx.moveTo(s.x-s.r-1.6,s.y);ctx.lineTo(s.x+s.r+1.6,s.y);ctx.moveTo(s.x,s.y-s.r-1.6);ctx.lineTo(s.x,s.y+s.r+1.6);ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
  };

  P.drawLaunchLane = function(t) {
    const ctx=this.ctx,x=Math.max(34,this.W*.048),top=this.safeTop()+18,h=this.H-this.safeTop()-this.safeBottom()-36;
    ctx.save();
    ctx.lineCap='round';
    ctx.strokeStyle='rgba(33,49,94,.5)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+h);ctx.stroke();
    ctx.strokeStyle='#7fd4ff';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+h);ctx.stroke();
    if(this.started&&this.released<this.L().sats&&!this.resultLocked){
      const pulse=.5+.5*Math.sin(t*.007);
      ctx.fillStyle=`rgba(127,212,255,${.28+pulse*.24})`;ctx.beginPath();ctx.arc(x,top+h*.5,14+pulse*5,0,Math.PI*2);ctx.fill();
      ctx.font='900 11px system-ui';ctx.textAlign='left';ctx.lineWidth=4;ctx.strokeStyle='#26345f';ctx.fillStyle='#fff';
      const label=`Nuovo satellite in ${Math.max(0,this.nextSpawnTimer).toFixed(1)}s`;
      ctx.strokeText(label,x+16,top+7);ctx.fillText(label,x+16,top+7);
    }
    ctx.restore();
  };

  P.drawDock = function(d,t) {
    const ctx=this.ctx;d.phase+=.014;const r=d.r*(1+Math.sin(t*.004+d.id)*.05);
    ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.phase);
    ctx.fillStyle='rgba(124,255,207,.22)';ctx.beginPath();ctx.arc(0,0,r*1.26,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#244b49';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#91ffd1';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<4;i++){
      ctx.save();ctx.rotate(i*Math.PI/2);
      roundedBox(ctx,r-8,-5,13,10,4);ctx.fillStyle='#e2fff3';ctx.fill();ctx.strokeStyle='#244b49';ctx.lineWidth=2.5;ctx.stroke();ctx.restore();
    }
    ctx.restore();
    ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#244b49';ctx.fillStyle='#fff';ctx.strokeText(`D${d.id}`,d.x,d.y+4);ctx.fillText(`D${d.id}`,d.x,d.y+4);
  };

  P.gravityWell = function(p,t) {
    const ctx=this.ctx;ctx.save();
    for(let i=1;i<=4;i++){
      const rr=p.radius+i*(18+p.mass/900);
      ctx.globalAlpha=.09+(4-i)*.03;ctx.strokeStyle='#fff';ctx.lineWidth=i===1?3:2;ctx.setLineDash([10,10]);
      ctx.beginPath();ctx.ellipse(p.x,p.y,rr+Math.sin(t*.0012+i+p.pulse)*2,rr*(.78+i*.02),p.tilt*.18,0,Math.PI*2);ctx.stroke();
    }
    ctx.setLineDash([]);ctx.restore();
  };

  P.planetRing = function(p,front) {
    if(!p.ring)return;
    const ctx=this.ctx,c=C.palettes[p.type]||C.palettes.ocean;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.tilt);ctx.scale(1,.33);ctx.lineCap='round';
    ctx.lineWidth=Math.max(8,p.radius*.23);ctx.strokeStyle=front?'#fff4d4':'#6f537d';ctx.beginPath();ctx.arc(0,0,p.radius*1.56,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke();
    ctx.lineWidth=Math.max(3,p.radius*.08);ctx.strokeStyle=front?c[3]:c[2];ctx.beginPath();ctx.arc(0,0,p.radius*1.56,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke();ctx.restore();
  };

  P.drawPlanet = function(p,t) {
    const ctx=this.ctx,c=C.palettes[p.type]||C.palettes.ocean,r=p.radius;
    this.gravityWell(p,t);

    if(p.type==='star'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t*.00016);
      for(let i=0;i<12;i++){
        ctx.rotate(Math.PI/6);ctx.fillStyle=i%2?'#ffd85c':'#ffb946';ctx.strokeStyle='#8f5b29';ctx.lineWidth=2.5;
        ctx.beginPath();ctx.moveTo(r*.78,-r*.13);ctx.lineTo(r*1.42,0);ctx.lineTo(r*.78,r*.13);ctx.closePath();ctx.fill();ctx.stroke();
      }
      ctx.restore();
    } else this.planetRing(p,false);

    ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fillStyle=c[2];ctx.fill();ctx.lineWidth=6;ctx.strokeStyle='#26345f';ctx.stroke();
    ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,r-2,0,Math.PI*2);ctx.clip();
    const sphere=ctx.createRadialGradient(p.x-r*.28,p.y-r*.34,r*.04,p.x+r*.12,p.y+r*.14,r*1.15);
    sphere.addColorStop(0,c[0]);sphere.addColorStop(.48,c[1]);sphere.addColorStop(1,c[2]);ctx.fillStyle=sphere;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);p.rot+=.0004;

    if(p.type==='gas'){
      for(let i=-4;i<=4;i++){
        const yy=p.y+i*r*.2+Math.sin(t*.0008+i)*r*.03;
        ctx.strokeStyle=i%2===0?c[3]:c[0];ctx.lineWidth=Math.max(6,r*.12);ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(p.x-r*.95,yy);ctx.bezierCurveTo(p.x-r*.24,yy-r*.08,p.x+r*.24,yy+r*.08,p.x+r*.95,yy);ctx.stroke();
      }
    } else if(p.type==='star'){
      for(let i=0;i<8;i++){
        const ang=(Math.PI*2/8)*i+t*.0004;ctx.fillStyle=i%2?c[0]:c[1];ctx.beginPath();ctx.ellipse(p.x+Math.cos(ang)*r*.32,p.y+Math.sin(ang)*r*.32,r*.16,r*.09,ang,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle='rgba(255,255,255,.24)';ctx.beginPath();ctx.arc(p.x-r*.15,p.y-r*.18,r*.28,0,Math.PI*2);ctx.fill();
    } else {
      for(const f of p.features){
        ctx.save();ctx.translate(p.x+f.x+Math.sin(p.rot+f.phase)*r*.02,p.y+f.y);ctx.rotate(f.rot);ctx.globalAlpha=.9;ctx.fillStyle=f.i%2===0?c[3]:c[0];ctx.beginPath();ctx.ellipse(0,0,Math.max(5,f.rx),Math.max(3,f.ry),0,0,Math.PI*2);ctx.fill();ctx.restore();
      }
    }
    ctx.globalAlpha=1;ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.arc(p.x-r*.2,p.y-r*.22,r*.3,0,Math.PI*2);ctx.fill();ctx.restore();ctx.restore();

    if(p.type!=='star')this.planetRing(p,true);

    if(this.pointer.planet===p){ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(p.x,p.y,r+13,0,Math.PI*2);ctx.stroke();ctx.restore();}

    ctx.save();ctx.font='900 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#26345f';ctx.fillStyle='#fff';ctx.strokeText('↔',p.x,p.y+4);ctx.fillText('↔',p.x,p.y+4);ctx.restore();
  };

  P.drawTrails = function() {
    const ctx=this.ctx;ctx.save();ctx.lineCap='round';
    for(const s of this.satellites){
      for(let i=1;i<s.trail.length;i++){
        const a=s.trail[i-1],b=s.trail[i],alpha=(i/s.trail.length)*.45*(.84+.16*Math.sin(i*.55+s.phase));
        ctx.lineWidth=4;ctx.strokeStyle=`rgba(255,255,255,${alpha*.5})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        ctx.lineWidth=2;ctx.strokeStyle=`rgba(127,212,255,${alpha})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
    ctx.restore();
  };

  P.drawPreviews = function() {
    const ctx=this.ctx;ctx.save();
    for(const path of this.previews)for(let i=0;i<path.length;i+=2){
      const p=path[i];ctx.globalAlpha=.16+.34*(1-i/Math.max(1,path.length));ctx.fillStyle='#dff5ff';ctx.beginPath();ctx.arc(p.x,p.y,1.8,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  };

  P.drawSatellite = function(s,t) {
    if(s.status!=='flying')return;
    const ctx=this.ctx,paint=s.paint,flare=.55+.45*Math.sin(t*.016+s.pulse);
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);
    ctx.fillStyle=`rgba(255,255,255,${.17+flare*.2+s.incomingGlow*.16})`;ctx.beginPath();ctx.ellipse(-11,0,15+s.incomingGlow*6,10+s.incomingGlow*4,0,0,Math.PI*2);ctx.fill();

    ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='#26345f';ctx.lineWidth=3.2;
    roundedBox(ctx,-19,-6,9,12,4);ctx.fillStyle=paint.panel;ctx.fill();ctx.stroke();
    roundedBox(ctx,10,-6,9,12,4);ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.34)';ctx.lineWidth=1;
    for(let x=-17;x<=-12;x+=1.8){ctx.beginPath();ctx.moveTo(x,-4);ctx.lineTo(x,4);ctx.stroke();}
    for(let x=12;x<=17;x+=1.8){ctx.beginPath();ctx.moveTo(x,-4);ctx.lineTo(x,4);ctx.stroke();}

    ctx.strokeStyle='#26345f';ctx.lineWidth=3.2;ctx.fillStyle=paint.body;
    ctx.beginPath();ctx.moveTo(-9,-6);ctx.lineTo(5,-6);ctx.quadraticCurveTo(11,-3,12,0);ctx.quadraticCurveTo(11,3,5,6);ctx.lineTo(-9,6);ctx.quadraticCurveTo(-12,0,-9,-6);ctx.closePath();ctx.fill();ctx.stroke();
    roundedBox(ctx,-11.5,-3.2,3.2,6.4,1.6);ctx.fillStyle=paint.trim;ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(1.8,0,3.2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#85d8ff';ctx.beginPath();ctx.arc(2.2,0,1.45,0,Math.PI*2);ctx.fill();

    ctx.strokeStyle='#26345f';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(4.8,-2.6);ctx.lineTo(10.8,-6.2);ctx.stroke();ctx.beginPath();ctx.moveTo(4.8,2.6);ctx.lineTo(10.8,6.2);ctx.stroke();ctx.beginPath();ctx.arc(10.8,0,6.2,-.68,.68);ctx.stroke();
    ctx.fillStyle=paint.engine;ctx.beginPath();ctx.moveTo(-8.8,-2.6);ctx.lineTo(-14.8,0);ctx.lineTo(-8.8,2.6);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff7c6';ctx.beginPath();ctx.arc(-15.2,0,1.3+flare*.45,0,Math.PI*2);ctx.fill();ctx.restore();

    ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#26345f';ctx.fillStyle='#fff';ctx.strokeText(s.name,s.x,s.y-16);ctx.fillText(s.name,s.x,s.y-16);
  };

  const originalStartRun=P.startRun;
  P.startRun=function(){
    originalStartRun.call(this);
    this.ui.hint.textContent=this.L().sats>1?'☝️ Sposta qualsiasi corpo celeste · nuovi satelliti entreranno in volo':'☝️ Trascina qualsiasi corpo celeste';
  };
})();
