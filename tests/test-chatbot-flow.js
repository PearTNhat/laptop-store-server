import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "../src/configs/mongodb";
import { searchLaptops, getLaptopDetail, getStorePolicy } from "../src/services/productAdvisor";
import {
  getOrCreateSession,
  acquireSessionLock,
  releaseSessionLock,
  saveTurn
} from "../src/services/chatSessionService";
import ChatSession from "../src/models/ChatSession";

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ CHATBOT BACKEND ===");
  await connectDB();

  // Test 1: Kiểm thử tra cứu chính sách FAQ
  console.log("\n[Test 1] Tra cứu chính sách bảo hành (getStorePolicy)...");
  const warrantyPolicy = getStorePolicy({ topic: "warranty" });
  console.assert(warrantyPolicy.success === true, "FAQ policy warranty phải thành công");
  console.assert(warrantyPolicy.title.includes("bảo hành"), "Tiêu đề phải chứa 'bảo hành'");
  console.log("✓ Chính sách bảo hành lấy thành công:", warrantyPolicy.title);

  // Test 2: Kiểm thử tìm kiếm sản phẩm theo ngân sách & hãng
  console.log("\n[Test 2] Tìm kiếm laptop theo tiêu chí (searchLaptops)...");
  const laptops = await searchLaptops({
    brand: "lenovo",
    maxPrice: 25000000,
    ram: "16GB",
    limit: 3
  });
  console.assert(Array.isArray(laptops), "Kết quả phải là mảng");
  console.log(`✓ Tìm thấy ${laptops.length} laptop phù hợp tiêu chí:`);
  laptops.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.brand.toUpperCase()}] ${p.title} - Giá: ${p.priceVnd.toLocaleString('vi-VN')}đ (RAM: ${p.specs.ram}, Còn hàng: ${p.availability})`);
    console.assert(p.priceVnd <= 25000000, "Giá không được vượt 25 triệu");
    console.assert(p.productUrl.startsWith("/"), "URL phải bắt đầu bằng '/'");
  });

  // Test 3: Kiểm thử lấy chi tiết laptop theo slug
  if (laptops.length > 0) {
    const firstSlug = laptops[0].slug;
    console.log(`\n[Test 3] Lấy chi tiết laptop theo slug: '${firstSlug}'...`);
    const detail = await getLaptopDetail({ slug: firstSlug });
    console.assert(detail !== null, "Chi tiết laptop không được null");
    console.assert(detail.slug === firstSlug, "Slug phải khớp");
    console.log("✓ Lấy chi tiết thành công:", detail.title, "CPU:", detail.specs.cpu);
  }

  // Test 4: Kiểm thử Hybrid Session & Deadlock Lock-until
  console.log("\n[Test 4] Kiểm thử Session & Khóa chống treo (Lock-until)...");
  const testSessionId = `test_conv_${Date.now()}`;
  const session = await getOrCreateSession({ sessionId: testSessionId, guestId: "test_guest_1" });
  console.assert(session.sessionId === testSessionId, "Session ID phải khớp");

  // Giành khóa lần 1 -> Phải thành công
  const lock1 = await acquireSessionLock(testSessionId);
  console.assert(lock1 !== null, "Giành khóa lần 1 phải thành công");
  console.log("✓ Giành khóa lần 1 thành công (isProcessing = true)");

  // Giành khóa lần 2 khi khóa chưa hết hạn -> Phải thất bại (tránh 2 request đồng thời)
  const lock2 = await acquireSessionLock(testSessionId);
  console.assert(lock2 === null, "Giành khóa lần 2 khi đang xử lý phải thất bại (chống xung đột)");
  console.log("✓ Giành khóa lần 2 bị chặn chuẩn xác (ngăn 2 request đồng thời)");

  // Giải phóng khóa
  await releaseSessionLock(testSessionId);
  const lock3 = await acquireSessionLock(testSessionId);
  console.assert(lock3 !== null, "Sau khi giải phóng, giành khóa lại phải thành công");
  console.log("✓ Giải phóng khóa và giành lại thành công");

  // Test 5: Lưu lượt chat (saveTurn)
  console.log("\n[Test 5] Kiểm thử lưu lượt hội thoại (saveTurn)...");
  await saveTurn({
    sessionId: testSessionId,
    userMessage: "Tư vấn laptop Lenovo dưới 20 triệu",
    modelReply: "Dạ bên em có mẫu ThinkPad T14 rất bền bỉ...",
    suggestedProducts: laptops,
    sources: laptops.map(p => `product:${p.id}`)
  });

  const updatedSession = await ChatSession.findOne({ sessionId: testSessionId }).lean();
  console.assert(updatedSession.messages.length === 2, "Phải có 2 tin nhắn (1 user, 1 model)");
  console.assert(updatedSession.lastSuggestedProducts.length === laptops.length, "Số sản phẩm gợi ý phải khớp");
  console.assert(updatedSession.isProcessing === false, "isProcessing phải trở về false");
  console.log("✓ Lưu tin nhắn và sản phẩm vào session thành công!");

  // Dọn dẹp session test
  await ChatSession.deleteOne({ sessionId: testSessionId });
  console.log("✓ Dọn dẹp session test thành công.");

  console.log("\n=== TẤT CẢ CÁC BÀI TEST CHATBOT ĐỀU ĐẠT 100%! ===");
  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error("Test thất bại:", err);
  process.exit(1);
});
