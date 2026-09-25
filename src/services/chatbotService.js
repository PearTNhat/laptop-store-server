import { GoogleGenAI } from "@google/genai";
import { chatbotConfig } from "~/configs/chatbot";
import {
  searchLaptops,
  getLaptopDetail,
  buildRagPromptContext
} from "./productAdvisor";
import { parseUserIntent } from "./fastIntentParser";
import {
  getCachedSearchResults,
  buildSearchCacheKey,
  getCachedPolicy
} from "./chatCacheService";

export const RAG_SYSTEM_INSTRUCTION = `
Bạn là "Laptop Store AI Consultant" - Chuyên viên tư vấn bán laptop thông minh, tận tâm và chuyên nghiệp của cửa hàng Laptop Store.

[QUY TẮC CỐT LÕI BẮT BUỘC]:
1. CHỈ TƯ VẤN DỰA TRÊN DỮ LIỆU ĐƯỢC CUNG CẤP:
   - Dữ liệu sản phẩm thực tế từ kho hàng được gửi kèm trong prompt.
   - Tuyệt đối KHÔNG tự bịa đặt giá cả, cấu hình, thông số hoặc sản phẩm không có trong danh sách (Zero Hallucination).
   - Nếu trong dữ liệu thông báo không có máy nào phù hợp: Hãy nói rõ ràng rằng hiện tại cửa hàng chưa có dòng máy đáp ứng chính xác tất cả tiêu chí đó, và gợi ý khách điều chỉnh ngân sách hoặc tiêu chí (ví dụ: đổi sang hãng khác, tăng nhẹ ngân sách).

2. ĐỒNG BỘ TUYỆT ĐỐI VỚI DANH SÁCH SẢN PHẨM:
   - Backend sẽ tự động hiển thị các thẻ Card sản phẩm bên dưới câu trả lời của bạn tương ứng với danh sách được cung cấp.
   - BẮT BUỘC GIỚI THIỆU ĐẦY ĐỦ CÁC MÁY trong danh sách, theo đúng thứ tự từ giá thấp nhất đến cao hơn.
   - KHÔNG ĐƯỢC BỎ SÓT MÁY GIÁ RẺ NHẤT: Nếu danh sách có sản phẩm giá rẻ đặc biệt (kể cả giá 2.000đ do ưu đãi tại kho), bạn PHẢI nêu rõ sản phẩm đó là mẫu có mức giá thấp nhất hiện tại.
   - Nêu rõ giá bán thực tế cho khách. Nếu có giá niêm yết cũ cao hơn, hãy nhắc đến mức giảm giá ưu đãi.
   - Tóm tắt ngắn gọn ưu điểm cấu hình (CPU, RAM, card đồ họa, màn hình, trọng lượng) giúp khách dễ đưa ra quyết định.

3. XỬ LÝ THÔNG TIN THIẾU:
   - Nếu khách hỏi thông số kỹ thuật không có trong dữ liệu (ví dụ: máy có mấy khe RAM, nâng cấp tối đa bao nhiêu GB, pin dùng liên tục mấy tiếng, FPS cụ thể game này): Hãy nói rõ rằng thông số chi tiết này chưa được nhà sản xuất cập nhật trong hệ thống và hướng dẫn khách liên hệ hotline 0944 477 357 để kỹ thuật viên kiểm tra trực tiếp trên máy.

4. THÔNG TIN CỬA HÀNG & LIÊN HỆ:
   - Hotline / Zalo tư vấn: 0944 477 357 (8h30 - 21h30 hàng ngày).
   - Email hỗ trợ: letuannhat105@gmail.com.
   - Địa chỉ: Quận 9, Thành phố Hồ Chí Minh.
   - Khách hỏi tra cứu đơn hàng / hủy đơn: Hướng dẫn vào mục "Đơn hàng" trên website hoặc liên hệ hotline.

5. PHONG CÁCH GIAO TIẾP:
   - Thân thiện, chu đáo, xưng "em", gọi khách là "bạn" hoặc "anh/chị".
   - Câu trả lời rõ ràng, ngắt đoạn mạch lạc, dùng các gạch đầu dòng gọn gàng, in đậm tên máy và giá bán.
`;

