import { laptop } from '~/data/laptop';
import { brand } from '~/data/brand';
import { series } from '~/data/series';
import slugify from 'slugify';
import Product from '~/models/Product';
import User from '~/models/User';
import Brand from '~/models/Brand'
import Series from '~/models/Series'
import { handleUpdateTotalProductRating } from '~/utils/helper';
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
    let index= 0
    try {
        const dp = laptop
        for (let i = 0; i < dp.length; i++) {
            //675189abdd22048362e0e587 dell
            //675189acdd22048362e0e58f gigabyte
            index = i
            let sr = await Series.findOne({ title: capitalizeFirstCharacter(dp[i].series) })
            if (dp[i].series === 'g5' && dp[i].brand === 'gigabyte') {
                sr._id = '6751c78587dc8cd52b03f11e'
                console.log('gigabyte', sr)
            }
            if (dp[i].series === 'g5' && dp[i].brand === 'dell') {
                sr._id = '6751c78487dc8cd52b03f10c'
                console.log('dell', sr)
            }
            const product = new Product({
                title: dp[i].title,
                slug: dp[i].slug,
                price: dp[i].price,
                discountPrice: dp[i].discountPrice,
                quantity: dp[i].quantity,
                brand: dp[i].brand,
                series: sr._id,
                soldQuantity: dp[i].soldQuantity,
                features: dp[i].features,
                description: dp[i].description,
                primaryImage: dp[i].primaryImage,
                colors: dp[i].colors,
                configs: dp[i].configs,
                totalRating: dp[i].totalRating,
            });
            await product.save();
        }
        res.status(200).json({ message: "Insert product successfully" });
    } catch (error) {
        clg('index',index)
        next(error);
    }
}
function extractTotalRam(value) {
    // Tìm số lượng RAM (vd: "2 x")
    const temp = value.trim().slice(0, 3)
    const quantityMatch = temp.match(/(\d+)\s*x/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

    // Tìm dung lượng từng thanh RAM (vd: "8GB")
    const sizeMatch = value.match(/(\d+)\s*GB/);
    const size = sizeMatch ? parseInt(sizeMatch[1]) : 0;

    // Tính tổng dung lượng RAM
    return quantity * size;
}
function extractNumber(value) {
    const match = value.match(/(\d+)\s*(gb|tb)/i);
    return match ? parseInt(match[1]) : null; // Lấy số nếu khớp, trả về null nếu không
}


export const updateProductData = async (req, res, next) => {
    try {
        const logs = []
        let d
        const ram = []
        const hardDrive = []
        const weight = []
        const products = await Product.find();
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const configRam = product.configs.ram
            let configHardDrive = product.configs.hardDrive
            // product.configs.ram.currentValue = configRam.value ? extractTotalRam(configRam.value) + 'GB': logs.push({mess:'r', id:product._id,desc:configRam.value})
            // product.configs.hardDrive.currentValue =configHardDrive.value.trim().split(' ')[0]
            ram.push(product.configs.ram.currentValue)
            hardDrive.push(product.configs.hardDrive.currentValue)

            //  product.configs = newConfigs;
            logs.push([product.configs])
            //   await product.save();
        }
        //await Product.updateMany({}, { configs: newConfigs });
        res.status(200).json({
            mes: {
                'ram': ram,
                'rl': ram.length,
                'hardDrive': hardDrive,
                'hl': hardDrive.length,
            }
        });
    } catch (error) {
        next(error);
    }
}
export const updateRatingProduct = async (req, res, next) => {
    try {
        const products = await Product.updateMany({
            totalRating: 0
        }, {
            $set: { totalRating: null }
        });
        res.status(200).json({ message: "Update rating successfully" });
    } catch (error) {
        next(error);
    }
}
export const insertBrand = async (req, res, next) => {
    try {
        for (let i = 0; i < brand.length; i++) {
            const newBrand = new Brand({
                title: capitalizeFirstCharacter(brand[i]),
                slug: slugify(brand[i], { lower: true })
            });
            await newBrand.save();
        }
        res.status(200).json('oke');
    } catch (error) {
        next(error);
    }
}
export const insertSeries = async (req, res, next) => {
    try {
        for (const brand in series) {
            for (let i = 0; i < series[brand].length; i++) {
                const b = await Brand.findOne({ slug: brand })
                const newSeries = new Series({
                    title: capitalizeFirstCharacter(series[brand][i]),
                    slug: slugify(series[brand][i], { lower: true }),
                    brand: b._id
                });
                await newSeries.save();
            }
        }
        res.status(200).json('oke');
    } catch (error) {
        next(error);
    }
}
export const updateDescription = async (req, res, next) => {
    try {
        const data = laptop
        for (let i = 0; i < data.length; i++) {
            await Product.findOneAndUpdate({ slug: data[i].slug }, { description: [data[i].description] });
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
        for (let i = 212; i < 300; i++) {
            const user = new User({
                email: `user${i}@gmail.com`,
                password: '123456',
                role: 'user',
                firstName: `user`,
                lastName: `${i}`,
                password: '123456',
            });
            await user.save();
        }
        res.status(200).json({ message: "Insert user successfully" });
    } catch (error) {
        next(error);
    }
}
const createComment = async ({ rating, product, content, user }) => {
    try {
        if (!product) {
            throw new Error("Missing input");
        }
        if (rating && parentId) {
            throw new Error(
                "Comment can not have rating and parentId at the same time"
            );
        }
        // Kiểm tra xem đã dánh giá hay chưa
        if (rating) {
            if (rating < 0 || rating > 5) {
                throw new Error("Rating must be between 0 and 5");
            }
            const isRated = await Comment.findOne({
                product,
                user,
                rating: { $exists: true },
            });
            if (isRated) {
                throw new Error("You have already rated this product");
            }
            // nếu chưa đánh gía thì update rating cho product
            await handleUpdateTotalProductRating({
                productId: product,
                type: "CREATE",
                rating,
            });
        }
        let rs
        //comment có rating hoặc parentId mới cho tạo
        if (rating || parentId) {
            rs = await Comment.create({ content, rating, product, user });
        } else {
            throw new Error("Comment must have rating or parentId");
        }
    } catch (error) {
        throw error
    }

}
// Hàm để chọn số sao dựa trên phân phối 80% là 3-5 sao và 20% là 1-2 sao
const getRandomStars = () => {
    const rand = Math.random();
    if (rand < 0.8) {
        // 80% chọn ngẫu nhiên từ 3 đến 5
        if (rand < 0.6) {
            return Math.floor(Math.random() * 2) + 4; // 4 hoặc 5
        } else {
            return 3; // 3, 4, hoặc 5
        }
    } else {
        // 20% chọn ngẫu nhiên từ 1 đến 2
        return Math.floor(Math.random() * 2) + 1; // 1 hoặc 2
    }
};
export const randomRatingUser = async (req, res, next) => {
    try {

        const users = await User.find();
        for (let i = 0; i < 2; i++) {
            let arrStars = []
            for (let i = 0; i < 15; i++) {
                arrStars.push(getRandomStars())
            }
            const products = await Product.aggregate([{ $sample: { size: 15 } },
            { $project: { _id: 1, title: 1, totalRating: 1, ratings: 1 } } // Đảm bảo rằng 'ratings' được bao gồm
            ])
            for (let product of products) {
                const rating = arrStars.pop()
                if (rating) {
                    let gr = ['Tốt', 'Tuyệt vời', 'Tạm được']
                    let br = ['Tệ', 'Rất tệ', 'Không hài lòng']
                    if (rating > 2) {
                        await createComment({ rating, product: product._id, user: users[i]._id, content: gr[Math.floor(Math.random() * 3)] })
                    } else {
                        await createComment({ rating, product: product._id, user: users[i]._id, content: br[Math.floor(Math.random() * 3)] })
                    }
                }
            }
        }
        res.status(200).json({ data: products, arr });
    } catch (error) {
        next(error);
    }
}