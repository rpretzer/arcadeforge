/**
 * combat.js - Melee attack system
 *
 * Press Space/Click to swing in the facing direction.
 * Arc-shaped attack with hit detection against enemies.
 * Damage number popups on hit.
 */

import config from './config.js';
import { getEnemies, damageEnemy } from './enemies.js';

let canvas, ctx;
let attacking = false;
let attackTimer = 0;
let attackPos = { x: 0, y: 0 };
let attackDir = { x: 0, y: 1 };
let cooldownTimer = 0;

const ATTACK_DURATION = 0.2; // seconds
const ARC_ANGLE = Math.PI * 0.6; // swing arc width

// Damage number popups
let damageNumbers = [];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  reset();
}

export function reset() {
  attacking = false;
  attackTimer = 0;
  cooldownTimer = 0;
  damageNumbers = [];
}

export function startAttack(playerPos, facing) {
  if (cooldownTimer > 0 || attacking) return;

  attacking = true;
  attackTimer = ATTACK_DURATION;
  cooldownTimer = config.player.attackCooldown / 1000;
  attackPos = { ...playerPos };
  attackDir = { ...facing };

  // Ensure we have a valid direction
  if (attackDir.x === 0 && attackDir.y === 0) {
    attackDir = { x: 0, y: 1 };
  }

  // Check hits against enemies
  checkHits();
}

export function update(dt) {
  if (attacking) {
    attackTimer -= dt;
    if (attackTimer <= 0) {
      attacking = false;
    }
  }

  if (cooldownTimer > 0) {
    cooldownTimer -= dt;
  }

  // Update damage numbers
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const dn = damageNumbers[i];
    dn.timer -= dt;
    dn.y -= 30 * dt; // float upward
    if (dn.timer <= 0) {
      damageNumbers.splice(i, 1);
    }
  }
}

export function draw() {
  // Draw attack arc
  if (attacking) {
    const range = config.player.attackRange;
    const angle = Math.atan2(attackDir.y, attackDir.x);
    const progress = 1 - (attackTimer / ATTACK_DURATION);

    ctx.save();
    ctx.translate(attackPos.x, attackPos.y);

    // Swing arc
    ctx.strokeStyle = config.colors.accent;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 * (1 - progress);
    ctx.beginPath();
    const sweepAngle = ARC_ANGLE * progress;
    ctx.arc(0, 0, range, angle - ARC_ANGLE / 2, angle - ARC_ANGLE / 2 + sweepAngle);
    ctx.stroke();

    // Sword line
    ctx.globalAlpha = 0.8 * (1 - progress);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    const swordAngle = angle - ARC_ANGLE / 2 + sweepAngle;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(swordAngle) * range, Math.sin(swordAngle) * range);
    ctx.stroke();

    ctx.restore();
  }

  // Draw damage numbers
  ctx.save();
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const dn of damageNumbers) {
    const alpha = Math.min(1, dn.timer / (config.combat.damageNumberDuration * 0.5));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = dn.color || '#ff4444';
    ctx.fillText(`-${dn.amount}`, dn.x, dn.y);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function checkHits() {
  const enemies = getEnemies();
  const range = config.player.attackRange;
  const damage = config.player.attackDamage;
  const angle = Math.atan2(attackDir.y, attackDir.x);

  for (const enemy of enemies) {
    if (enemy.dead) continue;

    const dx = enemy.x - attackPos.x;
    const dy = enemy.y - attackPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > range + enemy.size / 2) continue;

    // Check if enemy is within the arc
    const enemyAngle = Math.atan2(dy, dx);
    let angleDiff = enemyAngle - angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) <= ARC_ANGLE / 2) {
      damageEnemy(enemy, damage);
      damageNumbers.push({
        x: enemy.x,
        y: enemy.y - enemy.size,
        amount: damage,
        timer: config.combat.damageNumberDuration,
        color: '#ffaa00',
      });
    }
  }
}
