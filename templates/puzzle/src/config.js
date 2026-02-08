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
    sessionLength: 'medium',
    timeLimit: 0,           // seconds; 0 = unlimited
    difficultyProgression: 1.1,
  },

  scoring: {
    matchBase: 100,
    comboMultiplier: 1.5,
    levelUpThreshold: 1000,
  },

  visual: {
    style: 'geometric',     // 'geometric' = rounded squares, 'circle' = circles
    cornerRadius: 8,
    shadowBlur: 6,
  },

  animation: {
    swapDuration: 200,       // ms
    fallDuration: 300,       // ms
    matchFlashDuration: 400, // ms
  },
};

export default CONFIG;
