import "dotenv/config";

export const chatbotConfig = {
  // Hỗ trợ 1 hoặc nhiều API Key (phân tách bởi dấu phẩy: "key1,key2,key3")
  apiKeys: (process.env.GEMINI_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean),
  apiKey: (process.env.GEMINI_API_KEY || "").split(",")[0]?.trim() || "",
  model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  fallbackModels: (
    process.env.GEMINI_FALLBACK_MODELS ||
    "gemini-3.5-flash-lite,gemini-3-flash-preview,gemini-flash-lite-latest"
  )
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean),
  enabled: process.env.CHATBOT_ENABLED !== "false",
  maxHistoryTurns: 10,
  maxToolRounds: 3,
  maxToolCallsPerRequest: 6,
  requestDeadlineMs: 30000,
  dbQueryTimeoutMs: 3000,
  lockTimeoutMs: 30000,
  sessionTtlHours: 24,
  rateLimit: {
    windowMs: 60 * 1000,
    maxPerGuest: 10,
    maxPerIp: 30
  }
};
