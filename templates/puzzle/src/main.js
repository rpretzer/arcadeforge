/**
 * Entry point for the Match-3 Puzzle game.
 * Sets up responsive canvas, initialises modules, and runs the game loop.
 */
import CONFIG from './config.js';
import * as Game from './game.js';
import * as Input from './input.js';
import * as Scoring from './scoring.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---------------------------------------------------------------------------
// Responsive canvas sizing
// ---------------------------------------------------------------------------

function resize() {
  const { width, height, cellSize, padding } = CONFIG.grid;
  const total = cellSize + padding;

  // Minimum canvas size to fit the grid + HUD
  const minW = width * total + 60;
  const minH = height * total + 160;

  const dpr = window.devicePixelRatio || 1;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // Use the smaller of screen vs desired, but at least minW/minH
  const w = Math.max(minW, Math.min(screenW, 600));
  const h = Math.max(minH, Math.min(screenH, 700));

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { w, h };
}

import { loadAssets } from './assets.js';

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

async function start() {
  await loadAssets();
  const { w, h } = resize();

  Scoring.init();
  Game.init(w, h);

  // Input needs grid offsets; we pass dummy values now and update after grid init.
  // Grid.init() is called when Game transitions to PLAYING, which calls Input.updateOffsets.
  Input.init(canvas, 0, 0);

  window.addEventListener('resize', () => {
    const { w: nw, h: nh } = resize();
    // Update canvas dimensions without resetting game state
    Game.resize(nw, nh);
  });

  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min(now - lastTime, 50); // cap delta to avoid spiral of death
  lastTime = now;

  Game.update(dt);
  Game.draw(ctx);

  requestAnimationFrame(loop);
}

start();
