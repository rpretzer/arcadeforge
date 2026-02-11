/**
 * game.js - RPG Game State Manager
 *
 * States: menu | playing | dialogue | inventory | gameover | victory
 * Orchestrates all modules, draws HUD (health bar, inventory bar, minimap).
 */

import config from './config.js';
import { init as initMap, draw as drawMap, getCurrentRoom, changeRoom, getRoomData } from './map.js';
import { init as initPlayer, update as updatePlayer, draw as drawPlayer, getPosition, getHealth, getMaxHealth, getFacing, reset as resetPlayer } from './player.js';
import { init as initCombat, update as updateCombat, draw as drawCombat, startAttack, reset as resetCombat } from './combat.js';
import { init as initEnemies, update as updateEnemies, draw as drawEnemies, spawnForRoom, getEnemies, reset as resetEnemies } from './enemies.js';
import { init as initItems, update as updateItems, draw as drawItems, spawnForRoom as spawnItemsForRoom, getInventory, addToInventory, useItem, reset as resetItems, hasItem } from './items.js';
import { init as initNPC, update as updateNPC, draw as drawNPC, spawnForRoom as spawnNPCsForRoom, tryInteract, isDialogueActive, advanceDialogue, reset as resetNPC } from './npc.js';

let state = 'menu'; // 'menu' | 'playing' | 'dialogue' | 'inventory' | 'gameover' | 'victory'
let canvas, ctx;
let paused = false;
let showMinimap = true;
let hintTimer = 5000;
let firstInput = false;
let questComplete = false;

// Room tracking for cleared state
const clearedEnemies = {};  // roomId -> true if all enemies killed
const collectedItems = {};  // roomId -> Set of collected item indices

// Transition animation
let transition = { active: false, direction: '', targetRoom: '', timer: 0, duration: 0.3 };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  initMap(canvas, ctx);
  initPlayer(canvas, ctx);
  initCombat(canvas, ctx);
  initEnemies(canvas, ctx);
  initItems(canvas, ctx);
  initNPC(canvas, ctx);
}

export function update(dt, keys, mouse) {
  if (state === 'menu' || state === 'gameover' || state === 'victory') return;
  if (paused) return;

  if (transition.active) {
    transition.timer -= dt;
    if (transition.timer <= 0) {
      finishTransition();
    }
    return;
  }

  if (state === 'dialogue') {
    updateNPC(dt);
    if (!isDialogueActive()) {
      state = 'playing';
    }
    return;
  }

  if (state === 'inventory') return;

  // Playing state
  if (hintTimer > 0 && !firstInput) {
    hintTimer -= dt * 1000;
  }

  updatePlayer(dt, keys);
  updateCombat(dt);
  updateEnemies(dt, getPosition());
  updateItems(dt, getPosition());
  updateNPC(dt);

  // Check room exits
  checkExits();

  // Check quest completion
  if (!questComplete) {
    const quest = config.rpg.quest;
    if (hasItem(quest.requiredItem) && getCurrentRoom() === quest.completionRoom) {
      questComplete = true;
      state = 'victory';
    }
  }

  // Check player death
  if (getHealth() <= 0) {
    state = 'gameover';
  }
}

export function draw() {
  ctx.fillStyle = config.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state === 'menu') {
    drawMenu();
    return;
  }

  // Draw game world
  drawMap();
  drawItems(ctx);
  drawNPC(ctx);
  drawEnemies(ctx);
  drawPlayer(ctx);
  drawCombat(ctx);

  // HUD
  drawHealthBar();
  drawInventoryBar();
  drawRoomName();
  drawQuestIndicator();

  if (showMinimap) {
    drawMinimap();
  }

  if (state === 'dialogue') {
    // Dialogue box drawn by NPC module is overlaid
  }

  if (state === 'inventory') {
    drawInventoryScreen();
  }

  if (paused && state !== 'gameover' && state !== 'victory') {
    drawPauseOverlay();
  }

  if (state === 'playing' && hintTimer > 0 && !firstInput) {
    drawControlHints();
  }

  if (transition.active) {
    drawTransition();
  }

  if (state === 'gameover') {
    drawGameOver();
  }

  if (state === 'victory') {
    drawVictory();
  }
}

