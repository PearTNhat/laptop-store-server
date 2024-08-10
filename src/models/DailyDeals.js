import mongoose from 'mongoose';

// Declare the Schema of the Mongo model
var dailyDealsSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
},{
    timestamps:true
});

//Export the model
export default mongoose.model('DailyDeals', dailyDealsSchema);