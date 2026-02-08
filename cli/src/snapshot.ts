export type Genre = 'runner' | 'arena' | 'puzzle';
export type Vibe = 'retro' | 'cozy' | 'dark' | 'neon' | 'minimal';
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

export type Mechanics = RunnerMechanics | ArenaMechanics | PuzzleMechanics;

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
      enemySpeed: 1.5,
      spawnRate: 0.01,
      arenaWidth: 800,
      arenaHeight: 600,
      waveDifficultyCurve: 1.1,
    },
    moderate: {
      playerSpeed: 5,
      bulletSpeed: 10,
      enemySpeed: 2.5,
      spawnRate: 0.02,
      arenaWidth: 800,
      arenaHeight: 600,
      waveDifficultyCurve: 1.2,
    },
    challenging: {
      playerSpeed: 5,
      bulletSpeed: 12,
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

export function getDefaultMechanics(genre: Genre, difficulty: Difficulty): Mechanics {
  switch (genre) {
    case 'runner':
      return getDefaultRunnerMechanics(difficulty);
    case 'arena':
      return getDefaultArenaMechanics(difficulty);
    case 'puzzle':
      return getDefaultPuzzleMechanics(difficulty);
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
