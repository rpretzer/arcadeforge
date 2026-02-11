/**
 * Tower Defense - Game State Manager
 *
 * Manages states: menu, playing, gameover, victory.
 * Orchestrates all modules and draws UI overlays.
 * HUD: gold, lives, wave counter, tower palette at bottom.
 */

import config from './config.js';
import { init as initGrid, draw as drawGrid, isBuildable, placeTower, pixelToGrid, reset as resetGrid, getCellSize } from './grid.js';
import { init as initPath } from './path.js';
import { init as initEnemies, update as updateEnemies, draw as drawEnemies, startWave, isWaveActive, getWaveIndex, getTotalWaves, areAllWavesComplete, reset as resetEnemies } from './enemies.js';
import { init as initTowers, update as updateTowers, draw as drawTowers, addTower, getTowerAt, upgradeTower, getUpgradeCost, getPlacedTowers, reset as resetTowers } from './towers.js';
import { init as initProjectiles, update as updateProjectiles, draw as drawProjectiles, setGoldCallback, reset as resetProjectiles } from './projectiles.js';

let state = 'menu'; // 'menu' | 'playing' | 'gameover' | 'victory'
let canvas, ctx;
let gold = 0;
let lives = 0;
let selectedTowerIndex = -1; // index into config.towers for placement
let selectedPlacedTower = null; // reference to a placed tower for upgrade
let hoverCol = -1, hoverRow = -1;
let paused = false;
let hintTimer = 5000;
let firstInput = false;

const PALETTE_HEIGHT = 80;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function init(_canvas, _ctx) {
  canvas = _canvas;
  ctx = _ctx;
  initGrid(canvas, ctx);
  initPath();
  initEnemies(canvas, ctx);
  initTowers(canvas, ctx);
  initProjectiles(canvas, ctx);
  setGoldCallback(addGold);
}

export function update(dt) {
  if (state !== 'playing' || paused) return;

  if (!firstInput) {
    hintTimer -= dt * 1000;
  }

  updateTowers(dt);
  const leaked = updateEnemies(dt);
  updateProjectiles(dt);

  if (leaked > 0) {
    lives -= leaked;
    if (lives <= 0) {
      lives = 0;
      state = 'gameover';
    }
  }

  // Check victory
  if (areAllWavesComplete() && lives > 0) {
    state = 'victory';
  }
}

export function draw() {
  const gridH = config.grid.rows * getCellSize();

  // Clear
  ctx.fillStyle = config.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state === 'menu') {
    drawGrid(hoverCol, hoverRow, null, [], null);
    drawMenu();
  } else if (state === 'playing') {
    const towerDef = selectedTowerIndex >= 0 ? config.towers[selectedTowerIndex] : null;
    drawGrid(hoverCol, hoverRow, towerDef, getPlacedTowers(), selectedPlacedTower);
    drawEnemies();
    drawTowers(hoverCol, hoverRow);
    drawProjectiles();
    drawHUD(gridH);
    drawPalette(gridH);
    drawControlHints();
    if (paused) drawPauseOverlay();
  } else if (state === 'gameover') {
    const towerDef = null;
    drawGrid(-1, -1, towerDef, getPlacedTowers(), null);
    drawEnemies();
    drawTowers(-1, -1);
    drawProjectiles();
    drawHUD(gridH);
    drawGameOver();
  } else if (state === 'victory') {
    const towerDef = null;
    drawGrid(-1, -1, towerDef, getPlacedTowers(), null);
    drawTowers(-1, -1);
    drawHUD(gridH);
    drawVictory();
  }
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

  if (state !== 'playing' || paused) return;

  if (!firstInput) {
    firstInput = true;
    hintTimer = 0;
  }

  const gridH = config.grid.rows * getCellSize();

  // Check if click is in the palette area
  if (mouse.y >= gridH) {
    handlePaletteClick(mouse, gridH);
    return;
  }

  // Click on the grid
  const { col, row } = pixelToGrid(mouse.x, mouse.y);

  // If we have a tower selected for placement
  if (selectedTowerIndex >= 0) {
    const def = config.towers[selectedTowerIndex];
    if (isBuildable(col, row) && gold >= def.cost) {
      gold -= def.cost;
      placeTower(col, row);
      addTower(col, row, selectedTowerIndex);
      // Keep tower selected for rapid placement
    }
    selectedPlacedTower = null;
    return;
  }

  // Check if clicking an existing tower (for upgrade)
  const tower = getTowerAt(col, row);
  if (tower) {
    selectedPlacedTower = tower;
    selectedTowerIndex = -1;
    return;
  }

  // Deselect
  selectedPlacedTower = null;
  selectedTowerIndex = -1;
}

