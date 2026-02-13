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
    spawnRate: 0.02,
    waveDifficultyCurve: 1.2,
    types: [
      { name: 'basic', hp: 1, speedMult: 1.0, sizeMult: 1.0, score: 50, colorShift: 0, behavior: 'chase' },
      { name: 'tank',  hp: 3, speedMult: 0.5, sizeMult: 1.6, score: 150, colorShift: -30, behavior: 'chase' },
      { name: 'fast',  hp: 1, speedMult: 2.0, sizeMult: 0.7, score: 100, colorShift: 30, behavior: 'zigzag' },
    ],
    boss: { name: 'boss', hp: 15, speedMult: 0.4, sizeMult: 2.5, score: 500, colorShift: 0, behavior: 'orbit' },
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
    retroEra: null,      // 'nes' | 'snes' — pixelated canvas, dark outlines
    scanlines: false,
    outlineColor: '#0a0a14',
  },

  juice: {
    screenShake: true,
    shakeOnKill: 0.3,     // intensity 0-1
    scorePop: true,
    hitPause: 0,
  },

  waves: {
    bossEvery: 5,         // boss wave every N waves
    modifiers: true,      // wave-specific modifiers (fast, tanky, etc.)
  },

  combo: {
    windowSeconds: 2,    // kills within this time chain
    multiplierPerKill: 0.25,  // each kill adds to multiplier (1 + kills * 0.25)
  },

  game: {
    title: 'Arena Shooter',
  },
};

export default config;
