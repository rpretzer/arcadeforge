import fse from 'fs-extra';
import path from 'node:path';
import chalk from 'chalk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GameDesignSnapshot } from './snapshot.js';

const API_KEY = process.env.GOOGLE_API_KEY;

export async function runRemix(dir: string = '.') {
  const targetDir = path.resolve(dir);
  const snapshotPath = path.join(targetDir, 'game-snapshot.json');
  const feedbackPath = path.join(targetDir, 'feedback.json');

  if (!await fse.pathExists(snapshotPath)) {
    console.error(chalk.red('\n❌ No game found in ' + targetDir + '.'));
    console.log(chalk.dim('   Make sure game-snapshot.json exists.'));
    return;
  }

  if (!API_KEY) {
    console.error(chalk.red('\n❌ GOOGLE_API_KEY is required for remixing.'));
    return;
  }

  const snapshot: GameDesignSnapshot = await fse.readJSON(snapshotPath);
  let feedback: any[] = [];
  if (await fse.pathExists(feedbackPath)) {
    feedback = await fse.readJSON(feedbackPath);
  }

  if (feedback.length === 0) {
    console.log(chalk.yellow('\n⚠️ No feedback found in feedback.json.'));
    console.log(chalk.dim('   Run "arcadeforge serve" and use the notes panel first!'));
    return;
  }

  console.log(chalk.magenta('\n🌀 Remixing "' + snapshot.title + '" based on ' + feedback.length + ' notes...'));

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const feedbackSummary = feedback.map(f => `- ${f.note}`).join('\n');

  const prompt = `
    You are an expert game balancer. You are "remixing" an existing game based on player feedback.

    ORIGINAL DESIGN:
    ${JSON.stringify(snapshot, null, 2)}

    PLAYER FEEDBACK:
    ${feedbackSummary}

    GOAL:
    Generate a NEW config.js object that addresses the feedback. 
    If the user says "it's too hard," adjust physics/spawn rates to be easier. 
    If they say "the colors are ugly," pick a better palette matching the vibe.

    RETURN ONLY VALID JSON matching the config schema for a "${snapshot.genre}" game.
    No markdown, no talk.
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Validate
    JSON.parse(jsonString);

    const configPath = path.join(targetDir, 'src', 'config.js');
    const configContent = `// Game configuration — REMIXED by Gemini 2.0 Flash
// Based on feedback: ${feedback.length} notes

const config = ${jsonString};

export default config;
`;

    await fse.writeFile(configPath, configContent);
    
    // Archive feedback
    const archivePath = path.join(targetDir, `feedback-archived-${Date.now()}.json`);
    await fse.move(feedbackPath, archivePath);

    console.log(chalk.green('\n✅ Remix complete! Check your game at http://localhost:3000'));
    console.log(chalk.dim('   Original feedback archived to ' + path.basename(archivePath)));

  } catch (err) {
    console.error(chalk.red('\n❌ Remix failed.'));
    console.error(err);
  }
}