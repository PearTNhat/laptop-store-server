import BlogCategory from '~/models/BlogCategory';

const getAllBlogCategories = async (req, res, next) => {
    try {
        const blogCategories = await BlogCategory.find();
        res.status(200).json({success: true, data:blogCategories});
    } catch (error) {
        next(error);
    }
}
const createBlogCategory = async (req, res, next) => {
    try {
        const {title} = req.body;
        const blogCategory = new BlogCategory({title});
        await blogCategory.save();
        res.status(201).json({success: true, mes: 'Create blog category successfully'});
    } catch (error) {
        next(error);
    }
}
const updateBlogCategory = async (req, res, next) => {
    try {
        const {bcid} = req.params;
        const {title} = req.body;
        if(!title){
            throw new Error('Title is required');
        }
        await BlogCategory.findByIdAndUpdate({_id: bcid},{title} );
        res.status(200).json({success: true, mes: 'Update blog category successfully'});
    } catch (error) {
        next(error);
    }
}
const deleteBlogCategory = async (req, res, next) => {
    try {
        const {bcid} = req.params;
        await BlogCategory.findByIdAndDelete(bcid);
        res.status(200).json({success: true, mes: 'Delete blog category successfully'});
    }catch (error) {
        next(error);
    }
}
export {createBlogCategory, getAllBlogCategories, updateBlogCategory, deleteBlogCategory};