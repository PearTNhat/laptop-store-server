import mongoose from "mongoose";

// Declare the Schema of the Mongo model
var seriesSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    image:{
        url:String,
        public_id:String,
    },
    brand:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brands',
        required:true,
    },
},{
    timestamps:true
});

//Export the model
module.exports = mongoose.model('Series', seriesSchema);