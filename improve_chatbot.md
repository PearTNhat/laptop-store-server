# Kế hoạch cải thiện tốc độ và chất lượng tư vấn chatbot

> Trạng thái: đề xuất triển khai, chưa phải kết quả đo hoặc tính năng đã hoàn thành.
> Phạm vi cập nhật tài liệu: bổ sung kiến trúc, lý do, thứ tự triển khai và tiêu chí nghiệm thu dựa trên code hiện tại.

## 1. Mục tiêu và điều chỉnh so với kế hoạch ban đầu

Ưu tiên **pre-search + một lần gọi Gemini cho câu hỏi rõ ràng**, đồng thời giữ đường xử lý bổ sung cho câu khó. Backend lấy dữ liệu sản phẩm/chính sách trước; Gemini diễn đạt dựa trên dữ liệu đó.

- Tăng tốc: giảm lượt gọi model nối tiếp trên luồng tìm máy thông thường.
- Hiểu đúng: xử lý phủ định, nhiều tiêu chí, câu hỏi tiếp nối và so sánh sản phẩm.
- Tư vấn có căn cứ: đúng giá bán, tồn kho, thông số và chính sách; nói rõ khi dữ liệu thiếu.
- Giữ hợp đồng API hiện tại: `reply`, `products`, `sources`, cùng thông tin phiên do controller trả về.

Các con số 48 giây, 18–22 giây hoặc 3–5 giây trong bản cũ chỉ là số liệu cần xác minh/mục tiêu tham khảo. Không suy ra tốc độ từ tên model hoặc số lần gọi. Đo trên cùng bộ câu hỏi, dữ liệu và môi trường trước/sau thay đổi.

