import express from "express";
import { createBlog, deleteBlog, disklikeBlog, getAllBlogs, getBlog, likeBlog, updateBlog } from "~/controllers/blogController";


import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
  .get(getAllBlogs)
  .post([verifyAccessToken, isAdmin], createBlog);
Router.route("/:bid")
  .get(getBlog)
  .put([verifyAccessToken, isAdmin], updateBlog)
  .delete([verifyAccessToken, isAdmin],deleteBlog);
Router.route("/like/:bid")
  .put([verifyAccessToken], likeBlog);
Router.route("/dislike/:bid")
  .put([verifyAccessToken], disklikeBlog);
export const blogCategoryRoute = Router;
