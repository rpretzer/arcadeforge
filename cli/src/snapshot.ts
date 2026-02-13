export type Genre = 'runner' | 'arena' | 'puzzle' | 'story' | 'rpg' | 'tower-defense' | 'racing';
export type Vibe = 'retro' | 'cozy' | 'dark' | 'neon' | 'minimal' | 'nes' | 'snes';
export type PlayerCount = 'single' | '2-local' | 'leaderboard-async';
export type SessionLength = 'short' | 'medium';
export type InputMethod = 'keyboard' | 'touch' | 'gamepad';
export type Difficulty = 'casual' | 'moderate' | 'challenging';
export type VisualStyle = 'geometric' | 'pixel' | 'hand-drawn';
export type Scope = 'mvp' | 'polished';

export interface ColorPalette {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

export interface RunnerMechanics {
  gravity: number;
  jumpForce: number;
  baseSpeed: number;
  speedIncrement: number;
  obstacleFrequency: number;
}

export interface ArenaMechanics {
  playerSpeed: number;
  bulletSpeed: number;
  bulletCooldown: number;
  bulletSize: number;
  enemySpeed: number;
  spawnRate: number;
  arenaWidth: number;
  arenaHeight: number;
  waveDifficultyCurve: number;
}

export interface PuzzleMechanics {
  gridWidth: number;
  gridHeight: number;
  matchSize: number;
  timeLimit: number;
  difficultyProgression: number;
}

export interface StoryMechanics {
  textSpeed: number;
  choiceTimeout: number;
  sceneTransitionDuration: number;
  maxSaveSlots: number;
  enableAutoAdvance: boolean;
  autoAdvanceDelay: number;
}

export interface RPGMechanics {
  playerSpeed: number;
  attackDamage: number;
  attackCooldown: number;
  playerMaxHealth: number;
  enemyDensity: number;
  mapWidth: number;
  mapHeight: number;
  inventorySize: number;
}

export interface TowerDefenseMechanics {
  startingGold: number;
  startingLives: number;
  waveCount: number;
  gridCols: number;
  gridRows: number;
  towerTypes: number;
}

export interface RacingMechanics {
  topSpeed: number;
  acceleration: number;
  braking: number;
  turnSpeed: number;
  trackComplexity: number;
  lapCount: number;
  opponentCount: number;
}

export type Mechanics = RunnerMechanics | ArenaMechanics | PuzzleMechanics | StoryMechanics | RPGMechanics | TowerDefenseMechanics | RacingMechanics;

export interface GameDesignSnapshot {
  title: string;
  elevatorPitch: string;
  genre: Genre;
  vibe: Vibe;
  playerCount: PlayerCount;
  sessionLength: SessionLength;
  input: InputMethod;
  difficulty: Difficulty;
  visualStyle: VisualStyle;
  colorPalette: ColorPalette;
  mechanics: Mechanics;
  scope: Scope;
  customNotes: string;
  createdAt: string;
}

const VIBE_PALETTES: Record<Vibe, ColorPalette> = {
  retro: {
    background: '#1a1a2e',
    primary: '#e94560',
    secondary: '#16213e',
    accent: '#0f3460',
    text: '#eaeaea',
  },
  nes: {
    background: '#1a0a2e',
    primary: '#c03030',
    secondary: '#306030',
    accent: '#6090c0',
    text: '#e8e0d0',
  },
  snes: {
    background: '#1a1a3e',
    primary: '#8866aa',
    secondary: '#446688',
    accent: '#aa88cc',
    text: '#e8e0e8',
  },
  cozy: {
    background: '#fef6e4',
    primary: '#f582ae',
    secondary: '#b8c1ec',
    accent: '#8bd3dd',
    text: '#172c66',
  },
  dark: {
    background: '#0d1117',
    primary: '#58a6ff',
    secondary: '#21262d',
    accent: '#f78166',
    text: '#c9d1d9',
  },
  neon: {
    background: '#0a0a0a',
    primary: '#00ff41',
    secondary: '#ff00ff',
    accent: '#00d4ff',
    text: '#ffffff',
  },
  minimal: {
    background: '#ffffff',
    primary: '#333333',
    secondary: '#888888',
    accent: '#0066cc',
    text: '#111111',
  },
};

function getDefaultRunnerMechanics(difficulty: Difficulty): RunnerMechanics {
  const presets: Record<Difficulty, RunnerMechanics> = {
    casual: {
      gravity: 0.4,
      jumpForce: -10,
      baseSpeed: 3,
      speedIncrement: 0.001,
      obstacleFrequency: 0.015,
    },
    moderate: {
      gravity: 0.5,
      jumpForce: -11,
      baseSpeed: 4,
      speedIncrement: 0.002,
      obstacleFrequency: 0.02,
    },
    challenging: {
      gravity: 0.6,
      jumpForce: -12,
      baseSpeed: 5,
      speedIncrement: 0.003,
      obstacleFrequency: 0.03,
    },
  };
  return presets[difficulty];
}

function getDefaultArenaMechanics(difficulty: Difficulty): ArenaMechanics {
  const presets: Record<Difficulty, ArenaMechanics> = {
    casual: {
      playerSpeed: 4,
      bulletSpeed: 8,
      bulletCooldown: 200,
      bulletSize: 5,
      enemySpeed: 1.5,
      spawnRate: 0.01,
      arenaWidth: 800,
      arenaHeight: 600,
      waveDifficultyCurve: 1.1,
    },
    moderate: {
      playerSpeed: 5,
      bulletSpeed: 10,
      bulletCooldown: 150,
      bulletSize: 5,
      enemySpeed: 2.5,
      spawnRate: 0.02,
      arenaWidth: 800,
      arenaHeight: 600,
      waveDifficultyCurve: 1.2,
    },
    challenging: {
      playerSpeed: 5,
      bulletSpeed: 12,
      bulletCooldown: 120,
      bulletSize: 4,
      enemySpeed: 3.5,
      spawnRate: 0.03,
      arenaWidth: 800,
      arenaHeight: 600,
      waveDifficultyCurve: 1.4,
    },
  };
  return presets[difficulty];
}

function getDefaultPuzzleMechanics(difficulty: Difficulty): PuzzleMechanics {
  const presets: Record<Difficulty, PuzzleMechanics> = {
    casual: {
      gridWidth: 6,
      gridHeight: 6,
      matchSize: 3,
      timeLimit: 0,
      difficultyProgression: 1.05,
    },
    moderate: {
      gridWidth: 7,
      gridHeight: 7,
      matchSize: 3,
      timeLimit: 120,
      difficultyProgression: 1.1,
    },
    challenging: {
      gridWidth: 8,
      gridHeight: 8,
      matchSize: 3,
      timeLimit: 90,
      difficultyProgression: 1.2,
    },
  };
  return presets[difficulty];
}

function getDefaultStoryMechanics(difficulty: Difficulty): StoryMechanics {
  const presets: Record<Difficulty, StoryMechanics> = {
    casual: {
      textSpeed: 40,
      choiceTimeout: 0,
      sceneTransitionDuration: 800,
      maxSaveSlots: 3,
      enableAutoAdvance: true,
      autoAdvanceDelay: 5,
    },
    moderate: {
      textSpeed: 50,
      choiceTimeout: 30,
      sceneTransitionDuration: 600,
      maxSaveSlots: 3,
      enableAutoAdvance: false,
      autoAdvanceDelay: 0,
    },
    challenging: {
      textSpeed: 60,
      choiceTimeout: 15,
      sceneTransitionDuration: 400,
      maxSaveSlots: 1,
      enableAutoAdvance: false,
      autoAdvanceDelay: 0,
    },
  };
  return presets[difficulty];
}

function getDefaultRPGMechanics(difficulty: Difficulty): RPGMechanics {
  const presets: Record<Difficulty, RPGMechanics> = {
    casual: {
      playerSpeed: 3,
      attackDamage: 15,
      attackCooldown: 400,
      playerMaxHealth: 120,
      enemyDensity: 2,
      mapWidth: 800,
      mapHeight: 600,
      inventorySize: 8,
    },
    moderate: {
      playerSpeed: 3.5,
      attackDamage: 10,
      attackCooldown: 500,
      playerMaxHealth: 100,
      enemyDensity: 3,
      mapWidth: 800,
      mapHeight: 600,
      inventorySize: 6,
    },
    challenging: {
      playerSpeed: 4,
      attackDamage: 8,
      attackCooldown: 600,
      playerMaxHealth: 80,
      enemyDensity: 4,
      mapWidth: 800,
      mapHeight: 600,
      inventorySize: 5,
    },
  };
  return presets[difficulty];
}

function getDefaultTowerDefenseMechanics(difficulty: Difficulty): TowerDefenseMechanics {
  const presets: Record<Difficulty, TowerDefenseMechanics> = {
    casual: {
      startingGold: 200,
      startingLives: 20,
      waveCount: 8,
      gridCols: 12,
      gridRows: 8,
      towerTypes: 4,
    },
    moderate: {
      startingGold: 150,
      startingLives: 15,
      waveCount: 10,
      gridCols: 14,
      gridRows: 9,
      towerTypes: 4,
    },
    challenging: {
      startingGold: 100,
      startingLives: 10,
      waveCount: 12,
      gridCols: 16,
      gridRows: 10,
      towerTypes: 4,
    },
  };
  return presets[difficulty];
}

function getDefaultRacingMechanics(difficulty: Difficulty): RacingMechanics {
  const presets: Record<Difficulty, RacingMechanics> = {
    casual: {
      topSpeed: 5,
      acceleration: 0.08,
      braking: 0.12,
      turnSpeed: 0.04,
      trackComplexity: 6,
      lapCount: 2,
      opponentCount: 1,
    },
    moderate: {
      topSpeed: 6,
      acceleration: 0.07,
      braking: 0.1,
      turnSpeed: 0.035,
      trackComplexity: 8,
      lapCount: 3,
      opponentCount: 2,
    },
    challenging: {
      topSpeed: 7,
      acceleration: 0.06,
      braking: 0.09,
      turnSpeed: 0.03,
      trackComplexity: 10,
      lapCount: 3,
      opponentCount: 3,
    },
  };
  return presets[difficulty];
}

export function getDefaultMechanics(genre: Genre, difficulty: Difficulty): Mechanics {
  switch (genre) {
    case 'runner':
      return getDefaultRunnerMechanics(difficulty);
    case 'arena':
      return getDefaultArenaMechanics(difficulty);
    case 'puzzle':
      return getDefaultPuzzleMechanics(difficulty);
    case 'story':
      return getDefaultStoryMechanics(difficulty);
    case 'rpg':
      return getDefaultRPGMechanics(difficulty);
    case 'tower-defense':
      return getDefaultTowerDefenseMechanics(difficulty);
    case 'racing':
      return getDefaultRacingMechanics(difficulty);
  }
}

export function getPalette(vibe: Vibe): ColorPalette {
  return VIBE_PALETTES[vibe];
}

export function buildSnapshot(params: {
  title: string;
  genre: Genre;
  vibe: Vibe;
  elevatorPitch?: string;
  playerCount: PlayerCount;
  sessionLength: SessionLength;
  input: InputMethod;
  difficulty: Difficulty;
  visualStyle: VisualStyle;
  scope: Scope;
  customNotes?: string;
}): GameDesignSnapshot {
  const palette = getPalette(params.vibe);
  const mechanics = getDefaultMechanics(params.genre, params.difficulty);

  const genreDescriptions: Record<Genre, string> = {
    runner: 'An endless runner where you dodge obstacles and chase high scores',
    arena: 'A top-down arena shooter with waves of enemies',
    puzzle: 'A grid-based match puzzle with increasing challenge',
    story: 'A branching narrative adventure driven by player choices',
    rpg: 'A top-down RPG adventure with combat, NPCs, and quests',
    'tower-defense': 'A strategic tower defense game with waves of enemies',
    racing: 'A top-down racing game with opponents and lap tracking',
  };

  return {
    title: params.title,
    elevatorPitch: params.elevatorPitch ?? genreDescriptions[params.genre],
    genre: params.genre,
    vibe: params.vibe,
    playerCount: params.playerCount,
    sessionLength: params.sessionLength,
    input: params.input,
    difficulty: params.difficulty,
    visualStyle: params.visualStyle,
    colorPalette: palette,
    mechanics,
    scope: params.scope,
    customNotes: params.customNotes ?? '',
    createdAt: new Date().toISOString(),
  };
}
