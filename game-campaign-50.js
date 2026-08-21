(() => {
  'use strict';

  const C=window.GD;
  const P=window.GravityGame&&window.GravityGame.prototype;
  if(!C||!P)return;

  const TAU=Math.PI*2;
  const rand=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const plan=[
    ['Stella errante',['movingstar']],['Pianeta vagabondo',['rogue']],['Pulsar ritmico',['pulsar']],['Campo magnetar',['magnetar']],
    ['Fontana bianca',['whitehole']],['Pioggia di meteoriti',['meteor']],['Stella sotto tiro',['movingstar','meteor']],['Sistema danzante',['binary']],
    ['Battito e detriti',['pulsar','meteor']],['Antimateria errante',['movinganti']],['Magnetar bombardata',['magnetar','meteor']],['Tridente orbitale',['movingstar','rogue','pulsar']],
    ['Fuoco incrociato',['meteor2']],['Singolarità mobile',['movingblack']],['Nucleo cometario',['cometcore','meteor']],['Pozzo e fontana',['blackhole','whitehole']],
    ['Tempesta pulsar',['pulsar','meteor2']],['Coppia repulsiva',['movinganti','whitehole']],['Vortice magnetico',['magnetar','movingstar']],['Grandine cosmica',['meteor3']],
    ['Balletto gravitazionale',['binary','rogue']],['Buco nero oscillante',['movingblack','pulsar']],['Doppio sciame',['meteor3','movingstar']],['Pianeti ribelli',['rogue','rogue2','meteor']],
    ['Stelle a otto',['movingstar','movingstar2','pulsar']],['Marea inversa',['whitehole','movinganti','meteor']],['Fornace magnetica',['magnetar','movingblack','meteor2']],['Quadriglia cosmica',['binary','rogue','pulsar','meteor']],
    ['Zona proibita',['movingblack','whitehole','meteor2']],['Corsa tra i pulsar',['pulsar','pulsar2','movingstar']],['Sciame iperveloce',['meteor4','movinganti']],['Campo di singolarità',['blackhole','movingblack','neutron','meteor']],
    ['Antimateria in fuga',['movinganti','movinganti2','magnetar']],['Tempesta terminale',['meteor4','pulsar','movingblack']],['Corona mobile',['movingstar','movingstar2','magnetar','meteor2']],['Caos totale',['binary','movinganti','whitehole','meteor3']],
    ['Ultima finestra',['movingblack','pulsar','magnetar','meteor4']],['Orizzonte finale',['movingblack','movingstar','movinganti','pulsar','magnetar','meteor5']]
  ];
  const types=['ocean','rocky','gas','lava','ice','violet'];
  const slots=[[.66,.24],[.68,.73],[.57,.48],[.77,.46],[.58,.78],[.76,.18],[.61,.34],[.72,.62]];

  const featureText=tags=>{
    const w=[];
    if(tags.some(t=>t.startsWith('movingstar')))w.push('stelle erranti');
    if(tags.some(t=>t.startsWith('movinganti')))w.push('antimateria mobile');
    if(tags.includes('movingblack'))w.push('un buco nero in movimento');
    if(tags.some(t=>t.startsWith('pulsar')))w.push('gravità pulsante');
    if(tags.includes('magnetar'))w.push('un campo magnetico rotante');
    if(tags.includes('whitehole'))w.push('un buco bianco repulsivo');
    if(tags.includes('rogue')||tags.includes('rogue2'))w.push('pianeti vagabondi');
    if(tags.includes('binary'))w.push('stelle binarie orbitanti');
    if(tags.some(t=>t.startsWith('meteor')))w.push('sciami di meteoriti distruttivi');
    return `Affronta ${w.join(', ')}. I corpi con lucchetto non si possono spostare.`;
  };
  const meteorPreset=(tag,n)=>{
    const severity=tag==='meteor5'?5:tag==='meteor4'?4:tag==='meteor3'?3:tag==='meteor2'?2:1;
    return{severity,rate:Math.max(.42,1.7-severity*.23-(n-18)*.012),speed:165+severity*27+n*1.45,burst:severity>=4?2:1,max:7+severity*3,mode:severity===1?'rain':severity===2?'cross':'chaos'};
  };
  const buildLevel=([name,tags],i)=>{
    const n=i+13,meteorTag=tags.find(t=>t.startsWith('meteor')),type=types[(n-1)%types.length];
    return{name,text:featureText(tags),sats:Math.min(24,14+Math.floor((n-13)/4)),docks:Math.min(8,4+Math.floor((n-13)/9)),mass:2740+(n-13)*34,radius:42+Math.floor((n-13)/8),speed:204+(n-13)*1.45,dockR:Math.max(24,31-Math.floor((n-13)/6)),maxDock:258+(n-13)*1.75,type,ring:n%5===0||type==='gas',releaseInterval:Math.max(.58,1.18-(n-13)*.016),advancedTags:tags,meteor:meteorTag?meteorPreset(meteorTag,n):null};
  };
  C.levels=C.levels.slice(0,12).concat(plan.map(buildLevel));

  function advancedSpecs(level){
    const out=[];let si=0;
    const add=(kind,o={})=>{const s=slots[si++%slots.length];out.push({kind,x:o.x??s[0],y:o.y??s[1],...o});};
    for(const tag of level.advancedTags||[]){
      if(tag==='movingstar')add('movingstar',{mass:3300,radius:24,motion:'horizontal',ampX:.13,ampY:.03,motionSpeed:.62,label:'STELLA ERRANTE'});
      else if(tag==='movingstar2')add('movingstar',{mass:3500,radius:23,motion:'lissajous',ampX:.11,ampY:.18,motionSpeed:.72,motionPhase:1.7,label:'STELLA ERRANTE'});
      else if(tag==='rogue')add('rogue',{mass:1800,radius:25,motion:'vertical',ampY:.18,motionSpeed:.52,label:'PIANETA VAGABONDO'});
      else if(tag==='rogue2')add('rogue',{mass:2050,radius:22,motion:'orbit',ampX:.10,ampY:.16,motionSpeed:.67,motionPhase:2.2,label:'PIANETA VAGABONDO'});
      else if(tag==='pulsar')add('pulsar',{mass:4300,radius:18,pulseGravity:.58,pulseFreq:2.5,gravityScale:1.03,label:'PULSAR'});
      else if(tag==='pulsar2')add('pulsar',{mass:3900,radius:17,pulseGravity:.74,pulseFreq:3.3,gravityScale:.96,motion:'vertical',ampY:.10,motionSpeed:.45,label:'PULSAR'});
      else if(tag==='magnetar')add('magnetar',{mass:3900,radius:20,gravityScale:.94,spinForce:.42,spinDir:si%2?1:-1,label:'MAGNETAR'});
      else if(tag==='whitehole')add('whitehole',{mass:4200,radius:20,gravitySign:-1,gravityScale:1.12,spinForce:.12,label:'BUCO BIANCO'});
      else if(tag==='movinganti')add('antimatter',{mass:3350,radius:24,gravitySign:-1,gravityScale:1.02,motion:'horizontal',ampX:.12,motionSpeed:.64,label:'ANTIMATERIA MOBILE'});
      else if(tag==='movinganti2')add('antimatter',{mass:3200,radius:23,gravitySign:-1,gravityScale:.96,motion:'orbit',ampX:.11,ampY:.17,motionSpeed:.78,motionPhase:2.6,label:'ANTIMATERIA MOBILE'});
      else if(tag==='movingblack')add('blackhole',{mass:4550,radius:19,gravityScale:1.1,motion:'lissajous',ampX:.08,ampY:.17,motionSpeed:.46,label:'BUCO NERO MOBILE'});
      else if(tag==='blackhole')add('blackhole',{mass:4700,radius:20,gravityScale:1.13,label:'BUCO NERO'});
      else if(tag==='neutron')add('neutron',{mass:4700,radius:17,gravityScale:1.02,pulseGravity:.18,pulseFreq:4,label:'STELLA DI NEUTRONI'});
      else if(tag==='cometcore')add('rogue',{mass:2450,radius:18,motion:'horizontal',ampX:.18,ampY:.06,motionSpeed:1.05,spinForce:.16,label:'NUCLEO COMETARIO'});
      else if(tag==='binary'){
        add('movingstar',{x:.65,y:.42,mass:3000,radius:21,motion:'orbit',ampX:.075,ampY:.13,motionSpeed:.72,motionPhase:0,label:'STELLA BINARIA A'});
        add('movingstar',{x:.65,y:.58,mass:3000,radius:21,motion:'orbit',ampX:.075,ampY:.13,motionSpeed:.72,motionPhase:Math.PI,label:'STELLA BINARIA B'});
      }
    }
    return out;
  }

  function makeAnomaly(game,s,index){
    const top=game.safeTop()+18,bottom=game.H-game.safeBottom()-18,r=s.radius||22;
    const p=game.makePlanet(clamp(game.W*(s.x??.68),r+18,game.W-r-18),clamp(top+(bottom-top)*(s.y??.5),top+r,bottom-r),s.mass||1800,r,{type:s.kind||'moon',ring:false,draggable:false,tilt:.15});
    Object.assign(p,{type:s.kind||'moon',fixed:true,draggable:false,anomaly:true,anomalyIndex:index,gravitySign:s.gravitySign??1,gravityScale:s.gravityScale??1,pulseGravity:s.pulseGravity||0,pulseFreq:s.pulseFreq||2,spinForce:s.spinForce||0,spinDir:s.spinDir??1,label:s.label||(s.kind||'ANOMALIA').toUpperCase(),originNX:s.x??.68,originNY:s.y??.5,motion:s.motion||null,motionSpeed:s.motionSpeed||.5,motionPhase:s.motionPhase??rand(0,TAU),ampX:s.ampX||0,ampY:s.ampY||0,collision:true,visualSeed:rand(0,TAU)});
    return p;
  }
  function moveBodies(game){
    const top=game.safeTop()+18,bottom=game.H-game.safeBottom()-18,h=Math.max(120,bottom-top),t=game.worldTime||0;
    for(const p of game.planets){if(!p.anomaly||!p.motion)continue;const bx=game.W*p.originNX,by=top+h*p.originNY,a=t*p.motionSpeed+p.motionPhase;let x=bx,y=by;
      if(p.motion==='horizontal'){x+=Math.sin(a)*game.W*p.ampX;y+=Math.cos(a*.7)*h*p.ampY;}else if(p.motion==='vertical'){x+=Math.cos(a*.65)*game.W*p.ampX;y+=Math.sin(a)*h*p.ampY;}else if(p.motion==='orbit'){x+=Math.cos(a)*game.W*p.ampX;y+=Math.sin(a)*h*p.ampY;}else{x+=Math.sin(a)*game.W*p.ampX;y+=Math.sin(a*1.7+1.2)*h*p.ampY;}
      p.x=clamp(x,p.radius+16,game.W-p.radius-16);p.y=clamp(y,top+p.radius,bottom-p.radius);
    }
  }

  function gravityAt(game,x,y,t=game.worldTime||0){
    let ax=0,ay=0;
    for(const p of game.planets){const dx=p.x-x,dy=p.y-y,d2=dx*dx+dy*dy+C.SOFTEN*C.SOFTEN,inv=1/Math.sqrt(d2),sign=p.gravitySign??1;let scale=p.gravityScale??1;if(p.pulseGravity)scale*=Math.max(.18,1+p.pulseGravity*Math.sin(t*p.pulseFreq+p.visualSeed));const a=C.G*p.mass*sign*scale/d2;ax+=a*dx*inv;ay+=a*dy*inv;if(p.spinForce){const q=Math.abs(a)*p.spinForce*(p.spinDir||1);ax+=-dy*inv*q;ay+=dx*inv*q;}}
    return{ax,ay};
  }
  P.gravity=function(x,y){return gravityAt(this,x,y);};

  function retune(game){
    const offsets=[0,-.05,.05,-.1,.1,-.17,.17,-.25,.25],factors=[.92,.98,1,1.05];
    game.satellitePlan=game.satellitePlan.map((sat,i)=>{const ba=Math.atan2(sat.vy,sat.vx),bs=Math.hypot(sat.vx,sat.vy)||game.L().speed;let best=null;
      for(const f of factors)for(const off of offsets){let x=sat.x,y=sat.y,vx=Math.cos(ba+(i%2?-off:off))*bs*f,vy=Math.sin(ba+(i%2?-off:off))*bs*f,min=1e9,hit=false;for(let k=0;k<420;k++){const g=gravityAt(game,x,y,k/60);vx+=g.ax/60;vy+=g.ay/60;x+=vx/60;y+=vy/60;for(const p of game.planets)if(Math.hypot(x-p.x,y-p.y)<p.radius+(sat.r||8)+3){hit=true;break;}for(const d of game.docks)min=Math.min(min,Math.hypot(x-d.x,y-d.y)-d.r);if(hit)break;}const score=min+(hit?800:0);if(!best||score<best.score)best={score,vx:Math.cos(ba+(i%2?-off:off))*bs*f,vy:Math.sin(ba+(i%2?-off:off))*bs*f};}
      const rot=Math.atan2(best.vy,best.vx);return{...sat,vx:best.vx,vy:best.vy,rot,lastSpeed:Math.hypot(best.vx,best.vy)};});
  }

  const oldSpawn=P.spawnLevel;
  P.spawnLevel=function(){oldSpawn.call(this);const l=this.L();this.worldTime=0;this.meteors=[];this.meteorConfig=l.meteor||null;this.meteorTimer=this.meteorConfig?Math.max(.65,this.meteorConfig.rate):999;if(l.advancedTags){this.planets.push(...advancedSpecs(l).map((s,i)=>makeAnomaly(this,s,i)));moveBodies(this);retune(this);const required=Math.ceil(l.sats*(C.PASS_RATIO||.5));this.passRequired=required;this.ui.missionText.textContent=`${l.text}${l.meteor?' Attenzione: i meteoriti distruggono i razzi al contatto.':''} Obiettivo: porta nei dock almeno ${required} razzi su ${l.sats}.`;}}

  function spawnMeteor(game){
    const c=game.meteorConfig,top=game.safeTop()+18,bottom=game.H-game.safeBottom()-18,side=c.mode==='rain'?'top':['left','right','top','bottom'][Math.floor(Math.random()*4)],v=c.speed*rand(.82,1.18),m={r:rand(5,10+c.severity),rot:rand(0,TAU),spin:rand(-3,3),life:0};
    if(side==='top'){m.x=rand(20,game.W-20);m.y=top-25;m.vx=rand(-.2,.2)*v;m.vy=v;}else if(side==='bottom'){m.x=rand(20,game.W-20);m.y=bottom+25;m.vx=rand(-.2,.2)*v;m.vy=-v;}else if(side==='left'){m.x=-25;m.y=rand(top,bottom);m.vx=v;m.vy=rand(-.22,.22)*v;}else{m.x=game.W+25;m.y=rand(top,bottom);m.vx=-v;m.vy=rand(-.22,.22)*v;}game.meteors.push(m);
  }
  function updateMeteors(game,dt){const c=game.meteorConfig;if(!c)return;game.meteorTimer-=dt;if(game.meteorTimer<=0){for(let i=0;i<c.burst;i++)if(game.meteors.length<c.max)spawnMeteor(game);game.meteorTimer=c.rate*rand(.72,1.2);}for(const m of game.meteors){m.x+=m.vx*dt;m.y+=m.vy*dt;m.rot+=m.spin*dt;m.life+=dt;}game.meteors=game.meteors.filter(m=>m.life<12&&m.x>-90&&m.x<game.W+90&&m.y>-90&&m.y<game.H+90&&!m.dead);}

  P.stepSatellite=function(s,dt){if(s.status!=='flying')return;const g=this.gravity(s.x,s.y);s.vx+=g.ax*dt;s.vy+=g.ay*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.rot=Math.atan2(s.vy,s.vx);s.lastSpeed=Math.hypot(s.vx,s.vy);s.incomingGlow=Math.max(0,s.incomingGlow-dt*.9);if(!s.trail.length||Math.hypot(s.x-s.trail.at(-1).x,s.y-s.trail.at(-1).y)>4.8){s.trail.push({x:s.x,y:s.y});if(s.trail.length>C.TRAIL_MAX)s.trail.shift();}for(const p of this.planets)if(Math.hypot(s.x-p.x,s.y-p.y)<p.radius+s.r+2){this.createExplosion?.(s.x,s.y,p.type==='antimatter'?'#76f7ff':'#ffbf5d');this.settle(s,'lost');return;}for(const m of this.meteors||[])if(Math.hypot(s.x-m.x,s.y-m.y)<s.r+m.r+2){this.createExplosion?.(s.x,s.y,'#ff7b45');m.dead=true;this.settle(s,'lost');return;}for(const d of this.docks)if(Math.hypot(s.x-d.x,s.y-d.y)<d.r-2&&s.lastSpeed<=this.L().maxDock){const dist=Math.hypot(s.x-d.x,s.y-d.y),precision=Math.max(0,1-dist/d.r),speedBonus=Math.max(0,1-s.lastSpeed/this.L().maxDock);this.score+=Math.round(360+precision*280+speedBonus*160);d.ingest=1;d.lastGuest=s.name;this.settle(s,'docked',d);return;}const m=95;if(s.x<-m||s.x>this.W+m||s.y<-m||s.y>this.H+m)this.settle(s,'lost');};
  P.step=function(dt){if(this.resultLocked)return;this.worldTime=(this.worldTime||0)+dt;moveBodies(this);updateMeteors(this,dt);this.maybeRelease(dt);for(const s of this.satellites)this.stepSatellite(s,dt);for(const d of this.docks)d.ingest=Math.max(0,(d.ingest||0)-dt*2.4);this.telemetry();};

  const oldStart=P.startRun;
  P.startRun=function(){oldStart.call(this);if(this.meteorConfig){this.ui.hint.textContent='☄️ Evita i meteoriti · muovi solo i pianeti liberi';this.ui.hint.classList.add('visible');this.hintTimer=4.5;}else if(this.planets.some(p=>p.motion)){this.ui.hint.textContent='↔️ Le anomalie si muovono · anticipa la traiettoria';this.ui.hint.classList.add('visible');this.hintTimer=4.5;}};

  const oldDraw=P.drawPlanet;
  function lock(ctx,p){ctx.fillStyle='#fff';ctx.strokeStyle='#1b0b2d';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(p.x+p.radius*.58,p.y+p.radius*.48,15,12,4);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(p.x+p.radius*.655,p.y+p.radius*.47,4,Math.PI,TAU);ctx.stroke();}
  function tag(ctx,p,color){ctx.font='900 9px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#170722';ctx.fillStyle=color;ctx.strokeText(p.label,p.x,p.y-p.radius-15);ctx.fillText(p.label,p.x,p.y-p.radius-15);}
  P.drawPlanet=function(p,t){if(!p.anomaly||!['movingstar','pulsar','magnetar','whitehole','rogue'].includes(p.type))return oldDraw.call(this,p,t);const ctx=this.ctx,r=p.radius;ctx.save();
    if(p.type==='movingstar'){ctx.translate(p.x,p.y);ctx.rotate(t*.00025);for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.fillStyle=i%2?'#ffd62f':'#ff9219';ctx.strokeStyle='#713506';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r*.72,-r*.12);ctx.lineTo(r*1.3,0);ctx.lineTo(r*.72,r*.12);ctx.closePath();ctx.fill();ctx.stroke();}const g=ctx.createRadialGradient(-r*.3,-r*.3,1,0,0,r);g.addColorStop(0,'#fff6a6');g.addColorStop(.4,'#ffaf1b');g.addColorStop(1,'#e45400');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.strokeStyle='#713506';ctx.lineWidth=5;ctx.stroke();ctx.translate(-p.x,-p.y);tag(ctx,p,'#ffe56c');}
    else if(p.type==='pulsar'){const q=.85+.15*Math.sin(t*.01+p.visualSeed);for(let i=0;i<3;i++){ctx.globalAlpha=.2+i*.08;ctx.strokeStyle='#70e9ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,r*(1.4+i*.45)*q,0,TAU);ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle='#b7f7ff';ctx.strokeStyle='#163f83';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.stroke();ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(p.x-r*2.4,p.y);ctx.lineTo(p.x+r*2.4,p.y);ctx.stroke();tag(ctx,p,'#d9f6ff');}
    else if(p.type==='magnetar'){const g=ctx.createRadialGradient(p.x-r*.3,p.y-r*.3,1,p.x,p.y,r);g.addColorStop(0,'#f2dcff');g.addColorStop(.45,'#9e66ff');g.addColorStop(1,'#3c1b8c');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.strokeStyle='#271052';ctx.lineWidth=4;ctx.stroke();ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t*.0012);for(let i=0;i<3;i++){ctx.rotate(TAU/3);ctx.strokeStyle=i%2?'#d985ff':'#75e9ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,r*1.9,r*.55,0,0,TAU);ctx.stroke();}ctx.restore();tag(ctx,p,'#e7b6ff');}
    else if(p.type==='whitehole'){for(let i=0;i<4;i++){ctx.globalAlpha=.2+i*.05;ctx.strokeStyle=i%2?'#9cf7ff':'#fff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,r*(1.15+i*.28),r*(.45+i*.12),.32,0,TAU);ctx.stroke();}ctx.globalAlpha=1;const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,r*1.1);g.addColorStop(0,'#fff');g.addColorStop(.35,'#dfffff');g.addColorStop(.8,'#50bfff');g.addColorStop(1,'rgba(80,191,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r*1.1,0,TAU);ctx.fill();tag(ctx,p,'#dfffff');}
    else{const g=ctx.createRadialGradient(p.x-r*.3,p.y-r*.3,1,p.x,p.y,r);g.addColorStop(0,'#d8ff8a');g.addColorStop(.45,'#7fe05a');g.addColorStop(1,'#326f5c');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.strokeStyle='#24452d';ctx.lineWidth=5;ctx.stroke();for(const [x,y,z] of [[-.3,-.2,.18],[.3,-.1,.13],[-.05,.3,.16]]){ctx.fillStyle='#326f5c';ctx.beginPath();ctx.ellipse(p.x+r*x,p.y+r*y,r*z,r*z*.7,0,0,TAU);ctx.fill();}tag(ctx,p,'#caff87');}
    lock(ctx,p);ctx.restore();};

  function drawMeteors(game){const ctx=game.ctx;for(const m of game.meteors||[]){ctx.save();const a=Math.atan2(m.vy,m.vx);ctx.translate(m.x,m.y);ctx.rotate(a);const tail=m.r*(2.5+(game.meteorConfig?.severity||1)*.25),g=ctx.createLinearGradient(0,0,-tail,0);g.addColorStop(0,'rgba(255,229,76,.95)');g.addColorStop(.45,'rgba(255,103,38,.7)');g.addColorStop(1,'rgba(255,70,30,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-m.r*.55);ctx.lineTo(-tail,0);ctx.lineTo(0,m.r*.55);ctx.closePath();ctx.fill();ctx.rotate(m.rot-a);ctx.fillStyle='#67406f';ctx.strokeStyle='#2b1838';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<8;i++){const q=TAU*i/8,rr=m.r*(.78+.23*Math.sin(i*2.13+m.rot)),x=Math.cos(q)*rr,y=Math.sin(q)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}}
  const oldRender=P.render;P.render=function(t){oldRender.call(this,t);drawMeteors(this);};
})();
