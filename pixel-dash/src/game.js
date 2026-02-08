/**
 * game.js - Game state manager.
 *
 * States: menu | playing | gameover
 * Draws UI overlays (title screen, game-over screen with score).
 * Listens for restart (R key or click).
 */

import config from './config.js';
import { init as initPlayer, update as updatePlayer, draw as drawPlayer, jump, reset as resetPlayer } from './player.js';
import { init as initObstacles, update as updateObstacles, draw as drawObstacles, checkCollision, reset as resetObstacles } from './obstacles.js';
import { init as initScoring, update as updateScoring, draw as drawScoring, getScore, getHighScore, reset as resetScoring } from './scoring.js';

let state  = 'menu';   // 'menu' | 'playing' | 'gameover'
let cfg    = null;
let _canvas = null;

// ---- Public API ----------------------------------------------------------

export function init(canvas, ctx, overrideConfig) {
  cfg     = overrideConfig || config;
  _canvas = canvas;

  initPlayer(canvas, cfg);
  initObstacles(canvas, cfg);
  initScoring(cfg);
}

export function update(delta, canvas) {
  _canvas = canvas;

  if (state !== 'playing') return;

  updatePlayer(delta, canvas);
  updateObstacles(delta, canvas);
  updateScoring(delta);

  if (checkCollision()) {
    state = 'gameover';
  }
}

export function draw(ctx, canvas) {
  // Background
  ctx.fillStyle = cfg.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground line
  const groundY = canvas.height - cfg.player.groundOffset;
  ctx.strokeStyle = cfg.colors.ground;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();

  // Decorative ground fill
  ctx.fillStyle = cfg.colors.accent;
  ctx.fillRect(0, groundY, canvas.width, cfg.player.groundOffset);

  if (state === 'menu') {
    drawMenu(ctx, canvas);
  } else if (state === 'playing') {
    drawPlayer(ctx);
    drawObstacles(ctx);
    drawScoring(ctx, canvas);
  } else if (state === 'gameover') {
    drawPlayer(ctx);
    drawObstacles(ctx);
    drawScoring(ctx, canvas);
    drawGameOver(ctx, canvas);
  }
}

export function handleInput(type, event) {
  if (type === 'keydown') {
    const code = event.code;

    if (state === 'menu') {
      if (code === 'Space' || code === 'ArrowUp') {
        startGame();
      }
    } else if (state === 'playing') {
      if (code === 'Space' || code === 'ArrowUp') {
        jump();
      }
    } else if (state === 'gameover') {
      if (code === 'KeyR') {
        restartGame();
      }
    }
  }

  if (type === 'click') {
    if (state === 'menu') {
      startGame();
    } else if (state === 'playing') {
      jump();
    } else if (state === 'gameover') {
      restartGame();
    }
  }
}

// ---- Internal helpers ----------------------------------------------------

function startGame() {
  state = 'playing';
  resetPlayer(_canvas);
  resetObstacles();
  resetScoring();
}

function restartGame() {
  startGame();
}

// ---- UI overlays ---------------------------------------------------------

function drawMenu(ctx, canvas) {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  // Title
  ctx.fillStyle    = cfg.colors.text;
  ctx.font         = 'bold 48px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cfg.game.title, cx, cy - 60);

  // Instruction
  ctx.font = '22px sans-serif';
  ctx.fillStyle = cfg.colors.text;
  ctx.fillText('Press SPACE to start', cx, cy + 10);

  // Sub-instruction
  ctx.font = '16px sans-serif';
  ctx.globalAlpha = 0.6;
  ctx.fillText('or tap / click anywhere', cx, cy + 45);
  ctx.globalAlpha = 1;
}

function drawGameOver(ctx, canvas) {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  // Dim overlay
  ctx.fillStyle   = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Game Over text
  ctx.fillStyle    = cfg.colors.player;
  ctx.font         = 'bold 52px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over', cx, cy - 70);

  // Score
  ctx.fillStyle = cfg.colors.text;
  ctx.font      = '28px sans-serif';
  ctx.fillText(`Score: ${getScore()}`, cx, cy - 10);

  // High score
  ctx.font = '22px sans-serif';
  ctx.fillText(`High Score: ${getHighScore()}`, cx, cy + 30);

  // Restart prompt
  ctx.font = '20px sans-serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText('Press R or click to restart', cx, cy + 80);
  ctx.globalAlpha = 1;
}
