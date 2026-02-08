/**
 * Arena Shooter - Enemy Module
 *
 * Enemies spawn from the edges and chase the player.
 * A wave system increases difficulty over time.
 */

import config from './config.js';
import { getPosition, getHitbox, takeDamage } from './player.js';
import { getBullets, removeBullet } from './projectiles.js';
import { getAsset } from './assets.js';

let enemies = [];
let canvas, ctx;
let wave, enemiesRemaining, enemiesSpawnedThisWave, enemiesPerWave;
let waveDelay;       // countdown before next wave starts
let waveActive;
let killCount;       // kills this wave (used by scoring)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function enemyCountForWave(w) {
  return Math.floor(5 + (w - 1) * 3 * config.enemies.waveDifficultyCurve);
}

function enemySpeedForWave(w) {
  return config.enemies.baseSpeed + (w - 1) * 0.3;
}

function spawnOne() {
  const side = Math.floor(Math.random() * 4);
  let ex, ey;
  const margin = config.enemies.size;

  switch (side) {
    case 0: ex = Math.random() * canvas.width;  ey = -margin;              break; // top
    case 1: ex = Math.random() * canvas.width;  ey = canvas.height + margin; break; // bottom
    case 2: ex = -margin;                       ey = Math.random() * canvas.height; break; // left
    case 3: ex = canvas.width + margin;          ey = Math.random() * canvas.height; break; // right
  }

  const speed = enemySpeedForWave(wave) * (0.8 + Math.random() * 0.4);
  const isSquare = Math.random() < 0.4; // 40 % chance of square enemy

  enemies.push({ x: ex, y: ey, speed, isSquare, flash: 0 });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  reset();
}

export function reset() {
  enemies = [];
  wave = 1;
  enemiesPerWave = enemyCountForWave(wave);
  enemiesSpawnedThisWave = 0;
  enemiesRemaining = enemiesPerWave;
  waveDelay = 2; // initial 2-second grace period
  waveActive = false;
  killCount = 0;
}

export function getWave() {
  return wave;
}

export function getWaveKills() {
  return killCount;
}

export function update(dt) {
  // -- Wave delay (countdown between waves) ----------------------------------
  if (!waveActive) {
    waveDelay -= dt;
    if (waveDelay <= 0) {
      waveActive = true;
    }
    // Still update existing enemies that might remain on-screen
  }

  // -- Spawn enemies ----------------------------------------------------------
  if (waveActive && enemiesSpawnedThisWave < enemiesPerWave) {
    // Use spawnRate as probability per frame (scaled by dt for consistency)
    const spawnChance = config.enemies.spawnRate * 60 * dt;
    if (Math.random() < spawnChance) {
      spawnOne();
      enemiesSpawnedThisWave++;
    }
  }

  // -- Move enemies toward player ---------------------------------------------
  const playerPos = getPosition();
  const playerHitbox = getHitbox();

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = playerPos.x - e.x;
    const dy = playerPos.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const spd = e.speed * 60 * dt;

    e.x += (dx / dist) * spd;
    e.y += (dy / dist) * spd;

    // Flash timer countdown
    if (e.flash > 0) e.flash -= dt;

    // -- Collision with player ------------------------------------------------
    const combinedR = playerHitbox.r + config.enemies.size * 0.5;
    const eDist = Math.hypot(e.x - playerHitbox.x, e.y - playerHitbox.y);
    if (eDist < combinedR) {
      takeDamage(1);
      enemies.splice(i, 1);
      enemiesRemaining--;
      continue;
    }
  }

  // -- Check if wave is cleared -----------------------------------------------
  if (waveActive && enemiesSpawnedThisWave >= enemiesPerWave && enemies.length === 0 && enemiesRemaining <= 0) {
    wave++;
    enemiesPerWave = enemyCountForWave(wave);
    enemiesSpawnedThisWave = 0;
    enemiesRemaining = enemiesPerWave;
    waveActive = false;
    waveDelay = 2;
    killCount = 0;
  }
}

export function draw() {
  const sprite = getAsset('enemy');
  ctx.save();
  ctx.shadowColor = config.colors.enemy;
  ctx.shadowBlur = config.visual.shadowBlur * 0.5;

  for (const e of enemies) {
    const sz = config.enemies.size;

    if (sprite) {
      if (e.flash > 0) ctx.globalAlpha = 0.5;
      ctx.drawImage(sprite, e.x - sz / 2, e.y - sz / 2, sz, sz);
      ctx.globalAlpha = 1;
    } else {
      const color = e.flash > 0 ? '#ffffff' : config.colors.enemy;
      ctx.fillStyle = color;

      if (e.isSquare) {
        const r = config.visual.cornerRadius;
        roundRect(ctx, e.x - sz / 2, e.y - sz / 2, sz, sz, r);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(e.x, e.y, sz / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * Check bullet <-> enemy collisions. Returns number of kills this frame.
 */
export function checkBulletCollisions() {
  const bulletList = getBullets();
  let kills = 0;

  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    for (let bi = bulletList.length - 1; bi >= 0; bi--) {
      const b = bulletList[bi];
      const dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < config.enemies.size / 2 + config.bullets.size) {
        // Hit!
        removeBullet(bi);
        enemies.splice(ei, 1);
        enemiesRemaining--;
        kills++;
        killCount++;
        break; // one bullet per enemy per frame
      }
    }
  }

  return kills;
}

export function spawn() {
  spawnOne();
  enemiesSpawnedThisWave++;
}

// ---------------------------------------------------------------------------
// Utility: rounded rectangle
// ---------------------------------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
