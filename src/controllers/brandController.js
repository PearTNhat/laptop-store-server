import Brand from '~/models/Brand';

const getAllBrand = async (req, res, next) => {
    try {
        const brand = await Brand.find();
        res.status(200).json({success: true, data:brand});
    } catch (error) {
        next(error);
    }
}
const createBrand= async (req, res, next) => {
    try {
        const {title} = req.body;
        const brand = new Brand({title});
        await brand.save();
        res.status(201).json({success: true, mes: 'Create blog category successfully'});
    } catch (error) {
        next(error);
    }
}
const updateBrand = async (req, res, next) => {
    try {
        const {bid} = req.params;
        const {title} = req.body;
        if(!title){
            throw new Error('Title is required');
        }
        await Brand.findByIdAndUpdate({_id: pid},{title} );
        res.status(200).json({success: true, mes: 'Update blog category successfully'});
    } catch (error) {
        next(error);
    }
}
const deleteBrand = async (req, res, next) => {
    try {
        const {bid} = req.params;
        await Brand.findByIdAndDelete(bcid);
        res.status(200).json({success: true, mes: 'Delete blog category successfully'});
    }catch (error) {
        next(error);
    }
}
export {createBrand,updateBrand,deleteBrand, getAllBrand};