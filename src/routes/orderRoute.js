import express from "express";
import { createOrder, deleteOrder, deleteProductOrder, getAllOrders, getOrdersUser, updateInfoOrder, updateStatusOrderProduct } from "~/controllers/orderController";
import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
    .post([verifyAccessToken], createOrder)

Router.route("/user").get(verifyAccessToken, getOrdersUser)
Router.route("/get-all").get(verifyAccessToken, isAdmin, getAllOrders)

Router.route("/:orderId")
    .put([verifyAccessToken, isAdmin], updateInfoOrder)
    .delete([verifyAccessToken, isAdmin], deleteOrder)
Router.route("/:orderId/:productId")
    .put([verifyAccessToken, isAdmin], updateStatusOrderProduct)
    .delete([verifyAccessToken, isAdmin], deleteProductOrder)

export const orderRoute = Router;