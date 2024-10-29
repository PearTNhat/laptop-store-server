import Coupon from "~/models/Coupon";

const getAllCoupons = async (req, res, next) => {
    try {
        const coupon = await Coupon.find();
        res.status(200).json({success: true, data:coupon});
    } catch (error) {
        next(error);
    }
}
const createCoupon = async (req, res,next) => {
    try {
        // expiry : nhận vào sẻ là ngày hết hạn của coupon
        let {name, discount, expiry,code} = req.body;
        if(!name || !discount || !expiry || !code){
            throw new Error('Missing input');
        }
        expiry =Date.now() +expiry*24*60*60*1000;
        const coupon = new Coupon({name, discount, expiry,code});
        await coupon.save();
        res.status(201).json({success: true, data:coupon});
    } catch (error) {
        next(error);
    }
}
const updateCoupon = async (req, res, next) => {
    try {
        const {cid} = req.params;
        if(!cid || req.body.length === 0){ 
            throw new Error('Missing input');
        }
        if(req.body.expiry){
            req.body.expiry = Date.now() + req.body.expiry*24*60*60*1000;
        }
       const updatedCoupon  = await Coupon.findByIdAndUpdate({_id: cid},{...req.body},{new:true} );
        res.status(200).json({success: true, data:updatedCoupon});
    } catch (error) {
        next(error);
    }
}
const deleteCoupon = async (req, res, next) => {   
    try {
        const {cid} = req.params;
        if(!cid){
            throw new Error('Missing input');
        }
        const coupon = await Coupon.findByIdAndDelete(cid);
        res.status(200).json({success: true, data:coupon})   ;
    }catch (error) {
        next(error);
    }
}
export {createCoupon,updateCoupon,deleteCoupon, getAllCoupons};