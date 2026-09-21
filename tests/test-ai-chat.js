import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "../src/configs/mongodb";
import { generateChatReply } from "../src/services/chatbotService";

async function testAIChat() {
  console.log("=== KIỂM THỬ THỰC TẾ GEMINI 3.6 FLASH + FUNCTION CALLING ===");
  await connectDB();

  const userQuery = "tư vấn laptop giá rẻ nhất";
  console.log(`[User]: "${userQuery}"`);

  const result = await generateChatReply({
    message: userQuery,
    history: [],
    requestId: "test_req_1"
  });

  console.log("\n[AI Reply]:");
  console.log(result.reply);

  console.log(`\n[Gợi ý ${result.products.length} sản phẩm thật từ MongoDB]:`);
  result.products.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.title} - ${p.priceVnd.toLocaleString('vi-VN')}đ (RAM: ${p.specs.ram}, Link: ${p.productUrl})`);
  });

  console.log("\n[Nguồn tra cứu]:", result.sources);

  await mongoose.disconnect();
}

testAIChat().catch(err => {
  console.error(err);
  process.exit(1);
});
