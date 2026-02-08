/**
 * scoring.js - Score tracking.
 *
 * Score increases over time while playing.
 * High score persisted in localStorage.
 */

import config from './config.js';

const LS_KEY = 'endlessRunner_highScore';

let cfg       = null;
let score     = 0;
let highScore = 0;

// ---- Public API ----------------------------------------------------------

export function init(overrideConfig) {
  cfg = overrideConfig || config;
  loadHighScore();
}

export function update(delta) {
  score += delta;
}

export function draw(ctx, canvas) {
  const padding = 20;

  ctx.fillStyle    = cfg.colors.text;
  ctx.font         = 'bold 22px monospace';
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'top';

  ctx.fillText(`Score: ${getScore()}`, canvas.width - padding, padding);

  ctx.font      = '16px monospace';
  ctx.globalAlpha = 0.7;
  ctx.fillText(`Best: ${getHighScore()}`, canvas.width - padding, padding + 28);
  ctx.globalAlpha = 1;
}

export function getScore() {
  return Math.floor(score);
}

export function getHighScore() {
  return Math.max(highScore, Math.floor(score));
}

export function reset() {
  // Persist high score before resetting
  saveHighScore();
  score = 0;
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
    } catch {
      // localStorage may be unavailable; silently ignore
    }
  }
}
