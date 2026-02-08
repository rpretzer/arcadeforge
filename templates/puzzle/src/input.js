/**
 * Input handling for mouse and touch.
 * Converts screen coordinates to grid cell coordinates.
 */
import CONFIG from './config.js';

let canvas = null;
let gridOffsetX = 0;
let gridOffsetY = 0;
let selectedCell = null;   // { col, row } or null
let pendingClick = null;   // { col, row } or null — consumed by grid

/**
 * Initialise input listeners.
 * @param {HTMLCanvasElement} cvs
 * @param {number} ox  grid pixel offset X on canvas
 * @param {number} oy  grid pixel offset Y on canvas
 */
export function init(cvs, ox, oy) {
  canvas = cvs;
  gridOffsetX = ox;
  gridOffsetY = oy;
  selectedCell = null;
  pendingClick = null;

  canvas.addEventListener('mousedown', onPointer);
  canvas.addEventListener('touchstart', onTouch, { passive: false });
}

export function updateOffsets(ox, oy) {
  gridOffsetX = ox;
  gridOffsetY = oy;
}

function onTouch(e) {
  e.preventDefault();
  const t = e.touches[0];
  handlePointer(t.clientX, t.clientY);
}

function onPointer(e) {
  handlePointer(e.clientX, e.clientY);
}

function handlePointer(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (clientX - rect.left) * scaleX;
  const py = (clientY - rect.top) * scaleY;

  const { cellSize, padding, width, height } = CONFIG.grid;
  const totalCell = cellSize + padding;

  const col = Math.floor((px - gridOffsetX) / totalCell);
  const row = Math.floor((py - gridOffsetY) / totalCell);

  if (col < 0 || col >= width || row < 0 || row >= height) {
    // Click outside grid — could be used for menu clicks
    pendingClick = { col: -1, row: -1, px, py };
    return;
  }

  pendingClick = { col, row, px, py };
}

/**
 * Return and consume the latest pending click.
 * @returns {{ col: number, row: number, px: number, py: number } | null}
 */
export function getClickedCell() {
  const c = pendingClick;
  pendingClick = null;
  return c;
}

export function getSelectedCell() {
  return selectedCell;
}

export function setSelectedCell(cell) {
  selectedCell = cell;
}

/**
 * True if a and b are orthogonally adjacent.
 */
export function isAdjacent(a, b) {
  const dc = Math.abs(a.col - b.col);
  const dr = Math.abs(a.row - b.row);
  return (dc + dr) === 1;
}

export function reset() {
  selectedCell = null;
  pendingClick = null;
}
