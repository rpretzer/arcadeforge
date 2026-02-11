#!/usr/bin/env node

import 'dotenv/config';
import { createRequire } from 'node:module';
import chalk from 'chalk';
import { select, confirm } from '@inquirer/prompts';
import { runQuestionnaire, confirmSnapshot, type QuestionnaireAnswers } from './questionnaire.js';
import { buildSnapshot, type Genre, type Vibe } from './snapshot.js';
import { generateGame } from './generator.js';
import { runPlaytest } from './playtest.js';
import { runDeploy } from './deploy.js';
import { serveGame } from './serve.js';
import { runCreativeConversation } from './conversation.js';
import { runRemix } from './remix.js';
import { resolveProviderConfig } from './providers/index.js';
import { getOrPromptConfig } from './settings.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const g = chalk.greenBright;
const c = chalk.cyanBright;
const m = chalk.magentaBright;

const BANNER = `
${g('    ╔══════════════════════════════════════════╗')}
${g('    ║')}${c('  ░█▀█░█▀▄░█▀▀░█▀█░█▀▄░█▀▀')}              ${g('║')}
${g('    ║')}${c('  ░█▀█░█▀▄░█░░░█▀█░█░█░█▀▀')}              ${g('║')}
${g('    ║')}${c('  ░▀░▀░▀░▀░▀▀▀░▀░▀░▀▀░░▀▀▀')}              ${g('║')}
${g('    ║')}${m('  ░█▀▀░█▀█░█▀▄░█▀▀░█▀▀')}                 ${g('║')}
${g('    ║')}${m('  ░█▀▀░█░█░█▀▄░█░█░█▀▀')}                 ${g('║')}
${g('    ║')}${m('  ░▀░░░▀▀▀░▀░▀░▀▀▀░▀▀▀')}                 ${g('║')}
${g('    ║')}                                          ${g('║')}
${g('    ║')}  ${chalk.bold.yellowBright('AI-Powered Game Creation')}  ${chalk.dim(`v${version}`)}     ${g('║')}
${g('    ╚══════════════════════════════════════════╝')}
`;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function generateQuickDefaults(): QuestionnaireAnswers {
  const genres: Genre[] = ['runner', 'arena', 'puzzle', 'rpg', 'tower-defense', 'racing'];
  const vibes: Vibe[] = ['retro', 'cozy', 'dark', 'neon', 'minimal'];
  const genre = pickRandom(genres);
  const vibe = pickRandom(vibes);

  const titles: Record<string, string[]> = {
    runner: ['Pixel Dash', 'Neon Sprint', 'Sky Hopper'],
    arena: ['Blast Zone', 'Star Arena', 'Neon Siege'],
    puzzle: ['Color Crush', 'Match Frenzy', 'Gem Grid'],
    rpg: ['Realm Quest', 'Dungeon Strider', 'Crystal Saga'],
    'tower-defense': ['Castle Guard', 'Siege Breaker', 'Turret Tide'],
    racing: ['Nitro Circuit', 'Drift Kings', 'Speed Demon'],
  };

  return {
    genre,
    vibe,
    title: pickRandom(titles[genre] ?? ['Arcade Game']),
    playerCount: 'single',
    sessionLength: 'short',
    input: 'keyboard',
    difficulty: 'moderate',
    visualStyle: pickRandom(['geometric', 'pixel', 'hand-drawn'] as const),
    scope: 'mvp',
    customNotes: '',
  };
}

