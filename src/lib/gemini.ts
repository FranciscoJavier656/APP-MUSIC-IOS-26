import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const chatWithGemini = async (message: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY environment variable');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: message,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      systemInstruction: `You are an intelligent music assistant inside an iOS-style high-resolution music app. You answer complex queries about music, artists, and albums.
Keep responses concise, well-formatted, and helpful. Recommend real albums and tracks that the user could search for.`,
    },
  });

  return response.text;
};
