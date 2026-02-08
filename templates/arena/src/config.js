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
    sessionLength: 'medium',
  },
};

export default config;
