/**
 * player.js - Top-down player module
 *
 * WASD/arrow movement with wall collision. Health system.
 * Tracks facing direction for attack orientation.
 */

import config from './config.js';
import { isWall } from './map.js';

let x, y, health, facing;
let canvas, ctx;
let invulnTimer = 0;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  reset();
}

export function reset() {
  x = config.map.roomWidth / 2;
  y = config.map.roomHeight / 2;
  health = config.player.maxHealth;
  facing = { x: 0, y: 1 }; // face down by default
  invulnTimer = 0;
}

export function update(dt, keys) {
  const spd = config.player.speed * 60 * dt;
  let dx = 0;
  let dy = 0;

  if (keys['KeyW'] || keys['ArrowUp'])    dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  dy += 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

  // Normalize diagonal
  if (dx !== 0 && dy !== 0) {
    const inv = 1 / Math.SQRT2;
    dx *= inv;
    dy *= inv;
  }

  // Update facing direction
  if (dx !== 0 || dy !== 0) {
    facing = { x: Math.sign(dx) || facing.x, y: Math.sign(dy) || facing.y };
    // Prefer cardinal directions
    if (Math.abs(dx) > Math.abs(dy)) {
      facing = { x: Math.sign(dx), y: 0 };
    } else if (Math.abs(dy) > Math.abs(dx)) {
      facing = { x: 0, y: Math.sign(dy) };
    }
  }

  // Try X movement
  const newX = x + dx * spd;
  if (!isWall(newX, y, config.player.size)) {
    x = newX;
  }

  // Try Y movement
  const newY = y + dy * spd;
  if (!isWall(x, newY, config.player.size)) {
    y = newY;
  }

  // Invulnerability timer
  if (invulnTimer > 0) invulnTimer -= dt;
}

export function draw() {
  const sz = config.player.size;
  const blink = invulnTimer > 0 && Math.floor(invulnTimer * 10) % 2 === 0;
  const style = config.visual.style || 'geometric';

  ctx.save();
  ctx.translate(x, y);

  const color = blink ? 'rgba(255,255,255,0.5)' : config.colors.player;

  if (style === 'pixel') {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(-sz / 2), Math.round(-sz / 2), sz, sz);
    // Direction indicator
    ctx.fillStyle = '#ffffff';
    const dx = facing.x * sz * 0.3;
    const dy = facing.y * sz * 0.3;
    ctx.fillRect(Math.round(dx - 3), Math.round(dy - 3), 6, 6);
  } else if (style === 'hand-drawn') {
    ctx.fillStyle = color;
    ctx.strokeStyle = config.colors.player;
    ctx.lineWidth = 2;
    const wb = 1.5;
    ctx.beginPath();
    ctx.arc(rnd(wb), rnd(wb), sz / 2 + rnd(wb), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Face direction dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(facing.x * sz * 0.25 + rnd(wb), facing.y * sz * 0.25 + rnd(wb), 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Geometric (default)
    ctx.shadowColor = config.colors.player;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, sz / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Direction indicator triangle
    ctx.fillStyle = '#ffffff';
    const angle = Math.atan2(facing.y, facing.x);
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(sz * 0.5, 0);
    ctx.lineTo(sz * 0.25, -4);
    ctx.lineTo(sz * 0.25, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function rnd(amount) {
  return (Math.random() - 0.5) * 2 * amount;
}

export function takeDamage(amount, knockbackDir) {
  if (invulnTimer > 0) return;
  health -= amount;
  invulnTimer = config.combat.invulnDuration;
  if (health < 0) health = 0;

  // Apply knockback
  if (knockbackDir) {
    const kb = config.combat.knockback;
    const newX = x + knockbackDir.x * kb;
    const newY = y + knockbackDir.y * kb;
    if (!isWall(newX, newY, config.player.size)) {
      x = newX;
      y = newY;
    }
  }
}

export function heal(amount) {
  health = Math.min(config.player.maxHealth, health + amount);
}

export function getPosition() {
  return { x, y };
}

export function getHealth() {
  return health;
}

export function getMaxHealth() {
  return config.player.maxHealth;
}

export function getFacing() {
  return { ...facing };
}

export function isInvuln() {
  return invulnTimer > 0;
}
