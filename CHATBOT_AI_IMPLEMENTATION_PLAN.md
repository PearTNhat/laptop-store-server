# KẾ HOẠCH MVP CHATBOT TƯ VẤN BÁN LAPTOP

**Trạng thái:** Bản thiết kế đã hoàn thiện & cập nhật phản biện thực chiến, sẵn sàng phê duyệt triển khai.  
**Ngày cập nhật:** 21/09/2026.  
**Phạm vi đã chốt:** Làm MVP tư vấn bán hàng trước; tra cứu đơn hàng chuyển sang giai đoạn sau.

Tài liệu đã được đối chiếu với mã nguồn Express/Mongoose và React hiện tại. Đã bổ sung 5 cơ chế phòng ngừa rủi ro thực tế: Hybrid Session chống chặn cookie cross-domain (Vercel vs Render), khóa phiên chống treo (Deadlock Lock-until), chuẩn hóa tiếng Việt không dấu, trải nghiệm chờ (Dynamic Typing Indicator), và kiểm thử tương thích Babel/Node với SDK mới.

---

## 1. Mục tiêu và phạm vi

Khách truy cập, kể cả chưa đăng nhập, có thể hỏi bằng tiếng Việt về laptop theo ngân sách, nhu cầu và cấu hình. Chatbot hỏi thêm khi thiếu thông tin quan trọng, tìm sản phẩm trong cửa hàng, giải thích lựa chọn và dẫn tới trang chi tiết.

| Trong MVP | Ngoài MVP |
| --- | --- |
| Tìm laptop theo ngân sách, hãng, RAM, nhu cầu | Tra cứu đơn hàng, khách hàng và thanh toán |
| Xem chi tiết, so sánh tối đa 3 máy từ dữ liệu có sẵn | Tạo/sửa đơn, đặt hàng, thêm giỏ tự động, giữ hàng |
| Hội thoại tiếp nối: “máy thứ hai”, “có máy rẻ hơn?” | Ghi nhớ khách hàng lâu dài, đồng bộ đa thiết bị |
| FAQ/chính sách từ nội dung cửa hàng đã duyệt | Tự tạo chính sách bảo hành, đổi trả hoặc ưu đãi |
| Chatbox, card sản phẩm, trạng thái tải và lỗi | Voice, ảnh, streaming, vector database, fine-tuning |

Công cụ chỉ đọc dữ liệu sản phẩm công khai và FAQ. Không đăng ký tool truy cập `Order`, `User`, `Payment`. Khi được hỏi về đơn hàng, hướng khách tới chức năng đơn hàng hiện có; không yêu cầu khách gửi số điện thoại hoặc mã đơn vào chat MVP.

---

## 2. Những thiếu sót của bản cũ và lý do bổ sung

**P0:** Phải xử lý trước khi mở cho khách dùng. **P1:** Phải hoàn thành để nghiệm thu MVP.

| Mức | Thiếu sót/phát hiện | Lý do và tác động | Điều chỉnh đã thực hiện |
| --- | --- | --- | --- |
| P0 | Gemini 1.5 Flash và SDK cũ | Model cũ ngừng hoạt động; SDK cũ deprecated | Dùng `@google/genai`, model cấu hình qua `GEMINI_MODEL`, spike test tương thích Babel |
| P0 | Cam kết “100% chính xác / Zero Hallucination” | Model vẫn có thể diễn giải sai hoặc thêm thông tin | Bỏ cam kết tuyệt đối; dùng dữ liệu có nguồn, card do backend dựng trực tiếp |
| P0 | Cho AI trả lời chính sách không nguồn | Có thể bịa thời hạn bảo hành, đổi trả, phí ship | FAQ được duyệt, có phiên bản; thiếu nguồn thì nói chưa có thông tin |
| P0 | Tra đơn chỉ nhận phone/orderId | Thiếu kiểm tra chủ đơn; nguy cơ lộ dữ liệu người khác | Loại khỏi MVP; thiết kế xác thực và quyền sở hữu riêng ở giai đoạn sau |
| P0 | Chưa có validation/giới hạn | Input dài, tool lặp hoặc query không hợp lệ gây tốn kém | Kiểm tra request/tool, allowlist, giới hạn 3 vòng gọi, timeout, rate limit |
| P0 | Chưa chốt giá và tồn kho tư vấn | Có giá gốc, giá giảm, DailyDeals và tồn kho theo màu | Dùng `discountPrice` hợp lệ; kiểm tra `colors[].quantity > 0` |
| P1 | Rủi ro chặn cookie Cross-Domain | Vercel và Render khác domain, Safari/Chrome chặn 3rd-party cookie | Áp dụng **Hybrid Session**: HttpOnly cookie kết hợp fallback Header/LocalStorage |
| P1 | Treo khóa phiên (Lock Deadlock) | Server restart khi đang xử lý khiến phiên bị kẹt `409` | Thay boolean bằng `lockUntil: Date` (tự giải phóng khóa sau 30s) |
| P1 | Tiếng Việt không dấu / từ lóng | Khách gõ "duoi 15 cu", MongoDB regex không khớp có dấu | Chuẩn hóa tiếng Việt trong prompt chỉ dẫn và backend regex không dấu |
| P1 | UX chờ đợi khi không có Streaming | Gọi tool mất 4–8s, spinner tĩnh làm khách tưởng đơ web | Bổ sung **Dynamic Typing Indicator** nhảy chữ trạng thái theo thời gian |
| P1 | Link `/product/:slug` sai router | Router React của dự án dùng `/:slug` | Backend sinh đường dẫn chuẩn theo router hiện tại |

