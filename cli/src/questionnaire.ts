import { select, input, confirm } from '@inquirer/prompts';
import type {
  Genre,
  Vibe,
  PlayerCount,
  SessionLength,
  InputMethod,
  Difficulty,
  VisualStyle,
  Scope,
} from './snapshot.js';

export interface QuestionnaireAnswers {
  genre: Genre;
  vibe: Vibe;
  title: string;
  elevatorPitch?: string;
  playerCount: PlayerCount;
  sessionLength: SessionLength;
  input: InputMethod;
  difficulty: Difficulty;
  visualStyle: VisualStyle;
  scope: Scope;
  customNotes: string;
}

const GENRE_NAMES: Record<Genre, string> = {
  runner: 'Endless Runner — dodge obstacles, chase high scores',
  arena: 'Arena Shooter — survive waves of enemies',
  puzzle: 'Puzzle — match pieces on a grid',
  story: 'Story — narrative adventure with branching choices',
  rpg: 'RPG — top-down adventure with combat, NPCs, and quests',
  'tower-defense': 'Tower Defense — build towers, stop waves of enemies',
  racing: 'Racing — top-down racing with opponents and laps',
};

const VIBE_NAMES: Record<Vibe, string> = {
  retro: 'Retro — dark backgrounds, bold pixel-era colors',
  cozy: 'Cozy — warm pastels, friendly feel',
  dark: 'Dark — muted tones, moody atmosphere',
  neon: 'Neon — black background, glowing bright colors',
  minimal: 'Minimal — clean whites and grays',
};

const TITLE_SUGGESTIONS: Record<Genre, string[]> = {
  runner: ['Pixel Dash', 'Neon Sprint', 'Sky Hopper', 'Turbo Run'],
  arena: ['Blast Zone', 'Star Arena', 'Neon Siege', 'Bullet Storm'],
  puzzle: ['Color Crush', 'Match Frenzy', 'Gem Grid', 'Block Blitz'],
  story: ['Shadow Path', 'Last Letter', 'Midnight Signal', 'Echo Chamber'],
  rpg: ['Realm Quest', 'Dungeon Strider', 'Hollow Keep', 'Crystal Saga'],
  'tower-defense': ['Castle Guard', 'Siege Breaker', 'Path Warden', 'Turret Tide'],
  racing: ['Nitro Circuit', 'Drift Kings', 'Turbo Track', 'Speed Demon'],
};

export async function runQuestionnaire(): Promise<QuestionnaireAnswers> {
  const genre = await select<Genre>({
    message: 'What kind of game do you want to make?',
    choices: [
      { value: 'runner' as const, name: GENRE_NAMES.runner },
      { value: 'arena' as const, name: GENRE_NAMES.arena },
      { value: 'puzzle' as const, name: GENRE_NAMES.puzzle },
      { value: 'story' as const, name: GENRE_NAMES.story },
      { value: 'rpg' as const, name: GENRE_NAMES.rpg },
      { value: 'tower-defense' as const, name: GENRE_NAMES['tower-defense'] },
      { value: 'racing' as const, name: GENRE_NAMES.racing },
    ],
  });

  const vibe = await select<Vibe>({
    message: "What's the vibe?",
    choices: [
      { value: 'retro' as const, name: VIBE_NAMES.retro },
      { value: 'neon' as const, name: VIBE_NAMES.neon },
      { value: 'cozy' as const, name: VIBE_NAMES.cozy },
      { value: 'dark' as const, name: VIBE_NAMES.dark },
      { value: 'minimal' as const, name: VIBE_NAMES.minimal },
    ],
  });

  const suggestions = TITLE_SUGGESTIONS[genre];
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

  const title = await input({
    message: `Give your game a name (or press Enter for "${randomSuggestion}")`,
    default: randomSuggestion,
  });

  const playerCount = await select<PlayerCount>({
    message: 'Player mode?',
    choices: [
      { value: 'single' as const, name: 'Single player' },
      { value: 'leaderboard-async' as const, name: 'Single player with leaderboard' },
      ...(genre === 'arena'
        ? [{ value: '2-local' as const, name: 'Local 2-player (shared keyboard)' }]
        : []),
    ],
  });

  const sessionLength = await select<SessionLength>({
    message: 'How long should a session feel?',
    choices: [
      { value: 'short' as const, name: 'Quick burst (1-3 minutes)' },
      { value: 'medium' as const, name: 'Medium session (5-10 minutes)' },
    ],
  });

  const inputMethod = await select<InputMethod>({
    message: 'Primary input method?',
    choices: [
      { value: 'keyboard' as const, name: 'Keyboard' },
      { value: 'touch' as const, name: 'Touch-friendly (mobile)' },
      { value: 'gamepad' as const, name: 'Gamepad' },
    ],
  });

  const difficulty = await select<Difficulty>({
    message: 'Difficulty level?',
    choices: [
      { value: 'casual' as const, name: 'Casual — easy to pick up' },
      { value: 'moderate' as const, name: 'Moderate — some challenge' },
      { value: 'challenging' as const, name: 'Challenging — test your skills' },
    ],
  });

  const visualStyle = await select<VisualStyle>({
    message: 'Visual style?',
    choices: [
      { value: 'geometric' as const, name: 'Geometric shapes — clean and modern' },
      { value: 'pixel' as const, name: 'Pixel art feel — chunky and retro' },
      { value: 'hand-drawn' as const, name: 'Hand-drawn feel — wobbly and organic' },
    ],
  });

  const scope = await select<Scope>({
    message: 'How polished should it be?',
    choices: [
      { value: 'mvp' as const, name: 'Quick prototype — get it playable fast' },
      { value: 'polished' as const, name: 'More refined — extra juice and polish' },
    ],
  });

  const customNotes = await input({
    message: 'Any specific mechanics or ideas? (optional, press Enter to skip)',
    default: '',
  });

  return {
    genre,
    vibe,
    title,
    playerCount,
    sessionLength,
    input: inputMethod,
    difficulty,
    visualStyle,
    scope,
    customNotes,
  };
}

export async function confirmSnapshot(snapshot: Record<string, unknown>): Promise<boolean> {
  return confirm({
    message: 'Looks good? Generate your game?',
    default: true,
  });
}
