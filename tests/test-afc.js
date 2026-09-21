import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: "test-key" });
const chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: "You are a helpful assistant"
  }
});
console.log("Chat instance methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(chat)));
