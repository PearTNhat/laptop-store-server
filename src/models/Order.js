import mongoose from "mongoose";
// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      counts: Number,
      color: String,
    },
  ],
  orderBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  paymentIntent: {},
  status: {
    type: String,
    default: "Processing",
    enum: ["Cancelled", "Processing", "Succeed"],
  },
});

//Export the model
export default mongoose.model("Order", orderSchema);
