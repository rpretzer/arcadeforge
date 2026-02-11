import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, ChatSession, ProviderConfig } from './types.js';

export function createGoogleProvider(config: ProviderConfig): LLMProvider {
  const apiKey = config.apiKey || process.env.GOOGLE_API_KEY || '';
  const modelName = config.model || 'gemini-2.0-flash';
  const genAI = new GoogleGenerativeAI(apiKey);

  return {
    name: 'google',

    async generateText(prompt: string, systemInstruction?: string): Promise<string> {
      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(systemInstruction ? { systemInstruction } : {}),
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    },

    startChat(systemInstruction: string): ChatSession {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });
      const chat = model.startChat({ history: [] });

      return {
        async sendMessage(message: string): Promise<string> {
          const result = await chat.sendMessage(message);
          const response = await result.response;
          return response.text();
        },
      };
    },
  };
}
