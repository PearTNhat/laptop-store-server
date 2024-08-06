import mongoose from "mongoose";

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        // required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    discountPrice: {
        type: Number,
        min: 0,
        validate: {
            validator: function (value) {
                return value <= this.price;
            },
            message: 'Discount price should be less than or equal to the original price.'
        }
    },
    discountPercentage: {
        type: Number,
        min: 0,
        max: 100, // Discount is a percentage
        default: function () {
            return ((this.price - this.discountPrice) / this.price) * 100;
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    quantity: {
        type: Number,
        default: 0,
    },
    soldQuantity: {
        type: Number,
        default: 0,
    },
    primaryImage:
    {
        url: {
            type: String,
        },
        public_id: {
            type: String,
        },
    }
    ,
    colors: [
        {
            color: {
                type: String,
            },
            quantity: {
                type: Number,
                default: 0,
            },
            soldQuantity: {
                type: Number,
                default: 0,
            },
            primaryImage:{
                url: {
                    type: String,
                },
                public_id: {
                    type: String,
                },
            },
            cappacity:{type: Array},
            images: [
                {
                    url: {
                        type: String,
                    },
                    public_id: {
                        type: String,
                    },
                }
            ],
        }
    ],
    totalRating: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
});
// nó sẻ lấy những comment có product == _id của product đang hiển thị
productSchema.virtual('ratings', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'product',
});
//Export the model
export default mongoose.model('Product', productSchema);