/**
 * opponents.js - AI opponent vehicles.
 *
 * Opponents follow the track center line with slight random lateral
 * variation. Speed is based on config with rubber-banding.
 * Simple collision with player.
 */

import config from './config.js';
import { trackToWorld, getTrackLength } from './track.js';

let opponents = [];

const OPPONENT_COLORS = ['#ff6633', '#33ccff', '#ffcc00', '#cc33ff', '#33ff66'];

export function init() {
  opponents = [];
  const count = config.opponents.count;
  const variation = config.opponents.speedVariation;

  for (let i = 0; i < count; i++) {
    const speedMod = 1 + (Math.random() * 2 - 1) * variation;
    opponents.push({
      trackPos: 0,
      lateralOffset: (i - count / 2 + 0.5) * 20,
      speed: 0,
      baseSpeed: config.vehicle.topSpeed * 0.85 * speedMod,
      lap: 0,
      color: OPPONENT_COLORS[i % OPPONENT_COLORS.length],
      lateralWander: Math.random() * Math.PI * 2,
      worldX: 0,
      worldY: 0,
      angle: 0,
    });
  }

  updateWorldPositions();
}

export function reset() {
  init();
}

export function update(delta, playerTrackPos, playerLap, playerSpeed) {
  const trackLen = getTrackLength();

  for (const opp of opponents) {
    // Rubber-banding
    let targetSpeed = opp.baseSpeed;
    const playerProgress = playerLap + playerTrackPos;
    const oppProgress = opp.lap + opp.trackPos;

    if (config.opponents.rubberBanding) {
      const diff = playerProgress - oppProgress;
      if (diff > 0.3) {
        // Behind player: speed up
        targetSpeed *= 1 + Math.min(diff * 0.3, 0.25);
      } else if (diff < -0.3) {
        // Ahead of player: slow down
        targetSpeed *= 1 - Math.min(Math.abs(diff) * 0.2, 0.2);
      }
    }

    // Accelerate toward target speed
    if (opp.speed < targetSpeed) {
      opp.speed += config.vehicle.acceleration * 0.8 * delta;
      if (opp.speed > targetSpeed) opp.speed = targetSpeed;
    } else {
      opp.speed -= config.vehicle.braking * 0.5 * delta;
      if (opp.speed < targetSpeed) opp.speed = targetSpeed;
    }

    // Move along track
    opp.trackPos += (opp.speed * delta) / trackLen;

    // Lap tracking
    if (opp.trackPos >= 1) {
      opp.trackPos -= 1;
      opp.lap++;
    }

    // Lateral wander (gentle sine wave around center)
    opp.lateralWander += 0.02 * delta;
    const maxWander = config.track.width * 0.25;
    opp.lateralOffset = Math.sin(opp.lateralWander) * maxWander;
  }

  updateWorldPositions();
}

function updateWorldPositions() {
  for (const opp of opponents) {
    const pos = trackToWorld(opp.trackPos, opp.lateralOffset);
    opp.worldX = pos.x;
    opp.worldY = pos.y;
    opp.angle = pos.angle;
  }
}

export function draw(ctx, camX, camY) {
  const size = config.vehicle.size;

  for (const opp of opponents) {
    ctx.save();
    ctx.translate(opp.worldX - camX, opp.worldY - camY);
    ctx.rotate(opp.angle);

    ctx.fillStyle = opp.color;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.6);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.7, size * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = config.colors.text;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}

/**
 * Check collision between player world pos and all opponents.
 * Returns true if collision happened (both slow down on contact).
 */
export function checkCollision(playerX, playerY, playerSlowdown) {
  const collisionDist = config.vehicle.size * 2;
  let hit = false;

  for (const opp of opponents) {
    const dx = playerX - opp.worldX;
    const dy = playerY - opp.worldY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < collisionDist) {
      opp.speed *= 0.7;
      playerSlowdown(0.7);
      hit = true;
    }
  }

  return hit;
}

/**
 * Get sorted positions for all racers (including placeholder for player).
 * Returns array of { id, progress } where progress = lap + trackPos.
 */
export function getPositions(playerTrackPos, playerLap) {
  const racers = [
    { id: 'player', progress: playerLap + playerTrackPos },
  ];

  for (let i = 0; i < opponents.length; i++) {
    racers.push({
      id: `opp${i}`,
      progress: opponents[i].lap + opponents[i].trackPos,
    });
  }

  racers.sort((a, b) => b.progress - a.progress);
  return racers;
}

/**
 * Get opponent data for minimap rendering.
 */
export function getOpponentData() {
  return opponents.map(o => ({
    trackPos: o.trackPos,
    lateralOffset: o.lateralOffset,
    color: o.color,
  }));
}
