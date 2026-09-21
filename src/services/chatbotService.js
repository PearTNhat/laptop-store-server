import { GoogleGenAI } from "@google/genai";
import { chatbotConfig } from "~/configs/chatbot";
import { geminiToolsConfig, executeTool } from "./chatbotTools";

export const SYSTEM_INSTRUCTION = `
Bạn là "Laptop Store AI Consultant" - Chuyên viên tư vấn bán laptop thông minh, tận tâm và chuyên nghiệp của cửa hàng Laptop Store.

[QUY TẮC CỐT LÕI BẮT BUỘC]:
1. CHỈ TƯ VẤN DỰA TRÊN DỮ LIỆU THẬT TỪ DATABASE:
   - Bạn được cung cấp các công cụ (Tools) để tra cứu dữ liệu thực tế:
     + Khi khách hỏi tìm laptop, hỏi giá, hỏi cấu hình, so sánh máy: BẮT BUỘC gọi tool 'searchLaptops' hoặc 'getLaptopDetail'.
     + Khi khách hỏi chính sách (bảo hành, đổi trả, ship hàng, thanh toán, trả góp, hotline): BẮT BUỘC gọi tool 'getStorePolicy'.
   - TUYỆT ĐỐI KHÔNG tự bịa đặt giá cả, cấu hình, thông số hoặc sản phẩm không có trong kết quả trả về của tool (Zero Hallucination).
   - Nếu tìm kiếm không có máy nào khớp: Hãy nói rõ ràng rằng hiện tại cửa hàng chưa có dòng máy đáp ứng chính xác tất cả tiêu chí đó, và gợi ý khách điều chỉnh ngân sách hoặc tiêu chí (ví dụ: đổi sang hãng khác, tăng nhẹ ngân sách).

2. CHUẨN HÓA TIẾNG VIỆT & TỪ KHÓA:
   - Khách hàng có thể gõ tiếng Việt không dấu, viết tắt ("20 củ", "20tr", "15 chai", "ram 16g"). Khi trích xuất tham số gọi tool, bạn hãy tự động chuẩn hóa:
     + Giá tiền sang số VND nguyên (ví dụ: '15 củ' -> 15000000, '20tr' -> 20000000).
     + RAM sang định dạng chuẩn (ví dụ: '16GB', '8GB').
     + Hãng laptop viết thường (ví dụ: 'dell', 'asus', 'lenovo', 'acer', 'hp', 'msi', 'apple').
     + Nhu cầu sang một trong các nhóm: 'Văn phòng', 'Gaming', 'Sinh viên', 'Đồ họa'.

3. TÍNH ĐỒNG BỘ TUYỆT ĐỐI GIỮA LỜI VĂN VÀ DANH SÁCH SẢN PHẨM TOOL:
   - Backend sẽ tự động hiển thị các thẻ Card sản phẩm bên dưới câu trả lời của bạn tương ứng với danh sách Tool trả về.
   - BẮT BUỘC GIỚI THIỆU ĐẦY ĐỦ CÁC MÁY TRONG KẾT QUẢ TOOL: Khi tool 'searchLaptops' trả về danh sách sản phẩm (ví dụ 2-3 máy), bạn PHẢI điểm qua và giới thiệu tất cả các máy đó trong lời phản hồi, theo đúng thứ tự từ giá thấp nhất đến cao hơn.
   - TUYỆT ĐỐI KHÔNG BỎ SÓT MÁY GIÁ RẺ NHẤT: Nếu danh sách trả về có sản phẩm giá cực rẻ (kể cả giá đặc biệt như 2.000đ hay vài triệu do ưu đãi/dữ liệu thực tế tại kho), bạn PHẢI nêu rõ sản phẩm đó là mẫu có giá thấp nhất hiện tại trong kho. Tuyệt đối không được bỏ qua máy đó rồi tự ý tuyên bố một máy đắt hơn là "máy rẻ nhất tại cửa hàng".
   - Giải thích ngắn gọn ưu điểm của từng máy (CPU, RAM, card đồ họa, màn hình, trọng lượng) để khách dễ chọn lựa.

4. BẢO MẬT & GIỚI HẠN NGHIỆP VỤ:
   - Bạn chỉ hỗ trợ tư vấn sản phẩm và chính sách công khai.
   - Nếu khách hỏi tra cứu đơn hàng, hủy đơn hoặc thanh toán đơn cũ: Lịch sự hướng dẫn khách vào mục "Đơn hàng" trên website hoặc liên hệ hotline 0969 895 549 để được nhân viên hỗ trợ bảo mật. Không yêu cầu khách gửi số điện thoại hay thông tin cá nhân trong chat.

5. PHONG CÁCH GIAO TIẾP & ĐỊNH DẠNG:
   - Thân thiện, chu đáo, xưng "em" hoặc "mình", gọi khách là "bạn" hoặc "anh/chị".
   - Câu trả lời rõ ràng, ngắt đoạn mạch lạc, dùng các gạch đầu dòng gọn gàng, dễ đọc trên điện thoại.
   - Trình bày thoáng, chỉ in đậm tên máy hoặc giá tiền, tránh lạm dụng quá nhiều dấu sao đậm nhạt chi chít để người đọc dễ theo dõi.
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
 * Gọi AI với cơ chế tự động chuyển sang Model và API Key dự phòng khi gặp lỗi 503/429
 */
async function generateContentWithFailover({ contents }) {
  const candidateModels = [
    chatbotConfig.model,
    ...(chatbotConfig.fallbackModels || [])
  ];

  const keys =
    chatbotConfig.apiKeys && chatbotConfig.apiKeys.length > 0
      ? chatbotConfig.apiKeys
      : [chatbotConfig.apiKey].filter(Boolean);

  if (keys.length === 0) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trong hệ thống.");
  }

  let lastError = null;

  for (const model of candidateModels) {
    for (let i = 0; i < keys.length; i++) {
      const keyIndex = (currentKeyIndex + i) % keys.length;
      const key = keys[keyIndex];
      const ai = getAIClient(key);

      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: geminiToolsConfig
          }
        });

        // Ghi nhớ key này đang hoạt động tốt
        currentKeyIndex = keyIndex;
        return { response, modelUsed: model };
      } catch (err) {
        lastError = err;
        const status = err.status || err.code;
        console.warn(
          `[AI Failover] Model '${model}' (Key #${keyIndex + 1}) bận/lỗi (${status || "Unknown"}). Đang tự động chuyển sang phương án dự phòng...`
        );

        if (status === 503 || status === 429) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  throw lastError;
}