Chuyển từ đúng hai lần gọi thành một lần có thể giảm 50% số request ở lượt đó; không đồng nghĩa giảm 50% token, chi phí hoặc mọi lượt chat. Retry và đường xử lý câu khó có thể tăng số request. Quota được tính theo project, không theo từng API key; nhiều key cùng project không tạo thêm quota. Tham khảo [tài liệu rate limits của Google](https://ai.google.dev/gemini-api/docs/rate-limits).

Bỏ tool calling trên luồng nhanh giúp bỏ vòng lặp tool ở luồng đó; vẫn có thể gặp timeout model, lỗi DB, dữ liệu cũ hoặc trả lời sai. Không cam kết “loại bỏ hoàn toàn” các lỗi này.

## 2. Kiến trúc xử lý đề xuất và lý do

| Loại câu hỏi | Cách xử lý | Lý do |
| --- | --- | --- |
| Chào hỏi, hotline, chính sách đơn giản xác định rõ | Trả lời mẫu từ nội dung cửa hàng đã xác thực; có thể không gọi AI | Những câu có đáp án cố định không cần chờ model |
| Tìm máy có tiêu chí rõ | Phân tích nhanh → truy vấn/xếp hạng → Gemini diễn đạt một lần | Giảm lượt gọi mà vẫn có dữ liệu thật |
| Hỏi tiếp hoặc so sánh máy đã hiển thị | Giải quyết tham chiếu từ phiên → đọc lại sản phẩm → Gemini diễn đạt | Giữ đúng máy và cập nhật giá/tồn kho |
| Câu phức tạp nhưng đủ thông tin | Chuyển vào luồng tool calling giới hạn, giữ công cụ hiện có | Tránh để regex quyết định sai các yêu cầu ngoài khả năng |
| Câu thiếu thông tin hoặc có nhiều cách hiểu | Hỏi lại ngắn gọn đúng phần chưa rõ | Không tự gán ngân sách, hãng hoặc máy người dùng muốn hỏi |
| Model lỗi/hết thời gian nhưng đã lấy được dữ liệu | Trả mẫu ngắn kèm sản phẩm/chính sách đã truy xuất | Người dùng vẫn nhận được kết quả hữu ích |

Router quyết định luồng trước khi gọi model. Không thử một lượt sinh câu trả lời rồi mới mặc định chạy lại toàn bộ đường tool. Đường khó được phép nhiều hơn một lần gọi, nhưng phải nằm trong thời gian và số lần thử chung.

Giữ thứ tự model do môi trường cấu hình. Kiểm tra model thực sự dùng được bằng môi trường triển khai; ghi lại độ trễ và lỗi theo model trước khi đề xuất đổi ưu tiên.

## 3. Các thay đổi cần triển khai

### 3.1. Bộ phân tích nhanh có giới hạn rõ ràng

Tạo `src/services/fastIntentParser.js`, trả về dữ liệu có cấu trúc gồm `intents`, `filterPatch`, `excludedBrands`, `references`, `unresolved` và quyết định `route`.

- Chuẩn hóa tiếng Việt có/không dấu, khoảng trắng, viết tắt.
- Ngân sách: `15 củ`, `15tr`, `15 triệu`, `15 chai`, `15m`, `15,5 triệu`, `15.000.000đ`, `từ 15 đến 20tr`.
- Phân biệt cận nghiêm ngặt “dưới/trên” và cận bao gồm “tối đa/ít nhất”. Với “tầm 15 triệu”, định nghĩa rõ khoảng dung sai hoặc hỏi lại nếu ảnh hưởng kết quả; không tự nới ngân sách đã xác định là tối đa.
- Nhận diện phủ định: “không Dell”, “trừ HP”, “không chơi game”. Phủ định nhu cầu không được biến thành nhu cầu dương.
- Gắn dung lượng với thành phần: “SSD 512GB, RAM 16GB” không được hiểu RAM 512GB. Nếu chỉ có “16GB” và ngữ cảnh không rõ thì đánh dấu chưa xác định.
- Hỗ trợ nhiều ý định: “Asus dưới 20 triệu, bảo hành bao lâu?” cần cả sản phẩm và chính sách.
- Bắt tham chiếu: “máy số 1”, “hai máy trên”, “con Lenovo vừa rồi”.
- Có quy tắc phát hiện mơ hồ/mâu thuẫn để chuyển luồng; không tự coi mọi kết quả regex là đáng tin cậy.

**Lý do:** parser giúp giảm thời gian, nhưng khả năng hiểu ngôn ngữ phải được kiểm chứng bằng tình huống thực tế. Mốc “< 1ms” chỉ được công bố sau khi đo.

### 3.2. Lưu và dùng ngữ cảnh qua nhiều lượt

Sửa `chatController.js`, `chatbotService.js`, `chatSessionService.js` và `ChatSession.js` khi cần:

- Controller truyền `activeFilters`, `lastSuggestedProducts` và lịch sử phù hợp vào service.
- Gộp `filterPatch` vào bộ lọc hiện tại: tiêu chí mới thay tiêu chí cũ, trường không được nhắc lại vẫn giữ khi đang tiếp tục cùng nhu cầu.
- Phân biệt “không nhắc hãng” với “hãng nào cũng được”: trường hợp sau phải xóa bộ lọc hãng. Lưu được hãng bị loại trừ và kiểu cận giá nếu hỗ trợ.
- “Văn phòng dưới 15 triệu” → “có Asus không?” phải giữ nhu cầu và ngân sách; “tăng lên 20 triệu” chỉ đổi ngân sách.
- Khi chuyển nhu cầu rõ ràng hoặc người dùng yêu cầu tìm lại từ đầu, cập nhật/xóa tiêu chí cũ phù hợp. Câu hỏi chính sách xen giữa không tự xóa nhu cầu tìm máy.
- Lưu bộ lọc sau khi xử lý thành công; không ghi đè ngữ cảnh bằng kết quả phân tích mơ hồ hoặc lỗi model.
- Tham chiếu số thứ tự dựa trên đúng danh sách card đã hiển thị; hỏi lại nếu không xác định được danh sách/máy.
- Tra cứu lại bằng ID/slug khi hỏi tiếp để lấy giá, tồn kho và DTO đầy đủ; không dùng snapshot phiên làm nguồn dữ liệu hiện hành.

**Lý do:** schema đã có `activeFilters` nhưng luồng hiện tại chưa cập nhật; controller chưa truyền `lastSuggestedProducts` vào hàm sinh trả lời. Chỉ thêm parser sẽ không làm chatbot nhớ nhu cầu tốt hơn.

### 3.3. Sửa truy vấn và xếp hạng sản phẩm

Cập nhật `src/services/productAdvisor.js`:

- Tính `effectivePrice`: dùng `discountPrice` nếu lớn hơn 0, ngược lại dùng `price`. Lọc ngân sách và sắp xếp trên cùng giá này **trước khi limit**.
- Sửa nhánh lọc giá giảm: chỉ áp dụng khi `discountPrice > 0`. Code hiện có thể nhận máy giá giảm bằng 0 vào truy vấn chỉ có `maxPrice` dù giá gốc vượt ngân sách.
- Sửa thứ tự hiện tại `.sort({ discountPrice: 1, price: 1 })`: máy không giảm giá có giá trị 0 không được mặc nhiên đứng trước máy rẻ hơn.
- Giữ ràng buộc bắt buộc: còn hàng, ngân sách tối đa, hãng bị loại, cấu hình được yêu cầu rõ. Xếp hạng theo nhu cầu trong tập thỏa các ràng buộc đó.
- Dùng thông số thực để đánh giá mức phù hợp khi có dữ liệu. Không coi nhãn “Văn phòng” là bằng chứng máy pin lâu hoặc nhẹ.
- “Rẻ nhất” chọn theo giá thực trong phạm vi đang hỏi; chỉ nói “rẻ nhất cửa hàng” khi đã truy vấn đúng toàn bộ phạm vi tương ứng.
- Không đủ ba máy thì trả đúng số tìm được. Không có kết quả thì nêu điều kiện đang lọc và đề nghị điều chỉnh; không tự vượt ngân sách.
- Escape chuỗi tìm kiếm trước khi tạo regex, kiểm tra kiểu/giới hạn tham số và đặt timeout DB.
- Đánh giá truy vấn bằng dữ liệu đại diện và `explain` trước khi thêm index; không mặc định trường giá tính toán sẽ được index hỗ trợ.

Hàm tích hợp có thể nhận `{ message, history, activeFilters, lastSuggestedProducts }` và trả `{ products, policies, promptContext, nextFilters, route }`.

**Lý do:** model diễn đạt tốt vẫn tư vấn sai nếu backend đưa nhầm giá, máy hoặc thứ tự. Đây là phần nên sửa trước khi đánh giá chất lượng AI.

### 3.4. Cache và gộp yêu cầu trùng nhau

Tạo `src/services/chatCacheService.js` với interface độc lập để giai đoạn đầu dùng bộ nhớ tiến trình; khi chạy nhiều instance hoặc cần giữ cache qua lần restart, thay implementation bằng Redis mà không đổi luồng chatbot.

| Dữ liệu cache | Cache key | TTL ban đầu | Cách hết hiệu lực | Lý do |
| --- | --- | --- | --- | --- |
| Chính sách, hotline, địa chỉ | `policy:{version}:{topic}` | Nạp sẵn; không hết hạn theo thời gian | Xóa/đổi `version` khi sửa `storePolicies.json` | Trả được các câu cố định ngay, không cần DB hoặc Gemini |
| Kết quả tìm sản phẩm | `products:{catalogVersion}:{normalizedFilters}` | 30–60 giây | Xóa cache liên quan khi sản phẩm, giá, màu hoặc tồn kho thay đổi; TTL chỉ là lớp dự phòng | Bỏ truy vấn MongoDB lặp lại nhưng không giữ giá/tồn kho cũ quá lâu |
| Câu trả lời phổ biến đã duyệt | `reply:{knowledgeVersion}:{normalizedIntent}` | Theo phiên bản nội dung | Đổi phiên bản khi sửa câu trả lời/chính sách | Bỏ hẳn thời gian chờ AI ở câu chào hỏi, liên hệ và chính sách đơn giản |
| Kết quả phân tích bằng AI, nếu có | `intent:{normalizedMessage}` | Rất ngắn, ví dụ 5 phút | TTL | Không ưu tiên ở giai đoạn đầu vì parser regex đã rất nhanh |

- `normalizedFilters` phải gồm mọi yếu tố làm thay đổi kết quả: hãng được chọn/bị loại, ngân sách và kiểu cận giá, RAM, SSD/cấu hình, nhu cầu, sắp xếp, giới hạn và catalog version. Không dùng nguyên văn câu hỏi làm key tìm sản phẩm.
- Cache câu trả lời chỉ dùng cho câu không phụ thuộc người dùng, phiên, sản phẩm cụ thể, giá hoặc tồn kho. Câu “máy số 1”, “có Asus không?” và các câu theo ngữ cảnh phiên không được dùng cache chung.
- Không lưu cache cho lỗi DB/AI, timeout, phản hồi rỗng, hay dữ liệu không qua kiểm tra nguồn.
- Khi nhiều request có cùng key đến trong lúc cache trống, dùng **single-flight**: request đầu tạo `inFlight` promise; request sau cùng chờ promise đó. Xóa `inFlight` trong `finally`, kể cả khi lỗi. Cơ chế này ngăn nhiều người đồng thời tạo các truy vấn/call Gemini giống nhau.
- Cache kết quả tìm kiếm lưu DTO đã được backend xác thực, không lưu Mongo document hoặc câu trả lời model tự do. Khi đọc cache vẫn kiểm tra dữ liệu có còn hợp lệ theo `catalogVersion`.
- Khi ghi sản phẩm qua các luồng admin/import/order làm thay đổi tồn kho, tăng `catalogVersion` hoặc phát event invalidation. Nếu không xác định được tập key bị ảnh hưởng, tăng version toàn catalog để cache cũ tự vô hiệu thay vì cố xóa thiếu.
- Đặt giới hạn số entry và kích thước, dùng LRU để tránh cache làm tăng bộ nhớ. Thống kê `hit`, `miss`, `inFlightJoin`, `eviction`, độ tuổi dữ liệu và tỷ lệ cache trả về lỗi.
- Không đưa API key, cookie, guest ID, dữ liệu cá nhân hoặc toàn bộ lịch sử chat vào cache key/log.

**Lý do:** cache truy vấn giảm thời gian MongoDB; cache câu trả lời mới giảm thời gian Gemini, là phần thường chậm nhất. Invalidation theo thay đổi giá/tồn kho giữ card và lời tư vấn không bị lỗi thời. Single-flight giảm tải ngay cả khi cache chưa kịp được tạo.

### 3.5. Câu trả lời và card phải dùng cùng dữ liệu

- Thay quy tắc “bắt buộc gọi tool” bằng prompt riêng cho từng luồng. Luồng pre-search không còn tools; luồng dự phòng vẫn có công cụ.
- Giữ chỉ dẫn hệ thống cố định; đóng gói sản phẩm/chính sách thành dữ liệu có cấu trúc, đánh dấu là dữ liệu tham khảo, không phải chỉ dẫn phải làm theo.
- Chỉ gửi trường phục vụ câu hỏi và lượng lịch sử cần thiết; đặt giới hạn độ dài context/đầu ra phù hợp sau khi đo.
- Dùng cùng danh sách sản phẩm và thứ tự cho context và card. ID sản phẩm/nguồn do backend xác thực, không dùng ID model tự tạo.
- Giá, cấu hình, tình trạng hàng và chính sách phải truy được về dữ liệu đã lấy. Không tự khẳng định thời lượng pin, FPS, khả năng nâng cấp hoặc ưu đãi khi nguồn không có.
- Với câu “máy số 1 nâng cấp RAM được không?”, nếu thiếu thông tin khe RAM/giới hạn RAM thì nói chưa có thông tin xác nhận và hướng dẫn hỏi cửa hàng.
- Nếu model trả rỗng, sai cấu trúc hoặc tham chiếu sản phẩm ngoài tập dữ liệu, dùng mẫu dự phòng thay vì phát sinh vòng gọi lại không giới hạn.
- `sources` phải phản ánh dữ liệu thực sự dùng; test đối chiếu nội dung tư vấn với card, không chỉ kiểm tra ID hợp lệ.

**Lý do:** đưa dữ liệu vào prompt hỗ trợ độ chính xác nhưng không bảo đảm model không bịa. Cần quy tắc thiếu dữ liệu và kiểm tra ở backend.

### 3.6. Giới hạn thời gian tổng và xử lý lỗi

Cập nhật `chatbotService.js` và `configs/chatbot.js`:

- Áp dụng một deadline cho toàn lượt, tính từ controller; DB, các lần gọi AI và retry đều dùng thời gian còn lại. Dành thời gian cho lưu phiên/trả kết quả.
- Đặt giới hạn tổng số lần thử model/key, số vòng tool và số tool call; không duyệt toàn bộ model × key khi không còn thời gian.
- Code hiện dùng `Promise.race` để timeout: bổ sung hủy request nếu SDK hỗ trợ và dọn timer trong `finally`. Nếu không hủy được, bỏ qua kết quả muộn và không cho sửa phiên.
- Chỉ retry lỗi tạm thời trong ngân sách thời gian; tôn trọng thời gian chờ của nhà cung cấp nếu có. Không lặp lại vô ích lỗi request, quyền truy cập hoặc model không hợp lệ.
- Luồng tool dự phòng cũng dùng deadline và giới hạn chung.
- Khi AI lỗi nhưng truy vấn thành công, trả dữ liệu thật bằng mẫu ngắn. Khi DB lỗi, nói không lấy được dữ liệu; không diễn đạt thành “không có máy phù hợp”.
- Trả thông báo dễ hiểu, không đưa stack trace hoặc lỗi SDK thô vào câu trả lời.
- Bảo đảm khóa phiên chỉ được chủ sở hữu giải phóng; thời hạn khóa phù hợp deadline. Khi khóa hết hạn, request cũ không được ghi đè lượt mới hoặc mở khóa của lượt mới.

**Lý do:** hiện mỗi lần thử có thể chờ 28 giây rồi tiếp tục model/key khác, trong khi `requestDeadlineMs` chưa được thực thi trong service. Giảm từ hai lượt xuống một lượt vẫn có thể chậm nếu failover không bị giới hạn.

### 3.7. Streaming là bước tùy chọn sau khi luồng cơ bản ổn định

Có thể bổ sung SSE/streaming vào backend và `ChatWidget` để người dùng thấy câu trả lời sớm; card gửi sau khi truy vấn hoàn tất theo hợp đồng sự kiện rõ ràng. Cần xử lý ngắt kết nối, kết thúc stream, lưu phiên một lần và nội dung đang dang dở.

**Lý do:** streaming cải thiện thời gian thấy nội dung đầu tiên, không bảo đảm giảm thời gian hoàn thành. Bước này cần thay đổi frontend; không nằm trong cam kết “giữ nguyên giao diện/API” của giai đoạn đầu. Nội dung phát ra cũng không thể thu hồi bằng kiểm tra cuối cùng, nên cần thiết kế kiểm tra riêng trước khi bật.

## 4. Thứ tự thực hiện

1. **Đo hiện trạng và sửa nền tảng:** lỗi lọc/sắp xếp giá, deadline, giới hạn retry, khóa phiên, log đo lường.
2. **Luồng nhanh, cache và trí nhớ:** parser, cập nhật bộ lọc phiên, pre-search, cache chính sách/kết quả, single-flight và câu trả lời mẫu, giữ DTO card hiện tại.
3. **Câu khó và độ chính xác:** router, tool dự phòng có giới hạn, xử lý thiếu dữ liệu, kiểm tra nguồn/card.
4. **Đánh giá trước/sau:** chỉ bật mặc định khi đạt bộ kiểm thử chất lượng và cải thiện độ trễ.
5. **Tối ưu trải nghiệm tùy chọn:** Redis khi cần chia sẻ cache giữa các instance, streaming, điều chỉnh model theo số đo và cấu hình người dùng.

Đặt cờ cấu hình để chuyển giữa luồng cũ và mới. Triển khai từng bước giúp xác định thay đổi nào tăng tốc hoặc làm giảm chất lượng và có thể quay lại khi cần.

## 5. Kiểm thử và tiêu chí nghiệm thu

### Kiểm thử hành vi tự động

Dùng dữ liệu fixture ổn định thay vì cố định tên ba sản phẩm trong DB thật. Mock model cho kiểm thử luồng; đánh giá model thật bằng bộ câu hỏi riêng.

| Tình huống | Kết quả cần kiểm tra |
| --- | --- |
| “Văn phòng tầm 15 củ”, “15,5 triệu”, “từ 15 đến 20tr” | Chuẩn hóa số tiền đúng và áp dụng đúng quy tắc khoảng giá |
| “Không Dell, RAM 16GB, SSD 512GB” | Loại Dell; không nhầm SSD thành RAM |
| “Học thiết kế nhưng không chơi game” | Không suy ra nhu cầu gaming chỉ vì bắt gặp từ khóa |
| “Dưới 15 triệu” → “có Asus không?” → “tăng lên 20 triệu” | Kế thừa và cập nhật đúng từng tiêu chí |
| “Hãng nào cũng được”, “tìm lại từ đầu” | Xóa đúng bộ lọc được yêu cầu |
| “Máy số 1”, “so sánh hai máy trên” | Đúng sản phẩm/thứ tự; hỏi lại khi tham chiếu mơ hồ |
| “Asus dưới 20 triệu bảo hành bao lâu?” | Cung cấp đủ thông tin sản phẩm và chính sách |
| Máy A giá gốc 25 triệu, giảm giá 0; máy B giảm còn 12 triệu | Truy vấn tối đa 15 triệu loại A; sắp xếp rẻ nhất đúng giá thực |
| Không đủ máy, hết hàng, giá thay đổi giữa hai lượt | Không bịa đủ ba máy; đọc lại dữ liệu hiện tại |
| Hỏi nâng cấp RAM nhưng nguồn thiếu thông tin | Không tự khẳng định nâng cấp được |
| Model timeout/429/503, DB lỗi, phản hồi rỗng | Dừng trong ngân sách, đúng mẫu dự phòng, không nhầm lỗi DB với không có hàng |
| Request cũ chạy quá hạn, request mới có khóa | Không ghi đè lượt mới hoặc giải phóng nhầm khóa |
| Hai request cùng bộ lọc khi cache trống | Chỉ một truy vấn/call được tạo; request còn lại nhận cùng kết quả hoặc cùng lỗi có kiểm soát |
| Giá hoặc tồn kho thay đổi sau cache hit | Catalog version/invalidation khiến lượt tiếp theo lấy dữ liệu mới |
| Câu hotline/chính sách có cache hit | Không gọi Gemini; nội dung khớp phiên bản chính sách hiện hành |
| Cache đạt giới hạn bộ nhớ | LRU loại entry cũ; chatbot vẫn hoạt động đúng khi cache miss |

### Đo hiệu năng và chất lượng

- Chạy cùng bộ ít nhất 50 câu đại diện trước/sau, gồm hội thoại nhiều lượt; lặp lại để giảm ảnh hưởng dao động mạng/model.
- Ghi riêng: thời gian DB, thời gian mỗi lần gọi AI, tổng thời gian, route, model dùng, số lần thử, số tool call và token nếu có. Không log API key; hạn chế log nguyên văn hội thoại.
- Báo cáo p50, p95 và tỷ lệ timeout/lỗi theo nhóm câu hỏi. Nếu có streaming, đo thêm thời gian đến nội dung đầu tiên.
- Ghi thêm cache hit rate và thời gian theo từng lớp cache; tách số liệu cache hit khỏi cache miss để không ngộ nhận cải thiện của Gemini. Đánh giá cả trường hợp cache lạnh sau restart và cache nóng.
- Mục tiêu đề xuất: p50 của nhóm tìm máy rõ ràng giảm ít nhất 30% so với baseline trong cùng điều kiện; p95 không tăng. Đây là ngưỡng nghiệm thu cần đo, không phải cam kết đã đạt.
- Luồng pre-search thành công không retry dùng tối đa một lần gọi sinh nội dung; đường khó thống kê riêng. Có giới hạn tổng request và deadline được kiểm chứng bằng test lỗi.
- Tất cả tình huống hồi quy bắt buộc ở bảng trên phải đạt. Trên bộ đánh giá model thật, kiểm tra đúng ràng buộc, đúng máy/giá/thông số, nhớ ngữ cảnh và không bịa dữ liệu thiếu; không chấp nhận giảm chất lượng để đạt mục tiêu tốc độ.
- Kiểm tra giao diện: card đúng thứ tự, ảnh/giá/link đầy đủ, mở chi tiết đúng máy; lịch sử chat và câu hỏi tiếp nối hoạt động.

Chạy kiểm tra cú pháp/build theo scripts hiện có của dự án sau khi triển khai code. Kiểm tra cú pháp không thay thế kiểm thử hành vi hoặc số đo thực tế.
