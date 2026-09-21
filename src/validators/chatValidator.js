export function validateChatMessage(req, res, next) {
  const { message, conversationId } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      error: {
        code: 400,
        message: "Nội dung tin nhắn không được để trống.",
        retryable: false
      }
    });
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({
      error: {
        code: 400,
        message: "Nội dung tin nhắn không được chỉ chứa khoảng trắng.",
        retryable: false
      }
    });
  }

  if (trimmed.length > 2000) {
    return res.status(400).json({
      error: {
        code: 400,
        message: "Tin nhắn quá dài (tối đa 2.000 ký tự).",
        retryable: false
      }
    });
  }

  if (conversationId && (typeof conversationId !== "string" || conversationId.length > 100)) {
    return res.status(400).json({
      error: {
        code: 400,
        message: "Định danh cuộc hội thoại không hợp lệ.",
        retryable: false
      }
    });
  }

  req.body.message = trimmed;
  next();
}
