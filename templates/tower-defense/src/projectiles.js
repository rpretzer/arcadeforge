/**
 * Tower Defense - Projectile System
 *
 * Simple projectiles from tower to target enemy.
 * Splash type explodes on impact (AoE circle).
 * Slow type applies speed debuff on hit.
 */

import config from './config.js';
import { getEnemies, damageEnemy, applySlow, removeEnemy } from './enemies.js';
import { getCellSize } from './grid.js';

let canvas, ctx;
let projectiles = [];
let explosions = []; // visual-only AoE indicators

const PROJECTILE_SPEED = 300; // pixels per second

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
}

export function reset() {
  projectiles = [];
  explosions = [];
}

export function fireProjectile(tower, target) {
  projectiles.push({
    x: tower.x,
    y: tower.y,
    targetId: target, // direct reference
    damage: tower.damage,
    color: tower.projectileColor,
    type: tower.type,
    splashRadius: tower.splashRadius || 0,
    slowFactor: tower.slowFactor || 1,
    slowDuration: tower.slowDuration || 0,
    speed: PROJECTILE_SPEED,
  });
}

export function update(dt) {
  const cs = getCellSize();

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const target = p.targetId;

    // If target is dead, remove projectile
    if (!target.alive) {
      projectiles.splice(i, 1);
      continue;
    }

    // Move toward target
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // Hit!
      handleHit(p, target, cs);
      projectiles.splice(i, 1);
      continue;
    }

    const moveAmount = p.speed * dt;
    p.x += (dx / dist) * moveAmount;
    p.y += (dy / dist) * moveAmount;
  }

  // Update explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].timer -= dt;
    if (explosions[i].timer <= 0) {
      explosions.splice(i, 1);
    }
  }
}

function handleHit(projectile, target, cs) {
  if (projectile.type === 'splash') {
    // AoE damage
    const splashPixels = projectile.splashRadius * cs;
    const enemies = getEnemies();

    explosions.push({
      x: target.x,
      y: target.y,
      radius: splashPixels,
      color: projectile.color,
      timer: 0.2,
    });

    for (const e of enemies) {
      if (!e.alive) continue;
      const dx = e.x - target.x;
      const dy = e.y - target.y;
      if (Math.sqrt(dx * dx + dy * dy) <= splashPixels) {
        const killed = damageEnemy(e, projectile.damage);
        if (killed) {
          goldCallback(e.reward);
          removeEnemy(e);
        }
      }
    }
  } else if (projectile.type === 'slow') {
    // Damage + slow
    const killed = damageEnemy(target, projectile.damage);
    if (killed) {
      goldCallback(target.reward);
      removeEnemy(target);
    } else {
      applySlow(target, projectile.slowFactor, projectile.slowDuration);
    }
  } else {
    // Single target damage
    const killed = damageEnemy(target, projectile.damage);
    if (killed) {
      goldCallback(target.reward);
      removeEnemy(target);
    }
  }
}

// Callback for gold earned — set by game.js
let goldCallback = () => {};
export function setGoldCallback(fn) {
  goldCallback = fn;
}

export function draw() {
  // Draw projectiles
  for (const p of projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw explosions
  for (const exp of explosions) {
    const alpha = exp.timer / 0.2;
    ctx.save();
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillStyle = exp.color;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
