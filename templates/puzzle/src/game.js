/**
 * Game state manager.
 * States: menu, playing, gameover.
 * Handles overlays, timer, level progression, and restart.
 */
import CONFIG from './config.js';
import * as Grid from './grid.js';
import * as Input from './input.js';
import * as Scoring from './scoring.js';

const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  GAMEOVER: 'gameover',
};

let currentState = GameState.MENU;
let canvasWidth = 0;
let canvasHeight = 0;
let timeRemaining = 0;  // seconds (only used when timeLimit > 0)
let gridTopY = 0;

// Blinking prompt
let blinkTimer = 0;

let initialized = false;
let paused = false;
let hintTimer = 5000;
let firstInput = false;

export function init(cw, ch) {
  canvasWidth = cw;
  canvasHeight = ch;

  if (!initialized) {
    currentState = GameState.MENU;
    blinkTimer = 0;
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointerForHint);
    window.addEventListener('touchstart', onPointerForHint);
    initialized = true;
  }
}

export function resize(cw, ch) {
  canvasWidth = cw;
  canvasHeight = ch;
}

function onKey(e) {
  if (currentState === GameState.PLAYING) {
    if (!firstInput) {
      firstInput = true;
      hintTimer = 0;
    }
    if (e.key === 'p' || e.key === 'P') {
      paused = !paused;
      return;
    }
  }
  if (e.key === 'r' || e.key === 'R') {
    restartGame();
  }
}

function onPointerForHint() {
  if (currentState === GameState.PLAYING && !firstInput) {
    firstInput = true;
    hintTimer = 0;
  }
}

export function startGame() {
  Scoring.init();
  const offsets = Grid.init(canvasWidth, canvasHeight);
  gridTopY = offsets.gridOffsetY;
  Input.reset();

  if (CONFIG.game.timeLimit > 0) {
    timeRemaining = CONFIG.game.timeLimit;
    Scoring.onTimeBonus((seconds) => {
      timeRemaining += seconds;
    });
  }

  paused = false;
  hintTimer = 5000;
  firstInput = false;
  currentState = GameState.PLAYING;
}

function restartGame() {
  startGame();
}

