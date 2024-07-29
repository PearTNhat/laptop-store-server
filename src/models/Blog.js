import mongoose from 'mongoose';
// Declare the Schema of the Mongo model
var blogSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    numberViews:{
        type:Number,
        default:0,
    },
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
        }
    ],
    disklikes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
        }
    ],
    images:[
        {
            type:String,
            default:"https://st2.depositphotos.com/1420973/6409/i/450/depositphotos_64095317-stock-photo-blog-concept-cloud-chart-print.jpg"
        }
    ],
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
},{
    timestamps:true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

//Export the model
module.exports = mongoose.model('User', blogSchema);