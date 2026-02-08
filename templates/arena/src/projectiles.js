/**
 * Arena Shooter - Projectile Module
 *
 * Manages bullets fired by the player toward the mouse cursor.
 * Bullets travel in straight lines and are removed when off-screen.
 */

import config from './config.js';
import { getAsset } from './assets.js';

let bullets = [];
let canvas, ctx;
let lastFireTime = 0;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  reset();
}

export function reset() {
  bullets = [];
  lastFireTime = 0;
}

/**
 * Fire a bullet from (sx, sy) toward (tx, ty).
 */
export function fire(sx, sy, tx, ty) {
  const now = performance.now();
  if (now - lastFireTime < config.bullets.cooldown) return;
  lastFireTime = now;

  const angle = Math.atan2(ty - sy, tx - sx);
  bullets.push({
    x: sx,
    y: sy,
    vx: Math.cos(angle) * config.bullets.speed,
    vy: Math.sin(angle) * config.bullets.speed,
  });
}

export function update(dt) {
  const speed60 = 60 * dt; // normalize to ~60fps
  const margin = 50;

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * speed60;
    b.y += b.vy * speed60;

    // Remove off-screen bullets
    if (b.x < -margin || b.x > canvas.width + margin ||
        b.y < -margin || b.y > canvas.height + margin) {
      bullets.splice(i, 1);
    }
  }
}

export function draw() {
  const sprite = getAsset('bullet');
  ctx.save();
  ctx.fillStyle = config.colors.bullet;
  ctx.shadowColor = config.colors.bullet;
  ctx.shadowBlur = config.visual.shadowBlur;

  const sz = config.bullets.size * 2;

  for (const b of bullets) {
    if (sprite) {
      ctx.drawImage(sprite, b.x - sz / 2, b.y - sz / 2, sz, sz);
    } else {
      ctx.beginPath();
      ctx.arc(b.x, b.y, config.bullets.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function getBullets() {
  return bullets;
}

/**
 * Remove a bullet by index (called after a hit).
 */
export function removeBullet(index) {
  bullets.splice(index, 1);
}
