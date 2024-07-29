import express from "express";
import {
  createBlogCategory,
  deleteBlogCategory,
  getAllBlogCategories,
  updateBlogCategory,
} from "~/controllers/blogCategoryController";

import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
  .get(getAllBlogCategories)
  .post([verifyAccessToken, isAdmin], createBlogCategory);
Router.route("/:bcid")
  .put([verifyAccessToken, isAdmin], updateBlogCategory)
  .delete([verifyAccessToken, isAdmin], deleteBlogCategory);

export const blogCategoryRoute = Router;
