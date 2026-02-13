import chalk from 'chalk';
import type { GameDesignSnapshot } from './snapshot.js';
import { validateConfig } from './validation.js';
import { createProvider, resolveProviderConfig } from './providers/index.js';
import type { ChatSession } from './providers/types.js';

// Base configuration schemas for the AI to fill/modify
const SCHEMAS = {
  runner: {
    colors: { background: '', player: '', obstacle: '', ground: '', text: '', accent: '' },
    physics: { gravity: 0.5, jumpForce: -11, baseSpeed: 4, speedIncrement: 0.002 },
    obstacles: { frequency: 0.02, minHeight: 30, maxHeight: 60, width: 25, gap: 200, types: [
      { id: 'block', width: 25, heightRange: [30, 60], color: '' },
      { id: 'spike', width: 30, heightRange: [35, 50], color: '#ff4444' },
      { id: 'moving', width: 25, heightRange: [30, 55], color: '' },
    ] },
    collectibles: { spawnChance: 0.03, types: [
      { id: 'coin', points: 10, color: '#ffd700', size: 18 },
      { id: 'star', points: 50, color: '#00ffff', size: 20 },
    ] },
    powerups: { spawnChance: 0.005, duration: { shield: 999999, magnet: 15000, slowmo: 10000 } },
    player: { width: 40, height: 40, groundOffset: 60 },
    visual: { style: 'geometric', cornerRadius: 8, shadowBlur: 10 },
    game: { title: '' }
  },
  arena: {
    colors: { background: '', player: '', enemy: '', bullet: '', text: '', accent: '', healthBar: '' },
    player: { speed: 5, size: 30, maxHealth: 5 },
    bullets: { speed: 10, size: 5, cooldown: 150 },
    enemies: { baseSpeed: 2.5, size: 25, spawnRate: 0.02, waveDifficultyCurve: 1.2, types: [
      { name: 'basic', hp: 1, speedMult: 1.0, sizeMult: 1.0, score: 50, colorShift: 0 },
      { name: 'tank', hp: 3, speedMult: 0.5, sizeMult: 1.6, score: 150, colorShift: -30 },
      { name: 'fast', hp: 1, speedMult: 2.0, sizeMult: 0.7, score: 100, colorShift: 30 },
    ] },
    powerups: { dropChance: 0.2, size: 14, lifetime: 8, effectDuration: 10, shieldHits: 3, weights: [0.5, 0.3, 0.2] },
    arena: { width: 800, height: 600 },
    visual: { style: 'geometric', cornerRadius: 4, shadowBlur: 8 },
    game: { title: '' }
  },
  puzzle: {
    colors: { background: '', accent: '', text: '', gridBg: '', pieces: ['', '', '', '', '', ''] },
    grid: { width: 7, height: 7, cellSize: 60, padding: 4, matchSize: 3 },
    game: { title: '', timeLimit: 120, difficultyProgression: 1.1 },
    scoring: { matchBase: 100, comboMultiplier: 1.5, levelUpThreshold: 1000, timeBonusThreshold: 500 },
    special: { spawnChance: 0.05, bombRadius: 1 },
    visual: { style: 'geometric', cornerRadius: 8, shadowBlur: 6 },
    animation: { swapDuration: 200, fallDuration: 300, matchFlashDuration: 400 }
  },
  rpg: {
    colors: { background: '', floor: '', wall: '', player: '', enemy: '', npc: '', item: '', text: '', accent: '', hud: '' },
    player: { speed: 3, size: 24, maxHealth: 100, attackDamage: 10, attackRange: 40, attackCooldown: 500 },
    combat: { invulnDuration: 1.0, knockback: 5, damageNumberDuration: 0.8 },
    map: { roomWidth: 800, roomHeight: 600, tileSize: 40, wallThickness: 40 },
    inventory: { maxSize: 6, slotSize: 40 },
    visual: { style: 'geometric' },
    game: { title: '' },
    rpg: {
      rooms: {
        start: { name: 'Entrance Hall', exits: { right: 'hallway' }, enemies: [], items: [], npcs: ['elder'], wallColor: '', floorColor: '' }
      },
      enemies: {
        slime: { name: 'Slime', health: 30, damage: 5, speed: 1, size: 20, color: '', behavior: 'wander' }
      },
      items: {
        potion: { name: 'Health Potion', type: 'consumable', effect: 'heal', value: 30, color: '' },
        sword: { name: 'Iron Sword', type: 'weapon', effect: 'damage', value: 5, color: '' },
        key: { name: 'Dungeon Key', type: 'quest', effect: 'none', value: 0, color: '' }
      },
      npcs: {
        elder: { name: 'Village Elder', dialogue: ['Welcome, adventurer.', 'Find the key hidden in the dungeon.'], color: '' }
      },
      quest: { objective: 'Find the dungeon key', requiredItem: 'key', completionRoom: 'start' },
      startRoom: 'start'
    }
  },
  'tower-defense': {
    colors: { background: '', grid: '', path: '', text: '', accent: '', tower: '', enemy: '', projectile: '' },
    economy: { startGold: 150, killReward: 10, waveBonus: 50 },
    grid: { cols: 12, rows: 8, cellSize: 50 },
    towers: [
      { name: 'Basic', damage: 10, range: 3, fireRate: 1.0, cost: 50, upgradeCost: 40, color: '', projectileColor: '', type: 'single' },
      { name: 'Splash', damage: 8, range: 2.5, fireRate: 0.7, cost: 75, upgradeCost: 60, color: '', projectileColor: '', type: 'splash', splashRadius: 1.5 },
      { name: 'Slow', damage: 5, range: 3, fireRate: 0.8, cost: 60, upgradeCost: 45, color: '', projectileColor: '', type: 'slow', slowFactor: 0.5, slowDuration: 2 },
      { name: 'Sniper', damage: 30, range: 5, fireRate: 0.3, cost: 100, upgradeCost: 80, color: '', projectileColor: '', type: 'single' }
    ],
    path: [
      { x: 0, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 6 }, { x: 9, y: 6 }, { x: 9, y: 3 }, { x: 11, y: 3 }
    ],
    waves: [
      { enemies: [{ type: 'normal', count: 8, interval: 1.0 }] },
      { enemies: [{ type: 'normal', count: 10, interval: 0.9 }, { type: 'fast', count: 3, interval: 0.7 }] },
      { enemies: [{ type: 'normal', count: 8, interval: 0.8 }, { type: 'armored', count: 3, interval: 1.2 }] }
    ],
    enemyTypes: {
      normal: { health: 50, speed: 1.0, size: 10, color: '', reward: 10 },
      fast: { health: 30, speed: 2.0, size: 8, color: '', reward: 15 },
      armored: { health: 120, speed: 0.6, size: 14, color: '', reward: 25 }
    },
    visual: { style: 'geometric' },
    game: { title: '' }
  },
  racing: {
    colors: { background: '', track: '', trackEdge: '', player: '', opponent: '', text: '', accent: '' },
    vehicle: { topSpeed: 6, acceleration: 0.07, braking: 0.1, turnSpeed: 0.035, size: 16 },
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
    opponents: { count: 2, speedVariation: 0.1, rubberBanding: true },
    race: { lapCount: 3 },
    visual: { style: 'geometric' },
    game: { title: '' }
  },
  story: {
    colors: { background: '', text: '', accent: '', choiceDefault: '', choiceHover: '', characterName: '' },
    text: { speed: 40, font: 'serif', fontSize: 18, lineHeight: 28, maxWidth: 700 },
    choices: { timeout: 0, showTimer: false, keyboardShortcuts: true },
    transitions: { duration: 800, type: 'fade' },
    autoAdvance: { enabled: false, delay: 0, showIndicator: true },
    saves: { maxSlots: 3, autosave: true },
    game: { title: '' },
    story: {
      scenes: {
        intro: {
          background: 'A dimly lit room',
          character: 'Narrator',
          dialogue: ['Welcome to the story...', 'Your choices will shape what happens next.'],
          choices: [
            { text: 'Begin the journey', next: 'scene2' },
            { text: 'Ask where you are', next: 'scene3' }
          ]
        }
      },
      startScene: 'intro'
    }
  }
};

