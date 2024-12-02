import express from "express";
import { createManyUser, deleteManyProduct, insertBrand, insertProduct, randomRatingUser, updateDescription, updateProductData, updateRatingProduct } from "~/controllers";



const Router = express.Router();

Router.route("/update-desc").post(updateDescription)
Router.route("/delete-many-p").delete(deleteManyProduct)
Router.route("/insert-p")
.post(insertProduct)
.put(updateProductData)
Router.route("/update-p-r").put(updateRatingProduct)
Router.route("/insert-brand").post(insertBrand)
Router.route("/user/rand-rating").post(randomRatingUser)
Router.route("/user").post(createManyUser)

export const  sthRoute = Router;