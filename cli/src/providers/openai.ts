import OpenAI from 'openai';
import type { LLMProvider, ChatSession, ProviderConfig } from './types.js';

export function createOpenAIProvider(config: ProviderConfig): LLMProvider {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
  const modelName = config.model || 'gpt-4o';
  const client = new OpenAI({
    apiKey,
    ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
  });

  return {
    name: 'openai',

    async generateText(prompt: string, systemInstruction?: string): Promise<string> {
      const messages: OpenAI.ChatCompletionMessageParam[] = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await client.chat.completions.create({
        model: modelName,
        messages,
      });
      return response.choices[0]?.message?.content || '';
    },

    startChat(systemInstruction: string): ChatSession {
      const history: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction },
      ];

      return {
        async sendMessage(message: string): Promise<string> {
          history.push({ role: 'user', content: message });
          const response = await client.chat.completions.create({
            model: modelName,
            messages: [...history],
          });
          const text = response.choices[0]?.message?.content || '';
          history.push({ role: 'assistant', content: text });
          return text;
        },
      };
    },
  };
}
