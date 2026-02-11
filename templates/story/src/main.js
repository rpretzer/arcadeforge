/**
 * main.js - Entry point.
 *
 * Sets up the canvas (max 1200x800, centered), creates the game loop
 * with requestAnimationFrame, and wires input to the game module.
 */

import config from './config.js';
import { loadAssets } from './assets.js';
import {
  init as initGame,
  update as updateGame,
  draw as drawGame,
  handleInput,
  handleMouseMove,
} from './game.js';

// ---- Canvas setup --------------------------------------------------------

const MAX_W = 1200;
const MAX_H = 800;

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  const w = Math.min(window.innerWidth,  MAX_W);
  const h = Math.min(window.innerHeight, MAX_H);
  canvas.width  = w;
  canvas.height = h;

  // Center on page
  canvas.style.margin = 'auto';
  canvas.style.position = 'absolute';
  canvas.style.left = '0';
  canvas.style.right = '0';
  canvas.style.top = ((window.innerHeight - h) / 2) + 'px';
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ---- Input forwarding ----------------------------------------------------

window.addEventListener('keydown', (e) => {
  if (['Space', 'Enter', 'Escape'].includes(e.code)) {
    e.preventDefault();
  }
  handleInput('keydown', e);
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  handleInput('click', { x, y });
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  handleMouseMove(x, y);
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  handleInput('click', { x, y });
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

const TARGET_FPS   = 60;
const FRAME_BUDGET = 1000 / TARGET_FPS;

let lastTime = 0;

function loop(timestamp) {
  requestAnimationFrame(loop);

  const rawDelta = timestamp - lastTime;
  lastTime = timestamp;

  const dt = Math.min(rawDelta, FRAME_BUDGET * 3) / 1000; // seconds

  updateGame(dt, canvas);
  drawGame(ctx, canvas);
}

start();
