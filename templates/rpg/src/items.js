/**
 * items.js - Item pickup and inventory system
 *
 * Items spawn per-room from config. Picked up on collision or E key.
 * Inventory array with use (number keys). Health potion heals,
 * weapon boosts damage, quest items are key flags.
 */

import config from './config.js';
import { heal } from './player.js';

let canvas, ctx;
let worldItems = [];   // items on the ground in current room
let inventory = [];     // item IDs in player inventory
let bonusDamage = 0;

const PICKUP_RANGE = 30;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
}

export function reset() {
  worldItems = [];
  inventory = [];
  bonusDamage = 0;
}

export function spawnForRoom(itemIds) {
  worldItems = [];
  const wallT = config.map.wallThickness;
  const w = config.map.roomWidth - wallT * 2;
  const h = config.map.roomHeight - wallT * 2;

  for (let i = 0; i < itemIds.length; i++) {
    const id = itemIds[i];
    const def = config.rpg.items[id];
    if (!def) continue;

    worldItems.push({
      id,
      x: wallT + 80 + Math.random() * (w - 160),
      y: wallT + 80 + Math.random() * (h - 160),
      bobOffset: Math.random() * Math.PI * 2,
    });
  }
}

export function update(dt, playerPos) {
  // Auto-pickup items within range
  for (let i = worldItems.length - 1; i >= 0; i--) {
    const item = worldItems[i];
    const dx = playerPos.x - item.x;
    const dy = playerPos.y - item.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < PICKUP_RANGE) {
      if (addToInventory(item.id)) {
        worldItems.splice(i, 1);
      }
    }
  }
}

export function addToInventory(itemId) {
  if (inventory.length >= config.inventory.maxSize) return false;
  inventory.push(itemId);

  // Auto-apply weapon bonuses
  const def = config.rpg.items[itemId];
  if (def && def.type === 'weapon') {
    bonusDamage += def.value;
    config.player.attackDamage += def.value;
  }

  return true;
}

export function useItem(index) {
  if (index < 0 || index >= inventory.length) return;

  const itemId = inventory[index];
  const def = config.rpg.items[itemId];
  if (!def) return;

  if (def.type === 'consumable') {
    if (def.effect === 'heal') {
      heal(def.value);
      inventory.splice(index, 1);
    }
  }
  // Quest and weapon items are not "used" — they stay in inventory
}

export function getInventory() {
  return inventory;
}

export function hasItem(itemId) {
  return inventory.includes(itemId);
}

export function getBonusDamage() {
  return bonusDamage;
}

export function draw() {
  const style = config.visual.style || 'geometric';
  const now = performance.now() / 1000;

  for (const item of worldItems) {
    const def = config.rpg.items[item.id];
    if (!def) continue;

    const bobY = Math.sin(now * 2 + item.bobOffset) * 3;

    ctx.save();
    ctx.translate(item.x, item.y + bobY);

    const color = def.color || config.colors.item;
    const sz = 14;

    if (style === 'pixel') {
      ctx.fillStyle = color;
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
    } else if (style === 'hand-drawn') {
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, sz / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Geometric: glowing diamond
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -sz / 2);
      ctx.lineTo(sz / 2, 0);
      ctx.lineTo(0, sz / 2);
      ctx.lineTo(-sz / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Item label
    ctx.fillStyle = config.colors.text;
    ctx.globalAlpha = 0.7;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(def.name, 0, sz / 2 + 4);

    ctx.restore();
  }
}
