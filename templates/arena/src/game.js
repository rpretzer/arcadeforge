/**
 * Arena Shooter - Game State Manager
 *
 * Manages three states: menu, playing, gameover.
 * Orchestrates all modules and draws UI overlays.
 */

import config from './config.js';
import { init as initPlayer, update as updatePlayer, draw as drawPlayer, getHealth, reset as resetPlayer } from './player.js';
import { init as initEnemies, update as updateEnemies, draw as drawEnemies, checkBulletCollisions, getWave, reset as resetEnemies } from './enemies.js';
import { init as initProjectiles, update as updateProjectiles, draw as drawProjectiles, fire, reset as resetProjectiles } from './projectiles.js';
import { init as initScoring, update as updateScoring, draw as drawScoring, addScore, addWaveBonus, getScore, getHighScore, reset as resetScoring } from './scoring.js';
import { getPosition } from './player.js';

let state = 'menu'; // 'menu' | 'playing' | 'gameover'
let canvas, ctx;
let prevWave = 1;
let shooting = false;
let finalWave = 1;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  initPlayer(canvas, ctx);
  initEnemies(canvas, ctx);
  initProjectiles(canvas, ctx);
  initScoring(canvas, ctx);
}

export function update(dt, keys, mouse) {
  if (state === 'playing') {
    updatePlayer(dt, keys, mouse);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateScoring(dt);

    // Shooting (hold down mouse)
    if (shooting) {
      const pos = getPosition();
      fire(pos.x, pos.y, mouse.x, mouse.y);
    }

    // Bullet <-> enemy collisions
    const kills = checkBulletCollisions();
    if (kills > 0) {
      addScore(kills * 50);
    }

    // Wave change bonus
    const currentWave = getWave();
    if (currentWave !== prevWave) {
      addWaveBonus(prevWave);
      prevWave = currentWave;
    }

    // Check death
    if (getHealth() <= 0) {
      finalWave = getWave();
      state = 'gameover';
    }
  }
}

export function draw() {
  // Clear
  ctx.fillStyle = config.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw subtle grid
  drawGrid();

  if (state === 'menu') {
    drawMenu();
  } else if (state === 'playing') {
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawScoring();
  } else if (state === 'gameover') {
    // Draw the last frame frozen underneath
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawScoring();
    drawGameOver();
  }
}

export function handleClick(mouse) {
  if (state === 'menu') {
    startGame();
  } else if (state === 'playing') {
    shooting = true;
    // Also fire immediately
    const pos = getPosition();
    fire(pos.x, pos.y, mouse.x, mouse.y);

    // Stop shooting on mouseup
    const stopShooting = () => {
      shooting = false;
      window.removeEventListener('mouseup', stopShooting);
    };
    window.addEventListener('mouseup', stopShooting);
  } else if (state === 'gameover') {
    startGame();
  }
}

export function handleKeyDown(key) {
  if (key === 'r' || key === 'R') {
    if (state === 'gameover') {
      startGame();
    }
  }
  if (key === ' ' || key === 'Enter') {
    if (state === 'menu') {
      startGame();
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function startGame() {
  resetPlayer();
  resetEnemies();
  resetProjectiles();
  resetScoring();
  prevWave = 1;
  shooting = false;
  state = 'playing';
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  const step = 60;
  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMenu() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = config.colors.player;
  ctx.shadowColor = config.colors.player;
  ctx.shadowBlur = 16;
  ctx.fillText(config.game.title.toUpperCase(), cx, cy - 80);

  ctx.shadowBlur = 0;

  // Instructions
  ctx.font = '20px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('WASD to move, Click to shoot', cx, cy);

  ctx.font = '16px monospace';
  ctx.fillStyle = config.colors.accent;
  ctx.fillText('Survive waves of enemies!', cx, cy + 40);

  // Start prompt
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '18px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('[ Click or press Enter to start ]', cx, cy + 100);

  ctx.restore();
}

function drawGameOver() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Dim overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title
  ctx.font = 'bold 44px monospace';
  ctx.fillStyle = config.colors.enemy;
  ctx.shadowColor = config.colors.enemy;
  ctx.shadowBlur = 12;
  ctx.fillText('GAME OVER', cx, cy - 80);
  ctx.shadowBlur = 0;

  // Stats
  ctx.font = '22px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText(`Score: ${getScore()}`, cx, cy - 20);

  ctx.font = '18px monospace';
  ctx.fillStyle = config.colors.accent;
  ctx.fillText(`Wave Reached: ${finalWave}`, cx, cy + 16);

  ctx.fillStyle = config.colors.bullet;
  ctx.fillText(`High Score: ${getHighScore()}`, cx, cy + 50);

  // Restart prompt
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '16px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('Press R or Click to restart', cx, cy + 100);

  ctx.restore();
}
