import express from "express";
import { updateCategory, updateDescription } from "~/controllers";


import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/update-desc").post(updateDescription)
Router.route("/update-cate").post(updateCategory)
export const  sthRoute = Router;