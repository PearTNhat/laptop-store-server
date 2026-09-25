import Product from "~/models/Product";
import storePolicies from "~/data/storePolicies.json";

/**
 * Loại bỏ dấu tiếng Việt để phục vụ tìm kiếm regex mềm dẻo
 */
export function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str.trim();
}

/**
 * Chuẩn hóa giá trị RAM thành định dạng chuẩn (VD: '16GB')
 */
export function normalizeRam(ram) {
  if (!ram) return null;
  const match = String(ram).match(/(\d+)\s*(?:gb)?/i);
  return match ? `${match[1]}GB` : String(ram).toUpperCase().trim();
}

/**
 * Chuẩn hóa số tiền VND từ text hoặc số
 */
export function normalizePrice(val) {
  if (typeof val === "number" && !isNaN(val) && val >= 0) return val;
  if (!val) return null;

  let str = String(val).toLowerCase().replace(/,/g, "").trim();
  const trieuMatch = str.match(/^([\d.]+)\s*(?:triệu|trieu|tr|củ|cu)$/);
  if (trieuMatch) {
    return Math.round(parseFloat(trieuMatch[1]) * 1_000_000);
  }

  const num = parseFloat(str);
  return !isNaN(num) && num >= 0 ? Math.round(num) : null;
}

/**
 * Chuẩn hóa tên thương hiệu (viết thường theo DB)
 */
export function normalizeBrand(brand) {
  if (!brand) return null;
  return brand.trim().toLowerCase();
}

/**
 * Xây dựng DTO sản phẩm an toàn từ Document Mongoose
 */
export function formatProductDTO(doc) {
  if (!doc) return null;

  const inStock = doc.colors && doc.colors.some((c) => c.quantity > 0);
  const effectivePrice =
    doc.discountPrice && doc.discountPrice > 0
      ? doc.discountPrice
      : doc.price && doc.price > 0
      ? doc.price
      : 0;

  const primaryImg =
    doc.primaryImage?.url ||
    (doc.colors && doc.colors[0]?.primaryImage?.url) ||
    "";

  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    brand: doc.brand || "",
    priceVnd: effectivePrice,
    originalPriceVnd: doc.price || 0,
    imageUrl: primaryImg,
    productUrl: `/${doc.slug}`,
    specs: {
      cpu: doc.configs?.cpu?.description || doc.configs?.cpu?.name || "",
      ram: doc.configs?.ram?.value || doc.configs?.ram?.description || "",
      hardDrive: doc.configs?.hardDrive?.value || doc.configs?.hardDrive?.description || "",
      graphicCard: doc.configs?.graphicCard?.description || doc.configs?.graphicCard?.name || "",
      screen: doc.configs?.screen?.description || doc.configs?.screen?.value || "",
      weight: doc.configs?.weight?.description || "",
      need: doc.configs?.need?.description || ""
    },
    inStockColors: (doc.colors || [])
      .filter((c) => c.quantity > 0)
      .map((c) => ({ color: c.color, quantity: c.quantity })),
    availability: inStock ? "Còn hàng" : "Tạm hết hàng",
    checkedAt: new Date().toISOString()
  };
}

/**
 * Tìm kiếm laptop theo tiêu chí
 */
export async function searchLaptops({
  keyword,
  brand,
  excludedBrands = [],
  minPrice,
  maxPrice,
  ram,
  need,
  limit = 3
}) {
  const query = {};

  // 1. Chỉ lấy sản phẩm có ít nhất 1 màu còn hàng
  query.colors = { $elemMatch: { quantity: { $gt: 0 } } };

  // 2. Lọc thương hiệu & Loại trừ thương hiệu (nếu có)
  const cleanBrand = normalizeBrand(brand);
  const cleanExcluded = Array.isArray(excludedBrands)
    ? excludedBrands.map(normalizeBrand).filter(Boolean)
    : [];

  if (cleanBrand) {
    query.brand = cleanBrand;
  } else if (cleanExcluded.length > 0) {
    query.brand = { $nin: cleanExcluded };
  }

  // 3. Lọc RAM
  const cleanRam = normalizeRam(ram);
  if (cleanRam) {
    query["configs.ram.value"] = new RegExp(`^${cleanRam}`, "i");
  }

  // 4. Lọc nhu cầu (Gaming, Văn phòng, Sinh viên, Đồ họa)
  if (need) {
    const needRegex = new RegExp(need.trim(), "i");
    query["configs.need.description"] = needRegex;
  }

  // 5. Lọc khoảng giá chuẩn xác:
  // - Nếu discountPrice > 0: giá bán thực tế là discountPrice
  // - Nếu discountPrice = 0 hoặc null: giá bán thực tế là price gốc
  const numMinPrice = normalizePrice(minPrice);
  const numMaxPrice = normalizePrice(maxPrice);

  if (numMinPrice !== null || numMaxPrice !== null) {
    const priceConditions = [];

    // Nhánh 1: Có discountPrice > 0 (áp dụng giá khuyến mãi)
    const discountCond = { $gt: 0 };
    if (numMinPrice !== null) discountCond.$gte = numMinPrice;
    if (numMaxPrice !== null) discountCond.$lte = numMaxPrice;
    priceConditions.push({ discountPrice: discountCond });

    // Nhánh 2: Không giảm giá (discountPrice = 0 hoặc null) -> lấy theo price gốc
    const originalCond = {};
    if (numMinPrice !== null) originalCond.$gte = numMinPrice;
    if (numMaxPrice !== null) originalCond.$lte = numMaxPrice;
    priceConditions.push({
      $and: [
        {
          $or: [
            { discountPrice: 0 },
            { discountPrice: null },
            { discountPrice: { $exists: false } }
          ]
        },
        { price: originalCond }
      ]
    });

    query.$or = priceConditions;
  }

  // 6. Lọc từ khóa tìm kiếm theo tiêu đề (escape ký tự đặc biệt tránh lỗi regex)
  if (keyword && typeof keyword === "string") {
    const cleanKeyword = keyword.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    if (cleanKeyword.length > 0) {
      query.title = { $regex: cleanKeyword, $options: "i" };
    }
  }

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 3, 1), 5);

  // Dùng Aggregation để tính effectivePrice và sắp xếp chính xác giá rẻ nhất
  const docs = await Product.aggregate([
    { $match: query },
    {
      $addFields: {
        effectivePrice: {
          $cond: [
            {
              $and: [
                { $gt: ["$discountPrice", 0] },
                { $ne: ["$discountPrice", null] }
              ]
            },
            "$discountPrice",
            "$price"
          ]
        }
      }
    },
    { $sort: { effectivePrice: 1, _id: 1 } },
    { $limit: safeLimit }
  ]);

  return docs.map(formatProductDTO);
}

