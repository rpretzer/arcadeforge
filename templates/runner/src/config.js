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
    jumpForceShort: -7,   // tap jump (variable height)
    baseSpeed:       4,
    speedIncrement:  0.002,
  },

  obstacles: {
    frequency: 0.02,
    minHeight: 30,
    maxHeight: 60,
    width:     25,
    gap:       200,
    nearMissMargin: 25,    // px - vertical distance for near-miss bonus
    nearMissPoints: 15,
    usePatterns: true,     // spawn learnable patterns instead of pure random
    types: [
      { id: 'block', width: 25, heightRange: [30, 60], color: '#0f3460' },
      { id: 'spike', width: 30, heightRange: [35, 50], color: '#ff4444' },
      { id: 'moving', width: 25, heightRange: [30, 55], color: '#8844cc' },
    ],
  },

  scoring: {
    timeBonus: 0.5,        // points per second (baseline)
    comboDecayTime: 1.5,   // seconds without collectible to reset combo
    comboMultiplier: 0.5,  // each collectible adds this to multiplier (1 + combo * 0.5)
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
    groundOffset: 60,
    doubleJump:   true,   // allow second jump in mid-air
  },

  visual: {
    style:        'geometric',
    cornerRadius: 8,
    shadowBlur:   10,
    parallaxFar:  0.25,
    parallaxNear: 0.35,
    retroEra:      null,   // 'nes' | 'snes' — enables pixelated canvas, dark outlines
    scanlines:    false,
    outlineColor: '#0a0a14',
  },

  juice: {
    screenShake:    true,
    shakeIntensity: 1,     // 0-2 scale
    particleBurst:  true,
    scorePop:       true,  // floating +N numbers
    hitPause:       0,     // ms freeze on collect (0 = off)
  },

  game: {
    title:         'Endless Runner',
  },
};

export default config;
