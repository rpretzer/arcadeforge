/**
 * Tower Defense - Tower System
 *
 * Tower types from config. Auto-target enemies in range.
 * Upgrade system: click placed tower, pay gold, increase stats by 50%.
 * Range circle display on hover/select.
 */

import config from './config.js';
import { gridToPixel, getCellSize } from './grid.js';
import { getEnemies, damageEnemy, applySlow, removeEnemy } from './enemies.js';
import { fireProjectile } from './projectiles.js';

let canvas, ctx;
let placedTowers = [];

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
}

export function reset() {
  placedTowers = [];
}

export function addTower(col, row, towerDefIndex) {
  const def = config.towers[towerDefIndex];
  const pos = gridToPixel(col, row);
  placedTowers.push({
    col,
    row,
    x: pos.x,
    y: pos.y,
    defIndex: towerDefIndex,
    name: def.name,
    damage: def.damage,
    range: def.range,
    fireRate: def.fireRate,
    color: def.color,
    projectileColor: def.projectileColor,
    type: def.type,
    splashRadius: def.splashRadius || 0,
    slowFactor: def.slowFactor || 1,
    slowDuration: def.slowDuration || 0,
    upgradeCost: def.upgradeCost,
    level: 1,
    cooldownTimer: 0,
  });
}

export function getTowerAt(col, row) {
  return placedTowers.find(t => t.col === col && t.row === row) || null;
}

export function upgradeTower(tower) {
  tower.level++;
  tower.damage = Math.round(tower.damage * 1.5);
  tower.range *= 1.15;
  tower.fireRate *= 1.2;
  tower.upgradeCost = Math.round(tower.upgradeCost * 1.6);
}

export function getUpgradeCost(tower) {
  return tower.upgradeCost;
}

export function getPlacedTowers() {
  return placedTowers;
}

export function update(dt) {
  const cs = getCellSize();
  const enemies = getEnemies();

  for (const tower of placedTowers) {
    tower.cooldownTimer -= dt;
    if (tower.cooldownTimer > 0) continue;

    // Find nearest enemy in range
    const rangePixels = tower.range * cs;
    let target = null;
    let bestDist = Infinity;

    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - tower.x;
      const dy = e.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= rangePixels && dist < bestDist) {
        bestDist = dist;
        target = e;
      }
    }

    if (target) {
      tower.cooldownTimer = 1 / tower.fireRate;
      fireProjectile(tower, target);
    }
  }
}

export function draw(hoverCol, hoverRow) {
  const cs = getCellSize();

  for (const tower of placedTowers) {
    // Tower body
    ctx.fillStyle = tower.color;
    const halfSize = cs * 0.35;
    ctx.fillRect(tower.x - halfSize, tower.y - halfSize, halfSize * 2, halfSize * 2);

    // Level indicator
    if (tower.level > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${tower.level}`, tower.x, tower.y);
    }

    // Show range on hover
    if (tower.col === hoverCol && tower.row === hoverRow) {
      const rangePixels = tower.range * cs;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, rangePixels, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
    }
  }
}
