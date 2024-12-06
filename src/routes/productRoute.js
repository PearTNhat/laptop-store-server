import express from "express";
import {upload } from "~/configs/cloudinary";
import { createProduct, createProductColor, getAllProducts, getProduct, updateProduct, updateProductColor } from "~/controllers/productController";

import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();
// k để multer làm middleware ở đây vì khi xảy ra lỗi ở phía sau vẫn up len cloidinary
Router.route("/")
    .get(getAllProducts)
    .post([verifyAccessToken,isAdmin],upload.single('primaryImage'),createProduct)
Router.route("/create-color/:slug").post([verifyAccessToken,isAdmin],upload.fields([{name:'primaryImage',maxCount:1},{name:'images',maxCount:10}]),createProductColor);
Router.route("/:slug").get(getProduct);
Router.route("/update/:slug").put([verifyAccessToken,isAdmin],upload.single('primaryImage'),updateProduct);
Router.route("/update-product-color/:slug").put([verifyAccessToken,isAdmin],upload.fields([{name:'primaryImage',maxCount:1},{name:'images',maxCount:10}]),updateProductColor);
export const productRoute = Router;