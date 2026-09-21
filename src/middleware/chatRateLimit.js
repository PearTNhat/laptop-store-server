import { chatbotConfig } from "~/configs/chatbot";

const ipRequests = new Map();
const guestRequests = new Map();

// Dọn dẹp bộ nhớ đệm mỗi 5 phút
setInterval(() => {
  const now = Date.now();
  const windowMs = chatbotConfig.rateLimit.windowMs;

  for (const [key, timestamps] of ipRequests.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) ipRequests.delete(key);
    else ipRequests.set(key, valid);
  }

  for (const [key, timestamps] of guestRequests.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) guestRequests.delete(key);
    else guestRequests.set(key, valid);
  }
}, 5 * 60 * 1000);

export function chatRateLimiter(req, res, next) {
  const now = Date.now();
  const windowMs = chatbotConfig.rateLimit.windowMs;
  const ip = req.ip || req.connection?.remoteAddress || "unknown_ip";
  const guestId = req.cookies?.guestId || req.headers["x-guest-id"] || req.body?.guestId;

  // 1. Kiểm tra giới hạn theo IP
  const ipHistory = (ipRequests.get(ip) || []).filter((t) => now - t < windowMs);
  if (ipHistory.length >= chatbotConfig.rateLimit.maxPerIp) {
    return res.status(429).json({
      error: {
        code: 429,
        message: "Hệ thống phát hiện quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.",
        retryable: true
      }
    });
  }
  ipHistory.push(now);
  ipRequests.set(ip, ipHistory);

  // 2. Kiểm tra giới hạn theo Guest ID (nếu có)
  if (guestId) {
    const guestHistory = (guestRequests.get(guestId) || []).filter((t) => now - t < windowMs);
    if (guestHistory.length >= chatbotConfig.rateLimit.maxPerGuest) {
      return res.status(429).json({
        error: {
          code: 429,
          message: "Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi một chút trước khi gửi câu hỏi tiếp theo nhé!",
          retryable: true
        }
      });
    }
    guestHistory.push(now);
    guestRequests.set(guestId, guestHistory);
  }

  next();
}
