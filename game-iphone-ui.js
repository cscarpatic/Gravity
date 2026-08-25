(() => {
  'use strict';

  const ua = navigator.userAgent || '';
  const isiPhone = /iPhone/i.test(ua);
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!isiPhone || !P) return;

  const body = document.body;
  const root = document.documentElement;

  function viewport() {
    const vv = window.visualViewport;
    return {
      w: Math.max(320, Math.round(vv ? vv.width : window.innerWidth)),
      h: Math.max(220, Math.round(vv ? vv.height : window.innerHeight))
    };
  }

  function phoneScale() {
    return parseFloat(getComputedStyle(root).getPropertyValue('--gd-phone-scale')) || .78;
  }

  function worldScale() {
    const s = phoneScale();
    return Math.max(.62, Math.min(.78, .68 + (s - .58) * .24));
  }

  function rocketScale() {
    const s = phoneScale();
    return Math.max(.58, Math.min(.72, .62 + (s - .58) * .22));
  }

  function applyViewportScale() {
    const {w,h} = viewport();
    const widthScale = w / 844;
    const heightScale = h / 390;
    const scale = Math.max(.58, Math.min(1, Math.min(widthScale, heightScale)));
    const textScale = Math.max(.72, Math.min(1, scale * 1.08));

    root.style.setProperty('--gd-phone-scale', scale.toFixed(3));
    root.style.setProperty('--gd-phone-text-scale', textScale.toFixed(3));
    root.style.setProperty('--gd-phone-vw', `${w}px`);
    root.style.setProperty('--gd-phone-vh', `${h}px`);

    body.classList.toggle('gd-ultra', h <= 320 || scale < .72);
    body.classList.toggle('gd-compact', h <= 390 || scale < .88);
    body.dataset.phoneViewport = `${w}x${h}`;
  }

  P.safeTop = function() {
    const {h} = viewport();
    const s = phoneScale();
    return Math.max(34, Math.min(64, Math.round(46 * s + h * .055)));
  };

  P.safeBottom = function() {
    const {h} = viewport();
    const s = phoneScale();
    return Math.max(30, Math.min(58, Math.round(40 * s + h * .045)));
  };

  const baseDrawPlanet = P.drawPlanet;
  P.drawPlanet = function(p,t) {
    if (!baseDrawPlanet) return;
    const k = worldScale();
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.scale(k,k);
    ctx.translate(-p.x,-p.y);
    baseDrawPlanet.call(this,p,t);
    ctx.restore();
  };

  const baseDrawSatellite = P.drawSatellite;
  P.drawSatellite = function(s,t) {
    if (!baseDrawSatellite) return;
    const k = rocketScale();
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(s.x,s.y);
    ctx.scale(k,k);
    ctx.translate(-s.x,-s.y);
    baseDrawSatellite.call(this,s,t);
    ctx.restore();
  };

  const oldSpawn = P.spawnLevel;
  P.spawnLevel = function() {
    applyViewportScale();
    oldSpawn.call(this);
    const pk = worldScale();
    const rk = rocketScale();
    for (const p of this.planets || []) {
      if (!p._iphoneRadiusScaled) {
        p.radius *= Math.max(.76, pk + .08);
        p._iphoneRadiusScaled = true;
      }
    }
    for (const s of this.satellitePlan || []) {
      if (!s._iphoneRadiusScaled) {
        s.r = Math.max(4.5, (s.r || 7) * Math.max(.72, rk + .08));
        s._iphoneRadiusScaled = true;
      }
    }
    body.classList.add('gd-briefing');
  };

  async function tryFullscreen() {
    try {
      if (!document.fullscreenElement && root.requestFullscreen) {
        await root.requestFullscreen({navigationUI:'hide'});
      } else if (!document.fullscreenElement && root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
      }
    } catch (_) {}
    try {
      if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
    } catch (_) {}
    if (!navigator.standalone) {
      try { window.scrollTo(0,1); } catch (_) {}
      setTimeout(() => { try { window.scrollTo(0,1); } catch (_) {} }, 140);
      setTimeout(() => { try { window.scrollTo(0,1); } catch (_) {} }, 420);
    }
  }

  const oldStart = P.startRun;
  P.startRun = function() {
    tryFullscreen();
    const out = oldStart.call(this);
    body.classList.remove('gd-briefing');
    if (this.hintTimer > 1.15) this.hintTimer = 1.15;
    return out;
  };

  const oldRestart = P.restart;
  P.restart = function() {
    tryFullscreen();
    const out = oldRestart.call(this);
    body.classList.remove('gd-briefing');
    if (this.hintTimer > .75) this.hintTimer = .75;
    return out;
  };

  const oldNext = P.next;
  P.next = function() {
    const out = oldNext.call(this);
    const card = this.ui && this.ui.missionCard;
    body.classList.toggle('gd-briefing', !!card && !card.classList.contains('hidden'));
    applyViewportScale();
    return out;
  };

  const refresh = () => {
    applyViewportScale();
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };

  applyViewportScale();
  window.addEventListener('orientationchange', () => setTimeout(refresh, 100), {passive:true});
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', refresh, {passive:true});
    window.visualViewport.addEventListener('scroll', applyViewportScale, {passive:true});
  }
})();
