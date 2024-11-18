import express from "express";
import { createManyUser, deleteManyProduct, insertBrand, insertProduct, updateDescription, updateProductData } from "~/controllers";



import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.route("/update-desc").post(updateDescription)
Router.route("/delete-many-p").delete(deleteManyProduct)
Router.route("/insert-p")
.post(insertProduct)
.put(updateProductData)
Router.route("/insert-brand").post(insertBrand)
Router.route("/user").post(createManyUser)
export const  sthRoute = Router;