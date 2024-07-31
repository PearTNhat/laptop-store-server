import express from "express";
import { createProduct, getAllProducts, getProduct, uploadImagesProduct } from "~/controllers/productController";

import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
    .post([verifyAccessToken,isAdmin],createProduct)
    .get(getAllProducts);
Router.route("/:pid").get(getProduct);
Router.route("/upload-image/:pid").put([verifyAccessToken,isAdmin],uploadImagesProduct);

export const productRoute = Router;