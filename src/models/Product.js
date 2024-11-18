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
        type: Array,
        // required: true,
    },
    brand: {
        type: String,
        ref: 'Brand',
    },
    price: {
        type: Number,
    },
    discountPrice: {
        type: Number,
        min: 0,
        validate: {
            validator: function (value) {
                if (!this.price) return true
                return value <= this.price;
            },
            message: 'Discount price should be less than or equal to the original price.'
        }
    },
    // category: {
    //     type: String,
    //     ref: 'ProductCategory',
    // },
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
    },
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
            primaryImage: {
                url: {
                    type: String,
                },
                public_id: {
                    type: String,
                },
            },
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
    // thuộc dòng sản phẩm nào
    series: {
        type: String,
        ref: 'Series',
    },
    configs: {
        cpu: {
            value: String,
            name: {
                type: String,
                default: 'CPU',
            },
            priority: {
                type: Number,
                default: 1
            },
            code: {
                type: String,
                default: 'cpu',
            },
        },
        ram: {
            value: String,
            name: {
                type: String,
                default: 'RAM',
            },
            priority: {
                type: Number,
                default: 4
            },
            code: {
                type: String,
                default: 'ram',
            },
        },
        hardDrive: {
            value: String,
            name: {
                type: String,
                default: 'Ổ cứng',
            },
            priority: {
                type: Number,
                default: 5
            },
            code: {
                type: String,
                default: 'hard-drive',
            },
        },
        graphicCard: {
            value: String,
            name: {
                type: String,
                default: 'Card đồ họa',
            },
            priority: {
                type: Number,
                default: 2
            },
            code: {
                type: String,
                default: 'graphic-card',
            },
        },
        madeIn: {
            value: String,
            name: {
                type: String,
                default: "Xuất xứ",
            },
            priority: {
                type: Number,
                default: 1
            },
            code: {
                type: String,
                default: 'made-in',
            },
        },
        weight: {
            value: String,
            name: {
                type: String,
                default: 'Trọng lượng',
            },
            priority: {
                type: Number,
                default: 10
            },
            code: {
                type: String,
                default: 'weight',
            },
        },
        operatingSystem: {
            value: String,
            name: {
                type: String,
                default: 'Hệ điều hành',
            },
            priority: {
                type: Number,
                default: 7
            },
            code: {
                type: String,
                default: 'operating-system',
            },
        },
        size: {
            value: String,
            name: {
                type: String,
                default: 'Kích thước',
            },
            priority: {
                type: Number,
                default: 8
            },
            code: {
                type: String,
                default: 'size',
            },
        },
        need: {
            value: String,
            name: {
                type: String,
                default: 'Nhu cầu',
            },
            priority: {
                type: Number,
                default: 11
            },
            code: {
                type: String,
                default: 'need',
            },
        },
        yearOfLaunch: {
            value: String,
            name: {
                type: String,
                default: 'Năm ra mắt',
            },
            priority: {
                type: Number,
                default: 13
            },
            code: {
                type: String,
                default: 'year-of-launch',
            },
        },
        screen: {
            value: String,
            name: {
                type: String,
                default: "Màn hình",
            },
            priority: {
                type: Number,
                default: 3
            },
            code: {
                type: String,
                default: 'screen',
            },
        },
        battery: {
            value: String,
            name: {
                type: String,
                default: 'Pin',
            },
            priority: {
                type: Number,
                default: 9
            },
            code: {
                type: String,
                default: 'battery',
            },
        },
        connectionPort: {
            value: String,
            name: {
                type: String,
                default: 'Cổng kết nối',
            },
            priority: {
                type: Number,
                default: 6
            },
            code: {
                type: String,
                default: 'connection-port',
            },
        }
    },
    totalRating: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
});
// nó sẻ lấy những comment có product == _id của product đang hiển thị
productSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'product',
});
//Export the model
export default mongoose.model('Product', productSchema);