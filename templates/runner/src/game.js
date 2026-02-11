/**
 * game.js - Game state manager.
 *
 * States: menu | playing | gameover
 * Draws UI overlays (title screen, game-over screen with score).
 * Parallax background layers, collectibles, power-ups, screen shake.
 * Listens for restart (R key or click).
 */

import config from './config.js';
import { init as initPlayer, update as updatePlayer, draw as drawPlayer, jump, getHitbox, reset as resetPlayer } from './player.js';
import { init as initObstacles, update as updateObstacles, draw as drawObstacles, checkCollision, getSpeed, reset as resetObstacles } from './obstacles.js';
import { init as initScoring, update as updateScoring, draw as drawScoring, getScore, getHighScore, reset as resetScoring } from './scoring.js';
import { init as initCollectibles, update as updateCollectibles, draw as drawCollectibles, setCanvas as setCollectiblesCanvas, reset as resetCollectibles } from './collectibles.js';
import { init as initPowerups, update as updatePowerups, draw as drawPowerups, drawHUD as drawPowerupHUD, drawShieldEffect, getSpeedMultiplier, hasShield, consumeShield, setCanvas as setPowerupsCanvas, reset as resetPowerups } from './powerups.js';

let state  = 'menu';   // 'menu' | 'playing' | 'gameover'
let cfg    = null;
let _canvas = null;
let paused = false;
let hintTimer = 5000;
let firstInput = false;

// Parallax layers
let farLayer = [];
let nearLayer = [];

// Screen shake
let shakeTimer = 0;
const SHAKE_DURATION = 300; // ms
const SHAKE_INTENSITY = 5;

// ---- Public API ----------------------------------------------------------

export function init(canvas, ctx, overrideConfig) {
  cfg     = overrideConfig || config;
  _canvas = canvas;

  initPlayer(canvas, cfg);
  initObstacles(canvas, cfg);
  initScoring(cfg);
  initCollectibles(cfg);
  initPowerups(cfg);
  setCollectiblesCanvas(canvas);
  setPowerupsCanvas(canvas);

  buildParallaxLayers(canvas);
}

export function update(delta, canvas) {
  _canvas = canvas;
  setCollectiblesCanvas(canvas);
  setPowerupsCanvas(canvas);

  if (state !== 'playing') return;
  if (paused) return;

  // Count down hint timer (delta is frame-normalized, ~16.67ms per unit)
  if (hintTimer > 0 && !firstInput) {
    hintTimer -= delta * (1000 / 60);
  }

  // Apply slowmo multiplier from powerups
  const speedMult = getSpeedMultiplier();
  const adjustedDelta = delta * speedMult;

  updatePlayer(adjustedDelta, canvas);
  updateObstacles(adjustedDelta, canvas);
  updateScoring(adjustedDelta);

  const gameSpeed = getSpeed();
  const playerBounds = getHitbox();

  // Update collectibles - points returned on collect
  const points = updateCollectibles(adjustedDelta, playerBounds, gameSpeed);
  if (points && points.length > 0) {
    for (const p of points) {
      updateScoring(p / 10); // scale to scoring units
    }
  }

  // Update powerups
  updatePowerups(adjustedDelta, playerBounds, gameSpeed);

  // Update parallax
  updateParallax(adjustedDelta, gameSpeed);

  // Tick screen shake
  if (shakeTimer > 0) {
    shakeTimer -= adjustedDelta * (1000 / 60);
    if (shakeTimer < 0) shakeTimer = 0;
  }

  // Collision check
  if (checkCollision()) {
    if (hasShield()) {
      consumeShield();
    } else {
      state = 'gameover';
      shakeTimer = SHAKE_DURATION;
    }
  }
}

export function draw(ctx, canvas) {
  // Apply screen shake offset
  let shakeX = 0, shakeY = 0;
  if (shakeTimer > 0) {
    shakeX = (Math.random() - 0.5) * 2 * SHAKE_INTENSITY;
    shakeY = (Math.random() - 0.5) * 2 * SHAKE_INTENSITY;
  }

  ctx.save();
  if (shakeX || shakeY) {
    ctx.translate(shakeX, shakeY);
  }

  // Background
  ctx.fillStyle = cfg.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Parallax background layers
  if (state === 'playing' || state === 'gameover') {
    drawParallax(ctx, canvas);
  }

  // Ground line
  const groundY = canvas.height - cfg.player.groundOffset;
  ctx.strokeStyle = cfg.colors.ground;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();

  // Decorative ground fill
  ctx.fillStyle = cfg.colors.accent;
  ctx.fillRect(0, groundY, canvas.width, cfg.player.groundOffset);

  if (state === 'menu') {
    drawMenu(ctx, canvas);
  } else if (state === 'playing') {
    drawCollectibles(ctx);
    drawPowerups(ctx);
    drawObstacles(ctx);
    drawPlayer(ctx);
    drawShieldEffect(ctx, getHitbox());
    drawScoring(ctx, canvas);
    drawPowerupHUD(ctx, canvas);
    drawControlHints(ctx, canvas);
    if (paused) {
      drawPauseOverlay(ctx, canvas);
    }
  } else if (state === 'gameover') {
    drawCollectibles(ctx);
    drawPowerups(ctx);
    drawObstacles(ctx);
    drawPlayer(ctx);
    drawScoring(ctx, canvas);
    drawGameOver(ctx, canvas);
  }

  ctx.restore();
}

