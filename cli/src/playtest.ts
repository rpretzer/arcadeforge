import path from 'node:path';
import fse from 'fs-extra';
import chalk from 'chalk';
import { select, input } from '@inquirer/prompts';
import type { GameDesignSnapshot } from './snapshot.js';

interface PlaytestFeedback {
  fun: number;
  difficulty: 'too-easy' | 'just-right' | 'too-hard';
  controlsClarity: 'yes' | 'mostly' | 'no';
  whatFeltOff: string;
  whatToChange: string;
  timestamp: string;
}

function suggestTweaks(feedback: PlaytestFeedback, snapshot: GameDesignSnapshot): string[] {
  const suggestions: string[] = [];

  if (feedback.difficulty === 'too-hard') {
    switch (snapshot.genre) {
      case 'runner':
        suggestions.push('In config.js: reduce obstacles.frequency (e.g., 0.01) and physics.baseSpeed (e.g., 3)');
        break;
      case 'arena':
        suggestions.push('In config.js: reduce enemies.spawnRate and enemies.baseSpeed');
        break;
      case 'puzzle':
        suggestions.push('In config.js: increase game.timeLimit or reduce grid size');
        break;
    }
  }

  if (feedback.difficulty === 'too-easy') {
    switch (snapshot.genre) {
      case 'runner':
        suggestions.push('In config.js: increase obstacles.frequency (e.g., 0.03) and physics.speedIncrement');
        break;
      case 'arena':
        suggestions.push('In config.js: increase enemies.spawnRate and enemies.waveDifficultyCurve');
        break;
      case 'puzzle':
        suggestions.push('In config.js: decrease game.timeLimit or increase grid size');
        break;
    }
  }

  if (feedback.fun <= 2) {
    suggestions.push('Consider changing the vibe/colors in config.js for a fresh feel');
    suggestions.push('Try adjusting the session pacing — faster speed ramp can add excitement');
  }

  if (feedback.controlsClarity === 'no') {
    suggestions.push('Make sure on-screen control instructions are visible and clear');
  }

  return suggestions;
}

function formatFeedbackMarkdown(feedback: PlaytestFeedback, suggestions: string[]): string {
  let md = `\n## Playtest — ${feedback.timestamp}\n\n`;
  md += `| Question | Answer |\n|----------|--------|\n`;
  md += `| Fun (1-5) | ${feedback.fun} |\n`;
  md += `| Difficulty | ${feedback.difficulty} |\n`;
  md += `| Controls clear? | ${feedback.controlsClarity} |\n`;
  md += `| What felt off | ${feedback.whatFeltOff || '(nothing noted)'} |\n`;
  md += `| What to change | ${feedback.whatToChange || '(nothing noted)'} |\n`;

  if (suggestions.length > 0) {
    md += `\n### Suggested Tweaks\n`;
    for (const s of suggestions) {
      md += `- ${s}\n`;
    }
  }

  return md;
}

export async function runPlaytest(): Promise<void> {
  const snapshotPath = path.resolve(process.cwd(), 'game-snapshot.json');

  if (!await fse.pathExists(snapshotPath)) {
    console.log(chalk.red('No game-snapshot.json found in current directory.'));
    console.log(chalk.dim('Run this command inside a game directory created by "arcadeforge create".'));
    process.exit(1);
  }

  const snapshot: GameDesignSnapshot = await fse.readJSON(snapshotPath);

  console.log(chalk.bold.cyan(`\n🧪 Playtest Session — ${snapshot.title}`));
  console.log(chalk.dim('Answer a few questions about your play experience.\n'));

  const fun = await select<number>({
    message: 'Was it fun? (1 = not at all, 5 = great time)',
    choices: [
      { value: 1, name: '1 — Not fun' },
      { value: 2, name: '2 — Meh' },
      { value: 3, name: '3 — Okay' },
      { value: 4, name: '4 — Fun' },
      { value: 5, name: '5 — Great time!' },
    ],
  });

  const difficulty = await select<'too-easy' | 'just-right' | 'too-hard'>({
    message: 'Was the difficulty right?',
    choices: [
      { value: 'too-easy' as const, name: 'Too easy' },
      { value: 'just-right' as const, name: 'Just right' },
      { value: 'too-hard' as const, name: 'Too hard' },
    ],
  });

  const controlsClarity = await select<'yes' | 'mostly' | 'no'>({
    message: 'Were the controls clear?',
    choices: [
      { value: 'yes' as const, name: 'Yes, intuitive' },
      { value: 'mostly' as const, name: 'Mostly, minor confusion' },
      { value: 'no' as const, name: 'No, confusing' },
    ],
  });

  const whatFeltOff = await input({
    message: 'What felt off? (optional)',
    default: '',
  });

  const whatToChange = await input({
    message: 'What should change next? (optional)',
    default: '',
  });

  const feedback: PlaytestFeedback = {
    fun,
    difficulty,
    controlsClarity,
    whatFeltOff,
    whatToChange,
    timestamp: new Date().toISOString(),
  };

  const suggestions = suggestTweaks(feedback, snapshot);
  const markdownEntry = formatFeedbackMarkdown(feedback, suggestions);

  // Append to PLAYTEST_NOTES.md
  const notesPath = path.resolve(process.cwd(), 'PLAYTEST_NOTES.md');
  let existing = '';
  if (await fse.pathExists(notesPath)) {
    existing = await fse.readFile(notesPath, 'utf-8');
  } else {
    existing = `# Playtest Notes — ${snapshot.title}\n`;
  }

  await fse.writeFile(notesPath, existing + markdownEntry, 'utf-8');

  console.log(chalk.green('\n✅ Playtest feedback saved to PLAYTEST_NOTES.md'));

  if (suggestions.length > 0) {
    console.log(chalk.bold('\n💡 Suggested tweaks:'));
    for (const s of suggestions) {
      console.log(chalk.yellow(`   • ${s}`));
    }
  }
}
