import storePolicies from "~/data/storePolicies.json";

// Bộ nhớ cache in-memory
const searchCache = new Map();
const inFlightMap = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 giây

/**
 * Sinh cache key an toàn từ các tiêu chí tìm kiếm
 */
export function buildSearchCacheKey(filters = {}) {
  const parts = [
    filters.brand || "",
    filters.minPrice || "",
    filters.maxPrice || "",
    filters.ram || "",
    filters.need || "",
    filters.isCheapest ? "cheap" : "",
    (filters.excludedBrands || []).sort().join(","),
    filters.keyword || ""
  ];
  return `search:${parts.join("|")}`;
}

/**
 * Lấy dữ liệu từ cache hoặc thực thi hàm tìm kiếm với cơ chế Single-Flight
 * Giúp tránh lặp lại cùng 1 query lên MongoDB khi nhiều người hỏi đồng thời
 */
export async function getCachedSearchResults(cacheKey, fetchFn, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();

  // 1. Kiểm tra cache có sẵn và còn hạn không
  if (searchCache.has(cacheKey)) {
    const entry = searchCache.get(cacheKey);
    if (now < entry.expiresAt) {
      return entry.data;
    }
    searchCache.delete(cacheKey);
  }

  // 2. Kiểm tra nếu có request khác đang thực hiện cùng 1 query (Single-Flight)
  if (inFlightMap.has(cacheKey)) {
    return await inFlightMap.get(cacheKey);
  }

  // 3. Khởi tạo promise thực thi và chia sẻ cho các request đến sau
  const promise = (async () => {
    try {
      const data = await fetchFn();
      searchCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + ttlMs
      });
      return data;
    } finally {
      inFlightMap.delete(cacheKey);
    }
  })();

  inFlightMap.set(cacheKey, promise);
  return await promise;
}

/**
 * Lấy nhanh thông tin chính sách từ bộ nhớ (không cần query lại file)
 */
export function getCachedPolicy(topic) {
  if (!topic) return null;
  const cleanTopic = topic.trim().toLowerCase();
  return storePolicies.find(
    (p) =>
      p.topic.toLowerCase() === cleanTopic ||
      p.id.toLowerCase().includes(cleanTopic)
  ) || null;
}

/**
 * Xóa cache tìm kiếm khi sản phẩm thay đổi (gọi khi Admin cập nhật sản phẩm)
 */
export function clearSearchCache() {
  searchCache.clear();
}
