/**
 * vehicle.js - Player vehicle physics and rendering.
 *
 * The vehicle has a position on the track path (trackPos 0-1 per lap)
 * and a lateral offset from the center line. Speed, acceleration,
 * braking, and turning are all handled here.
 */

import config from './config.js';
import { trackToWorld, getTrackLength } from './track.js';

let trackPos = 0;
let lateralOffset = 0;
let speed = 0;
let worldX = 0;
let worldY = 0;
let angle = 0;
let lap = 0;
let lastTrackPos = 0;
let raceTime = 0;

const FRICTION = 0.985;
const HALF_WIDTH = config.track.width / 2;
const EDGE_BOUNCE = 0.7;

export function init() {
  trackPos = 0;
  lateralOffset = 0;
  speed = 0;
  lap = 0;
  lastTrackPos = 0;
  raceTime = 0;
  updateWorldPos();
}

export function reset() {
  init();
}

export function update(delta, keys, racing) {
  if (!racing) return;

  const cfg = config.vehicle;
  raceTime += delta * (1000 / 60);

  // Acceleration / braking
  if (keys.up) {
    speed += cfg.acceleration * delta;
  }
  if (keys.down) {
    speed -= cfg.braking * delta;
  }

  // Friction
  speed *= Math.pow(FRICTION, delta);

  // Clamp speed
  if (speed > cfg.topSpeed) speed = cfg.topSpeed;
  if (speed < -cfg.topSpeed * 0.3) speed = -cfg.topSpeed * 0.3;
  if (Math.abs(speed) < 0.01) speed = 0;

  // Steering (only when moving)
  if (Math.abs(speed) > 0.1) {
    const steerFactor = Math.min(1, Math.abs(speed) / 2);
    if (keys.left) {
      lateralOffset -= cfg.turnSpeed * delta * steerFactor * config.track.width;
    }
    if (keys.right) {
      lateralOffset += cfg.turnSpeed * delta * steerFactor * config.track.width;
    }
  }

  // Track boundary collision
  const maxOffset = HALF_WIDTH - cfg.size;
  if (lateralOffset > maxOffset) {
    lateralOffset = maxOffset;
    speed *= EDGE_BOUNCE;
  } else if (lateralOffset < -maxOffset) {
    lateralOffset = -maxOffset;
    speed *= EDGE_BOUNCE;
  }

  // Move along track
  lastTrackPos = trackPos;
  const trackLen = getTrackLength();
  trackPos += (speed * delta) / trackLen;

  // Lap detection
  if (trackPos >= 1) {
    trackPos -= 1;
    lap++;
  } else if (trackPos < 0) {
    trackPos += 1;
    if (lap > 0) lap--;
  }

  updateWorldPos();
}

function updateWorldPos() {
  const pos = trackToWorld(trackPos, lateralOffset);
  worldX = pos.x;
  worldY = pos.y;
  angle = pos.angle;
}

export function draw(ctx, camX, camY) {
  const cfg = config.vehicle;
  const size = cfg.size;

  ctx.save();
  ctx.translate(worldX - camX, worldY - camY);
  ctx.rotate(angle);

  // Draw as triangle/arrow
  ctx.fillStyle = config.colors.player;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.7, -size * 0.6);
  ctx.lineTo(-size * 0.4, 0);
  ctx.lineTo(-size * 0.7, size * 0.6);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = config.colors.text;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export function getWorldPos() {
  return { x: worldX, y: worldY };
}

export function getTrackPos() {
  return trackPos;
}

export function getLap() {
  return lap;
}

export function getSpeed() {
  return speed;
}

export function getTopSpeed() {
  return config.vehicle.topSpeed;
}

export function getLateralOffset() {
  return lateralOffset;
}

export function getRaceTime() {
  return raceTime;
}

export function slowDown(factor) {
  speed *= factor;
}