export function handleKeyDown(key) {
  if (key === ' ' || key === 'Enter') {
    if (state === 'menu') {
      startGame();
      return;
    }
  }

  if (state === 'playing') {
    if (!firstInput) {
      firstInput = true;
      hintTimer = 0;
    }

    if (key === 'p' || key === 'P') {
      paused = !paused;
      return;
    }

    if (key === 'n' || key === 'N') {
      if (!isWaveActive()) {
        const started = startWave();
        if (started) {
          gold += config.economy.waveBonus;
        }
      }
      return;
    }

    // Number keys to select tower type
    const num = parseInt(key);
    if (num >= 1 && num <= config.towers.length) {
      selectedTowerIndex = num - 1;
      selectedPlacedTower = null;
      return;
    }

    // U to upgrade selected tower
    if ((key === 'u' || key === 'U') && selectedPlacedTower) {
      const cost = getUpgradeCost(selectedPlacedTower);
      if (gold >= cost) {
        gold -= cost;
        upgradeTower(selectedPlacedTower);
      }
      return;
    }

    // Escape to deselect
    if (key === 'Escape') {
      selectedTowerIndex = -1;
      selectedPlacedTower = null;
      return;
    }
  }

  if (key === 'r' || key === 'R') {
    if (state === 'gameover' || state === 'victory') {
      startGame();
    }
  }
}

