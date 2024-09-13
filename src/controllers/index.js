import ProductCategory from '~/models/ProductCategory';
import { dp as dataP} from './dataProduct';
import { tivi } from '~/data/tivi';
import { banphim } from '~/data/banphim';
import { laptop } from '~/data/laptop';
import slugify from 'slugify';
import Product from '~/models/Product';
//file này để chèn dữ liệu vào database
function customFormatNumber(number) {
    // Round down to the nearest thousand
    let roundedNumber = Math.floor(number / 1000) * 1000;

    // Format the number with periods as thousand separators
    return roundedNumber
}
export const insertProduct = async (req, res,next) => {
    try {
        const dp = banphim
        for (let i = 0; i < dp.length; i++) {
            const colors = [];
    
            const soldQuantity = Math.floor(Math.random() * 100);
            const quantity = Math.floor(Math.random() * 100);
            const colorSoldQuantity =Math.floor(soldQuantity / dp[i].colors.length) ;
            const colorQuantity =Math.floor( quantity / dp[i].colors.length);
            for (let j = 0; j < dp[i].colors.length; j++) {
                colors.push({
                    color: dp[i].colors[j].color,
                    quantity: colorQuantity,
                    primaryImage:{url: dp[i].colors[j].primaryImage},
                    soldQuantity:colorSoldQuantity,
                    images: dp[i].colors[j].images.map((image) => ({url: image}))
                });
            }
            const product = new Product({
                title: dp[i].title,
                slug: slugify(dp[i].title),
                brand:"Keyboard",
                price: parseInt(dp[i].price?.replace(/[^0-9]/g, ""), 10) || undefined,
                discountPrice:  parseInt(dp[i].discountPrice.replace(/[^0-9]/g, ""), 10),
                quantity:quantity,
                soldQuantity: soldQuantity,
                category: "66afa0e78c1ccaedb7f3f450",
                primaryImage: {url: dp[i].primaryImage},
                colors,
                totalRating: Math.floor(Math.random() * 5),
            });
            await product.save();
        }
        res.status(200).json({ message: "Insert product successfully" });
    } catch (error) {
        next(error);
    }
}
export const updateDescription = async (req, res,next) => {
    try {
        await Product.updateMany({title: {"$regex":"iPhone.*"}}, {description: `- Genuine, 100% New, Original Seal
- Screen: OLED Super Retina XDR
- Rear camera: 48MP, 12MP
- Front camera: 12MP
- CPU: Apple A17 Pro
- Memory: 256GB
- Operating system: iOS`});
return res.status(200).json({message: "Update description successfully"});
    } catch (error) {
        next(error);
    }
}