export function handleKeyDown(code) {
  if (state === 'menu') {
    if (code === 'Space' || code === 'Enter') {
      startGame();
    }
    return;
  }

  if (state === 'gameover' || state === 'victory') {
    if (code === 'KeyR') {
      startGame();
    }
    return;
  }

  if (state === 'dialogue') {
    if (code === 'Space' || code === 'Enter') {
      advanceDialogue();
    }
    return;
  }

  if (state === 'inventory') {
    if (code === 'KeyI' || code === 'Escape') {
      state = 'playing';
    }
    // Number keys to use items
    if (code >= 'Digit1' && code <= 'Digit9') {
      const idx = parseInt(code.replace('Digit', '')) - 1;
      useItem(idx);
    }
    return;
  }

  // Playing state
  if (!firstInput) {
    firstInput = true;
    hintTimer = 0;
  }

  if (code === 'KeyP') {
    paused = !paused;
    return;
  }

  if (paused) return;

  if (code === 'Space') {
    // Try NPC interact first, then attack
    const interacted = tryInteract(getPosition());
    if (interacted) {
      state = 'dialogue';
    } else {
      startAttack(getPosition(), getFacing());
    }
  }

  if (code === 'KeyE') {
    // Pickup nearby items handled in items.update; also try NPC interact
    const interacted = tryInteract(getPosition());
    if (interacted) {
      state = 'dialogue';
    }
  }

  if (code === 'KeyM') {
    showMinimap = !showMinimap;
  }

  if (code === 'KeyI') {
    state = 'inventory';
  }

  // Number keys for quick-use
  if (code >= 'Digit1' && code <= 'Digit9') {
    const idx = parseInt(code.replace('Digit', '')) - 1;
    useItem(idx);
  }
}

export function handleKeyUp(code) {
  // Currently unused but available for future needs
}

