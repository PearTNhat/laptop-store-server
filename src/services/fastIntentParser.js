import { GoogleGenAI } from "@google/genai";
import { chatbotConfig } from "~/configs/chatbot";

const intentClientCache = new Map();
const queryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút

function getAIClient(apiKey) {
  if (!intentClientCache.has(apiKey)) {
    intentClientCache.set(apiKey, new GoogleGenAI({ apiKey }));
  }
  return intentClientCache.get(apiKey);
}

const PARSER_SYSTEM_INSTRUCTION = `
Bạn là bộ não phân tích ý định (NLU) thông minh của hệ thống tư vấn Laptop Store.
Nhiệm vụ: Đọc tin nhắn của khách hàng và trích xuất chính xác thành đúng định dạng JSON sau:
{
  "route": "GREETING" | "POLICY_STATIC" | "PRODUCT_SEARCH" | "PRODUCT_REFERENCE" | "COMPLEX_TOOL",
  "brand": string | null,
  "excludedBrands": string[],
  "minPrice": number | null,
  "maxPrice": number | null,
  "ram": string | null,
  "need": "Văn phòng" | "Gaming" | "Sinh viên" | "Đồ họa" | null,
  "policyTopic": "warranty" | "return_policy" | "shipping" | "payment_methods" | "contact" | null,
  "isCheapest": boolean,
  "productRefIndex": number | null,
  "isCompare": boolean,
  "resetFilters": boolean
}

QUY TẮC SUY LUẬN NGỮ NGHĨA (TỰ ĐỘNG HIỂU, KHÔNG DÙNG REGEX):
1. Tiền tệ:
   - Các từ lóng "củ", "chai", "tr", "triệu", "m" đều là triệu VND (vd: "15 củ" -> 15.000.000).
   - "Tầm 15 củ", "khoảng 15 triệu" -> minPrice: 11000000, maxPrice: 16000000.
   - "Dưới 20tr", "tối đa 20 củ" -> maxPrice: 20000000.
   - "Từ 15 đến 20tr" -> minPrice: 15000000, maxPrice: 20000000.
   - "Rẻ nhất", "giá rẻ" -> isCheapest: true.

2. Hãng laptop & Loại trừ:
   - Hãng hợp lệ: "asus", "dell", "lenovo", "acer", "hp", "msi", "apple" (macbook), "gigabyte", "masstel".
   - Phủ định hãng: "không lấy dell", "trừ hp", "đừng lấy lenovo" -> đưa vào excludedBrands.

3. Nhu cầu sử dụng:
   - Tên game (FO4, PUBG, LOL, Genshin, Valorant, CSGO, game nặng...) -> need: "Gaming".
   - Tên phần mềm đồ họa (Photoshop, Premiere, AutoCAD, Revit, 3DsMax, Render, vẽ, thiết kế...) -> need: "Đồ họa".
   - Học tập, sinh viên, sư phạm, kế toán, văn phòng, mỏng nhẹ, pin trâu, đi cà phê -> need: "Văn phòng" hoặc "Sinh viên".
   - Phủ định nhu cầu: "không chơi game", "không cần gaming" -> TUYỆT ĐỐI KHÔNG gán Gaming!

4. Phân loại Route:
   - "GREETING": Khi khách chỉ chào hỏi (chào shop, hello, hi em, alo...).
   - "POLICY_STATIC": Khi khách chỉ hỏi về chính sách cửa hàng (bảo hành, đổi trả, ship, trả góp, hotline, địa chỉ...).
   - "PRODUCT_REFERENCE": Khi khách hỏi tiếp về máy đã xem (con số 1, máy đầu tiên, con lenovo vừa rồi, so sánh 2 máy...).
   - "PRODUCT_SEARCH": Khi khách tìm máy, hỏi giá, hỏi cấu hình laptop.
   - "COMPLEX_TOOL": Khi câu hỏi quá kỳ lạ, mơ hồ hoặc ngoài phạm vi.

5. Tham chiếu máy đã hiển thị:
   - "Máy số 1", "con đầu tiên" -> productRefIndex: 0.
   - "Máy số 2", "con thứ hai" -> productRefIndex: 1.
   - "Máy số 3", "con thứ ba", "con cuối" -> productRefIndex: 2.
   - "So sánh 2 máy trên", "hai máy này khác gì nhau" -> isCompare: true.

Chỉ trả về JSON thuần túy, không có markdown hoặc giải thích.
`;

/**
 * Phân tích ý định người dùng hoàn toàn bằng AI (Không dùng Regex)
 */