export function handleMouseMove(mouse) {
  const { col, row } = pixelToGrid(mouse.x, mouse.y);
  hoverCol = col;
  hoverRow = row;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function startGame() {
  resetGrid();
  resetEnemies();
  resetTowers();
  resetProjectiles();
  initPath();
  gold = config.economy.startGold;
  lives = config.game.startingLives;
  selectedTowerIndex = -1;
  selectedPlacedTower = null;
  paused = false;
  hintTimer = 5000;
  firstInput = false;
  state = 'playing';
  // Start first wave automatically
  startWave();
}

function addGold(amount) {
  gold += amount;
}

function handlePaletteClick(mouse, gridH) {
  const paletteY = gridH;
  const towers = config.towers;
  const slotW = 100;
  const totalW = towers.length * slotW;
  const startX = (canvas.width - totalW) / 2;

  for (let i = 0; i < towers.length; i++) {
    const sx = startX + i * slotW;
    if (mouse.x >= sx && mouse.x < sx + slotW && mouse.y >= paletteY && mouse.y < paletteY + PALETTE_HEIGHT) {
      if (selectedTowerIndex === i) {
        // Deselect
        selectedTowerIndex = -1;
      } else {
        selectedTowerIndex = i;
        selectedPlacedTower = null;
      }
      return;
    }
  }

  // Check upgrade button if a placed tower is selected
  if (selectedPlacedTower) {
    const upgBtnX = canvas.width - 120;
    const upgBtnY = gridH + 20;
    if (mouse.x >= upgBtnX && mouse.x < upgBtnX + 100 && mouse.y >= upgBtnY && mouse.y < upgBtnY + 40) {
      const cost = getUpgradeCost(selectedPlacedTower);
      if (gold >= cost) {
        gold -= cost;
        upgradeTower(selectedPlacedTower);
      }
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function drawHUD(gridH) {
  const y = 8;
  ctx.save();
  ctx.font = 'bold 16px monospace';
  ctx.textBaseline = 'top';

  // Gold
  ctx.fillStyle = '#ffd32a';
  ctx.textAlign = 'left';
  ctx.fillText(`Gold: ${gold}`, 10, y);

  // Lives
  ctx.fillStyle = '#ff4757';
  ctx.fillText(`Lives: ${lives}`, 140, y);

  // Wave
  ctx.fillStyle = config.colors.text;
  ctx.textAlign = 'right';
  const waveText = `Wave: ${getWaveIndex()} / ${getTotalWaves()}`;
  ctx.fillText(waveText, canvas.width - 10, y);

  // Next wave hint
  if (!isWaveActive() && getWaveIndex() < getTotalWaves()) {
    ctx.fillStyle = config.colors.accent;
    ctx.textAlign = 'center';
    ctx.font = '14px monospace';
    ctx.fillText('Press N for next wave', canvas.width / 2, y + 2);
  }

  ctx.restore();
}

function drawPalette(gridH) {
  const paletteY = gridH;
  const towers = config.towers;
  const slotW = 100;
  const totalW = towers.length * slotW;
  const startX = (canvas.width - totalW) / 2;

  // Palette background
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, paletteY, canvas.width, PALETTE_HEIGHT);

  ctx.save();
  for (let i = 0; i < towers.length; i++) {
    const t = towers[i];
    const sx = startX + i * slotW;
    const selected = selectedTowerIndex === i;

    // Slot background
    ctx.fillStyle = selected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(sx + 2, paletteY + 4, slotW - 4, PALETTE_HEIGHT - 8);

    if (selected) {
      ctx.strokeStyle = config.colors.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 2, paletteY + 4, slotW - 4, PALETTE_HEIGHT - 8);
    }

    // Tower icon
    ctx.fillStyle = t.color;
    const iconSize = 16;
    ctx.fillRect(sx + slotW / 2 - iconSize / 2, paletteY + 12, iconSize, iconSize);

    // Name
    ctx.fillStyle = config.colors.text;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(t.name, sx + slotW / 2, paletteY + 32);

    // Cost
    const canAfford = gold >= t.cost;
    ctx.fillStyle = canAfford ? '#ffd32a' : '#ff4757';
    ctx.font = '12px monospace';
    ctx.fillText(`${t.cost}g`, sx + slotW / 2, paletteY + 46);

    // Hotkey
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px monospace';
    ctx.fillText(`[${i + 1}]`, sx + slotW / 2, paletteY + 62);
  }

  // Upgrade button if a placed tower is selected
  if (selectedPlacedTower) {
    const upgBtnX = canvas.width - 120;
    const upgBtnY = paletteY + 20;
    const cost = getUpgradeCost(selectedPlacedTower);
    const canAfford = gold >= cost;

    ctx.fillStyle = canAfford ? 'rgba(46, 213, 115, 0.3)' : 'rgba(255,71,87,0.3)';
    ctx.fillRect(upgBtnX, upgBtnY, 100, 40);
    ctx.strokeStyle = canAfford ? '#2ed573' : '#ff4757';
    ctx.lineWidth = 1;
    ctx.strokeRect(upgBtnX, upgBtnY, 100, 40);

    ctx.fillStyle = config.colors.text;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('UPGRADE', upgBtnX + 50, upgBtnY + 14);
    ctx.fillStyle = canAfford ? '#ffd32a' : '#ff4757';
    ctx.font = '11px monospace';
    ctx.fillText(`${cost}g [U]`, upgBtnX + 50, upgBtnY + 30);

    // Show tower info
    ctx.fillStyle = config.colors.text;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${selectedPlacedTower.name} Lv${selectedPlacedTower.level}`, 10, paletteY + PALETTE_HEIGHT - 16);
  }

  ctx.restore();
}

function drawControlHints() {
  if (hintTimer <= 0 || state !== 'playing' || paused) return;

  let alpha = 1;
  if (hintTimer < 1000) alpha = hintTimer / 1000;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = config.colors.text;
  ctx.font = '13px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const gridH = config.grid.rows * getCellSize();
  ctx.fillText('1-4: Select tower | Click: Place | N: Next wave | P: Pause', canvas.width / 2, gridH - 6);
  ctx.restore();
}

function drawPauseOverlay() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = '22px monospace';
  ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 30);
  ctx.restore();
}

function drawMenu() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 42px monospace';
  ctx.fillStyle = config.colors.accent;
  ctx.shadowColor = config.colors.accent;
  ctx.shadowBlur = 16;
  ctx.fillText(config.game.title.toUpperCase(), cx, cy - 60);
  ctx.shadowBlur = 0;

  ctx.font = '18px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('Build towers to defend against waves of enemies', cx, cy);

  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('Select towers with 1-4, click grid to place', cx, cy + 30);

  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '18px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('[ Click or press Enter to start ]', cx, cy + 80);

  ctx.restore();
}

function drawGameOver() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 44px monospace';
  ctx.fillStyle = '#ff4757';
  ctx.shadowColor = '#ff4757';
  ctx.shadowBlur = 12;
  ctx.fillText('GAME OVER', cx, cy - 50);
  ctx.shadowBlur = 0;

  ctx.font = '20px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText(`Survived ${getWaveIndex()} of ${getTotalWaves()} waves`, cx, cy + 10);

  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '16px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('Press R or Click to restart', cx, cy + 60);

  ctx.restore();
}

function drawVictory() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 44px monospace';
  ctx.fillStyle = '#2ed573';
  ctx.shadowColor = '#2ed573';
  ctx.shadowBlur = 16;
  ctx.fillText('VICTORY!', cx, cy - 50);
  ctx.shadowBlur = 0;

  ctx.font = '20px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText(`All ${getTotalWaves()} waves defeated!`, cx, cy + 10);
  ctx.fillText(`Lives remaining: ${lives}`, cx, cy + 40);

  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.font = '16px monospace';
  ctx.fillStyle = config.colors.text;
  ctx.fillText('Press R or Click to play again', cx, cy + 90);

  ctx.restore();
}
