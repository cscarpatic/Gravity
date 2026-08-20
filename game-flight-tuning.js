(() => {
  'use strict';

  const C = window.GD;
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!C || !P) return;

  const headingOffsets = [-.22, .16, -.09, .27, -.17, .08, .20, -.13];
  const waypointFractions = [.28, .62, .43, .74, .34, .56, .68, .22];

  const previousSpawn = P.spawnLevel;
  P.spawnLevel = function() {
    previousSpawn.call(this);

    const top = this.safeTop() + 36;
    const bottom = this.H - this.safeBottom() - 36;
    const playH = Math.max(180, bottom - top);

    this.satellitePlan = this.satellitePlan.map((sat, i) => {
      const side = sat.spawnSide || 'left';
      const f = waypointFractions[i % waypointFractions.length];
      let tx = this.W * f;
      let ty = top + playH * waypointFractions[(i + 3) % waypointFractions.length];

      if (side === 'left') {
        tx = this.W * (.54 + (i % 3) * .08);
      } else if (side === 'right') {
        tx = this.W * (.46 - (i % 3) * .08);
      } else if (side === 'top') {
        ty = top + playH * (.54 + (i % 3) * .1);
      } else if (side === 'bottom') {
        ty = top + playH * (.46 - (i % 3) * .1);
      }

      let angle = Math.atan2(ty - sat.y, tx - sat.x);
      angle += headingOffsets[i % headingOffsets.length];
      const speed = this.L().speed * C.speedPattern[i % C.speedPattern.length];

      return {
        ...sat,
        vx: speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        rot: angle,
        lastSpeed: speed,
        freeHeading: true
      };
    });
  };

  P.background = function(t) {
    const ctx = this.ctx, W = this.W, H = this.H;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#040712');
    sky.addColorStop(.52, '#080d20');
    sky.addColorStop(1, '#02040b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    for (const n of this.nebulae) {
      const x = n.x + Math.sin(t * .00008 * n.drift + n.phase) * 15;
      const y = n.y + Math.cos(t * .00006 * n.drift + n.phase) * 11;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, n.r);
      rg.addColorStop(0, `hsla(${n.hue},88%,64%,.10)`);
      rg.addColorStop(.55, `hsla(${n.hue},90%,52%,.035)`);
      rg.addColorStop(1, `hsla(${n.hue},90%,50%,0)`);
      ctx.fillStyle = rg;
      ctx.fillRect(x - n.r, y - n.r, n.r * 2, n.r * 2);
    }

    for (const s of this.stars) {
      const pulse = .72 + .28 * Math.sin(t * .001 * s.tw + s.p);
      ctx.globalAlpha = s.a * pulse;
      ctx.fillStyle = '#f7f9ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r + .15, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > .95) {
        ctx.strokeStyle = 'rgba(190,210,255,.44)';
        ctx.lineWidth = .8;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r - 1.4, s.y);
        ctx.lineTo(s.x + s.r + 1.4, s.y);
        ctx.moveTo(s.x, s.y - s.r - 1.4);
        ctx.lineTo(s.x, s.y + s.r + 1.4);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };
})();