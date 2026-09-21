import { GoogleGenAI } from '@google/genai';
import { geminiToolsConfig, executeTool } from '../src/services/chatbotTools';
import { chatbotConfig } from '../src/configs/chatbot';

console.log("[Test] Gemini Tools Config:", JSON.stringify(geminiToolsConfig, null, 2));

const ai = new GoogleGenAI({ apiKey: chatbotConfig.apiKey || "dummy-key" });
console.log("[Test] SDK GoogleGenAI instantiated successfully.");
