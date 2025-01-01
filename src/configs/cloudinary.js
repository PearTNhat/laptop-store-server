const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
import "dotenv/config";;


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});
const PRODUCT_FOLDER = "DigitalStore/Products";
const USER_FOLDER = "DigitalStore/Users";
const BLOG_FOLDER = "DigitalStore/Blogs";
const typeImg = ["jpg", "png", "jpeg"];
const storage = multer.memoryStorage(); // Use memory storage for simplicity

const upload = multer({
  storage,
  allowedFormats: typeImg,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) {
          return reject(new Error("Image upload failed"));
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};
export { uploadToCloudinary, PRODUCT_FOLDER,USER_FOLDER,BLOG_FOLDER,cloudinary,upload };
