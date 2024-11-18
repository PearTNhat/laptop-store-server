import ProductCategory from '~/models/ProductCategory';
import { dp as dataP } from './dataProduct';
import { tivi } from '~/data/tivi';
import { banphim } from '~/data/banphim';
import { laptop } from '~/data/laptop';
import {dataCategory} from '~/data/category';
import slugify from 'slugify';
import Product from '~/models/Product';
import mongoose from 'mongoose';
import { taiNgheData } from '~/data/taiNghe';
import User from '~/models/User';
import Brand  from '~/models/Brand'
import Series from '~/models/Series'
//file này để chèn dữ liệu vào database
function customFormatNumber(number) {
    // Round down to the nearest thousand
    let roundedNumber = Math.floor(number / 1000) * 1000;

    // Format the number with periods as thousand separators
    return roundedNumber
}
function capitalizeFirstCharacter(str) {
    if (!str) return str; // Handle empty or null strings
    return str.charAt(0).toUpperCase() + str.slice(1);
}
export const insertProduct = async (req, res, next) => {
    try {
        const dp = laptop
        for (let i = 0; i < dp.length; i++) {
            // const colors = [];

            // const soldQuantity = Math.floor(Math.random() * 100);
            // const quantity = Math.floor(Math.random() * 100);
            // const colorSoldQuantity = Math.floor(soldQuantity / dp[i].colors.length);
            // const colorQuantity = Math.floor(quantity / dp[i].colors.length);
            // for (let j = 0; j < dp[i].colors.length; j++) {
            //     colors.push({
            //         color: dp[i].colors[j].color,
            //         quantity: colorQuantity,
            //         primaryImage: { url: dp[i].colors[j].primaryImage },
            //         soldQuantity: colorSoldQuantity,
            //         images: dp[i].colors[j].images.map((image) => ({ url: image }))
            //     });
            // }
            //  covert string to int
            console.log(dp[i].slug)
            const product = new Product({
                title: dp[i].title,
                slug: dp[i].slug,
                brand:dp[i].brand,
                price: dp[i].price === 0 ? undefined : parseInt(dp[i].price?.replace(/[^0-9]/g, ""), 10),
                discountPrice: parseInt(dp[i].discountPrice.replace(/[^0-9]/g, ""), 10),
                quantity: dp[i].quantity,
                brand: dp[i].brand,
                series: dp[i].series,
                soldQuantity: dp[i].soldQuantity,
                description:dp[i].description,
                primaryImage:dp[i].primaryImage,
                colors:dp[i].colors,
                configs:dp[i].configs,
                totalRating:dp[i].totalRating,
            });
            await product.save();
        }
        res.status(200).json({ message: "Insert product successfully" });
    } catch (error) {
        next(error);
    }
}
export const updateProductData = async (req, res, next) => {
    const exData =[
        "Tai nghe Xiaomi Type-C Earphones Trắng",
        "Tai nghe Gaming Over-ear không dây HyperX Cloud III Wireless BLK/RED GAM HS",
        "Tai nghe có dây Over-ear Corsair HS55 Surround Carbon",
        "Tai nghe có dây Over-ear Corsair HS55 Stereo Carbon",
        "Tai nghe Over-ear E-dra EH412 Pro",
        "Tai nghe Audio Technica ATH-AR1iSRD",
        "Tai nghe Tako GT-03",
        "Tai nghe Audio-technica ATH-S100iS",
        "Tai nghe Sony MDR-ZX110APWC1E",
        "Tai nghe Bluetooth Pisen True Wireless A-Buds 2000",
        "Tai nghe Bluetooth Sony Truly Wireless WF-C500",
        "Tai nghe không dây Sony WH-CH510/LZE",
        "Tai nghe không dây Audio-Technica ATH-CLR100BT",
        "Tai Nghe Bluetooth Sony WF-XB700/LZ",
        "Tai Nghe Bluetooth Sony WF-SP800N/BME",
        "Tai Nghe Bluetooth LG HBS-FN6",
        "Tai Nghe Bluettooth LG HBS-FN4",
        "Tai nghe Sony MDR-E9LP/BZ1E",
        "Tai nghe Bluetooth Sony WF-1000XM3",
        "Tai nghe Sony WI-C310/LCE",
        "Tai nghe Sony MDR-EX15APBZE",
        "Tai nghe Sony WI-SP500/PQE",
        "Tai nghe Sony MDR-EX155AP",
        "Tai nghe Sony MDR-XB55AP",
        "Tai nghe Audio-technica ATH-CLR100iS",
        "Tai nghe Audio-technica ATH-J100"
    ]
    try {
        const data =[]
        const products = await Product.find({category:'ban-phim'});
        for (let i = 0; i < products.length; i++) {
            if(products[i].colors.length === 1) {
                continue
            }
            if(products[i].colors.length === 0) {
                console.log('No color', products[i].slug)
            }
            const str = products[i].title; // The string to extract from
            if(exData.includes(str)){
                continue;
            }
            const regex =/-(.*)/;  // Regular expression to match content inside parentheses
            const match = str.match(regex); // Extract the match
            //products[i].title = str.replace(/\([^)]*\)/g, '');
            // const regex = /\(([^)]+)\)/; // Regular expression to match the substring after the hyphen
            // const match = str.match(regex);
            if(match){
                data.push(products[i].title)
                //products[i].title = str.split('-')[0].trim();
            }
            //await products[i].save();
        }
        res.status(200).json({mes:data });
    } catch (error) {
        next(error);
    }
}
export const insertBrand = async (req, res, next) => {
    try {
        const data = []
        const series ={}
        const mySeries = []
        for (let i = 0; i < laptop.length; i++) {
            if (!data.includes(laptop[i].brand)) {
                data.push(laptop[i].brand)
            }
            if(!mySeries.includes(laptop[i].series) && laptop[i].series != undefined) {
                mySeries.push(laptop[i].series)
            }
            if(!series[laptop[i].brand]) {
                series[laptop[i].brand]=[]
            } 
            if(!series[laptop[i].brand].includes(laptop[i].series)) {
                series[laptop[i].brand].push(laptop[i].series)
            }
        }
        console.log(mySeries)
        await Series.insertMany(mySeries.map((s) => ({ title: capitalizeFirstCharacter(s), slug:s })));
        //await Brand.insertMany(data.map((brand) => ({ title: capitalizeFirstCharacter(brand), slug: brand,series:series[brand]})));
        res.status(200).json({ mySeries });
    } catch (error) {
        next(error);
    }
}

export const updateDescription = async (req, res, next) => {
    try {
        const data = laptop
        for (let i = 0; i < data.length; i++) {
         await Product.findOneAndUpdate({slug:data[i].slug}, { description: [data[i].description] });
        }

        return res.status(200).json({ message: "Update description successfully" });
    } catch (error) {
        next(error);
    }
}
export const deleteManyProduct = async (req, res, next) => {
    try {
        //{category: 'ban-phim'}
        await Product.deleteMany();
        return res.status(200).json({ message: "Delete all product successfully" });
    } catch (error) {
        next(error);
    }
}
export const createManyUser = async (req, res, next) => {
    try {
        const data = [1,2,3,4,5,6,7,8,9,10]
        for (let i = 0; i < data.length; i++) {
            const user = new User({
                email: `user${i}@gmail.com`,
                password: '123456',
                role: 'user',
                firstName: `user`,
                lastName: `${i}`,
                password:'123456',
            }); 
            await user.save();
        }
        res.status(200).json({ message: "Insert user successfully" });
    }catch (error) {
        next(error);
    }
}