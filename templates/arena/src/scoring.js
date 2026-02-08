/**
 * Arena Shooter - Scoring Module
 *
 * Tracks current score, wave number, health bar, and high score
 * (persisted in localStorage).
 */

import config from './config.js';
import { getHealth } from './player.js';
import { getWave } from './enemies.js';

const LS_KEY = 'arena_shooter_high_score';

let score, highScore;
let canvas, ctx;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  highScore = parseInt(localStorage.getItem(LS_KEY), 10) || 0;
  reset();
}

export function reset() {
  score = 0;
}

export function addScore(points) {
  score += points;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(LS_KEY, highScore);
  }
}

export function addWaveBonus(waveNum) {
  const bonus = waveNum * 100;
  addScore(bonus);
}

export function getScore() {
  return score;
}

export function getHighScore() {
  return highScore;
}

export function update(/* dt */) {
  // Reserved for animated score counters, combo timers, etc.
}

export function draw() {
  const w = canvas.width;
  const wave = getWave();
  const health = getHealth();

  ctx.save();
  ctx.shadowBlur = 0;

  // -- Wave number (top-left) ------------------------------------------------
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = config.colors.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`WAVE ${wave}`, 20, 20);

  // -- Score (top-right) -----------------------------------------------------
  ctx.textAlign = 'right';
  ctx.fillStyle = config.colors.text;
  ctx.fillText(`SCORE: ${score}`, w - 20, 20);

  // -- High score (below score) -----------------------------------------------
  ctx.font = '14px monospace';
  ctx.fillStyle = config.colors.accent;
  ctx.fillText(`HI: ${highScore}`, w - 20, 46);

  // -- Health bar (bottom center) --------------------------------------------
  const barW = 200;
  const barH = 14;
  const barX = (w - barW) / 2;
  const barY = canvas.height - 40;
  const hpRatio = health / config.player.maxHealth;

  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, barX, barY, barW, barH, config.visual.cornerRadius);
  ctx.fill();

  // Filled portion
  if (hpRatio > 0) {
    const fillW = barW * hpRatio;
    const hue = hpRatio > 0.5 ? config.colors.accent : config.colors.healthBar;
    ctx.fillStyle = hue;
    roundRect(ctx, barX, barY, fillW, barH, config.visual.cornerRadius);
    ctx.fill();
  }

  // Label
  ctx.font = '11px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.textAlign = 'center';
  ctx.fillText(`HP ${health} / ${config.player.maxHealth}`, w / 2, barY + barH + 14);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
