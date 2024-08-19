import Comment from "~/models/Comment";
import Product from "~/models/Product";
import { handleUpdateTotalProductRating } from "~/utils/helper";

const createComment = async (req, res, next) => {
  try {
    const { rating, product, parentId } = req.body;
    if (!product) {
      throw new Error("Missing input");
    }
    if (rating < 0 || rating > 5) {
      throw new Error("Rating must be between 0 and 5");
    }
    if (rating && parentId) {
      throw new Error(
        "Comment can not have rating and parentId at the same time"
      );
    }
    // Kiểm tra xem đã dánh giá hay chưa
    if (rating) {
      const isRated = await Comment.findOne({
        product,
        user: req.user._id,
        rating: { $exists: true },
      });
      if (isRated) {
        throw new Error("You have already rated this product");
      }
      // nếu chưa đánh gía thì update rating cho product
      await handleUpdateTotalProductRating({
        productId: req.body.product,
        type: "CREATE",
        rating,
      });
    }
    let rs
    if (rating || parentId) {
      rs = await Comment.create({ ...req.body, user: req.user._id });
    } else {
      throw new Error("Comment must have rating or parentId");
    }
    res.status(201).json({
      success: true,
    data:rs
    });
  } catch (error) {
    next(error);
  }
};
const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      throw new Error("You are not the owner of this comment");
    }
    if (req.body.rating && comment.parentId) {
        throw new Error(
          "This comment dose not have rating, please remove rating"
        );
      }
    let newRating;
    if (req.body.rating  ) {
      newRating = req.body.rating;
      if (newRating < 0 || newRating > 5) {
        throw new Error("Rating must be between 0 and 5");
      }
      // cập nhật số đánh giá
      // cập nhật thì sẻ trừ đi số lượng đánh giá cũ
      await handleUpdateTotalProductRating({
        productId: comment.product,
        type: "UPDATE",
        rating: newRating - comment.rating,
      });
    } else {
      newRating = comment.rating;
    }
    await comment.updateOne({ rating: newRating, content:req.body.content });
    res.status(200).json({
      success: true,
      data:{
        _id:comment._id,
        rating:newRating,
        content:req.body.content
      }
    });
  } catch (error) {
    next(error);
  }
};
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      throw new Error("You are not the owner of this comment");
    }
    // cập nhật số đánh giá
    if (comment.rating) {
      await handleUpdateTotalProductRating({
        productId: comment.product,
        type: "DELETE",
        rating: -comment.rating,
      });
    }
    const rs = await Comment.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ parentId: req.params.id });
    res.status(200).json({
      success: true,
      data: rs,
    });
  } catch (error) {
    next(error);
  }
};
export { createComment, updateComment, deleteComment };
