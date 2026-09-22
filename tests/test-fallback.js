import { GoogleGenAI } from '@google/genai';
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel(m) {
  try {
    const res = await ai.models.generateContent({
      model: m,
      contents: [{ role: 'user', parts: [{ text: 'chào bạn' }] }]
    });
    console.log(`[${m}] SUCCESS:`, res.text?.slice(0, 40).replace(/\n/g, ' '));
  } catch (e) {
    console.log(`[${m}] FAILED:`, e.status || e.code, e.message?.slice(0, 100));
  }
}

async function run() {
  await testModel('gemini-3.5-flash-lite');
  await testModel('gemini-3.1-flash-lite');
  await testModel('gemini-3.8-flash');
  await testModel('gemini-3.7-flash');
  await testModel('gemini-3-flash-preview');
  await testModel('gemini-3.5-flash');
  await testModel('gemini-3.6-flash');
}

run().catch(console.error);
