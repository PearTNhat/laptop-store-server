import express from "express";
import { createOrder, getOrdersUser } from "~/controllers/orderController";
import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
.post([verifyAccessToken],createOrder);

Router.route("/user").get(verifyAccessToken,getOrdersUser)

export const orderRoute = Router;