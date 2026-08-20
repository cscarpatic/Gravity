(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const TAU = Math.PI * 2;
  const rand = (a,b) => a + Math.random() * (b-a);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const trailColors = ['#24bfff','#75f33d','#ff50d5','#ffd22f','#ff703b','#7ee9ff'];

  const planetPalette = {
    ocean:{base:'#17a7e6',light:'#63efff',shadow:'#0872a6',accent:'#7ddf31',accent2:'#b8ff54',ink:'#073c67',orbit:'#21d9ff'},
    rocky:{base:'#ff9f24',light:'#ffd95e',shadow:'#e2600f',accent:'#ff7c13',accent2:'#ffe075',ink:'#8f3707',orbit:'#ff9e21'},
    gas:{base:'#64d92d',light:'#9dff42',shadow:'#198d68',accent:'#2ac9ef',accent2:'#89efff',ink:'#07506e',orbit:'#82f542'},
    lava:{base:'#e83e12',light:'#ff8030',shadow:'#8f1409',accent:'#ff9d19',accent2:'#ffc94b',ink:'#681006',orbit:'#ff5c28'},
    ice:{base:'#7b78cf',light:'#c4c5ff',shadow:'#4a4c94',accent:'#9fa5e8',accent2:'#e2e6ff',ink:'#34336b',orbit:'#9f95ff'},
    violet:{base:'#d827dd',light:'#ff6ff3',shadow:'#78158e',accent:'#9b27db',accent2:'#ff9cf5',ink:'#531062',orbit:'#d83cff'},
    star:{base:'#ffaf1b',light:'#fff16a',shadow:'#ee5d0b',accent:'#ffd62f',accent2:'#fff4a1',ink:'#8d3c06',orbit:'#ffd82e'}
  };

  P.safeTop = function(){ return this.W < 620 ? 92 : 116; };
  P.safeBottom = function(){ return this.W < 620 ? 86 : 112; };

  const previousSpawn = P.spawnLevel;
  P.spawnLevel = function(){
    previousSpawn.call(this);
    this.planets.forEach((p,i)=>{
      p.draggable = true;
      p.visualSeed = rand(0,TAU);
      p.visualIndex = i;
    });
    this.satellitePlan = this.satellitePlan.map((s,i)=>({
      ...s,
      rocketColor:trailColors[(i+this.levelIndex)%trailColors.length],
      visualSeed:rand(0,TAU)
    }));
    this.ui.resultOverlay.classList.remove('success','failure');
  };

  function roundedRect(ctx,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+rr,y);ctx.lineTo(x+w-rr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+rr);
    ctx.lineTo(x+w,y+h-rr);ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);ctx.lineTo(x+rr,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-rr);ctx.lineTo(x,y+rr);ctx.quadraticCurveTo(x,y,x+rr,y);ctx.closePath();
  }

  function blob(ctx,cx,cy,rx,ry,phase=0){
    ctx.beginPath();
    for(let i=0;i<=24;i++){
      const a=TAU*i/24;
      const wob=1+.12*Math.sin(a*3+phase)+.06*Math.cos(a*5-phase*.7);
      const x=cx+Math.cos(a)*rx*wob,y=cy+Math.sin(a)*ry*wob;
      if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y);
    }
    ctx.closePath();
  }

  function planetRing(ctx,p,c,front){
    if(!p.ring || p.type==='star') return;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.tilt);ctx.scale(1,.33);ctx.lineCap='round';
    ctx.strokeStyle='#2d123a';ctx.lineWidth=Math.max(12,p.radius*.26);ctx.beginPath();ctx.arc(0,0,p.radius*1.55,front?0:Math.PI,front?Math.PI:TAU);ctx.stroke();
    ctx.strokeStyle='#ffc945';ctx.lineWidth=Math.max(8,p.radius*.18);ctx.beginPath();ctx.arc(0,0,p.radius*1.55,front?0:Math.PI,front?Math.PI:TAU);ctx.stroke();
    ctx.strokeStyle=c.accent2;ctx.lineWidth=Math.max(3,p.radius*.065);ctx.beginPath();ctx.arc(0,0,p.radius*1.55,front?0:Math.PI,front?Math.PI:TAU);ctx.stroke();ctx.restore();
  }

  P.background = function(t){
    const ctx=this.ctx,W=this.W,H=this.H;
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#080016');sky.addColorStop(.48,'#11001e');sky.addColorStop(1,'#05000d');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

    const clouds=[
      {x:.18,y:.68,r:.42,h:282},{x:.48,y:.28,r:.35,h:272},{x:.76,y:.63,r:.38,h:288},{x:.91,y:.2,r:.24,h:220}
    ];
    for(let i=0;i<clouds.length;i++){
      const n=clouds[i],x=W*n.x+Math.sin(t*.00005+i)*18,y=H*n.y+Math.cos(t*.00004+i)*12,r=Math.max(W,H)*n.r;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`hsla(${n.h},96%,55%,.16)`);g.addColorStop(.35,`hsla(${n.h+14},92%,44%,.08)`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }

    for(const s of this.stars){
      const pulse=.7+.3*Math.sin(t*.0013*s.tw+s.p);ctx.globalAlpha=s.a*pulse;ctx.fillStyle=s.r>1?'#fff7cf':'#eaf2ff';
      ctx.beginPath();ctx.arc(s.x,s.y,s.r+.12,0,TAU);ctx.fill();
      if(s.r>1.05){ctx.strokeStyle='rgba(255,245,220,.65)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(s.x-3-s.r,s.y);ctx.lineTo(s.x+3+s.r,s.y);ctx.moveTo(s.x,s.y-3-s.r);ctx.lineTo(s.x,s.y+3+s.r);ctx.stroke();}
    }
    ctx.globalAlpha=1;

    const rocks=[[.06,.62,13],[.86,.31,10],[.93,.74,8]];
    for(let i=0;i<rocks.length;i++){
      const [rx,ry,rr]=rocks[i],x=W*rx,y=H*ry;
      ctx.save();ctx.translate(x,y);ctx.rotate(i*.9+t*.00008);ctx.fillStyle='#4f2b72';ctx.strokeStyle='#241036';ctx.lineWidth=3;ctx.beginPath();
      for(let k=0;k<8;k++){const a=TAU*k/8,r=rr*(.78+.28*Math.sin(k*2.1+i));const px=Math.cos(a)*r,py=Math.sin(a)*r;k?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
  };

  P.drawLaunchLane = function(t){
    if(!this.started || this.resultLocked) return;
    const ctx=this.ctx,x=Math.max(24,this.W*.038),y=(this.safeTop()+this.H-this.safeBottom())*.5;
    ctx.save();
    const pulse=.5+.5*Math.sin(t*.006);
    for(let i=0;i<3;i++){
      ctx.globalAlpha=.28+.16*i+.18*pulse;ctx.fillStyle=i===2?'#28d8ff':'#1768c9';ctx.beginPath();
      ctx.moveTo(x+i*10,y-14);ctx.lineTo(x+i*10+13,y);ctx.lineTo(x+i*10,y+14);ctx.lineTo(x+i*10+5,y);ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=1;ctx.restore();
  };

  P.gravityWell = function(p,t){
    const ctx=this.ctx,c=planetPalette[p.type]||planetPalette.violet;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.tilt*.13);
    for(let i=0;i<3;i++){
      const rr=p.radius+24+i*18+p.mass/1700;ctx.strokeStyle=i===0?c.orbit:'rgba(174,67,222,.55)';ctx.globalAlpha=.45-i*.09;ctx.lineWidth=i===0?2.5:1.6;
      ctx.beginPath();ctx.ellipse(0,0,rr,rr*(.77+i*.025),0,0,TAU);ctx.stroke();
      const a=t*.0008*(i+1)+p.visualSeed+i*2.1;const bx=Math.cos(a)*rr,by=Math.sin(a)*rr*(.77+i*.025);ctx.globalAlpha=.9;ctx.fillStyle=i===0?c.accent2:'#bd3ce7';ctx.strokeStyle='#2c1237';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(bx,by,5-i*.6,0,TAU);ctx.fill();ctx.stroke();
    }
    ctx.restore();ctx.globalAlpha=1;
  };

  function drawCrater(ctx,p,c,ox,oy,rr,skew=1){
    const r=p.radius,x=p.x+r*ox,y=p.y+r*oy;ctx.fillStyle=c.ink;ctx.beginPath();ctx.ellipse(x,y,r*rr,r*rr*.75*skew,-.2,0,TAU);ctx.fill();
    ctx.fillStyle=c.accent;ctx.beginPath();ctx.ellipse(x-r*rr*.12,y-r*rr*.12,r*rr*.7,r*rr*.48*skew,-.2,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.ellipse(x-r*rr*.28,y-r*rr*.25,r*rr*.2,r*rr*.12,0,0,TAU);ctx.fill();
  }

  P.drawPlanet = function(p,t){
    const ctx=this.ctx,c=planetPalette[p.type]||planetPalette.violet,r=p.radius;
    this.gravityWell(p,t);planetRing(ctx,p,c,false);

    if(p.type==='star'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t*.00012);for(let i=0;i<14;i++){ctx.rotate(TAU/14);ctx.fillStyle=i%2?'#ffd631':'#ff9d19';ctx.strokeStyle=c.ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(r*.72,-r*.12);ctx.lineTo(r*1.28,0);ctx.lineTo(r*.72,r*.12);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();
    }

    ctx.save();ctx.shadowColor=c.orbit;ctx.shadowBlur=Math.max(10,r*.32);ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fillStyle=c.base;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=c.ink;ctx.lineWidth=Math.max(5,r*.11);ctx.stroke();
    ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,r-2.3,0,TAU);ctx.clip();
    const g=ctx.createRadialGradient(p.x-r*.35,p.y-r*.42,r*.04,p.x+r*.18,p.y+r*.2,r*1.25);g.addColorStop(0,c.light);g.addColorStop(.38,c.base);g.addColorStop(1,c.shadow);ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);

    if(p.type==='ocean'){
      ctx.fillStyle=c.accent;blob(ctx,p.x-r*.25,p.y-r*.16,r*.34,r*.22,p.visualSeed);ctx.fill();ctx.fillStyle=c.accent2;blob(ctx,p.x+r*.22,p.y+r*.18,r*.27,r*.2,p.visualSeed+1.8);ctx.fill();
      drawCrater(ctx,p,{...c,accent:'#53d6f5'},.35,-.32,.16);drawCrater(ctx,p,{...c,accent:'#4bd1ef'},-.46,.31,.11);
    } else if(p.type==='gas'){
      for(let i=-3;i<=3;i++){
        const yy=p.y+i*r*.22+Math.sin(t*.00065+i+p.visualSeed)*r*.03;ctx.strokeStyle=i%2?c.accent:c.accent2;ctx.lineWidth=Math.max(7,r*.13);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x-r*.92,yy);ctx.bezierCurveTo(p.x-r*.35,yy-r*.08,p.x+r*.28,yy+r*.08,p.x+r*.92,yy);ctx.stroke();
      }
      drawCrater(ctx,p,{...c,accent:'#2ab4d7'},.31,-.28,.18);drawCrater(ctx,p,{...c,accent:'#5ee72d'},-.33,.23,.14);
    } else if(p.type==='ice'){
      const facets=[[[0,-.86],[.58,-.2],[.22,.72],[-.26,.78],[-.72,-.1]],[[-.18,-.46],[.48,-.08],[.08,.18],[-.43,-.06]],[[-.08,.2],[.16,.66],[-.22,.76],[-.43,.28]]];
      facets.forEach((poly,i)=>{ctx.fillStyle=i===0?c.light:i===1?c.accent:c.shadow;ctx.beginPath();poly.forEach(([x,y],j)=>j?ctx.lineTo(p.x+r*x,p.y+r*y):ctx.moveTo(p.x+r*x,p.y+r*y));ctx.closePath();ctx.fill();});
    } else {
      drawCrater(ctx,p,c,-.38,-.25,.18);drawCrater(ctx,p,c,.28,-.18,.14,.9);drawCrater(ctx,p,c,-.05,.26,.2);drawCrater(ctx,p,c,.38,.28,.09);drawCrater(ctx,p,c,-.42,.18,.09);
      if(p.type==='lava'){ctx.strokeStyle=c.accent2;ctx.lineWidth=Math.max(4,r*.08);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x-r*.65,p.y+r*.5);ctx.bezierCurveTo(p.x-r*.32,p.y+r*.1,p.x-r*.05,p.y+r*.24,p.x+r*.12,p.y-r*.08);ctx.bezierCurveTo(p.x+r*.27,p.y-r*.34,p.x+r*.5,p.y-r*.3,p.x+r*.58,p.y-r*.62);ctx.stroke();}
    }

    ctx.fillStyle='rgba(255,255,255,.38)';ctx.beginPath();ctx.ellipse(p.x-r*.33,p.y-r*.43,r*.3,r*.16,-.5,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.ellipse(p.x-r*.08,p.y-r*.17,r*.12,r*.07,-.5,0,TAU);ctx.fill();
    const sh=ctx.createRadialGradient(p.x+r*.35,p.y+r*.34,r*.12,p.x,p.y,r*1.1);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(40,0,45,.24)');ctx.fillStyle=sh;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.restore();
    ctx.strokeStyle=c.ink;ctx.lineWidth=Math.max(5,r*.11);ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.stroke();ctx.restore();

    planetRing(ctx,p,c,true);

    if(this.pointer.planet===p){
      const pulse=2+2*Math.sin(t*.008);ctx.save();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.setLineDash([10,7]);ctx.beginPath();ctx.arc(p.x,p.y,r+13+pulse,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    }
  };

  P.drawDock = function(d,t){
    const ctx=this.ctx,ingest=clamp(d.ingest||0,0,1);d.phase=(d.phase||0)+.012;const r=d.r*(1-ingest*.1);
    ctx.save();ctx.translate(d.x,d.y);
    for(let i=0;i<3;i++){ctx.strokeStyle=i===0?'rgba(96,238,73,.65)':'rgba(43,164,64,.35)';ctx.lineWidth=i===0?2.2:1.5;ctx.beginPath();ctx.arc(0,0,r+16+i*13+Math.sin(t*.003+i)*2,0,TAU);ctx.stroke();}
    ctx.rotate(d.phase);
    ctx.fillStyle='#17243c';ctx.strokeStyle='#0b1427';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.stroke();
    ctx.fillStyle='#8aa0bb';ctx.beginPath();ctx.arc(0,0,r*.78,0,TAU);ctx.fill();ctx.strokeStyle='#31445c';ctx.lineWidth=4;ctx.stroke();
    for(let i=0;i<4;i++){
      ctx.save();ctx.rotate(i*Math.PI/2);roundedRect(ctx,r*.42,-r*.18,r*.45,r*.36,r*.12);ctx.fillStyle='#ffb229';ctx.strokeStyle='#7b4b06';ctx.lineWidth=3;ctx.fill();ctx.stroke();ctx.fillStyle='#ffd25a';ctx.fillRect(r*.49,-r*.09,r*.25,r*.07);ctx.restore();
    }
    const core=ctx.createRadialGradient(-r*.12,-r*.16,2,0,0,r*.48);core.addColorStop(0,'#8dffff');core.addColorStop(.35,'#20c9ff');core.addColorStop(1,'#064985');ctx.fillStyle=core;ctx.strokeStyle='#08294a';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,r*.42,0,TAU);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.42)';ctx.beginPath();ctx.arc(-r*.13,-r*.15,r*.1,0,TAU);ctx.fill();ctx.restore();

    ctx.save();const label=`DOCK ${d.id}`;ctx.font='900 12px "Arial Rounded MT Bold",system-ui';const w=ctx.measureText(label).width+22;roundedRect(ctx,d.x-w/2,d.y-r-34,w,25,8);ctx.fillStyle='#2b8f43';ctx.strokeStyle='#123c1f';ctx.lineWidth=3;ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,d.x,d.y-r-21.5);ctx.restore();
  };

  function strokeTrail(ctx,pts,color,width,alpha,dash){
    if(pts.length<2)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';if(dash)ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();ctx.restore();
  }

  function arrowHead(ctx,a,b,color){
    const ang=Math.atan2(b.y-a.y,b.x-a.x),len=13;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(ang);ctx.fillStyle=color;ctx.strokeStyle='#102644';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(2,0);ctx.lineTo(-len,-7);ctx.lineTo(-len,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }

  P.drawTrails = function(){
    const ctx=this.ctx;
    for(const s of this.satellites){
      if(!s.trail || s.trail.length<2) continue;const color=s.rocketColor||trailColors[(s.id-1)%trailColors.length];
      strokeTrail(ctx,s.trail,'#102644',7,.55,[12,10]);strokeTrail(ctx,s.trail,color,4,.9,[12,10]);
      const n=s.trail.length;if(n>3)arrowHead(ctx,s.trail[n-3],s.trail[n-1],color);
    }
  };

  P.drawPreviews = function(){
    const ctx=this.ctx;
    this.previews.forEach((path,idx)=>{if(!path || path.length<2)return;const color=trailColors[idx%trailColors.length];ctx.save();ctx.globalAlpha=.32;ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.setLineDash([7,8]);ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);for(let i=1;i<path.length;i++)ctx.lineTo(path[i].x,path[i].y);ctx.stroke();ctx.restore();});
  };

  P.drawSatellite = function(s,t){
    if(s.status!=='flying')return;
    const ctx=this.ctx,color=s.rocketColor||trailColors[(s.id-1)%trailColors.length],flare=.55+.45*Math.sin(t*.02+s.pulse);
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);

    ctx.save();ctx.globalAlpha=.24+.15*flare;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(-22,0,26,10,0,0,TAU);ctx.fill();ctx.restore();
    ctx.fillStyle='#5ff33b';ctx.beginPath();ctx.moveTo(-15,-4);ctx.lineTo(-34,0);ctx.lineTo(-15,4);ctx.closePath();ctx.fill();ctx.fillStyle='#ffe334';ctx.beginPath();ctx.moveTo(-15,-3);ctx.lineTo(-27,0);ctx.lineTo(-15,3);ctx.closePath();ctx.fill();

    ctx.lineJoin='round';ctx.strokeStyle='#421728';ctx.lineWidth=3.2;
    ctx.fillStyle='#f4f2ea';ctx.beginPath();ctx.moveTo(-11,-8);ctx.lineTo(7,-8);ctx.quadraticCurveTo(14,-5,18,0);ctx.quadraticCurveTo(14,5,7,8);ctx.lineTo(-11,8);ctx.quadraticCurveTo(-15,0,-11,-8);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f04438';ctx.beginPath();ctx.moveTo(7,-8);ctx.quadraticCurveTo(18,-7,23,0);ctx.quadraticCurveTo(18,7,7,8);ctx.lineTo(12,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#f04438';ctx.beginPath();ctx.moveTo(-6,-7);ctx.lineTo(-13,-15);ctx.lineTo(1,-9);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-6,7);ctx.lineTo(-13,15);ctx.lineTo(1,9);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#22c9ff';ctx.strokeStyle='#0d577b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(2,0,5.2,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(.5,-1.8,1.6,0,TAU);ctx.fill();
    ctx.fillStyle='#d6dae0';ctx.strokeStyle='#421728';ctx.lineWidth=3;roundedRect(ctx,-16,-5,5,10,2);ctx.fill();ctx.stroke();ctx.restore();

    ctx.save();ctx.font='900 10px "Arial Rounded MT Bold",system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#321243';ctx.fillStyle='#fff';ctx.strokeText(s.name,s.x,s.y-19);ctx.fillText(s.name,s.x,s.y-19);ctx.restore();
  };

  P.drawArrow = function(t){
    if(!this.started || this.resultLocked || this.pointer.planet || this.hintTimer<=0)return;
    const p=this.planets.find(x=>x.draggable);if(!p)return;const ctx=this.ctx,y=p.y-p.radius-28+Math.sin(t*.007)*4;
    ctx.save();ctx.strokeStyle='#fff';ctx.fillStyle='#fff';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(p.x,y,10,.2*Math.PI,1.55*Math.PI);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x+7,y+8);ctx.lineTo(p.x+15,y+10);ctx.lineTo(p.x+12,y+2);ctx.closePath();ctx.fill();ctx.restore();
  };

  P.render = function(t){
    this.background(t);this.drawLaunchLane(t);this.drawPreviews();this.drawTrails();for(const p of this.planets)this.drawPlanet(p,t);for(const d of this.docks)this.drawDock(d,t);for(const s of this.satellites)this.drawSatellite(s,t);this.drawArrow(t);
  };

  const previousFinish = P.finish;
  P.finish = function(ok,title,text){
    previousFinish.call(this,ok,title,text);this.ui.resultOverlay.classList.toggle('success',!!ok);this.ui.resultOverlay.classList.toggle('failure',!ok);
  };

  const previousStartRun = P.startRun;
  P.startRun = function(){
    previousStartRun.call(this);this.ui.hint.textContent=this.L().sats>1?'☝️ Sposta i pianeti e correggi le rotte':'☝️ Trascina il pianeta e curva la rotta';
  };
})();
