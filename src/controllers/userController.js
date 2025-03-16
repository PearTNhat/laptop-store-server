import crypto from "crypto";
import User from "~/models/User";
import { generateAccessToken, generateRefreshToken } from "~/middleware/jwt";
import { verify } from "jsonwebtoken";
import sendMail from "~/utils/sendMail";
import { cloudinary, uploadToCloudinary, uploadUserCloud, USER_FOLDER } from "~/configs/cloudinary";
import { generateOTP } from "~/utils/helper";

const excludeFields =
  "-password -refreshToken -passwordChangeAt -passwordResetToken -passwordResetExpires";
// dùng otp để xác thực
const register = async (req, res, next) => {
  try {
    const { email, firstName, lastName, password } = req.body;
    if (!email || !firstName || !lastName || !password) {
      throw new Error("Missing inputs");
    }
    let [user, isUserExist] = await Promise.all([await User.findOne({ email }), await User.findOne({ 'email': { $regex: `${email}&.*` } })]);
    if (user) {
      throw new Error("Email already exists");
    }
    const OTP = generateOTP();
    const emailEdited = email + '&' + OTP
    if (isUserExist) {
      await User.findOneAndUpdate({ 'email': { $regex: `${email}&.*` } }, { email: emailEdited, firstName, lastName, password });
    } else {
      await User.create({ email: emailEdited, firstName, lastName, password });
    }
    // xoa user sau 45s không đăng ký
    setTimeout(async () => {
      await User.findOneAndDelete({ email: emailEdited });
    }, 5 * 60 * 1000);
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
    const { OTP, email } = req.body;
    const user = await User.findOne({ email: email + '&' + OTP });
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
    let user = await User.findOne({ email }).populate({
      path: 'carts.product',
      select: 'title price discountPrice colors',
    });
    if (!user) throw new Error("Email or password are not exist");
    if (user.isBlocked) {
      return res.status(403).json({
        success: true,
        status: 403,
        message: "Your account has been blocked",
      });
    }
    if (await user.comparePassword(password)) {
      const newRefreshToken = generateRefreshToken(user._id);
      await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        maxAge: 7 * 60 * 60 * 1000, // 7 d
      });
      const accessToken = generateAccessToken({
        _id: user._id,
        role: user.role,
      });
      const { password, refreshToken, ...userData } = user.toObject();
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
      excludeFields
    ).populate([{
      path: 'carts.product',
      select: 'title price discountPrice colors',
    }, {
      path: 'wishlist.product'
    }]);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
const getAllUsers = async (req, res, next) => {
  try {
    //1A filter
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    //1B Advanced filtering
    // price[gte]=123 & price[lte]=123 => {price: {gte: 123, lte: 123}}
    let queryStr = JSON.stringify(queryObj);
    //{price: {gte: 1000}, rating: {gt: 4.5}} => {price: {$gte: 1000}, rating: {$gt: 4.5}}
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne)\b/g, (match) => `$${match}`);
    let formatQuery = JSON.parse(queryStr);

    // filter title
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      delete formatQuery.search
      formatQuery['$or'] = [
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, regex: searchRegex } } }
      ]
    } else {
      delete formatQuery.search
    }
    let queryCommand = User.find(formatQuery);

    // select fields
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      queryCommand = queryCommand.select(fields);
    } else {
      queryCommand = queryCommand.select("-__v");
    }
    // sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      queryCommand = queryCommand.sort(sortBy);
    }
    // dấu cộng để conver str to number
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;
    queryCommand = queryCommand
      .skip(skip)
      .limit(limit)
      .populate()
    const [totalDocuments, users] = await Promise.all([
      User.find(formatQuery).countDocuments(),
      queryCommand.skip(skip).limit(limit),
    ]);
    res.status(200).json({
      success: true,
      counts: totalDocuments,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

// const uploadAvatar = async (req, res, next) => {
//   try {
//     const user = await User.findById({ _id: req.user._id });
//     const upload = uploadUserCloud.single("image");
//     if (!user) throw new Error("User not found");
//     if (user.avatar?.public_id !== "public_id") {
//       await cloudinary.uploader.destroy(user.avatar.public_id);
//     }
//     upload(req, res, async (err) => {
//       if (err) throw new Error(err);
//       if (!req.file) throw new Error("Missing image");
//       user.avatar.public_id = req.file.filename;
//       user.avatar.url = req.file.path;
//       await user.save();
//     });
//     res.status(200).json({ success: true, data: user });
//   } catch (error) {
//     next(error);
//   }
// };
const updateCurrentUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, address } = JSON.parse(req.body.document);
    if (!req.user?._id || !(firstName && lastName && phone && email))
      throw new Error("Missing inputs");
    let img;

    let user = await User.findById(
      req.user._id,
    ).select(excludeFields)
    if (req.file) {
      img = await uploadToCloudinary(req.file.buffer, USER_FOLDER);
      img = { url: img.url, public_id: img.public_id };
      if (user.avatar?.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }
    }
    if (!user) throw new Error("User not found");
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.email = email || user.email;
    user.avatar = img || user.avatar;
    user.address = address || user.address;
    await user.save();
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
    const { product, quantity = 1, color } = req.body;
    if (!product || !color) throw new Error("Missing inputs");
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
      );
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
      );
    }
    res.status(200).json({ success: true, data: 'oke' });
  } catch (error) {
    next(error);
  }
};
const removeCart = async (req, res, next) => {
  try {
    const { product, color } = req.body;
    if (!product || !color) throw new Error("Missing inputs");
    const data = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: {
          carts: {
            product,
            color
          },
        },
      },
      { new: true }
    ).select("carts");
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    next(error);
  }
}
const updateWishlist = async (req, res, next) => {
  try {
    const { product } = req.body;
    if (!product) throw new Error("Missing inputs");
    let user = await User.findById({ _id: req.user._id }).select("wishlist");
    if (!user) throw new Error("User not found");
    const alreadyHaveProduct = user.wishlist?.some(
      (item) => item.product.toString() === product
    );
    if (alreadyHaveProduct) {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $pull: {
            wishlist: {
              product
            },
          },
        },
        { new: true }
      );
    } else {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: {
            wishlist: {
              product
            },
          },
        },
        { new: true }
      );
    }
    res.status(200).json({ success: true, message: "Update wishlist successfully" });
  } catch (error) {
    next(error);
  }
}
const updateRole = async (req, res, next) => {
  try {
    const { role, userId } = req.body;
    if (!role || !userId) throw new Error("Missing role");
    if (role !== "user" && role !== "admin") {
      throw new Error("Role must be user or admin");
    }
    if (req.user.role !== 'admin') throw new Error("You are not admin");
    await User.findByIdAndUpdate(
      userId,
      {
        role,
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: 'Update role successfully',
    });
  } catch (error) {
    next(error);
  }
};
const updateBlock = async (req, res, next) => {
  try {
    const { isBlocked, userId } = req.body;
    if (!userId) throw new Error("Missing input");
    if (isBlocked !== true && isBlocked !== false) throw new Error("Blocking must be true or false");
    if (req.user.role !== 'admin') throw new Error("You are not admin");
    await User.findByIdAndUpdate(
      userId,
      {
        isBlocked,
      },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: 'Update block successfully',
    });
  } catch (error) {
    next(error);
  }
}
export {
  register,
  finalRegister,
  loginUser,
  refreshTokenUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateCurrentUser,
  updatePassword,
  getAllUsers,
  addAddress,
  updateCart,
  removeCart,
  updateWishlist,
  updateRole,
  updateBlock
};
