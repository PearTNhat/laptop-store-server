import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "../src/configs/mongodb";
import { generateChatReply } from "../src/services/chatbotService";

async function testAIChat() {
  console.log("=== KIỂM THỬ ĐỘ NHỚ NGỮ CẢNH MULTI-TURN ===");
  await connectDB();

  let lastProducts = [];
  let currentFilters = {};

  // Turn 1: Tìm máy Asus dưới 25 triệu
  console.log("\n[LƯỢT 1]: 'tìm laptop asus dưới 25 triệu'");
  let res = await generateChatReply({
    message: "tìm laptop asus dưới 25 triệu",
    history: [],
    activeFilters: currentFilters,
    lastSuggestedProducts: lastProducts,
    requestId: "turn_1"
  });
  console.log(`⏱️ Thời gian: ${res.reply.length > 0 ? "OK" : "Lỗi"} | Filters:`, res.activeFilters);
  console.log("Các máy tìm được:", res.products.map(p => `[${p.brand}] ${p.title} - ${p.priceVnd}đ`));
  lastProducts = res.products;
  currentFilters = res.activeFilters;

  // Turn 2: Người dùng hỏi tiếp "có máy nào RAM 16GB không?" (Kỳ vọng: vẫn giữ hãng Asus & dưới 25tr, thêm ram 16GB)
  console.log("\n[LƯỢT 2 (Hỏi tiếp)]: 'có máy nào ram 16gb không?'");
  res = await generateChatReply({
    message: "có máy nào ram 16gb không?",
    history: [
      { role: "user", content: "tìm laptop asus dưới 25 triệu" },
      { role: "model", content: res.reply }
    ],
    activeFilters: currentFilters,
    lastSuggestedProducts: lastProducts,
    requestId: "turn_2"
  });
  console.log("Filters kế thừa thành công:", res.activeFilters);
  console.log("Các máy tìm được:", res.products.map(p => `[${p.brand}] ${p.title} - RAM: ${p.specs.ram} - ${p.priceVnd}đ`));

  // Turn 3: Hỏi về máy số 1 "con máy đầu tiên nâng cấp ram được không?"
  console.log("\n[LƯỢT 3 (Tham chiếu máy cũ)]: 'con máy đầu tiên nâng cấp ram được không?'");
  res = await generateChatReply({
    message: "con máy đầu tiên nâng cấp ram được không?",
    history: [
      { role: "user", content: "có máy nào ram 16gb không?" },
      { role: "model", content: res.reply }
    ],
    activeFilters: res.activeFilters,
    lastSuggestedProducts: res.products,
    requestId: "turn_3"
  });
  console.log("AI trả lời về máy đầu tiên:\n", res.reply);

  await mongoose.disconnect();
  console.log("\n=== KIỂM THỬ HOÀN TẤT ===");
}

testAIChat().catch(err => {
  console.error(err);
  process.exit(1);
});
