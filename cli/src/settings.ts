import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirpSync } from 'fs-extra';
import { select, input } from '@inquirer/prompts';
import chalk from 'chalk';
import type { ProviderConfig } from './providers/types.js';
import { DEFAULT_MODELS } from './providers/index.js';

const CONFIG_DIR = join(homedir(), '.arcadeforge');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export function loadConfig(): ProviderConfig | null {
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as ProviderConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: ProviderConfig): void {
  mkdirpSync(CONFIG_DIR);
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export async function getOrPromptConfig(forceReprompt = false): Promise<ProviderConfig> {
  if (!forceReprompt) {
    const existing = loadConfig();
    if (existing) return existing;
  }

  console.log(chalk.cyan('\n  Configure your AI provider for ArcadeForge\n'));

  const provider = await select<ProviderConfig['provider']>({
    message: 'Select an AI provider',
    choices: [
      { name: 'Google (Gemini)', value: 'google' },
      { name: 'OpenAI (GPT)', value: 'openai' },
      { name: 'Anthropic (Claude)', value: 'anthropic' },
      { name: 'Ollama (Local)', value: 'ollama' },
    ],
  });

  const model = await input({
    message: 'Model name',
    default: DEFAULT_MODELS[provider],
  });

  let apiKey: string | undefined;
  let baseUrl: string | undefined;

  if (provider === 'ollama') {
    const urlInput = await input({
      message: 'Ollama URL',
      default: 'http://localhost:11434',
    });
    if (urlInput.trim() && urlInput.trim() !== 'http://localhost:11434') {
      baseUrl = urlInput.trim();
    }
  } else {
    const keyInput = await input({
      message: `API key for ${provider} (leave blank to use env var — preferred for security)`,
      default: '',
    });
    if (keyInput.trim()) {
      apiKey = keyInput.trim();
    }
  }

  const config: ProviderConfig = {
    provider,
    model,
    ...(apiKey ? { apiKey } : {}),
    ...(baseUrl ? { baseUrl } : {}),
  };

  saveConfig(config);
  console.log(chalk.green(`\n  Configuration saved to ${CONFIG_PATH}`));
  if (apiKey) {
    console.log(chalk.dim('   Note: API keys in config are stored in plain text. Prefer env vars (e.g. GOOGLE_API_KEY) for better security.'));
  }

  return config;
}