export function handleClick(mouse) {
  if (state === 'menu') {
    startGame();
    return;
  }
  if (state === 'gameover' || state === 'victory') {
    startGame();
    return;
  }
  if (state === 'dialogue') {
    advanceDialogue();
    return;
  }
  if (state === 'playing' && !paused) {
    if (!firstInput) {
      firstInput = true;
      hintTimer = 0;
    }
    startAttack(getPosition(), getFacing());
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function startGame() {
  state = 'playing';
  paused = false;
  hintTimer = 5000;
  firstInput = false;
  questComplete = false;
  showMinimap = true;

  // Clear tracked state
  for (const k in clearedEnemies) delete clearedEnemies[k];
  for (const k in collectedItems) delete collectedItems[k];

  resetPlayer();
  resetCombat();
  resetEnemies();
  resetItems();
  resetNPC();

  changeRoom(config.rpg.startRoom);
  enterRoom(config.rpg.startRoom);
}

function enterRoom(roomId) {
  const room = config.rpg.rooms[roomId];
  if (!room) return;

  // Spawn enemies if not cleared
  if (!clearedEnemies[roomId]) {
    spawnForRoom(room.enemies);
  } else {
    spawnForRoom([]);
  }

  // Spawn items (skip collected ones)
  const collected = collectedItems[roomId] || new Set();
  const availableItems = room.items.filter((_, i) => !collected.has(i));
  spawnItemsForRoom(availableItems);

  // Spawn NPCs
  spawnNPCsForRoom(room.npcs);
}

function checkExits() {
  const pos = getPosition();
  const w = config.map.wallThickness;
  const roomW = config.map.roomWidth;
  const roomH = config.map.roomHeight;
  const room = getRoomData();
  if (!room || !room.exits) return;

  const pSize = config.player.size;

  if (room.exits.left && pos.x < w + pSize / 2) {
    startTransition('left', room.exits.left);
  } else if (room.exits.right && pos.x > roomW - w - pSize / 2) {
    startTransition('right', room.exits.right);
  } else if (room.exits.top && pos.y < w + pSize / 2) {
    startTransition('top', room.exits.top);
  } else if (room.exits.bottom && pos.y > roomH - w - pSize / 2) {
    startTransition('bottom', room.exits.bottom);
  }
}

function startTransition(direction, targetRoom) {
  // Save enemy/item state of current room
  const currentId = getCurrentRoom();
  if (getEnemies().length === 0 && config.rpg.rooms[currentId].enemies.length > 0) {
    clearedEnemies[currentId] = true;
  }

  transition = {
    active: true,
    direction,
    targetRoom,
    timer: 0.3,
    duration: 0.3,
  };
}

function finishTransition() {
  transition.active = false;
  const dir = transition.direction;
  const roomW = config.map.roomWidth;
  const roomH = config.map.roomHeight;
  const w = config.map.wallThickness;
  const pSize = config.player.size;

  changeRoom(transition.targetRoom);
  enterRoom(transition.targetRoom);

  // Position player at opposite side
  const pos = getPosition();
  if (dir === 'left')   pos.x = roomW - w - pSize;
  if (dir === 'right')  pos.x = w + pSize;
  if (dir === 'top')    pos.y = roomH - w - pSize;
  if (dir === 'bottom') pos.y = w + pSize;
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

function drawMenu() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = config.colors.player;
  ctx.shadowColor = config.colors.player;
  ctx.shadowBlur = 16;
  ctx.fillText(config.game.title.toUpperCase(), cx, cy - 80);
  ctx.shadowBlur = 0;

  ctx.font = '20px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('WASD to move, Space to attack/talk', cx, cy);

  ctx.font = '16px monospace';
  ctx.fillStyle = config.colors.accent;
  ctx.fillText(config.rpg.quest.objective, cx, cy + 40);

  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '18px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('[ Press Space or Click to start ]', cx, cy + 100);

  ctx.restore();
}

function drawHealthBar() {
  const x = 10;
  const y = 10;
  const w = 160;
  const h = 16;
  const health = getHealth();
  const maxHealth = getMaxHealth();
  const ratio = Math.max(0, health / maxHealth);

  ctx.save();
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  // Health fill
  const green = Math.floor(ratio * 255);
  const red = 255 - green;
  ctx.fillStyle = `rgb(${red}, ${green}, 50)`;
  ctx.fillRect(x, y, w * ratio, h);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.ceil(health)} / ${maxHealth}`, x + w / 2, y + h / 2);
  ctx.restore();
}

function drawInventoryBar() {
  const inv = getInventory();
  const slotSize = config.inventory.slotSize;
  const maxSize = config.inventory.maxSize;
  const totalW = maxSize * (slotSize + 4) + 4;
  const x = (canvas.width - totalW) / 2;
  const y = canvas.height - slotSize - 14;

  ctx.save();
  // Background bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(x, y - 2, totalW, slotSize + 8);

  for (let i = 0; i < maxSize; i++) {
    const sx = x + 4 + i * (slotSize + 4);
    const sy = y + 2;

    // Slot border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, slotSize, slotSize);

    if (inv[i]) {
      const itemDef = config.rpg.items[inv[i]];
      if (itemDef) {
        ctx.fillStyle = itemDef.color;
        const pad = 6;
        ctx.fillRect(sx + pad, sy + pad, slotSize - pad * 2, slotSize - pad * 2);
      }
    }

    // Slot number
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${i + 1}`, sx + 2, sy + 1);
  }
  ctx.restore();
}

function drawRoomName() {
  const room = getRoomData();
  if (!room) return;

  ctx.save();
  ctx.fillStyle = config.colors.text;
  ctx.globalAlpha = 0.7;
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(room.name, canvas.width - 10, 10);
  ctx.restore();
}

function drawQuestIndicator() {
  ctx.save();
  ctx.fillStyle = config.colors.npc;
  ctx.globalAlpha = 0.8;
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const prefix = questComplete ? '[DONE] ' : '[QUEST] ';
  ctx.fillText(prefix + config.rpg.quest.objective, 10, 32);
  ctx.restore();
}

