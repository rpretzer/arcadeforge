/**
 * main.js - RPG Adventure Entry Point
 *
 * Sets up the responsive canvas, initializes modules, and runs
 * the core game loop with requestAnimationFrame and delta-time.
 */

import config from './config.js';
import { init as initGame, update as updateGame, draw as drawGame, handleKeyDown, handleKeyUp, handleClick } from './game.js';
import { loadAssets } from './assets.js';

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = Math.min(window.innerWidth, config.map.roomWidth);
  canvas.height = Math.min(window.innerHeight, config.map.roomHeight);

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
const keys = {};
const mouse = { x: 0, y: 0 };

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  handleKeyDown(e.code);
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  handleKeyUp(e.code);
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  handleClick(mouse);
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

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
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  updateGame(dt, keys, mouse);
  drawGame();

  requestAnimationFrame(loop);
}

start();
