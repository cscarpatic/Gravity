(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  const ui = {
    level: document.getElementById('levelValue'),
    sat: document.getElementById('satValue'),
    score: document.getElementById('scoreValue'),
    speed: document.getElementById('speedValue'),
    speedFill: document.getElementById('speedFill'),
    missionCard: document.getElementById('missionCard'),
    missionTitle: document.getElementById('missionTitle'),
    missionText: document.getElementById('missionText'),
    start: document.getElementById('startBtn'),
    pause: document.getElementById('pauseBtn'),
    pauseOverlay: document.getElementById('pauseOverlay'),
    resume: document.getElementById('resumeBtn'),
    restart: document.getElementById('restartBtn'),
    resultOverlay: document.getElementById('resultOverlay'),
    resultIcon: document.getElementById('resultIcon'),
    resultKicker: document.getElementById('resultKicker'),
    resultTitle: document.getElementById('resultTitle'),
    resultText: document.getElementById('resultText'),
    next: document.getElementById('nextBtn'),
    hint: document.getElementById('hint')
  };

  const levels = [
    { name: 'Prima orbita', text: 'Trascina il pianeta e curva il satellite dentro al portale.', count: 3, mass: 1250, radius: 30, speed: 145, dock: 40, maxDockSpeed: 205, starDensity: 68 },
    { name: 'Super-Terra', text: 'Più massa: piccole mosse producono curve molto più forti.', count: 3, mass: 1900, radius: 36, speed: 160, dock: 38, maxDockSpeed: 215, starDensity: 76 },
    { name: 'Gigante gassoso', text: 'Attrazione intensa e poco spazio. Evita l’impatto col pianeta.', count: 4, mass: 2850, radius: 48, speed: 172, dock: 36, maxDockSpeed: 225, starDensity: 82 },
    { name: 'Fionda', text: 'Il satellite arriva più veloce: usa il pianeta come fionda gravitazionale.', count: 4, mass: 2450, radius: 38, speed: 205, dock: 34, maxDockSpeed: 248, starDensity: 90 },
    { name: 'Sistema binario', text: 'Ora hai due masse: sposta quella luminosa, sfrutta anche la compagna fissa.', count: 4, mass: 2100, radius: 34, speed: 190, dock: 33, maxDockSpeed: 235, secondPlanet: true, starDensity: 96 },
    { name: 'Buco gravitazionale', text: 'Ultimo livello: gravità estrema, portale piccolo, precisione massima.', count: 5, mass: 3550, radius: 44, speed: 218, dock: 30, maxDockSpeed: 250, secondPlanet: true, starDensity: 110 }
  ];

  const G = 110;
  const SOFTEN = 36;
  const TRAIL_MAX = 84;

  let W = 0, H = 0, DPR = 1;
  let stars = [];
  let running = false;
  let paused = false;
  let started = false;
  let resultLocked = false;
  let lastT = performance.now();
  let acc = 0;
  const FIXED_DT = 1 / 120;

  let levelIndex = 0;
  let satelliteIndex = 0;
  let score = 0;
  let satellite = null;
  let target = null;
  let planets = [];
  let pointer = { down: false, x: 0, y: 0, planet: null };
  let previewPath = [];
  let hintTimer = 0;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = Math.max(480, rect.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildStars();
    if (started && !resultLocked) {
      clampPlanets();
      computePreview();
    }
  }

  function buildStars() {
    const density = levels[levelIndex]?.starDensity || 70;
    const n = Math.round((W * H / 360000) * density);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: rand(.35, 1.35),
      a: rand(.25, .9),
      tw: rand(.7, 2.1),
      p: rand(0, Math.PI * 2)
    }));
  }

  function safeTop() { return W < 600 ? 92 : 100; }
  function safeBottom() { return W < 600 ? 98 : 110; }

  function level() { return levels[levelIndex]; }

  function updateMissionCard() {
    ui.level.textContent = String(levelIndex + 1);
    ui.sat.textContent = `${satelliteIndex + 1}/${level().count}`;
    ui.score.textContent = String(score);
    ui.missionTitle.textContent = level().name;
    ui.missionText.textContent = level().text;
    ui.start.textContent = levelIndex === 0 && satelliteIndex === 0 ? 'Inizia' : 'Vai';
  }

  function makePlanet(x, y, mass, radius, draggable = true, hue = 230) {
    return { x, y, mass, radius, draggable, hue, pulse: rand(0, Math.PI * 2) };
  }

  function spawn() {
    resultLocked = false;
    const L = level();
    const portrait = H > W;
    const playTop = safeTop();
    const playBottom = H - safeBottom();
    const midY = (playTop + playBottom) / 2;

    target = {
      x: W - Math.max(52, W * .08),
      y: clamp(midY + rand(-H * .16, H * .16), playTop + 50, playBottom - 50),
      r: L.dock,
      phase: 0
    };

    const spawnY = clamp(midY + rand(-H * .13, H * .13), playTop + 48, playBottom - 48);
    const angle = rand(-0.045, 0.045);
    satellite = {
      x: Math.max(34, W * .055),
      y: spawnY,
      vx: L.speed * Math.cos(angle),
      vy: L.speed * Math.sin(angle),
      r: W < 600 ? 7 : 8,
      trail: [],
      rotation: 0
    };

    const px = W * (portrait ? .48 : .5);
    const py = clamp(midY + rand(-H * .08, H * .08), playTop + L.radius + 12, playBottom - L.radius - 12);
    planets = [makePlanet(px, py, L.mass, L.radius, true, 228 + levelIndex * 8)];

    if (L.secondPlanet) {
      planets.push(makePlanet(W * .70, clamp(midY - H * .18, playTop + 38, playBottom - 38), 1250 + levelIndex * 160, 27, false, 310));
    }

    running = false;
    paused = false;
    pointer.planet = null;
    previewPath = [];
    ui.speed.textContent = `${L.speed.toFixed(1)}`;
    ui.speedFill.style.width = `${Math.min(100, L.speed / 3)}%`;
    updateMissionCard();
    ui.hint.classList.remove('visible');
    hintTimer = 0;
  }

  function clampPlanets() {
    const top = safeTop() + 12;
    const bottom = H - safeBottom() - 12;
    for (const p of planets) {
      p.x = clamp(p.x, p.radius + 12, W - p.radius - 12);
      p.y = clamp(p.y, top + p.radius, bottom - p.radius);
    }
  }

  function gravityAt(x, y, ps = planets) {
    let ax = 0, ay = 0;
    for (const p of ps) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d2 = dx * dx + dy * dy + SOFTEN * SOFTEN;
      const invD = 1 / Math.sqrt(d2);
      const a = G * p.mass / d2;
      ax += a * dx * invD;
      ay += a * dy * invD;
    }
    return { ax, ay };
  }

  function step(dt) {
    if (!satellite || resultLocked) return;
    const g = gravityAt(satellite.x, satellite.y);
    satellite.vx += g.ax * dt;
    satellite.vy += g.ay * dt;
    satellite.x += satellite.vx * dt;
    satellite.y += satellite.vy * dt;
    satellite.rotation = Math.atan2(satellite.vy, satellite.vx);

    if (satellite.trail.length === 0 || distanceSq(satellite.trail[satellite.trail.length - 1], satellite) > 25) {
      satellite.trail.push({ x: satellite.x, y: satellite.y });
      if (satellite.trail.length > TRAIL_MAX) satellite.trail.shift();
    }

    for (const p of planets) {
      const minD = p.radius + satellite.r + 2;
      if ((satellite.x - p.x) ** 2 + (satellite.y - p.y) ** 2 < minD ** 2) {
        finish(false, 'Impatto!', 'Il satellite ha toccato una massa. Prova una traiettoria più larga.');
        return;
      }
    }

    const dx = satellite.x - target.x;
    const dy = satellite.y - target.y;
    const speed = Math.hypot(satellite.vx, satellite.vy);
    const d = Math.hypot(dx, dy);
    const toward = (satellite.vx * (target.x - satellite.x) + satellite.vy * (target.y - satellite.y)) > 0;
    if (d < target.r - 2 && speed <= level().maxDockSpeed && toward) {
      const precision = Math.max(0, 1 - d / target.r);
      const speedBonus = Math.max(0, 1 - speed / level().maxDockSpeed);
      const earned = Math.round(450 + precision * 350 + speedBonus * 200);
      score += earned;
      finish(true, `+${earned} punti`, 'Aggancio pulito: portale centrato e velocità sotto controllo.');
      return;
    }

    const margin = 90;
    if (satellite.x < -margin || satellite.x > W + margin || satellite.y < -margin || satellite.y > H + margin) {
      finish(false, 'Satellite perso', 'È uscito dal settore orbitale. Sposta il pianeta prima e curva di più.');
      return;
    }

    ui.speed.textContent = speed.toFixed(1);
    ui.speedFill.style.width = `${Math.min(100, speed / 3)}%`;
  }

  function distanceSq(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }

  function computePreview() {
    if (!satellite || resultLocked) return;
    let s = { x: satellite.x, y: satellite.y, vx: satellite.vx, vy: satellite.vy };
    const path = [];
    const dt = 1 / 38;
    for (let i = 0; i < 150; i++) {
      const g = gravityAt(s.x, s.y);
      s.vx += g.ax * dt;
      s.vy += g.ay * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (i % 3 === 0) path.push({ x: s.x, y: s.y });
      let hit = false;
      for (const p of planets) {
        if ((s.x - p.x) ** 2 + (s.y - p.y) ** 2 < (p.radius + 4) ** 2) { hit = true; break; }
      }
      if (hit || s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20) break;
    }
    previewPath = path;
  }

  function finish(success, title, text) {
    resultLocked = true;
    running = false;
    ui.resultOverlay.classList.remove('hidden');
    ui.resultIcon.textContent = success ? '✓' : '×';
    ui.resultIcon.style.color = success ? 'var(--success)' : 'var(--danger)';
    ui.resultIcon.style.background = success ? 'rgba(128, 241, 192, .12)' : 'rgba(255, 122, 145, .12)';
    ui.resultKicker.textContent = success ? 'AGGANCIO RIUSCITO' : 'MISSIONE FALLITA';
    ui.resultTitle.textContent = title;
    ui.resultText.textContent = text;
    ui.next.textContent = success ? (satelliteIndex + 1 >= level().count ? (levelIndex + 1 >= levels.length ? 'Ricomincia il viaggio' : 'Livello successivo') : 'Prossimo satellite') : 'Riprova';
    ui.next.dataset.success = success ? '1' : '0';
  }

  function startRun() {
    started = true;
    running = true;
    paused = false;
    ui.missionCard.classList.add('hidden');
    ui.pauseOverlay.classList.add('hidden');
    ui.resultOverlay.classList.add('hidden');
    ui.hint.classList.add('visible');
    hintTimer = 2.5;
    computePreview();
  }

  function restartCurrent() {
    spawn();
    ui.missionCard.classList.add('hidden');
    started = true;
    running = true;
    computePreview();
  }

  function nextMission() {
    const success = ui.next.dataset.success === '1';
    ui.resultOverlay.classList.add('hidden');
    if (!success) {
      restartCurrent();
      return;
    }
    satelliteIndex++;
    if (satelliteIndex >= level().count) {
      satelliteIndex = 0;
      levelIndex++;
      if (levelIndex >= levels.length) {
        levelIndex = 0;
        score = 0;
      }
      buildStars();
      spawn();
      ui.missionCard.classList.remove('hidden');
    } else {
      spawn();
      ui.missionCard.classList.add('hidden');
      running = true;
      started = true;
      computePreview();
    }
  }

  function pauseGame() {
    if (!started || resultLocked) return;
    paused = true;
    running = false;
    ui.pauseOverlay.classList.remove('hidden');
  }

  function resumeGame() {
    paused = false;
    running = true;
    ui.pauseOverlay.classList.add('hidden');
  }

  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!started || paused || resultLocked) return;
    const pos = pointerPos(e);
    pointer.down = true;
    pointer.x = pos.x;
    pointer.y = pos.y;
    let best = null, bestD = Infinity;
    for (const p of planets) {
      if (!p.draggable) continue;
      const d = Math.hypot(pos.x - p.x, pos.y - p.y);
      if (d < p.radius + 28 && d < bestD) { best = p; bestD = d; }
    }
    pointer.planet = best;
    if (best) {
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      ui.hint.classList.remove('visible');
    }
  }, { passive: true });

  canvas.addEventListener('pointermove', (e) => {
    if (!pointer.down || !pointer.planet || paused || resultLocked) return;
    const pos = pointerPos(e);
    const p = pointer.planet;
    p.x = pos.x;
    p.y = pos.y;
    clampPlanets();
    computePreview();
  }, { passive: true });

  function endPointer(e) {
    pointer.down = false;
    pointer.planet = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  canvas.addEventListener('pointerup', endPointer, { passive: true });
  canvas.addEventListener('pointercancel', endPointer, { passive: true });

  ui.start.addEventListener('click', startRun);
  ui.pause.addEventListener('click', pauseGame);
  ui.resume.addEventListener('click', resumeGame);
  ui.restart.addEventListener('click', restartCurrent);
  ui.next.addEventListener('click', nextMission);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) pauseGame();
  });
  window.addEventListener('resize', resize, { passive: true });

  function drawBackground(t) {
    ctx.fillStyle = '#050816';
    ctx.fillRect(0, 0, W, H);

    const grad = ctx.createRadialGradient(W * .5, H * .5, 20, W * .5, H * .5, Math.max(W, H) * .72);
    grad.addColorStop(0, 'rgba(55, 73, 148, .12)');
    grad.addColorStop(1, 'rgba(5, 8, 22, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      const a = s.a * (.68 + .32 * Math.sin(t * .001 * s.tw + s.p));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#e9eeff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawTarget(t) {
    if (!target) return;
    target.phase += .018;
    const pulse = 1 + Math.sin(t * .004) * .05;
    const r = target.r * pulse;

    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.rotate(target.phase);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(128, 241, 192, .82)';
    ctx.setLineDash([9, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const rg = ctx.createRadialGradient(0, 0, 3, 0, 0, r);
    rg.addColorStop(0, 'rgba(128,241,192,.12)');
    rg.addColorStop(1, 'rgba(128,241,192,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(205,255,237,.88)';
    ctx.font = '700 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('DOCK', target.x, target.y + 4);
  }

  function drawGravityWell(p, t) {
    const ringCount = 4;
    ctx.save();
    for (let i = 1; i <= ringCount; i++) {
      const rr = p.radius + i * (18 + p.mass / 480);
      ctx.globalAlpha = .08 + (ringCount - i) * .018;
      ctx.strokeStyle = '#9db2ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rr + Math.sin(t * .0015 + i + p.pulse) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawPlanet(p, t) {
    drawGravityWell(p, t);
    const glow = ctx.createRadialGradient(p.x - p.radius * .28, p.y - p.radius * .3, p.radius * .12, p.x, p.y, p.radius * 1.2);
    glow.addColorStop(0, p.draggable ? 'rgba(238,243,255,.95)' : 'rgba(255,219,251,.88)');
    glow.addColorStop(.28, p.draggable ? 'rgba(131,159,255,.96)' : 'rgba(216,140,255,.9)');
    glow.addColorStop(1, p.draggable ? 'rgba(60,74,150,.94)' : 'rgba(101,54,130,.94)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = p.draggable ? 'rgba(214,224,255,.6)' : 'rgba(255,220,249,.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.radius * 1.35, p.radius * .28, -.28, 0, Math.PI * 2);
    ctx.stroke();

    if (p.draggable && pointer.planet === p) {
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 12, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawTrail() {
    if (!satellite || satellite.trail.length < 2) return;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 1; i < satellite.trail.length; i++) {
      const a = satellite.trail[i - 1], b = satellite.trail[i];
      ctx.strokeStyle = `rgba(151,178,255,${(i / satellite.trail.length) * .48})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawPreview() {
    if (!previewPath.length || resultLocked) return;
    ctx.save();
    ctx.fillStyle = 'rgba(204,214,255,.34)';
    for (let i = 0; i < previewPath.length; i += 2) {
      const p = previewPath[i];
      ctx.globalAlpha = .18 + .4 * (1 - i / previewPath.length);
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawSatellite() {
    if (!satellite) return;
    const s = satellite;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);

    ctx.shadowColor = 'rgba(148,174,255,.8)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#edf1ff';
    ctx.fillRect(-6, -4, 12, 8);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#91a8ff';
    ctx.fillRect(-14, -3, 7, 6);
    ctx.fillRect(7, -3, 7, 6);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(4, 0, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawArrowHint(t) {
    if (!started || resultLocked || !satellite || pointer.planet) return;
    if (hintTimer <= 0) return;
    const p = planets.find(p => p.draggable);
    if (!p) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, hintTimer) * .65;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const y = p.y - p.radius - 25 + Math.sin(t * .006) * 4;
    ctx.beginPath(); ctx.moveTo(p.x, y - 10); ctx.lineTo(p.x, y + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x - 5, y + 3); ctx.lineTo(p.x, y + 9); ctx.lineTo(p.x + 5, y + 3); ctx.stroke();
    ctx.restore();
  }

  function render(t) {
    drawBackground(t);
    drawTarget(t);
    drawPreview();
    drawTrail();
    for (const p of planets) drawPlanet(p, t);
    drawSatellite();
    drawArrowHint(t);
  }

  function loop(t) {
    const frame = Math.min(.035, (t - lastT) / 1000);
    lastT = t;
    if (running && !paused) {
      acc += frame;
      while (acc >= FIXED_DT) {
        step(FIXED_DT);
        acc -= FIXED_DT;
      }
      if (hintTimer > 0) {
        hintTimer -= frame;
        if (hintTimer <= 0) ui.hint.classList.remove('visible');
      }
    }
    render(t);
    requestAnimationFrame(loop);
  }

  resize();
  spawn();
  requestAnimationFrame(loop);
})();
