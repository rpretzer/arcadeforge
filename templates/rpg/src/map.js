/**
 * map.js - Room-based map system
 *
 * Each room is a screen-sized area. Rooms connect via exits (top/bottom/left/right).
 * Draws floor tiles, walls, and exit indicators.
 */

import config from './config.js';

let canvas, ctx;
let currentRoom = '';

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  currentRoom = config.rpg.startRoom;
}

export function getCurrentRoom() {
  return currentRoom;
}

export function changeRoom(roomId) {
  currentRoom = roomId;
}

export function getRoomData() {
  return config.rpg.rooms[currentRoom] || null;
}

export function draw() {
  const room = config.rpg.rooms[currentRoom];
  if (!room) return;

  const w = config.map.roomWidth;
  const h = config.map.roomHeight;
  const tile = config.map.tileSize;
  const wallT = config.map.wallThickness;

  // Draw floor tiles
  ctx.fillStyle = room.floorColor || config.colors.floor;
  ctx.fillRect(wallT, wallT, w - wallT * 2, h - wallT * 2);

  // Floor grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = wallT; x < w - wallT; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, wallT);
    ctx.lineTo(x, h - wallT);
    ctx.stroke();
  }
  for (let y = wallT; y < h - wallT; y += tile) {
    ctx.beginPath();
    ctx.moveTo(wallT, y);
    ctx.lineTo(w - wallT, y);
    ctx.stroke();
  }

  // Draw walls
  const wallColor = room.wallColor || config.colors.wall;
  ctx.fillStyle = wallColor;

  // Top wall
  ctx.fillRect(0, 0, w, wallT);
  // Bottom wall
  ctx.fillRect(0, h - wallT, w, wallT);
  // Left wall
  ctx.fillRect(0, 0, wallT, h);
  // Right wall
  ctx.fillRect(w - wallT, 0, wallT, h);

  // Draw exits as gaps in walls
  const exits = room.exits || {};
  const exitSize = tile * 2;
  const midX = w / 2 - exitSize / 2;
  const midY = h / 2 - exitSize / 2;

  ctx.fillStyle = room.floorColor || config.colors.floor;

  if (exits.top) {
    ctx.fillRect(midX, 0, exitSize, wallT);
    drawExitArrow(midX + exitSize / 2, wallT / 2, 'top');
  }
  if (exits.bottom) {
    ctx.fillRect(midX, h - wallT, exitSize, wallT);
    drawExitArrow(midX + exitSize / 2, h - wallT / 2, 'bottom');
  }
  if (exits.left) {
    ctx.fillRect(0, midY, wallT, exitSize);
    drawExitArrow(wallT / 2, midY + exitSize / 2, 'left');
  }
  if (exits.right) {
    ctx.fillRect(w - wallT, midY, wallT, exitSize);
    drawExitArrow(w - wallT / 2, midY + exitSize / 2, 'right');
  }
}

function drawExitArrow(x, y, dir) {
  ctx.save();
  ctx.fillStyle = config.colors.accent;
  ctx.globalAlpha = 0.4 + 0.2 * Math.sin(performance.now() / 500);
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const arrows = { top: '^', bottom: 'v', left: '<', right: '>' };
  ctx.fillText(arrows[dir] || '', x, y);
  ctx.restore();
}

/**
 * Check if a position collides with walls (returns true if blocked).
 */
export function isWall(x, y, size) {
  const w = config.map.roomWidth;
  const h = config.map.roomHeight;
  const wallT = config.map.wallThickness;
  const room = config.rpg.rooms[currentRoom];
  if (!room) return true;

  const half = size / 2;
  const exits = room.exits || {};
  const tile = config.map.tileSize;
  const exitSize = tile * 2;
  const midX = w / 2 - exitSize / 2;
  const midY = h / 2 - exitSize / 2;

  // Check each wall, allowing passage through exits
  // Top wall
  if (y - half < wallT) {
    if (exits.top && x > midX && x < midX + exitSize) {
      return false; // In exit gap
    }
    return true;
  }
  // Bottom wall
  if (y + half > h - wallT) {
    if (exits.bottom && x > midX && x < midX + exitSize) {
      return false;
    }
    return true;
  }
  // Left wall
  if (x - half < wallT) {
    if (exits.left && y > midY && y < midY + exitSize) {
      return false;
    }
    return true;
  }
  // Right wall
  if (x + half > w - wallT) {
    if (exits.right && y > midY && y < midY + exitSize) {
      return false;
    }
    return true;
  }

  return false;
}