/**
 * Xử lý lượt chat thông minh với Google Gen AI SDK
 */
export async function generateChatReply({
  message,
  history = [],
  requestId = "req"
}) {
  if (!chatbotConfig.enabled) {
    return {
      reply: "Tính năng Chatbot AI tư vấn hiện đang tạm bảo trì để nâng cấp. Quý khách vui lòng liên hệ hotline 0969 895 549 để được hỗ trợ trực tiếp.",
      products: [],
      sources: []
    };
  }

  const keys =
    chatbotConfig.apiKeys && chatbotConfig.apiKeys.length > 0
      ? chatbotConfig.apiKeys
      : [chatbotConfig.apiKey].filter(Boolean);

  if (keys.length === 0) {
    return {
      reply: "Hệ thống AI chưa được cấu hình khóa API. Quý khách vui lòng liên hệ quản trị viên hoặc hotline 0969 895 549.",
      products: [],
      sources: []
    };
  }

  // 1. Dựng mảng contents từ lịch sử hội thoại
  const contents = [];

  for (const item of history) {
    if (item.role === "user" || item.role === "model") {
      contents.push({
        role: item.role,
        parts: [{ text: item.content || "" }]
      });
    }
  }

  // Thêm câu hỏi hiện tại của user
  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  const accumulatedProducts = [];
  const accumulatedSources = [];
  let rounds = 0;
  let finalReply = "";

  try {
    while (rounds < chatbotConfig.maxToolRounds) {
      rounds++;

      const { response, modelUsed } = await generateContentWithFailover({ contents });

      const functionCalls = response.functionCalls;

      // Nếu model không gọi hàm nào -> đã có câu trả lời văn bản cuối cùng
      if (!functionCalls || functionCalls.length === 0) {
        finalReply =
          response.text ||
          "Dạ em đã ghi nhận thông tin, em có thể giúp gì thêm cho bạn không ạ?";
        break;
      }

      // Có function calls -> thực thi các tool
      const candidateContent = response.candidates?.[0]?.content;
      if (candidateContent) {
        contents.push(candidateContent);
      }

      const toolResults = [];

      for (const fc of functionCalls) {
        try {
          const result = await executeTool(fc.name, fc.args || {});

          if (fc.name === "searchLaptops" && Array.isArray(result)) {
            for (const p of result) {
              if (!accumulatedProducts.some((item) => item.id === p.id)) {
                accumulatedProducts.push(p);
                accumulatedSources.push(`product:${p.id}`);
              }
            }
          } else if (fc.name === "getLaptopDetail" && result) {
            if (!accumulatedProducts.some((item) => item.id === result.id)) {
              accumulatedProducts.push(result);
              accumulatedSources.push(`product:${result.id}`);
            }
          } else if (fc.name === "getStorePolicy" && result) {
            accumulatedSources.push(`policy:${result.topic}`);
          }

          toolResults.push({
            name: fc.name,
            response: { result }
          });
        } catch (toolError) {
          console.error(`[Tool Error] ${fc.name}:`, toolError.message);
          toolResults.push({
            name: fc.name,
            response: { error: toolError.message }
          });
        }
      }

      // Gửi kết quả của tool trở lại cho Gemini diễn giải
      contents.push({
        role: "user",
        parts: toolResults.map((tr) => ({
          functionResponse: {
            name: tr.name,
            response: tr.response
          }
        }))
      });
    }

    if (!finalReply) {
      finalReply = "Dạ bên em đã kiểm tra thông tin và hiển thị danh sách sản phẩm phù hợp ở bên dưới nhé!";
    }

    return {
      reply: finalReply,
      products: accumulatedProducts.slice(0, 5), // Tối đa 5 card sản phẩm
      sources: accumulatedSources
    };
  } catch (error) {
    console.error(`[ChatbotService Error] [${requestId}]:`, error);
    return {
      reply: "Dạ hiện tại hệ thống tư vấn đang bận một chút, em chưa kịp tra cứu xong. Bạn có thể gửi lại câu hỏi hoặc liên hệ hotline 0969 895 549 để được tư vấn nhanh nhất nhé!",
      products: [],
      sources: []
    };
  }
}