---

## 3. Căn cứ từ mã nguồn và việc cần xác minh

| Nguồn | Quan sát | Ý nghĩa cho MVP |
| --- | --- | --- |
| [Product.js](src/models/Product.js) | `brand` dạng String; RAM ở `configs.ram.value`, nhu cầu ở `configs.need.description`; có tồn kho tổng và từng màu | Không giả định hãng là ObjectId; kiểm tra giá trị thực trước khi chuẩn hóa |
| [productController.js](src/controllers/productController.js) | Bộ lọc công khai loại sản phẩm không có màu; nhánh `desc` gọi `getNeedingProduct` | Giữ điều kiện hiển thị công khai; không tái dùng nguyên controller làm tool |
| [utils/api.js](src/utils/api.js) | Gọi `http://127.0.0.1:8000/ai` | Chatbot mới độc lập với phụ thuộc này; thay thế bộ lọc cũ là công việc khác |
| [DetailProduct.jsx](../laptop-store-client/src/pages/public/DetailProduct/DetailProduct.jsx) | Hiển thị `discountPrice` | Giá tư vấn cần nhất quán với trang chi tiết |
| [DailyDeals.js](src/models/DailyDeals.js) | Có giá riêng và `startDate` | Cần xác minh hiệu lực/điều kiện áp dụng trước khi hỗ trợ giá deal |
| [App.jsx](../laptop-store-client/src/App.jsx), [path.js](../laptop-store-client/src/constants/path.js) | Trang sản phẩm dùng `/:slug` | Backend sinh đường dẫn theo router hiện tại |
| [package.json](package.json) | Express/Babel/Mongoose; script test là placeholder | Thêm SDK ở gốc server, kiểm tra Node/Babel và thiết lập test runner |

---

## 4. Kiến trúc đề xuất

Tích hợp trong Express để dùng trực tiếp Mongoose và giảm thành phần triển khai cho chatbot. Chưa cần thêm server Python, vector database hoặc framework agent.

```text
ChatWidget (React - Vercel)
  -> POST /api/chat { message, conversationId? }
  -> [Hybrid Auth: Cookie HttpOnly HOẶC Header X-Conversation-Id]
  -> validation + kiểm tra phiên (lockUntil) + rate limit
  -> chatbotService: system instruction + lịch sử hội thoại + tool declarations
  -> Gemini phân tích -> phát sinh Tool Call: searchLaptops(...)
  -> backend kiểm tra tham số, chuẩn hóa tiếng Việt, thực thi Mongoose Product.find
  -> trả kết quả gọn nhẹ cho Gemini diễn giải
  -> backend kiểm tra đầu ra; tự dựng Card sản phẩm từ dữ liệu nguồn DB
  -> Trả về JSON: { reply, products, sources, conversationId, requestId }
```

Dùng `@google/genai`; tên model lấy từ `GEMINI_MODEL`. Chốt phiên bản SDK bằng lockfile và kiểm tra build Babel/Node trên host. API key chỉ nằm ở backend.

---

## 5. Quy tắc dữ liệu và tư vấn

### 5.1. Giá, tồn kho, thông số
- **Giá MVP:** Dùng `discountPrice` hợp lệ, lớn hơn 0 và không vượt `price`. Bản ghi thiếu/mâu thuẫn giá không được dùng để khẳng định giá; ghi nhận để sửa dữ liệu.
- **Tồn kho:** Chỉ giới thiệu máy có ít nhất một màu với `colors[].quantity > 0`.
- **Thông số:** Chỉ dùng trường có dữ liệu thật từ DB; không tự suy ra FPS, thời lượng pin, khả năng nâng cấp hoặc bảo hành từ tên máy.

