/**
 * config.js - Parameterization surface for the Endless Runner template.
 *
 * Every tunable value lives here so that ArcadeForge (or a human) can
 * re-skin / re-balance the game by editing a single file.
 */

const config = {
  colors: {
    background: '#1a1a2e',
    player:     '#e94560',
    obstacle:   '#0f3460',
    text:       '#eaeaea',
    accent:     '#16213e',
    ground:     '#533483',
  },

  physics: {
    gravity:        0.5,
    jumpForce:      -11,
    baseSpeed:       4,
    speedIncrement:  0.002,
  },

  obstacles: {
    frequency: 0.02,   // probability per frame of spawning
    minHeight: 30,
    maxHeight: 60,
    width:     25,
    gap:       200,     // minimum px between obstacles
    types: [
      { id: 'block', width: 25, heightRange: [30, 60], color: '#0f3460' },
      { id: 'spike', width: 30, heightRange: [35, 50], color: '#ff4444' },
      { id: 'moving', width: 25, heightRange: [30, 55], color: '#8844cc' },
    ],
  },

  collectibles: {
    spawnChance: 0.03,
    types: [
      { id: 'coin', points: 10, color: '#ffd700', size: 18 },
      { id: 'star', points: 50, color: '#00ffff', size: 20 },
    ],
  },

  powerups: {
    spawnChance: 0.005,
    duration: {
      shield: Infinity,
      magnet: 15000,
      slowmo: 10000,
    },
  },

  player: {
    width:        40,
    height:       40,
    groundOffset: 60,   // distance from bottom of canvas to ground line
  },

  visual: {
    style:        'geometric',
    cornerRadius: 8,
    shadowBlur:   10,
  },

  game: {
    title:         'Endless Runner',
  },
};

export default config;
