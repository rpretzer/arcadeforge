/**
 * Tower Defense - Grid System
 *
 * Manages the grid of cells: buildable vs path.
 * Draws grid lines, highlights buildable cells on hover,
 * shows range circles during placement, and tracks placed towers.
 */

import config from './config.js';

let canvas, ctx;
let cols, rows, cellSize;
let cells = []; // 2D array: 'empty' | 'path' | 'tower'
let pathCells = new Set(); // Set of "col,row" strings for quick lookup

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  cols = config.grid.cols;
  rows = config.grid.rows;
  cellSize = config.grid.cellSize;

  // Initialize all cells as empty
  cells = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = 'empty';
    }
  }

  // Mark path cells
  pathCells.clear();
  const waypoints = config.path;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    markPathSegment(from.x, from.y, to.x, to.y);
  }
}

function markPathSegment(x0, y0, x1, y1) {
  // Bresenham-like line between two grid points
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0, cy = y0;

  while (true) {
    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
      cells[cy][cx] = 'path';
      pathCells.add(`${cx},${cy}`);
    }
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
}

export function reset() {
  init(canvas, ctx);
}

export function isBuildable(col, row) {
  if (col < 0 || col >= cols || row < 0 || row >= rows) return false;
  return cells[row][col] === 'empty';
}

export function placeTower(col, row) {
  cells[row][col] = 'tower';
}

export function isPath(col, row) {
  return pathCells.has(`${col},${row}`);
}

export function gridToPixel(col, row) {
  return {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  };
}

export function pixelToGrid(px, py) {
  return {
    col: Math.floor(px / cellSize),
    row: Math.floor(py / cellSize),
  };
}

export function getCellSize() {
  return cellSize;
}

export function draw(hoverCol, hoverRow, selectedTowerDef, placedTowers, selectedPlacedTower) {
  // Draw grid background
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;

      if (cells[r][c] === 'path') {
        ctx.fillStyle = config.colors.path;
      } else {
        ctx.fillStyle = config.colors.grid;
      }
      ctx.fillRect(x, y, cellSize, cellSize);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    }
  }

  // Highlight hover cell
  if (hoverRow >= 0 && hoverRow < rows && hoverCol >= 0 && hoverCol < cols) {
    const x = hoverCol * cellSize;
    const y = hoverRow * cellSize;

    if (cells[hoverRow][hoverCol] === 'empty' && selectedTowerDef) {
      // Buildable + tower selected: green highlight + range circle
      ctx.fillStyle = 'rgba(0, 255, 100, 0.2)';
      ctx.fillRect(x, y, cellSize, cellSize);

      // Range circle
      const center = gridToPixel(hoverCol, hoverRow);
      const rangePixels = selectedTowerDef.range * cellSize;
      ctx.beginPath();
      ctx.arc(center.x, center.y, rangePixels, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (cells[hoverRow][hoverCol] === 'empty') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  // Draw range for selected placed tower
  if (selectedPlacedTower) {
    const center = gridToPixel(selectedPlacedTower.col, selectedPlacedTower.row);
    const rangePixels = selectedPlacedTower.range * cellSize;
    ctx.beginPath();
    ctx.arc(center.x, center.y, rangePixels, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
  }
}
