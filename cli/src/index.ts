#!/usr/bin/env node

import 'dotenv/config';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { runQuestionnaire, confirmSnapshot, type QuestionnaireAnswers } from './questionnaire.js';
import { buildSnapshot } from './snapshot.js';
import { generateGame } from './generator.js';
import { runPlaytest } from './playtest.js';
import { runDeploy } from './deploy.js';
import { serveGame } from './serve.js';
import { runCreativeConversation } from './conversation.js';
import { runRemix } from './remix.js';

const BANNER = `
${chalk.bold.cyan('🎮 ArcadeForge')}
${chalk.dim("Let's build your game in a few minutes.")}
`;

async function commandCreate(flags: { noAssets?: boolean }): Promise<void> {
  console.log(BANNER);

  const mode = await select({
    message: 'How would you like to design your game?',
    choices: [
      { name: 'Standard Wizard (Quick questions)', value: 'wizard' as const },
      { name: 'Creative Partner (Conversational AI chat)', value: 'chat' as const },
    ],
  });

  let answers: QuestionnaireAnswers;

  if (mode === 'chat') {
    if (!process.env.GOOGLE_API_KEY) {
      console.log(chalk.yellow('\n⚠️ GOOGLE_API_KEY not found. Falling back to Standard Wizard.'));
      answers = await runQuestionnaire();
    } else {
      answers = await runCreativeConversation();
    }
  } else {
    answers = await runQuestionnaire();
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

  const confirmed = await confirmSnapshot(snapshot as unknown as Record<string, unknown>);
  if (!confirmed) {
    console.log(chalk.yellow('\nNo worries — run arcadeforge create again when ready!'));
    return;
  }

  const targetDir = await generateGame(snapshot, undefined, flags.noAssets);

  console.log(chalk.bold.green('\n🎉 Done! Run your game:'));
  console.log(chalk.white(`   cd ${targetDir}`));
  console.log(chalk.white(`   arcadeforge serve`));
  console.log(chalk.dim(`\n   Next steps:`));
  console.log(chalk.dim(`   • Edit src/config.js to tweak gameplay`));
  console.log(chalk.dim(`   • Use the in-game feedback panel to take notes`));
  console.log(chalk.dim(`   • Run "arcadeforge deploy" when ready to share`));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'create';
  const flags = {
    noAssets: args.includes('--no-assets') || args.includes('-n'),
  };

  switch (command) {
    case 'create':
      await commandCreate(flags);
      break;
    case 'serve':
      // Filter out flags from potential directory path
      const targetDir = args.slice(1).find(a => !a.startsWith('-')) ?? '.';
      await serveGame(targetDir);
      break;
    case 'playtest':
      await runPlaytest();
      break;
    case 'deploy':
      await runDeploy();
      break;
    case 'remix':
      const remixDir = process.argv[3] ?? '.';
      await runRemix(remixDir);
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
      console.log('  --help     Show this help message');
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