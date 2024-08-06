import ProductCategory from '~/models/ProductCategory';
import data from './data';
import { dp } from './dataProduct';
import slugify from 'slugify';
import Product from '~/models/Product';
//file này để chèn dữ liệu vào database
export const insertProductCategory = async (req, res,next) => {
    try {
        for (let i = 0; i < data.length; i++) {
            const productCategory = new ProductCategory({
                title: data[i].title,
                slug: slugify(data[i].title),
                brands: data[i].brand
            });
            await productCategory.save();
        }
        res.status(200).json({ message: "Insert product category successfully" });
    } catch (error) {
        next(error);
    }
}
export const insertProduct = async (req, res,next) => {
    try {
        for (let i = 0; i < dp.length; i++) {
            const colors = [];
            const soldQuantity = Math.floor(Math.random() * 100);
            const quantity = Math.floor(Math.random() * 100);
            const colorSoldQuantity = soldQuantity / dp[i].colors.length;
            const colorQuantity = quantity / dp[i].colors.length;
            for (let j = 0; j < dp[i].colors.length; j++) {
                colors.push({
                    color: dp[i].colors[j].color,
                    quantity: colorQuantity,
                    primaryImage:{url: dp[i].colors[j].primaryImage},
                    soldQuantity:colorSoldQuantity,
                    capacity: dp[i].colors[j].cappacity,
                    images: dp[i].colors[j].images.map((image) => ({url: image}))
                });
            }
            const product = new Product({
                title: dp[i].title,
                slug: slugify(dp[i].title),
                brand: "Apple",
                price:  parseInt(dp[i].price.replace(/[^0-9]/g, ""), 10),
                discountPrice:  parseInt(dp[i].discountPrice.replace(/[^0-9]/g, ""), 10),
                quantity:quantity,
                soldQuantity: soldQuantity,
                category: "66afa0e78c1ccaedb7f3f444",
                primaryImage: {url: dp[i].primaryImage},
                colors
            });
            await product.save();
        }
        res.status(200).json({ message: "Insert product successfully" });
    } catch (error) {
        next(error);
    }
}
