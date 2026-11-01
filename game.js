/**
 * Prabhas Waterfall Flight - Web Game
 * Inspired by TFI Flap Baahubali edition
 */

(function () {
  'use strict';

  // --- Configuration & Constants ---
  const CONFIG = {
    width: 480,
    height: 680,
    floorY: 630,
    ceilingY: 15,
    heroX: 132,
    radius: 20,
    gravity: 900,
    lift: -327,
    baseSpeed: 154,
    baseGap: 214,
    baseInterval: 1.65,
    pillarWidth: 68,
    pillarHeight: 390,
  };

  // --- Game States ---
  const STATE = {
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
  };

  // --- DOM Elements ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const stageWrapper = document.getElementById('stageWrapper');

  const hudScore = document.getElementById('hudScore');

  const startOverlay = document.getElementById('startOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');

  const startHeroPreview = document.getElementById('startHeroPreview');
  const gameOverReaction = document.getElementById('gameOverReaction');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverSubtitle = document.getElementById('gameOverSubtitle');
  const finalScoreEl = document.getElementById('finalScore');
  const bestScoreEl = document.getElementById('bestScore');

  const btnStartGame = document.getElementById('btnStartGame');
  const btnResumeGame = document.getElementById('btnResumeGame');
  const btnRestartGame = document.getElementById('btnRestartGame');

  const btnAudioToggle = document.getElementById('btnAudioToggle');
  const audioIcon = document.getElementById('audioIcon');
  const audioText = document.getElementById('audioText');
  const btnPauseGame = document.getElementById('btnPauseGame');

  // --- Asset Management ---
  // Character photos configured directly in code:
  const HERO_PHOTO_SRC = 'assets/teja/teja_hero.png';
  const HEAD_PHOTO_SRC = 'assets/teja/teja_head.png';
  const AVATAR_PHOTO_SRC = 'assets/teja/teja_avatar.png';

  const assets = {
    hero: new Image(),
    head: new Image(),
    avatar: new Image(),
    topObstacle: new Image(),
    botObstacle: new Image(),
    world: new Image(),
    reaction: new Image(),
    music: new Audio('assets/audio/gameplay.mpeg'),
    gameOverMusic: new Audio('assets/audio/gameover.mp3'),
  };

  assets.hero.src = HERO_PHOTO_SRC;
  assets.head.src = HEAD_PHOTO_SRC;
  assets.avatar.src = AVATAR_PHOTO_SRC;
  assets.topObstacle.src = 'assets/hostel/clothes_top.png';
  assets.botObstacle.src = 'assets/hostel/dog_peda_bottom.png';
  assets.world.src = 'assets/hostel/hostel_bg.png';
  assets.reaction.src = AVATAR_PHOTO_SRC;

  assets.music.loop = true;
  assets.music.volume = 0.55;
  assets.gameOverMusic.loop = false;
  assets.gameOverMusic.volume = 0.8;

  let isCustomPhoto = false;
  let customPhotoSrc = null;

  // --- Sound & Audio Context (Synthesizer fallback + music) ---
  let audioContext = null;
  let isMuted = localStorage.getItem('prabhas_flap_muted') === 'true';

  function initAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
  }

  function playTone(type) {
    if (isMuted) return;
    initAudio();
    if (!audioContext || audioContext.state !== 'running') return;

    try {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      if (type === 'flap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.065);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'score') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(1020, now + 0.08);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      }
    } catch (e) {
      // Audio fallback silent ignore
    }
  }

  function playMusic() {
    if (isMuted) return;
    assets.gameOverMusic.pause();
    assets.gameOverMusic.currentTime = 0;
    assets.music.volume = 0.55;
    assets.music.play().catch(() => {});
  }

  function pauseMusic() {
    assets.music.pause();
  }

  function stopGameOverMusic() {
    assets.gameOverMusic.pause();
    assets.gameOverMusic.currentTime = 0;
  }

  function updateAudioUI() {
    if (isMuted) {
      audioIcon.textContent = '🔇';
      audioText.textContent = 'Muted';
      btnAudioToggle.style.opacity = '0.7';
      pauseMusic();
      assets.gameOverMusic.pause();
    } else {
      audioIcon.textContent = '🔊';
      audioText.textContent = 'Sound';
      btnAudioToggle.style.opacity = '1';
      if (gameState === STATE.PLAYING) {
        playMusic();
      } else if (gameState === STATE.GAMEOVER) {
        assets.gameOverMusic.play().catch(() => {});
      }
    }
    localStorage.setItem('prabhas_flap_muted', String(isMuted));
  }

  btnAudioToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    initAudio();
    isMuted = !isMuted;
    updateAudioUI();
  });

  // --- Game State Variables ---
  let gameState = STATE.READY;
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('prabhas_flap_best') || '0', 10);
  let obstacleDelaySeconds = 5; // Default 5s
  let elapsedTime = 0;
  let gameOverTimestamp = 0;

  // Screen shake effect on collision
  let screenShakeTimer = 0;

  // Character physics
  let heroY = 300;
  let heroVelocity = 0;
  let heroAngle = 0;
  let heroSquish = 1; // Flap squash animation

  // Obstacle management
  let obstacles = [];
  let nextObstacleTimer = 0;
  let currentOpening = 310;
  let obstacleSerial = 0;

  // Ambient mist particles
  const particles = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 127) % CONFIG.width,
    y: (i * 89) % (CONFIG.floorY - 20),
    speed: 12 + (i % 5) * 8,
    radius: 3 + (i % 4) * 2.5,
    phase: i * 1.8,
    alpha: 0.15 + (i % 4) * 0.08,
  }));

  // --- Head Burst Animation on Crash ---
  let burstActive = false;
  let burstPieces = [];
  let burstSparks = [];
  let burstShockwave = null;
  let comicFasakPop = null;

  function createHeadBurst(cx, cy, bannerText = '💥 FASAK! 💥', isPeda = false) {
    burstActive = true;
    burstPieces = [];
    burstSparks = [];

    // Create 12 head shard pieces that shatter and fly apart
    const rows = 3;
    const cols = 4;
    const imgW = (assets.head.complete && assets.head.naturalWidth) ? assets.head.naturalWidth : 92;
    const imgH = (assets.head.complete && assets.head.naturalHeight) ? assets.head.naturalHeight : 77;
    const cellW = imgW / cols;
    const cellH = imgH / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const angle = Math.atan2(r - rows / 2, c - cols / 2) + (Math.random() - 0.5) * 0.7;
        const speed = 180 + Math.random() * 320;
        burstPieces.push({
          x: cx + (c - cols / 2) * 8,
          y: cy + (r - rows / 2) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 220, // Explosive lift
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 24,
          sx: c * cellW,
          sy: r * cellH,
          sw: cellW,
          sh: cellH,
          scale: 0.9 + Math.random() * 0.35,
          alpha: 1.0,
        });
      }
    }

    // 40 Comic stars & fiery explosion sparks (or brown poop splash if isPeda!)
    const sparkColors = isPeda
      ? ['#8b4513', '#a0522d', '#70a530', '#d2b48c', '#ffe600']
      : ['#ffdd00', '#ff5500', '#ff0055', '#a8dfe3', '#ffffff'];

    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 100 + Math.random() * 360;
      burstSparks.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 140,
        size: 4 + Math.random() * 8,
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        alpha: 1.0,
        isStar: Math.random() > 0.4,
      });
    }

    // Shockwave ring
    burstShockwave = {
      x: cx,
      y: cy,
      radius: 12,
      maxRadius: 155,
      alpha: 1.0,
      ringColor: isPeda ? '200, 120, 50' : '255, 220, 100',
    };

    // Comic popup text
    comicFasakPop = {
      x: cx,
      y: cy - 45,
      scale: 0.2,
      targetScale: 1.35,
      alpha: 1.0,
      text: bannerText,
      fillColor: isPeda ? '#ffcc00' : '#ffe600',
    };
  }

  function updateBurst(dt) {
    if (!burstActive) return;

    // Update pieces with gravity
    for (let i = 0; i < burstPieces.length; i++) {
      const p = burstPieces[i];
      p.x += p.vx * dt;
      p.vy += 850 * dt; // Gravity pulls shards down
      p.y += p.vy * dt;
      p.rot += p.rotSpeed * dt;
      p.alpha = Math.max(0, p.alpha - dt * 0.7);
    }

    // Update sparks
    for (let i = 0; i < burstSparks.length; i++) {
      const s = burstSparks[i];
      s.x += s.vx * dt;
      s.vy += 500 * dt;
      s.y += s.vy * dt;
      s.size = Math.max(0, s.size - dt * 5);
      s.alpha = Math.max(0, s.alpha - dt * 1.1);
    }

    // Shockwave
    if (burstShockwave) {
      burstShockwave.radius += 280 * dt;
      burstShockwave.alpha = Math.max(0, 1.0 - burstShockwave.radius / burstShockwave.maxRadius);
      if (burstShockwave.alpha <= 0) burstShockwave = null;
    }

    // Comic text bounce
    if (comicFasakPop) {
      comicFasakPop.scale += (comicFasakPop.targetScale - comicFasakPop.scale) * 0.3;
      comicFasakPop.y -= 25 * dt;
      comicFasakPop.alpha = Math.max(0, comicFasakPop.alpha - dt * 0.65);
    }
  }

  function drawBurst() {
    if (!burstActive) return;

    // Draw shockwave
    if (burstShockwave && burstShockwave.alpha > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(burstShockwave.x, burstShockwave.y, burstShockwave.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 220, 100, ${burstShockwave.alpha})`;
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(burstShockwave.x, burstShockwave.y, burstShockwave.radius * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 70, 70, ${burstShockwave.alpha * 0.7})`;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }

    // Draw sparks & comic stars
    for (let i = 0; i < burstSparks.length; i++) {
      const s = burstSparks[i];
      if (s.alpha <= 0 || s.size <= 0) continue;
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      if (s.isStar) {
        drawStar(ctx, s.x, s.y, 4, s.size, s.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw head shard pieces
    if (assets.head.complete && assets.head.naturalWidth > 0) {
      for (let i = 0; i < burstPieces.length; i++) {
        const p = burstPieces[i];
        if (p.alpha <= 0) continue;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(p.scale, p.scale);
        ctx.drawImage(assets.head, p.sx, p.sy, p.sw, p.sh, -p.sw / 2, -p.sh / 2, p.sw, p.sh);
        ctx.restore();
      }
    }

    // Draw Comic FASAK pop text
    if (comicFasakPop && comicFasakPop.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = comicFasakPop.alpha;
      ctx.translate(comicFasakPop.x, comicFasakPop.y);
      ctx.scale(comicFasakPop.scale, comicFasakPop.scale);

      ctx.font = '900 36px "Impact", "Barlow", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Thick comic outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeText(comicFasakPop.text, 0, 0);

      // Yellow comic fill
      ctx.fillStyle = '#ffe600';
      ctx.fillText(comicFasakPop.text, 0, 0);

      ctx.restore();
    }
  }

  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  // --- Game Lifecycle Functions ---
  function resetGame() {
    heroY = 300;
    heroVelocity = CONFIG.lift;
    heroAngle = -12;
    heroSquish = 1;
    score = 0;
    elapsedTime = 0;
    obstacles = [];
    nextObstacleTimer = 1.2; // Obstacles arrive immediately and smoothly
    currentOpening = 310;
    obstacleSerial = 0;
    screenShakeTimer = 0;

    burstActive = false;
    burstPieces = [];
    burstSparks = [];
    burstShockwave = null;
    comicFasakPop = null;

    hudScore.textContent = '0';
  }

  function startGame() {
    initAudio();
    stopGameOverMusic();
    resetGame();
    gameState = STATE.PLAYING;

    startOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');

    btnPauseGame.style.display = 'flex';
    playMusic();
    playTone('flap');
  }

  function pauseGame() {
    if (gameState !== STATE.PLAYING) return;
    gameState = STATE.PAUSED;
    pauseOverlay.classList.remove('hidden');
    pauseMusic();
  }

  function resumeGame() {
    if (gameState !== STATE.PAUSED) return;
    gameState = STATE.PLAYING;
    pauseOverlay.classList.add('hidden');
    playMusic();
  }

  function triggerGameOver(cause = 'general') {
    if (gameState === STATE.GAMEOVER) return;
    gameState = STATE.GAMEOVER;
    gameOverTimestamp = performance.now();
    screenShakeTimer = 0.38;

    pauseMusic();
    assets.music.currentTime = 0;
    stopGameOverMusic();
    if (!isMuted) {
      assets.gameOverMusic.play().catch(() => {});
    }
    let roast = {
      title: "Ayyo Gundu Pagilindhi! 💥",
      sub: "FASAK! 💀",
      banner: "💥 FASAK! 💥",
      isPeda: false
    };

    if (cause === 'peda') {
      const pedaRoasts = [
        { title: "Kukkapedha Meedha Padadu! 💩", sub: "CHI! Gundu Meedha Peda... FASAK! 💀", banner: "💩 PEDA SPLASH! 💩", isPeda: true },
        { title: "Dog Peda Touch Ayyindi! 💩", sub: "Chee chee! Kaalu jaarindhi ra Teja! 💀", banner: "💩 PEDA BLAST! 💩", isPeda: true },
        { title: "Hostel Dustbin Lo Paddaadu! 🗑️", sub: "Chethalo Munigi FASAK Aipoyadu! 💀", banner: "🗑️ DUSTBIN FASAK! 💥", isPeda: true }
      ];
      roast = pedaRoasts[Math.floor(Math.random() * pedaRoasts.length)];
    } else if (cause === 'clothes') {
      const clothRoasts = [
        { title: "Roommate Boxer Thagilindhi! 🩳", sub: "Aaresina Battalu Meedha Paddi Gundu Pagilindhi! 💥", banner: "🩳 BOXER FASAK! 💥", isPeda: false },
        { title: "Jeans Pant Lakkuni Paddaadu! 👖", sub: "Battala Daadi Lo Teja Gundu FASAK! 💀", banner: "👖 BATTALU FASAK! 💥", isPeda: false },
        { title: "Arati Gela Thagilindhi! 🍌", sub: "Aratipandu Thinnadu... Gundu Pagilindhi! 🍌💥", banner: "🍌 ARATIPANDU FASAK! 💥", isPeda: false }
      ];
      roast = clothRoasts[Math.floor(Math.random() * clothRoasts.length)];
    } else {
      const floorRoasts = [
        { title: "Ayyo Gundu Pagilindhi! 💥", sub: "FASAK! 💀", banner: "💥 FASAK! 💥", isPeda: false },
        { title: "Ayyo Gundu Pagilindhi! 💥", sub: "FASAK! 💀", banner: "💥 FASAK! 💥", isPeda: false },
        { title: "Ayyo Gundu Pagilindhi! 💥", sub: "FASAK! 💀", banner: "💥 FASAK! 💥", isPeda: false }
      ];
      roast = floorRoasts[Math.floor(Math.random() * floorRoasts.length)];
    }

    // Trigger Head Burst Animation with custom comic banner!
    createHeadBurst(CONFIG.heroX, heroY, roast.banner, roast.isPeda);

    const isNewBest = score > bestScore;
    if (isNewBest) {
      bestScore = score;
      localStorage.setItem('teja_flap_best', String(bestScore));
    }

    finalScoreEl.textContent = String(score);
    bestScoreEl.textContent = String(bestScore);

    // Keep the game-over card consistent for every loss, as in the reference.
    gameOverTitle.textContent = 'Ayyo Gundu Pagilindhi! 💥';
    gameOverSubtitle.textContent = 'FASAK! 💀';

    gameOverReaction.src = 'assets/teja/teja_avatar.png';

    // Show overlay after burst animation
    setTimeout(() => {
      gameOverOverlay.classList.remove('hidden');
    }, 700);
  }

  function flap() {
    if (gameState === STATE.READY) {
      startGame();
      return;
    }

    if (gameState === STATE.GAMEOVER) {
      // Prevent accidental instant restart within 300ms of game over
      if (performance.now() - gameOverTimestamp > 320) {
        startGame();
      }
      return;
    }

    if (gameState !== STATE.PLAYING) return;

    heroVelocity = CONFIG.lift;
    heroSquish = 1.08; // Squash visual pop
    playTone('flap');
  }

  // --- Obstacle Math & Generation ---
  function getDifficultySettings(currentScore) {
    const d = Math.min(1, currentScore / 35);
    return {
      speed: CONFIG.baseSpeed + d * 55,
      gap: CONFIG.baseGap - d * 28,
      interval: CONFIG.baseInterval - d * 0.15,
    };
  }

  function getNextOpening(prevOpening) {
    const target = 190 + Math.random() * 250;
    const maxDelta = 115;
    const clampedDelta = Math.max(-maxDelta, Math.min(maxDelta, target - prevOpening));
    return Math.max(190, Math.min(440, prevOpening + clampedDelta));
  }

  function spawnObstaclePair(settings) {
    currentOpening = getNextOpening(currentOpening);
    const topEnd = currentOpening - settings.gap / 2;
    const bottomStart = currentOpening + settings.gap / 2;

    obstacles.push({
      id: ++obstacleSerial,
      x: CONFIG.width + 50,
      topEnd: topEnd,
      bottomStart: bottomStart,
      width: CONFIG.pillarWidth,
      passed: false,
    });
  }

  // --- Precise Collision Checking ---
  function checkCircleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < radius * radius;
  }

  // --- Input Listeners ---
  function handleAction(e) {
    // If interacting with overlays, buttons or inputs, do not flap
    if (e.target && e.target.closest('button, a, input, label, .overlay-card')) {
      return;
    }
    e.preventDefault();
    flap();
  }

  canvas.addEventListener('pointerdown', handleAction);
  stageWrapper.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, a, input, label, .overlay-card')) return;
    e.preventDefault();
    flap();
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;

    if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!e.repeat) flap();
    } else if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (gameState === STATE.PLAYING) pauseGame();
      else if (gameState === STATE.PAUSED) resumeGame();
    }
  });

  btnStartGame.addEventListener('click', startGame);
  btnResumeGame.addEventListener('click', resumeGame);
  btnRestartGame.addEventListener('click', startGame);
  btnPauseGame.addEventListener('click', (e) => {
    e.stopPropagation();
    if (gameState === STATE.PLAYING) pauseGame();
    else if (gameState === STATE.PAUSED) resumeGame();
  });

  // --- Physics Update Loop (Fixed Substep for 120Hz smooth physics) ---
  let lastTimestamp = performance.now();
  let accumulator = 0;
  const FIXED_STEP = 1 / 120;

  function updatePhysics(dt) {
    if (gameState !== STATE.PLAYING) return;

    elapsedTime += dt;
    const settings = getDifficultySettings(score);

    // Gravity & Velocity
    heroVelocity += CONFIG.gravity * dt;
    heroY += heroVelocity * dt;

    // Angle rotation smoothing
    const targetAngle = Math.max(-24, Math.min(65, heroVelocity * 0.085));
    heroAngle += (targetAngle - heroAngle) * 0.18;

    // Squish decay back to 1.0
    heroSquish += (1.0 - heroSquish) * 0.15;

    // Screen Boundary Collisions (Ceiling and Floor)
    if (heroY - CONFIG.radius <= CONFIG.ceilingY) {
      heroY = CONFIG.ceilingY + CONFIG.radius;
      heroVelocity = 0;
    }
    if (heroY + CONFIG.radius >= CONFIG.floorY) {
      heroY = CONFIG.floorY - CONFIG.radius;
      triggerGameOver('floor');
      return;
    }

    // Obstacle Spawning (Instantly active)
    nextObstacleTimer -= dt;
    if (nextObstacleTimer <= 0) {
      spawnObstaclePair(settings);
      nextObstacleTimer = settings.interval;
    }

    // Move obstacles & Collision Checks
    for (let i = 0; i < obstacles.length; i++) {
      const p = obstacles[i];
      p.x -= settings.speed * dt;

      const pLeft = p.x - p.width / 2;

      // Check collision with top pillar (CLOTHES — shirt, jeans, boxer, bananas)
      const hitTop = checkCircleRectCollision(
        CONFIG.heroX,
        heroY,
        CONFIG.radius,
        pLeft,
        0,
        p.width,
        p.topEnd
      );

      // Check collision with bottom pillar (DOG PEDA + Dustbin)
      const hitBottom = checkCircleRectCollision(
        CONFIG.heroX,
        heroY,
        CONFIG.radius,
        pLeft,
        p.bottomStart,
        p.width,
        CONFIG.floorY - p.bottomStart
      );

      if (hitTop) {
        triggerGameOver('clothes');
        return;
      }
      if (hitBottom) {
        triggerGameOver('peda');
        return;
      }

      // Check passing obstacle to score
      if (!p.passed && p.x + p.width / 2 < CONFIG.heroX - CONFIG.radius) {
        p.passed = true;
        score++;
        hudScore.textContent = String(score);
        playTone('score');
      }
    }

    // Clean off-screen obstacles
    obstacles = obstacles.filter((p) => p.x > -p.width);

    // Screen Shake decay
    if (screenShakeTimer > 0) {
      screenShakeTimer -= dt;
    }
  }

  // --- Rendering ---
  function render() {
    ctx.save();

    // Screen shake transform
    if (screenShakeTimer > 0) {
      const shakeMag = screenShakeTimer * 18;
      const ox = (Math.random() - 0.5) * shakeMag;
      const oy = (Math.random() - 0.5) * shakeMag;
      ctx.translate(ox, oy);
    }

    // 1. Background Sky & World Art
    if (assets.world.complete && assets.world.naturalWidth > 0) {
      const sway = Math.sin(elapsedTime * 0.4) * 8;
      ctx.drawImage(assets.world, -15 + sway, 0, CONFIG.width + 30, CONFIG.height);
    } else {
      // Fallback gradient sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
      skyGrad.addColorStop(0, '#102530');
      skyGrad.addColorStop(0.7, '#1d3c4a');
      skyGrad.addColorStop(1, '#253d40');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    }

    // 2. Ambient Mist Specks (Background layer)
    ctx.fillStyle = '#e1f8ff';
    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      if (gameState === STATE.PLAYING) {
        pt.x -= pt.speed * (1 / 60);
        pt.y += Math.sin(elapsedTime * 1.5 + pt.phase) * 0.2;
        if (pt.x < -20) {
          pt.x = CONFIG.width + 20;
          pt.y = (pt.y + 110) % (CONFIG.floorY - 40);
        }
      }
      ctx.globalAlpha = pt.alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 3. Obstacles (Hostel Theme: hanging clothes and dog peda)
    for (let i = 0; i < obstacles.length; i++) {
      const p = obstacles[i];
      const pLeft = p.x - p.width / 2;

      // Top obstacle: flip the clothes so they hang from the ceiling.
      if (assets.topObstacle.complete && assets.topObstacle.naturalWidth > 0) {
        ctx.save();
        ctx.translate(p.x, p.topEnd);
        ctx.scale(1, -1);
        ctx.drawImage(assets.topObstacle, -p.width / 2, 0, p.width, CONFIG.pillarHeight);
        ctx.restore();
        ctx.fillStyle = 'rgba(180, 140, 80, 0.8)';
        ctx.fillRect(pLeft - 2, p.topEnd - 3, p.width + 4, 3);
      } else {
        drawStonePillar(pLeft, 0, p.width, p.topEnd, true);
      }

      // Bottom obstacle: dog peda and dustbin sit on the floor.
      if (assets.botObstacle.complete && assets.botObstacle.naturalWidth > 0) {
        ctx.drawImage(assets.botObstacle, pLeft, p.bottomStart, p.width, CONFIG.pillarHeight);
        ctx.fillStyle = 'rgba(100, 80, 40, 0.6)';
        ctx.fillRect(pLeft, p.bottomStart, p.width, 3);
      } else {
        drawStonePillar(pLeft, p.bottomStart, p.width, CONFIG.floorY - p.bottomStart, false);
      }
    }

    // 4. Hostel corridor floor (dirty concrete)
    ctx.fillStyle = '#3a3020';
    ctx.fillRect(0, CONFIG.floorY, CONFIG.width, CONFIG.height - CONFIG.floorY);
    ctx.fillStyle = '#c8a020';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, CONFIG.floorY, CONFIG.width, 4);
    ctx.globalAlpha = 1.0;

    // 5. Character Photo / Hero
    drawHero();

    ctx.restore();
  }

  // --- Draw Hero (Photo character with tilt, glow & squish) ---
  function drawHero() {
    if (burstActive) {
      drawBurst();
      return;
    }

    ctx.save();

    let currentHeroY = heroY;
    // Gentle idle bob in ready state
    if (gameState === STATE.READY) {
      currentHeroY = 300 + Math.sin(performance.now() * 0.004) * 8;
    }

    ctx.translate(CONFIG.heroX, currentHeroY);
    ctx.rotate((heroAngle * Math.PI) / 180);
    ctx.scale(1 / heroSquish, heroSquish); // Squish deformation on flap

    if (assets.hero.complete && assets.hero.naturalWidth > 0) {
      const sw = assets.hero.naturalWidth;
      const sh = assets.hero.naturalHeight;
      const maxDim = Math.max(sw, sh);
      const targetSize = 92;
      const scale = targetSize / maxDim;
      const dw = sw * scale;
      const dh = sh * scale;

      // Draw subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      // Draw photo
      ctx.drawImage(assets.hero, -dw / 2, -dh / 2, dw, dh);
    } else {
      // Fallback stylized character photo badge
      ctx.beginPath();
      ctx.arc(0, 0, CONFIG.radius + 6, 0, Math.PI * 2);
      ctx.fillStyle = '#172c36';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#a8dfe3';
      ctx.stroke();

      // Placeholder character avatar
      ctx.fillStyle = '#f2bb66';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🤴', 0, 0);
    }

    ctx.restore();
  }

  // --- Fallback Pillar Renderer (If texture not yet loaded) ---
  function drawStonePillar(x, y, w, h, isTop) {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, '#2d3b3c');
    grad.addColorStop(0.3, '#4d5f61');
    grad.addColorStop(0.7, '#3c4b4d');
    grad.addColorStop(1, '#232c2d');

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Decorative carved capital / base
    ctx.fillStyle = '#1c2728';
    if (isTop) {
      ctx.fillRect(x - 4, y + h - 14, w + 8, 14);
      ctx.fillStyle = '#a8dfe3';
      ctx.fillRect(x - 4, y + h - 3, w + 8, 3);
    } else {
      ctx.fillRect(x - 4, y, w + 8, 14);
      ctx.fillStyle = '#a8dfe3';
      ctx.fillRect(x - 4, y, w + 8, 3);
    }
  }

  // --- Main Animation Frame Loop ---
  function gameLoop(now) {
    const deltaSeconds = Math.min((now - lastTimestamp) / 1000, 0.1);
    lastTimestamp = now;

    if (gameState === STATE.PLAYING) {
      accumulator += deltaSeconds;
      while (accumulator >= FIXED_STEP && gameState === STATE.PLAYING) {
        updatePhysics(FIXED_STEP);
        accumulator -= FIXED_STEP;
      }
    }

    if (burstActive) {
      updateBurst(deltaSeconds);
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  // Initialize
  updateAudioUI();
  requestAnimationFrame(gameLoop);

  // Expose clean debug / inspection interface for tests
  window.__gameDebug = {
    getHeroY: () => heroY,
    getVelocity: () => heroVelocity,
    getState: () => gameState,
    getScore: () => score,
    getObstacles: () => obstacles,
    getElapsedTime: () => elapsedTime,
    flap: flap,
    resetGame: resetGame,
    startGame: startGame
  };

})();
