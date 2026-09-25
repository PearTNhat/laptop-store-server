import {
  getOrCreateSession,
  acquireSessionLock,
  releaseSessionLock,
  saveTurn,
  generateRandomId
} from "~/services/chatSessionService";
import { generateChatReply } from "~/services/chatbotService";
import ChatSession from "~/models/ChatSession";

/**
 * Xử lý tin nhắn chat từ người dùng
 */
export async function handleChatMessage(req, res, next) {
  const requestId = generateRandomId("req");
  const { message, conversationId } = req.body;
  const guestId =
    req.cookies?.guestId ||
    req.headers["x-guest-id"] ||
    generateRandomId("guest");

  let session = null;
  let lockToken = null;

  try {
    const startTime = Date.now();
    console.log(`[ChatController] [${requestId}] Bắt đầu xử lý tin nhắn: "${message}" (conv: ${conversationId || 'new'})`);

    // 1. Lấy hoặc tạo mới phiên hội thoại
    session = await getOrCreateSession({
      sessionId: conversationId,
      guestId
    });

    // 2. Thử giành khóa để ngăn 2 request đồng thời (sử dụng Token độc quyền)
    const lockResult = await acquireSessionLock(session.sessionId);
    if (!lockResult) {
      console.warn(`[ChatController] [${requestId}] Phiên ${session.sessionId} đang bị khóa bởi request khác.`);
      return res.status(409).json({
        success: false,
        error: {
          code: 409,
          message: "Câu hỏi trước đó của bạn đang được AI xử lý, vui lòng chờ trong giây lát.",
          retryable: true
        },
        requestId
      });
    }

    lockToken = lockResult.lockToken;

    // 3. Gọi dịch vụ Gemini AI tư vấn (truyền đầy đủ activeFilters và lastSuggestedProducts)
    const aiResult = await generateChatReply({
      message,
      history: session.messages || [],
      activeFilters: session.activeFilters || {},
      lastSuggestedProducts: session.lastSuggestedProducts || [],
      requestId
    });

    // 4. Lưu lại lượt trò chuyện vào MongoDB (đồng thời lưu lại activeFilters và giải phóng lock)
    await saveTurn({
      sessionId: session.sessionId,
      lockToken,
      userMessage: message,
      modelReply: aiResult.reply,
      suggestedProducts: aiResult.products,
      sources: aiResult.sources,
      activeFilters: aiResult.activeFilters
    });

    // 5. Cấp cookie HttpOnly cho guest & conversation
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 giờ
    };

    res.cookie("guestId", session.guestId, cookieOptions);
    res.cookie("conversationId", session.sessionId, cookieOptions);

    console.log(`[ChatController] [${requestId}] Hoàn tất xử lý trong ${Date.now() - startTime}ms. Gợi ý ${aiResult.products?.length || 0} sản phẩm.`);

    // 6. Trả lời kết quả theo đúng hợp đồng giao tiếp
    return res.status(200).json({
      success: true,
      reply: aiResult.reply,
      products: aiResult.products,
      sources: aiResult.sources,
      conversationId: session.sessionId,
      guestId: session.guestId,
      requestId
    });
  } catch (error) {
    console.error(`[ChatController Error] [${requestId}]:`, error);
    if (session) {
      await releaseSessionLock(session.sessionId, lockToken);
    }
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Không thể kết nối đến máy chủ AI, vui lòng thử lại sau.",
        retryable: true
      },
      requestId
    });
  }
}

/**
 * Lấy lịch sử tin nhắn của một phiên hội thoại
 */
export async function getChatHistory(req, res, next) {
  try {
    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({
        error: {
          code: 400,
          message: "Thiếu mã định danh cuộc hội thoại.",
          retryable: false
        }
      });
    }

    const session = await ChatSession.findOne({ sessionId: conversationId }).lean();
    if (!session) {
      return res.status(404).json({
        error: {
          code: 404,
          message: "Cuộc hội thoại không tồn tại hoặc đã hết hạn.",
          retryable: false
        }
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: session.sessionId,
      messages: session.messages || [],
      lastSuggestedProducts: session.lastSuggestedProducts || []
    });
  } catch (error) {
    next(error);
  }
}
