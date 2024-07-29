import express from "express";
import { createComment, deleteComment, updateComment } from "~/controllers/commentController";

import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();


Router.route("/").post(verifyAccessToken,createComment);
Router.route("/:id")
    .put(verifyAccessToken,updateComment)
    .delete(verifyAccessToken,deleteComment)
;

export const commentRoute = Router;