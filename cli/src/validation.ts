import { z } from 'zod';
import chalk from 'chalk';

// --- Enum schemas matching snapshot.ts types ---

const genreSchema = z.enum(['runner', 'arena', 'puzzle', 'story', 'rpg', 'tower-defense', 'racing']);
const vibeSchema = z.enum(['retro', 'cozy', 'dark', 'neon', 'minimal']);
const playerCountSchema = z.enum(['single', '2-local', 'leaderboard-async']);
const sessionLengthSchema = z.enum(['short', 'medium']);
const inputMethodSchema = z.enum(['keyboard', 'touch', 'gamepad']);
const difficultySchema = z.enum(['casual', 'moderate', 'challenging']);
const visualStyleSchema = z.enum(['geometric', 'pixel', 'hand-drawn']);
const scopeSchema = z.enum(['mvp', 'polished']);

const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Must be a valid hex color');

// --- Per-genre config schemas (matching what templates actually consume) ---

export const runnerConfigSchema = z.object({
  colors: z.object({
    background: hexColor,
    player: hexColor,
    obstacle: hexColor,
    text: hexColor,
    accent: hexColor,
    ground: hexColor,
  }),
  physics: z.object({
    gravity: z.number().positive(),
    jumpForce: z.number().negative(),
    baseSpeed: z.number().positive(),
    speedIncrement: z.number().nonnegative(),
  }),
  obstacles: z.object({
    frequency: z.number().positive().max(1),
    minHeight: z.number().positive(),
    maxHeight: z.number().positive(),
    width: z.number().positive(),
    gap: z.number().positive(),
  }),
  player: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    groundOffset: z.number().nonnegative(),
  }),
  visual: z.object({
    style: z.string(),
    cornerRadius: z.number().nonnegative(),
    shadowBlur: z.number().nonnegative(),
  }),
  game: z.object({
    title: z.string(),
    sessionLength: z.string(),
  }),
});

export const arenaConfigSchema = z.object({
  colors: z.object({
    background: hexColor,
    player: hexColor,
    enemy: hexColor,
    bullet: hexColor,
    text: hexColor,
    accent: hexColor,
    healthBar: hexColor.optional(),
  }),
  player: z.object({
    speed: z.number().positive(),
    size: z.number().positive().optional(),
    maxHealth: z.number().positive().optional(),
    // AI schema uses these alternate keys
    fireRate: z.number().positive().optional(),
    bulletSpeed: z.number().positive().optional(),
    health: z.number().positive().optional(),
  }),
  bullets: z.object({
    speed: z.number().positive(),
    size: z.number().positive(),
    cooldown: z.number().positive(),
  }).optional(),
  enemies: z.object({
    baseSpeed: z.number().positive().optional(),
    speed: z.number().positive().optional(),
    size: z.number().positive(),
    spawnRate: z.number().positive(),
    waveDifficultyCurve: z.number().positive().optional(),
    scoreValue: z.number().positive().optional(),
  }),
  arena: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  waves: z.object({
    difficultyMultiplier: z.number().positive(),
    timeBetweenWaves: z.number().positive(),
  }).optional(),
  visual: z.object({
    style: z.string(),
    cornerRadius: z.number().nonnegative().optional(),
    shadowBlur: z.number().nonnegative(),
  }),
  game: z.object({
    title: z.string(),
    sessionLength: z.string(),
  }),
});

export const puzzleConfigSchema = z.object({
  colors: z.object({
    background: hexColor,
    text: hexColor,
    accent: hexColor,
    gridBg: hexColor.optional(),
    pieces: z.array(hexColor).min(3),
  }),
  grid: z.object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    rows: z.number().int().positive().optional(),
    cols: z.number().int().positive().optional(),
    cellSize: z.number().positive(),
    padding: z.number().nonnegative().optional(),
    gap: z.number().nonnegative().optional(),
    matchSize: z.number().int().positive().optional(),
  }),
  game: z.object({
    title: z.string(),
    sessionLength: z.string(),
    timeLimit: z.number().nonnegative().optional(),
    difficultyProgression: z.number().positive().optional(),
  }),
  scoring: z.object({
    matchBase: z.number().positive().optional(),
    comboMultiplier: z.number().positive().optional(),
    levelUpThreshold: z.number().positive().optional(),
  }).optional(),
  match: z.object({
    minMatch: z.number().int().positive(),
    baseScore: z.number().positive(),
  }).optional(),
  visual: z.object({
    style: z.string(),
    cornerRadius: z.number().nonnegative().optional(),
    shadowBlur: z.number().nonnegative().optional(),
  }),
  animation: z.object({
    swapDuration: z.number().positive(),
    fallDuration: z.number().positive(),
    matchFlashDuration: z.number().positive(),
  }).optional(),
  targetScore: z.number().positive().optional(),
});

