import { GoogleGenAI } from '@google/genai';
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function list() {
  const models = await ai.models.list();
  for await (const m of models) {
    if (m.name.includes("gemini") && m.supportedActions?.includes("generateContent")) {
      console.log(m.name);
    }
  }
}
list().catch(console.error);
