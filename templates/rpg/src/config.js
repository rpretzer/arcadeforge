/**
 * config.js - Parameterization surface for the RPG Adventure template.
 *
 * Every tunable value lives here so that ArcadeForge (or a human) can
 * re-skin / re-design the RPG by editing a single file.
 */

const config = {
  colors: {
    background: '#0d1117',
    floor:      '#1e1e2e',
    wall:       '#3a3a5c',
    player:     '#58a6ff',
    enemy:      '#f78166',
    npc:        '#f0c040',
    item:       '#50fa7b',
    text:       '#c9d1d9',
    accent:     '#f78166',
    hud:        '#58a6ff',
  },

  player: {
    speed: 3,
    size: 24,
    maxHealth: 100,
    attackDamage: 10,
    attackRange: 40,
    attackCooldown: 500,
  },

  combat: {
    invulnDuration: 1.0,
    knockback: 5,
    damageNumberDuration: 0.8,
  },

  map: {
    roomWidth: 800,
    roomHeight: 600,
    tileSize: 40,
    wallThickness: 40,
  },

  inventory: {
    maxSize: 6,
    slotSize: 40,
  },

  visual: {
    style: 'geometric',
  },

  game: {
    title: 'Realm Quest',
  },

  rpg: {
    startRoom: 'entrance',

    rooms: {
      entrance: {
        name: 'Entrance Hall',
        exits: { right: 'hallway' },
        enemies: [],
        items: [],
        npcs: ['elder'],
        wallColor: '#3a3a5c',
        floorColor: '#1e1e2e',
      },
      hallway: {
        name: 'Dark Hallway',
        exits: { left: 'entrance', right: 'armory', bottom: 'dungeon' },
        enemies: ['slime', 'slime'],
        items: ['potion'],
        npcs: [],
        wallColor: '#2a2a4c',
        floorColor: '#16162e',
      },
      armory: {
        name: 'Old Armory',
        exits: { left: 'hallway' },
        enemies: ['skeleton'],
        items: ['sword'],
        npcs: [],
        wallColor: '#4a3a3a',
        floorColor: '#2e1e1e',
      },
      dungeon: {
        name: 'Deep Dungeon',
        exits: { top: 'hallway' },
        enemies: ['skeleton', 'slime'],
        items: ['key', 'potion'],
        npcs: [],
        wallColor: '#1a1a3c',
        floorColor: '#0e0e1e',
      },
    },

    enemies: {
      slime: {
        name: 'Slime',
        health: 30,
        damage: 5,
        speed: 1,
        size: 20,
        color: '#44cc44',
        behavior: 'wander',
      },
      skeleton: {
        name: 'Skeleton',
        health: 50,
        damage: 10,
        speed: 2,
        size: 22,
        color: '#ccccaa',
        behavior: 'chase',
      },
    },

    items: {
      potion: {
        name: 'Health Potion',
        type: 'consumable',
        effect: 'heal',
        value: 30,
        color: '#ff4466',
      },
      sword: {
        name: 'Iron Sword',
        type: 'weapon',
        effect: 'damage',
        value: 5,
        color: '#aaaadd',
      },
      key: {
        name: 'Dungeon Key',
        type: 'quest',
        effect: 'none',
        value: 0,
        color: '#ffdd44',
      },
    },

    npcs: {
      elder: {
        name: 'Village Elder',
        dialogue: [
          'Welcome, adventurer. Dark times have fallen upon us.',
          'A cursed key lies deep in the dungeon below.',
          'Find it and bring it back here to lift the curse.',
          'Be careful — the creatures grow stronger in the depths.',
        ],
        color: '#f0c040',
      },
    },

    quest: {
      objective: 'Find the Dungeon Key and return to the Entrance Hall',
      requiredItem: 'key',
      completionRoom: 'entrance',
    },
  },
};

export default config;
