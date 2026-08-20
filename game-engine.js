(() => {
  'use strict';

  const C = window.GD;
  const rand = (a,b) => a + Math.random() * (b-a);
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

  class GravityGame {
    constructor() {
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas.getContext('2d', { alpha:false });
      const $ = id => document.getElementById(id);
      this.ui = {
        level:$('levelValue'), sat:$('satValue'), dock:$('dockValue'), score:$('scoreValue'),
        speed:$('speedValue'), speedFill:$('speedFill'), missionCard:$('missionCard'),
        missionTitle:$('missionTitle'), missionText:$('missionText'), start:$('startBtn'),
        pause:$('pauseBtn'), pauseOverlay:$('pauseOverlay'), resume:$('resumeBtn'),
        restart:$('restartBtn'), resultOverlay:$('resultOverlay'), resultIcon:$('resultIcon'),
        resultKicker:$('resultKicker'), resultTitle:$('resultTitle'), resultText:$('resultText'),
        next:$('nextBtn'), hint:$('hint')
      };
      this.W=0; this.H=0; this.DPR=1; this.last=performance.now(); this.acc=0;
      this.levelIndex=0; this.score=0; this.running=false; this.paused=false; this.started=false; this.resultLocked=false;
      this.stars=[]; this.nebulae=[]; this.satellites=[]; this.docks=[]; this.planets=[]; this.previews=[];
      this.satellitePlan=[]; this.released=0; this.nextSpawnTimer=0; this.docked=0; this.lost=0; this.hintTimer=0;
      this.pointer={down:false,planet:null};
      this.resize();
      this.spawnLevel();
    }

    L(){ return C.levels[this.levelIndex]; }
    safeTop(){ return this.W < 600 ? 94 : 104; }
    safeBottom(){ return this.W < 600 ? 100 : 112; }

    resize(){
      const r=this.canvas.getBoundingClientRect();
      this.W=Math.max(320,r.width); this.H=Math.max(480,r.height); this.DPR=Math.min(devicePixelRatio||1,2);
      this.canvas.width=Math.round(this.W*this.DPR); this.canvas.height=Math.round(this.H*this.DPR);
      this.ctx.setTransform(this.DPR,0,0,this.DPR,0,0);
      this.buildStars(); this.clampPlanets(); if(this.started&&!this.resultLocked)this.preview();
    }

    buildStars(){
      const n=Math.round(this.W*this.H/360000*(74+this.levelIndex*10));
      this.stars=Array.from({length:n},()=>({x:Math.random()*this.W,y:Math.random()*this.H,r:rand(.35,1.55),a:rand(.25,.9),p:rand(0,6.28),tw:rand(.7,2)}));
      this.nebulae=Array.from({length:3},(_,i)=>({x:rand(this.W*.12,this.W*.88),y:rand(this.H*.12,this.H*.78),r:rand(Math.min(this.W,this.H)*.14,Math.min(this.W,this.H)*.26),hue:[210,255,290][i],drift:rand(.2,.6),phase:rand(0,6.28)}));
    }

    lanes(count,top,bottom,wobble){
      if(count===1)return[(top+bottom)/2];
      return Array.from({length:count},(_,i)=>top+(bottom-top)*(i+1)/(count+1)+rand(-wobble,wobble));
    }

    makeFeatures(radius,type){
      return Array.from({length:type==='gas'?10:7},(_,i)=>({x:rand(-.55,.55)*radius,y:rand(-.55,.55)*radius,rx:rand(.08,.28)*radius,ry:rand(.035,.12)*radius,rot:rand(-.8,.8),a:rand(.08,.24),phase:rand(0,6.28),i}));
    }

    makePlanet(x,y,mass,radius,{type='ocean',ring=false,draggable=true,tilt=-.3}={}){
      return{x,y,mass,radius,type,ring,draggable,tilt,rot:rand(0,6.28),pulse:rand(0,6.28),features:this.makeFeatures(radius,type)};
    }

    makeSatellite(i,y,referenceY){
      const l=this.L();
      const bias=clamp((referenceY-y)/Math.max(620,this.W*1.45),-.055,.055);
      const angle=bias+C.anglePattern[i%C.anglePattern.length]*(this.levelIndex?.72:.25);
      const speed=l.speed*C.speedPattern[i%C.speedPattern.length];
      return{id:i+1,name:`S${i+1}`,x:Math.max(30,this.W*.047)-(i%2)*Math.min(18,this.W*.018),y,vx:speed*Math.cos(angle),vy:speed*Math.sin(angle),r:this.W<600?7:8,rot:angle,lastSpeed:speed,pulse:rand(0,6.28),phase:i*.83,paint:C.satPaint[i%C.satPaint.length],incomingGlow:1};
    }

    spawnLevel(){
      const l=this.L(), top=this.safeTop(), bottom=this.H-this.safeBottom(), playH=Math.max(260,bottom-top), mid=(top+bottom)/2;
      this.docked=0; this.lost=0; this.resultLocked=false; this.released=0; this.nextSpawnTimer=l.releaseInterval; this.satellites=[]; this.previews=[];
      const dockYs=this.lanes(l.docks,top+58,bottom-58,Math.min(14,playH*.025));
      this.docks=dockYs.map((y,i)=>({id:i+1,x:this.W-Math.max(50,this.W*.075)-(i%2)*Math.min(28,this.W*.035),y,r:l.dockR,phase:i*.9,uses:0}));
      const satYs=this.lanes(l.sats,top+46,bottom-46,Math.min(10,playH*.02));
      this.satellitePlan=satYs.map((y,i)=>this.makeSatellite(i,y,this.docks[(i*2+this.levelIndex)%this.docks.length].y));
      const px=this.W*(this.H>this.W?.48:.5), py=clamp(mid+rand(-playH*.055,playH*.055),top+l.radius+16,bottom-l.radius-16);
      this.planets=[this.makePlanet(px,py,l.mass,l.radius,{type:l.type,ring:l.ring,tilt:-.3+this.levelIndex*.025})];
      if(l.second)this.planets.push(this.makePlanet(this.W*.70,clamp(mid-playH*.22,top+42,bottom-42),1400+this.levelIndex*180,28+this.levelIndex,{type:'violet',ring:this.levelIndex===5,draggable:false,tilt:.22}));
      this.running=false; this.paused=false; this.pointer.planet=null; this.hintTimer=0;
      this.ui.level.textContent=String(this.levelIndex+1); this.ui.sat.textContent=`0/${l.sats}`; this.ui.dock.textContent=String(l.docks); this.ui.score.textContent=String(this.score);
      this.ui.missionTitle.textContent=l.name; this.ui.missionText.textContent=l.text; this.ui.start.textContent=this.levelIndex?'Lancia i satelliti':'Inizia';
      this.ui.speed.textContent=l.speed.toFixed(1); this.ui.speedFill.style.width=`${Math.min(100,l.speed/3)}%`; this.ui.hint.classList.remove('visible');
    }

    clampPlanets(){
      for(const p of this.planets){p.x=clamp(p.x,p.radius+14,this.W-p.radius-14);p.y=clamp(p.y,this.safeTop()+12+p.radius,this.H-this.safeBottom()-12-p.radius);}
    }

    gravity(x,y){
      let ax=0,ay=0;
      for(const p of this.planets){const dx=p.x-x,dy=p.y-y,d2=dx*dx+dy*dy+C.SOFTEN*C.SOFTEN,inv=1/Math.sqrt(d2),a=C.G*p.mass/d2;ax+=a*dx*inv;ay+=a*dy*inv;}
      return{ax,ay};
    }

    launchNextSatellite(){
      if(this.released>=this.satellitePlan.length)return false;
      const t=this.satellitePlan[this.released];
      this.satellites.push({...t,trail:[],status:'flying'});
      this.released++; this.nextSpawnTimer=this.L().releaseInterval; this.preview(); return true;
    }

    maybeRelease(dt){
      if(this.released===0){this.launchNextSatellite();return;}
      if(this.released>=this.satellitePlan.length||this.L().releaseInterval<=0)return;
      this.nextSpawnTimer-=dt;
      if(this.nextSpawnTimer<=0)this.launchNextSatellite();
    }

    settle(s,status,target=null){
      if(s.status!=='flying')return;
      s.status=status;
      if(status==='docked'){this.docked++;if(target)target.uses++;}else this.lost++;
      this.telemetry();
      if(this.released===this.L().sats&&this.docked+this.lost===this.L().sats){
        if(!this.lost){const bonus=600+this.levelIndex*180+this.L().sats*90;this.score+=bonus;this.finish(true,'Tutti in salvo',`Tutti i ${this.L().sats} satelliti hanno raggiunto un dock. Bonus +${bonus}.`);}
        else this.finish(false,`${this.docked}/${this.L().sats} in salvo`,`${this.lost} satellite${this.lost===1?'':'i'} pers${this.lost===1?'o':'i'}. Ogni satellite segue la propria traiettoria.`);
      }
    }

    stepSatellite(s,dt){
      if(s.status!=='flying')return;
      const g=this.gravity(s.x,s.y);s.vx+=g.ax*dt;s.vy+=g.ay*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.rot=Math.atan2(s.vy,s.vx);s.lastSpeed=Math.hypot(s.vx,s.vy);s.incomingGlow=Math.max(0,s.incomingGlow-dt*.9);
      if(!s.trail.length||Math.hypot(s.x-s.trail.at(-1).x,s.y-s.trail.at(-1).y)>5.5){s.trail.push({x:s.x,y:s.y});if(s.trail.length>C.TRAIL_MAX)s.trail.shift();}
      for(const p of this.planets)if(Math.hypot(s.x-p.x,s.y-p.y)<p.radius+s.r+2){this.settle(s,'lost');return;}
      for(const d of this.docks)if(Math.hypot(s.x-d.x,s.y-d.y)<d.r-2&&s.lastSpeed<=this.L().maxDock){const dist=Math.hypot(s.x-d.x,s.y-d.y),precision=Math.max(0,1-dist/d.r),speedBonus=Math.max(0,1-s.lastSpeed/this.L().maxDock);this.score+=Math.round(360+precision*280+speedBonus*160);this.settle(s,'docked',d);return;}
      const m=95;if(s.x<-m||s.x>this.W+m||s.y<-m||s.y>this.H+m)this.settle(s,'lost');
    }

    step(dt){if(this.resultLocked)return;this.maybeRelease(dt);for(const s of this.satellites)this.stepSatellite(s,dt);this.telemetry();}

    telemetry(){
      this.ui.sat.textContent=`${this.docked}/${this.L().sats}`;this.ui.score.textContent=String(this.score);
      const active=this.satellites.filter(s=>s.status==='flying'),max=active.length?Math.max(...active.map(s=>s.lastSpeed)):0;
      this.ui.speed.textContent=max.toFixed(1);this.ui.speedFill.style.width=`${Math.min(100,max/3)}%`;
    }

    preview(){
      this.previews=this.satellites.map(sat=>{
        if(sat.status!=='flying')return[];
        const s={x:sat.x,y:sat.y,vx:sat.vx,vy:sat.vy},path=[];
        for(let i=0;i<132;i++){const g=this.gravity(s.x,s.y);s.vx+=g.ax/36;s.vy+=g.ay/36;s.x+=s.vx/36;s.y+=s.vy/36;if(i%4===0)path.push({x:s.x,y:s.y});if(this.planets.some(p=>Math.hypot(s.x-p.x,s.y-p.y)<p.radius+4)||s.x<-20||s.x>this.W+20||s.y<-20||s.y>this.H+20)break;}
        return path;
      });
    }

    finish(ok,title,text){
      this.resultLocked=true;this.running=false;this.ui.resultOverlay.classList.remove('hidden');this.ui.resultIcon.textContent=ok?'✓':'×';this.ui.resultIcon.style.color=ok?'var(--success)':'var(--danger)';this.ui.resultIcon.style.background=ok?'rgba(128,241,192,.12)':'rgba(255,122,145,.12)';this.ui.resultKicker.textContent=ok?'SATELLITI AGGANCIATI':'MISSIONE INCOMPLETA';this.ui.resultTitle.textContent=title;this.ui.resultText.textContent=text;this.ui.next.textContent=ok?(this.levelIndex===C.levels.length-1?'Ricomincia il viaggio':'Livello successivo'):'Riprova';this.ui.next.dataset.success=ok?'1':'0';
    }

    startRun(){this.started=true;this.running=true;this.paused=false;this.ui.missionCard.classList.add('hidden');this.ui.pauseOverlay.classList.add('hidden');this.ui.resultOverlay.classList.add('hidden');this.ui.hint.textContent=this.L().sats>1?'☝️ Sposta il pianeta · nuovi satelliti entreranno in volo':'☝️ Trascina il pianeta';this.ui.hint.classList.add('visible');this.hintTimer=3.2;this.preview();}
    restart(){this.spawnLevel();this.ui.missionCard.classList.add('hidden');this.started=true;this.running=true;this.preview();}
    next(){const ok=this.ui.next.dataset.success==='1';this.ui.resultOverlay.classList.add('hidden');if(!ok)return this.restart();this.levelIndex++;if(this.levelIndex>=C.levels.length){this.levelIndex=0;this.score=0;}this.buildStars();this.spawnLevel();this.ui.missionCard.classList.remove('hidden');}
    pause(){if(!this.started||this.resultLocked)return;this.paused=true;this.running=false;this.ui.pauseOverlay.classList.remove('hidden');}
    resume(){this.paused=false;this.running=true;this.ui.pauseOverlay.classList.add('hidden');}
  }

  window.GravityGame=GravityGame;
})();