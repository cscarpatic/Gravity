(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SIDES = ['left', 'top', 'right', 'bottom'];

  function detectDockSide(game) {
    if (!game.docks.length) return 'right';
    const cx = game.docks.reduce((s, d) => s + d.x, 0) / game.docks.length;
    const cy = game.docks.reduce((s, d) => s + d.y, 0) / game.docks.length;
    const distances = {
      left: cx,
      right: game.W - cx,
      top: cy,
      bottom: game.H - cy
    };
    return SIDES.reduce((best, side) => distances[side] < distances[best] ? side : best, 'left');
  }

  function edgePosition(game, side, laneIndex, laneCount) {
    const top = game.safeTop() + 24;
    const bottom = game.H - game.safeBottom() - 24;
    const left = Math.max(30, game.W * .047);
    const right = game.W - Math.max(30, game.W * .047);
    const frac = (laneIndex + 1) / (laneCount + 1);
    const jitter = laneCount > 1 ? rand(-.018, .018) : rand(-.035, .035);
    const f = clamp(frac + jitter, .12, .88);

    if (side === 'left') return { x:left, y:top + (bottom - top) * f };
    if (side === 'right') return { x:right, y:top + (bottom - top) * f };
    if (side === 'top') return { x:game.W * (.10 + .74 * f), y:top };
    return { x:game.W * (.10 + .74 * f), y:bottom };
  }

  const originalSpawnLevel = P.spawnLevel;
  P.spawnLevel = function() {
    originalSpawnLevel.call(this);

    this.dockSide = detectDockSide(this);
    this.entrySides = SIDES.filter(side => side !== this.dockSide);

    const assignments = this.satellitePlan.map((_, i) => this.entrySides[i % this.entrySides.length]);
    const totals = Object.fromEntries(this.entrySides.map(side => [side, assignments.filter(s => s === side).length]));
    const seen = Object.fromEntries(this.entrySides.map(side => [side, 0]));

    this.satellitePlan = this.satellitePlan.map((sat, i) => {
      const side = assignments[i];
      const lane = seen[side]++;
      const pos = edgePosition(this, side, lane, totals[side]);
      const target = this.docks[(i * 2 + this.levelIndex) % this.docks.length];
      const speed = this.L().speed * C.speedPattern[i % C.speedPattern.length];
      const baseAngle = Math.atan2(target.y - pos.y, target.x - pos.x);
      const challenge = C.anglePattern[i % C.anglePattern.length] * (.28 + this.levelIndex * .035);
      const angle = baseAngle + challenge;

      return {
        ...sat,
        x:pos.x,
        y:pos.y,
        vx:speed * Math.cos(angle),
        vy:speed * Math.sin(angle),
        rot:angle,
        lastSpeed:speed,
        entrySide:side,
        targetDockId:target.id
      };
    });
  };

  P.drawLaunchLane = function(t) {
    if (!this.entrySides || !this.entrySides.length) return;
    const ctx = this.ctx;
    const top = this.safeTop() + 24;
    const bottom = this.H - this.safeBottom() - 24;
    const left = Math.max(30, this.W * .047);
    const right = this.W - Math.max(30, this.W * .047);

    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([7, 8]);
    ctx.strokeStyle = 'rgba(142,163,255,.14)';

    for (const side of this.entrySides) {
      ctx.beginPath();
      if (side === 'left') { ctx.moveTo(left, top); ctx.lineTo(left, bottom); }
      else if (side === 'right') { ctx.moveTo(right, top); ctx.lineTo(right, bottom); }
      else if (side === 'top') { ctx.moveTo(this.W * .12, top); ctx.lineTo(this.W * .88, top); }
      else { ctx.moveTo(this.W * .12, bottom); ctx.lineTo(this.W * .88, bottom); }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (this.started && this.released < this.L().sats && !this.resultLocked) {
      const next = this.satellitePlan[this.released];
      if (next) {
        const pulse = .5 + .5 * Math.sin(t * .007);
        ctx.fillStyle = `rgba(160,195,255,${.18 + pulse * .2})`;
        ctx.beginPath();
        ctx.arc(next.x, next.y, 11 + pulse * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(230,239,255,.92)';
        ctx.font = '700 10px system-ui';
        const eta = Math.max(0, this.nextSpawnTimer).toFixed(1);
        const label = `${next.name} · ${eta}s`;

        if (next.entrySide === 'left') {
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, next.x + 18, next.y);
        } else if (next.entrySide === 'right') {
          ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(label, next.x - 18, next.y);
        } else if (next.entrySide === 'top') {
          ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(label, next.x, next.y + 17);
        } else {
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(label, next.x, next.y - 17);
        }
      }
    }

    ctx.restore();
  };
})();