### 5.2. Lọc và xếp hạng & Xử lý tiếng Việt
- Chuẩn hóa `20 triệu`/`20tr`/`20 củ` thành số VND; số phải hữu hạn, không âm, `minPrice <= maxPrice`.
- **Tiếng Việt không dấu:** Trong System Instruction, chỉ thị AI luôn trích xuất tham số gọi Tool về dạng tiếng Việt có dấu chuẩn xác hoặc tên model tiếng Anh gốc. Tại backend `productAdvisor.js`, bổ sung regex không phân biệt dấu khi tìm kiếm theo `keyword`.
- Phân biệt bắt buộc (“chỉ Dell”, “tối đa 20 triệu”) với ưu tiên (“ưu tiên Dell”). Không âm thầm bỏ điều kiện bắt buộc.
- Thứ tự đề xuất: lọc điều kiện bắt buộc và máy còn hàng; ưu tiên nhu cầu phù hợp; sau đó giá tăng dần. Trả tối đa 3-5 máy.

### 5.3. FAQ/chính sách
Dùng JSON nhỏ trong MVP (`src/data/storePolicies.json`). Mỗi mục gồm `id`, `topic`, `content`, `version`, `updatedAt`, `sourceUrl`. Nội dung chưa được duyệt phải trả “chưa có thông tin xác nhận”; không lấy kiến thức chung của AI thay chính sách cửa hàng.

---

## 6. Hợp đồng công cụ (Tool Contracts)

| Tool | Đầu vào dự kiến | Đầu ra/giới hạn |
| --- | --- | --- |
| `searchLaptops` | `keyword?`, `brand?`, `minPrice?`, `maxPrice?`, `ram?`, `need?` | Tối đa 5 DTO sản phẩm, điều kiện đã áp dụng; backend kiểm soát filter/sort/limit |
| `getLaptopDetail` | `slug` bắt buộc | Một DTO chi tiết, màu còn hàng và thông số có thật |
| `getStorePolicy` | `topic` thuộc danh sách cho phép | FAQ đã duyệt, mã nguồn/phiên bản hoặc trạng thái thiếu nguồn |

Backend từ chối field lạ, escape từ khóa regex và tự xây query an toàn.

---

## 7. API và phiên hội thoại

### 7.1. Request / Response Contract
**Request:**
```json
{
  "message": "Tôi cần laptop học lập trình dưới 20 triệu, RAM 16 GB",
  "conversationId": "optional-id-from-storage"
}
```

**Response thành công:**
```json
{
  "reply": "Dạ bên em có các mẫu máy sau rất phù hợp với nhu cầu học lập trình của bạn:",
  "products": [
    {
      "id": "64f1...",
      "slug": "laptop-asus-vivobook-15",
      "title": "Asus Vivobook 15",
      "brand": "Asus",
      "priceVnd": 18500000,
      "imageUrl": "https://res.cloudinary.com/...",
      "productUrl": "/laptop-asus-vivobook-15",
      "specs": { "cpu": "Core i5-13500H", "ram": "16GB", "hardDrive": "512GB SSD" },
      "availability": "Còn hàng",
      "checkedAt": "2026-09-21T10:00:00Z"
    }
  ],
  "sources": ["product:64f1..."],
  "conversationId": "server-issued-id",
  "requestId": "req-12345"
}
```

### 7.2. Quản lý phiên Hybrid & Khóa chống treo (Lock Deadlock)
- **Cơ chế Hybrid Session:**
  * Backend cấp cookie `HttpOnly` đồng thời trả `conversationId` trong body JSON.
  * Frontend lưu vào `sessionStorage`. Khi gọi API, gửi kèm qua body hoặc header `X-Conversation-Id`. Backend ưu tiên cookie, nếu không có cookie (do Vercel-Render chặn cross-site) thì dùng ID từ header/body.
- **Khóa phiên chống treo (Lock Deadlock Prevention):**
  * Trong `ChatSession`, lưu `lockUntil: Date`.
  * Khi bắt đầu xử lý request, đặt `lockUntil = new Date(Date.now() + 30000)` (30 giây).
  * Nếu request mới đến trong khi `Date.now() < lockUntil`, trả `409 Conflict`.
  * Nếu server restart hoặc crash giữa chừng, sau 30 giây khóa tự động hết hạn, phiên tự mở lại bình thường, không bao giờ bị kẹt vĩnh viễn.
- **Lưu trữ:** MongoDB collection `ChatSession`, TTL 24 giờ.

---

## 8. Giới hạn vận hành và xử lý lỗi

| Hạng mục | Đề xuất | Lý do |
| --- | --- | --- |
| Tin nhắn | Tối đa 2.000 ký tự; body tối đa 16 KB | Hạn chế input quá lớn |
| Ngữ cảnh model | Tối đa 8.000 token đầu vào, 1.000 token đầu ra | Tránh quá tải token |
| Vòng gọi | Tối đa 3 vòng thực thi tool và 6 tool call/request | Đủ tìm kiếm + chi tiết, tránh loop vô hạn |
| Thời gian | Deadline tổng 30 giây, query DB tối đa 3 giây | Tránh giữ connection quá lâu |
| Rate limit | 10 lượt/phút/khách và 30 lượt/phút/IP | Ngăn ngừa spam |
| Kill Switch | Biến môi trường `CHATBOT_ENABLED=true/false` | Tắt tức thì khi có sự cố |

