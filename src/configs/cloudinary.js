const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
import "dotenv/config";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const typeImg = ["jpg", "png", "jpeg"];
const storage = ({ folder }) => {
  return new CloudinaryStorage({
    cloudinary,
    allowedFormats: typeImg,
    params: {
      folder: `DigitalStore/${folder}`,
    },
  });
  v;
};

const uploadProductCloud = multer({ storage: storage({ folder: "Products" }) });
const uploadUserCloud = multer({ storage: storage({ folder: "Users" }) });
const uploadBlogCloud = multer({ storage: storage({ folder: "Blogs" }) });

export { uploadProductCloud, uploadUserCloud,uploadBlogCloud,cloudinary };
