/**
 * Arena Shooter - Power-ups Module
 *
 * Dropped items from killed enemies with spinning/glow animations.
 * Three types: health, rapidfire, shield.
 */

import config from './config.js';

let drops = [];
let activeEffects = { rapidfire: 0, shield: 0 };
let canvas, ctx;

const TYPES = {
  health:    { color: '#2ecc71', label: 'HP' },
  rapidfire: { color: '#f39c12', label: 'RF' },
  shield:    { color: '#3498db', label: 'SH' },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  reset();
}

export function reset() {
  drops = [];
  activeEffects = { rapidfire: 0, shield: 0 };
}

export function spawnDrop(x, y) {
  const chance = config.powerups?.dropChance ?? 0.2;
  if (Math.random() > chance) return;

  const types = ['health', 'rapidfire', 'shield'];
  const weights = config.powerups?.weights ?? [0.5, 0.3, 0.2];
  const roll = Math.random();
  let cumulative = 0;
  let chosen = 'health';
  for (let i = 0; i < types.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) { chosen = types[i]; break; }
  }

  drops.push({
    x, y,
    type: chosen,
    age: 0,
    lifetime: config.powerups?.lifetime ?? 8,
  });
}

export function update(dt) {
  // Age drops, remove expired
  for (let i = drops.length - 1; i >= 0; i--) {
    drops[i].age += dt;
    if (drops[i].age >= drops[i].lifetime) {
      drops.splice(i, 1);
    }
  }

  // Tick active effect timers
  if (activeEffects.rapidfire > 0) activeEffects.rapidfire -= dt;
  if (activeEffects.shield > 0) activeEffects.shield -= dt;
  if (activeEffects.rapidfire < 0) activeEffects.rapidfire = 0;
  if (activeEffects.shield < 0) activeEffects.shield = 0;
}

export function draw() {
  const sz = config.powerups?.size ?? 14;

  ctx.save();
  for (const d of drops) {
    const t = TYPES[d.type];
    const spin = d.age * 3; // radians
    const glowPulse = 0.4 + 0.6 * Math.abs(Math.sin(d.age * 4));

    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(spin);

    // Glow
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 12 * glowPulse;

    ctx.fillStyle = t.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    if (d.type === 'health') {
      // Green plus sign
      const arm = sz * 0.4;
      const thick = sz * 0.25;
      ctx.fillRect(-arm, -thick / 2, arm * 2, thick);
      ctx.fillRect(-thick / 2, -arm, thick, arm * 2);
    } else if (d.type === 'rapidfire') {
      // Orange arrow pointing right
      ctx.beginPath();
      ctx.moveTo(sz * 0.5, 0);
      ctx.lineTo(-sz * 0.3, -sz * 0.4);
      ctx.lineTo(-sz * 0.1, 0);
      ctx.lineTo(-sz * 0.3, sz * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (d.type === 'shield') {
      // Blue diamond
      ctx.beginPath();
      ctx.moveTo(0, -sz * 0.5);
      ctx.lineTo(sz * 0.4, 0);
      ctx.lineTo(0, sz * 0.5);
      ctx.lineTo(-sz * 0.4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
  ctx.restore();

  // Draw HUD indicators for active effects
  drawHUD();
}

function drawHUD() {
  ctx.save();
  let yOffset = 70; // below high score in top-right
  const x = canvas.width - 20;

  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.font = '13px monospace';

  if (activeEffects.rapidfire > 0) {
    ctx.fillStyle = TYPES.rapidfire.color;
    ctx.fillText(`RAPID ${Math.ceil(activeEffects.rapidfire)}s`, x, yOffset);
    yOffset += 18;
  }

  if (activeEffects.shield > 0) {
    ctx.fillStyle = TYPES.shield.color;
    ctx.fillText(`SHIELD ${Math.ceil(activeEffects.shield)}s`, x, yOffset);
    yOffset += 18;
  }

  ctx.restore();
}

/**
 * Check if player picks up a drop. Returns pickup info or null.
 */
export function checkPickup(px, py, pr) {
  const pickupR = (config.powerups?.size ?? 14) * 0.6;

  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    const dist = Math.hypot(d.x - px, d.y - py);
    if (dist < pr + pickupR) {
      const type = d.type;
      drops.splice(i, 1);
      applyEffect(type);
      return type;
    }
  }
  return null;
}

function applyEffect(type) {
  const duration = config.powerups?.effectDuration ?? 10;
  switch (type) {
    case 'health':
      // Handled externally (heal player)
      break;
    case 'rapidfire':
      activeEffects.rapidfire = duration;
      break;
    case 'shield':
      activeEffects.shield = duration;
      break;
  }
}

export function getActiveEffects() {
  return { ...activeEffects };
}