const storyChoiceSchema = z.object({
  text: z.string(),
  next: z.string(),
  condition: z.string().optional(),
  effect: z.object({
    setFlags: z.array(z.string()),
  }).optional(),
});

const storySceneSchema = z.object({
  background: z.string(),
  character: z.string().nullable(),
  dialogue: z.array(z.string()).min(1),
  choices: z.array(storyChoiceSchema).optional(),
  next: z.string().optional(),
  isEnding: z.boolean().optional(),
});

export const storyConfigSchema = z.object({
  colors: z.object({
    background: hexColor,
    text: hexColor,
    accent: hexColor,
    choiceDefault: hexColor,
    choiceHover: hexColor,
    characterName: hexColor,
  }),
  text: z.object({
    speed: z.number().positive(),
    font: z.string(),
    fontSize: z.number().positive(),
    lineHeight: z.number().positive(),
    maxWidth: z.number().positive(),
  }),
  choices: z.object({
    timeout: z.number().nonnegative(),
    showTimer: z.boolean(),
    keyboardShortcuts: z.boolean(),
  }),
  transitions: z.object({
    duration: z.number().positive(),
    type: z.string(),
  }),
  autoAdvance: z.object({
    enabled: z.boolean(),
    delay: z.number().nonnegative(),
    showIndicator: z.boolean(),
  }),
  saves: z.object({
    maxSlots: z.number().int().positive(),
    autosave: z.boolean(),
  }),
  game: z.object({
    title: z.string(),
  }),
  story: z.object({
    scenes: z.record(z.string(), storySceneSchema).refine(
      (scenes) => 'intro' in scenes,
      { message: 'scenes must contain an "intro" scene' }
    ),
    startScene: z.literal('intro'),
  }),
});

const rpgEnemySchema = z.object({
  name: z.string(),
  health: z.number().positive(),
  damage: z.number().positive(),
  speed: z.number().nonnegative(),
  size: z.number().positive(),
  color: hexColor,
  behavior: z.string(),
});

const rpgItemSchema = z.object({
  name: z.string(),
  type: z.enum(['consumable', 'weapon', 'quest']),
  effect: z.string(),
  value: z.number().nonnegative(),
  color: hexColor,
});

const rpgNPCSchema = z.object({
  name: z.string(),
  dialogue: z.array(z.string()).min(1),
  color: hexColor,
});

const rpgRoomSchema = z.object({
  name: z.string(),
  exits: z.record(z.string(), z.string()),
  enemies: z.array(z.string()),
  items: z.array(z.string()),
  npcs: z.array(z.string()),
  wallColor: hexColor,
  floorColor: hexColor,
});

export const rpgConfigSchema = z.object({
  colors: z.object({
    background: hexColor,
    floor: hexColor,
    wall: hexColor,
    player: hexColor,
    enemy: hexColor,
    npc: hexColor,
    item: hexColor,
    text: hexColor,
    accent: hexColor,
    hud: hexColor,
  }),
  player: z.object({
    speed: z.number().positive(),
    size: z.number().positive(),
    maxHealth: z.number().positive(),
    attackDamage: z.number().positive(),
    attackRange: z.number().positive(),
    attackCooldown: z.number().positive(),
  }),
  combat: z.object({
    invulnDuration: z.number().positive(),
    knockback: z.number().nonnegative(),
    damageNumberDuration: z.number().positive(),
  }),
  map: z.object({
    roomWidth: z.number().positive(),
    roomHeight: z.number().positive(),
    tileSize: z.number().positive(),
    wallThickness: z.number().positive(),
  }),
  inventory: z.object({
    maxSize: z.number().int().positive(),
    slotSize: z.number().positive(),
  }),
  visual: z.object({
    style: z.string(),
  }),
  game: z.object({
    title: z.string(),
  }),
  rpg: z.object({
    rooms: z.record(z.string(), rpgRoomSchema),
    enemies: z.record(z.string(), rpgEnemySchema),
    items: z.record(z.string(), rpgItemSchema),
    npcs: z.record(z.string(), rpgNPCSchema),
    quest: z.object({
      objective: z.string(),
      requiredItem: z.string(),
      completionRoom: z.string(),
    }),
    startRoom: z.string(),
  }),
});

const tdTowerSchema = z.object({
  name: z.string(),
  damage: z.number().positive(),
  range: z.number().positive(),
  fireRate: z.number().positive(),
  cost: z.number().positive(),
  upgradeCost: z.number().positive(),
  color: hexColor,
  projectileColor: hexColor,
  type: z.enum(['single', 'splash', 'slow']),
  splashRadius: z.number().positive().optional(),
  slowFactor: z.number().positive().optional(),
  slowDuration: z.number().positive().optional(),
});

