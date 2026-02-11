/**
 * enemies.js - Per-room enemy spawning and AI
 *
 * Basic AI: "chase" moves toward player when in range, "wander" moves randomly.
 * Health bars above enemies. Drop items on death.
 */

import config from './config.js';
import { takeDamage as damagePlayer, isInvuln } from './player.js';
import { addToInventory } from './items.js';

let canvas, ctx;
let enemies = [];

const CHASE_RANGE = 200;
const ATTACK_RANGE = 28;
const ATTACK_COOLDOWN = 1.0; // seconds

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
}

export function reset() {
  enemies = [];
}

export function spawnForRoom(enemyIds) {
  enemies = [];
  const wallT = config.map.wallThickness;
  const w = config.map.roomWidth - wallT * 2;
  const h = config.map.roomHeight - wallT * 2;

  for (let i = 0; i < enemyIds.length; i++) {
    const typeId = enemyIds[i];
    const def = config.rpg.enemies[typeId];
    if (!def) continue;

    enemies.push({
      typeId,
      x: wallT + 60 + Math.random() * (w - 120),
      y: wallT + 60 + Math.random() * (h - 120),
      health: def.health,
      maxHealth: def.health,
      size: def.size,
      dead: false,
      attackCooldown: 0,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderTimer: 1 + Math.random() * 2,
    });
  }
}

export function getEnemies() {
  return enemies;
}

export function update(dt, playerPos) {
  for (const enemy of enemies) {
    if (enemy.dead) continue;

    const def = config.rpg.enemies[enemy.typeId];
    if (!def) continue;

    const dx = playerPos.x - enemy.x;
    const dy = playerPos.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (def.behavior === 'chase' && dist < CHASE_RANGE) {
      // Chase player
      const spd = def.speed * 60 * dt;
      if (dist > ATTACK_RANGE) {
        enemy.x += (dx / dist) * spd;
        enemy.y += (dy / dist) * spd;
      }
    } else if (def.behavior === 'wander') {
      // Wander randomly, chase if very close
      if (dist < CHASE_RANGE * 0.6) {
        const spd = def.speed * 60 * dt;
        if (dist > ATTACK_RANGE) {
          enemy.x += (dx / dist) * spd;
          enemy.y += (dy / dist) * spd;
        }
      } else {
        enemy.wanderTimer -= dt;
        if (enemy.wanderTimer <= 0) {
          enemy.wanderAngle = Math.random() * Math.PI * 2;
          enemy.wanderTimer = 1 + Math.random() * 2;
        }
        const spd = def.speed * 30 * dt;
        enemy.x += Math.cos(enemy.wanderAngle) * spd;
        enemy.y += Math.sin(enemy.wanderAngle) * spd;
      }
    }

    // Keep in bounds
    const wallT = config.map.wallThickness;
    enemy.x = Math.max(wallT + enemy.size, Math.min(config.map.roomWidth - wallT - enemy.size, enemy.x));
    enemy.y = Math.max(wallT + enemy.size, Math.min(config.map.roomHeight - wallT - enemy.size, enemy.y));

    // Attack player if close
    if (dist < ATTACK_RANGE + config.player.size / 2) {
      enemy.attackCooldown -= dt;
      if (enemy.attackCooldown <= 0 && !isInvuln()) {
        const knockDir = dist > 0 ? { x: dx / dist * -1, y: dy / dist * -1 } : { x: 0, y: -1 };
        damagePlayer(def.damage, knockDir);
        enemy.attackCooldown = ATTACK_COOLDOWN;
      }
    } else {
      enemy.attackCooldown = 0;
    }
  }

  // Remove dead enemies
  enemies = enemies.filter(e => !e.dead);
}

export function damageEnemy(enemy, amount) {
  enemy.health -= amount;
  if (enemy.health <= 0) {
    enemy.dead = true;
  }
}

export function draw() {
  const style = config.visual.style || 'geometric';

  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const def = config.rpg.enemies[enemy.typeId];
    if (!def) continue;

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    const color = def.color || config.colors.enemy;
    const sz = def.size;

    if (style === 'pixel') {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(-sz / 2), Math.round(-sz / 2), sz, sz);
    } else if (style === 'hand-drawn') {
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, sz / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Geometric
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = color;

      if (def.behavior === 'wander') {
        // Slime-like: squished circle
        ctx.beginPath();
        ctx.ellipse(0, 0, sz / 2, sz / 3, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Skeleton-like: diamond
        ctx.beginPath();
        ctx.moveTo(0, -sz / 2);
        ctx.lineTo(sz / 2, 0);
        ctx.lineTo(0, sz / 2);
        ctx.lineTo(-sz / 2, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // Health bar
    const barW = sz + 8;
    const barH = 4;
    const ratio = enemy.health / enemy.maxHealth;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-barW / 2, -sz / 2 - 10, barW, barH);

    ctx.fillStyle = ratio > 0.5 ? '#44cc44' : ratio > 0.25 ? '#cccc44' : '#cc4444';
    ctx.fillRect(-barW / 2, -sz / 2 - 10, barW * ratio, barH);

    ctx.restore();
  }
}
