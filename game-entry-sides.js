(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const SIDES = ['left', 'top', 'right', 'bottom'];
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  const fracPattern = [.24,.52,.76,.36,.66,.18,.84,.44];

  function dockSide(game) {
    if (!game.docks.length) return 'right';
    const cx = game.docks.reduce((sum,d) => sum + d.x, 0) / game.docks.length;
    const cy = game.docks.reduce((sum,d) => sum + d.y, 0) / game.docks.length;
    const distance = { left:cx, right:game.W-cx, top:cy, bottom:game.H-cy };
    return SIDES.reduce((best,side) => distance[side] < distance[best] ? side : best, 'left');
  }

  function availableSides(game) {
    const blocked = dockSide(game);
    return SIDES.filter(side => side !== blocked);
  }

  P.makeSatellite = function(i, legacyY) {
    const l = this.L();
    const sides = availableSides(this);
    const side = sides[i % sides.length];
    const margin = Math.max(27, Math.min(this.W,this.H) * .045);
    const top = this.safeTop() + 20;
    const bottom = this.H - this.safeBottom() - 20;
    const f = fracPattern[i % fracPattern.length];

    let x, y;
    if (side === 'left' || side === 'right') {
      x = side === 'left' ? margin : this.W - margin;
      y = clamp(legacyY, top + 12, bottom - 12);
    } else {
      x = clamp(this.W * f, margin + 26, this.W - margin - 26);
      y = side === 'top' ? top : bottom;
    }

    const playMidY = (top + bottom) * .5;
    let tx = this.W * .52;
    let ty = playMidY + (i % 2 ? 1 : -1) * Math.min(44, (bottom-top) * .07);
    if (side === 'left') tx = this.W * .58;
    if (side === 'right') tx = this.W * .42;
    if (side === 'top') ty = this.H * .58;
    if (side === 'bottom') ty = this.H * .42;

    let angle = Math.atan2(ty-y, tx-x);
    angle += C.anglePattern[i % C.anglePattern.length] * .42;
    const speed = l.speed * C.speedPattern[i % C.speedPattern.length];

    return {
      id:i+1,
      name:`S${i+1}`,
      x,y,
      vx:speed*Math.cos(angle),
      vy:speed*Math.sin(angle),
      r:this.W<600?7:8,
      rot:angle,
      lastSpeed:speed,
      pulse:Math.random()*Math.PI*2,
      phase:i*.83,
      paint:C.satPaint[i % C.satPaint.length],
      incomingGlow:1,
      spawnSide:side
    };
  };

  const originalStart = P.startRun;
  P.startRun = function() {
    originalStart.call(this);
    if (this.L().sats > 1) {
      this.ui.hint.textContent = '☝️ Sposta i corpi · satelliti in arrivo da più lati';
    }
  };

  P.drawLaunchLane = function(t) {
    if (!this.started || this.resultLocked || this.released >= this.L().sats) return;
    const ctx = this.ctx;
    const next = this.satellitePlan[this.released];
    if (!next) return;

    const pulse = .5 + .5*Math.sin(t*.008);
    const x = next.x, y = next.y;
    ctx.save();
    ctx.globalAlpha = .84;
    ctx.fillStyle = `rgba(255,214,90,${.22 + pulse*.18})`;
    ctx.beginPath();ctx.arc(x,y,18+pulse*5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle = '#fff4b0';ctx.lineWidth = 4;
    ctx.beginPath();ctx.arc(x,y,11+pulse*2,0,Math.PI*2);ctx.stroke();

    const inward = {
      left:[1,0], right:[-1,0], top:[0,1], bottom:[0,-1]
    }[next.spawnSide] || [1,0];
    ctx.strokeStyle='#263664';ctx.lineWidth=4;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(x-inward[0]*5,y-inward[1]*5);ctx.lineTo(x+inward[0]*12,y+inward[1]*12);ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x+inward[0]*12-inward[1]*5,y+inward[1]*12+inward[0]*5);
    ctx.lineTo(x+inward[0]*18,y+inward[1]*18);
    ctx.lineTo(x+inward[0]*12+inward[1]*5,y+inward[1]*12-inward[0]*5);
    ctx.stroke();

    const label = `${next.name} · ${Math.max(0,this.nextSpawnTimer).toFixed(1)}s`;
    let lx=x, ly=y-24, align='center';
    if(next.spawnSide==='top') ly=y+34;
    if(next.spawnSide==='bottom') ly=y-28;
    if(next.spawnSide==='left'){lx=x+28;ly=y-4;align='left';}
    if(next.spawnSide==='right'){lx=x-28;ly=y-4;align='right';}
    ctx.font='900 11px system-ui';ctx.textAlign=align;ctx.lineWidth=4;ctx.strokeStyle='#263664';ctx.fillStyle='#ffffff';
    ctx.strokeText(label,lx,ly);ctx.fillText(label,lx,ly);
    ctx.restore();
  };
})();