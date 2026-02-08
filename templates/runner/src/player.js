/**
 * player.js - Player character with physics.
 *
 * Gravity, jumping (SPACE / UP / tap), ground collision.
 * Draws the player as a coloured rectangle with rounded corners and shadow.
 */

import config from './config.js';
import { getAsset } from './assets.js';

let cfg    = null;
let x      = 0;
let y      = 0;
let vy     = 0;      // vertical velocity
let groundY = 0;
let onGround = true;

// ---- Public API ----------------------------------------------------------

export function init(canvas, overrideConfig) {
  cfg = overrideConfig || config;
  resetPosition(canvas);
}

export function update(delta, canvas) {
  groundY = canvas.height - cfg.player.groundOffset;
  x = 80;   // player stays at fixed x

  // Apply gravity
  vy += cfg.physics.gravity * delta;
  y  += vy * delta;

  // Ground collision
  const bottom = groundY - cfg.player.height;
  if (y >= bottom) {
    y  = bottom;
    vy = 0;
    onGround = true;
  } else {
    onGround = false;
  }
}

export function draw(ctx) {
  const w  = cfg.player.width;
  const h  = cfg.player.height;
  const r  = cfg.visual.cornerRadius;
  const sprite = getAsset('player');

  if (sprite) {
    ctx.drawImage(sprite, x, y, w, h);
    return;
  }

  // Shadow
  ctx.save();
  ctx.shadowColor   = cfg.colors.player;
  ctx.shadowBlur    = cfg.visual.shadowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = cfg.colors.player;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  // Eye detail (gives personality)
  const eyeSize = 5;
  const eyeX    = x + w - 12;
  const eyeY    = y + 12;
  ctx.fillStyle = cfg.colors.background;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = cfg.colors.text;
  ctx.beginPath();
  ctx.arc(eyeX + 1, eyeY, 2, 0, Math.PI * 2);
  ctx.fill();
}

export function jump() {
  if (!onGround) return;
  vy = cfg.physics.jumpForce;
  onGround = false;
}

export function getHitbox() {
  // Slightly inset for fairness
  const inset = 4;
  return {
    x:      x + inset,
    y:      y + inset,
    width:  cfg.player.width  - inset * 2,
    height: cfg.player.height - inset * 2,
  };
}

export function reset(canvas) {
  resetPosition(canvas);
}

// ---- Helpers -------------------------------------------------------------

function resetPosition(canvas) {
  groundY  = canvas.height - cfg.player.groundOffset;
  x        = 80;
  y        = groundY - cfg.player.height;
  vy       = 0;
  onGround = true;
}

/**
 * Draw a rounded rectangle path (does NOT fill/stroke - caller does that).
 */
function roundRect(ctx, rx, ry, rw, rh, radius) {
  radius = Math.min(radius, rw / 2, rh / 2);
  ctx.beginPath();
  ctx.moveTo(rx + radius, ry);
  ctx.lineTo(rx + rw - radius, ry);
  ctx.arcTo(rx + rw, ry, rx + rw, ry + radius, radius);
  ctx.lineTo(rx + rw, ry + rh - radius);
  ctx.arcTo(rx + rw, ry + rh, rx + rw - radius, ry + rh, radius);
  ctx.lineTo(rx + radius, ry + rh);
  ctx.arcTo(rx, ry + rh, rx, ry + rh - radius, radius);
  ctx.lineTo(rx, ry + radius);
  ctx.arcTo(rx, ry, rx + radius, ry, radius);
  ctx.closePath();
}
