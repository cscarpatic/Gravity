(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const TAU = Math.PI * 2;
  const rand = (a,b) => a + Math.random() * (b-a);
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  const PASS_RATIO = .5;

  C.PASS_RATIO = PASS_RATIO;
  C.levels = [
    { name:'Prima orbita', text:'Impara a curvare una rotta con un solo pianeta controllabile.', sats:1, docks:1, mass:1250, radius:31, speed:142, dockR:42, maxDock:205, type:'ocean', releaseInterval:0 },
    { name:'Traffico orbitale', text:'Tre razzi entrano in sequenza: devi iniziare a correggere più rotte.', sats:3, docks:1, mass:1600, radius:34, speed:151, dockR:40, maxDock:214, type:'rocky', releaseInterval:2.45 },
    { name:'Luna vincolata', text:'Compare un corpo celeste fisso: attrae i razzi, ma non puoi trascinarlo.', sats:4, docks:2, mass:2050, radius:40, speed:159, dockR:38, maxDock:220, type:'gas', ring:true, releaseInterval:2.15,
      anomalies:[{kind:'moon',x:.69,y:.29,mass:900,radius:23,label:'LUNA FISSA'}] },
    { name:'Orizzonte degli eventi', text:'Primo buco nero: piccolo, immobile e con una gravità molto intensa.', sats:5, docks:2, mass:2150, radius:38, speed:168, dockR:36, maxDock:226, type:'lava', releaseInterval:1.95,
      anomalies:[{kind:'blackhole',x:.64,y:.63,mass:4200,radius:21,gravityScale:1.18,label:'BUCO NERO'}] },
    { name:'Stella di antimateria', text:'La stella azzurra respinge invece di attrarre. Usala come fionda al contrario.', sats:6, docks:2, mass:2250, radius:39, speed:176, dockR:35, maxDock:232, type:'ice', releaseInterval:1.75,
      anomalies:[{kind:'antimatter',x:.67,y:.31,mass:3300,radius:28,gravitySign:-1,gravityScale:1.02,label:'ANTIMATERIA'}] },
    { name:'Morsa gravitazionale', text:'Buco nero e luna fissa deformano insieme il campo gravitazionale.', sats:7, docks:3, mass:2350, radius:39, speed:184, dockR:34, maxDock:238, type:'ocean', releaseInterval:1.55,
      anomalies:[{kind:'blackhole',x:.72,y:.67,mass:3900,radius:20,gravityScale:1.12,label:'BUCO NERO'},{kind:'moon',x:.61,y:.25,mass:1050,radius:22,label:'LUNA FISSA'}] },
    { name:'Stella di neutroni', text:'Una stella di neutroni concentra moltissima attrazione in uno spazio minuscolo.', sats:8, docks:3, mass:2450, radius:40, speed:191, dockR:33, maxDock:242, type:'gas', ring:true, releaseInterval:1.42,
      anomalies:[{kind:'neutron',x:.69,y:.34,mass:5100,radius:18,gravityScale:1.06,label:'STELLA DI NEUTRONI'},{kind:'antimatter',x:.61,y:.72,mass:2900,radius:25,gravitySign:-1,gravityScale:.9,label:'ANTIMATERIA'}] },
    { name:'Doppia anomalia', text:'Attrazione estrema e repulsione si sovrappongono: le finestre utili sono più strette.', sats:9, docks:3, mass:2580, radius:41, speed:198, dockR:32, maxDock:247, type:'violet', releaseInterval:1.28,
      anomalies:[{kind:'blackhole',x:.72,y:.28,mass:4500,radius:20,gravityScale:1.16,label:'BUCO NERO'},{kind:'antimatter',x:.65,y:.68,mass:3500,radius:27,gravitySign:-1,gravityScale:1.02,label:'ANTIMATERIA'}] },
    { name:'Corridoio impossibile', text:'Tre corpi fissi creano un corridoio instabile. I dock sono più piccoli e i razzi più veloci.', sats:10, docks:4, mass:2700, radius:42, speed:205, dockR:31, maxDock:252, type:'lava', releaseInterval:1.16,
      anomalies:[{kind:'moon',x:.59,y:.22,mass:1000,radius:21,label:'LUNA FISSA'},{kind:'neutron',x:.72,y:.49,mass:5000,radius:17,gravityScale:1.02,label:'STELLA DI NEUTRONI'},{kind:'antimatter',x:.59,y:.78,mass:3200,radius:25,gravitySign:-1,gravityScale:.94,label:'ANTIMATERIA'}] },
    { name:'Campo caotico', text:'Ogni zona dello schermo accelera i razzi in modo diverso. Serve correggere in anticipo.', sats:11, docks:4, mass:2820, radius:43, speed:212, dockR:30, maxDock:257, type:'ice', releaseInterval:1.05,
      anomalies:[{kind:'blackhole',x:.74,y:.68,mass:4700,radius:20,gravityScale:1.15,label:'BUCO NERO'},{kind:'neutron',x:.63,y:.27,mass:4300,radius:17,gravityScale:.96,label:'STELLA DI NEUTRONI'},{kind:'moon',x:.56,y:.54,mass:1050,radius:21,label:'LUNA FISSA'}] },
    { name:'Paradosso di antimateria', text:'Due sorgenti repulsive e un buco nero aprono rotte che cambiano drasticamente con piccoli spostamenti.', sats:12, docks:4, mass:2940, radius:44, speed:218, dockR:29, maxDock:262, type:'gas', ring:true, releaseInterval:.96,
      anomalies:[{kind:'antimatter',x:.61,y:.25,mass:3300,radius:24,gravitySign:-1,gravityScale:1,label:'ANTIMATERIA A'},{kind:'blackhole',x:.72,y:.5,mass:4900,radius:19,gravityScale:1.17,label:'BUCO NERO'},{kind:'antimatter',x:.61,y:.76,mass:3300,radius:24,gravitySign:-1,gravityScale:1,label:'ANTIMATERIA B'}] },
    { name:'Singolarità finale', text:'Tutte le anomalie convivono. Salva almeno metà della flotta per completare il viaggio.', sats:14, docks:5, mass:3150, radius:45, speed:225, dockR:28, maxDock:268, type:'violet', releaseInterval:.86,
      anomalies:[{kind:'blackhole',x:.73,y:.24,mass:5000,radius:19,gravityScale:1.18,label:'BUCO NERO'},{kind:'neutron',x:.68,y:.51,mass:4700,radius:17,gravityScale:1.02,label:'STELLA DI NEUTRONI'},{kind:'antimatter',x:.73,y:.78,mass:3600,radius:25,gravitySign:-1,gravityScale:1.04,label:'ANTIMATERIA'},{kind:'moon',x:.56,y:.67,mass:1150,radius:22,label:'LUNA FISSA'}] }
  ];

  const anomalyColors = {
    moon:{core:'#8e8ad6',light:'#d8d5ff',shadow:'#4c467e',orbit:'#a9a5ff',ink:'#241b52'},
    blackhole:{core:'#040009',light:'#cc55ff',shadow:'#150020',orbit:'#ff55dc',ink:'#000'},
    antimatter:{core:'#3ae8ff',light:'#d8ffff',shadow:'#744cff',orbit:'#5cfff0',ink:'#23135c'},
    neutron:{core:'#fff4b5',light:'#ffffff',shadow:'#45a5ff',orbit:'#82c9ff',ink:'#18355e'}
  };

  function anomalySpecToPlanet(game, spec, index) {
    const top = game.safeTop()+18;
    const bottom = game.H-game.safeBottom()-18;
    const radius = spec.radius || 22;
    const x = clamp(game.W*(spec.x ?? .68), radius+18, game.W-radius-18);
    const y = clamp(top + (bottom-top)*(spec.y ?? .5), top+radius, bottom-radius);
    const p = game.makePlanet(x,y,spec.mass||1800,radius,{type:spec.kind||'moon',ring:false,draggable:false,tilt:.15});
    p.type = spec.kind || 'moon';
    p.fixed = true;
    p.draggable = false;
    p.gravitySign = spec.gravitySign ?? 1;
    p.gravityScale = spec.gravityScale ?? 1;
    p.anomaly = true;
    p.anomalyIndex = index;
    p.label = spec.label || p.type.toUpperCase();
    p.visualSeed = rand(0,TAU);
    return p;
  }

  function gravityAt(game,x,y) {
    let ax=0,ay=0;
    for (const p of game.planets) {
      const dx=p.x-x,dy=p.y-y;
      const d2=dx*dx+dy*dy+C.SOFTEN*C.SOFTEN;
      const inv=1/Math.sqrt(d2);
      const sign=p.gravitySign ?? 1;
      const scale=p.gravityScale ?? 1;
      const a=C.G*p.mass*sign*scale/d2;
      ax+=a*dx*inv; ay+=a*dy*inv;
    }
    return {ax,ay};
  }

  P.gravity = function(x,y){ return gravityAt(this,x,y); };

  function routeScore(game,sat,angle,speed) {
    let x=sat.x,y=sat.y,vx=Math.cos(angle)*speed,vy=Math.sin(angle)*speed;
    const dt=1/60, steps=600;
    let minDock=Infinity, lived=0, collision=false, docked=false, finalSpeed=speed;
    for(let i=0;i<steps;i++){
      const g=gravityAt(game,x,y);vx+=g.ax*dt;vy+=g.ay*dt;x+=vx*dt;y+=vy*dt;lived+=dt;finalSpeed=Math.hypot(vx,vy);
      for(const p of game.planets){if(Math.hypot(x-p.x,y-p.y)<p.radius+(sat.r||8)+3){collision=true;break;}}
      if(collision) break;
      for(const d of game.docks){
        const dist=Math.hypot(x-d.x,y-d.y);
        minDock=Math.min(minDock,dist-d.r);
        if(dist<d.r-2 && finalSpeed<=game.L().maxDock){docked=true;break;}
      }
      if(docked) break;
      const m=110;if(x<-m||x>game.W+m||y<-m||y>game.H+m)break;
    }
    let score=minDock;
    if(docked) score-=180;
    if(collision) score+=900;
    if(lived<2.4) score+=300;
    score+=Math.max(0,finalSpeed-game.L().maxDock)*.35;
    return {score,docked,collision,angle,speed};
  }

  function retunePlan(game) {
    const offsets=[0,-.05,.05,-.1,.1,-.17,.17,-.25,.25,-.33,.33];
    const factors=[.94,1,1.06];
    const difficulty=game.levelIndex/Math.max(1,C.levels.length-1);
    game.satellitePlan=game.satellitePlan.map((sat,i)=>{
      const baseAngle=Math.atan2(sat.vy,sat.vx);
      const baseSpeed=Math.hypot(sat.vx,sat.vy)||game.L().speed;
      const choices=[];
      for(const f of factors)for(const off of offsets){
        const direction=i%2?-off:off;
        choices.push(routeScore(game,sat,baseAngle+direction,baseSpeed*f));
      }
      choices.sort((a,b)=>a.score-b.score);
      const best=choices[0];
      const selected=(difficulty>.55 && choices[1] && best.docked)?choices[Math.min(1+(i%2),choices.length-1)]:best;
      return {...sat,vx:Math.cos(selected.angle)*selected.speed,vy:Math.sin(selected.angle)*selected.speed,rot:selected.angle,lastSpeed:selected.speed,routeWithAnomalies:true};
    });
  }

  const previousSpawn=P.spawnLevel;
  P.spawnLevel=function(){
    previousSpawn.call(this);
    const l=this.L();
    this.planets.forEach(p=>{p.fixed=!!p.fixed;p.draggable=!p.fixed;});
    const anomalies=(l.anomalies||[]).map((spec,i)=>anomalySpecToPlanet(this,spec,i));
    this.planets.push(...anomalies);
    this.planets.forEach(p=>{if(p.anomaly||p.fixed)p.draggable=false;});
    retunePlan(this);
    const required=Math.ceil(l.sats*PASS_RATIO);
    this.passRequired=required;
    this.ui.missionText.textContent=`${l.text} Obiettivo: porta nei dock almeno ${required} razz${required===1?'o':'i'} su ${l.sats}.`;
    this.ui.resultOverlay.classList.remove('success','failure');
  };

  P.settle=function(s,status,target=null){
    if(s.status!=='flying')return;
    s.status=status;
    if(status==='docked'){this.docked++;if(target)target.uses++;}else this.lost++;
    this.telemetry();
    const l=this.L();
    if(this.released===l.sats&&this.docked+this.lost===l.sats){
      const required=this.passRequired||Math.ceil(l.sats*PASS_RATIO);
      const ok=this.docked>=required;
      if(ok){
        const ratio=this.docked/l.sats;
        const bonus=Math.round(420+this.levelIndex*150+l.sats*55+ratio*420);
        this.score+=bonus;
        const perfect=this.docked===l.sats;
        this.finish(true,perfect?'Flotta perfetta!':`${this.docked}/${l.sats} in salvo`,perfect?`Hai agganciato tutti i razzi. Bonus +${bonus}.`:`Missione superata: servivano ${required} razzi e ne hai salvati ${this.docked}. Bonus +${bonus}.`);
      }else{
        this.finish(false,`${this.docked}/${l.sats} in salvo`,`Per superare il livello devi agganciare almeno ${required} razzi (${Math.round(PASS_RATIO*100)}%). Ne mancano ${required-this.docked}.`);
      }
    }
  };

  const previousStart=P.startRun;
  P.startRun=function(){
    previousStart.call(this);
    const anomalies=this.planets.filter(p=>p.anomaly);
    if(anomalies.length){
      const repulsive=anomalies.some(p=>(p.gravitySign??1)<0);
      this.ui.hint.textContent=repulsive?'☝️ Muovi solo i pianeti liberi · azzurro = repulsione':'☝️ Muovi solo i pianeti liberi · le anomalie sono fisse';
      this.ui.hint.classList.add('visible');this.hintTimer=4.1;
    }
  };

  const baseDrawPlanet=P.drawPlanet;
  function label(ctx,p,text,color){
    ctx.save();ctx.font='900 9px "Arial Rounded MT Bold",system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#170722';ctx.fillStyle=color;ctx.strokeText(text,p.x,p.y-p.radius-15);ctx.fillText(text,p.x,p.y-p.radius-15);ctx.restore();
  }

  P.drawPlanet=function(p,t){
    if(!p.anomaly) return baseDrawPlanet.call(this,p,t);
    const ctx=this.ctx,c=anomalyColors[p.type]||anomalyColors.moon,r=p.radius;
    ctx.save();

    if(p.type==='blackhole'){
      for(let i=3;i>=0;i--){const rr=r*(1.45+i*.28)+Math.sin(t*.003+i+p.visualSeed)*2;ctx.globalAlpha=.14+i*.025;ctx.strokeStyle=i%2?c.orbit:'#ffbd38';ctx.lineWidth=4-i*.45;ctx.beginPath();ctx.ellipse(p.x,p.y,rr,rr*.45,-.35,0,TAU);ctx.stroke();}
      ctx.globalAlpha=1;const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,r*1.15);g.addColorStop(0,'#000');g.addColorStop(.56,'#020005');g.addColorStop(.75,'#4e0b67');g.addColorStop(.88,'#ff4fda');g.addColorStop(1,'rgba(255,77,222,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r*1.18,0,TAU);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(p.x,p.y,r*.72,0,TAU);ctx.fill();
      label(ctx,p,'BUCO NERO','#ff8ce9');
    }else if(p.type==='antimatter'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t*.00035);
      for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.fillStyle=i%2?'#49f4ff':'#9a66ff';ctx.strokeStyle=c.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r*.76,-r*.12);ctx.lineTo(r*1.28,0);ctx.lineTo(r*.76,r*.12);ctx.closePath();ctx.fill();ctx.stroke();}
      const g=ctx.createRadialGradient(-r*.3,-r*.35,1,0,0,r);g.addColorStop(0,c.light);g.addColorStop(.35,c.core);g.addColorStop(1,c.shadow);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.strokeStyle=c.ink;ctx.lineWidth=5;ctx.stroke();
      ctx.strokeStyle='#d8ffff';ctx.lineWidth=3;ctx.setLineDash([7,7]);ctx.beginPath();ctx.arc(0,0,r*1.5,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();label(ctx,p,'ANTIMATERIA','#80fff8');
    }else if(p.type==='neutron'){
      const pulse=.86+.14*Math.sin(t*.01+p.visualSeed);for(let i=0;i<3;i++){ctx.globalAlpha=.15+i*.08;ctx.strokeStyle=c.orbit;ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,r*(1.4+i*.4)*pulse,0,TAU);ctx.stroke();}ctx.globalAlpha=1;
      const g=ctx.createRadialGradient(p.x-r*.28,p.y-r*.3,1,p.x,p.y,r);g.addColorStop(0,'#fff');g.addColorStop(.25,c.light);g.addColorStop(.62,c.core);g.addColorStop(1,c.shadow);ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.strokeStyle=c.ink;ctx.lineWidth=4;ctx.stroke();
      ctx.strokeStyle='rgba(126,218,255,.85)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x-r*2.2,p.y);ctx.lineTo(p.x+r*2.2,p.y);ctx.stroke();label(ctx,p,'STELLA DI NEUTRONI','#d9f6ff');
    }else{
      const g=ctx.createRadialGradient(p.x-r*.3,p.y-r*.35,1,p.x,p.y,r);g.addColorStop(0,c.light);g.addColorStop(.46,c.core);g.addColorStop(1,c.shadow);ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.strokeStyle=c.ink;ctx.lineWidth=5;ctx.stroke();
      const holes=[[-.32,-.22,.2],[.3,-.1,.14],[-.05,.3,.17]];for(const [ox,oy,rr] of holes){ctx.fillStyle=c.shadow;ctx.beginPath();ctx.ellipse(p.x+r*ox,p.y+r*oy,r*rr,r*rr*.72,0,0,TAU);ctx.fill();}label(ctx,p,'LUNA FISSA','#dedaff');
    }

    if(p.fixed){ctx.fillStyle='rgba(255,255,255,.85)';ctx.strokeStyle='#1b0b2d';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(p.x+r*.58,p.y+r*.48,15,12,4);ctx.fill();ctx.stroke();ctx.strokeStyle='#1b0b2d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x+r*.655,p.y+r*.47,4,Math.PI,TAU);ctx.stroke();}
    ctx.restore();
  };
})();