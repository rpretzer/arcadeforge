/**
 * Score tracking, combo counter, level progression, high-score persistence,
 * and visual effects (combo text, particles, screen flash).
 */
import CONFIG from './config.js';

let score = 0;
let level = 1;
let combo = 0;            // current chain depth in one cascade sequence
let displayCombo = 0;     // shown on screen (lingers briefly)
let comboTimer = 0;       // ms remaining to show combo text
let highScore = 0;
let scoreToNextLevel = 0;

// Time-bonus tracking
let lastBonusMilestone = 0;
let timeBonusPopup = null; // { timer }

const COMBO_DISPLAY_TIME = 1000; // ms

// Particles
let particles = [];

// Screen flash
let screenFlashAlpha = 0;

export function init() {
  score = 0;
  level = 1;
  combo = 0;
  displayCombo = 0;
  comboTimer = 0;
  scoreToNextLevel = CONFIG.scoring.levelUpThreshold;
  highScore = parseInt(localStorage.getItem('puzzle_highscore') || '0', 10);
  particles = [];
  screenFlashAlpha = 0;
  lastBonusMilestone = 0;
  timeBonusPopup = null;
}

/**
 * Called each time a set of matches is cleared in a single step.
 * @param {number} matchedCount  total number of pieces removed this step
 */
export function addMatch(matchedCount) {
  combo++;
  const points = Math.round(matchedCount * CONFIG.scoring.matchBase * combo);
  score += points;

  displayCombo = combo;
  comboTimer = COMBO_DISPLAY_TIME;

  // Spawn particles at board center
  const count = 6 + combo * 4;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 80 + Math.random() * 60 + combo * 20;
    particles.push({
      x: 0, y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 600 + Math.random() * 400,
      maxLife: 600 + Math.random() * 400,
      color: CONFIG.colors.pieces[Math.floor(Math.random() * CONFIG.colors.pieces.length)],
      size: 3 + Math.random() * 3,
      needsPosition: true,
    });
  }

  // Screen flash at 3x+ combo
  if (combo >= 3) {
    screenFlashAlpha = 0.15;
  }

  // Level-up check
  while (score >= scoreToNextLevel) {
    level++;
    scoreToNextLevel += Math.round(
      CONFIG.scoring.levelUpThreshold * Math.pow(CONFIG.game.difficultyProgression, level - 1)
    );
  }

  // Time bonus check
  const threshold = CONFIG.scoring.timeBonusThreshold || 500;
  if (threshold > 0) {
    const newMilestone = Math.floor(score / threshold);
    if (newMilestone > lastBonusMilestone) {
      const bonuses = newMilestone - lastBonusMilestone;
      lastBonusMilestone = newMilestone;
      if (typeof _timeBonusCallback === 'function') {
        _timeBonusCallback(bonuses * 10);
      }
      timeBonusPopup = { timer: 1200 };
    }
  }

  // Persist high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('puzzle_highscore', String(highScore));
  }
}

let _timeBonusCallback = null;
export function onTimeBonus(cb) {
  _timeBonusCallback = cb;
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

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * (dt / 1000);
    p.y += p.vy * (dt / 1000);
    p.vy += 120 * (dt / 1000); // gravity
  }

  // Fade screen flash
  if (screenFlashAlpha > 0) {
    screenFlashAlpha -= dt / 200;
    if (screenFlashAlpha < 0) screenFlashAlpha = 0;
  }

  // Time bonus popup
  if (timeBonusPopup) {
    timeBonusPopup.timer -= dt;
    if (timeBonusPopup.timer <= 0) {
      timeBonusPopup = null;
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

  // Score -- left
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, y);

  // Level -- right
  ctx.textAlign = 'right';
  ctx.fillText(`Level: ${level}`, canvasWidth - 20, y);

  // High score -- center top
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#888';
  ctx.fillText(`Hi: ${highScore}`, canvasWidth / 2, y - 20);

  // Combo popup with scale animation
  if (displayCombo > 1 && comboTimer > 0) {
    const elapsed = COMBO_DISPLAY_TIME - comboTimer;
    // Scale: ramp from 1.0 to 1.5 in first 300ms, then hold
    const scaleT = Math.min(elapsed / 300, 1);
    const scale = 1.0 + 0.5 * scaleT;
    // Fade: full alpha for first half, then fade out
    const fadeStart = COMBO_DISPLAY_TIME * 0.5;
    const alpha = elapsed < fadeStart ? 1 : 1 - (elapsed - fadeStart) / (COMBO_DISPLAY_TIME - fadeStart);

    const cx = canvasWidth / 2;
    const cy = gridTopY + 150;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = CONFIG.colors.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = CONFIG.colors.accent;
    ctx.shadowBlur = 16;
    ctx.fillText(`${displayCombo}X COMBO!`, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Particles
  const pcx = canvasWidth / 2;
  const pcy = gridTopY + 150;
  for (const p of particles) {
    if (p.needsPosition) {
      p.x = 0;
      p.y = 0;
      p.needsPosition = false;
    }
    const lifeRatio = p.life / p.maxLife;
    ctx.globalAlpha = lifeRatio;
    ctx.fillStyle = p.color;
    ctx.fillRect(pcx + p.x - p.size / 2, pcy + p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Screen flash overlay
  if (screenFlashAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${screenFlashAlpha})`;
    ctx.fillRect(0, 0, canvasWidth, ctx.canvas.height / (window.devicePixelRatio || 1));
  }

  // Time bonus popup
  if (timeBonusPopup) {
    const t = timeBonusPopup.timer / 1200;
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 10;
    const yOff = (1 - t) * 30;
    ctx.fillText('+10s', canvasWidth / 2, gridTopY - 40 - yOff);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function getScore() { return score; }
export function getLevel() { return level; }
export function getHighScore() { return highScore; }
export function getCombo() { return combo; }

export function reset() {
  init();
}