const tdWaveEnemySchema = z.object({
  type: z.string(),
  count: z.number().int().positive(),
  interval: z.number().positive(),
});

const tdEnemyTypeSchema = z.object({
  health: z.number().positive(),
  speed: z.number().positive(),
  size: z.number().positive(),
  color: hexColor,
  reward: z.number().positive(),
});

const tdWaypointSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
});

export const towerDefenseConfigSchema = z.object({
  colors: z.object({
    background: hexColor,
    grid: hexColor,
    path: hexColor,
    text: hexColor,
    accent: hexColor,
    tower: hexColor,
    enemy: hexColor,
    projectile: hexColor,
  }),
  economy: z.object({
    startGold: z.number().positive(),
    killReward: z.number().positive(),
    waveBonus: z.number().nonnegative(),
  }),
  grid: z.object({
    cols: z.number().int().positive(),
    rows: z.number().int().positive(),
    cellSize: z.number().positive(),
  }),
  towers: z.array(tdTowerSchema).min(2),
  path: z.array(tdWaypointSchema).min(2),
  waves: z.array(z.object({ enemies: z.array(tdWaveEnemySchema).min(1) })).min(1),
  enemyTypes: z.record(z.string(), tdEnemyTypeSchema),
  visual: z.object({ style: z.string() }),
  game: z.object({ title: z.string() }),
});

const racingTrackSegmentSchema = z.object({
  type: z.enum(['straight', 'curve']),
  length: z.number().positive().optional(),
  angle: z.number().optional(),
  radius: z.number().positive().optional(),
});

export const racingConfigSchema = z.object({
  colors: z.object({
    background: hexColor,
    track: hexColor,
    trackEdge: hexColor,
    player: hexColor,
    opponent: hexColor,
    text: hexColor,
    accent: hexColor,
  }),
  vehicle: z.object({
    topSpeed: z.number().positive(),
    acceleration: z.number().positive(),
    braking: z.number().positive(),
    turnSpeed: z.number().positive(),
    size: z.number().positive(),
  }),
  track: z.object({
    segments: z.array(racingTrackSegmentSchema).min(4),
    width: z.number().positive(),
  }),
  opponents: z.object({
    count: z.number().int().nonnegative(),
    speedVariation: z.number().nonnegative(),
    rubberBanding: z.boolean(),
  }),
  race: z.object({
    lapCount: z.number().int().positive(),
  }),
  visual: z.object({ style: z.string() }),
  game: z.object({ title: z.string() }),
});

// --- QuestionnaireAnswers / Snapshot schemas ---

export const questionnaireAnswersSchema = z.object({
  genre: genreSchema,
  vibe: vibeSchema,
  title: z.string().min(1),
  elevatorPitch: z.string().optional(),
  playerCount: playerCountSchema,
  sessionLength: sessionLengthSchema,
  input: inputMethodSchema,
  difficulty: difficultySchema,
  visualStyle: visualStyleSchema,
  scope: scopeSchema,
  customNotes: z.string(),
});

// --- Public validation functions ---

const configSchemas: Record<string, z.ZodType> = {
  runner: runnerConfigSchema,
  arena: arenaConfigSchema,
  puzzle: puzzleConfigSchema,
  story: storyConfigSchema,
  rpg: rpgConfigSchema,
  'tower-defense': towerDefenseConfigSchema,
  racing: racingConfigSchema,
};

export function validateConfig(genre: string, parsed: unknown): { valid: boolean; data: unknown; errors?: string[] } {
  const schema = configSchemas[genre];
  if (!schema) {
    console.warn(chalk.yellow(`   ⚠️ No config schema for genre "${genre}".`));
    return { valid: false, data: parsed, errors: [`Unknown genre: ${genre}`] };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    console.warn(chalk.yellow('   ⚠️ AI-generated config has validation issues:'));
    for (const err of errors) {
      console.warn(chalk.yellow(`      - ${err}`));
    }
    return { valid: false, data: parsed, errors };
  }

  return { valid: true, data: result.data };
}

export function validateSnapshot(parsed: unknown): { valid: boolean; data: unknown; errors?: string[] } {
  const result = questionnaireAnswersSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    console.warn(chalk.yellow('   ⚠️ Snapshot has invalid values:'));
    for (const err of errors) {
      console.warn(chalk.yellow(`      - ${err}`));
    }
    return { valid: false, data: parsed, errors };
  }

  return { valid: true, data: result.data };
}