---

## 9. Frontend Chatbox & Trải nghiệm người dùng (UX)

- **Vị trí:** Gắn `ChatWidget.jsx` vào Layout công khai, hỗ trợ desktop & mobile.
- **Dynamic Typing Indicator (Trải nghiệm chờ khi không dùng streaming):**
  * Vì lượt gọi Function Calling mất 4–8 giây, thay vì chỉ hiện spinner vô hồn, UI hiển thị thông điệp tiến trình:
    * 0s – 2s: *"Đang lắng nghe câu hỏi..."*
    * 2s – 4s: *"Đang kiểm tra kho hàng và cấu hình..."*
    * 4s+: *"Đang tổng hợp các dòng máy phù hợp nhất..."*
- **Card sản phẩm:** Render card từ mảng `products` của response. Click vào card điều hướng trực tiếp đến `/:slug`.
- **Phục hồi phiên:** Khởi tạo từ `sessionStorage`, reset khi bấm nút "Cuộc trò chuyện mới".

---

## 10. Danh mục File triển khai

```text
laptop-store-server/
├── src/
│   ├── configs/chatbot.js               # Model, giới hạn, feature flag
│   ├── data/storePolicies.json          # FAQ chính sách được duyệt
│   ├── models/ChatSession.js            # Model lưu phiên, TTL & lockUntil
│   ├── services/chatbotService.js       # Tích hợp @google/genai, vòng gọi tool
│   ├── services/chatbotTools.js         # Khai báo schema & mapping tool
│   ├── services/productAdvisor.js      # Query DB, chuẩn hóa tiếng Việt, xếp hạng DTO
│   ├── services/chatSessionService.js   # Quản lý Hybrid session, lockUntil
│   ├── validators/chatValidator.js      # Validate request input
│   ├── middleware/chatRateLimit.js      # Middleware giới hạn tần suất
│   ├── controllers/chatController.js    # Controller API /api/chat
│   ├── routes/chatRoute.js              # Route định nghĩa POST /
│   └── routes/index.js                  # Đăng ký /api/chat
├── tests/
│   └── test-gemini-connection.js        # Script kiểm thử tương thích Babel & SDK
└── .env                                 # Thêm GEMINI_API_KEY, GEMINI_MODEL, CHATBOT_ENABLED

laptop-store-client/src/
├── apis/chat.js                         # Axios client gọi /api/chat (kèm header fallback)
├── components/Chatbot/
│   ├── ChatWidget.jsx                   # Widget chat nổi góc màn hình
│   ├── ChatMessage.jsx                  # Bong bóng tin nhắn + Typing indicator động
│   └── ChatProductCard.jsx              # Card sản phẩm hiển thị thông số, giá, link
└── [Public Layout]                      # Nhúng ChatWidget
```

---

## 11. Lộ trình thực hiện chi tiết

1. **Bước 1: Cài đặt SDK & Spike Test tương thích Babel**
   * Cài đặt `@google/genai`.
   * Viết script test nhỏ `tests/test-gemini-connection.js` xác nhận kết nối và biên dịch Babel trơn tru.
2. **Bước 2: Chuẩn bị Dữ liệu & FAQ Policy**
   * Tạo file `src/data/storePolicies.json`.
   * Khảo sát mẫu dữ liệu sản phẩm trong DB (RAM, brand, need, price).
3. **Bước 3: Xây dựng Service Core & Tools**
   * Xây dựng `productAdvisor.js` (query Mongo, normalize tiếng Việt).
   * Xây dựng `chatbotTools.js` (Tool definitions).
   * Xây dựng `ChatSession.js` và `chatSessionService.js` (Hybrid ID + lockUntil).
   * Xây dựng `chatbotService.js` (vòng lặp gọi Tool của Gemini).
4. **Bước 4: Xây dựng Endpoint API & Middleware**
   * `chatValidator.js`, `chatRateLimit.js`, `chatController.js`, `chatRoute.js`.
   * Đăng ký vào `routes/index.js`.
5. **Bước 5: Xây dựng Frontend Chatbox Widget**
   * Tạo components `ChatWidget`, `ChatMessage`, `ChatProductCard` trong `laptop-store-client`.
   * Tích hợp Typing Indicator động và quản lý `conversationId` trong `sessionStorage`.
6. **Bước 6: Kiểm thử tổng thể & Nghiệm thu**
   * Chạy bộ 30 kịch bản hội thoại tiếng Việt mẫu.
   * Đo đạc độ trễ và nghiệm thu.
