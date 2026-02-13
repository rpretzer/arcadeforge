/**
 * Configuration surface for the Match-3 Puzzle template.
 * Edit these values to customize gameplay, visuals, and difficulty.
 */
const CONFIG = {
  colors: {
    background: '#0a0a1a',
    text: '#ffffff',
    accent: '#e94560',
    gridBg: '#1a1a2e',
    pieces: ['#e94560', '#00d4ff', '#00ff41', '#ff00ff', '#ffaa00', '#8bd3dd'],
  },

  grid: {
    width: 7,
    height: 7,
    cellSize: 60,
    padding: 4,
    matchSize: 3,
  },

  game: {
    title: 'Puzzle',
    timeLimit: 0,           // seconds; 0 = unlimited
    difficultyProgression: 1.1,
  },

  scoring: {
    matchBase: 100,
    comboMultiplier: 1.5,
    levelUpThreshold: 1000,
    timeBonusThreshold: 500,   // every N points adds 10 seconds
  },

  special: {
    spawnChance: 0.05,         // 5% chance on new piece generation
    bombRadius: 1,             // clears (2r+1)x(2r+1) area — 1 = 3x3
  },

  visual: {
    style: 'geometric',     // 'geometric' | 'circle' | 'pixel' (retro)
    cornerRadius: 8,
    shadowBlur: 6,
    retroEra: null,        // 'nes' | 'snes' — pixelated, dark outlines
    scanlines: false,
    outlineColor: '#0a0a14',
  },

  animation: {
    swapDuration: 200,
    fallDuration: 300,
    matchFlashDuration: 400,
  },

  juice: {
    screenShake: true,
    boardShakeOnCombo: 3,   // min combo to trigger board shake
    shakeIntensity: 1,
    match4Bonus: 1.5,        // multiplier for 4+ matches vs 3
    match5Bonus: 2.5,
  },
};

export default CONFIG;
