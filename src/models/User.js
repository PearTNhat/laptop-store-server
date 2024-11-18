import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { type } from "os";
var userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    avatar: {
      url:{ 
        type: String,
        default:"https://res.cloudinary.com/dijvnphep/image/upload/v1722310317/DigitalStore/Users/xwzectymp2ml2tatiia6.png"
      },
      public_id: {
        type: String,
        default:"public_id",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false,
    },
    // addresses:[
    //   {
    //     address:{
    //       type:String,
    //     },
    //     isDefault:{
    //       type:Boolean,
    //       default:false,
    //     }
    //   }
    // ],
    address: {
      type: String,
      required: false,
    },
    wishlist: [
      {
        product: { type: mongoose.Schema.Types.ObjectId,ref: "Product" },
      }
    ],
    carts:[
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
        color: String,
      }
    ],
    role: {
      type: String,
      default: "user",
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    passwordChangeAt: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods = {
  comparePassword: async function (enterPassword) {
    return await bcrypt.compare(enterPassword, this.password);
  },
  createPasswordChangedToken:  function  (){
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires= Date.now() + 15 * 60 * 1000; // 15 minutes
    return resetToken;
  }
};
//Export the model
export default mongoose.model("User", userSchema);
