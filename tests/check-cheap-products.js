import mongoose from "mongoose";
import "dotenv/config";
import Product from "../src/models/Product";
import { connectDB } from "../src/configs/mongodb";

async function run() {
  await connectDB();
  const cheapest = await Product.find({
    colors: { $elemMatch: { quantity: { $gt: 0 } } }
  })
    .sort({ discountPrice: 1, price: 1 })
    .limit(10)
    .select("title slug price discountPrice colors configs.need");

  console.log("Top 10 cheapest in DB:");
  cheapest.forEach((p, i) => {
    console.log(`${i + 1}. [${p.slug}] ${p.title} | discountPrice: ${p.discountPrice} | price: ${p.price}`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
