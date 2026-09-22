import { GoogleGenAI } from '@google/genai';
import "dotenv/config";

console.log("[Test] Successfully loaded @google/genai with Babel!");
console.log("[Test] GoogleGenAI class is defined:", typeof GoogleGenAI === 'function');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("[Warning] GEMINI_API_KEY is not set in .env yet. Please configure it to make real API calls.");
} else {
  console.log("[Test] GEMINI_API_KEY is detected, testing connection...");
  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  ai.models.generateContent({
    model,
    contents: "Chào bạn, hãy trả lời 'OK' ngắn gọn."
  }).then(response => {
    console.log("[Success] Gemini response:", response.text);
  }).catch(err => {
    console.error("[Error] Gemini API error:", err.message);
  });
}
