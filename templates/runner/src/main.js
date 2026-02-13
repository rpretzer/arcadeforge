/**
 * main.js - Entry point.
 *
 * Sets up the canvas, creates the game loop with requestAnimationFrame
 * targeting 60 fps via delta-time, and wires all modules together.
 */

import config from './config.js';
import { init as initGame, update as updateGame, draw as drawGame, handleInput } from './game.js';

// ---- Canvas setup --------------------------------------------------------

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ---- Input forwarding ----------------------------------------------------

window.addEventListener('keydown', (e) => {
  // Prevent page scroll on space / arrows
  if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
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

import { loadAssets } from './assets.js';

// ---- Initialise modules --------------------------------------------------

async function start() {
  await loadAssets();
  if (config.visual?.retroEra) {
    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = 'crisp-edges';
  }
  initGame(canvas, ctx, config);

  requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(loop);
  });
}

// ---- Game loop -----------------------------------------------------------

const TARGET_FPS   = 60;
const FRAME_BUDGET = 1000 / TARGET_FPS;   // ~16.67 ms

let lastTime = 0;

function loop(timestamp) {
  requestAnimationFrame(loop);

  const rawDelta = timestamp - lastTime;
  lastTime = timestamp;

  // Clamp delta to avoid spiral-of-death after tab switch
  const delta = Math.min(rawDelta, FRAME_BUDGET * 3) / FRAME_BUDGET;

  updateGame(delta, canvas);
  drawGame(ctx, canvas);
}

start();
