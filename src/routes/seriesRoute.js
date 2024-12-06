import express from "express";
import { getSeriesBrand } from "~/controllers/seriesController";
const Router = express.Router();

Router.route("/brand/:brandId")
  .get(getSeriesBrand);

export const seriesRoute = Router;
