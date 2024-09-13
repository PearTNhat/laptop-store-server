import express from "express";
import { updateDescription } from "~/controllers";


import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/update-desc").post(updateDescription)
export const  sthRoute = Router;