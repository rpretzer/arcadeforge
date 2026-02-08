/**
 * Score tracking, combo counter, level progression, and high-score persistence.
 */
import CONFIG from './config.js';

let score = 0;
let level = 1;
let combo = 0;            // current chain depth in one cascade sequence
let displayCombo = 0;     // shown on screen (lingers briefly)
let comboTimer = 0;       // ms remaining to show combo text
let highScore = 0;
let scoreToNextLevel = 0;

const COMBO_DISPLAY_TIME = 1200; // ms

export function init() {
  score = 0;
  level = 1;
  combo = 0;
  displayCombo = 0;
  comboTimer = 0;
  scoreToNextLevel = CONFIG.scoring.levelUpThreshold;
  highScore = parseInt(localStorage.getItem('puzzle_highscore') || '0', 10);
}

/**
 * Called each time a set of matches is cleared in a single step.
 * @param {number} matchedCount  total number of pieces removed this step
 */
export function addMatch(matchedCount) {
  combo++;
  const multiplier = Math.pow(CONFIG.scoring.comboMultiplier, combo - 1);
  const points = Math.round(matchedCount * CONFIG.scoring.matchBase * multiplier);
  score += points;

  displayCombo = combo;
  comboTimer = COMBO_DISPLAY_TIME;

  // Level-up check
  while (score >= scoreToNextLevel) {
    level++;
    scoreToNextLevel += Math.round(
      CONFIG.scoring.levelUpThreshold * Math.pow(CONFIG.game.difficultyProgression, level - 1)
    );
  }

  // Persist high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('puzzle_highscore', String(highScore));
  }
}

/** Reset combo counter (called when a cascade sequence finishes with no new matches). */
export function resetCombo() {
  combo = 0;
}

export function update(dt) {
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) {
      comboTimer = 0;
      displayCombo = 0;
    }
  }
}

/**
 * Draw the score HUD above the grid.
 */
export function draw(ctx, canvasWidth, gridTopY) {
  const y = gridTopY - 16;

  ctx.fillStyle = CONFIG.colors.text;
  ctx.textBaseline = 'bottom';

  // Score — left
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, y);

  // Level — right
  ctx.textAlign = 'right';
  ctx.fillText(`Level: ${level}`, canvasWidth - 20, y);

  // High score — center top
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#888';
  ctx.fillText(`Hi: ${highScore}`, canvasWidth / 2, y - 20);

  // Combo pop
  if (displayCombo > 1) {
    const alpha = Math.min(1, comboTimer / 300);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = CONFIG.colors.accent;
    ctx.textAlign = 'center';
    ctx.fillText(`Combo x${displayCombo}!`, canvasWidth / 2, y);
    ctx.globalAlpha = 1;
  }
}

export function getScore() { return score; }
export function getLevel() { return level; }
export function getHighScore() { return highScore; }

export function reset() {
  init();
}
