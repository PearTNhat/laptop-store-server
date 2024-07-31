import express from "express";
import { createBrand, deleteBrand, getAllBrand, updateBrand } from "~/controllers/brandController";
import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/")
  .get(getAllBrand)
  .post([verifyAccessToken, isAdmin], createBrand);
Router.route("/:bid")
  .put([verifyAccessToken, isAdmin], updateBrand)
  .delete([verifyAccessToken, isAdmin], deleteBrand);

export const brandRoute = Router;
