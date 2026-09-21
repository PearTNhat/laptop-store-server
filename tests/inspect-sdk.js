import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: "test-key" });
console.log("ai.models:", Object.getOwnPropertyNames(Object.getPrototypeOf(ai.models)));
console.log("ai.chats:", Object.getOwnPropertyNames(Object.getPrototypeOf(ai.chats)));
