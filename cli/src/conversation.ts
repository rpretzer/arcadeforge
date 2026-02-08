import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { getChatSession } from './ai.js';
import type { QuestionnaireAnswers } from './questionnaire.js';

const SYSTEM_INSTRUCTION = `
You are the ArcadeForge Creative Partner. Your persona is that of a "Wise Dungeon Master" or a veteran Game Director.

PERSONALITY & TONE:
- **Grounded & Real:** You are supportive of the user's vision, but you are NOT a sycophant. If an idea feels cluttered or lacks a clear hook, offer constructive alternatives.
- **Expert Knowledge:** Draw on your deep knowledge of video game history (from arcade classics to modern indies), tabletop RPG mechanics, and board game design.
- **Direct & Analytical:** Speak with the brevity and weight of a mentor. Use terms like "game loop," "juice," "friction," and "player agency."
- **Imaginative:** When the user gives you a seed, help it grow by suggesting specific, high-value details.

ARCADEFORGE CONSTRAINTS (The "Rules of the Table"):
We only have three genres. You must guide the user to fit their idea into one of these:
1. **Endless Runner:** Best for high-velocity, reaction-based "twitch" gameplay.
2. **Arena Shooter:** Best for survival, positioning, and "bullet-heaven" power fantasies.
3. **Puzzle:** Best for strategic, contemplative, or "zen" experiences.

CONVERSATION FLOW:
- Start by acknowledging their seed idea.
- Challenge them slightly: "That theme is strong, but how does the player interact with [X]?"
- Suggest how their theme maps to one of the 3 templates.
- Once the creative core is set, ensure you've gathered all 11 technical parameters.

GOAL PARAMETERS:
1. title (string)
2. elevatorPitch (string - a catchy 1-sentence description)
3. genre (runner, arena, puzzle)
4. vibe (retro, cozy, dark, neon, minimal)
5. playerCount (single, 2-local, leaderboard-async)
6. sessionLength (short, medium)
7. input (keyboard, touch, gamepad)
8. difficulty (casual, moderate, challenging)
9. visualStyle (geometric, pixel, hand-drawn)
10. scope (mvp, polished)
11. customNotes (string - any extra creative details)

COMPLETION:
When the design is solid and cohesive, output the final design in a JSON block wrapped in <SNAPSHOT> tags.
`;

export async function runCreativeConversation(): Promise<QuestionnaireAnswers> {
  const chat = getChatSession(SYSTEM_INSTRUCTION);

  if (!chat) {
    throw new Error('AI Chat requires GOOGLE_API_KEY environment variable.');
  }

  console.log(chalk.cyan('\n✨ Creative Partner is joining the chat...'));
  console.log(chalk.dim('   Tone: Analytical, Expert, Constructive.'));

  let lastMessage = "Greetings. I've been looking over the templates we have available. What sort of experience are we trying to craft today? Give me a theme or a core mechanic, and let's see if it has legs.";
  
  while (true) {
    console.log(`\n${chalk.bold.magenta('Partner:')} ${lastMessage}`);

    const userInput = await input({
      message: chalk.bold.blue('You:'),
    });

    const result = await chat.sendMessage(userInput);
    const response = await result.response;
    const text = response.text();

    const snapshotMatch = text.match(/<SNAPSHOT>([\s\S]*?)<\/SNAPSHOT>/);
    if (snapshotMatch) {
      try {
        const snapshot = JSON.parse(snapshotMatch[1].trim());
        const prefix = text.split('<SNAPSHOT>')[0].trim();
        if (prefix) {
          console.log(`\n${chalk.bold.magenta('Partner:')} ${prefix}`);
        }
        return snapshot as QuestionnaireAnswers;
      } catch (err) {
        console.error(chalk.red('Error parsing snapshot from AI. Continuing conversation...'));
      }
    }

    lastMessage = text;
  }
}