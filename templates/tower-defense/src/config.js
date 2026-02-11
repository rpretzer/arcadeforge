/**
 * Tower Defense - Configuration Surface
 *
 * All tunables live here. Edit these values to customize towers, enemies,
 * waves, economy, and visuals without touching game logic.
 */

const config = {
  colors: {
    background: '#1a1a2e',
    grid: '#16213e',
    path: '#0f3460',
    text: '#eaeaea',
    accent: '#e94560',
    tower: '#00d4ff',
    enemy: '#ff4757',
    projectile: '#ffd32a',
  },

  economy: {
    startGold: 150,
    killReward: 10,
    waveBonus: 50,
  },

  grid: {
    cols: 12,
    rows: 8,
    cellSize: 50,
  },

  towers: [
    {
      name: 'Basic',
      damage: 10,
      range: 3,
      fireRate: 1.0,
      cost: 50,
      upgradeCost: 40,
      color: '#00d4ff',
      projectileColor: '#00d4ff',
      type: 'single',
    },
    {
      name: 'Splash',
      damage: 8,
      range: 2.5,
      fireRate: 0.7,
      cost: 75,
      upgradeCost: 60,
      color: '#ff6b6b',
      projectileColor: '#ff6b6b',
      type: 'splash',
      splashRadius: 1.5,
    },
    {
      name: 'Slow',
      damage: 5,
      range: 3,
      fireRate: 0.8,
      cost: 60,
      upgradeCost: 45,
      color: '#7bed9f',
      projectileColor: '#7bed9f',
      type: 'slow',
      slowFactor: 0.5,
      slowDuration: 2,
    },
    {
      name: 'Sniper',
      damage: 30,
      range: 5,
      fireRate: 0.3,
      cost: 100,
      upgradeCost: 80,
      color: '#ffd32a',
      projectileColor: '#ffd32a',
      type: 'single',
    },
  ],

  // Path waypoints in grid coordinates — enemies follow this route
  path: [
    { x: 0, y: 4 },
    { x: 3, y: 4 },
    { x: 3, y: 1 },
    { x: 6, y: 1 },
    { x: 6, y: 6 },
    { x: 9, y: 6 },
    { x: 9, y: 3 },
    { x: 11, y: 3 },
  ],

  waves: [
    { enemies: [{ type: 'normal', count: 6, interval: 1.2 }] },
    { enemies: [{ type: 'normal', count: 8, interval: 1.0 }] },
    { enemies: [{ type: 'normal', count: 6, interval: 1.0 }, { type: 'fast', count: 3, interval: 0.8 }] },
    { enemies: [{ type: 'armored', count: 3, interval: 1.5 }, { type: 'normal', count: 5, interval: 1.0 }] },
    { enemies: [{ type: 'fast', count: 8, interval: 0.6 }] },
    { enemies: [{ type: 'normal', count: 10, interval: 0.8 }, { type: 'armored', count: 4, interval: 1.2 }] },
    { enemies: [{ type: 'fast', count: 6, interval: 0.5 }, { type: 'armored', count: 4, interval: 1.0 }] },
    { enemies: [{ type: 'normal', count: 12, interval: 0.6 }, { type: 'fast', count: 6, interval: 0.4 }, { type: 'armored', count: 5, interval: 0.8 }] },
  ],

  enemyTypes: {
    normal: { health: 50, speed: 1.0, size: 10, color: '#ff4757', reward: 10 },
    fast:   { health: 30, speed: 2.0, size: 8,  color: '#ffa502', reward: 15 },
    armored:{ health: 120, speed: 0.6, size: 14, color: '#747d8c', reward: 25 },
  },

  visual: {
    style: 'geometric',
  },

  game: {
    title: 'Tower Defense',
    startingLives: 15,
  },
};

export default config;