/**
 * Xây dựng đoạn ngữ cảnh dữ liệu có cấu trúc cho Prompt RAG của Gemini
 */
export function buildRagPromptContext({
  products = [],
  policy = null,
  activeFilters = {}
}) {
  let contextText = "";

  if (products && products.length > 0) {
    contextText += `[DANH SÁCH LAPTOP PHÙ HỢP TỪ KHO HÀNG (ĐÃ SẮP XẾP TỪ GIÁ THẤP NHẤT ĐẾN CAO HƠN)]:\n`;
    products.forEach((p, index) => {
      const discountNote =
        p.originalPriceVnd > p.priceVnd
          ? ` (Giá niêm yết cũ: ${p.originalPriceVnd.toLocaleString("vi-VN")}đ - Đang giảm còn ${p.priceVnd.toLocaleString("vi-VN")}đ)`
          : "";
      contextText += `Máy #${index + 1}: ${p.title}
- Giá bán cho khách: ${p.priceVnd.toLocaleString("vi-VN")}đ${discountNote}
- Hãng: ${p.brand ? p.brand.toUpperCase() : "Khác"}
- Cấu hình chi tiết: CPU: ${p.specs?.cpu || "Tiêu chuẩn"} | RAM: ${p.specs?.ram || "Tiêu chuẩn"} | Ổ cứng: ${p.specs?.hardDrive || "SSD"} | Đồ họa: ${p.specs?.graphicCard || "Tích hợp"} | Màn hình: ${p.specs?.screen || "15.6 inch"} | Trọng lượng: ${p.specs?.weight || "Khoảng 1.8kg"}
- Tình trạng hàng: ${p.availability}
- Đường dẫn xem chi tiết: ${p.productUrl}\n\n`;
    });
  } else {
    contextText += `[DỮ LIỆU SẢN PHẨM]: Hiện tại không có mẫu laptop nào trong kho thỏa mãn chính xác tất cả tiêu chí đang tìm.\n\n`;
  }

  if (policy && policy.content) {
    contextText += `[THÔNG TIN CHÍNH SÁCH CHÍNH THỨC CỦA CỬA HÀNG (${policy.title})]:\n${policy.content}\n\n`;
  }

  return contextText;
}

/**
 * Lấy chi tiết thông số 1 laptop theo slug hoặc title
 */
export async function getLaptopDetail({ slug, title }) {
  let doc = null;
  if (slug) {
    doc = await Product.findOne({ slug: slug.trim().toLowerCase() }).lean();
  }
  if (!doc && title) {
    doc = await Product.findOne({ title: { $regex: title.trim(), $options: "i" } }).lean();
  }

  return formatProductDTO(doc);
}

/**
 * Tra cứu chính sách cửa hàng từ storePolicies.json
 */
export function getStorePolicy({ topic }) {
  if (!topic) {
    return {
      success: false,
      message: "Vui lòng chọn chủ đề chính sách cần tra cứu."
    };
  }

  const cleanTopic = topic.trim().toLowerCase();
  const policy = storePolicies.find(
    (p) =>
      p.topic.toLowerCase() === cleanTopic ||
      p.id.toLowerCase().includes(cleanTopic)
  );

  if (!policy) {
    return {
      success: false,
      topic,
      message: "Hiện tại cửa hàng chưa có thông tin chính thức về chủ đề này."
    };
  }

  return {
    success: true,
    topic: policy.topic,
    title: policy.title,
    content: policy.content,
    version: policy.version,
    updatedAt: policy.updatedAt
  };
}
