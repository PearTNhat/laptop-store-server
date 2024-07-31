import express from "express";
import {
  deleteProductCategory,
  getAllProductCategories,
  updateProductCategory,
  createProductCategory,
} from "~/controllers/productCategoryController";

import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
  .get(getAllProductCategories)
  .post([verifyAccessToken, isAdmin],createProductCategory);
Router.route("/:pcid")
  .put([verifyAccessToken, isAdmin], updateProductCategory)
  .delete([verifyAccessToken, isAdmin], deleteProductCategory);

export const productCategoryRoute = Router;
