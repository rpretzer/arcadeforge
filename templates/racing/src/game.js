/**
 * game.js - Game state manager for Racing template.
 *
 * States: menu | countdown | racing | finished
 * Manages the 3-2-1-GO countdown, HUD (speedometer, lap counter,
 * position, minimap), and finish screen.
 */

import config from './config.js';
import { buildTrack, drawTrack, trackToWorld } from './track.js';
import { init as initVehicle, update as updateVehicle, draw as drawVehicle,
         getWorldPos, getTrackPos, getLap, getSpeed, getTopSpeed,
         getLateralOffset, getRaceTime, slowDown, reset as resetVehicle } from './vehicle.js';
import { init as initOpponents, update as updateOpponents, draw as drawOpponents,
         checkCollision, getPositions, getOpponentData, reset as resetOpponents } from './opponents.js';
import { init as initMinimap, draw as drawMinimap } from './minimap.js';

let state = 'menu';    // 'menu' | 'countdown' | 'racing' | 'finished'
let _canvas = null;
let paused = false;

// Countdown
let countdownTimer = 0;
const COUNTDOWN_DURATION = 4000; // 3-2-1-GO (1s each)

// Input state
const keys = { up: false, down: false, left: false, right: false };

// Race result
let finishPosition = 1;
let finishTime = 0;

// ---- Public API ----------------------------------------------------------

export function init(canvas, ctx, overrideConfig) {
  _canvas = canvas;
  buildTrack();
  initVehicle();
  initOpponents();
  initMinimap();
}

export function update(delta, canvas) {
  _canvas = canvas;

  if (state === 'countdown') {
    countdownTimer -= delta * (1000 / 60);
    if (countdownTimer <= 0) {
      state = 'racing';
    }
    return;
  }

  if (state !== 'racing' || paused) return;

  // Update player vehicle
  updateVehicle(delta, keys, true);

  // Update opponents
  const playerTP = getTrackPos();
  const playerLap = getLap();
  const playerSpeed = getSpeed();
  updateOpponents(delta, playerTP, playerLap, playerSpeed);

  // Check collision with opponents
  const pos = getWorldPos();
  checkCollision(pos.x, pos.y, slowDown);

  // Check race finish
  if (getLap() >= config.race.lapCount) {
    state = 'finished';
    const positions = getPositions(getTrackPos(), getLap());
    finishPosition = positions.findIndex(r => r.id === 'player') + 1;
    finishTime = getRaceTime();
  }
}

export function draw(ctx, canvas) {
  // Camera: center on player
  const playerPos = getWorldPos();
  const camX = playerPos.x - canvas.width / 2;
  const camY = playerPos.y - canvas.height / 2;

  // Background
  ctx.fillStyle = config.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state === 'menu') {
    drawMenu(ctx, canvas);
    return;
  }

  // Draw track, vehicles
  drawTrack(ctx, camX, camY);
  drawOpponents(ctx, camX, camY);
  drawVehicle(ctx, camX, camY);

  if (state === 'countdown') {
    drawCountdown(ctx, canvas);
  } else if (state === 'racing') {
    drawHUD(ctx, canvas);
    if (paused) drawPauseOverlay(ctx, canvas);
  } else if (state === 'finished') {
    drawHUD(ctx, canvas);
    drawFinishScreen(ctx, canvas);
  }
}

export function handleInput(type, event) {
  if (type === 'keydown') {
    const code = event.code;

    if (code === 'ArrowUp' || code === 'KeyW') keys.up = true;
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = true;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;

    if (state === 'menu') {
      if (code === 'Space' || code === 'Enter') startRace();
    } else if (state === 'racing') {
      if (code === 'KeyP') paused = !paused;
    } else if (state === 'finished') {
      if (code === 'KeyR') restartRace();
    }
  }

  if (type === 'keyup') {
    const code = event.code;
    if (code === 'ArrowUp' || code === 'KeyW') keys.up = false;
    if (code === 'ArrowDown' || code === 'KeyS') keys.down = false;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
  }

  if (type === 'click') {
    if (state === 'menu') startRace();
    else if (state === 'finished') restartRace();
  }
}

// ---- Internal helpers ----------------------------------------------------

