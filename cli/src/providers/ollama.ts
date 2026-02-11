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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000); // 2 min timeout
      try {
        const response = await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            prompt,
            system: systemInstruction || undefined,
            stream: false,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
        }
        const data = (await response.json()) as OllamaGenerateResponse;
        return data.response;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          throw new Error('Ollama request timed out after 2 minutes. Is Ollama running? Try a smaller model.');
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    },

    startChat(systemInstruction: string): ChatSession {
      const history: OllamaChatMessage[] = [
        { role: 'system', content: systemInstruction },
      ];

      return {
        async sendMessage(message: string): Promise<string> {
          history.push({ role: 'user', content: message });
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 120_000);
          try {
            const response = await fetch(`${baseUrl}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: modelName,
                messages: [...history],
                stream: false,
              }),
              signal: controller.signal,
            });
            if (!response.ok) {
              throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
            }
            const data = (await response.json()) as OllamaChatResponse;
            const text = data.message.content;
            history.push({ role: 'assistant', content: text });
            return text;
          } catch (err) {
            if ((err as Error).name === 'AbortError') {
              throw new Error('Ollama request timed out after 2 minutes. Is Ollama running? Try a smaller model.');
            }
            throw err;
          } finally {
            clearTimeout(timeout);
          }
        },
      };
    },
  };
}