async function commandCreate(flags: { noAssets?: boolean; quick?: boolean }): Promise<void> {
  console.log(BANNER);

  let answers: QuestionnaireAnswers;

  if (flags.quick) {
    // Quick start: skip all prompts, generate with random defaults
    answers = generateQuickDefaults();
    console.log(chalk.cyan(`   Quick start: generating a ${answers.vibe} ${answers.genre} game called "${answers.title}"\n`));
  } else {
    // Check for AI provider availability
    const providerConfig = resolveProviderConfig();

    let mode: 'wizard' | 'chat' | 'quick' | 'config';

    if (!providerConfig) {
      // Graceful no-API-key flow
      console.log(chalk.yellow('  No AI provider set up yet.') + chalk.dim(' You can:\n'));
      mode = await select<'config' | 'wizard' | 'quick'>({
        message: 'How would you like to proceed?',
        choices: [
          { name: 'Set up AI provider now', value: 'config' },
          { name: 'Continue with manual wizard', value: 'wizard' },
          { name: 'Quick start with defaults', value: 'quick' },
        ],
      });

      if (mode === 'config') {
        await getOrPromptConfig(true);
        console.log('');
        // After config, offer the full choice again
        mode = await select({
          message: 'How would you like to design your game?',
          choices: [
            { name: 'Standard Wizard (Quick questions)', value: 'wizard' as const },
            { name: 'Creative Partner (Conversational AI chat)', value: 'chat' as const },
          ],
        });
      } else if (mode === 'quick') {
        answers = generateQuickDefaults();
        console.log(chalk.cyan(`\n   Quick start: generating a ${answers.vibe} ${answers.genre} game called "${answers.title}"\n`));
        const snapshot = buildSnapshot(answers);
        const targetDir = await generateGame(snapshot, undefined, flags.noAssets);
        await promptAutoServe(targetDir);
        return;
      }
    } else {
      mode = await select({
        message: 'How would you like to design your game?',
        choices: [
          { name: 'Standard Wizard (Quick questions)', value: 'wizard' as const },
          { name: 'Creative Partner (Conversational AI chat)', value: 'chat' as const },
        ],
      });
    }

    if (mode === 'chat') {
      const config = resolveProviderConfig();
      if (!config) {
        console.log(chalk.yellow('\nNo AI provider configured. Using Standard Wizard instead.'));
        console.log(chalk.dim('   Run "arcadeforge config" to set up a provider.\n'));
        answers = await runQuestionnaire();
      } else {
        answers = await runCreativeConversation();
      }
    } else {
      answers = await runQuestionnaire();
    }
  }

  const snapshot = buildSnapshot(answers);

  console.log(chalk.bold('\n✅ Game Design Snapshot:'));
  console.log(chalk.white(`   Title: ${snapshot.title}`));
  console.log(chalk.cyan(`   Pitch: ${snapshot.elevatorPitch}`));
  console.log(chalk.white(`   Genre: ${snapshot.genre}`));
  console.log(chalk.white(`   Vibe: ${snapshot.vibe}`));
  console.log(chalk.white(`   Difficulty: ${snapshot.difficulty}`));
  console.log(chalk.white(`   Visual Style: ${snapshot.visualStyle}`));
  console.log(chalk.white(`   Scope: ${snapshot.scope}`));
  if (snapshot.customNotes) {
    console.log(chalk.white(`   Notes: ${snapshot.customNotes}`));
  }

  if (!flags.quick) {
    const confirmed = await confirmSnapshot(snapshot as unknown as Record<string, unknown>);
    if (!confirmed) {
      console.log(chalk.yellow('\nNo worries — run arcadeforge create again when ready!'));
      return;
    }
  }

  const targetDir = await generateGame(snapshot, undefined, flags.noAssets);

  await promptAutoServe(targetDir);
}

async function promptAutoServe(targetDir: string): Promise<void> {
  console.log(chalk.bold.green('\n🎉 Done! Your game is ready.'));

  const playNow = await confirm({
    message: 'Want to play it now?',
    default: true,
  });

  if (playNow) {
    await serveGame(targetDir);
  } else {
    console.log(chalk.white(`\n   To play later:`));
    console.log(chalk.white(`   cd ${targetDir}`));
    console.log(chalk.white(`   arcadeforge serve`));
    console.log(chalk.dim(`\n   Next steps:`));
    console.log(chalk.dim(`   • Edit src/config.js to tweak gameplay`));
    console.log(chalk.dim(`   • Use the in-game feedback panel to take notes`));
    console.log(chalk.dim(`   • Run "arcadeforge deploy" when ready to share`));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'create';
  const flags = {
    noAssets: args.includes('--no-assets') || args.includes('-n'),
    quick: args.includes('--quick') || args.includes('-q'),
  };

  switch (command) {
    case 'create':
      await commandCreate(flags);
      break;
    case 'serve': {
      // Filter out flags from potential directory path
      const targetDir = args.slice(1).find(a => !a.startsWith('-')) ?? '.';
      await serveGame(targetDir);
      break;
    }
    case 'playtest':
      await runPlaytest();
      break;
    case 'deploy':
      await runDeploy();
      break;
    case 'remix': {
      const remixDir = process.argv[3] ?? '.';
      await runRemix(remixDir);
      break;
    }
    case 'config':
      await getOrPromptConfig(true);
      break;
    case '--help':
    case '-h':
      console.log(BANNER);
      console.log(chalk.bold('Commands:'));
      console.log('  create     Create a new game (default)');
      console.log('  serve      Run local dev server with feedback tools');
      console.log('  remix      Iterate on your game using AI and feedback');
      console.log('  playtest   Run a structured playtest session');
      console.log('  deploy     Generate deployment configs');
      console.log('  config     Configure AI provider and model');
      console.log('  --help     Show this help message');
      console.log('');
      console.log(chalk.bold('Flags:'));
      console.log('  --quick, -q      Skip all prompts, generate with random defaults');
      console.log('  --no-assets, -n  Skip AI asset generation');
      break;
    default:
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log(chalk.dim('Run "arcadeforge --help" for available commands.'));
      process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error(chalk.red(`\nError: ${err.message}`));
  process.exit(1);
});
