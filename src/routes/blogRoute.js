import express from "express";
import { createBlog, deleteBlog, dislikeBlog, getAllBlogs, getBlog, likeBlog, updateBlog, uploadImageBlog } from "~/controllers/blogController";


import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
  .get(getAllBlogs)
  .post([verifyAccessToken, isAdmin], createBlog);
Router.route("/:bid")
  .get(getBlog)
  .put([verifyAccessToken, isAdmin], updateBlog)
  .delete([verifyAccessToken, isAdmin],deleteBlog);
Router.route("/upload-image/:bid")
  .put([verifyAccessToken, isAdmin], uploadImageBlog)
Router.route("/like/:bid")
  .put([verifyAccessToken], likeBlog);
Router.route("/dislike/:bid")
  .put([verifyAccessToken], dislikeBlog);
export const blogRoute = Router;
