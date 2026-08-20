(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sideOrder = ['right', 'bottom', 'top', 'left'];
  const opposite = { left:'right', right:'left', top:'bottom', bottom:'top' };
  const craftKinds = ['orbiter', 'shuttle', 'probe', 'glider', 'freighter', 'comet'];

  const extraPaint = [
    { body:'#fefefe', trim:'#5ec3ff', glow:'#8fe1ff', panel:'#4f86f7', engine:'#ffe08b' },
    { body:'#fff5fb', trim:'#ff76b2', glow:'#ff9aca', panel:'#8f5de8', engine:'#ffd0ea' },
    { body:'#f8fff0', trim:'#8ada72', glow:'#b6ffab', panel:'#56a85a', engine:'#fff1a3' },
    { body:'#fffaf0', trim:'#ffaf5c', glow:'#ffd188', panel:'#d27136', engine:'#ffe4aa' },
    { body:'#eef8ff', trim:'#87b5ff', glow:'#b6d4ff', panel:'#4d6ddb', engine:'#fff2bd' },
    { body:'#f6f3ff', trim:'#d792ff', glow:'#efb6ff', panel:'#7d58ca', engine:'#ffe7a6' }
  ];

  const originalSpawnLevel = P.spawnLevel;

  function lanePos(game, side, index, total) {
    const top = game.safeTop() + 56;
    const bottom = game.H - game.safeBottom() - 56;
    const left = 56;
    const right = game.W - 56;
    const frac = total === 1 ? .5 : (index + 1) / (total + 1);
    if (side === 'left') return { x:left, y: top + (bottom-top) * frac };
    if (side === 'right') return { x:right, y: top + (bottom-top) * frac };
    if (side === 'top') return { x:left + (right-left) * frac, y: top };
    return { x:left + (right-left) * frac, y: bottom };
  }

  function buildDockLayout(game, count) {
    const sides = sideOrder.slice(0, Math.min(count, sideOrder.length));
    const groups = {};
    for (const side of sides) groups[side] = 1;
    for (let extra = count - sides.length; extra > 0; extra--) {
      const side = sides[(count - extra) % sides.length];
      groups[side]++;
    }

    const docks = [];
    let id = 1;
    for (const side of sides) {
      const n = groups[side];
      for (let i = 0; i < n; i++) {
        const pos = lanePos(game, side, i, n);
        docks.push({
          id:id++, side,
          x:pos.x, y:pos.y,
          baseX:pos.x, baseY:pos.y,
          r:game.L().dockR,
          phase:i * .9,
          uses:0,
          ingest:0,
          pulse:rand(0, Math.PI * 2),
          lastGuest:''
        });
      }
    }
    return docks;
  }

  function ensurePlanVisuals(game) {
    game.effects = game.effects || [];
    for (const d of game.docks) {
      d.baseX = d.baseX ?? d.x;
      d.baseY = d.baseY ?? d.y;
      d.ingest = d.ingest || 0;
      d.side = d.side || 'right';
      d.pulse = d.pulse || rand(0, Math.PI * 2);
      d.lastGuest = d.lastGuest || '';
    }
  }

  P.spawnLevel = function() {
    originalSpawnLevel.call(this);
    this.effects = [];
    this.docks = buildDockLayout(this, this.L().docks);
    const assigned = this.docks.map(d => opposite[d.side]);
    const top = this.safeTop() + 20;
    const bottom = this.H - this.safeBottom() - 20;
    const left = Math.max(28, Math.min(this.W, this.H) * .045);
    const right = this.W - left;

    this.satellitePlan = this.satellitePlan.map((sat, i) => {
      const spawnSide = assigned[i % assigned.length];
      const laneIndex = Math.floor(i / assigned.length);
      const laneTotal = Math.ceil(this.L().sats / assigned.length);
      const pos = lanePos(this, spawnSide, laneIndex % laneTotal, laneTotal);
      let x = pos.x, y = pos.y;
      if (spawnSide === 'left') x = left;
      if (spawnSide === 'right') x = right;
      if (spawnSide === 'top') y = top;
      if (spawnSide === 'bottom') y = bottom;

      const targetDock = this.docks[i % this.docks.length];
      let tx = targetDock.x;
      let ty = targetDock.y;
      const angleOffset = C.anglePattern[i % C.anglePattern.length] * .34;
      const angle = Math.atan2(ty - y, tx - x) + angleOffset;
      const speed = this.L().speed * C.speedPattern[i % C.speedPattern.length];
      const paint = extraPaint[i % extraPaint.length];
      return {
        ...sat,
        x, y,
        vx:speed * Math.cos(angle),
        vy:speed * Math.sin(angle),
        rot:angle,
        lastSpeed:speed,
        pulse:rand(0, Math.PI*2),
        phase:i * .83,
        incomingGlow:1,
        spawnSide,
        targetDockId:targetDock.id,
        kind:craftKinds[i % craftKinds.length],
        paint
      };
    });
    ensurePlanVisuals(this);
  };

  P.createExplosion = function(x, y, color = '#ffd36a') {
    this.effects = this.effects || [];
    this.effects.push({ type:'boom', x, y, born:performance.now(), ttlMs:560, color });
  };

  P.stepSatellite = function(s, dt) {
    if (s.status !== 'flying') return;
    const g = this.gravity(s.x, s.y);
    s.vx += g.ax * dt; s.vy += g.ay * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.rot = Math.atan2(s.vy, s.vx);
    s.lastSpeed = Math.hypot(s.vx, s.vy);
    s.incomingGlow = Math.max(0, s.incomingGlow - dt * .9);
    if (!s.trail.length || Math.hypot(s.x - s.trail.at(-1).x, s.y - s.trail.at(-1).y) > 4.8) {
      s.trail.push({x:s.x, y:s.y});
      if (s.trail.length > C.TRAIL_MAX) s.trail.shift();
    }

    for (const p of this.planets) {
      if (Math.hypot(s.x - p.x, s.y - p.y) < p.radius + s.r + 2) {
        this.createExplosion(s.x, s.y, '#ffbf5d');
        this.settle(s, 'lost');
        return;
      }
    }

    for (const d of this.docks) {
      if (Math.hypot(s.x - d.x, s.y - d.y) < d.r - 2 && s.lastSpeed <= this.L().maxDock) {
        const dist = Math.hypot(s.x - d.x, s.y - d.y);
        const precision = Math.max(0, 1 - dist / d.r);
        const speedBonus = Math.max(0, 1 - s.lastSpeed / this.L().maxDock);
        this.score += Math.round(360 + precision * 280 + speedBonus * 160);
        d.ingest = 1;
        d.lastGuest = s.name;
        this.settle(s, 'docked', d);
        return;
      }
    }

    const m = 95;
    if (s.x < -m || s.x > this.W + m || s.y < -m || s.y > this.H + m) this.settle(s, 'lost');
  };

  P.step = function(dt) {
    if (this.resultLocked) return;
    this.maybeRelease(dt);
    for (const s of this.satellites) this.stepSatellite(s, dt);
    for (const d of this.docks) d.ingest = Math.max(0, d.ingest - dt * 2.4);
    this.telemetry();
  };

  P.drawTrails = function() {
    const ctx = this.ctx;
    ctx.save();
    for (const s of this.satellites) {
      for (let i = 1; i < s.trail.length; i++) {
        const a = s.trail[i-1], b = s.trail[i];
        const alpha = (i / s.trail.length) * .48;
        ctx.lineCap = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = `rgba(255,255,255,${alpha * .45})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = `${s.paint.glow}${Math.round(alpha * 255).toString(16).padStart(2,'0')}`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.restore();
  };

  P.drawSatellite = function(s, t) {
    if (s.status !== 'flying') return;
    const ctx = this.ctx;
    const paint = s.paint || extraPaint[0];
    const flare = .55 + .45 * Math.sin(t * .016 + s.pulse);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);

    ctx.fillStyle = `rgba(255,255,255,${.15 + flare * .18 + s.incomingGlow * .18})`;
    ctx.beginPath(); ctx.ellipse(-11, 0, 16 + s.incomingGlow * 6, 10 + s.incomingGlow * 4, 0, 0, Math.PI * 2); ctx.fill();

    const stroke = '#24345e';
    const body = () => {
      if (s.kind === 'shuttle') {
        ctx.beginPath();
        ctx.moveTo(-10,-6); ctx.lineTo(5,-6); ctx.quadraticCurveTo(12,-2,12,0); ctx.quadraticCurveTo(12,2,5,6); ctx.lineTo(-10,6); ctx.quadraticCurveTo(-13,0,-10,-6); ctx.closePath();
      } else if (s.kind === 'probe') {
        ctx.beginPath(); ctx.roundRect(-8,-6,18,12,5);
      } else if (s.kind === 'glider') {
        ctx.beginPath(); ctx.moveTo(-11,-5); ctx.lineTo(4,-7); ctx.lineTo(11,0); ctx.lineTo(4,7); ctx.lineTo(-11,5); ctx.closePath();
      } else if (s.kind === 'freighter') {
        ctx.beginPath(); ctx.roundRect(-10,-7,20,14,6);
      } else if (s.kind === 'comet') {
        ctx.beginPath(); ctx.moveTo(-9,-5); ctx.lineTo(5,-6); ctx.quadraticCurveTo(14,0,5,6); ctx.lineTo(-9,5); ctx.quadraticCurveTo(-12,0,-9,-5); ctx.closePath();
      } else {
        ctx.beginPath(); ctx.moveTo(-9,-6); ctx.lineTo(5,-6); ctx.quadraticCurveTo(11,-3,12,0); ctx.quadraticCurveTo(11,3,5,6); ctx.lineTo(-9,6); ctx.quadraticCurveTo(-12,0,-9,-6); ctx.closePath();
      }
    };

    ctx.fillStyle = paint.panel;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3.1;
    ctx.beginPath(); ctx.roundRect(-19,-6,9,12,4); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(10,-6,9,12,4); ctx.fill(); ctx.stroke();

    ctx.fillStyle = paint.body;
    body(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = paint.trim;
    ctx.beginPath(); ctx.roundRect(-11.6,-3.3,3.2,6.6,2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(2.1,0,3.1,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#88e0ff'; ctx.beginPath(); ctx.arc(2.5,0,1.4,0,Math.PI*2); ctx.fill();

    ctx.strokeStyle = stroke; ctx.lineWidth = 2.3;
    ctx.beginPath(); ctx.moveTo(-1.5,-7); ctx.lineTo(-1.5,-12); ctx.stroke();
    ctx.beginPath(); ctx.arc(-1.5,-13.5,1.8,0,Math.PI*2); ctx.fillStyle='#fff3c1'; ctx.fill(); ctx.stroke();

    ctx.strokeStyle = stroke; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(4.8,-2.7); ctx.lineTo(10.8,-6.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4.8,2.7); ctx.lineTo(10.8,6.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(10.8,0,6.2,-.68,.68); ctx.stroke();

    ctx.fillStyle = paint.engine; ctx.strokeStyle = stroke; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-8.8,-2.6); ctx.lineTo(-15.3,0); ctx.lineTo(-8.8,2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff5a8'; ctx.beginPath(); ctx.arc(-15.4,0,1.4 + flare * .45,0,Math.PI*2); ctx.fill();

    ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#24345e'; ctx.lineWidth = 4; ctx.font = '900 10px system-ui'; ctx.textAlign = 'center';
    ctx.strokeText(s.name, s.x, s.y - 17); ctx.fillText(s.name, s.x, s.y - 17);
  };

  P.drawDock = function(d, t) {
    const ctx = this.ctx;
    d.phase += .012;
    const pulse = 1 + Math.sin(t * .004 + d.pulse) * .06;
    const ingest = d.ingest || 0;
    const mouth = 1 - ingest * .38;
    let x = d.baseX, y = d.baseY;
    if (d.side === 'left') x -= ingest * 8;
    if (d.side === 'right') x += ingest * 8;
    if (d.side === 'top') y -= ingest * 8;
    if (d.side === 'bottom') y += ingest * 8;
    d.x = x; d.y = y;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(143,255,215,.18)';
    ctx.beginPath(); ctx.arc(0,0,d.r*1.25,0,Math.PI*2); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#214c46';
    ctx.beginPath(); ctx.arc(0,0,d.r,0,Math.PI*2); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = '#8affc7';
    ctx.beginPath(); ctx.arc(0,0,d.r,0,Math.PI*2); ctx.stroke();

    ctx.fillStyle = '#d9fff0';
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI/2) * i + d.phase;
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.roundRect(d.r - 9, -5 * mouth, 13, 10 * mouth, 4); ctx.fill();
      ctx.strokeStyle = '#214c46'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }

    if (ingest > 0) {
      ctx.fillStyle = `rgba(255,244,170,${ingest * .6})`;
      ctx.beginPath(); ctx.arc(0,0,d.r * (.65 + ingest * .22),0,Math.PI*2); ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#214c46'; ctx.lineWidth = 4; ctx.font = '900 10px system-ui'; ctx.textAlign = 'center';
    ctx.strokeText(`D${d.id}`, x, y + 4); ctx.fillText(`D${d.id}`, x, y + 4);
  };

  P.drawExplosions = function() {
    const ctx = this.ctx;
    if (!this.effects) return;
    ctx.save();
    const now = performance.now();
    this.effects = this.effects.filter(e => now - e.born < e.ttlMs);
    for (const e of this.effects) {
      const p = Math.min(1, (now - e.born) / e.ttlMs);
      const r = 6 + p * 18;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = e.color;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i + p * .8;
        ctx.beginPath();
        ctx.ellipse(e.x + Math.cos(a) * r * .5, e.y + Math.sin(a) * r * .5, 4 + p * 2, 2.2 + p, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,250,209,.95)';
      ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(1.5, 5 - p * 3), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  const originalRender = P.render;
  P.render = function(t) {
    originalRender.call(this, t);
    this.drawExplosions();
  };
})();
