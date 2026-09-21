import crypto from "crypto";
import ChatSession from "~/models/ChatSession";
import { chatbotConfig } from "~/configs/chatbot";

/**
 * Sinh ID ngẫu nhiên an toàn
 */
export function generateRandomId(prefix = "id") {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Lấy hoặc khởi tạo phiên hội thoại mới
 */
export async function getOrCreateSession({ sessionId, guestId }) {
  let session = null;

  if (sessionId) {
    session = await ChatSession.findOne({ sessionId });
  }

  if (!session) {
    const newSessionId = sessionId || generateRandomId("conv");
    session = await ChatSession.create({
      sessionId: newSessionId,
      guestId: guestId || generateRandomId("guest"),
      messages: [],
      activeFilters: {},
      lastSuggestedProducts: [],
      isProcessing: false,
      lockUntil: null,
      expiresAt: new Date(Date.now() + chatbotConfig.sessionTtlHours * 3600 * 1000)
    });
  }

  return session;
}

/**
 * Thử giành khóa xử lý (Acquire Lock) để tránh 2 request đồng thời gây deadlock
 */
export async function acquireSessionLock(sessionId) {
  const now = new Date();
  const lockExpiry = new Date(now.getTime() + chatbotConfig.lockTimeoutMs);

  // Điều kiện để được cấp khóa:
  // 1. isProcessing == false
  // HOẶC 2. lockUntil < now (khóa cũ đã hết hạn, server crash tự hồi phục)
  // HOẶC 3. lockUntil == null
  const session = await ChatSession.findOneAndUpdate(
    {
      sessionId,
      $or: [
        { isProcessing: false },
        { lockUntil: null },
        { lockUntil: { $lt: now } }
      ]
    },
    {
      $set: {
        isProcessing: true,
        lockUntil: lockExpiry
      }
    },
    { new: true }
  );

  return session; // Nếu null nghĩa là phiên đang bị khóa hợp lệ bởi request khác
}

/**
 * Giải phóng khóa xử lý (Release Lock)
 */
export async function releaseSessionLock(sessionId) {
  await ChatSession.updateOne(
    { sessionId },
    {
      $set: {
        isProcessing: false,
        lockUntil: null
      }
    }
  );
}

/**
 * Cập nhật lịch sử và thông tin sản phẩm sau khi hội thoại thành công
 */
export async function saveTurn({
  sessionId,
  userMessage,
  modelReply,
  suggestedProducts = [],
  sources = []
}) {
  const session = await ChatSession.findOne({ sessionId });
  if (!session) return null;

  // Thêm tin nhắn user
  session.messages.push({
    role: "user",
    content: userMessage,
    timestamp: new Date()
  });

  // Thêm tin nhắn model
  session.messages.push({
    role: "model",
    content: modelReply,
    products: suggestedProducts,
    sources: sources,
    timestamp: new Date()
  });

  // Giới hạn số lượng tin nhắn lưu trong DB (lấy tối đa 20 messages = 10 turns)
  const maxMessages = chatbotConfig.maxHistoryTurns * 2;
  if (session.messages.length > maxMessages) {
    session.messages = session.messages.slice(-maxMessages);
  }

  // Cập nhật danh sách sản phẩm vừa gợi ý (nếu có)
  if (suggestedProducts && suggestedProducts.length > 0) {
    session.lastSuggestedProducts = suggestedProducts;
  }

  // Cập nhật thời hạn hết hạn 24h từ lúc hoạt động gần nhất
  session.expiresAt = new Date(
    Date.now() + chatbotConfig.sessionTtlHours * 3600 * 1000
  );
  session.isProcessing = false;
  session.lockUntil = null;

  await session.save();
  return session;
}
