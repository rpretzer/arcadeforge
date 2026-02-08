/**
 * obstacles.js - Obstacle spawning and management.
 *
 * Spawns obstacles at random intervals based on config frequency.
 * Obstacles move left at the current game speed (which increases over time).
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

  // Move obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    ob.x -= speed * delta;

    // Remove if off-screen
    if (ob.x + ob.width < 0) {
      obstacles.splice(i, 1);
    }
  }
}

export function draw(ctx) {
  const r = Math.min(cfg.visual.cornerRadius / 2, 4);
  const sprite = getAsset('obstacle');

  for (const ob of obstacles) {
    if (sprite) {
      ctx.drawImage(sprite, ob.x, ob.y, ob.width, ob.height);
      continue;
    }

    ctx.save();
    ctx.shadowColor   = cfg.colors.obstacle;
    ctx.shadowBlur    = cfg.visual.shadowBlur / 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = cfg.colors.obstacle;
    roundRect(ctx, ob.x, ob.y, ob.width, ob.height, r);
    ctx.fill();
    ctx.restore();

    // Highlight edge
    ctx.strokeStyle = cfg.colors.ground;
    ctx.lineWidth   = 1;
    roundRect(ctx, ob.x, ob.y, ob.width, ob.height, r);
    ctx.stroke();
  }
}

export function checkCollision() {
  const hb = getHitbox();

  for (const ob of obstacles) {
    if (aabb(hb, ob)) {
      return true;
    }
  }
  return false;
}

export function reset() {
  obstacles  = [];
  speed      = cfg.physics.baseSpeed;
  elapsed    = 0;
  spawnTimer = 0;
}

// ---- Internal helpers ----------------------------------------------------

function spawn(canvas) {
  const groundY = canvas.height - cfg.player.groundOffset;
  const h = cfg.obstacles.minHeight +
            Math.random() * (cfg.obstacles.maxHeight - cfg.obstacles.minHeight);

  obstacles.push({
    x:      canvas.width,
    y:      groundY - h,
    width:  cfg.obstacles.width,
    height: h,
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
