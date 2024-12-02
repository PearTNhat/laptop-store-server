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
    features:{
        type: Array,
        required: true,
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
        aiChip: {
            description: String,
            name: {
                type: String,
                default: 'Chip AI',
            },
            priority: {
                type: Number,
                default: 0
            }
        },
        cpu: {
            value: String,
            description: String,
            name: {
                type: String,
                default: 'CPU',
            },
            priority: {
                type: Number,
                default: 1
            }
        },
        graphicCard: {
            value: String,
            description: String,
            name: {
                type: String,
                default: 'Card đồ họa',
            },
            priority: {
                type: Number,
                default: 2
            }
        },
        ram: {
            value: String,
            description: String,
            name: {
                type: String,
                default: 'RAM',
            },
            priority: {
                type: Number,
                default: 3
            }
        },
        hardDrive: {
            value: String,
            description: String,
            name: {
                type: String,
                default: 'Ổ cứng',
            },
            priority: {
                type: Number,
                default: 4
            }
        },
        refreshRate:{
            description: String,
            name: {
                type: String,
                default: 'Tần số quét',
            },
            priority: {
                type: Number,
                default: 5
            }
        },
        panel:{
            description: String,
            name: {
                type: String,
                default: 'Chât liệu tấm nền',
            },
            priority: {
                type: Number,
                default: 6
            }
        },
        screenTechnology:{
            description: String,
            name: {
                type: String,
                default: 'Công nghệ màn hình',
            },
            priority: {
                type: Number,
                default: 7
            }
        },
        screen: {
            value: String,
            description: String,
            name: {
                type: String,
                default: "Kích thước màn hình",
            },
            priority: {
                type: Number,
                default: 8
            }
        },
        resolution: {
            description: String,
            name: {
                type: String,
                default: 'Độ phân giải màn hình',
            },
            priority: {
                type: Number,
                default: 8
            }
        },
        audioTechnology:{
            description: String,
            name: {
                type: String,
                default: 'Công nghệ âm thanh',
            },
            priority: {
                type: Number,
                default: 9
            }
        },
        connectionPort: {
            description: String,
            name: {
                type: String,
                default: 'Cổng kết nối',
            },
            priority: {
                type: Number,
                default: 10
            }
        },
        cardReader: {
            description: String,
            name: {
                type: String,
                default: 'Khe đọc thẻ nhớ',
            },
            priority: {
                type: Number,
                default: 10
            }
        },
        bluetooth:{
            description: String,
            name: {
                type: String,
                default: 'Bluetooth',
            },
            priority: {
                type: Number,
                default: 11
            }
        },
        material:{
            description: String,
            name: {
                type: String,
                default: 'Chất liệu',
            },
            priority: {
                type: Number,
                default: 12
            }
        },
        
        size: {
            value: String,
            description: String,
            name: {
                type: String,
                default: 'Kích thước',
            },
            priority: {
                type: Number,
                default: 13
            }
        },
        weight: {
            value: String,
            description: String,
            name: {
                type: String,
                default: 'Trọng lượng',
            },
            priority: {
                type: Number,
                default: 14
            }
        },
        specialFeature: {
            description: String,
            name: {
                type: String,
                default: 'Tính năng đặc biệt',
            },
            priority: {
                type: Number,
                default: 15
            }
        },
        keyboardLight: {
            description: String,
            name: {
                type: String,
                default: 'Loại đèn bàn phím',
            },
            priority: {
                type: Number,
                default: 16
            }
        },
        security: {
            description: String,
            name: {
                type: String,
                default: 'Bảo mật',
            },
            priority: {
                type: Number,
                default: 17
            }
        },
        webcam: {
            description: String,
            name: {
                type: String,
                default: 'WebCam',
            },
            priority: {
                type: Number,
                default: 18
            }
        },
        operatingSystem: {
            description: String,
            name: {
                type: String,
                default: 'Hệ điều hành',
            },
            priority: {
                type: Number,
                default: 19
            }
        },
        battery: {
            value: String,
            description: String,
            name: {
                type: String,
                default: 'Pin',
            },
            priority: {
                type: Number,
                default: 20
            }
        },
        need: {
            description: String,
            name: {
                type: String,
                default: 'Nhu cầu',
            },
            priority: {
                type: Number,
                default: 21
            }
        },
        madeIn: {
            value: String,
            description: String,
            name: {
                type: String,
                default: "Xuất xứ",
            },
            priority: {
                type: Number,
                default: 22
            }
        },
        yearOfLaunch: {
            value: String,
            description: String,
            name: {
                type: String,
                default: 'Năm ra mắt',
            },
            priority: {
                type: Number,
                default: 23
            }
        },
       
       
    },
    totalRating: {
        type: Number,
       // default: 0,
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