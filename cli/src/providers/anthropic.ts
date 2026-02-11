import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ChatSession, ProviderConfig } from './types.js';

export function createAnthropicProvider(config: ProviderConfig): LLMProvider {
  const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
  const modelName = config.model || 'claude-sonnet-4-5-20250929';
  const client = new Anthropic({
    apiKey,
    ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
  });

  return {
    name: 'anthropic',

    async generateText(prompt: string, systemInstruction?: string): Promise<string> {
      const response = await client.messages.create({
        model: modelName,
        max_tokens: 4096,
        ...(systemInstruction ? { system: systemInstruction } : {}),
        messages: [{ role: 'user', content: prompt }],
      });
      const block = response.content[0];
      return block.type === 'text' ? block.text : '';
    },

    startChat(systemInstruction: string): ChatSession {
      const history: Anthropic.MessageParam[] = [];

      return {
        async sendMessage(message: string): Promise<string> {
          history.push({ role: 'user', content: message });
          const response = await client.messages.create({
            model: modelName,
            max_tokens: 4096,
            system: systemInstruction,
            messages: [...history],
          });
          const block = response.content[0];
          const text = block.type === 'text' ? block.text : '';
          history.push({ role: 'assistant', content: text });
          return text;
        },
      };
    },
  };
}