const clientCache = new Map();
let currentKeyIndex = 0;

function getAIClient(apiKey) {
  if (!clientCache.has(apiKey)) {
    clientCache.set(apiKey, new GoogleGenAI({ apiKey }));
  }
  return clientCache.get(apiKey);
}

/**
 * Gọi AI kèm cơ chế timeout có dọn dẹp timer an toàn
 */
async function generateContentWithTimeout(ai, model, contents, config, timeoutMs = 18000) {
  let timer;
  try {
    return await Promise.race([
      ai.models.generateContent({
        model,
        contents,
        config
      }),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Model ${model} phản hồi quá ${timeoutMs / 1000}s (Timeout)`)),
          timeoutMs
        );
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Gọi AI với cơ chế tự động chuyển đổi Model & API Key trong ngân sách thời gian (Deadline)
 */
async function generateContentWithFailover({ contents, config, deadline }) {
  const allCandidateModels =
    chatbotConfig.models && chatbotConfig.models.length > 0
      ? chatbotConfig.models
      : [chatbotConfig.model, ...(chatbotConfig.fallbackModels || [])];

  const keys =
    chatbotConfig.apiKeys && chatbotConfig.apiKeys.length > 0
      ? chatbotConfig.apiKeys
      : [chatbotConfig.apiKey].filter(Boolean);

  if (keys.length === 0) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trong hệ thống.");
  }

  let lastError = null;

  for (const model of allCandidateModels) {
    if (deadline && Date.now() >= deadline) {
      console.warn(`[AI Failover] Đã chạm deadline tổng của request, dừng thử thêm model.`);
      break;
    }

    for (let i = 0; i < keys.length; i++) {
      if (deadline && Date.now() >= deadline) break;

      const keyIndex = (currentKeyIndex + i) % keys.length;
      const key = keys[keyIndex];
      const ai = getAIClient(key);

      const remainingTime = deadline ? Math.max(deadline - Date.now(), 4000) : 20000;
      const timeoutMs = Math.min(remainingTime, 18000);

      const callStart = Date.now();
      console.log(`[AI Call] Bắt đầu gọi model '${model}' (Key #${keyIndex + 1}) - timeout ${timeoutMs}ms...`);
      try {
        const response = await generateContentWithTimeout(ai, model, contents, config, timeoutMs);
        console.log(`[AI Call] Model '${model}' phản hồi thành công sau ${Date.now() - callStart}ms.`);

        currentKeyIndex = keyIndex;
        return { response, modelUsed: model };
      } catch (err) {
        lastError = err;
        const status = err.status || err.code;
        console.warn(
          `[AI Failover] Model '${model}' (Key #${keyIndex + 1}) lỗi sau ${Date.now() - callStart}ms: ${status || err.message}`
        );

        if (status === 503 || status === 429) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }
  }

  throw lastError || new Error("Tất cả các model AI đều không phản hồi.");
}

/**
 * Xử lý lượt chat thông minh: Tinh gọn 100%, phản hồi tốc độ cao qua Pre-search RAG
 */
export async function generateChatReply({
  message,
  history = [],
  activeFilters = {},
  lastSuggestedProducts = [],
  requestId = "req"
}) {
  const keys =
    chatbotConfig.apiKeys && chatbotConfig.apiKeys.length > 0
      ? chatbotConfig.apiKeys
      : [chatbotConfig.apiKey].filter(Boolean);

  if (keys.length === 0) {
    return {
      reply: "Hệ thống AI chưa được cấu hình khóa API. Quý khách vui lòng liên hệ hotline 0944 477 357 hoặc email letuannhat105@gmail.com để được hỗ trợ.",
      products: [],
      sources: [],
      activeFilters: {}
    };
  }

  const startTime = Date.now();
  const deadline = startTime + (chatbotConfig.requestDeadlineMs || 45000);

  // 1. Phân tích ý định người dùng bằng AI NLU (Không dùng Regex)
  const parsedIntent = await parseUserIntent({
    message,
    activeFilters,
    lastSuggestedProducts
  });

  const { route, activeFilters: nextFilters, policyTopic, productRef } = parsedIntent;
  console.log(`[Chatbot Router] [${requestId}] Route: "${route}" | Topic: ${policyTopic || 'none'} | Filters:`, JSON.stringify(nextFilters));

  // ==========================================
  // LUỒNG 1: Chào hỏi đơn giản (0ms LLM Call)
  // ==========================================
  if (route === "GREETING") {
    return {
      reply: "Chào bạn! Em là chuyên viên tư vấn AI của Laptop Store 🤖\nBạn đang quan tâm đến laptop theo tầm giá nào (ví dụ: dưới 15 triệu, 15-20 triệu) hay theo nhu cầu sử dụng (học tập - văn phòng, đồ họa, gaming...) để em tìm giúp bạn mẫu máy phù hợp nhất nhé?",
      products: [],
      sources: [],
      activeFilters: {}
    };
  }

  // ==========================================
  // LUỒNG 2: Hỏi chính sách đơn giản (0ms LLM Call)
  // ==========================================
  if (route === "POLICY_STATIC" && policyTopic) {
    const policy = getCachedPolicy(policyTopic);
    if (policy) {
      return {
        reply: `Dạ về **${policy.title.toLowerCase()}**, Laptop Store xin thông tin đến bạn như sau:\n\n${policy.content}\n\nNếu bạn cần hỗ trợ chi tiết hơn, bạn có thể gọi hotline **0944 477 357** (8h30 - 21h30 hàng ngày) để được hỗ trợ nhanh nhất nhé!`,
        products: [],
        sources: [`policy:${policy.topic}`],
        activeFilters: nextFilters
      };
    }
  }

  // =========================================================================
  // LUỒNG 3: PRE-SEARCH RAG (TÌM MÁY / HỎI TIẾP VỀ MÁY VỪA XEM)
  // Query DB trước -> Đóng gói context -> Gọi Gemini 1 LẦN DUY NHẤT (2.5s)
  // =========================================================================
  if (route === "PRODUCT_SEARCH" || route === "PRODUCT_REFERENCE") {
    try {
      let targetProducts = [];

      if (route === "PRODUCT_REFERENCE" && productRef) {
        if (productRef.type === "SINGLE" && productRef.product) {
          // Lấy lại dữ liệu mới nhất từ DB theo slug
          const freshDoc = await getLaptopDetail({
            slug: productRef.product.slug,
            title: productRef.product.title
          });
          targetProducts = freshDoc ? [freshDoc] : [productRef.product];
        } else if (productRef.type === "COMPARE" && Array.isArray(productRef.products)) {
          targetProducts = productRef.products.slice(0, 3);
        }
      } else {
        // Query DB trước thông qua Cache & Single-flight
        const cacheKey = buildSearchCacheKey(nextFilters);
        targetProducts = await getCachedSearchResults(cacheKey, async () => {
          return await searchLaptops({
            ...nextFilters,
            limit: 3
          });
        });
      }

      // Tra cứu chính sách nếu câu hỏi có kèm (VD: "Asus dưới 20tr bảo hành thế nào?")
      const policy = policyTopic ? getCachedPolicy(policyTopic) : null;

      // Xây dựng ngữ cảnh RAG
      const ragContext = buildRagPromptContext({
        products: targetProducts,
        policy,
        activeFilters: nextFilters
      });

      // Tạo contents gửi cho Gemini (chỉ lấy 4 lượt hội thoại gần nhất để tối ưu tốc độ)
      const contents = [];
      const recentHistory = (history || []).slice(-4);
      for (const item of recentHistory) {
        if (item.role === "user" || item.role === "model") {
          contents.push({
            role: item.role,
            parts: [{ text: item.content || "" }]
          });
        }
      }

      contents.push({
        role: "user",
        parts: [
          {
            text: `Khách hỏi: "${message}"\n\n${ragContext}\n\nHãy tư vấn chi tiết, thân thiện cho khách. Giới thiệu đầy đủ các máy theo đúng thứ tự từ giá rẻ nhất đến cao hơn.`
          }
        ]
      });

      const { response } = await generateContentWithFailover({
        contents,
        config: {
          systemInstruction: RAG_SYSTEM_INSTRUCTION
        },
        deadline
      });

      const replyText =
        response.text ||
        "Dạ em đã kiểm tra và tìm thấy các mẫu laptop phù hợp với nhu cầu của bạn ở danh sách bên dưới nhé!";

      return {
        reply: replyText,
        products: targetProducts.slice(0, 5),
        sources: [
          ...targetProducts.map((p) => `product:${p.id}`),
          ...(policy ? [`policy:${policy.topic}`] : [])
        ],
        activeFilters: nextFilters
      };
    } catch (preSearchError) {
      console.warn(`[Pre-search Flow Warning]: ${preSearchError.message}. Kiểm tra khả năng trả card dự phòng...`);
      if (parsedIntent.filterPatch && (parsedIntent.filterPatch.maxPrice || parsedIntent.filterPatch.brand)) {
        try {
          const fallbackDocs = await searchLaptops({ ...nextFilters, limit: 3 });
          if (fallbackDocs && fallbackDocs.length > 0) {
            return {
              reply: "Dạ em đã kiểm tra kho hàng và tìm thấy một số mẫu laptop phù hợp với tiêu chí của bạn. Bạn tham khảo danh sách chi tiết các máy bên dưới nhé:",
              products: fallbackDocs,
              sources: fallbackDocs.map((p) => `product:${p.id}`),
              activeFilters: nextFilters
            };
          }
        } catch {}
      }
      throw preSearchError;
    }
  }

  // =========================================================================
  // LUỒNG 4: TƯ VẤN CÂU HỎI MỞ / KIẾN THỨC CÔNG NGHỆ CHUNG (1 LẦN GỌI)
  // Áp dụng cho: So sánh chip, card màn hình, câu hỏi tư vấn chung...
  // =========================================================================
  try {
    const contents = [];
    const recentHistory = (history || []).slice(-4);
    for (const item of recentHistory) {
      if (item.role === "user" || item.role === "model") {
        contents.push({
          role: item.role,
          parts: [{ text: item.content || "" }]
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const { response } = await generateContentWithFailover({
      contents,
      config: {
        systemInstruction: RAG_SYSTEM_INSTRUCTION
      },
      deadline
    });

    return {
      reply: response.text || "Dạ em có thể giúp gì thêm cho bạn về các sản phẩm laptop tại cửa hàng không ạ?",
      products: [],
      sources: [],
      activeFilters
    };
  } catch (error) {
    console.error(`[ChatbotService Error] [${requestId}]:`, error);
    const isOverloaded =
      error.message?.includes("503") ||
      error.status === 503 ||
      error.message?.includes("high demand") ||
      error.message?.includes("UNAVAILABLE");

    const replyMsg = isOverloaded
      ? "Dạ hiện tại máy chủ AI Google đang trong khung giờ cao điểm (quá tải 503). Bạn vui lòng gửi lại câu hỏi sau vài giây giúp em nhé!"
      : `Dạ hiện tại kết nối đến hệ thống AI đang bị gián đoạn. Bạn vui lòng thử lại hoặc liên hệ hotline 0944 477 357 (email: letuannhat105@gmail.com) để được hỗ trợ ngay nhé!`;

    return {
      reply: replyMsg,
      products: [],
      sources: [],
      activeFilters
    };
  }
}