export function handleInput(type, event) {
  if (type === 'keydown') {
    const code = event.code;

    if (state === 'playing') {
      if (!firstInput) {
        firstInput = true;
        hintTimer = 0;
      }
      if (code === 'KeyP') {
        paused = !paused;
        return;
      }
    }

    if (state === 'menu') {
      if (code === 'Space' || code === 'ArrowUp') {
        startGame();
      }
    } else if (state === 'playing') {
      if (!paused && (code === 'Space' || code === 'ArrowUp')) {
        jump();
      }
    } else if (state === 'gameover') {
      if (code === 'KeyR') {
        restartGame();
      }
    }
  }

  if (type === 'click') {
    if (state === 'playing' && !firstInput) {
      firstInput = true;
      hintTimer = 0;
    }
    if (state === 'menu') {
      startGame();
    } else if (state === 'playing') {
      if (!paused) jump();
    } else if (state === 'gameover') {
      restartGame();
    }
  }
}

// ---- Internal helpers ----------------------------------------------------

function startGame() {
  state = 'playing';
  paused = false;
  hintTimer = 5000;
  firstInput = false;
  shakeTimer = 0;
  resetPlayer(_canvas);
  resetObstacles();
  resetScoring();
  resetCollectibles();
  resetPowerups();
  buildParallaxLayers(_canvas);
}

function restartGame() {
  startGame();
}

// ---- Parallax background -------------------------------------------------

function buildParallaxLayers(canvas) {
  farLayer = [];
  nearLayer = [];

  // Far layer: small, dim shapes
  for (let i = 0; i < 12; i++) {
    farLayer.push({
      x: Math.random() * canvas.width * 1.5,
      y: 40 + Math.random() * (canvas.height * 0.5),
      w: 15 + Math.random() * 30,
      h: 20 + Math.random() * 50,
    });
  }

  // Near layer: bigger, slightly brighter shapes
  for (let i = 0; i < 8; i++) {
    nearLayer.push({
      x: Math.random() * canvas.width * 1.5,
      y: 60 + Math.random() * (canvas.height * 0.45),
      w: 20 + Math.random() * 40,
      h: 30 + Math.random() * 60,
    });
  }
}

function updateParallax(delta, gameSpeed) {
  const farSpeed = gameSpeed * 0.3 * delta;
  const nearSpeed = gameSpeed * 0.6 * delta;

  for (const s of farLayer) {
    s.x -= farSpeed;
    if (s.x + s.w < 0) {
      s.x = _canvas.width + Math.random() * 100;
      s.y = 40 + Math.random() * (_canvas.height * 0.5);
    }
  }

  for (const s of nearLayer) {
    s.x -= nearSpeed;
    if (s.x + s.w < 0) {
      s.x = _canvas.width + Math.random() * 100;
      s.y = 60 + Math.random() * (_canvas.height * 0.45);
    }
  }
}

function drawParallax(ctx, canvas) {
  // Far layer
  ctx.fillStyle = cfg.colors.ground;
  ctx.globalAlpha = 0.12;
  for (const s of farLayer) {
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }

  // Near layer
  ctx.globalAlpha = 0.2;
  for (const s of nearLayer) {
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }

  ctx.globalAlpha = 1;
}

// ---- UI overlays ---------------------------------------------------------

function drawMenu(ctx, canvas) {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  // Title
  ctx.fillStyle    = cfg.colors.text;
  ctx.font         = 'bold 48px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cfg.game.title, cx, cy - 60);

  // Instruction
  ctx.font = '22px sans-serif';
  ctx.fillStyle = cfg.colors.text;
  ctx.fillText('Press SPACE to start', cx, cy + 10);

  // Sub-instruction
  ctx.font = '16px sans-serif';
  ctx.globalAlpha = 0.6;
  ctx.fillText('or tap / click anywhere', cx, cy + 45);
  ctx.globalAlpha = 1;
}

function drawPauseOverlay(ctx, canvas) {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 52px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', cx, cy - 20);

  ctx.font = '22px sans-serif';
  ctx.fillText('Press P to resume', cx, cy + 30);
}

function drawControlHints(ctx, canvas) {
  if (hintTimer <= 0 || state !== 'playing' || paused) return;

  let alpha = 1;
  if (hintTimer < 1000) {
    alpha = hintTimer / 1000;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle   = cfg.colors.text;
  ctx.font        = '14px sans-serif';
  ctx.textAlign   = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('SPACE: Jump | P: Pause', 12, canvas.height - 12);
  ctx.restore();
}

function drawGameOver(ctx, canvas) {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  // Dim overlay
  ctx.fillStyle   = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Game Over text
  ctx.fillStyle    = cfg.colors.player;
  ctx.font         = 'bold 52px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over', cx, cy - 70);

  // Score
  ctx.fillStyle = cfg.colors.text;
  ctx.font      = '28px sans-serif';
  ctx.fillText(`Score: ${getScore()}`, cx, cy - 10);

  // High score
  ctx.font = '22px sans-serif';
  ctx.fillText(`High Score: ${getHighScore()}`, cx, cy + 30);

  // Restart prompt
  ctx.font = '20px sans-serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText('Press R or click to restart', cx, cy + 80);
  ctx.globalAlpha = 1;
}
