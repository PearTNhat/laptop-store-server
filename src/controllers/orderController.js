import Order from '~/models/Order';
import User from '~/models/User';
import Product from '~/models/Product';


const createOrder = async (req, res, next) => {
    try {
        const { products, total } = req.body;
        if (!products || !total) {
            throw new Error('Missing input');
        }
        console.log(req.user)
        const myCarts = await User.findByIdAndUpdate(req.user._id,{
            $set: {
                carts: []
            }
        })
   
        // kiem tra hang co trong cart khong

        
        //caap nhat lai so luong san pham
        for (let p of products) {
            let currentProduct =await Product.findById(p.product._id);
            currentProduct.colors =currentProduct.colors.map((color) => {
                console.log(color.color.toLowerCase(), p.color)
                if(color.color.toLowerCase() === p.color.toLowerCase()){
                    color.quantity -= p.quantity;
                    color.soldQuantity += p.quantity;
                }
                return color;
            })
            currentProduct.quantity = currentProduct.colors.reduce((acc, cur) => acc + cur.quantity, 0)
            currentProduct.soldQuantity = currentProduct.colors.reduce((acc, cur) => acc + cur.soldQuantity, 0)
            await currentProduct.save();
        }
        const order = new Order({ products, total, orderBy: req.user._id });
        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
}
const getOrdersUser = async (req, res, next) => {
    try {
        //1A filter
        const queryObj = { ...req.query };
        const excludeFields = ["page", "sort", "limit", "fields"];
        excludeFields.forEach((el) => delete queryObj[el]);
    
        //1B Advanced filtering
        // price[gte]=123 & price[lte]=123 => {price: {gte: 123, lte: 123}}
        let queryStr = JSON.stringify(queryObj);
        //{price: {gte: 1000}, rating: {gt: 4.5}} => {price: {$gte: 1000}, rating: {$gt: 4.5}}
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne)\b/g, (match) => `$${match}`);
        let formatQuery = JSON.parse(queryStr);
        // filter title
         // dấu cộng để conver str to number
         const page = +req.query.page || 1;
         const limit = +req.query.limit || 10;
         const skip = (page - 1) * limit;
        const filter = {}
        if(req.query.status){
            filter.status = req.query.status;
        }
        let orders =await Order.find(filter).populate([{
            path: "products.product",
          }]);
        if (req.query.title) {
            orders = orders.filter((order) => order.products.some((p) => p.product.title.toLowerCase().includes(req.query.title.toLowerCase())));
        }
        orders = orders.slice(skip, skip + limit);
        const totalDocument = orders.length;
        
        res.status(200).json({
          success: true,
          counts: totalDocument,
          data: orders,
        });
      } catch (error) {
        next(error);
      }
}
export { createOrder,getOrdersUser };