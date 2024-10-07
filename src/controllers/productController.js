import slugify from "slugify";
import { uploadProductCloud } from "~/configs/cloudinary";
import Product from "~/models/Product";
const createProduct = async (req, res, next) => {
  try {
    if (Object.keys(req.body).length == 0) {
      throw new Error("Missing input");
    }
    req.body.slug = slugify(req.body.title, {
      lower: true,
      strict: true,
      locale: "vi",
      remove: /[*+~.()'"!:@]/g,
      trim: true,
    });

    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
const getProduct = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({slug}).populate([
      {
        path: "comments",
        match: {
          parentId: null,
        },
        populate:[{
          path: "user",
          select: "firstName lastName avatar createdAt",
        },{
          path: "replies",
          populate:[{
            path: "user",
            select: "firstName lastName avatar createdAt",
          },{
            path: "replyOnUser",
            select: "firstName lastName"
          }]
        }]
      },
      {
        path:"category",
        foreignField:'slug'
      }
    ]);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
const getAllProducts = async (req, res, next) => {
  try {
    //1A filter
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    //1B Advanced filtering
    // price[gte]=123 & price[lte]=123 => {price: {gte: 123, lte: 123}}
    let queryStr = JSON.stringify(queryObj);
    //{price: {gte: 1000}, rating: {gt: 4.5}} => {price: {$gte: 1000}, rating: {$gt: 4.5}}
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne)\b/g, (match) => `$${match}`);
    let formatQuery = JSON.parse(queryStr);
    // filter color
    if (req.query.colors) {
      const colors = formatQuery.colors.split(',').map((color) => new RegExp(color, "i"));
      formatQuery.colors = {$elemMatch:{color: {$in: colors}} };
    }
    // filter title
    if (req.query.title) {
      formatQuery.title = { $regex: req.query.title, $options: "i" };
    }
    let queryCommand = Product.find(formatQuery);

    // select fields
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      queryCommand = queryCommand.select(fields);
    } else {
      queryCommand = queryCommand.select("-__v");
    }
    // sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      queryCommand = queryCommand.sort(sortBy);
    }
    // dấu cộng để conver str to number
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;
    queryCommand = queryCommand
      .skip(skip)
      .limit(limit)
      .populate([{
        path: "category",
        foreignField:'slug'
      }])
    const [totalDocuments, products] = await Promise.all([
      Product.find(formatQuery).countDocuments(),
      queryCommand.skip(skip).limit(limit),
    ]);

    res.status(200).json({
      success: true,
      counts: totalDocuments,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
const uploadImagesProduct = async (req, res, next) => {
  try {
    const { pid } = req.params;
    if (!pid) throw new Error("Missing product id");
    let product = await Product.findById(pid);
    if (!product) throw new Error("Product not found");
    const upload = uploadProductCloud.array("images", 10);
    await new Promise((resolve, reject) => {
      // Hàm này là up ảnh lên cloundinary
      upload(req, res, async (err) => {
        if (err) reject(err);
        if (!req.files) reject("Missing images");
        resolve();
      });
    });
    product = await Product.findByIdAndUpdate(
      pid,
      {
        $push: {
          images: {
            $each: req.files.map((file) => ({
              url: file.path,
              public_id: file.filename,
            })),
          },
        },
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};
export { createProduct, getProduct, getAllProducts,uploadImagesProduct };
