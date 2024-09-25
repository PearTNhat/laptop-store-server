import express from "express";
import { insertProduct } from "~/controllers";
import { createProduct, getAllProducts, getProduct, uploadImagesProduct } from "~/controllers/productController";

import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
    .post([verifyAccessToken,isAdmin],createProduct)
    .get(getAllProducts);
Router.route("/:slug").get(getProduct);
Router.route("/upload-image/:slug").put([verifyAccessToken,isAdmin],uploadImagesProduct);
Router.route("/insert/p").get(insertProduct);
export const productRoute = Router;