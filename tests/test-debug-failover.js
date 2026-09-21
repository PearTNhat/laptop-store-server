import "dotenv/config";
import { connectDB } from "../src/configs/mongodb";
import { generateChatReply } from "../src/services/chatbotService";

async function debug() {
  await connectDB();
  console.log("=== Testing generateChatReply failover ===");
  try {
    const res = await generateChatReply({
      message: "Laptop Gaming cấu hình cao",
      history: [],
      requestId: "debug_1"
    });
    console.log("SUCCESS Reply:", res.reply?.slice(0, 100));
    console.log("Products count:", res.products?.length);
  } catch (err) {
    console.error("DEBUG CAUGHT:", err);
  }
  process.exit(0);
}

debug().catch(console.error);
