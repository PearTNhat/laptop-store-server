import express from "express";
import { createComment, deleteComment, likeComment, updateComment } from "~/controllers/commentController";

import {  verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();


Router.route("/").post(verifyAccessToken,createComment);
Router.route("/:id")
    .put(verifyAccessToken,updateComment)
    .delete(verifyAccessToken,deleteComment)
;
Router.route("/like/:id").put(verifyAccessToken,likeComment);

export const commentRoute = Router;