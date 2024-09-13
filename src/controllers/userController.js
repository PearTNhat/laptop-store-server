import crypto from "crypto";
import User from "~/models/User";
import { generateAccessToken, generateRefreshToken } from "~/middleware/jwt";
import { verify } from "jsonwebtoken";
import sendMail from "~/utils/sendMail";
import { cloudinary, uploadUserCloud } from "~/configs/cloudinary";
import { generateOTP } from "~/utils/helper";

const excludeFields =
  "-password -refreshToken -role -passwordChangeAt -passwordResetToken -passwordResetExpires";
  // đăng kí k cần xác thực
// const register = async (req, res, next) => {
//   try {
//     const { email, firstName, lastName, password } = req.body;
//     if (!email || !firstName || !lastName || !password) {
//       throw new Error("Missing inputs");
//     }
//     let user = await User.findOne({ email });
//     if (user) {
//       throw new Error("Email already exists");
//     }
//     user = new User({ email, firstName, lastName, password });
//     await user.save();
//     const accessToken = generateAccessToken({ _id: user._id, role: user.role });
//     user = user.toObject();
//     delete user.password;
//     delete user.role;
//     res.status(201).json({
//       success: true,
//       data: {
//         ...user,
//         accessToken,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// dung cookie de luu trang thai dang ki
// const register = async (req, res, next) => {
//   try {
//     const { email, firstName, lastName, password } = req.body;
//     if (!email || !firstName || !lastName || !password) {
//       throw new Error("Missing inputs");
//     }
//     let user = await User.findOne({ email });
//     if (user) {
//       throw new Error("Email already exists");
//     }
//     const token = crypto.randomBytes(32).toString("hex");
//     const registerData = {
//       email,
//       firstName,
//       lastName,
//       password,
//       token,
//     };
//     res.cookie("registerData", registerData, {
//       httpOnly: true,
//       maxAge: 5*60 * 1000, // 5 minutes
//     });
//     // ở đây cần dùng url BE để nó gửi chạy trực tiếp tới BE luôn
//     const html = `
//     <h1> Verify your account </h1>
//       <p>
//         Click the link to verify your account
//         <a href=${`${process.env.BASE_URL_BACKEND}/api/user/final-register/${token}`}>Verify your account</a>
//       </p>
//       <p>The link expires in 5 minutes</p>
//     `;
//     const subject = "[Digital Store] Please verify your account";

//     await sendMail({ to: email, html, subject });
//     res
//       .status(201)
//       .json({
//         success: true,
//         message: "Please check your email to verify your account",
//       });
//   } catch (error) {
//     next(error);
//   }
// };
// const finalRegister = async (req, res, next) => {
//   try {
//     const { token } = req.params;
//     const userRegister = req.cookies.registerData;
//     if (!userRegister || userRegister?.token !== token) {
//       res.clearCookie("registerData");
//       return res.redirect(`${process.env.BASE_URL_FRONTEND}/final-register/failed`);
//     }
//     const { email, firstName, lastName, password } = userRegister;
//     await User.create({ email, firstName, lastName, password });
//     res.clearCookie("registerData");
//     return res.redirect(`${process.env.BASE_URL_FRONTEND}/final-register/success`);
//   } catch (error) {
//     next(error);
//   }
// };

// dùng otp để xác thực
const register = async (req, res, next) => {
  try {
    const { email, firstName, lastName, password } = req.body;
    if (!email || !firstName || !lastName || !password) {
      throw new Error("Missing inputs");
    }
    let [user,isUserExist] = await Promise.all([await User.findOne({ email }), await User.findOne({'email':{ $regex: `${email}&.*` }})]); 
    if (user) {
      throw new Error("Email already exists");
    }
   const OTP = generateOTP();
   const emailEdited =email+'&'+OTP
   if(isUserExist){
    await User.findOneAndUpdate({'email':{ $regex: `${email}&.*` }},{ email:emailEdited ,firstName, lastName, password });
   }else{
    await User.create({ email:emailEdited ,firstName, lastName, password });
   }
   // xoa user sau 45s không đăng ký
    setTimeout(async () => {
      await User.findOneAndDelete({ email: emailEdited });
    }, 5*60 * 1000);
    const html = `
    <h1> Verify your account </h1>
      <p>
        <h1> Your OTP </h1>
        <strong>${OTP}</strong>
      </p>
      <p>The OTP expires in 5 minutes</p>
    `;
    const subject = "[Digital Store] OTP to verify your account";

    await sendMail({ to: email, html, subject });
    res
      .status(201)
      .json({
        success: true,
        message: "OTP has been sent to your email",
      });
  } catch (error) {
    next(error);
  }
};
const finalRegister = async (req, res, next) => {
  try {
    const { OTP,email } = req.body;
    console.log(email,OTP)
    const user = await User.findOne({ email: email+'&'+OTP });
    if (!user) {
      throw new Error("OTP is not correct");
    }
    user.email = user.email.split('&')[0]
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Register successfully",
    });
  } catch (error) {
    next(error);
  }
};
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new Error("Missing inputs");
    let user = await User.findOne({ email });
    if (!user) throw new Error("Email or password are not exist");
    if (await user.comparePassword(password)) {
      const newRefreshToken = generateRefreshToken(user._id);
      await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        maxAge: 7 * 60 * 60 * 1000, // 7 hours
      });
      const accessToken = generateAccessToken({
        _id: user._id,
        role: user.role,
      });
      const { password, role, refreshToken, ...userData } = user.toObject();
      return res.status(200).json({
        message: "Login successfully",
        success: true,
        userData,
        accessToken,
      });
    } else {
      const error = new Error("Email or password are not exist");
      error.statusCode = 401;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};