export async function generateConfigWithAI(snapshot: GameDesignSnapshot): Promise<string | null> {
  const config = resolveProviderConfig();
  if (!config) {
    return null;
  }

  let spinner: ReturnType<typeof setInterval> | undefined;

  try {
    const provider = createProvider(config);

    // Animated progress indicator
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIdx = 0;
    spinner = setInterval(() => {
      process.stdout.write(`\r   ${chalk.blue(frames[frameIdx])} ${chalk.blue(`Generating your game config with ${provider.name}...`)}`);
      frameIdx = (frameIdx + 1) % frames.length;
    }, 80);

    const schema = SCHEMAS[snapshot.genre as keyof typeof SCHEMAS];

    const arenaInstructions = snapshot.genre === 'arena' ? `
ARENA-SPECIFIC INSTRUCTIONS:
6. Use "bullets" (not player.fireRate): bullets.speed, bullets.size, bullets.cooldown (ms between shots).
7. Use "enemies.baseSpeed" (not enemies.speed), "enemies.spawnRate" (probability per frame, e.g. 0.02), "enemies.waveDifficultyCurve".
8. enemies.types must be an array of { name, hp, speedMult, sizeMult, score, colorShift }.
9. Include powerups and arena { width, height }.
` : '';

    const rpgInstructions = snapshot.genre === 'rpg' ? `
RPG-SPECIFIC INSTRUCTIONS:
6. Generate 4-6 interconnected rooms in rpg.rooms. Each room has: name, exits (object mapping direction to room ID), enemies (array of enemy type IDs), items (array of item IDs), npcs (array of NPC IDs), wallColor (hex), floorColor (hex).
7. Generate 2-3 enemy types in rpg.enemies. Each has: name, health, damage, speed, size, color (hex), behavior ("chase" or "wander").
8. Generate 3-5 items in rpg.items. Types: "consumable" (heal), "weapon" (damage boost), "quest" (key items). Each has: name, type, effect, value, color (hex).
9. Generate 1-2 NPCs in rpg.npcs. Each has: name, dialogue (array of 2-4 strings), color (hex).
10. Define rpg.quest with: objective (string), requiredItem (item ID), completionRoom (room ID where quest ends).
11. rpg.startRoom must match a room ID. Rooms must form a connected graph via exits.
12. Ensure at least one room has no enemies (safe zone with NPC), and one room has the quest item.
` : '';

    const racingInstructions = snapshot.genre === 'racing' ? `
RACING-SPECIFIC INSTRUCTIONS:
6. Generate track.segments as an array of segment objects forming a closed loop. Each segment is { type: "straight", length: N } or { type: "curve", angle: N, radius: N }. Curve angles should sum to 360 for a closed loop.
7. Set track.width between 60-120 depending on difficulty (wider = easier).
8. Set opponents.count (1-3) and opponents.speedVariation (0.05-0.2) based on difficulty.
9. Adjust vehicle physics: higher topSpeed and lower turnSpeed = harder. Lower acceleration = more strategic.
10. All color values must be valid hex codes matching the requested vibe.
` : '';

    const tdInstructions = snapshot.genre === 'tower-defense' ? `
TOWER-DEFENSE-SPECIFIC INSTRUCTIONS:
6. Generate an S-curve or winding "path" array of grid waypoints (x,y) from left edge to right edge. The path must stay within grid bounds (cols x rows).
7. Generate 3-4 tower objects in the "towers" array. Each tower has: name, damage, range (in grid cells), fireRate (shots/sec), cost, upgradeCost, color (hex), projectileColor (hex), type ("single" or "splash" or "slow"). Splash towers need splashRadius. Slow towers need slowFactor and slowDuration.
8. Generate 8-10 wave objects in the "waves" array. Each wave has an "enemies" array of {type, count, interval}. Scale difficulty up per wave.
9. Generate 3 enemyTypes (normal, fast, armored) each with: health, speed, size, color (hex), reward (gold).
10. Fill in ALL color hex values for colors, tower colors, projectile colors, and enemy colors.
11. Economy values should match difficulty: casual=more gold, challenging=less gold.
` : '';

    const storyInstructions = snapshot.genre === 'story' ? `
STORY-SPECIFIC INSTRUCTIONS:
6. Generate 10-15 unique scenes in the story.scenes object.
7. Each scene has: background (string), character (string or null), dialogue (array of strings), and optionally choices or next.
8. Choice scenes have a "choices" array with 2-4 options. Each choice has: text (string), next (scene ID string), optional condition (string — a flag name to check), optional effect ({ setFlags: string[] }).
9. Non-choice scenes have a "next" property pointing to the next scene ID.
10. Ending scenes have "isEnding: true" and no next/choices.
11. Include at least 2 distinct endings (good, bad, or nuanced).
12. Use character names in dialogue scenes. Include meaningful dialogue arrays (2-5 lines per scene).
13. Use flag-based conditions to enable branching (e.g., a choice is only available if a flag was set earlier).
14. The startScene must be "intro" and the intro scene must exist.
` : '';

    const prompt = `
You are a creative game designer. Generate a JSON configuration object for a browser-based "${snapshot.genre}" game.

USER REQUIREMENTS:
- Title: "${snapshot.title}"
- Vibe: "${snapshot.vibe}" (Choose colors that match this vibe perfectly)
- Difficulty: "${snapshot.difficulty}" (Adjust physics/gameplay values accordingly)
- Visual Style: "${snapshot.visualStyle}"
- Scope: "${snapshot.scope}"
- Custom Notes: "${snapshot.customNotes}"

REQUIRED SCHEMA (JSON):
${JSON.stringify(schema, null, 2)}

INSTRUCTIONS:
1. Return ONLY valid JSON. No markdown formatting, no code blocks.
2. Fill in all specific values (especially colors).
3. Adjust physics/gameplay numbers to match the requested difficulty and notes.
4. Ensure "colors" contains valid hex codes.
5. Do not add new top-level keys. You can adjust values within the existing structure.
${arenaInstructions}${rpgInstructions}${tdInstructions}${racingInstructions}${storyInstructions}`;

    const text = await provider.generateText(prompt);
    clearInterval(spinner);
    process.stdout.write('\r' + ' '.repeat(60) + '\r'); // Clear spinner line

    // Clean up markdown code blocks if present (e.g. ```json ... ```)
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Parse and validate against genre-specific schema
    const parsed = JSON.parse(jsonString);
    const validation = validateConfig(snapshot.genre, parsed);
    if (!validation.valid) {
      console.warn(chalk.yellow('   ⚠️ AI config failed schema validation, falling back to static config.'));
      return null;
    }

    // Convert to JS module format
    return `// Game configuration — generated by ${provider.name}
// Vibe: ${snapshot.vibe} | Difficulty: ${snapshot.difficulty}
// "${snapshot.customNotes}"

const config = ${jsonString};

export default config;
`;

  } catch (error: unknown) {
    if (spinner) clearInterval(spinner);
    process.stdout.write('\r' + ' '.repeat(60) + '\r');
    console.error(chalk.yellow('   ⚠️ AI generation failed, falling back to static config.'));
    if (error instanceof Error) console.error(chalk.dim(error.message));
    return null;
  }
}

export function getChatSession(systemInstruction: string): ChatSession | null {
  const config = resolveProviderConfig();
  if (!config) return null;

  const provider = createProvider(config);
  return provider.startChat(systemInstruction);
}
