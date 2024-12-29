import mongoose from "mongoose";

// Declare the Schema of the Mongo model
var paymentSchema = new mongoose.Schema({
    orderId:{
        type:String,
        required:true,
    },
    payName:{
        type:String,
        required:true,
    },
    payType:{
        type:String,
        required:true,
    },
    total:{
        type:Number,
        required:true,
    },
},{
    timestamps:true
});

//Export the model
module.exports = mongoose.model('Payment', paymentSchema);