export async function parseUserIntent({
  message = "",
  activeFilters = {},
  lastSuggestedProducts = []
}) {
  const cleanMsg = (message || "").trim();
  if (!cleanMsg) {
    return {
      route: "GREETING",
      activeFilters: {},
      policyTopic: null,
      productRef: null
    };
  }

  // 1. Kiểm tra cache câu hỏi gần đây (giúp trả lời siêu tốc nếu trùng câu hỏi)
  const cacheKey = cleanMsg.toLowerCase();
  const now = Date.now();
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (now < cached.expiresAt) {
      return processParsedResult(cached.data, activeFilters, lastSuggestedProducts);
    }
    queryCache.delete(cacheKey);
  }

  // 2. Chuẩn bị gọi Gemini phân tích ngữ nghĩa
  const keys =
    chatbotConfig.apiKeys && chatbotConfig.apiKeys.length > 0
      ? chatbotConfig.apiKeys
      : [chatbotConfig.apiKey].filter(Boolean);

  if (keys.length === 0) {
    // Dự phòng nếu chưa có key
    return {
      route: "COMPLEX_TOOL",
      activeFilters,
      policyTopic: null,
      productRef: null
    };
  }

  const candidateModels =
    chatbotConfig.models && chatbotConfig.models.length > 0
      ? chatbotConfig.models
      : [chatbotConfig.model, ...(chatbotConfig.fallbackModels || [])];

  let rawJson = null;

  // Cung cấp thêm ngữ cảnh phiên vào nội dung phân tích để AI hiểu trọn vẹn
  let promptContent = `Tin nhắn khách: "${cleanMsg}"`;
  if (lastSuggestedProducts && lastSuggestedProducts.length > 0) {
    const machineList = lastSuggestedProducts
      .map((p, i) => `#${i + 1}: ${p.title} (${p.brand || "Khác"})`)
      .join("; ");
    promptContent += `\n(Danh sách máy đang hiển thị trên màn hình: ${machineList})`;
  }

  for (const model of candidateModels) {
    for (const key of keys) {
      const ai = getAIClient(key);
      try {
        const response = await Promise.race([
          ai.models.generateContent({
            model,
            contents: promptContent,
            config: {
              systemInstruction: PARSER_SYSTEM_INSTRUCTION,
              responseMimeType: "application/json"
            }
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout phân tích")), 3500)
          )
        ]);

        if (response?.text) {
          rawJson = JSON.parse(response.text.trim());
          break;
        }
      } catch (err) {
        console.warn(`[LLM Intent Parser] Model ${model} gặp lỗi: ${err.message}. Đang thử tiếp...`);
      }
    }
    if (rawJson) break;
  }

  if (!rawJson) {
    console.warn(`[LLM Intent Parser] Không thể trích xuất JSON bằng AI, chuyển sang luồng dự phòng.`);
    return {
      route: "COMPLEX_TOOL",
      activeFilters,
      policyTopic: null,
      productRef: null
    };
  }

  // Lưu cache ý định
  queryCache.set(cacheKey, {
    data: rawJson,
    expiresAt: now + CACHE_TTL_MS
  });

  return processParsedResult(rawJson, activeFilters, lastSuggestedProducts);
}

/**
 * Xử lý kết quả JSON từ AI và kết hợp với ngữ cảnh phiên (activeFilters)
 */
function processParsedResult(rawJson, activeFilters = {}, lastSuggestedProducts = []) {
  const {
    route = "PRODUCT_SEARCH",
    brand = null,
    excludedBrands = [],
    minPrice = null,
    maxPrice = null,
    ram = null,
    need = null,
    policyTopic = null,
    isCheapest = false,
    productRefIndex = null,
    isCompare = false,
    resetFilters = false
  } = rawJson;

  // 1. Kế thừa hoặc reset bộ lọc
  let mergedFilters = resetFilters ? {} : { ...activeFilters };

  if (brand) {
    mergedFilters.brand = brand.toLowerCase();
  }
  if (Array.isArray(excludedBrands) && excludedBrands.length > 0) {
    mergedFilters.excludedBrands = Array.from(
      new Set([...(mergedFilters.excludedBrands || []), ...excludedBrands.map((b) => b.toLowerCase())])
    );
  }
  if (minPrice !== null) {
    mergedFilters.minPrice = minPrice;
  }
  if (maxPrice !== null) {
    mergedFilters.maxPrice = maxPrice;
  }
  if (ram) {
    mergedFilters.ram = ram.toUpperCase();
  }
  if (need) {
    mergedFilters.need = need;
  }
  if (isCheapest) {
    mergedFilters.isCheapest = true;
  }

  // 2. Xác định tham chiếu sản phẩm
  let productRef = null;
  if (isCompare && lastSuggestedProducts.length > 0) {
    productRef = { type: "COMPARE", products: lastSuggestedProducts };
  } else if (
    productRefIndex !== null &&
    productRefIndex >= 0 &&
    lastSuggestedProducts.length > 0
  ) {
    const target = lastSuggestedProducts[productRefIndex] || lastSuggestedProducts[0];
    productRef = {
      type: "SINGLE",
      product: target,
      index: productRefIndex
    };
  }

  return {
    route,
    activeFilters: mergedFilters,
    policyTopic,
    productRef
  };
}
