import slugify from "slugify";
import { cloudinary, uploadBlogCloud } from "~/configs/cloudinary";
import Blog from "~/models/Blog";
const selectInfoUser = "firstName lastName";
const getAllBlogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find().populate([
        {
          path: "author",
          select: selectInfoUser,
        },
        {
          path: "category",
          select: "_id title",
        },
        {
          path: "likes",
          select: selectInfoUser,
        },
        {
          path: "dislikes",
          select: selectInfoUser,
        },
      ]);;
    res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    next(error);
  }
};

const getBlog = async (req, res, next) => {
  try {
    const { bid } = req.params;
    const blog = await Blog.findById(bid).populate([
      {
        path: "author",
        select: selectInfoUser,
      },
      {
        path: "category",
        select: "_id title",
      },
      {
        path: "likes",
        select: selectInfoUser,
      },
      {
        path: "dislikes",
        select: selectInfoUser,
      },
    ]);
    if (!blog) {
      throw new Error("Blog not found");
    }
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};
const createBlog = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      throw new Error("Title, description and category are required");
    }
    const slug = slugify(req.body.title, {
      lower: true,
      strict: true,
      locale: "vi",
      remove: /[*+~.()'"!:@]/g,
      trim: true,
    });
    const blog = new Blog({
      title,
      description,
      slug,
      category,
      author: req.user._id,
    });
    await blog.save();
    res
      .status(201)
      .json({ success: true, mes: "Create blog category successfully" });
  } catch (error) {
    next(error);
  }
};
const updateBlog = async (req, res, next) => {
  try {
    const { bid } = req.params;
    // k cho cập nhật author
    delete req.body.author;
    if (Object.keys(req.body).length === 0) {
      throw new Error("Title, description and category are required");
    }
    req.body.slug = slugify(req.body.title, {
      lower: true,
      strict: true,
      locale: "vi",
      remove: /[*+~.()'"!:@]/g,
      trim: true,
    });
    await Blog.findByIdAndUpdate({ _id: bid }, { ...req.body });
    res
      .status(200)
      .json({ success: true, mes: "Update blog category successfully" });
  } catch (error) {
    next(error);
  }
};
const uploadImageBlog = async (req, res, next) => {
  try {
    const {bid} = req.params;
    if(!bid) throw new Error("Missing blog id");
    const blog = await Blog.findById({_id:bid});
    const upload = uploadBlogCloud.single('image')
    if(!blog) throw new Error("Blog not found");
    if(blog.image?.public_id !== "public_id"){
      await cloudinary.uploader.destroy(blog.image.public_id);
    }
    upload(req,res,async (err)=>{
      if(err) throw new Error(err);
      if(!req.file) throw new Error("Missing image");
      blog.image.public_id = req.file.filename;
      blog.image.url = req.file.path;
      await blog.save();
    })
    res.status(200).json({success:true,data:blog});
  } catch (error) {
    next(error);
  }
}
const deleteBlog = async (req, res, next) => {
  try {
    const { bid } = req.params;
    await Blog.findByIdAndDelete(bid);
    res
      .status(200)
      .json({ success: true, mes: "Delete blog category successfully" });
  } catch (error) {
    next(error);
  }
};
const likeBlog = async (req, res, next) => {
  try {
    const { bid } = req.params;
    const blog = await Blog.findById(bid);
    if (!blog) {
      throw new Error("Blog not found");
    }
    const isLiked = blog.likes.find(
      (id) => id.toString() === req.user._id.toString()
    );
    const isDisliked = blog.dislikes.find(
      (id) => id.toString() === req.user._id.toString()
    );
    if (isDisliked) {
      blog.dislikes = blog.dislikes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    }
    if (isLiked) {
      blog.likes = blog.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      blog.likes.push(req.user._id);
    }
    await blog.save();
    res.status(200).json({ success: true, message: "success" });
  } catch (error) {
    next(error);
  }
};
const dislikeBlog = async (req, res, next) => {
  try {
    const { bid } = req.params;
    const blog = await Blog.findById(bid);
    if (!blog) {
      throw new Error("Blog not found");
    }
    const isLiked = blog.likes.find(
      (id) => id.toString() === req.user._id.toString()
    );
    const isDisliked = blog.dislikes.find(
      (id) => id.toString() === req.user._id.toString()
    );
    if (isLiked) {
      blog.likes = blog.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    }
    if (isDisliked) {
      blog.dislikes = blog.dislikes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      blog.dislikes.push(req.user._id);
    }
    await blog.save();
    res.status(200).json({ success: true, message: "success" });
  } catch (error) {
    next(error);
  }
};
export {
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  likeBlog,
  dislikeBlog,
  deleteBlog,
  uploadImageBlog
};
