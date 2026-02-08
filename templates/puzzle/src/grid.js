/**
 * Core Match-3 grid logic.
 *
 * Lifecycle every frame:
 *   1. If idle, process player input (select / swap).
 *   2. If swapping, animate the two pieces moving toward each other.
 *   3. After swap completes, detect matches.
 *      - If no matches and it was a player-initiated swap, reverse it (invalid move).
 *   4. Flash matched pieces, then remove them.
 *   5. Apply gravity — pieces fall down; new pieces spawn above and fall in.
 *   6. After gravity settles, check for new matches (chain/cascade).
 *   7. Repeat from 3 until no more matches; then go idle.
 */
import CONFIG from './config.js';
import * as Input from './input.js';
import * as Scoring from './scoring.js';
import { getAsset } from './assets.js';

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

/** Each cell: { colorIndex, x, y, targetX, targetY, falling, flashTimer, scale, opacity } */
let cells = [];         // 2-D array [col][row]
const W = () => CONFIG.grid.width;
const H = () => CONFIG.grid.height;
const CELL = () => CONFIG.grid.cellSize;
const PAD = () => CONFIG.grid.padding;
const TOTAL = () => CELL() + PAD();

let gridOffsetX = 0;
let gridOffsetY = 0;

// State machine
const State = {
  IDLE: 'idle',
  SWAPPING: 'swapping',
  SWAP_BACK: 'swap_back',
  MATCHING: 'matching',
  REMOVING: 'removing',
  FALLING: 'falling',
};
let state = State.IDLE;

let swapA = null;   // { col, row }
let swapB = null;
let swapTimer = 0;
let playerInitiatedSwap = false;

let matchedSet = new Set();   // "col,row" strings
let flashTimer = 0;

let cascading = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomColor() {
  return Math.floor(Math.random() * CONFIG.colors.pieces.length);
}

function key(col, row) { return `${col},${row}`; }

function cellAt(col, row) {
  if (col < 0 || col >= W() || row < 0 || row >= H()) return null;
  return cells[col]?.[row] ?? null;
}

function pixelX(col) { return gridOffsetX + col * TOTAL(); }
function pixelY(row) { return gridOffsetY + row * TOTAL(); }

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

export function init(canvasWidth, canvasHeight) {
  const totalW = W() * TOTAL() - PAD();
  const totalH = H() * TOTAL() - PAD();
  // Leave space above for score HUD (~70px)
  const hudSpace = 70;
  gridOffsetX = Math.floor((canvasWidth - totalW) / 2);
  gridOffsetY = Math.floor((canvasHeight - totalH) / 2) + hudSpace / 2;

  Input.updateOffsets(gridOffsetX, gridOffsetY);

  cells = [];
  for (let c = 0; c < W(); c++) {
    cells[c] = [];
    for (let r = 0; r < H(); r++) {
      cells[c][r] = makeCell(c, r);
    }
  }

  // Ensure the initial board has no matches
  eliminateInitialMatches();

  state = State.IDLE;
  swapA = swapB = null;
  matchedSet.clear();
  cascading = false;

  return { gridOffsetX, gridOffsetY };
}

function makeCell(col, row, falling = false) {
  return {
    colorIndex: randomColor(),
    x: pixelX(col),
    y: falling ? pixelY(row - (H() + 1)) : pixelY(row),  // above screen if spawning
    targetX: pixelX(col),
    targetY: pixelY(row),
    falling: falling,
    flashTimer: 0,
    scale: 1,
    opacity: 1,
  };
}

function eliminateInitialMatches() {
  // Simple brute-force: re-roll any cell that creates a match of 3+
  for (let c = 0; c < W(); c++) {
    for (let r = 0; r < H(); r++) {
      let attempts = 0;
      while (attempts < 50 && causesMatch(c, r)) {
        cells[c][r].colorIndex = randomColor();
        attempts++;
      }
    }
  }
}

