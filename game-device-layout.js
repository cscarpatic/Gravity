(() => {
  'use strict';

  const P = window.GravityGame && window.GravityGame.prototype;
  if (!P) return;

  const ua = navigator.userAgent || '';
  const isiPhone = /iPhone/i.test(ua);
  const isiPad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIOS = isiPhone || isiPad;

  const body = document.body;
  body.classList.toggle('gd-iphone', isiPhone);
  body.classList.toggle('gd-ipad', isiPad);
  body.classList.toggle('gd-ios', isIOS);

  function viewportSize() {
    const vv = window.visualViewport;
    return {
      w: Math.max(320, Math.round(vv ? vv.width : window.innerWidth)),
      h: Math.max(260, Math.round(vv ? vv.height : window.innerHeight))
    };
  }

  function updateViewportState() {
    const {w,h} = viewportSize();
    document.documentElement.style.setProperty('--gd-vw', `${w}px`);
    document.documentElement.style.setProperty('--gd-vh', `${h}px`);
    const landscape = w >= h;
    body.classList.toggle('gd-landscape', landscape);
    body.classList.toggle('gd-portrait', !landscape);
    body.dataset.screenClass = h <= 430 ? 'short' : w >= 1100 ? 'large' : 'medium';
  }

  const originalResize = P.resize;
  P.resize = function() {
    const r = this.canvas.getBoundingClientRect();
    const {w,h} = viewportSize();
    this.W = Math.max(320, Math.round(r.width || w));
    this.H = Math.max(260, Math.round(r.height || h));
    this.DPR = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.W * this.DPR);
    this.canvas.height = Math.round(this.H * this.DPR);
    this.ctx.setTransform(this.DPR,0,0,this.DPR,0,0);
    this.buildStars();
    this.clampPlanets();
    if (this.started && !this.resultLocked) this.preview();
  };

  const oldSafeTop = P.safeTop;
  const oldSafeBottom = P.safeBottom;
  P.safeTop = function() {
    if (this.H <= 430) return 72;
    if (isiPad && this.W > this.H) return 112;
    return oldSafeTop.call(this);
  };
  P.safeBottom = function() {
    if (this.H <= 430) return 66;
    if (isiPad && this.W > this.H) return 105;
    return oldSafeBottom.call(this);
  };

  async function enterFullscreenAndLandscape() {
    const root = document.documentElement;
    try {
      if (!document.fullscreenElement && root.requestFullscreen) {
        await root.requestFullscreen({ navigationUI:'hide' });
      }
    } catch (_) {}

    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (_) {}

    if (isIOS && !window.navigator.standalone) {
      window.scrollTo(0, 1);
      setTimeout(() => window.scrollTo(0, 1), 180);
    }
    updateViewportState();
  }

  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', enterFullscreenAndLandscape);
    if (!document.documentElement.requestFullscreen && isIOS) {
      fullscreenBtn.title = 'Su iPhone/iPad la modalità più ampia si ottiene aprendo il gioco dalla schermata Home';
    }
  }

  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.addEventListener('click', enterFullscreenAndLandscape, { once:true });

  updateViewportState();
  const refresh = () => {
    updateViewportState();
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };

  window.addEventListener('orientationchange', () => setTimeout(refresh, 120), { passive:true });
  window.addEventListener('resize', updateViewportState, { passive:true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', refresh, { passive:true });
    window.visualViewport.addEventListener('scroll', updateViewportState, { passive:true });
  }
})();
