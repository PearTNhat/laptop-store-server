import express from "express";
import { callbackPayment, createOrder, deleteOrder, deleteProductOrder, getAllOrders, getOrdersUser, paymentOrder, transactionStatus, updateInfoOrder, updateStatusOrderProduct } from "~/controllers/orderController";
import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();


Router.route("/user").get(verifyAccessToken, getOrdersUser)
Router.route("/get-all").get(verifyAccessToken, isAdmin, getAllOrders)

Router.route("/:orderId")
    .put([verifyAccessToken, isAdmin], updateInfoOrder)
    .delete([verifyAccessToken, isAdmin], deleteOrder)
Router.route("/:orderId/:productId")
    .put([verifyAccessToken, isAdmin], updateStatusOrderProduct)
    .delete([verifyAccessToken, isAdmin], deleteProductOrder)
Router.route("/payment").post(verifyAccessToken,paymentOrder)
Router.route("/payment/callback").post(callbackPayment)
Router.route("/payment/:orderId").post(transactionStatus)
export const orderRoute = Router;