import slugify from "slugify";
import { cloudinary, PRODUCT_FOLDER, uploadProductCloud, uploadToCloudinary } from "~/configs/cloudinary";
import Product from "~/models/Product";
const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, brand, discountPrice, category } = JSON.parse(req.body.document);
    if (!(title && description && price && brand && category && discountPrice)) throw new Error("Missing required fields");
    const slug = slugify(title, {
      lower: true,
      strict: true,
      locale: "vi",
      remove: /[*+~.()'"!:@]/g,
      trim: true,
    });
    const image = await uploadToCloudinary(req.file.buffer, PRODUCT_FOLDER)
    const product = await Product.create({
      title,
      description,
      price,
      slug,
      brand,
      discountPrice,
      category,
      primaryImage: { url: image.url, public_id: image.public_id }
    });
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
const createProductColor = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { color, quantity } = JSON.parse(req.body.document);
    if (!slug) throw new Error("Missing input");
    if (!(color && quantity)) throw new Error("Missing required fields");
    let product = await Product.findOne({ slug });
    if (!product) throw new Error("Product not found");
    const isColorExist = product.colors.find((item) => item.color.toLowerCase() === color.toLowerCase());
    if (isColorExist) throw new Error("Color already exist");
    console.log(typeof req.files)
    const pImage = await uploadToCloudinary(req.files?.primaryImage[0].buffer, PRODUCT_FOLDER)
    let images = []
    for (let image of req.files?.images) {
      const img = await uploadToCloudinary(image.buffer, PRODUCT_FOLDER)
      images.push({ url: img.url, public_id: img.public_id })
    }
    product.colors.push({
      color,
      quantity,
      primaryImage: { url: pImage.url, public_id: pImage.public_id }, images,
      images
    });
    product.quantity += quantity;
    await product.save();
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}
const updateProduct = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { title, description, price, brand, discountPrice, category } = JSON.parse(req.body.document);
    if (!(title && description && price && brand && category && discountPrice))
      throw new Error("Missing required fields");
    const product = await Product.findOne({ slug })
    if (!product) throw new Error("Product not found")
    let img = null
    if (req.file) {
      img = await uploadToCloudinary(req.file.buffer, PRODUCT_FOLDER)
      if (product.primaryImage && product.primaryImage.public_id) {
        await cloudinary.uploader.destroy(product.primaryImage.public_id);
      }
    }
    product.title = title || product.title;
    product.description = description || product.description;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.price = price || product.price;
    product.discountPrice = discountPrice || product.discountPrice;
    product.primaryImage = (img && { url: img.url, public_id: img.public_id }) || product.primaryImage;
    await product.save();
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}
const updateProductColor = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { colorId } = req.query
    const { color, quantity } = JSON.parse(req.body.document);
    if (!(color && quantity))
      throw new Error("Missing required fields");
    const product = await Product.findOne({ slug })
    const currentColor = product.colors.find(item => item._id.toString() === colorId)
    if (!product) throw new Error("Product not found")
    let img = null
    let images = []
    if (req.files?.primaryImage) {
      img = await uploadToCloudinary(req.files.primaryImage[0].buffer, PRODUCT_FOLDER)
      if (currentColor.primaryImage && currentColor.primaryImage.public_id) {
        await cloudinary.uploader.destroy(currentColor.public_id);
      }
    }
    if (req.files?.images) {
      for (let image of currentColor.images) {
        if ( image.public_id) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }
      for (let image of req.files?.images) {
        const img = await uploadToCloudinary(image.buffer, PRODUCT_FOLDER)
        images.push({ url: img.url, public_id: img.public_id })
      }
    }
    product.colors = product.colors.map((item) => {
      if (item._id.toString() === colorId) {
        item.color = color || item.color;
        item.quantity = quantity || item.quantity;
        item.primaryImage = img ? { url: img.url, public_id: img.public_id } : item.primaryImage;
        item.images = images.length > 0 ? images : item.images;
      }
      return item;
    });
    product.quantity = product.colors.reduce((acc, item) => acc + item.quantity, 0);
    await product.save();
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}
const getProduct = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).populate([
      {
        path: "comments",
        match: {
          parentId: null,
        },
        populate: [{
          path: "user",
          select: "firstName lastName avatar createdAt",
        }, {
          path: "replies",
          populate: [{
            path: "user",
            select: "firstName lastName avatar createdAt",
          }, {
            path: "replyOnUser",
            select: "firstName lastName"
          }]
        }]
      },
      {
        path: "category",
        foreignField: 'slug'
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
      formatQuery.colors = { $elemMatch: { color: { $in: colors } } };
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
        foreignField: 'slug'
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
    // const upload = uploadProductCloud.array("images", 10);
    // await new Promise((resolve, reject) => {
    //   // Hàm này là up ảnh lên cloundinary
    //   upload(req, res, async (err) => {
    //     if (err) reject(err);
    //     if (!req.files) reject("Missing images");
    //     resolve();
    //   });
    // });
    // product = await Product.findByIdAndUpdate(
    //   pid,
    //   {
    //     $push: {
    //       images: {
    //         $each: req.files.map((file) => ({
    //           url: file.path,
    //           public_id: file.filename,
    //         })),
    //       },
    //     },
    //   },
    //   { new: true }
    // );
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};
export { createProduct, createProductColor, getProduct, getAllProducts, uploadImagesProduct, updateProduct, updateProductColor };
