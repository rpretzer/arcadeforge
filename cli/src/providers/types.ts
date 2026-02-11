export interface LLMProvider {
  name: string;
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
  startChat(systemInstruction: string): ChatSession;
}

export interface ChatSession {
  sendMessage(message: string): Promise<string>;
}

export interface ProviderConfig {
  provider: 'google' | 'openai' | 'anthropic' | 'ollama';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}
