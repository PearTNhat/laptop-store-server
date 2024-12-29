import axios from 'axios';
import crypto from 'crypto';
import Order from '~/models/Order';
import User from '~/models/User';
import Product from '~/models/Product';
import Payment from '~/models/Payment';
const createOrder = async (data) => {
    const { products, total, address, phone, name, payInfo, orderBy } = data
    if (!products || !total) {
        throw new Error('Missing input');
    }
    //caap nhat lai so luong san pham
    for (let p of products) {
        let currentProduct = await Product.findById(p.product._id);
        currentProduct.colors = currentProduct.colors.map((color) => {
            if (color.color.toLowerCase() === p.color.toLowerCase()) {
                color.quantity -= p.quantity;
                color.soldQuantity += p.quantity;
            }
            return color;
        })
        currentProduct.quantity = currentProduct.colors.reduce((acc, cur) => acc + cur.quantity, 0)
        currentProduct.soldQuantity = currentProduct.colors.reduce((acc, cur) => acc + cur.soldQuantity, 0)
        await currentProduct.save();
    }
    const order = new Order({ products, total, address, phone, name, orderBy, payInfo });
    await order.save();

    // set cart = []
    await User.findByIdAndUpdate(orderBy, {
        $set: {
            carts: []
        }
    })
    return order;
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
        const filter = {
            orderBy: req.user._id
        }
        if (req.query.status) {
            filter.products = {}
            filter.products = { $elemMatch: { status: req.query.status } }
        }
        let orders = await Order.find(filter).populate([{
            path: "products.product",
        }]);
        if (req.query.status) {
            orders = orders.map(order => {
                order.products = order.products.filter(product => product.status == req.query.status);
                if (order.products.length === 0) {
                    return null;
                }
                return order;
            });
        }
        if (req.query.title) {
            orders = orders.map(order => {
                order.products = order.products.filter((p) => p.product.title.toLowerCase().trim().includes(req.query.title.toLowerCase().trim()));
                if (order.products.length === 0) {
                    return null;
                }
                return order;
            });
        }
        orders = orders.filter(Boolean);
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
const getAllOrders = async (req, res, next) => {
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
        // dùng filter để lọc nên k cần xóa key trong formatQuery
        if (req.query.status) {
            filter.products = {}
            filter.products = { $elemMatch: { status: req.query.status } }
        }
        // tìm kiếm id
        let orders = await Order.find(filter).populate([{
            path: "products.product",
        }, { path: "orderBy" }])
        if (req.query.status) {
            orders = orders.map(order => {
                order.products = order.products.filter(product => product.status == req.query.status);
                if (order.products.length === 0) {
                    return null;
                }
                return order;
            });
        }
        if (req.query.title) {
            orders = orders.map(order => {
                order.products = order.products.filter((p) => p.product.title.toLowerCase().trim().includes(req.query.title.toLowerCase().trim()));
                if (order.products.length === 0) {
                    return null;
                }
                return order;
            });
        }
        orders = orders.filter(Boolean);
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
const updateStatusOrderProduct = async (req, res, next) => {
    try {
        const { status } = req.body;
        const { orderId, productId } = req.params;
        if (!status) {
            throw new Error('Missing input');
        }
        let prevStatus;
        const order = await Order.findOne({ _id: orderId, "products.product": productId });
        const productNeedChanging = order.products.find(p => p.product.toString() === productId.toString());
        prevStatus = productNeedChanging.status;
        const product = await Product.findById(productId);
        if (!order) throw new Error('Order not found');
        await Order.findOneAndUpdate({ _id: orderId, "products.product": productId }, {
            $set: { "products.$.status": status }
        });
        if (prevStatus == -1 && status != -1) { // -1 , 0 1 // chuyển thành đặt hàng
            product.colors = product.colors.map(color => {
                if (color.color == productNeedChanging.color) {
                    color.quantity -= productNeedChanging.quantity;
                    color.soldQuantity += productNeedChanging.quantity;
                }
                return color;
            })
            product.quantity = product.colors.reduce((acc, cur) => acc + cur.quantity, 0);
            product.soldQuantity = product.colors.reduce((acc, cur) => acc + cur.soldQuantity, 0);
            await product.save();
        }
        if (prevStatus != -1 && status == -1) { // chuyển thành hủy hàng
            product.colors = product.colors.map(color => {
                if (color.color == productNeedChanging.color) {
                    color.quantity += productNeedChanging.quantity;
                    color.soldQuantity -= productNeedChanging.quantity;
                }
                return color;
            })
            product.quantity = product.colors.reduce((acc, cur) => acc + cur.quantity, 0);
            product.soldQuantity = product.colors.reduce((acc, cur) => acc + cur.soldQuantity, 0);
            await product.save();
        }
        res.status(200).json({ success: true, message: "Update status order successfully" });
    } catch (error) {
        next(error);

    }
}
const updateInfoOrder = async (req, res, next) => {
    try {
        const { name, phone, address } = req.body;
        const { orderId } = req.params;

        if (!name || !phone || !address || !orderId) {
            throw new Error('Missing input');
        }
        await Order.findByIdAndUpdate(orderId, {
            $set: { name, phone, address }
        });
        res.status(200).json({ success: true, message: "Update info order successfully" });
    } catch (error) {
        next(error);
    }
}
const deleteOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            throw new Error('Missing input');
        }
        await Order.findByIdAndDelete(orderId);
        res.status(200).json({ success: true, message: "Delete order successfully" });
    } catch (error) {
        next(error);

    }
}
const deleteProductOrder = async (req, res, next) => {
    try {
        const { productId, orderId } = req.params;
        if (!orderId || !productId) {
            throw new Error('Missing input');
        }
        await Order.findByIdAndUpdate(orderId, {
            $pull: { products: { product: productId } }
        });
        res.status(200).json({ success: true, message: "Delete product order successfully" });
    } catch (error) {
        next(error);
    }
}
const paymentOrder = async (req, res, next) => {
    try {
        const { products, total, address, phone, name, payName } = req.body;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const orderInfo = 'pay with MoMo';
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const redirectUrl = process.env.BASE_URL_FRONTEND;
        const ipnUrl = `${process.env.PUBLIC_URL}/api/order/payment/callback`;
        const requestType = "payWithMethod";
        const amount = total;
        const orderId = partnerCode + new Date().getTime();
        const requestId = orderId;
        const orderGroupId = '';
        const autoCapture = true;
        const lang = 'vi';

        const extraData = Buffer.from(JSON.stringify({ products, total, address, phone, name, orderBy: req.user._id })).toString('base64')
        const rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;
        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');
        //json object send to MoMo endpoint
        const requestBody = JSON.stringify({
            amount: total,
            partnerCode: partnerCode,
            partnerName: "Test",
            storeId: "MomoTestStore",
            requestId: requestId,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            lang: lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData,
            orderGroupId: orderGroupId,
            signature: signature
        });
        const options = {
            url: 'https://test-payment.momo.vn/v2/gateway/api/create',
            method: 'POST',
            data: requestBody,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        }
        const response = await axios(options);
        res.status(200).json({ success: true, data: response.data });
        // return res.redirect('http://localhost:5173');
    } catch (error) {
        next(error);
    }

}
const callbackPayment = async (req, res, next) => {
    try {
        const data = req.body;
        if (data.resultCode == '0') {
            const decodeExtraData = JSON.parse(Buffer.from(data.extraData, 'base64').toString('utf-8'));
            const payment = await Payment.create({
                orderId: data.orderId,
                payName: 'MoMo',
                total: data.amount,
                payType: data.payType
            });
            createOrder({ ...decodeExtraData, payInfo: payment._id });
        }
        return res.status(200).json({ message: 'success' });
    } catch (error) {
        next(error);
    }
}
// ham này check stastus của giao dịch
const transactionStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            throw new Error('Missing input');
        }
        const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&orderId=${orderId}&partnerCode=${process.env.MOMO_PARTNER_CODE}&requestId=${orderId}`;
        const signature = crypto.createHmac('sha256', process.env.MOMO_SECRET_KEY)
            .update(rawSignature)
            .digest('hex')
        const requestBody = JSON.stringify({
            requestId: orderId,
            orderId: orderId,
            partnerCode: process.env.MOMO_PARTNER_CODE,
            lang: 'vi',
            signature
        });
        const options = {
            url: 'https://test-payment.momo.vn/v2/gateway/api/query',
            method: 'POST',
            data: requestBody,
            headers: {
                'Content-Type': 'application/json',
            }
        }
        const response = await axios(options);
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        next(error);
    }
}
export {
    createOrder,
    getOrdersUser,
    getAllOrders,
    updateStatusOrderProduct,
    updateInfoOrder,
    deleteOrder,
    deleteProductOrder,
    paymentOrder,
    callbackPayment,
    transactionStatus
};