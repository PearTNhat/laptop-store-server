import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testQuery(query) {
  console.log(`\n--------------------------------------------`);
  console.log("Input:", query);
  const t0 = Date.now();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: `Người dùng nhắn: "${query}"`,
    config: {
      systemInstruction: `Bạn là bộ não phân tích ý định (NLU) cho cửa hàng Laptop Store.
Nhiệm vụ: Trích xuất chính xác ý định của người dùng thành đúng định dạng JSON sau:
{
  "route": "GREETING" | "POLICY_STATIC" | "PRODUCT_SEARCH" | "PRODUCT_REFERENCE" | "COMPLEX_TOOL",
  "brand": string | null,
  "excludedBrands": string[],
  "minPrice": number | null,
  "maxPrice": number | null,
  "ram": string | null,
  "need": string | null, // "Văn phòng" | "Gaming" | "Sinh viên" | "Đồ họa"
  "policyTopic": string | null, // "warranty" | "return_policy" | "shipping" | "payment_methods" | "contact"
  "isCheapest": boolean,
  "productRef": { "type": "SINGLE" | "COMPARE" | null, "index": number | null }
}
Chỉ trả về JSON thuần túy.`,
      responseMimeType: "application/json"
    }
  });
  console.log(`⏱️ Thời gian: ${Date.now() - t0}ms`);
  console.log(response.text);
}

async function run() {
  await testQuery("chào shop ơi");
  await testQuery("bên mình bảo hành như thế nào vậy");
  await testQuery("con máy số 1 nâng cấp ram được không");
  await testQuery("tìm máy chơi fo4 pubg mượt dưới 20 triệu");
}

run().catch(console.error);
