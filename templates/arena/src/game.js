/**
 * Arena Shooter - Game State Manager
 *
 * Manages three states: menu, playing, gameover.
 * Orchestrates all modules and draws UI overlays.
 */

import config from './config.js';
import { init as initPlayer, update as updatePlayer, draw as drawPlayer, getHealth, reset as resetPlayer, heal } from './player.js';
import { init as initEnemies, update as updateEnemies, draw as drawEnemies, checkBulletCollisions, getWave, reset as resetEnemies } from './enemies.js';
import { init as initProjectiles, update as updateProjectiles, draw as drawProjectiles, fire, reset as resetProjectiles } from './projectiles.js';
import { init as initScoring, update as updateScoring, draw as drawScoring, addScore, addWaveBonus, getScore, getHighScore, reset as resetScoring } from './scoring.js';
import { init as initPowerups, update as updatePowerups, draw as drawPowerups, checkPickup, getActiveEffects, spawnDrop, reset as resetPowerups } from './powerups.js';
import { getPosition, getHitbox } from './player.js';

let state = 'menu'; // 'menu' | 'playing' | 'gameover'
let canvas, ctx;
let prevWave = 1;
let shooting = false;
let finalWave = 1;
let paused = false;
let hintTimer = 5000;
let firstInput = false;
let mouseX = 0, mouseY = 0;

// Visual effects
let muzzleFlash = { active: false, x: 0, y: 0, timer: 0 };
let hitMarkers = [];
let shakeTimer = 0;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  mouseX = canvas.width / 2;
  mouseY = canvas.height / 2;
  initPlayer(canvas, ctx);
  initEnemies(canvas, ctx);
  initProjectiles(canvas, ctx);
  initScoring(canvas, ctx);
  initPowerups(canvas, ctx);
}

export function update(dt, keys, mouse) {
  mouseX = mouse.x;
  mouseY = mouse.y;

  if (state === 'playing') {
    if (paused) return;

    // Count down hint timer
    if (hintTimer > 0 && !firstInput) {
      hintTimer -= dt * 1000;
    }

    updatePlayer(dt, keys, mouse);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateScoring(dt);
    updatePowerups(dt);

    // Shooting (hold down mouse) — apply rapidfire if active
    if (shooting) {
      const pos = getPosition();
      const effects = getActiveEffects();
      if (effects.rapidfire > 0) {
        const origCooldown = config.bullets.cooldown;
        config.bullets.cooldown = origCooldown / 3;
        fire(pos.x, pos.y, mouse.x, mouse.y);
        config.bullets.cooldown = origCooldown;
      } else {
        fire(pos.x, pos.y, mouse.x, mouse.y);
      }
    }

    const kills = checkBulletCollisions();
    for (const kill of kills) {
      addScore(kill.score, kill.x, kill.y);
      spawnDrop(kill.x, kill.y);
      hitMarkers.push({ x: kill.x, y: kill.y, timer: 0.2 });
      if (config.juice?.screenShake !== false && config.juice?.shakeOnKill) {
        shakeTimer = Math.max(shakeTimer, 0.15);
      }
    }

    // Wave change bonus
    const currentWave = getWave();
    if (currentWave !== prevWave) {
      addWaveBonus(prevWave);
      prevWave = currentWave;
    }

    // Power-up pickup
    const hitbox = getHitbox();
    const pickup = checkPickup(hitbox.x, hitbox.y, hitbox.r);
    if (pickup === 'health') {
      heal(1);
    }

    // Update visual effects
    if (muzzleFlash.active) {
      muzzleFlash.timer -= dt;
      if (muzzleFlash.timer <= 0) muzzleFlash.active = false;
    }
    for (let i = hitMarkers.length - 1; i >= 0; i--) {
      hitMarkers[i].timer -= dt;
      if (hitMarkers[i].timer <= 0) hitMarkers.splice(i, 1);
    }
    if (shakeTimer > 0) shakeTimer -= dt;

    // Check death
    if (getHealth() <= 0) {
      finalWave = getWave();
      state = 'gameover';
    }
  }
}

export function draw() {
  const shakeIntensity = (config.juice?.shakeOnKill ?? 0.3) * 8;
  let shakeX = 0, shakeY = 0;
  if (shakeTimer > 0) {
    shakeX = (Math.random() - 0.5) * 2 * shakeIntensity;
    shakeY = (Math.random() - 0.5) * 2 * shakeIntensity;
  }

  ctx.save();
  if (shakeX || shakeY) ctx.translate(shakeX, shakeY);

  ctx.fillStyle = config.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  if (state === 'menu') {
    drawMenu();
  } else if (state === 'playing') {
    drawProjectiles();
    drawPowerups();
    drawEnemies();
    drawPlayer();
    drawMuzzleFlash();
    drawHitMarkers();
    drawScoring();
    drawCrosshair();
    drawControlHints();
    if (paused) {
      drawPauseOverlay();
    }
  } else if (state === 'gameover') {
    drawProjectiles();
    drawPowerups();
    drawEnemies();
    drawPlayer();
    drawScoring();
    drawGameOver();
  }

  if (config.visual?.scanlines && state !== 'menu') {
    drawScanlines();
  }

  ctx.restore();
}

