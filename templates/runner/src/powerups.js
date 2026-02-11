/**
 * powerups.js - Power-up items and active effect management.
 *
 * Three types: shield, magnet, slowmo.
 * Spawns rarely on the right edge, scrolls left.
 * On collection, activates a timed effect.
 * Draws HUD icons for active effects in the top-right.
 */

import config from './config.js';

let cfg = null;
let pickups = [];
let activeEffects = {};  // { shield: { remaining: ms }, magnet: {...}, slowmo: {...} }
let _canvas = null;
let speed = 0;

const TYPES = [
  { id: 'shield', color: '#4fc3f7', label: 'S', description: 'Shield' },
  { id: 'magnet', color: '#ce93d8', label: 'M', description: 'Magnet' },
  { id: 'slowmo', color: '#81c784', label: 'W', description: 'Slow-Mo' },
];

// ---- Public API ----------------------------------------------------------

export function init(overrideConfig) {
  cfg = overrideConfig || config;
  reset();
}

export function update(dt, playerBounds, gameSpeed) {
  speed = gameSpeed;
  const frameDuration = 1000 / 60 * dt; // approximate ms per frame at 60fps

  const chance = (cfg.powerups && cfg.powerups.spawnChance) || 0.005;

  if (Math.random() < chance * dt) {
    spawn();
  }

  // Move pickups and check collision
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.x -= speed * dt;
    p.bobPhase += dt * 0.08;

    // Off-screen
    if (p.x + p.size < 0) {
      pickups.splice(i, 1);
      continue;
    }

    // Collision check (optionally expanded by magnet)
    let bounds = playerBounds;
    if (activeEffects.magnet) {
      bounds = {
        x: playerBounds.x - 60,
        y: playerBounds.y - 60,
        width: playerBounds.width + 120,
        height: playerBounds.height + 120,
      };
    }

    if (bounds && aabb(bounds, { x: p.x, y: p.y - Math.sin(p.bobPhase) * 3, width: p.size, height: p.size })) {
      activate(p.typeId);
      pickups.splice(i, 1);
    }
  }

  // Tick down active effect timers
  for (const key of Object.keys(activeEffects)) {
    const eff = activeEffects[key];
    if (eff.remaining !== Infinity) {
      eff.remaining -= frameDuration;
      if (eff.remaining <= 0) {
        delete activeEffects[key];
      }
    }
  }
}

export function draw(ctx) {
  if (!cfg) return;

  // Draw pickups in the world
  for (const p of pickups) {
    const drawY = p.y - Math.sin(p.bobPhase) * 3;
    const cx = p.x + p.size / 2;
    const cy = drawY + p.size / 2;

    ctx.save();

    // Glow
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;

    // Outer circle
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, p.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.label, cx, cy);

    ctx.restore();
  }
}

export function drawHUD(ctx, canvas) {
  // Draw active effects in top-right corner
  const keys = Object.keys(activeEffects);
  if (keys.length === 0) return;

  const startX = canvas.width - 20;
  const y = 70; // below the score display
  const iconSize = 24;
  const gap = 8;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const eff = activeEffects[key];
    const typeDef = TYPES.find(t => t.id === key);
    if (!typeDef) continue;

    const x = startX - (iconSize + gap) * (i + 1);

    ctx.save();

    // Icon background
    ctx.fillStyle = typeDef.color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(x + iconSize / 2, y + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typeDef.label, x + iconSize / 2, y + iconSize / 2);

    // Time bar underneath (skip for Infinity duration)
    if (eff.remaining !== Infinity) {
      const durations = (cfg.powerups && cfg.powerups.duration) || {};
      const maxDur = durations[key] || 10000;
      const pct = Math.max(0, eff.remaining / maxDur);

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x, y + iconSize + 3, iconSize, 4);

      ctx.fillStyle = typeDef.color;
      ctx.fillRect(x, y + iconSize + 3, iconSize * pct, 4);
    }

    ctx.restore();
  }
}

export function drawShieldEffect(ctx, playerBounds) {
  if (!activeEffects.shield) return;

  ctx.save();
  ctx.strokeStyle = '#4fc3f7';
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
  const cx = playerBounds.x + playerBounds.width / 2;
  const cy = playerBounds.y + playerBounds.height / 2;
  const r = Math.max(playerBounds.width, playerBounds.height) * 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function getActiveEffects() {
  return { ...activeEffects };
}

export function hasShield() {
  return !!activeEffects.shield;
}

export function consumeShield() {
  delete activeEffects.shield;
}

export function getSpeedMultiplier() {
  return activeEffects.slowmo ? 0.5 : 1;
}

export function setCanvas(canvas) {
  _canvas = canvas;
}

export function reset() {
  pickups = [];
  activeEffects = {};
  speed = 0;
}

// ---- Internal helpers ----------------------------------------------------

function activate(typeId) {
  const durations = (cfg.powerups && cfg.powerups.duration) || {
    shield: Infinity,
    magnet: 15000,
    slowmo: 10000,
  };

  activeEffects[typeId] = {
    remaining: durations[typeId] !== undefined ? durations[typeId] : 10000,
  };
}

function spawn() {
  if (!_canvas) return;

  const groundY = _canvas.height - cfg.player.groundOffset;
  const typeDef = TYPES[Math.floor(Math.random() * TYPES.length)];

  const minY = _canvas.height * 0.1;
  const maxY = groundY - 50;
  const y = minY + Math.random() * (maxY - minY);

  pickups.push({
    x: _canvas.width + 10,
    y,
    size: 26,
    typeId: typeDef.id,
    color: typeDef.color,
    label: typeDef.label,
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
