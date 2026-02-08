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
    sessionLength: 'medium',
  },
};

export default config;
