import Comment from "~/models/Comment";
import Product from "~/models/Product";
// khi update can old rating
export const handleUpdateTotalProductRating = async ({productId, type, rating }) => {
  const [countRating, productRes] = await Promise.all([
    Comment.find({
      product: productId,
      rating: { $exists: true },
    }).countDocuments(),
    Product.findById(productId),
  ]);

  // countRating để láy số lượng đánh giá
  // productRes để lấy tổng số sao hiện tại
  let length;
  if (type === "CREATE") {
    length = countRating + 1;
  } else if (type === "UPDATE") {
    length = countRating;
  } else if (type === "DELETE") {
    length = countRating - 1;
  }
  if(length === 0){
    productRes.totalRating = 0;
    await productRes.save();
    return;
  }
  // lấy tổng số sao  *  trung bình sao + số sao mới / tổng số sao + 1
  const totalRating =
    (countRating * productRes.totalRating + Number(rating))/ length;
  productRes.totalRating = totalRating;
  await productRes.save();
};
export const generateOTP = ()=>{
  // 100000 - 999999
  return Math.floor(100000 + Math.random() * 900000);
}
export const extractPublicId = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  return publicId;
};
export const  getPublicId = (url) => {
  const parts = url.split('/');
  const fileName = parts.pop(); // Lấy phần cuối cùng (file name)
  const folderPath = parts.slice(7).join('/'); // Bỏ domain và thư mục mặc định của Cloudinary
  return `${folderPath}/${fileName.split('.')[0]}`; // Bỏ phần mở rộng file
}