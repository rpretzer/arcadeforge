/**
 * Arena Shooter - Configuration Surface
 *
 * All tunables live here. Edit these values to customize gameplay,
 * visuals, difficulty, and feel without touching game logic.
 */

const config = {
  colors: {
    background: '#1a1a2e',
    player: '#00d4ff',
    enemy: '#ff4757',
    bullet: '#ffd32a',
    text: '#eaeaea',
    accent: '#7bed9f',
    healthBar: '#ff6b6b',
  },

  player: {
    speed: 5,
    size: 30,
    maxHealth: 5,
  },

  bullets: {
    speed: 10,
    size: 5,
    cooldown: 150,   // milliseconds between shots
  },

  enemies: {
    baseSpeed: 2.5,
    size: 25,
    spawnRate: 0.02,  // probability per frame of spawning during a wave
    waveDifficultyCurve: 1.2,
    types: [
      { name: 'basic', hp: 1, speedMult: 1.0, sizeMult: 1.0, score: 50, colorShift: 0 },
      { name: 'tank',  hp: 3, speedMult: 0.5, sizeMult: 1.6, score: 150, colorShift: -30 },
      { name: 'fast',  hp: 1, speedMult: 2.0, sizeMult: 0.7, score: 100, colorShift: 30 },
    ],
  },

  powerups: {
    dropChance: 0.2,
    size: 14,
    lifetime: 8,
    effectDuration: 10,
    shieldHits: 3,
    weights: [0.5, 0.3, 0.2],  // health, rapidfire, shield
  },

  arena: {
    width: 800,
    height: 600,
  },

  visual: {
    style: 'geometric',
    cornerRadius: 4,
    shadowBlur: 8,
  },

  game: {
    title: 'Arena Shooter',
  },
};

export default config;
