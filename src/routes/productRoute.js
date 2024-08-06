import express from "express";
import { insertProduct, insertProductCategory } from "~/controllers";
import { createProduct, getAllProducts, getProduct, uploadImagesProduct } from "~/controllers/productController";

import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
    .post([verifyAccessToken,isAdmin],createProduct)
    .get(getAllProducts);
Router.route("/:pid").get(getProduct);
Router.route("/upload-image/:pid").put([verifyAccessToken,isAdmin],uploadImagesProduct);
Router.route("/insert/i").get(insertProductCategory);
Router.route("/insert/p").get(insertProduct);
export const productRoute = Router;