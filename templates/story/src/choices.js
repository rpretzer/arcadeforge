/**
 * choices.js - Choice UI renderer.
 *
 * Renders branching choices as numbered, hoverable rounded rect buttons.
 * Supports click/touch selection, number key shortcuts, and optional timeout.
 */

let cfg          = null;
let hoveredIndex = -1;
let timeoutTimer = 0;
let timedOut     = false;

// Cached button rects for click detection
let buttonRects = [];

// ---- Public API ----------------------------------------------------------

export function init(config) {
  cfg          = config;
  hoveredIndex = -1;
  timeoutTimer = 0;
  timedOut     = false;
  buttonRects  = [];
}

export function resetTimeout() {
  timeoutTimer = 0;
  timedOut     = false;
  hoveredIndex = -1;
  buttonRects  = [];
}

export function tickTimeout(dt) {
  if (cfg.choices.timeout <= 0) return;
  timeoutTimer += dt;
  if (timeoutTimer >= cfg.choices.timeout) {
    timedOut = true;
  }
}

export function isTimedOut() {
  return timedOut;
}

export function updateHover(x, y) {
  hoveredIndex = -1;
  for (let i = 0; i < buttonRects.length; i++) {
    const r = buttonRects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      hoveredIndex = i;
      break;
    }
  }
}

export function checkClick(x, y) {
  for (let i = 0; i < buttonRects.length; i++) {
    const r = buttonRects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return i;
    }
  }
  return -1;
}

// ---- Drawing -------------------------------------------------------------

export function draw(ctx, canvas, availableChoices) {
  if (!availableChoices || availableChoices.length === 0) return;

  const maxVisible = cfg.choices.maxVisible || 4;
  const visible = availableChoices.slice(0, maxVisible);

  const btnW = Math.min(500, canvas.width - 80);
  const btnH = 44;
  const gap  = 12;
  const totalH = visible.length * btnH + (visible.length - 1) * gap;

  // Position choices in the upper part of the dialogue box area
  const startY = canvas.height * 0.65 - totalH - 20;
  const startX = (canvas.width - btnW) / 2;

  buttonRects = [];

  // Timeout bar
  if (cfg.choices.timeout > 0 && !timedOut) {
    const barW = btnW;
    const barH = 4;
    const barX = startX;
    const barY = startY - 14;
    const progress = 1 - (timeoutTimer / cfg.choices.timeout);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = cfg.colors.accent;
    ctx.fillRect(barX, barY, barW * progress, barH);
  }

  for (let i = 0; i < visible.length; i++) {
    const choice = visible[i];
    const bx = startX;
    const by = startY + i * (btnH + gap);
    const isHovered = i === hoveredIndex;

    // Background
    ctx.fillStyle = isHovered ? cfg.colors.choiceHover : cfg.colors.choiceDefault;
    roundRect(ctx, bx, by, btnW, btnH, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = cfg.colors.choiceBorder;
    ctx.lineWidth   = isHovered ? 2 : 1;
    roundRect(ctx, bx, by, btnW, btnH, 6);
    ctx.stroke();

    // Text
    ctx.fillStyle    = cfg.colors.text;
    ctx.font         = cfg.choices.font;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}. ${choice.text}`, bx + 16, by + btnH / 2);

    buttonRects.push({ x: bx, y: by, w: btnW, h: btnH });
  }
}

// ---- Utility -------------------------------------------------------------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
