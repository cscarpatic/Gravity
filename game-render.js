(() => {
  'use strict';

  const C=window.GD;
  const P=window.GravityGame.prototype;

  P.background=function(t){
    const ctx=this.ctx,W=this.W,H=this.H;
    ctx.fillStyle='#050816';ctx.fillRect(0,0,W,H);
    const g=ctx.createRadialGradient(W*.5,H*.48,20,W*.5,H*.48,Math.max(W,H)*.8);
    g.addColorStop(0,'rgba(61,82,165,.18)');g.addColorStop(.55,'rgba(29,40,91,.07)');g.addColorStop(1,'rgba(5,8,22,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    for(const n of this.nebulae){
      const x=n.x+Math.sin(t*.00008*n.drift+n.phase)*16,y=n.y+Math.cos(t*.00006*n.drift+n.phase)*12;
      const rg=ctx.createRadialGradient(x,y,0,x,y,n.r);rg.addColorStop(0,`hsla(${n.hue},85%,68%,.14)`);rg.addColorStop(.45,`hsla(${n.hue},88%,55%,.06)`);rg.addColorStop(1,`hsla(${n.hue},88%,55%,0)`);ctx.fillStyle=rg;ctx.fillRect(x-n.r,y-n.r,n.r*2,n.r*2);
    }
    for(const s of this.stars){ctx.globalAlpha=s.a*(.68+.32*Math.sin(t*.001*s.tw+s.p));ctx.fillStyle='#edf1ff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fill();}
    ctx.globalAlpha=1;
  };

  P.drawLaunchLane=function(t){
    const ctx=this.ctx,x=Math.max(34,this.W*.048),top=this.safeTop()+18,h=this.H-this.safeTop()-this.safeBottom()-36;
    ctx.save();ctx.strokeStyle='rgba(142,163,255,.18)';ctx.lineWidth=1;ctx.setLineDash([7,8]);ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+h);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(169,191,255,.25)';ctx.fillRect(x-2,top,4,h);
    if(this.started&&this.released<this.L().sats&&!this.resultLocked){const pulse=.5+.5*Math.sin(t*.007);ctx.fillStyle=`rgba(160,195,255,${.16+pulse*.18})`;ctx.beginPath();ctx.arc(x,top+h*.5,13+pulse*6,0,6.28);ctx.fill();ctx.fillStyle='rgba(230,239,255,.88)';ctx.font='700 10px system-ui';ctx.textAlign='left';ctx.fillText(`Nuovo satellite in ${Math.max(0,this.nextSpawnTimer).toFixed(1)}s`,x+16,top+4);}
    ctx.restore();
  };

  P.drawDock=function(d,t){
    const ctx=this.ctx;d.phase+=.014;const r=d.r*(1+Math.sin(t*.004+d.id)*.045);
    ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.phase);ctx.strokeStyle='rgba(128,241,192,.9)';ctx.lineWidth=2.2;ctx.setLineDash([10,8]);ctx.beginPath();ctx.arc(0,0,r,0,6.28);ctx.stroke();ctx.setLineDash([]);
    const rg=ctx.createRadialGradient(0,0,2,0,0,r*1.18);rg.addColorStop(0,'rgba(128,241,192,.18)');rg.addColorStop(1,'rgba(128,241,192,0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(0,0,r*1.18,0,6.28);ctx.fill();
    for(let i=0;i<4;i++){ctx.rotate(Math.PI*.5);ctx.fillStyle='rgba(208,255,238,.82)';ctx.fillRect(r-6,-2.2,8,4.4);}ctx.restore();
    ctx.fillStyle='rgba(220,255,244,.95)';ctx.font='700 9px system-ui';ctx.textAlign='center';ctx.fillText(`D${d.id}`,d.x,d.y+3);
  };

  P.gravityWell=function(p,t){
    const ctx=this.ctx;ctx.save();for(let i=1;i<=5;i++){const rr=p.radius+i*(17+p.mass/760);ctx.globalAlpha=.04+(5-i)*.017;ctx.strokeStyle=p.draggable?'#9db2ff':'#dba6ff';ctx.lineWidth=i===1?1.4:1;ctx.beginPath();ctx.ellipse(p.x,p.y,rr+Math.sin(t*.0014+i+p.pulse)*2,rr*(.72+i*.025),p.tilt*.22,0,6.28);ctx.stroke();}ctx.restore();
  };

  P.planetRing=function(p,front){
    if(!p.ring)return;const ctx=this.ctx,c=C.palettes[p.type];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.tilt);ctx.scale(1,.31);ctx.lineCap='round';ctx.lineWidth=Math.max(5,p.radius*.16);ctx.strokeStyle=front?`${c[0]}bb`:`${c[3]}66`;ctx.beginPath();ctx.arc(0,0,p.radius*1.58,front?0:Math.PI,front?Math.PI:6.28);ctx.stroke();ctx.lineWidth=1.5;ctx.strokeStyle=front?'rgba(255,255,255,.54)':'rgba(255,255,255,.16)';ctx.beginPath();ctx.arc(0,0,p.radius*1.76,front?.08:Math.PI+.08,front?Math.PI-.08:6.28-.08);ctx.stroke();ctx.restore();
  };

  P.drawPlanet=function(p,t){
    const ctx=this.ctx,c=C.palettes[p.type],r=p.radius;this.gravityWell(p,t);this.planetRing(p,false);
    ctx.save();ctx.shadowColor=`${c[4]}88`;ctx.shadowBlur=Math.max(18,r*.75);ctx.fillStyle=c[2];ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.28);ctx.fill();ctx.shadowBlur=0;
    ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.28);ctx.clip();
    const sphere=ctx.createRadialGradient(p.x-r*.35,p.y-r*.4,r*.05,p.x+r*.2,p.y+r*.2,r*1.2);sphere.addColorStop(0,c[0]);sphere.addColorStop(.27,c[1]);sphere.addColorStop(.72,c[2]);sphere.addColorStop(1,'#080d22');ctx.fillStyle=sphere;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);p.rot+=.0002;
    if(p.type==='gas')for(let i=-5;i<=5;i++){const yy=p.y+i*r*.18+Math.sin(t*.0007+i)*r*.025;ctx.globalAlpha=.12+(i%2===0?.06:0);ctx.strokeStyle=i%2===0?c[0]:c[3];ctx.lineWidth=Math.max(2,r*.075);ctx.beginPath();ctx.moveTo(p.x-r*1.1,yy);ctx.bezierCurveTo(p.x-r*.35,yy-r*.08,p.x+r*.35,yy+r*.08,p.x+r*1.1,yy);ctx.stroke();}
    else for(const f of p.features){ctx.save();ctx.translate(p.x+f.x+Math.sin(p.rot+f.phase)*r*.025,p.y+f.y);ctx.rotate(f.rot);ctx.globalAlpha=f.a;ctx.fillStyle=c[3];ctx.beginPath();ctx.ellipse(0,0,f.rx,f.ry,0,0,6.28);ctx.fill();if(p.type==='lava'&&f.i%2===0){ctx.globalAlpha=.3;ctx.strokeStyle=c[0];ctx.stroke();}ctx.restore();}
    ctx.globalAlpha=1;const night=ctx.createLinearGradient(p.x-r,p.y-r,p.x+r,p.y+r);night.addColorStop(0,'rgba(2,4,15,0)');night.addColorStop(.55,'rgba(2,4,15,.03)');night.addColorStop(1,'rgba(2,4,15,.72)');ctx.fillStyle=night;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);
    const spec=ctx.createRadialGradient(p.x-r*.36,p.y-r*.42,0,p.x-r*.36,p.y-r*.42,r*.52);spec.addColorStop(0,'rgba(255,255,255,.48)');spec.addColorStop(.35,'rgba(255,255,255,.12)');spec.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=spec;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.restore();
    ctx.strokeStyle=`${c[4]}aa`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(p.x,p.y,r+.5,0,6.28);ctx.stroke();ctx.restore();this.planetRing(p,true);
    const aura=ctx.createRadialGradient(p.x,p.y,r*.84,p.x,p.y,r*1.28);aura.addColorStop(0,'rgba(255,255,255,0)');aura.addColorStop(.62,`${c[4]}24`);aura.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=aura;ctx.fillRect(p.x-r*1.3,p.y-r*1.3,r*2.6,r*2.6);
    if(this.pointer.planet===p){ctx.save();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();ctx.arc(p.x,p.y,r+13,0,6.28);ctx.stroke();ctx.restore();}
  };

  P.drawTrails=function(){
    const ctx=this.ctx;ctx.save();ctx.lineWidth=1.7;ctx.lineCap='round';for(const s of this.satellites)for(let i=1;i<s.trail.length;i++){const a=s.trail[i-1],b=s.trail[i],alpha=(i/s.trail.length)*.4*(.82+.18*Math.sin(i*.55+s.phase));ctx.strokeStyle=`rgba(151,178,255,${alpha})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();
  };

  P.drawPreviews=function(){
    const ctx=this.ctx;ctx.save();for(const path of this.previews)for(let i=0;i<path.length;i+=2){const p=path[i];ctx.globalAlpha=.14+.3*(1-i/Math.max(1,path.length));ctx.fillStyle='rgba(204,214,255,.8)';ctx.beginPath();ctx.arc(p.x,p.y,1.3,0,6.28);ctx.fill();}ctx.restore();
  };

  P.drawSatellite=function(s,t){
    if(s.status!=='flying')return;const ctx=this.ctx,paint=s.paint,flare=.55+.45*Math.sin(t*.016+s.pulse);
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.shadowColor=`${paint.glow}cc`;ctx.shadowBlur=14+flare*6;ctx.fillStyle=`rgba(255,255,255,${.16+flare*.18+s.incomingGlow*.14})`;ctx.beginPath();ctx.ellipse(-10,0,14+s.incomingGlow*6,9+s.incomingGlow*4,0,0,6.28);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle=paint.panel;ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=.8;ctx.fillRect(-18.5,-4.2,8.8,8.4);ctx.strokeRect(-18.5,-4.2,8.8,8.4);ctx.fillRect(9.7,-4.2,8.8,8.4);ctx.strokeRect(9.7,-4.2,8.8,8.4);
    ctx.strokeStyle='rgba(255,255,255,.18)';for(let x=-17.2;x<=-11.5;x+=1.7){ctx.beginPath();ctx.moveTo(x,-3.4);ctx.lineTo(x,3.4);ctx.stroke();}for(let x=11;x<=16.8;x+=1.7){ctx.beginPath();ctx.moveTo(x,-3.4);ctx.lineTo(x,3.4);ctx.stroke();}
    ctx.fillStyle=paint.body;ctx.beginPath();ctx.moveTo(-8,-4.6);ctx.lineTo(4.8,-4.6);ctx.lineTo(8.2,0);ctx.lineTo(4.8,4.6);ctx.lineTo(-8,4.6);ctx.closePath();ctx.fill();
    ctx.fillStyle=paint.trim;ctx.fillRect(-11.1,-2.2,3,4.4);ctx.beginPath();ctx.arc(1.5,0,2.4,0,6.28);ctx.fill();ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.arc(2.1,0,1.2,0,6.28);ctx.fill();
    ctx.strokeStyle=paint.trim;ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(4.5,-2.1);ctx.lineTo(10.4,-5.5);ctx.stroke();ctx.beginPath();ctx.moveTo(4.5,2.1);ctx.lineTo(10.4,5.5);ctx.stroke();ctx.beginPath();ctx.arc(10.4,0,5.5,-.55,.55);ctx.stroke();
    ctx.fillStyle=paint.engine;ctx.beginPath();ctx.moveTo(-8,-2.3);ctx.lineTo(-12.5,0);ctx.lineTo(-8,2.3);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(-13.7,0,.95+flare*.4,0,6.28);ctx.fill();ctx.restore();
    ctx.fillStyle='rgba(232,239,255,.92)';ctx.font='700 10px system-ui';ctx.textAlign='center';ctx.fillText(s.name,s.x,s.y-15);
  };

  P.drawArrow=function(t){
    if(!this.started||this.resultLocked||this.pointer.planet||this.hintTimer<=0)return;const p=this.planets.find(x=>x.draggable);if(!p)return;const ctx=this.ctx;ctx.save();ctx.globalAlpha=Math.min(1,this.hintTimer)*.65;ctx.strokeStyle='#fff';ctx.lineWidth=2;const y=p.y-p.radius-27+Math.sin(t*.006)*4;ctx.beginPath();ctx.moveTo(p.x,y-10);ctx.lineTo(p.x,y+8);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-5,y+3);ctx.lineTo(p.x,y+9);ctx.lineTo(p.x+5,y+3);ctx.stroke();ctx.restore();
  };

  P.render=function(t){this.background(t);this.drawLaunchLane(t);for(const d of this.docks)this.drawDock(d,t);this.drawPreviews();this.drawTrails();for(const p of this.planets)this.drawPlanet(p,t);for(const s of this.satellites)this.drawSatellite(s,t);this.drawArrow(t);};
})();