function causesMatch(col, row) {
  const ci = cells[col][row].colorIndex;
  // Horizontal left check
  if (col >= 2 &&
      cellAt(col - 1, row)?.colorIndex === ci &&
      cellAt(col - 2, row)?.colorIndex === ci) return true;
  // Vertical up check
  if (row >= 2 &&
      cellAt(col, row - 1)?.colorIndex === ci &&
      cellAt(col, row - 2)?.colorIndex === ci) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Match detection
// ---------------------------------------------------------------------------

function findAllMatches() {
  const matched = new Set();
  const minMatch = CONFIG.grid.matchSize;

  // Horizontal
  for (let r = 0; r < H(); r++) {
    let run = 1;
    for (let c = 1; c < W(); c++) {
      if (cells[c][r].colorIndex === cells[c - 1][r].colorIndex && cells[c][r].colorIndex >= 0) {
        run++;
      } else {
        if (run >= minMatch) {
          for (let k = c - run; k < c; k++) matched.add(key(k, r));
        }
        run = 1;
      }
    }
    if (run >= minMatch) {
      for (let k = W() - run; k < W(); k++) matched.add(key(k, r));
    }
  }

  // Vertical
  for (let c = 0; c < W(); c++) {
    let run = 1;
    for (let r = 1; r < H(); r++) {
      if (cells[c][r].colorIndex === cells[c][r - 1].colorIndex && cells[c][r].colorIndex >= 0) {
        run++;
      } else {
        if (run >= minMatch) {
          for (let k = r - run; k < r; k++) matched.add(key(c, k));
        }
        run = 1;
      }
    }
    if (run >= minMatch) {
      for (let k = H() - run; k < H(); k++) matched.add(key(c, k));
    }
  }

  return matched;
}

/** Check if swapping (c1,r1) with (c2,r2) would produce at least one match. */
function swapProducesMatch(c1, r1, c2, r2) {
  // Temporarily swap
  const tmp = cells[c1][r1].colorIndex;
  cells[c1][r1].colorIndex = cells[c2][r2].colorIndex;
  cells[c2][r2].colorIndex = tmp;

  const matches = findAllMatches();

  // Swap back
  cells[c2][r2].colorIndex = cells[c1][r1].colorIndex;
  cells[c1][r1].colorIndex = tmp;

  return matches.size > 0;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export function update(dt) {
  switch (state) {
    case State.IDLE:
      handleInput();
      break;

    case State.SWAPPING:
    case State.SWAP_BACK:
      updateSwap(dt);
      break;

    case State.MATCHING:
      updateMatching(dt);
      break;

    case State.REMOVING:
      updateRemoving(dt);
      break;

    case State.FALLING:
      updateFalling(dt);
      break;
  }
}

// --- Input handling (IDLE) ---

function handleInput() {
  const click = Input.getClickedCell();
  if (!click || click.col < 0) {
    return;
  }

  const selected = Input.getSelectedCell();

  if (!selected) {
    // First selection
    Input.setSelectedCell({ col: click.col, row: click.row });
    return;
  }

  if (selected.col === click.col && selected.row === click.row) {
    // Deselect
    Input.setSelectedCell(null);
    return;
  }

  if (!Input.isAdjacent(selected, click)) {
    // Not adjacent — select the new cell instead
    Input.setSelectedCell({ col: click.col, row: click.row });
    return;
  }

  // Attempt swap
  if (swapProducesMatch(selected.col, selected.row, click.col, click.row)) {
    beginSwap(selected, click, true);
  } else {
    // Invalid swap — animate there and back
    beginSwap(selected, click, false);
  }
  Input.setSelectedCell(null);
}

function beginSwap(a, b, valid) {
  swapA = { col: a.col, row: a.row };
  swapB = { col: b.col, row: b.row };
  swapTimer = 0;
  playerInitiatedSwap = valid;

  const cellA = cells[a.col][a.row];
  const cellB = cells[b.col][b.row];

  // Set animation targets to each other's positions
  cellA.targetX = pixelX(b.col);
  cellA.targetY = pixelY(b.row);
  cellB.targetX = pixelX(a.col);
  cellB.targetY = pixelY(a.row);

  state = State.SWAPPING;
}

// --- Swap animation ---

function updateSwap(dt) {
  swapTimer += dt;
  const duration = CONFIG.animation.swapDuration;
  const t = Math.min(swapTimer / duration, 1);
  const ease = t * (2 - t); // ease-out quad

  const cA = cells[swapA.col][swapA.row];
  const cB = cells[swapB.col][swapB.row];

  const startAx = pixelX(swapA.col), startAy = pixelY(swapA.row);
  const startBx = pixelX(swapB.col), startBy = pixelY(swapB.row);

  cA.x = startAx + (cA.targetX - startAx) * ease;
  cA.y = startAy + (cA.targetY - startAy) * ease;
  cB.x = startBx + (cB.targetX - startBx) * ease;
  cB.y = startBy + (cB.targetY - startBy) * ease;

  if (t >= 1) {
    if (state === State.SWAP_BACK) {
      // Finished reversing invalid swap
      cA.x = startAx; cA.y = startAy;
      cB.x = startBx; cB.y = startBy;
      cA.targetX = startAx; cA.targetY = startAy;
      cB.targetX = startBx; cB.targetY = startBy;
      state = State.IDLE;
      return;
    }

    // Commit the swap in data
    commitSwap();

    if (!playerInitiatedSwap) {
      // Reverse animation
      const tmpA = { col: swapA.col, row: swapA.row };
      swapA = { col: swapB.col, row: swapB.row };
      swapB = tmpA;
      const cellA2 = cells[swapA.col][swapA.row];
      const cellB2 = cells[swapB.col][swapB.row];
      cellA2.targetX = pixelX(swapB.col);
      cellA2.targetY = pixelY(swapB.row);
      cellB2.targetX = pixelX(swapA.col);
      cellB2.targetY = pixelY(swapA.row);
      swapTimer = 0;
      state = State.SWAP_BACK;
      return;
    }

    // Valid swap — look for matches
    Scoring.resetCombo();
    cascading = true;
    enterMatching();
  }
}

function commitSwap() {
  const tmp = cells[swapA.col][swapA.row];
  cells[swapA.col][swapA.row] = cells[swapB.col][swapB.row];
  cells[swapB.col][swapB.row] = tmp;

  // Fix positions
  const cA = cells[swapA.col][swapA.row];
  const cB = cells[swapB.col][swapB.row];
  cA.x = cA.targetX = pixelX(swapA.col);
  cA.y = cA.targetY = pixelY(swapA.row);
  cB.x = cB.targetX = pixelX(swapB.col);
  cB.y = cB.targetY = pixelY(swapB.row);
}

// --- Matching ---

function enterMatching() {
  matchedSet = findAllMatches();
  if (matchedSet.size === 0) {
    cascading = false;
    state = State.IDLE;

    // Check for no possible moves — if so, reshuffle
    if (!hasPossibleMoves()) {
      reshuffleBoard();
    }
    return;
  }

  // Start flash
  flashTimer = 0;
  for (const k of matchedSet) {
    const [c, r] = k.split(',').map(Number);
    cells[c][r].flashTimer = 0;
  }
  state = State.MATCHING;
}

function updateMatching(dt) {
  flashTimer += dt;
  const dur = CONFIG.animation.matchFlashDuration;
  const t = flashTimer / dur;

  for (const k of matchedSet) {
    const [c, r] = k.split(',').map(Number);
    const cell = cells[c][r];
    // Pulsate scale and flash opacity
    cell.scale = 1 + 0.15 * Math.sin(t * Math.PI * 4);
    cell.opacity = 1 - t * 0.5;
  }

  if (flashTimer >= dur) {
    // Score this step
    Scoring.addMatch(matchedSet.size);
    state = State.REMOVING;
    removeMatched();
  }
}

function updateRemoving(_dt) {
  // Instant transition into falling after removal
  applyGravity();
  state = State.FALLING;
}

// --- Remove matched pieces ---

function removeMatched() {
  for (const k of matchedSet) {
    const [c, r] = k.split(',').map(Number);
    cells[c][r] = null;
  }
  matchedSet.clear();
}

// --- Gravity / Falling ---

function applyGravity() {
  for (let c = 0; c < W(); c++) {
    // Compact column downward
    let writeRow = H() - 1;
    for (let r = H() - 1; r >= 0; r--) {
      if (cells[c][r] !== null) {
        if (r !== writeRow) {
          cells[c][writeRow] = cells[c][r];
          cells[c][r] = null;
          const cell = cells[c][writeRow];
          // Keep current y for animation, set target
          cell.targetX = pixelX(c);
          cell.targetY = pixelY(writeRow);
          cell.falling = true;
        }
        writeRow--;
      }
    }

    // Fill empty rows at top with new pieces
    for (let r = writeRow; r >= 0; r--) {
      const cell = makeCell(c, r, true);
      // Start above screen, staggered
      cell.y = pixelY(r - (writeRow + 1) - 1);
      cell.targetY = pixelY(r);
      cell.falling = true;
      cells[c][r] = cell;
    }
  }
}

function updateFalling(dt) {
  let stillFalling = false;
  const speed = (TOTAL() / CONFIG.animation.fallDuration) * 1000; // pixels per second

  for (let c = 0; c < W(); c++) {
    for (let r = 0; r < H(); r++) {
      const cell = cells[c][r];
      if (!cell || !cell.falling) continue;

      if (cell.y < cell.targetY) {
        cell.y += speed * (dt / 1000);
        if (cell.y >= cell.targetY) {
          cell.y = cell.targetY;
          cell.falling = false;
        } else {
          stillFalling = true;
        }
      } else {
        cell.y = cell.targetY;
        cell.falling = false;
      }

      // Reset visual properties
      cell.scale = 1;
      cell.opacity = 1;
    }
  }

  if (!stillFalling) {
    // Check for chain matches
    enterMatching();
  }
}

// ---------------------------------------------------------------------------
// Possible-moves check & reshuffle
// ---------------------------------------------------------------------------

function hasPossibleMoves() {
  for (let c = 0; c < W(); c++) {
    for (let r = 0; r < H(); r++) {
      // Try swap right
      if (c + 1 < W() && swapProducesMatch(c, r, c + 1, r)) return true;
      // Try swap down
      if (r + 1 < H() && swapProducesMatch(c, r, c, r + 1)) return true;
    }
  }
  return false;
}

function reshuffleBoard() {
  // Collect all color indices and redistribute
  const colors = [];
  for (let c = 0; c < W(); c++) {
    for (let r = 0; r < H(); r++) {
      colors.push(cells[c][r].colorIndex);
    }
  }

  // Fisher-Yates shuffle
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  let idx = 0;
  for (let c = 0; c < W(); c++) {
    for (let r = 0; r < H(); r++) {
      cells[c][r].colorIndex = colors[idx++];
      cells[c][r].x = cells[c][r].targetX = pixelX(c);
      cells[c][r].y = cells[c][r].targetY = pixelY(r);
      cells[c][r].scale = 1;
      cells[c][r].opacity = 1;
      cells[c][r].falling = false;
    }
  }

  // If still no moves or there are instant matches, just regenerate
  const matches = findAllMatches();
  if (matches.size > 0 || !hasPossibleMoves()) {
    // Full reset of board
    for (let c = 0; c < W(); c++) {
      for (let r = 0; r < H(); r++) {
        cells[c][r].colorIndex = randomColor();
      }
    }
    eliminateInitialMatches();
    if (!hasPossibleMoves()) {
      // Extreme fallback — just regenerate entirely
      for (let c = 0; c < W(); c++) {
        for (let r = 0; r < H(); r++) {
          cells[c][r].colorIndex = randomColor();
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------------

export function draw(ctx) {
  const { cellSize, padding, width, height } = CONFIG.grid;
  const total = cellSize + padding;

  // Grid background
  const bgW = width * total - padding + 12;
  const bgH = height * total - padding + 12;
  ctx.fillStyle = CONFIG.colors.gridBg;
  roundRect(ctx, gridOffsetX - 6, gridOffsetY - 6, bgW, bgH, 12);
  ctx.fill();

  // Draw cells
  for (let c = 0; c < width; c++) {
    for (let r = 0; r < height; r++) {
      const cell = cells[c][r];
      if (!cell) continue;
      drawPiece(ctx, cell, cellSize);
    }
  }

  // Selection highlight
  const selected = Input.getSelectedCell();
  if (selected && state === State.IDLE) {
    const sx = pixelX(selected.col);
    const sy = pixelY(selected.row);
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 12;
    roundRect(ctx, sx - 2, sy - 2, cellSize + 4, cellSize + 4, CONFIG.visual.cornerRadius + 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPiece(ctx, cell, size) {
  const color = CONFIG.colors.pieces[cell.colorIndex];
  if (!color) return;

  const sprite = getAsset(`piece_${cell.colorIndex}`) || getAsset('piece');

  ctx.save();
  ctx.globalAlpha = cell.opacity;

  const cx = cell.x + size / 2;
  const cy = cell.y + size / 2;
  const s = cell.scale;

  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);

  if (sprite) {
    ctx.drawImage(sprite, cell.x + 2, cell.y + 2, size - 4, size - 4);
  } else {
    // Shadow
    ctx.shadowColor = color;
    ctx.shadowBlur = CONFIG.visual.shadowBlur;

    ctx.fillStyle = color;

    if (CONFIG.visual.style === 'circle') {
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Rounded square
      roundRect(ctx, cell.x + 2, cell.y + 2, size - 4, size - 4, CONFIG.visual.cornerRadius);
      ctx.fill();
    }

    // Inner highlight
    ctx.shadowBlur = 0;
    ctx.globalAlpha = cell.opacity * 0.35;
    ctx.fillStyle = '#fff';
    if (CONFIG.visual.style === 'circle') {
      ctx.beginPath();
      ctx.arc(cx - size * 0.12, cy - size * 0.12, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      roundRect(ctx, cell.x + 6, cell.y + 6, size * 0.35, size * 0.25, 4);
      ctx.fill();
    }
  }

  ctx.restore();
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

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function handleClick(col, row) {
  // Handled via Input module polling in update()
}

export function getGridOffset() {
  return { x: gridOffsetX, y: gridOffsetY };
}

export function isIdle() {
  return state === State.IDLE;
}

export function reset(canvasWidth, canvasHeight) {
  return init(canvasWidth, canvasHeight);
}
