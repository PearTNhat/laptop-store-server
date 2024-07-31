import express from "express";
import { createCoupon, deleteCoupon, getAllCoupons, updateCoupon } from "~/controllers/couponController";
import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
.get(getAllCoupons)
.post([verifyAccessToken, isAdmin],createCoupon);
Router.route("/:cid")
.put([verifyAccessToken, isAdmin],updateCoupon)
.delete([verifyAccessToken, isAdmin],deleteCoupon);

export const couponRoute = Router;