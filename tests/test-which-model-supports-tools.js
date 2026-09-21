import { GoogleGenAI } from '@google/genai';
import "dotenv/config";
import { geminiToolsConfig } from '../src/services/chatbotTools';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const candidateModels = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
  "gemini-flash-lite-latest"
];

async function run() {
  for (const model of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: 'tìm laptop giá rẻ' }] }],
        config: { tools: geminiToolsConfig }
      });
      console.log(`[${model}] SUCCESS, functionCalls:`, !!res.functionCalls?.length, 'text:', !!res.text);
    } catch (e) {
      console.log(`[${model}] ERROR (${e.status || e.code}):`, e.message?.slice(0, 100));
    }
  }
}

run().catch(console.error);
