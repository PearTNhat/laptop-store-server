import mongoose from "mongoose";
// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
      color: String,
    },
  ],
  total:Number,
  orderBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    default: "Succeed",
    enum: ["Cancelled", "Processing", "Succeed"],
  },
},{
  timestamps: true
});

//Export the model
export default mongoose.model("Order", orderSchema);
