/**
 * Arena Shooter - Entry Point
 *
 * Sets up the responsive canvas, initializes every module, and runs
 * the core game loop with requestAnimationFrame and delta-time.
 */

import config from './config.js';
import { init as initGame, update as updateGame, draw as drawGame, handleClick, handleKeyDown } from './game.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = Math.min(window.innerWidth, config.arena.width);
  canvas.height = Math.min(window.innerHeight, config.arena.height);

  // Center the canvas if it's smaller than the viewport
  if (canvas.width < window.innerWidth || canvas.height < window.innerHeight) {
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
  } else {
    canvas.style.position = '';
    canvas.style.left = '';
    canvas.style.top = '';
    canvas.style.transform = '';
  }
}
window.addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------------------
// Input forwarding
// ---------------------------------------------------------------------------
const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  handleClick(mouse);
});

window.addEventListener('keydown', (e) => {
  handleKeyDown(e.key);
});

// Track pressed keys for continuous movement
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

import { loadAssets } from './assets.js';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
async function start() {
  await loadAssets();
  initGame(canvas, ctx);
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05); // cap to avoid spiral of death
  lastTime = now;

  updateGame(dt, keys, mouse);
  drawGame();

  requestAnimationFrame(loop);
}

start();