export function handleClick(mouse) {
  if (state === 'menu') {
    startGame();
  } else if (state === 'playing') {
    if (paused) return;
    if (!firstInput) {
      firstInput = true;
      hintTimer = 0;
    }
    shooting = true;
    // Fire immediately and trigger muzzle flash
    const pos = getPosition();
    const effects = getActiveEffects();
    if (effects.rapidfire > 0) {
      const origCooldown = config.bullets.cooldown;
      config.bullets.cooldown = origCooldown / 3;
      fire(pos.x, pos.y, mouse.x, mouse.y);
      config.bullets.cooldown = origCooldown;
    } else {
      fire(pos.x, pos.y, mouse.x, mouse.y);
    }
    triggerMuzzleFlash(pos.x, pos.y);

    // Stop shooting on mouseup
    const stopShooting = () => {
      shooting = false;
      window.removeEventListener('mouseup', stopShooting);
    };
    window.addEventListener('mouseup', stopShooting);
  } else if (state === 'gameover') {
    startGame();
  }
}

export function handleKeyDown(key) {
  if (state === 'playing') {
    if (!firstInput) {
      firstInput = true;
      hintTimer = 0;
    }
    if (key === 'p' || key === 'P') {
      paused = !paused;
      return;
    }
  }
  if (key === 'r' || key === 'R') {
    if (state === 'gameover') {
      startGame();
    }
  }
  if (key === ' ' || key === 'Enter') {
    if (state === 'menu') {
      startGame();
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function startGame() {
  shakeTimer = 0;
  resetPlayer();
  resetEnemies();
  resetProjectiles();
  resetScoring();
  resetPowerups();
  prevWave = 1;
  shooting = false;
  paused = false;
  hintTimer = 5000;
  firstInput = false;
  hitMarkers = [];
  muzzleFlash.active = false;
  state = 'playing';
}

function triggerMuzzleFlash(x, y) {
  muzzleFlash = { active: true, x, y, timer: 0.1 };
}

function drawCrosshair() {
  const arm = 10;
  const gap = 4;

  ctx.save();
  ctx.strokeStyle = config.colors.accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;

  ctx.beginPath();
  ctx.moveTo(mouseX - arm, mouseY);
  ctx.lineTo(mouseX - gap, mouseY);
  ctx.moveTo(mouseX + gap, mouseY);
  ctx.lineTo(mouseX + arm, mouseY);
  ctx.moveTo(mouseX, mouseY - arm);
  ctx.lineTo(mouseX, mouseY - gap);
  ctx.moveTo(mouseX, mouseY + gap);
  ctx.lineTo(mouseX, mouseY + arm);
  ctx.stroke();

  ctx.restore();
}

function drawMuzzleFlash() {
  if (!muzzleFlash.active) return;

  const alpha = muzzleFlash.timer / 0.1;
  ctx.save();
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(muzzleFlash.x, muzzleFlash.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawHitMarkers() {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;

  for (const hm of hitMarkers) {
    const alpha = hm.timer / 0.2;
    ctx.globalAlpha = alpha;
    const sz = 6;
    ctx.beginPath();
    ctx.moveTo(hm.x - sz, hm.y - sz);
    ctx.lineTo(hm.x + sz, hm.y + sz);
    ctx.moveTo(hm.x + sz, hm.y - sz);
    ctx.lineTo(hm.x - sz, hm.y + sz);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPauseOverlay() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', cx, cy - 20);

  ctx.font = '22px monospace';
  ctx.fillText('Press P to resume', cx, cy + 30);
  ctx.restore();
}

function drawControlHints() {
  if (hintTimer <= 0 || state !== 'playing' || paused) return;

  let alpha = 1;
  if (hintTimer < 1000) {
    alpha = hintTimer / 1000;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = config.colors.text;
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('WASD: Move | CLICK: Shoot | P: Pause', 12, canvas.height - 12);
  ctx.restore();
}

function drawScanlines() {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#000';
  for (let y = 0; y < canvas.height; y += 4) {
    ctx.fillRect(0, y, canvas.width, 2);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  const step = 60;
  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMenu() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = config.colors.player;
  ctx.shadowColor = config.colors.player;
  ctx.shadowBlur = 16;
  ctx.fillText(config.game.title.toUpperCase(), cx, cy - 80);

  ctx.shadowBlur = 0;

  // Instructions
  ctx.font = '20px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('WASD to move, Click to shoot', cx, cy);

  ctx.font = '16px monospace';
  ctx.fillStyle = config.colors.accent;
  ctx.fillText('Survive waves of enemies!', cx, cy + 40);

  // Start prompt
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '18px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('[ Click or press Enter to start ]', cx, cy + 100);

  ctx.restore();
}

function drawGameOver() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Dim overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = 'bold 44px monospace';
  ctx.fillStyle = config.colors.enemy;
  ctx.shadowColor = config.colors.enemy;
  ctx.shadowBlur = 12;
  ctx.fillText('GAME OVER', cx, cy - 80);
  ctx.shadowBlur = 0;

  // Stats
  ctx.font = '22px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText(`Score: ${getScore()}`, cx, cy - 20);

  ctx.font = '18px monospace';
  ctx.fillStyle = config.colors.accent;
  ctx.fillText(`Wave Reached: ${finalWave}`, cx, cy + 16);

  ctx.fillStyle = config.colors.bullet;
  ctx.fillText(`High Score: ${getHighScore()}`, cx, cy + 50);

  // Restart prompt
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '16px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('Press R or Click to restart', cx, cy + 100);

  ctx.restore();
}
