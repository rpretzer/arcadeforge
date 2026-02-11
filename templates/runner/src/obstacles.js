/**
 * obstacles.js - Obstacle spawning and management.
 *
 * Spawns obstacles at random intervals based on config frequency.
 * Obstacles move left at the current game speed (which increases over time).
 * Supports multiple obstacle types: block, spike, moving.
 * AABB collision detection against the player hitbox.
 */

import config from './config.js';
import { getHitbox } from './player.js';
import { getAsset } from './assets.js';

let cfg       = null;
let _canvas   = null;
let obstacles  = [];
let speed      = 0;
let elapsed    = 0;   // frames elapsed (used for speed ramp)
let spawnTimer = 0;   // frames since last spawn

// ---- Public API ----------------------------------------------------------

export function init(canvas, overrideConfig) {
  cfg     = overrideConfig || config;
  _canvas = canvas;
  reset();
}

export function update(delta, canvas) {
  _canvas = canvas;
  elapsed += delta;

  // Increase speed over time
  speed = cfg.physics.baseSpeed + elapsed * cfg.physics.speedIncrement;

  spawnTimer += delta;

  // Minimum gap expressed in frames at current speed
  const minGapFrames = cfg.obstacles.gap / speed;

  // Try to spawn
  if (spawnTimer >= minGapFrames && Math.random() < cfg.obstacles.frequency) {
    spawn(canvas);
    spawnTimer = 0;
  }

  // Move obstacles and update moving types
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.x -= speed * delta;

    // Oscillate moving obstacles vertically
    if (ob.typeId === 'moving') {
      ob.sinePhase += delta * 0.08;
      ob.yOffset = Math.sin(ob.sinePhase) * 30;
    }

    // Remove if off-screen
    if (ob.x + ob.width < 0) {
      obstacles.splice(i, 1);
    }
  }
}

export function draw(ctx) {
  const sprite = getAsset('obstacle');
  const style = cfg.visual.style || 'geometric';

  for (const ob of obstacles) {
    const drawY = ob.y + (ob.yOffset || 0);

    if (sprite && ob.typeId === 'block') {
      ctx.drawImage(sprite, ob.x, drawY, ob.width, ob.height);
      continue;
    }

    ctx.save();

    const color = ob.color || cfg.colors.obstacle;

    if (ob.typeId === 'spike') {
      // Triangle shape
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(ob.x + ob.width / 2, drawY);
      ctx.lineTo(ob.x + ob.width, drawY + ob.height);
      ctx.lineTo(ob.x, drawY + ob.height);
      ctx.closePath();
      ctx.fill();

      // Outline
      ctx.strokeStyle = cfg.colors.ground;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (ob.typeId === 'moving') {
      // Moving obstacle: draw with a glow to distinguish
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = color;
      const r = Math.min(4, ob.width / 2, ob.height / 2);
      roundRect(ctx, ob.x, drawY, ob.width, ob.height, r);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = cfg.colors.ground;
      ctx.lineWidth = 1;
      roundRect(ctx, ob.x, drawY, ob.width, ob.height, r);
      ctx.stroke();
    } else if (style === 'pixel') {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(ob.x), Math.round(drawY), ob.width, ob.height);
      ctx.strokeStyle = cfg.colors.ground;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(ob.x), Math.round(drawY), ob.width, ob.height);
    } else if (style === 'hand-drawn') {
      ctx.globalAlpha = 0.85 + Math.random() * 0.15;
      ctx.fillStyle = color;
      ctx.strokeStyle = cfg.colors.ground;
      ctx.lineWidth = 3;
      const wb = 2;
      ctx.beginPath();
      ctx.moveTo(ob.x + rnd(wb), drawY + rnd(wb));
      ctx.lineTo(ob.x + ob.width + rnd(wb), drawY + rnd(wb));
      ctx.lineTo(ob.x + ob.width + rnd(wb), drawY + ob.height + rnd(wb));
      ctx.lineTo(ob.x + rnd(wb), drawY + ob.height + rnd(wb));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Geometric (default): rounded rect with shadow
      const r = Math.min(cfg.visual.cornerRadius / 2, 4);
      ctx.shadowColor   = color;
      ctx.shadowBlur    = cfg.visual.shadowBlur / 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = color;
      roundRect(ctx, ob.x, drawY, ob.width, ob.height, r);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = cfg.colors.ground;
      ctx.lineWidth   = 1;
      roundRect(ctx, ob.x, drawY, ob.width, ob.height, r);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export function checkCollision() {
  const hb = getHitbox();

  for (const ob of obstacles) {
    const drawY = ob.y + (ob.yOffset || 0);
    const hitbox = { x: ob.x, y: drawY, width: ob.width, height: ob.height };
    if (aabb(hb, hitbox)) {
      return true;
    }
  }
  return false;
}

export function getSpeed() {
  return speed;
}

export function reset() {
  obstacles  = [];
  speed      = cfg.physics.baseSpeed;
  elapsed    = 0;
  spawnTimer = 0;
}

// ---- Internal helpers ----------------------------------------------------

function rnd(amount) {
  return (Math.random() - 0.5) * 2 * amount;
}

function spawn(canvas) {
  const groundY = canvas.height - cfg.player.groundOffset;
  const types = (cfg.obstacles.types && cfg.obstacles.types.length > 0)
    ? cfg.obstacles.types
    : null;

  let typeId = 'block';
  let w = cfg.obstacles.width;
  let color = cfg.colors.obstacle;
  let hMin = cfg.obstacles.minHeight;
  let hMax = cfg.obstacles.maxHeight;

  if (types) {
    const picked = types[Math.floor(Math.random() * types.length)];
    typeId = picked.id;
    w = picked.width || cfg.obstacles.width;
    color = picked.color || cfg.colors.obstacle;
    if (picked.heightRange) {
      hMin = picked.heightRange[0];
      hMax = picked.heightRange[1];
    }
  }

  const h = hMin + Math.random() * (hMax - hMin);

  obstacles.push({
    x:         canvas.width,
    y:         groundY - h,
    width:     w,
    height:    h,
    typeId,
    color,
    sinePhase: Math.random() * Math.PI * 2,
    yOffset:   0,
  });
}

function aabb(a, b) {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
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
