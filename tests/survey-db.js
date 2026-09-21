import mongoose from 'mongoose';
import "dotenv/config";
import Product from '../src/models/Product';
import { connectDB } from '../src/configs/mongodb';

async function checkProducts() {
  await connectDB();
  const count = await Product.countDocuments();
  console.log(`[DB Survey] Total products in database: ${count}`);

  const sample = await Product.find().limit(3).select('title slug brand price discountPrice colors configs');
  console.log(`[DB Survey] Sample products:`);
  console.log(JSON.stringify(sample, null, 2));

  // Check unique brands
  const brands = await Product.distinct('brand');
  console.log(`[DB Survey] Distinct brands:`, brands);

  // Check unique RAM values
  const rams = await Product.distinct('configs.ram.value');
  console.log(`[DB Survey] Distinct RAM values:`, rams);

  // Check unique needs
  const needs = await Product.distinct('configs.need.description');
  console.log(`[DB Survey] Distinct needs:`, needs);

  await mongoose.disconnect();
}

checkProducts().catch(err => {
  console.error(err);
  process.exit(1);
});
