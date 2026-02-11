/**
 * npc.js - NPC dialogue system
 *
 * NPCs placed in specific rooms. Interact with Space when near.
 * Shows dialogue box with word wrap, speaker name, sequential lines.
 */

import config from './config.js';

let canvas, ctx;
let npcs = [];

// Dialogue state
let dialogueActive = false;
let dialogueNPC = null;
let dialogueLines = [];
let dialogueIndex = 0;

const INTERACT_RANGE = 50;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
}

export function reset() {
  npcs = [];
  dialogueActive = false;
  dialogueNPC = null;
  dialogueLines = [];
  dialogueIndex = 0;
}

export function spawnForRoom(npcIds) {
  npcs = [];
  const wallT = config.map.wallThickness;
  const w = config.map.roomWidth - wallT * 2;
  const h = config.map.roomHeight - wallT * 2;

  for (let i = 0; i < npcIds.length; i++) {
    const id = npcIds[i];
    const def = config.rpg.npcs[id];
    if (!def) continue;

    npcs.push({
      id,
      x: wallT + 100 + (i * 120) % (w - 200),
      y: wallT + 100 + (i * 80) % (h - 200),
    });
  }
}

export function tryInteract(playerPos) {
  if (dialogueActive) return false;

  for (const npc of npcs) {
    const def = config.rpg.npcs[npc.id];
    if (!def) continue;

    const dx = playerPos.x - npc.x;
    const dy = playerPos.y - npc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < INTERACT_RANGE) {
      dialogueActive = true;
      dialogueNPC = npc;
      dialogueLines = def.dialogue;
      dialogueIndex = 0;
      return true;
    }
  }
  return false;
}

export function isDialogueActive() {
  return dialogueActive;
}

export function advanceDialogue() {
  if (!dialogueActive) return;
  dialogueIndex++;
  if (dialogueIndex >= dialogueLines.length) {
    dialogueActive = false;
    dialogueNPC = null;
    dialogueLines = [];
    dialogueIndex = 0;
  }
}

export function update(dt) {
  // NPC idle animation could go here
}

export function draw() {
  const style = config.visual.style || 'geometric';

  // Draw NPCs
  for (const npc of npcs) {
    const def = config.rpg.npcs[npc.id];
    if (!def) continue;

    const color = def.color || config.colors.npc;
    const sz = 26;

    ctx.save();
    ctx.translate(npc.x, npc.y);

    if (style === 'pixel') {
      ctx.fillStyle = color;
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
      // Face
      ctx.fillStyle = '#000000';
      ctx.fillRect(-4, -4, 3, 3);
      ctx.fillRect(2, -4, 3, 3);
    } else if (style === 'hand-drawn') {
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, sz / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Geometric: rounded square
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      roundRect(ctx, -sz / 2, -sz / 2, sz, sz, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eyes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-4, -3, 2, 0, Math.PI * 2);
      ctx.arc(4, -3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Name label
    ctx.fillStyle = color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(def.name, 0, -sz / 2 - 6);

    // Interaction hint
    ctx.fillStyle = config.colors.text;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(performance.now() / 600);
    ctx.font = '10px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('[SPACE]', 0, sz / 2 + 4);

    ctx.restore();
  }

  // Draw dialogue box
  if (dialogueActive && dialogueNPC) {
    drawDialogueBox();
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function drawDialogueBox() {
  const def = config.rpg.npcs[dialogueNPC.id];
  if (!def) return;

  const boxW = Math.min(600, canvas.width - 40);
  const boxH = 120;
  const boxX = (canvas.width - boxW) / 2;
  const boxY = canvas.height - boxH - 70;

  ctx.save();

  // Box background
  ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
  ctx.strokeStyle = config.colors.accent;
  ctx.lineWidth = 2;
  roundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Speaker name
  ctx.fillStyle = def.color || config.colors.npc;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(def.name, boxX + 16, boxY + 12);

  // Dialogue text with word wrap
  const text = dialogueLines[dialogueIndex] || '';
  ctx.fillStyle = config.colors.text;
  ctx.font = '14px monospace';

  const maxWidth = boxW - 32;
  const lines = wordWrap(text, maxWidth);
  let ty = boxY + 34;
  for (const line of lines) {
    ctx.fillText(line, boxX + 16, ty);
    ty += 20;
  }

  // Continue indicator
  const progress = `${dialogueIndex + 1}/${dialogueLines.length}`;
  ctx.fillStyle = config.colors.accent;
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(performance.now() / 400);
  ctx.font = '11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${progress}  [SPACE/CLICK]`, boxX + boxW - 12, boxY + boxH - 14);

  ctx.restore();
}

function wordWrap(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  // Approximate char width for monospace at 14px
  const charW = 8.4;
  const maxChars = Math.floor(maxWidth / charW);

  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
