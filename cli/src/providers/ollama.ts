import type { LLMProvider, ChatSession, ProviderConfig } from './types.js';

interface OllamaGenerateResponse {
  response: string;
}

interface OllamaChatResponse {
  message: { role: string; content: string };
}

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function createOllamaProvider(config: ProviderConfig): LLMProvider {
  const baseUrl = config.baseUrl || 'http://localhost:11434';
  const modelName = config.model || 'llama3';

  return {
    name: 'ollama',

    async generateText(prompt: string, systemInstruction?: string): Promise<string> {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt,
          system: systemInstruction || undefined,
          stream: false,
        }),
      });
      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
      }
      const data = (await response.json()) as OllamaGenerateResponse;
      return data.response;
    },

    startChat(systemInstruction: string): ChatSession {
      const history: OllamaChatMessage[] = [
        { role: 'system', content: systemInstruction },
      ];

      return {
        async sendMessage(message: string): Promise<string> {
          history.push({ role: 'user', content: message });
          const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelName,
              messages: [...history],
              stream: false,
            }),
          });
          if (!response.ok) {
            throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
          }
          const data = (await response.json()) as OllamaChatResponse;
          const text = data.message.content;
          history.push({ role: 'assistant', content: text });
          return text;
        },
      };
    },
  };
}
