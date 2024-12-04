import mongoose from "mongoose";
// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
      color: String,
      status: {
        type: Number,
        default: 0,
        enum: [-1, 0, 1],
      },
    },
  ],
  total: Number,
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  orderBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, {
  timestamps: true
});

//Export the model
export default mongoose.model("Order", orderSchema);
