import mongoose from "mongoose";

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true,
    },
    slug:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },
    description:{
        type:String,
        required:true,
    },
    brand:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
    },
    quantity:{
        type:Number,
        default:0,
    },
    soldQuantity:{
        type:Number,
        default:0,
    },
    images:[
        {
            url:{
                type:String,
            },
            public_id:{
                type:String,
            },
        }
    ],
    color:{
        type:String,
        enum:['Black','White','Red','Green','Blue'], // Chỉ tồn tại những màu trong này
    },
    totalRating:{
        type:Number,
        default:0,
    },
},{
    timestamps:true,
    toJSON:{virtuals:true},
});
// nó sẻ lấy những comment có product == _id của product đang hiển thị
productSchema.virtual('ratings',{
    ref:'Comment',
    localField:'_id',
    foreignField:'product',
});
//Export the model
export default mongoose.model('Product', productSchema);