(() => {
  'use strict';

  const ua = navigator.userAgent || '';
  const isiPhone = /iPhone/i.test(ua);
  const P = window.GravityGame && window.GravityGame.prototype;
  if (!isiPhone || !P) return;

  const body = document.body;

  function applyViewportClass() {
    const vv = window.visualViewport;
    const w = Math.round(vv ? vv.width : window.innerWidth);
    const h = Math.round(vv ? vv.height : window.innerHeight);
    body.classList.toggle('gd-ultra', h <= 320 || (h <= 350 && w <= 780));
    body.classList.toggle('gd-compact', h <= 390);
  }

  const oldSpawn = P.spawnLevel;
  P.spawnLevel = function() {
    oldSpawn.call(this);
    body.classList.add('gd-briefing');
    applyViewportClass();
  };

  const oldStart = P.startRun;
  P.startRun = function() {
    const out = oldStart.call(this);
    body.classList.remove('gd-briefing');
    if (this.hintTimer > 1.35) this.hintTimer = 1.35;
    return out;
  };

  const oldRestart = P.restart;
  P.restart = function() {
    const out = oldRestart.call(this);
    body.classList.remove('gd-briefing');
    if (this.hintTimer > .9) this.hintTimer = .9;
    return out;
  };

  const oldNext = P.next;
  P.next = function() {
    const out = oldNext.call(this);
    const card = this.ui && this.ui.missionCard;
    body.classList.toggle('gd-briefing', !!card && !card.classList.contains('hidden'));
    applyViewportClass();
    return out;
  };

  applyViewportClass();
  window.addEventListener('resize', applyViewportClass, {passive:true});
  window.addEventListener('orientationchange', () => setTimeout(applyViewportClass, 100), {passive:true});
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', applyViewportClass, {passive:true});
  }
})();
