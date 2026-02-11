/**
 * saves.js - Save system.
 *
 * Uses localStorage with a game-specific prefix. Supports multiple
 * save slots and autosave on scene transitions.
 */

let cfg       = null;
let keyPrefix = 'arcadeforge_story_';
let maxSlots  = 3;

// Cached slot rects for click detection
let slotRects  = [];
let backBtnRect = null;

// ---- Public API ----------------------------------------------------------

export function init(config) {
  cfg      = config;
  maxSlots = config.saves.maxSlots || 3;
  // Build a simple hash from the title for key isolation
  keyPrefix = 'arcadeforge_story_' + hashString(config.game.title) + '_';
  slotRects = [];
  backBtnRect = null;
}

export function saveSlot(index, stateData) {
  if (index < 0 || index >= maxSlots) return;
  const key = keyPrefix + 'slot_' + index;
  try {
    localStorage.setItem(key, JSON.stringify(stateData));
  } catch (_) {
    // Storage full or unavailable
  }
}

export function loadSlot(index) {
  if (index < 0 || index >= maxSlots) return null;
  const key = keyPrefix + 'slot_' + index;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function autosave(stateData) {
  const key = keyPrefix + 'autosave';
  try {
    localStorage.setItem(key, JSON.stringify(stateData));
  } catch (_) {
    // Storage full or unavailable
  }
}

export function loadAutosave() {
  const key = keyPrefix + 'autosave';
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function hasAutosave() {
  const key = keyPrefix + 'autosave';
  try {
    return localStorage.getItem(key) !== null;
  } catch (_) {
    return false;
  }
}

export function checkClick(x, y) {
  // Check back button
  if (backBtnRect) {
    const b = backBtnRect;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return -2; // signal: go back
    }
  }
  // Check slots
  for (let i = 0; i < slotRects.length; i++) {
    const r = slotRects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return i;
    }
  }
  return -1;
}

// ---- Drawing -------------------------------------------------------------

export function draw(ctx, canvas) {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle    = cfg.colors.accent;
  ctx.font         = 'bold 32px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Save / Load', cx, 60);

  slotRects = [];

  const slotW = 360;
  const slotH = 60;
  const gap   = 14;
  const startY = 110;
  const startX = cx - slotW / 2;

  for (let i = 0; i < maxSlots; i++) {
    const sy = startY + i * (slotH + gap);
    const data = loadSlot(i);

    // Slot background
    ctx.fillStyle = cfg.colors.menuButton;
    ctx.fillRect(startX, sy, slotW, slotH);

    ctx.strokeStyle = cfg.colors.accent;
    ctx.lineWidth   = 1;
    ctx.strokeRect(startX, sy, slotW, slotH);

    // Slot label
    ctx.fillStyle    = cfg.colors.text;
    ctx.font         = '18px sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';

    if (data) {
      const date = new Date(data.timestamp).toLocaleString();
      ctx.fillText(`Slot ${i + 1}: ${data.sceneId}`, startX + 14, sy + 22);
      ctx.font = '13px sans-serif';
      ctx.globalAlpha = 0.6;
      ctx.fillText(date, startX + 14, sy + 44);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillText(`Slot ${i + 1}: — empty —`, startX + 14, sy + slotH / 2);
    }

    slotRects.push({ x: startX, y: sy, w: slotW, h: slotH });
  }

  // Back button
  const backW = 200;
  const backH = 40;
  const backX = cx - backW / 2;
  const backY = startY + maxSlots * (slotH + gap) + 20;

  ctx.fillStyle = cfg.colors.menuButton;
  ctx.fillRect(backX, backY, backW, backH);
  ctx.strokeStyle = cfg.colors.accent;
  ctx.strokeRect(backX, backY, backW, backH);

  ctx.fillStyle = cfg.colors.text;
  ctx.font      = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Back (ESC)', cx, backY + backH / 2);

  backBtnRect = { x: backX, y: backY, w: backW, h: backH };

  // Hint
  ctx.font = '14px sans-serif';
  ctx.globalAlpha = 0.5;
  ctx.fillText('Press 1-3 to save/load, ESC to return', cx, canvas.height - 30);
  ctx.globalAlpha = 1;
}

// ---- Utility -------------------------------------------------------------

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
