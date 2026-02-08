/**
 * Arena Shooter - Player Module
 *
 * Top-down character controlled with WASD / arrow keys.
 * Aims toward the mouse cursor and shoots on click.
 * Drawn as a triangle pointing at the cursor.
 */

import config from './config.js';
import { getAsset } from './assets.js';

let x, y, health, angle;
let canvas, ctx;
let invulnTimer = 0; // brief invulnerability after taking damage

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  reset();
}

export function reset() {
  x = canvas.width / 2;
  y = canvas.height / 2;
  health = config.player.maxHealth;
  angle = 0;
  invulnTimer = 0;
}

export function update(dt, keys, mouse) {
  // -- Movement ---------------------------------------------------------------
  const spd = config.player.speed * 60 * dt; // normalize to ~60fps feel
  let dx = 0;
  let dy = 0;

  if (keys['w'] || keys['W'] || keys['ArrowUp'])    dy -= 1;
  if (keys['s'] || keys['S'] || keys['ArrowDown'])  dy += 1;
  if (keys['a'] || keys['A'] || keys['ArrowLeft'])  dx -= 1;
  if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

  // Normalize diagonal
  if (dx !== 0 && dy !== 0) {
    const inv = 1 / Math.SQRT2;
    dx *= inv;
    dy *= inv;
  }

  x += dx * spd;
  y += dy * spd;

  // Clamp to canvas
  const half = config.player.size / 2;
  x = Math.max(half, Math.min(canvas.width - half, x));
  y = Math.max(half, Math.min(canvas.height - half, y));

  // -- Aim toward mouse -------------------------------------------------------
  angle = Math.atan2(mouse.y - y, mouse.x - x);

  // -- Invulnerability timer ---------------------------------------------------
  if (invulnTimer > 0) invulnTimer -= dt;
}

export function draw() {
  const sz = config.player.size;
  const blink = invulnTimer > 0 && Math.floor(invulnTimer * 10) % 2 === 0;
  const sprite = getAsset('player');

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (sprite) {
    if (blink) ctx.globalAlpha = 0.5;
    ctx.drawImage(sprite, -sz / 2, -sz / 2, sz, sz);
    ctx.globalAlpha = 1;
  } else {
    // Shadow glow
    ctx.shadowColor = config.colors.player;
    ctx.shadowBlur = config.visual.shadowBlur;

    ctx.fillStyle = blink ? 'rgba(255,255,255,0.6)' : config.colors.player;
    ctx.beginPath();
    // Triangle pointing right (toward cursor after rotation)
    ctx.moveTo(sz * 0.6, 0);
    ctx.lineTo(-sz * 0.4, -sz * 0.4);
    ctx.lineTo(-sz * 0.4, sz * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

export function takeDamage(amount = 1) {
  if (invulnTimer > 0) return;
  health -= amount;
  invulnTimer = 1.0; // 1 second of invulnerability
  if (health < 0) health = 0;
}

export function getPosition() {
  return { x, y };
}

export function getHealth() {
  return health;
}

export function getHitbox() {
  const r = config.player.size * 0.4;
  return { x, y, r };
}
