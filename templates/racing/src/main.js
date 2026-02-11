/**
 * main.js - Entry point for the Racing template.
 *
 * Sets up canvas, game loop, and input forwarding.
 */

import config from './config.js';
import { init as initGame, update as updateGame, draw as drawGame, handleInput } from './game.js';
import { loadAssets } from './assets.js';

// ---- Canvas setup --------------------------------------------------------

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ---- Input forwarding ----------------------------------------------------

window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  handleInput('keydown', e);
});

window.addEventListener('keyup', (e) => {
  handleInput('keyup', e);
});

canvas.addEventListener('click', (e) => {
  handleInput('click', e);
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleInput('click', e);
}, { passive: false });

// ---- Initialise modules --------------------------------------------------

async function start() {
  await loadAssets();
  initGame(canvas, ctx, config);

  requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(loop);
  });
}

// ---- Game loop -----------------------------------------------------------

const TARGET_FPS = 60;
const FRAME_BUDGET = 1000 / TARGET_FPS;

let lastTime = 0;

function loop(timestamp) {
  requestAnimationFrame(loop);

  const rawDelta = timestamp - lastTime;
  lastTime = timestamp;

  const delta = Math.min(rawDelta, FRAME_BUDGET * 3) / FRAME_BUDGET;

  updateGame(delta, canvas);
  drawGame(ctx, canvas);
}

start();
