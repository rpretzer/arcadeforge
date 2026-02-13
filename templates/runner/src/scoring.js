/**
 * scoring.js - Score tracking with combo, near-miss, and collectible-based scoring.
 *
 * Score comes from: collectibles (with combo multiplier), near-misses, small time bonus.
 * High score persisted in localStorage.
 * Optional: floating score popups (juice).
 */

import config from './config.js';

const LS_KEY = 'endlessRunner_highScore';

let cfg = null;
let score = 0;
let highScore = 0;
let combo = 0;
let comboDecayTimer = 0;
let scorePopups = []; // { x, y, value, timer, maxTimer }

// ---- Public API ----------------------------------------------------------

export function init(overrideConfig) {
  cfg = overrideConfig || config;
  loadHighScore();
}

export function update(delta) {
  // Small time bonus (baseline)
  const sc = cfg.scoring || {};
  const timeBonus = (sc.timeBonus ?? 0.5) * (delta / 60);
  score += timeBonus;

  // Combo decay
  const decayTime = (sc.comboDecayTime ?? 1.5) * 60; // frames
  if (combo > 0) {
    comboDecayTimer -= delta;
    if (comboDecayTimer <= 0) {
      combo = 0;
      comboDecayTimer = 0;
    }
  }

  // Update score popups
  const popupSpeed = 80;
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    const p = scorePopups[i];
    p.timer -= delta * (1000 / 60);
    p.y -= popupSpeed * (delta / 60);
    if (p.timer <= 0) scorePopups.splice(i, 1);
  }
}

/** Add points from collectible (returns actual points after combo multiplier). */
export function addCollectible(basePoints, x, y) {
  const sc = cfg.scoring || {};
  const mult = (sc.comboMultiplier ?? 0.5) || 0;
  combo++;
  comboDecayTimer = (sc.comboDecayTime ?? 1.5) * 60;
  const multiplier = 1 + combo * mult;
  const points = Math.round(basePoints * multiplier);
  score += points;

  if (cfg.juice?.scorePop && x != null && y != null) {
    scorePopups.push({
      x, y,
      value: `+${points}`,
      timer: 800,
      maxTimer: 800,
    });
  }

  return points;
}

/** Add near-miss bonus. */
export function addNearMiss(points, x, y) {
  score += points;
  if (cfg.juice?.scorePop && x != null && y != null) {
    scorePopups.push({
      x, y,
      value: `CLOSE! +${points}`,
      timer: 600,
      maxTimer: 600,
    });
  }
}

export function getCombo() {
  return combo;
}

export function draw(ctx, canvas) {
  const padding = 20;

  ctx.fillStyle = cfg.colors.text;
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  ctx.fillText(`Score: ${getScore()}`, canvas.width - padding, padding);

  if (combo > 1) {
    ctx.fillStyle = cfg.colors.accent;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${combo}x COMBO`, canvas.width - padding, padding + 26);
  }

  ctx.font = '16px monospace';
  ctx.fillStyle = cfg.colors.text;
  ctx.globalAlpha = 0.7;
  ctx.fillText(`Best: ${getHighScore()}`, canvas.width - padding, padding + 48);
  ctx.globalAlpha = 1;

  // Score popups
  for (const p of scorePopups) {
    const alpha = Math.max(0, p.timer / p.maxTimer);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.value, p.x, p.y);
    ctx.restore();
  }
}

export function getScore() {
  return Math.floor(score);
}

export function getHighScore() {
  return Math.max(highScore, Math.floor(score));
}

export function reset() {
  saveHighScore();
  score = 0;
  combo = 0;
  comboDecayTimer = 0;
  scorePopups = [];
}

// ---- Internal helpers ----------------------------------------------------

function loadHighScore() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    highScore = stored ? parseInt(stored, 10) : 0;
    if (isNaN(highScore)) highScore = 0;
  } catch {
    highScore = 0;
  }
}

function saveHighScore() {
  const current = Math.floor(score);
  if (current > highScore) {
    highScore = current;
    try {
      localStorage.setItem(LS_KEY, String(highScore));
    } catch {}
  }
}
