/**
 * renderer.js - Typewriter text renderer.
 *
 * Handles character-by-character text reveal, word wrapping,
 * speaker name display, and a pulsing continue indicator.
 */

import { getCharacter } from './story.js';

let cfg       = null;
let charIndex = 0;
let autoAdvanceTimer = 0;

// ---- Public API ----------------------------------------------------------

export function init(config) {
  cfg       = config;
  charIndex = 0;
  autoAdvanceTimer = 0;
}

export function update(dt) {
  // dt is in seconds
  charIndex += cfg.text.speed * dt;
}

export function resetTypewriter() {
  charIndex = 0;
  autoAdvanceTimer = 0;
}

export function skipTypewriter() {
  charIndex = 99999;
}

export function isComplete() {
  // Will be checked against actual text length in draw
  return charIndex >= _lastTextLength;
}

export function tickAutoAdvance(dt) {
  autoAdvanceTimer += dt;
}

export function shouldAutoAdvance() {
  if (autoAdvanceTimer >= cfg.autoAdvance.delay) {
    autoAdvanceTimer = 0;
    return true;
  }
  return false;
}

// ---- Drawing -------------------------------------------------------------

let _lastTextLength = 0;

export function draw(ctx, canvas, dialogue, sceneComplete) {
  if (!dialogue) return;

  const character = getCharacter(dialogue.speaker);
  const fullText  = dialogue.text;
  _lastTextLength = fullText.length;

  const visibleChars = Math.min(Math.floor(charIndex), fullText.length);
  const visibleText  = fullText.substring(0, visibleChars);

  // Dialogue box area: bottom third of canvas
  const boxTop    = canvas.height * 0.65;
  const boxHeight = canvas.height * 0.35;
  const boxPad    = 30;
  const textX     = (canvas.width - cfg.text.maxWidth) / 2;
  const textStartY = boxTop + 50;

  // Draw dialogue box background
  ctx.fillStyle = cfg.colors.dialogueBox;
  ctx.fillRect(0, boxTop, canvas.width, boxHeight);

  // Divider line
  ctx.strokeStyle = cfg.colors.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxPad, boxTop);
  ctx.lineTo(canvas.width - boxPad, boxTop);
  ctx.stroke();

  // Speaker name
  ctx.fillStyle    = character.color || cfg.colors.characterName;
  ctx.font         = cfg.text.nameFont;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(character.name, textX, boxTop + 14);

  // Dialogue text with word wrap
  ctx.fillStyle = cfg.colors.text;
  ctx.font      = cfg.text.font;
  const lines   = wordWrap(ctx, visibleText, cfg.text.maxWidth);
  let lineY     = textStartY;
  const lineHeight = 28;

  for (const line of lines) {
    ctx.fillText(line, textX, lineY);
    lineY += lineHeight;
  }
}

// ---- Word wrapping -------------------------------------------------------

function wordWrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const metrics  = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