function drawMinimap() {
  const rooms = config.rpg.rooms;
  const roomIds = Object.keys(rooms);
  const currentId = getCurrentRoom();

  // Build a simple position map based on exits
  const positions = {};
  const visited = new Set();
  const queue = [{ id: config.rpg.startRoom, x: 0, y: 0 }];
  positions[config.rpg.startRoom] = { x: 0, y: 0 };
  visited.add(config.rpg.startRoom);

  while (queue.length > 0) {
    const cur = queue.shift();
    const room = rooms[cur.id];
    if (!room) continue;
    const exits = room.exits;
    const dirs = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] };

    for (const [dir, targetId] of Object.entries(exits)) {
      if (!visited.has(targetId) && dirs[dir]) {
        const [dx, dy] = dirs[dir];
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        positions[targetId] = { x: nx, y: ny };
        visited.add(targetId);
        queue.push({ id: targetId, x: nx, y: ny });
      }
    }
  }

  // Find bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of Object.values(positions)) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const cellW = 20;
  const cellH = 16;
  const pad = 6;
  const mapW = (maxX - minX + 1) * (cellW + pad) + pad;
  const mapH = (maxY - minY + 1) * (cellH + pad) + pad;
  const ox = canvas.width - mapW - 10;
  const oy = canvas.height - mapH - 60;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(ox - 4, oy - 4, mapW + 8, mapH + 8);

  for (const [id, pos] of Object.entries(positions)) {
    const rx = ox + pad + (pos.x - minX) * (cellW + pad);
    const ry = oy + pad + (pos.y - minY) * (cellH + pad);

    if (id === currentId) {
      ctx.fillStyle = config.colors.player;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    }
    ctx.fillRect(rx, ry, cellW, cellH);

    // Draw connections
    const room = rooms[id];
    if (room) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for (const [dir, targetId] of Object.entries(room.exits)) {
        const targetPos = positions[targetId];
        if (targetPos) {
          const tx = ox + pad + (targetPos.x - minX) * (cellW + pad) + cellW / 2;
          const ty = oy + pad + (targetPos.y - minY) * (cellH + pad) + cellH / 2;
          ctx.beginPath();
          ctx.moveTo(rx + cellW / 2, ry + cellH / 2);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();
}

function drawInventoryScreen() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = config.colors.text;
  ctx.font = 'bold 28px monospace';
  ctx.fillText('INVENTORY', cx, 60);

  const inv = getInventory();
  const slotSize = 50;
  const cols = config.inventory.maxSize;
  const totalW = cols * (slotSize + 8);
  const startX = (canvas.width - totalW) / 2;
  const startY = 120;

  for (let i = 0; i < config.inventory.maxSize; i++) {
    const sx = startX + i * (slotSize + 8);
    const sy = startY;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, slotSize, slotSize);

    if (inv[i]) {
      const itemDef = config.rpg.items[inv[i]];
      if (itemDef) {
        ctx.fillStyle = itemDef.color;
        ctx.fillRect(sx + 8, sy + 8, slotSize - 16, slotSize - 16);

        ctx.fillStyle = config.colors.text;
        ctx.font = '11px monospace';
        ctx.fillText(itemDef.name, sx + slotSize / 2, sy + slotSize + 14);
      }
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.fillText(`${i + 1}`, sx + 8, sy + 10);
  }

  ctx.fillStyle = config.colors.accent;
  ctx.font = '16px monospace';
  ctx.fillText('Press number key to use | I or ESC to close', cx, startY + slotSize + 50);
  ctx.restore();
}

function drawTransition() {
  const progress = 1 - (transition.timer / transition.duration);
  ctx.save();
  ctx.fillStyle = config.colors.background;
  ctx.globalAlpha = Math.min(1, progress * 2);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawPauseOverlay() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', cx, cy - 20);

  ctx.font = '22px monospace';
  ctx.fillText('Press P to resume', cx, cy + 30);
  ctx.restore();
}

function drawControlHints() {
  let alpha = 1;
  if (hintTimer < 1000) alpha = hintTimer / 1000;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = config.colors.text;
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('WASD: Move | SPACE: Attack/Talk | E: Interact | M: Map | I: Inventory | P: Pause', canvas.width / 2, canvas.height - 56);
  ctx.restore();
}

function drawGameOver() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = config.colors.enemy;
  ctx.shadowColor = config.colors.enemy;
  ctx.shadowBlur = 12;
  ctx.fillText('YOU DIED', cx, cy - 40);
  ctx.shadowBlur = 0;

  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '18px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('Press R or Click to restart', cx, cy + 30);
  ctx.restore();
}

function drawVictory() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = config.colors.item;
  ctx.shadowColor = config.colors.item;
  ctx.shadowBlur = 16;
  ctx.fillText('QUEST COMPLETE!', cx, cy - 60);
  ctx.shadowBlur = 0;

  ctx.font = '20px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText(config.rpg.quest.objective, cx, cy);

  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '18px monospace';
  ctx.fillText('Press R or Click to play again', cx, cy + 50);
  ctx.restore();
}