const refreshTokenUser = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    if (!cookies || !cookies.refreshToken) {
      throw new Error("Refresh token doest not exist");
    }
    const rs = verify(cookies.refreshToken, process.env.JWT_SECRET);
    if (!rs?._id) throw new Error("Refresh token is not valid");
    const user = await User.findOne({
      _id: rs._id,
      refreshToken: cookies.refreshToken,
    });
    if (!user) throw new Error("Refresh token is not valid");
    res.status(200).json({
      success: true,
      accessToken: generateAccessToken({ _id: user._id, role: user.role }),
    });
  } catch (error) {
    next(error);
  }
};
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) throw new Error("Missing email");
    const user = await User.findOne({ email }).select("email");
    if (!user) throw new Error("User not found");
    const resetToken = user.createPasswordChangedToken();
    await user.save();
    const html = `
        <h1><Reset your password ></h1>
          <p>
            Click the link to reset your password
            <a href=${`${process.env.BASE_URL_FRONTEND}/reset-password/${resetToken}`}>Reset Password</a>
          </p>
          <p>The password reset link expires in 2 minutes</p>
        `;
    const subject = "[Digital Store] Reset your password";
    await sendMail({ to: email, html, subject });
    res.status(200).json({
      success: true,
      message: "Send email successfully",
    });
  } catch (error) {
    next(error);
  }
};
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { newPassword } = req.body;
    console.log(newPassword)
    if (!resetToken) throw new Error("Missing reset token");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpires: { $gte: Date.now() },
    });
    if (!user) throw new Error("Invalid reset token");
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangeAt = Date.now();
    await user.save();
    res.status(200).json({
      success: true,
      message: "Reset password successfully",
    });
  } catch (error) {
    next(error);
  }
};
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshToken -role -passwordChangeAt -passwordResetToken -passwordResetExpires"
    );
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
const uploadAvatar = async (req, res, next) => {
  try {
    const user = await User.findById({ _id: req.user._id });
    const upload = uploadUserCloud.single("image");
    if (!user) throw new Error("User not found");
    if (user.avatar?.public_id !== "public_id") {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }
    upload(req, res, async (err) => {
      if (err) throw new Error(err);
      if (!req.file) throw new Error("Missing image");
      user.avatar.public_id = req.file.filename;
      user.avatar.url = req.file.path;
      await user.save();
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
const getAllUser = async (req, res, next) => {
  try {
    const users = await User.find().select(
      "-password -refreshToken -role -passwordChangeAt -passwordResetToken -passwordResetExpires"
    );
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    if (!req.user?._id || Object.keys(req.body).length === 0)
      throw new Error("Missing inputs");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true }
    ).select(
      "-password -refreshToken -role -passwordChangeAt -passwordResetToken -passwordResetExpires"
    );
    if (!user) throw new Error("User not found");
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new Error("Missing inputs");
    if (currentPassword === newPassword)
      throw new Error(
        "New password must be different from the current password"
      );
    const user = await User.findById(req.user._id);
    if (await user.comparePassword(currentPassword)) {
      user.password = newPassword;
      user.passwordChangeAt = Date.now();
      await user.save();
      res.status(200).json({
        success: true,
        message: "Update password successfully",
      });
    } else {
      throw new Error("Current password is not correct");
    }
  } catch (error) {
    next(error);
  }
};
const addAddress = async (req, res, next) => {
  try {
    const { address } = req.body;
    if (!address) throw new Error("Missing address");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          addresses: {
            address,
          },
        },
      },
      { new: true }
    ).select(excludeFields);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
const updateCart = async (req, res, next) => {
  try {
    const { product, quantity, color } = req.body;
    if (!product || !quantity || !color) throw new Error("Missing inputs");
    const user = await User.findById({ _id: req.user._id }).select("carts");
    if (!user) throw new Error("User not found");
    const alreadyHaveProductColor = user.carts?.find(
      (item) => item.product.toString() === product && item.color === color
    );
    let carts;
    // nếu tồn tại Product color thì update quantity
    // nếu không thì thêm mới
    if (alreadyHaveProductColor) {
      carts = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          carts: {
            $elemMatch: {
              product: product,
              color: color,
            },
          },
        },
        {
          $set: {
            "carts.$.quantity": quantity,
          },
        },
        { new: true }
      ).select("carts");
    } else {
      carts = await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: {
            carts: {
              product,
              quantity,
              color,
            },
          },
        },
        { new: true }
      ).select("carts");
    }
    res.status(200).json({ success: true, data: carts });
  } catch (error) {
    next(error);
  }
};
export {
  register,
  finalRegister,
  loginUser,
  refreshTokenUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateUser,
  updatePassword,
  getAllUser,
  uploadAvatar,
  addAddress,
  updateCart,
};
