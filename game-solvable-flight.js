(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const angleOffsets = [0,-.08,.08,-.15,.15,-.23,.23,-.31,.31,-.39,.39];
  const speedFactors = [1,.94,1.06];

  const angleDiff = (a,b) => {
    let d = (a-b) % (Math.PI*2);
    if (d > Math.PI) d -= Math.PI*2;
    if (d < -Math.PI) d += Math.PI*2;
    return Math.abs(d);
  };

  function gravityAt(game,x,y) {
    let ax=0, ay=0;
    for (const p of game.planets) {
      const dx=p.x-x, dy=p.y-y;
      const d2=dx*dx+dy*dy+C.SOFTEN*C.SOFTEN;
      const inv=1/Math.sqrt(d2);
      const a=C.G*p.mass/d2;
      ax+=a*dx*inv; ay+=a*dy*inv;
    }
    return {ax,ay};
  }

  function evaluate(game,sat,angle,speed) {
    let x=sat.x, y=sat.y;
    let vx=Math.cos(angle)*speed, vy=Math.sin(angle)*speed;
    const dt=1/60, steps=540;
    let minDock=Infinity, minPlanetGap=Infinity, lived=0, gravityPass=false, collision=false, escaped=false;

    for (let i=0;i<steps;i++) {
      const g=gravityAt(game,x,y);
      vx+=g.ax*dt; vy+=g.ay*dt;
      x+=vx*dt; y+=vy*dt;
      lived+=dt;

      for (const p of game.planets) {
        const d=Math.hypot(x-p.x,y-p.y);
        minPlanetGap=Math.min(minPlanetGap,d-p.radius);
        if (d < p.radius + sat.r + 3) { collision=true; break; }
        if (d < p.radius + Math.max(95,p.mass/13)) gravityPass=true;
      }
      if (collision) break;

      for (const d of game.docks) minDock=Math.min(minDock,Math.hypot(x-d.x,y-d.y)-d.r);

      const margin=105;
      if (x < -margin || x > game.W+margin || y < -margin || y > game.H+margin) { escaped=true; break; }
    }

    const directDock=Math.min(...game.docks.map(d=>angleDiff(angle,Math.atan2(d.y-sat.y,d.x-sat.x))));
    const reachBand=Math.max(70,Math.min(150,Math.min(game.W,game.H)*.28));
    const feasible=!collision && lived>3.2 && gravityPass && minDock<reachBand;

    let score=minDock;
    if (!gravityPass) score+=180;
    if (escaped && lived<4) score+=240;
    if (collision) score+=900;
    if (minPlanetGap<22) score+=80;
    if (directDock<.075) score+=45;
    score-=Math.min(lived,7)*4;

    return {angle,speed,score,feasible,minDock,lived,gravityPass};
  }

  function chooseRoute(game,sat,index) {
    const baseAngle=Math.atan2(sat.vy,sat.vx);
    const baseSpeed=Math.hypot(sat.vx,sat.vy) || game.L().speed;
    const candidates=[];

    for (const sf of speedFactors) {
      for (const off of angleOffsets) {
        const signed=(index%2 ? -off : off);
        candidates.push(evaluate(game,sat,baseAngle+signed,baseSpeed*sf));
      }
    }

    const feasible=candidates.filter(c=>c.feasible).sort((a,b)=>a.score-b.score);
    if (feasible.length) return feasible[Math.min(index%2,feasible.length-1)];

    return candidates.sort((a,b)=>a.score-b.score)[0];
  }

  const previousSpawn=P.spawnLevel;
  P.spawnLevel=function() {
    previousSpawn.call(this);

    this.satellitePlan=this.satellitePlan.map((sat,i)=>{
      const route=chooseRoute(this,sat,i);
      return {
        ...sat,
        vx:Math.cos(route.angle)*route.speed,
        vy:Math.sin(route.angle)*route.speed,
        rot:route.angle,
        lastSpeed:route.speed,
        routeValidated:true,
        routeFeasible:route.feasible,
        routeClearance:route.minDock
      };
    });
  };
})();
