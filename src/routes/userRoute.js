import express from "express";
import { upload } from "~/configs/cloudinary";
import {
  addAddress,
  finalRegister,
  forgotPassword,
  getAllUsers,
  getCurrentUser,
  loginUser,
  refreshTokenUser,
  register,
  removeCart,
  resetPassword,
  updateCart,
  updateCurrentUser,
  updatePassword,
  updateWishlist,
  //uploadAvatar,
} from "~/controllers/userController";
import { isAdmin, verifyAccessToken } from "~/middleware/verifyToken";
const Router = express.Router();

Router.post("/register", register);
// Router.get("/final-register/:token", finalRegister);
Router.post("/final-register", finalRegister);
Router.post("/login", loginUser);
Router.post("/refresh-token", refreshTokenUser);
Router.get("/forgot-password", forgotPassword);
Router.put("/reset-password/:resetToken", resetPassword);

Router.route("/")
  .get(verifyAccessToken, getCurrentUser)
  .put(verifyAccessToken,upload.single('avatar'), updateCurrentUser);
//Router.route("/upload-avatar").put(verifyAccessToken, uploadAvatar);
Router.route("/get-users").get([verifyAccessToken,isAdmin], getAllUsers);
Router.route("/password").put(verifyAccessToken, updatePassword);
Router.route("/address").post(verifyAccessToken, addAddress);
Router.route("/wish-list").put(verifyAccessToken, updateWishlist);
Router
.route("/cart")
.put(verifyAccessToken, updateCart)
.delete(verifyAccessToken, removeCart);

export const userRoute = Router;
