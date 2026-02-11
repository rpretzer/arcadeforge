/**
 * collectibles.js - Collectible items (coins, stars).
 *
 * Spawns collectible items at random heights on the right edge.
 * They scroll left at game speed. AABB collision with the player
 * awards points and removes the item.
 */

import config from './config.js';

let cfg = null;
let items = [];
let collected = 0;
let speed = 0;
let elapsed = 0;
let _canvas = null;

// ---- Public API ----------------------------------------------------------

export function init(overrideConfig) {
  cfg = overrideConfig || config;
  reset();
}

export function update(dt, playerBounds, gameSpeed) {
  speed = gameSpeed;
  elapsed += dt;

  const chance = (cfg.collectibles && cfg.collectibles.spawnChance) || 0.03;

  if (Math.random() < chance * dt) {
    spawn();
  }

  const points = [];

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.x -= speed * dt;

    // Animate bob
    item.bobPhase += dt * 0.1;

    // Off-screen removal
    if (item.x + item.size < 0) {
      items.splice(i, 1);
      continue;
    }

    // AABB collision with player
    if (playerBounds && aabb(playerBounds, {
      x: item.x,
      y: item.y - Math.sin(item.bobPhase) * 4,
      width: item.size,
      height: item.size,
    })) {
      points.push(item.points);
      collected++;
      items.splice(i, 1);
    }
  }

  return points;
}

export function draw(ctx) {
  if (!cfg) return;

  for (const item of items) {
    const drawY = item.y - Math.sin(item.bobPhase) * 4;
    ctx.save();

    if (item.type === 'coin') {
      // Gold circle
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.x + item.size / 2, drawY + item.size / 2, item.size / 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(item.x + item.size / 2 - 2, drawY + item.size / 2 - 2, item.size / 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Star shape
      drawStar(ctx, item.x + item.size / 2, drawY + item.size / 2, 5, item.size / 2, item.size / 4, item.color);
    }

    ctx.restore();
  }
}

export function getCollected() {
  const c = collected;
  collected = 0;
  return c;
}

export function reset() {
  items = [];
  collected = 0;
  speed = 0;
  elapsed = 0;
}

export function setCanvas(canvas) {
  _canvas = canvas;
}

// ---- Internal helpers ----------------------------------------------------

function spawn() {
  if (!_canvas) return;

  const types = (cfg.collectibles && cfg.collectibles.types) || [
    { id: 'coin', points: 10, color: '#ffd700', size: 18 },
    { id: 'star', points: 25, color: '#ff6b9d', size: 20 },
  ];

  const groundY = _canvas.height - cfg.player.groundOffset;
  const type = types[Math.floor(Math.random() * types.length)];

  // Random y between top quarter and just above ground
  const minY = _canvas.height * 0.15;
  const maxY = groundY - 40;
  const y = minY + Math.random() * (maxY - minY);

  items.push({
    x: _canvas.width + 10,
    y,
    size: type.size || 18,
    type: type.id,
    color: type.color,
    points: type.points,
    bobPhase: Math.random() * Math.PI * 2,
  });
}

function aabb(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;

  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = rot + step * i;
    const sx = cx + Math.cos(angle) * r;
    const sy = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }

  ctx.closePath();
  ctx.fill();
}
