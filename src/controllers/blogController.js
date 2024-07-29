import BlogCategory from "~/models/BlogCategory";
const getAllBlogs= async (req, res, next) => {
    try {
        const blogs = await BlogCategory.find();
        res.status(200).json({success: true, data: blogs});
    } catch (error) {
        next(error);
    }
}
const getBlog= async (req, res, next) => {
    try {
        const {bid} = req.params;
        const blog = await BlogCategory.findById(bid);
        if(!blog){
            throw new Error('Blog not found');
        }
        res.status(200).json({success: true, data: blog});
    } catch (error) {
        next(error);
    }
}
const createBlog=async (req, res, next) => {
    try {
        const {title, description, category,images} = req.body;
        if(!title || !description || !category){
            throw new Error('Title, description and category are required');
        }
        const blog = new BlogCategory({title, description, category,images, author: req.user._id});
        await blog.save();
        res.status(201).json({success: true, mes: 'Create blog category successfully'});
    } catch (error) {
        next(error);
    }
}
const updateBlog= async (req, res, next) => {
    try {
        const {bid} = req.params;
        const {title, description, category,images} = req.body;
        if(!title || !description || !category){
            throw new Error('Title, description and category are required');
        }
        await BlogCategory.findByIdAndUpdate({_id: bid}, {title, description, category,images});
        res.status(200).json({success: true, mes: 'Update blog category successfully'});
    } catch (error) {
        next(error);
    }
}
const deleteBlog= async (req, res, next) => {
    try {
        const {bid} = req.params;
        await BlogCategory.findByIdAndDelete(bid);
        res.status(200).json({success: true, mes: 'Delete blog category successfully'});
    }catch (error) {
        next(error);
    }
}
const likeBlog = async (req, res,next) => {
    try {
        const {bid} = req.params;
        const blog = await BlogCategory.findById(bid);
        if(!blog){
            throw new Error('Blog not found');
        }
        const isLiked = blog.likes.find(id => id.toString() === req.user._id.toString());
        const isDiskliked = blog.disklikes.find(id => id.toString() === req.user._id.toString());
        if(isDiskliked){
            blog.diskikes = blog.disklikes.filter(id => id.toString() !== req.user._id.toString());      
        }
        if(isLiked){
            blog.likes = blog.likes.filter(id => id.toString() !== req.user._id.toString());
        }else{
            blog.likes.push(req.user._id);
        }
        await blog.save();
        res.status(200).json({success: true, message: 'success'});
    } catch (error) {
        next(error);
    }
}
const disklikeBlog= async (req, res,next) => {
    try {
        const {bid} = req.params;
        const blog = await BlogCategory.findById(bid);
        if(!blog){
            throw new Error('Blog not found');
        }
        const isLiked = blog.likes.find(id => id.toString() === req.user._id.toString());
        const isDiskliked = blog.disklikes.find(id => id.toString() === req.user._id.toString());
        if(isLiked){
            blog.likes = blog.likes.filter(id => id.toString() !== req.user._id.toString());
        }
        if(isDiskliked){
            blog.dislikes = blog.dislikes.filter(id => id.toString() !== req.user._id.toString());
        }else{
            blog.dislikes.push(req.user._id);
        }
        await blog.save();
        res.status(200).json({success: true, message: 'success'});
    } catch (error) {
        next(error);
    }
}
export {getAllBlogs,getBlog,createBlog,updateBlog,likeBlog, disklikeBlog,deleteBlog};