function startRace() {
  state = 'countdown';
  countdownTimer = COUNTDOWN_DURATION;
  paused = false;
  keys.up = keys.down = keys.left = keys.right = false;
  resetVehicle();
  resetOpponents();
}

function restartRace() {
  startRace();
}

// ---- UI overlays ---------------------------------------------------------

function drawMenu(ctx, canvas) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = config.colors.text;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.game.title, cx, cy - 60);

  ctx.font = '22px sans-serif';
  ctx.fillText('Press SPACE to race', cx, cy + 10);

  ctx.font = '16px sans-serif';
  ctx.globalAlpha = 0.6;
  ctx.fillText(`${config.race.lapCount} laps | ${config.opponents.count} opponent${config.opponents.count !== 1 ? 's' : ''}`, cx, cy + 45);
  ctx.fillText('Arrow keys / WASD to drive', cx, cy + 70);
  ctx.globalAlpha = 1;
}

function drawCountdown(ctx, canvas) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const secondsLeft = Math.ceil(countdownTimer / 1000);
  let text;
  if (secondsLeft >= 4) text = '3';
  else if (secondsLeft === 3) text = '3';
  else if (secondsLeft === 2) text = '2';
  else if (secondsLeft === 1) text = '1';
  else text = 'GO!';

  // Dim background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = text === 'GO!' ? config.colors.accent : config.colors.text;
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
}

function drawHUD(ctx, canvas) {
  const playerPos = getTrackPos();
  const playerLap = getLap();
  const speed = getSpeed();
  const topSpeed = getTopSpeed();
  const positions = getPositions(playerPos, playerLap);
  const position = positions.findIndex(r => r.id === 'player') + 1;

  // Speedometer bar (bottom left)
  const barX = 20;
  const barY = canvas.height - 50;
  const barW = 160;
  const barH = 20;
  const speedFrac = Math.abs(speed) / topSpeed;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = config.colors.accent;
  ctx.fillRect(barX, barY, barW * Math.min(speedFrac, 1), barH);
  ctx.strokeStyle = config.colors.text;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = config.colors.text;
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`SPEED`, barX, barY - 4);

  // Lap counter (top left)
  const currentLap = Math.min(playerLap + 1, config.race.lapCount);
  ctx.fillStyle = config.colors.text;
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`Lap ${currentLap} / ${config.race.lapCount}`, 20, 20);

  // Position (top left, below lap)
  const posText = getOrdinal(position);
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = position === 1 ? config.colors.accent : config.colors.text;
  ctx.fillText(posText, 20, 52);

  // Race time (top center)
  const time = state === 'finished' ? finishTime : getRaceTime();
  const mins = Math.floor(time / 60000);
  const secs = Math.floor((time % 60000) / 1000);
  const ms = Math.floor((time % 1000) / 10);
  ctx.font = '20px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.textAlign = 'center';
  ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`, canvas.width / 2, 20);

  // Control hints (bottom right)
  ctx.font = '12px sans-serif';
  ctx.fillStyle = config.colors.text;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Arrows/WASD: Drive | P: Pause', canvas.width - 20, canvas.height - 10);
  ctx.globalAlpha = 1;

  // Minimap
  drawMinimap(ctx, canvas, playerPos, getLateralOffset(), getOpponentData());
}

function drawPauseOverlay(ctx, canvas) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', cx, cy - 20);

  ctx.font = '22px sans-serif';
  ctx.fillText('Press P to resume', cx, cy + 30);
}

function drawFinishScreen(ctx, canvas) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = config.colors.accent;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RACE COMPLETE', cx, cy - 80);

  ctx.fillStyle = config.colors.text;
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(getOrdinal(finishPosition), cx, cy - 20);

  const mins = Math.floor(finishTime / 60000);
  const secs = Math.floor((finishTime % 60000) / 1000);
  const ms = Math.floor((finishTime % 1000) / 10);
  ctx.font = '24px monospace';
  ctx.fillText(`Time: ${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`, cx, cy + 30);

  ctx.font = '20px sans-serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText('Press R or click to race again', cx, cy + 80);
  ctx.globalAlpha = 1;
}

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
