/**
 * config.js - Parameterization surface for the Racing template.
 *
 * Every tunable value lives here so that ArcadeForge (or a human) can
 * re-skin / re-balance the game by editing a single file.
 */

const config = {
  colors: {
    background: '#1a1a2e',
    track: '#333355',
    trackEdge: '#eaeaea',
    player: '#e94560',
    opponent: '#0f3460',
    text: '#eaeaea',
    accent: '#e94560',
  },

  vehicle: {
    topSpeed: 6,
    acceleration: 0.07,
    braking: 0.1,
    turnSpeed: 0.035,
    size: 16,
    driftBoost: 1.15,
  },

  track: {
    segments: [
      { type: 'straight', length: 200 },
      { type: 'curve', angle: 90, radius: 120 },
      { type: 'straight', length: 150 },
      { type: 'curve', angle: 90, radius: 120 },
      { type: 'straight', length: 200 },
      { type: 'curve', angle: 90, radius: 120 },
      { type: 'straight', length: 150 },
      { type: 'curve', angle: 90, radius: 120 },
    ],
    width: 80,
  },

  opponents: {
    count: 2,
    speedVariation: 0.1,
    rubberBanding: true,
  },

  race: {
    lapCount: 3,
    showLapTimes: true,
    showPosition: true,
  },

  juice: {
    screenShake: true,
    shakeOnCollision: 0.4,
  },

  visual: {
    style: 'geometric',
  },

  game: {
    title: 'Racing',
  },
};

export default config;
