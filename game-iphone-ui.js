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

  function applyViewportScale() {
    const {w,h} = viewport();
    // 844x390 is the reference iPhone landscape viewport. Height is weighted most
    // because Safari bars can remove a very large portion of usable vertical space.
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

  // Reserve only the actual amount of screen occupied by compact controls.
  // Fixed 72/66px margins were excessive on an iPhone viewport that can be only
  // ~240-300 CSS px high when Safari chrome is visible.
  P.safeTop = function() {
    const {h} = viewport();
    const s = parseFloat(getComputedStyle(root).getPropertyValue('--gd-phone-scale')) || .75;
    return Math.max(34, Math.min(64, Math.round(46 * s + h * .055)));
  };

  P.safeBottom = function() {
    const {h} = viewport();
    const s = parseFloat(getComputedStyle(root).getPropertyValue('--gd-phone-scale')) || .75;
    return Math.max(30, Math.min(58, Math.round(40 * s + h * .045)));
  };

  const oldSpawn = P.spawnLevel;
  P.spawnLevel = function() {
    applyViewportScale();
    oldSpawn.call(this);
    body.classList.add('gd-briefing');
  };

  const oldStart = P.startRun;
  P.startRun = function() {
    const out = oldStart.call(this);
    body.classList.remove('gd-briefing');
    if (this.hintTimer > 1.15) this.hintTimer = 1.15;
    return out;
  };

  const oldRestart = P.restart;
  P.restart = function() {
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
