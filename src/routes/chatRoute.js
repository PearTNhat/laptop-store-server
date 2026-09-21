import express from "express";
import { handleChatMessage, getChatHistory } from "~/controllers/chatController";
import { validateChatMessage } from "~/validators/chatValidator";
import { chatRateLimiter } from "~/middleware/chatRateLimit";

const router = express.Router();

router.post("/", chatRateLimiter, validateChatMessage, handleChatMessage);
router.get("/history/:conversationId", getChatHistory);

export const chatRoute = router;
