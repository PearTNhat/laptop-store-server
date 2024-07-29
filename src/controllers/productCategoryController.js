import ProductCategory from '~/models/ProductCategory';

const getAllProductCategories = async (req, res, next) => {
    try {
        const productCategories = await ProductCategory.find();
        res.status(200).json({success: true, data:productCategories});
    } catch (error) {
        next(error);
    }
}
const createProductCategory = async (req, res, next) => {
    try {
        const {title} = req.body;
        const productCategory = new ProductCategory({title});
        await productCategory.save();
        res.status(201).json({success: true, mes: 'Create product category successfully'});
    } catch (error) {
        next(error);
    }
}
const updateProductCategory = async (req, res, next) => {
    try {
        const {pcid} = req.params;
        const {title} = req.body;
        if(!title){
            throw new Error('Title is required');
        }
        await ProductCategory.findByIdAndUpdate({_id: pcid}, {title});
        res.status(200).json({success: true, mes: 'Update product category successfully'});
    } catch (error) {
        next(error);
    }
}
const deleteProductCategory = async (req, res, next) => {
    try {
        const {pcid} = req.params;
        await ProductCategory.findByIdAndDelete(pcid);
        res.status(200).json({success: true, mes: 'Delete product category successfully'});
    }catch (error) {
        next(error);
    }
}
export {createProductCategory, getAllProductCategories, updateProductCategory, deleteProductCategory};