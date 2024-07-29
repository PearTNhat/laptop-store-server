import mongoose from 'mongoose';

// Declare the Schema of the Mongo model
var CommentSchema = new mongoose.Schema({
    rating:{
        type:Number,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product'
    },
    parentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Comment',
    },
    replyOnUser:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    content:{
        type:String,
        required:true,
    },
},{timestamps:true , toJSON: { virtuals: true }});

// Trong 1 comment sẻ có 1 replies nó sẻ có những comment có parentId == _id của comment đang hiển thị đó
CommentSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "parentId",
  });
//Export the model
export default mongoose.model('Comment', CommentSchema);