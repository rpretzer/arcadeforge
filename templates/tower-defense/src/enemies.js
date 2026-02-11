/**
 * Tower Defense - Enemy System
 *
 * Wave-based spawning. Enemies follow the path from start to end.
 * Health bars, slow debuffs, gold rewards on death.
 */

import config from './config.js';
import { getPositionAtDistance } from './path.js';
import { getCellSize } from './grid.js';

let canvas, ctx;
let enemies = [];
let waveIndex = 0;
let waveActive = false;
let spawnQueue = [];
let spawnTimer = 0;
let wavesComplete = false;

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
}

export function reset() {
  enemies = [];
  waveIndex = 0;
  waveActive = false;
  spawnQueue = [];
  spawnTimer = 0;
  wavesComplete = false;
}

export function startWave() {
  if (waveIndex >= config.waves.length) {
    wavesComplete = true;
    return false;
  }

  const wave = config.waves[waveIndex];
  spawnQueue = [];

  for (const group of wave.enemies) {
    const typeDef = config.enemyTypes[group.type];
    if (!typeDef) continue;
    for (let i = 0; i < group.count; i++) {
      spawnQueue.push({
        type: group.type,
        health: typeDef.health,
        maxHealth: typeDef.health,
        speed: typeDef.speed,
        size: typeDef.size,
        color: typeDef.color,
        reward: typeDef.reward,
        interval: group.interval,
        distance: 0,
        x: 0,
        y: 0,
        slowTimer: 0,
        slowFactor: 1,
        alive: true,
      });
    }
  }

  spawnTimer = 0;
  waveActive = true;
  waveIndex++;
  return true;
}

export function update(dt) {
  // Spawn enemies from queue
  if (spawnQueue.length > 0) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const next = spawnQueue.shift();
      spawnTimer = next.interval;
      enemies.push(next);
    }
  }

  const baseSpeed = getCellSize() * 1.5; // pixels per second at speed 1.0
  let leaked = 0;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e.alive) continue;

    // Apply slow debuff
    let speedMult = e.speed;
    if (e.slowTimer > 0) {
      speedMult *= e.slowFactor;
      e.slowTimer -= dt;
    }

    e.distance += speedMult * baseSpeed * dt;
    const pos = getPositionAtDistance(e.distance);
    e.x = pos.x;
    e.y = pos.y;

    if (pos.done) {
      e.alive = false;
      enemies.splice(i, 1);
      leaked++;
    }
  }

  // Check if wave is done
  if (waveActive && spawnQueue.length === 0 && enemies.length === 0) {
    waveActive = false;
  }

  return leaked;
}

export function getEnemies() {
  return enemies;
}

export function damageEnemy(enemy, damage) {
  enemy.health -= damage;
  if (enemy.health <= 0) {
    enemy.alive = false;
    return true; // killed
  }
  return false;
}

export function applySlow(enemy, factor, duration) {
  enemy.slowFactor = factor;
  enemy.slowTimer = duration;
}

export function removeEnemy(enemy) {
  const idx = enemies.indexOf(enemy);
  if (idx !== -1) enemies.splice(idx, 1);
}

export function isWaveActive() {
  return waveActive;
}

export function getWaveIndex() {
  return waveIndex;
}

export function getTotalWaves() {
  return config.waves.length;
}

export function areAllWavesComplete() {
  return wavesComplete && !waveActive && enemies.length === 0 && spawnQueue.length === 0;
}

export function draw() {
  const cs = getCellSize();

  for (const e of enemies) {
    if (!e.alive) continue;

    // Enemy body
    ctx.fillStyle = e.color;
    if (e.slowTimer > 0) {
      // Tint blue when slowed
      ctx.fillStyle = '#70a1ff';
    }
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();

    // Health bar
    const barW = e.size * 2.5;
    const barH = 4;
    const barX = e.x - barW / 2;
    const barY = e.y - e.size - 8;
    const hpRatio = e.health / e.maxHealth;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = hpRatio > 0.5 ? '#2ed573' : hpRatio > 0.25 ? '#ffa502' : '#ff4757';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
  }
}