export function getState() {
  return currentState;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export function update(dt) {
  blinkTimer += dt;

  switch (currentState) {
    case GameState.MENU:
      updateMenu(dt);
      break;

    case GameState.PLAYING:
      updatePlaying(dt);
      break;

    case GameState.GAMEOVER:
      updateGameOver(dt);
      break;
  }
}

function updateMenu(_dt) {
  const click = Input.getClickedCell();
  if (click) {
    startGame();
  }
}

function updatePlaying(dt) {
  if (paused) return;

  // Count down hint timer (dt is in ms)
  if (hintTimer > 0 && !firstInput) {
    hintTimer -= dt;
  }

  // Timer
  if (CONFIG.game.timeLimit > 0) {
    timeRemaining -= dt / 1000;
    if (timeRemaining <= 0) {
      timeRemaining = 0;
      currentState = GameState.GAMEOVER;
      return;
    }
  }

  Grid.update(dt);
  Scoring.update(dt);
}

function updateGameOver(_dt) {
  const click = Input.getClickedCell();
  if (click) {
    restartGame();
  }
}

// ---------------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------------

export function draw(ctx) {
  // Clear
  ctx.fillStyle = CONFIG.colors.background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  switch (currentState) {
    case GameState.MENU:
      drawMenu(ctx);
      break;

    case GameState.PLAYING:
      drawPlaying(ctx);
      drawControlHints(ctx);
      if (paused) {
        drawPauseOverlay(ctx);
      }
      break;

    case GameState.GAMEOVER:
      // Draw grid dimmed behind overlay
      drawPlaying(ctx, true);
      drawGameOver(ctx);
      break;
  }
}

// --- Menu ---

function drawMenu(ctx) {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  // Title
  ctx.fillStyle = CONFIG.colors.accent;
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = CONFIG.colors.accent;
  ctx.shadowBlur = 20;
  ctx.fillText(CONFIG.game.title, cx, cy - 80);
  ctx.shadowBlur = 0;

  // Decorative pieces
  const pieceColors = CONFIG.colors.pieces;
  const size = 36;
  const startX = cx - (pieceColors.length * (size + 8)) / 2 + size / 2;
  for (let i = 0; i < pieceColors.length; i++) {
    ctx.fillStyle = pieceColors[i];
    ctx.shadowColor = pieceColors[i];
    ctx.shadowBlur = 8;
    roundRect(ctx, startX + i * (size + 8), cy - 20, size, size, CONFIG.visual.cornerRadius);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Instructions
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = '18px monospace';
  ctx.fillText('Click to swap pieces, match 3 to score', cx, cy + 40);

  // Blinking start prompt
  const alpha = 0.5 + 0.5 * Math.sin(blinkTimer / 500 * Math.PI);
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 22px monospace';
  ctx.fillText('Click anywhere to start', cx, cy + 90);
  ctx.globalAlpha = 1;

  // High score
  const hi = Scoring.getHighScore();
  if (hi > 0) {
    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText(`High Score: ${hi}`, cx, cy + 140);
  }
}

// --- Playing ---

function drawPlaying(ctx, dimmed = false) {
  if (dimmed) {
    ctx.globalAlpha = 0.3;
  }

  Grid.draw(ctx);
  Scoring.draw(ctx, canvasWidth, gridTopY);

  // Timer progress bar
  if (CONFIG.game.timeLimit > 0) {
    const ratio = Math.min(timeRemaining / CONFIG.game.timeLimit, 1);
    const barMargin = 20;
    const barW = canvasWidth - barMargin * 2;
    const barH = 10;
    const barY = 8;

    // Color based on remaining ratio
    let barColor;
    if (ratio > 0.5) barColor = '#22c55e';
    else if (ratio > 0.25) barColor = '#eab308';
    else barColor = '#ef4444';

    // Pulse when under 10 seconds
    let barAlpha = 1;
    if (timeRemaining < 10) {
      barAlpha = 0.5 + 0.5 * Math.abs(Math.sin(blinkTimer / 250 * Math.PI));
    }

    // Background track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(ctx, barMargin, barY, barW, barH, 4);
    ctx.fill();

    // Filled portion
    ctx.save();
    ctx.globalAlpha = barAlpha;
    ctx.fillStyle = barColor;
    const fillW = Math.max(0, barW * ratio);
    if (fillW > 0) {
      roundRect(ctx, barMargin, barY, fillW, barH, 4);
      ctx.fill();
    }
    ctx.restore();

    // Time text
    const secs = Math.ceil(timeRemaining);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    const timeStr = `${mins}:${String(s).padStart(2, '0')}`;
    ctx.fillStyle = timeRemaining < 10 ? '#ef4444' : CONFIG.colors.text;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(timeStr, canvasWidth / 2, barY + barH + 4);
  }

  if (dimmed) {
    ctx.globalAlpha = 1;
  }
}

// --- Pause & Hints ---

function drawPauseOverlay(ctx) {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', cx, cy - 20);

  ctx.font = '22px monospace';
  ctx.fillText('Press P to resume', cx, cy + 30);
  ctx.restore();
}

function drawControlHints(ctx) {
  if (hintTimer <= 0 || currentState !== GameState.PLAYING || paused) return;

  let alpha = 1;
  if (hintTimer < 1000) {
    alpha = hintTimer / 1000;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Click to swap | P: Pause', 12, canvasHeight - 12);
  ctx.restore();
}

// --- Game Over ---

function drawGameOver(ctx) {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Title
  ctx.fillStyle = CONFIG.colors.accent;
  ctx.font = 'bold 44px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over', cx, cy - 80);

  // Score
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = 'bold 28px monospace';
  ctx.fillText(`Score: ${Scoring.getScore()}`, cx, cy - 20);

  // Level
  ctx.font = '22px monospace';
  ctx.fillText(`Level: ${Scoring.getLevel()}`, cx, cy + 20);

  // High score
  ctx.fillStyle = '#ffaa00';
  ctx.font = '20px monospace';
  ctx.fillText(`High Score: ${Scoring.getHighScore()}`, cx, cy + 60);

  // Restart prompt
  const alpha = 0.5 + 0.5 * Math.sin(blinkTimer / 500 * Math.PI);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = CONFIG.colors.text;
  ctx.font = 'bold 20px monospace';
  ctx.fillText('Click or press R to restart', cx, cy + 110);
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Utility (duplicated from grid for overlay drawing)
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
