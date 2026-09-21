import { searchLaptops, getLaptopDetail, getStorePolicy } from "./productAdvisor";

/**
 * Định nghĩa Tool Declarations theo chuẩn @google/genai (JSON Schema)
 */
export const toolDeclarations = [
  {
    name: "searchLaptops",
    description:
      "Tìm kiếm và lọc danh sách laptop trong kho của cửa hàng theo ngân sách, thương hiệu, dung lượng RAM và nhu cầu sử dụng.",
    parameters: {
      type: "OBJECT",
      properties: {
        keyword: {
          type: "STRING",
          description: "Từ khóa tìm kiếm (VD: 'ThinkPad', 'Vivobook', 'Nitro', 'TUF', v.v.)"
        },
        brand: {
          type: "STRING",
          description:
            "Hãng sản xuất laptop viết thường (VD: 'asus', 'dell', 'lenovo', 'acer', 'hp', 'msi', 'apple', 'gigabyte')"
        },
        minPrice: {
          type: "NUMBER",
          description: "Giá tối thiểu bằng tiền VND (VD: 15000000)"
        },
        maxPrice: {
          type: "NUMBER",
          description: "Giá tối đa bằng tiền VND (VD: 20000000)"
        },
        ram: {
          type: "STRING",
          description: "Dung lượng RAM mong muốn (VD: '8GB', '16GB', '32GB')"
        },
        need: {
          type: "STRING",
          description:
            "Nhu cầu sử dụng của khách (chọn: 'Văn phòng', 'Gaming', 'Sinh viên', hoặc 'Đồ họa')"
        }
      }
    }
  },
  {
    name: "getLaptopDetail",
    description:
      "Lấy thông tin cấu hình chi tiết, thông số phần cứng và số lượng tồn kho của 1 mẫu laptop cụ thể.",
    parameters: {
      type: "OBJECT",
      properties: {
        slug: {
          type: "STRING",
          description: "Slug định danh duy nhất của sản phẩm (VD: 'laptop-lenovo-thinkpad-t14-gen-2')"
        },
        title: {
          type: "STRING",
          description: "Tên dòng laptop cần xem chi tiết"
        }
      }
    }
  },
  {
    name: "getStorePolicy",
    description:
      "Tra cứu thông tin chính thức đã được kiểm duyệt của cửa hàng về bảo hành, đổi trả, phí giao hàng, thanh toán hoặc thông tin liên hệ.",
    parameters: {
      type: "OBJECT",
      properties: {
        topic: {
          type: "STRING",
          description:
            "Chủ đề chính sách cần tra cứu. Phải là một trong: 'warranty', 'return_policy', 'shipping', 'payment_methods', 'contact'",
          enum: ["warranty", "return_policy", "shipping", "payment_methods", "contact"]
        }
      },
      required: ["topic"]
    }
  }
];

export const geminiToolsConfig = [
  {
    functionDeclarations: toolDeclarations
  }
];

/**
 * Điều phối thực thi các hàm Tool từ Gemini
 */
export async function executeTool(name, args = {}) {
  switch (name) {
    case "searchLaptops":
      return await searchLaptops(args);

    case "getLaptopDetail":
      return await getLaptopDetail(args);

    case "getStorePolicy":
      return getStorePolicy(args);

    default:
      throw new Error(`Tool '${name}' không được đăng ký trong hệ thống.`);
  }
}
