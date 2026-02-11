import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { LLMProvider, ProviderConfig } from './types.js';
import { createGoogleProvider } from './google.js';
import { createOpenAIProvider } from './openai.js';
import { createAnthropicProvider } from './anthropic.js';
import { createOllamaProvider } from './ollama.js';

export type { LLMProvider, ChatSession, ProviderConfig } from './types.js';

const DEFAULT_MODELS: Record<ProviderConfig['provider'], string> = {
  google: 'gemini-2.0-flash',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-5-20250929',
  ollama: 'llama3',
};

export function createProvider(config: ProviderConfig): LLMProvider {
  const resolved = { ...config, model: config.model || DEFAULT_MODELS[config.provider] };

  switch (config.provider) {
    case 'google':
      return createGoogleProvider(resolved);
    case 'openai':
      return createOpenAIProvider(resolved);
    case 'anthropic':
      return createAnthropicProvider(resolved);
    case 'ollama':
      return createOllamaProvider(resolved);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export function resolveProviderConfig(): ProviderConfig | null {
  // 1. Explicit env var override
  const envProvider = process.env.ARCADEFORGE_PROVIDER as ProviderConfig['provider'] | undefined;
  const envModel = process.env.ARCADEFORGE_MODEL;

  if (envProvider) {
    return {
      provider: envProvider,
      model: envModel || DEFAULT_MODELS[envProvider],
      apiKey: getApiKeyForProvider(envProvider),
    };
  }

  // 2. Config file (~/.arcadeforge/config.json)
  try {
    const configPath = join(homedir(), '.arcadeforge', 'config.json');
    const raw = readFileSync(configPath, 'utf-8');
    const fileConfig = JSON.parse(raw) as Partial<ProviderConfig>;
    if (fileConfig.provider) {
      return {
        provider: fileConfig.provider,
        model: envModel || fileConfig.model || DEFAULT_MODELS[fileConfig.provider],
        apiKey: fileConfig.apiKey || getApiKeyForProvider(fileConfig.provider),
        baseUrl: fileConfig.baseUrl,
      };
    }
  } catch {
    // No config file — continue to auto-detect
  }

  // 3. Auto-detect from available API keys
  const available = getAvailableProviders();
  if (available.length === 0) return null;

  // Prefer google for backwards compatibility, then openai, anthropic, ollama
  const preferred: ProviderConfig['provider'][] = ['google', 'openai', 'anthropic', 'ollama'];
  const detected = preferred.find((p) => available.includes(p)) || available[0] as ProviderConfig['provider'];

  return {
    provider: detected,
    model: envModel || DEFAULT_MODELS[detected],
    apiKey: getApiKeyForProvider(detected),
  };
}

export function getAvailableProviders(): string[] {
  const providers: string[] = [];
  if (process.env.GOOGLE_API_KEY) providers.push('google');
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
  // Ollama is only auto-detected if explicitly enabled via env var
  // Users can always select it via `arcadeforge config`
  if (process.env.OLLAMA_HOST) providers.push('ollama');
  return providers;
}

function getApiKeyForProvider(provider: ProviderConfig['provider']): string | undefined {
  switch (provider) {
    case 'google':
      return process.env.GOOGLE_API_KEY;
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'ollama':
      return undefined;
  }
}
