(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const angleOffsets = [0,-.09,.09,-.18,.18,-.28,.28];
  const speedFactors = [.94,1.04];
  const opposite = { left:'right', right:'left', top:'bottom', bottom:'top' };
  const rand = (a,b) => a + Math.random() * (b-a);

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
    const dt=1/60, steps=360;
    let minDock=Infinity, minPlanetGap=Infinity, lived=0;
    let gravityPass=false, collision=false, escaped=false;

    for (let i=0;i<steps;i++) {
      const g=gravityAt(game,x,y);
      vx+=g.ax*dt; vy+=g.ay*dt;
      x+=vx*dt; y+=vy*dt;
      lived+=dt;

      for (const p of game.planets) {
        const d=Math.hypot(x-p.x,y-p.y);
        minPlanetGap=Math.min(minPlanetGap,d-p.radius);
        if (d < p.radius + sat.r + 3) { collision=true; break; }
        if (d < p.radius + Math.max(100,p.mass/12.5)) gravityPass=true;
      }
      if (collision) break;

      for (const d of game.docks) {
        minDock=Math.min(minDock,Math.hypot(x-d.x,y-d.y)-d.r);
      }

      const margin=105;
      if (x < -margin || x > game.W+margin || y < -margin || y > game.H+margin) {
        escaped=true;
        break;
      }
    }

    const directDock=Math.min(...game.docks.map(d=>angleDiff(angle,Math.atan2(d.y-sat.y,d.x-sat.x))));
    const reachBand=Math.max(85,Math.min(175,Math.min(game.W,game.H)*.32));
    const feasible=!collision && lived>2.9 && gravityPass && minDock<reachBand;

    let score=minDock;
    if (!gravityPass) score+=190;
    if (escaped && lived<3.8) score+=260;
    if (collision) score+=950;
    if (minPlanetGap<22) score+=95;
    if (directDock<.08) score+=55;
    score-=Math.min(lived,6)*5;

    return {angle,speed,score,feasible,minDock,lived,gravityPass};
  }

  function allowedSides(game, fallback) {
    const sides=[];
    for (const d of game.docks) {
      const side=opposite[d.side];
      if (side && !sides.includes(side)) sides.push(side);
    }
    if (!sides.length && fallback) sides.push(fallback);
    return sides.length ? sides : ['left'];
  }

  function randomStart(game,side) {
    const edge=Math.max(28,Math.min(game.W,game.H)*.045);
    const top=game.safeTop()+34;
    const bottom=game.H-game.safeBottom()-34;
    const left=edge;
    const right=game.W-edge;
    const f=rand(.15,.85);

    if (side==='left') return {x:left,y:top+(bottom-top)*f};
    if (side==='right') return {x:right,y:top+(bottom-top)*f};
    if (side==='top') return {x:left+(right-left)*f,y:top};
    return {x:left+(right-left)*f,y:bottom};
  }

  function inwardAngle(side) {
    if (side==='left') return 0;
    if (side==='right') return Math.PI;
    if (side==='top') return Math.PI/2;
    return -Math.PI/2;
  }

  function routeCandidates(game,sat,index,side) {
    const baseSpeed=game.L().speed*C.speedPattern[index%C.speedPattern.length];
    const base=inwardAngle(side)+rand(-.34,.34);
    const out=[];

    for (const sf of speedFactors) {
      for (const off of angleOffsets) {
        const signed=index%2 ? -off : off;
        const result=evaluate(game,sat,base+signed,baseSpeed*sf);
        result.score+=rand(0,18);
        out.push(result);
      }
    }
    return out;
  }

  function chooseRandomFeasible(game,sat,index) {
    const sides=allowedSides(game,sat.spawnSide);
    const feasible=[];
    const fallback=[];

    for (let attempt=0;attempt<12;attempt++) {
      const side=sides[Math.floor(Math.random()*sides.length)];
      const point=randomStart(game,side);
      const candidateSat={...sat,x:point.x,y:point.y,spawnSide:side};
      const routes=routeCandidates(game,candidateSat,index,side);

      for (const route of routes) {
        const item={...route,x:point.x,y:point.y,spawnSide:side};
        fallback.push(item);
        if (route.feasible) feasible.push(item);
      }
    }

    if (feasible.length) {
      feasible.sort((a,b)=>a.score-b.score);
      const pool=feasible.slice(0,Math.min(8,feasible.length));
      return pool[Math.floor(Math.random()*pool.length)];
    }

    fallback.sort((a,b)=>a.score-b.score);
    if (fallback.length) return fallback[0];

    return {
      x:sat.x,y:sat.y,spawnSide:sat.spawnSide,
      angle:Math.atan2(sat.vy,sat.vx),
      speed:Math.hypot(sat.vx,sat.vy)||game.L().speed,
      feasible:false,minDock:Infinity
    };
  }

  const previousSpawn=P.spawnLevel;
  P.spawnLevel=function() {
    previousSpawn.call(this);

    this.satellitePlan=this.satellitePlan.map((sat,i)=>{
      const route=chooseRandomFeasible(this,sat,i);
      return {
        ...sat,
        x:route.x,
        y:route.y,
        spawnSide:route.spawnSide,
        vx:Math.cos(route.angle)*route.speed,
        vy:Math.sin(route.angle)*route.speed,
        rot:route.angle,
        lastSpeed:route.speed,
        routeValidated:true,
        routeFeasible:route.feasible,
        routeClearance:route.minDock,
        randomStart:true
      };
    });
  };
})();
