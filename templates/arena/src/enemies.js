/**
 * Arena Shooter - Enemy Module
 *
 * Enemies spawn from the edges and chase the player.
 * A wave system increases difficulty over time.
 * Supports multiple enemy types: basic, tank, fast.
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

// Wave announcement state
let waveAnnouncement = { active: false, timer: 0, wave: 1, enemyCount: 0 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function enemyCountForWave(w) {
  return Math.floor(5 + (w - 1) * 3 * config.enemies.waveDifficultyCurve);
}

function enemySpeedForWave(w) {
  return config.enemies.baseSpeed + (w - 1) * 0.3;
}

/**
 * Pick an enemy type weighted by wave number.
 * Later waves shift weight toward tank and fast types.
 */
function pickEnemyType(w) {
  const types = config.enemies.types;
  if (!types || types.length === 0) return null;
  if (types.length === 1) return types[0];

  // Base weights shift with wave: basic decreases, tank/fast increase
  const basicW = Math.max(0.2, 1.0 - (w - 1) * 0.08);
  const tankW  = Math.min(0.4, 0.05 + (w - 1) * 0.04);
  const fastW  = Math.min(0.4, 0.05 + (w - 1) * 0.04);
  const weights = [basicW, tankW, fastW];
  const total = weights.reduce((s, v) => s + v, 0);

  const roll = Math.random() * total;
  let cumulative = 0;
  for (let i = 0; i < types.length; i++) {
    cumulative += weights[i] ?? 0;
    if (roll < cumulative) return types[i];
  }
  return types[0];
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

  const baseSpeed = enemySpeedForWave(wave) * (0.8 + Math.random() * 0.4);
  const type = pickEnemyType(wave);
  const speedMult = type?.speedMult ?? 1;
  const sizeMult  = type?.sizeMult ?? 1;
  const hp         = type?.hp ?? 1;
  const score      = type?.score ?? 50;
  const typeName   = type?.name ?? 'basic';
  const isSquare   = Math.random() < 0.4;

  enemies.push({
    x: ex, y: ey,
    speed: baseSpeed * speedMult,
    sizeMult,
    hp,
    maxHp: hp,
    score,
    typeName,
    isSquare,
    flash: 0,
  });
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
  waveAnnouncement = { active: true, timer: 2, wave: 1, enemyCount: enemiesPerWave };
}

export function getWave() {
  return wave;
}

export function getWaveKills() {
  return killCount;
}

export function update(dt) {
  // -- Wave announcement countdown -------------------------------------------
  if (waveAnnouncement.active) {
    waveAnnouncement.timer -= dt;
    if (waveAnnouncement.timer <= 0) {
      waveAnnouncement.active = false;
    }
  }

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
    const eSize = config.enemies.size * (e.sizeMult ?? 1);
    const combinedR = playerHitbox.r + eSize * 0.5;
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
    waveAnnouncement = { active: true, timer: 2, wave, enemyCount: enemiesPerWave };
  }
}

export function draw() {
  const sprite = getAsset('enemy');
  const style = config.visual.style || 'geometric';

  ctx.save();

  for (const e of enemies) {
    const sz = config.enemies.size * (e.sizeMult ?? 1);

    if (sprite) {
      if (e.flash > 0) ctx.globalAlpha = 0.5;
      ctx.drawImage(sprite, e.x - sz / 2, e.y - sz / 2, sz, sz);
      ctx.globalAlpha = 1;
      continue;
    }

    const color = e.flash > 0 ? '#ffffff' : shiftColor(config.colors.enemy, e);

    if (style === 'pixel') {
      ctx.fillStyle = color;
      const px = Math.round(e.x - sz / 2);
      const py = Math.round(e.y - sz / 2);
      ctx.fillRect(px, py, sz, sz);
    } else if (style === 'hand-drawn') {
      ctx.globalAlpha = e.flash > 0 ? 0.5 : (0.85 + Math.random() * 0.15);
      ctx.fillStyle = color;
      ctx.strokeStyle = config.colors.enemy;
      ctx.lineWidth = 3;
      const wb = 2;
      const half = sz / 2;
      if (e.isSquare) {
        ctx.beginPath();
        ctx.moveTo(e.x - half + rnd(wb), e.y - half + rnd(wb));
        ctx.lineTo(e.x + half + rnd(wb), e.y - half + rnd(wb));
        ctx.lineTo(e.x + half + rnd(wb), e.y + half + rnd(wb));
        ctx.lineTo(e.x - half + rnd(wb), e.y + half + rnd(wb));
        ctx.closePath();
      } else {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const px = e.x + Math.cos(a) * (half + rnd(wb));
          const py = e.y + Math.sin(a) * (half + rnd(wb));
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      // Geometric (default)
      ctx.shadowColor = config.colors.enemy;
      ctx.shadowBlur = config.visual.shadowBlur * 0.5;
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
      ctx.shadowBlur = 0;
    }

    // Draw HP indicator for multi-HP enemies
    if (e.maxHp > 1 && e.hp > 0) {
      ctx.shadowBlur = 0;
      const barW = sz;
      const barH = 3;
      const barX = e.x - barW / 2;
      const barY = e.y - sz / 2 - 6;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = config.colors.healthBar;
      ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
    }
  }

  ctx.restore();

  // Draw wave announcement overlay
  if (waveAnnouncement.active) {
    drawWaveAnnouncement();
  }
}

function drawWaveAnnouncement() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const alpha = Math.min(1, waveAnnouncement.timer);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 52px monospace';
  ctx.fillStyle = config.colors.accent;
  ctx.shadowColor = config.colors.accent;
  ctx.shadowBlur = 20;
  ctx.fillText(`WAVE ${waveAnnouncement.wave}`, cx, cy - 20);

  ctx.shadowBlur = 0;
  ctx.font = '20px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText(`${waveAnnouncement.enemyCount} enemies incoming`, cx, cy + 25);

  ctx.restore();
}

/**
 * Shift enemy color based on type for visual differentiation.
 */
function shiftColor(baseColor, enemy) {
  const types = config.enemies.types;
  if (!types) return baseColor;
  const typeConfig = types.find(t => t.name === enemy.typeName);
  if (!typeConfig || typeConfig.colorShift === 0) return baseColor;

  const shift = typeConfig.colorShift;
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  return `rgb(${clamp(r + shift)},${clamp(g + shift)},${clamp(b + shift)})`;
}

function rnd(amount) {
  return (Math.random() - 0.5) * 2 * amount;
}

/**
 * Check bullet <-> enemy collisions. Returns array of kill info objects
 * with {x, y, score} for each kill, or empty array.
 */
export function checkBulletCollisions() {
  const bulletList = getBullets();
  const killResults = [];

  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    const eSize = config.enemies.size * (e.sizeMult ?? 1);
    for (let bi = bulletList.length - 1; bi >= 0; bi--) {
      const b = bulletList[bi];
      const dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < eSize / 2 + config.bullets.size) {
        // Hit!
        removeBullet(bi);
        e.hp--;
        e.flash = 0.1;

        if (e.hp <= 0) {
          killResults.push({ x: e.x, y: e.y, score: e.score });
          enemies.splice(ei, 1);
          enemiesRemaining--;
          killCount++;
        }
        break; // one bullet per enemy per frame
      }
    }
  }

  return killResults;
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
