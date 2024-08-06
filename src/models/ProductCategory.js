import mongoose from 'mongoose';

// Declare the Schema of the Mongo model
var productCategorySchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    slug:{
        type:String,
        required:true,
        unique:true,
    },
    icon: String,
    brands:[{
        type:String,
    }]
},{
    timestamps:true
});

//Export the model
export default mongoose.model('ProductCategory', productCategorySchema);