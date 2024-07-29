import express from "express";
import { createProduct, getAllProducts, getProduct } from "~/controllers/productController";

import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
    .post([verifyAccessToken,isAdmin],createProduct)
    .get(getAllProducts);
Router.route("/:pid").get(getProduct);

export const productRoute = Router;