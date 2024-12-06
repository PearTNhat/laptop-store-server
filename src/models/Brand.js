import mongoose from "mongoose";

// Declare the Schema of the Mongo model
var brandSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true,
    },
    image:{
        url:String,
        public_id:String,
    },
    slug:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },
},{
    timestamps:true
});

//Export the model
module.exports = mongoose.model('Brand', brandSchema);