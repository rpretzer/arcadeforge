/**
 * player.js - Player character with physics.
 *
 * Gravity, variable-height jump (hold = high, tap = short), double jump.
 * Draws the player as a coloured rectangle with rounded corners and shadow.
 */

import config from './config.js';
import { getAsset } from './assets.js';

let cfg = null;
let x = 0;
let y = 0;
let vy = 0;
let groundY = 0;
let onGround = true;
let jumpKeyHeld = false;
let doubleJumpUsed = false;

// ---- Public API ----------------------------------------------------------

export function init(canvas, overrideConfig) {
  cfg = overrideConfig || config;
  resetPosition(canvas);
}

export function update(delta, canvas) {
  groundY = canvas.height - cfg.player.groundOffset;
  x = 80;

  // Variable jump: cut upward velocity when jump key released
  if (!jumpKeyHeld && vy < 0 && !onGround) {
    vy = Math.max(vy, cfg.physics.jumpForceShort || -7);
  }

  // Apply gravity
  vy += cfg.physics.gravity * delta;
  y += vy * delta;

  // Ground collision
  const bottom = groundY - cfg.player.height;
  if (y >= bottom) {
    y = bottom;
    vy = 0;
    onGround = true;
    doubleJumpUsed = false;
  } else {
    onGround = false;
  }
}

export function draw(ctx) {
  const w = cfg.player.width;
  const h = cfg.player.height;
  const sprite = getAsset('player');
  const style = cfg.visual.style || 'geometric';

  if (sprite) {
    ctx.drawImage(sprite, x, y, w, h);
    return;
  }

  ctx.save();

  if (style === 'pixel' || cfg.visual.retroEra) {
    const px = Math.round(x);
    const py = Math.round(y);
    const outline = cfg.visual.outlineColor || '#0a0a14';
    if (cfg.visual.retroEra) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 1, py - 1, w + 2, h + 2);
    }
    ctx.fillStyle = cfg.colors.player;
    ctx.fillRect(px, py, w, h);
  } else if (style === 'hand-drawn') {
    ctx.globalAlpha = 0.85 + Math.random() * 0.15;
    ctx.strokeStyle = cfg.colors.player;
    ctx.lineWidth = 3;
    ctx.fillStyle = cfg.colors.player;
    const wb = 2;
    ctx.beginPath();
    ctx.moveTo(x + rnd(wb), y + rnd(wb));
    ctx.lineTo(x + w + rnd(wb), y + rnd(wb));
    ctx.lineTo(x + w + rnd(wb), y + h + rnd(wb));
    ctx.lineTo(x + rnd(wb), y + h + rnd(wb));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    const r = cfg.visual.cornerRadius;
    ctx.shadowColor = cfg.colors.player;
    ctx.shadowBlur = cfg.visual.shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = cfg.colors.player;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
  }

  ctx.restore();

  // Eye detail
  const eyeSize = 5;
  const eyeX = x + w - 12;
  const eyeY = y + 12;
  ctx.fillStyle = cfg.colors.background;
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cfg.colors.text;
  ctx.beginPath();
  ctx.arc(eyeX + 1, eyeY, 2, 0, Math.PI * 2);
  ctx.fill();
}

export function jump() {
  if (onGround) {
    jumpKeyHeld = true;
    vy = cfg.physics.jumpForce;
    onGround = false;
  } else if (cfg.player.doubleJump && !doubleJumpUsed) {
    doubleJumpUsed = true;
    jumpKeyHeld = true;
    vy = cfg.physics.jumpForce * 0.85;
  }
}

export function setJumpKeyHeld(held) {
  jumpKeyHeld = held;
}

export function getHitbox() {
  const inset = 4;
  return {
    x: x + inset,
    y: y + inset,
    width: cfg.player.width - inset * 2,
    height: cfg.player.height - inset * 2,
  };
}

export function getPosition() {
  return { x, y };
}

export function reset(canvas) {
  resetPosition(canvas);
}

// ---- Helpers -------------------------------------------------------------

function resetPosition(canvas) {
  groundY = canvas.height - cfg.player.groundOffset;
  x = 80;
  y = groundY - cfg.player.height;
  vy = 0;
  onGround = true;
  jumpKeyHeld = false;
  doubleJumpUsed = false;
}

function rnd(amount) {
  return (Math.random() - 0.5) * 2 * amount;
}

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
