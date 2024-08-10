import express from "express";
import { createDailyDeals, deleteDailyDeals, getDailyDeals } from "~/controllers/dailyDealsController";
import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
.get(getDailyDeals)
.post([verifyAccessToken, isAdmin],createDailyDeals);
Router.route("/:ddid")
.delete([verifyAccessToken, isAdmin],deleteDailyDeals);

export const dailyDealsRoute = Router;