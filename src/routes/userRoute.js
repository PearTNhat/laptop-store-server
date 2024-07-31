import express from "express";
import {
  addAddress,
  forgotPassword,
  getAllUser,
  getCurrentUser,
  loginUser,
  refreshTokenUser,
  register,
  resetPassword,
  updateCart,
  updatePassword,
  updateUser,
  uploadAvatar,
} from "~/controllers/userController";
import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.post("/register", register);
Router.post("/login", loginUser);
Router.post("/refresh-token", refreshTokenUser);
Router.get("/forgot-password", forgotPassword);
Router.put("/reset-password/:resetToken", resetPassword);

Router.route("/")
  .get(verifyAccessToken, getCurrentUser)
  .put(verifyAccessToken, updateUser);
Router.route("/upload-avatar").put(verifyAccessToken, uploadAvatar);
Router.route("/get-all-user").get([verifyAccessToken,isAdmin], getAllUser);
Router.route("/password").put(verifyAccessToken, updatePassword);
Router.route("/address").post(verifyAccessToken, addAddress);
Router.route("/cart").put(verifyAccessToken, updateCart);

export const userRoute = Router;
