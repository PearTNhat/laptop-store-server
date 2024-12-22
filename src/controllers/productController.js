import mongoose from "mongoose";
import slugify from "slugify";
import { cloudinary,
   PRODUCT_FOLDER, uploadToCloudinary } from "~/configs/cloudinary";
import Product from "~/models/Product";
import { getNeedingProduct } from "~/utils/api";
const searchDesc = { // cái này mới làm 1 user nên nó sẽ lưu lại cái desc cũ và need cũ, nhiều user sẻ lưu id và check
  desc:"",
  need:""
}
const createProduct = async (req, res, next) => {
  try {
    const { title, description, price,features,brand,series, discountPrice,configs} = JSON.parse(req.body.document);
    if (!(title && description && price  && discountPrice && features)) throw new Error("Missing required fields");
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
      brand,
      series,
      slug,
      discountPrice,
      features,
      configs,
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
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ error: "Quantity must be a valid non-negative number." });
    }
    if (!slug) throw new Error("Missing input");
    if (!(color && quantity)) throw new Error("Missing required fields");
    let product = await Product.findOne({ slug });
    if (!product) throw new Error("Product not found");
    const isColorExist = product.colors.find((item) => item.color.toLowerCase() === color.toLowerCase());
    if (isColorExist) throw new Error("Color already exist");
    const pImage = await uploadToCloudinary(req.files?.primaryImage[0].buffer, PRODUCT_FOLDER)
    let images = []
    for (let image of req.files?.images) {
      const img = await uploadToCloudinary(image.buffer, PRODUCT_FOLDER)
      images.push({ url: img.url, public_id: img.public_id })
    }
    product.colors.push({
      color,
      quantity:parsedQuantity,
      primaryImage: { url: pImage.url, public_id: pImage.public_id }, images,
      images
    });
    product.quantity += parsedQuantity;
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
    const { title, description, price, brand, series,discountPrice,  } = JSON.parse(req.body.document);
    if (!(title && description && price && brand  && discountPrice))
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
    product.brand = brand.toLowerCase() || product.brand;
    product.series = series || product.series;
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
    const parsedQuantity = parseInt(quantity, 10);

    const product = await Product.findOne({ slug })
    const currentColor = product.colors.find(item => item._id.toString() === colorId)
    if (!product) throw new Error("Product not found")
    let img = null
    let images = []
    if (req.files?.primaryImage) {
      img = await uploadToCloudinary(req.files.primaryImage[0].buffer, PRODUCT_FOLDER)
      if (currentColor.primaryImage && currentColor.primaryImage.public_id) {
        await cloudinary.uploader.destroy(currentColor.primaryImage.public_id);
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
        item.quantity = parsedQuantity || item.quantity;
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
        path: "series",
        select: "title brand",
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
    // need
    if(formatQuery.desc){
      if(formatQuery.desc.toLowerCase() === searchDesc.desc.toLowerCase()){
        formatQuery['configs.need.description'] = searchDesc.need
      }else{
        let need = await getNeedingProduct({desc:formatQuery.desc})
        formatQuery['configs.need.description'] = need
        searchDesc.desc = formatQuery.desc
        searchDesc.need = need
      }
    }
    delete formatQuery.desc
    if(formatQuery.need){
      formatQuery['configs.need.description'] = formatQuery.need
    }
    delete formatQuery.need
    // filter color
    if (formatQuery.colors) {
      const colors = formatQuery.colors.split(',').map((color) => new RegExp(color, "i"));
      formatQuery.colors = { $elemMatch: { color: { $in: colors } } };
    }else{
      delete formatQuery.colors
    }
    if (formatQuery.hardDrive) {
      formatQuery['configs.hardDrive.value'] = { $in: formatQuery.hardDrive.split(',') };
      delete formatQuery.hardDrive
    }else{
      delete formatQuery.hardDrive
    }
    if (formatQuery.ram) {
      formatQuery['configs.ram.value'] = { $in: formatQuery.ram.split(',') };
      delete formatQuery.ram
    }else{
      delete formatQuery.ram
    }
    if(formatQuery.brand){
      formatQuery.brand = { $regex: formatQuery.brand, $options: "i" };
    }
    else{
      delete formatQuery.brand
    }
    if(formatQuery.brands){
      formatQuery.brand = { $in: formatQuery.brands.split(',') };
    }
    delete formatQuery.brands

    if(mongoose.Types.ObjectId.isValid(formatQuery.series)){
      formatQuery.series = formatQuery.series
    }else{
      delete formatQuery.series
    }
    ////////////////////////////
    //k show nhung sp k có color trong client
    formatQuery.colors ={...formatQuery?.colors ,$exists: true, $ne: [] };
    //co show nhung sp k có color trong admin
    if(formatQuery.showAll){
      delete formatQuery.colors.$exists
      delete formatQuery.colors.$ne
      if(Object.keys(formatQuery.colors).length === 0)  delete formatQuery.colors
      delete formatQuery.showAll
    }
    ///
    // filter title
    if (formatQuery.title) {
      formatQuery.title = { $regex: req.query.title, $options: "i" };
    }else{
      delete formatQuery.title
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
        path:'series',
      }])
    const [totalDocuments, products] = await Promise.all([
      Product.find(formatQuery).countDocuments(),
      queryCommand,
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
const deleteProduct = async (req, res, next) => {
  try {
    const { pId } = req.params;
    // Kiểm tra và chuyển đổi pId thành ObjectId
    if (!mongoose.Types.ObjectId.isValid(pId)) {
      return res.status(400).json({ error: 'Invalid ObjectId' });
    }
    await Product.deleteOne({ _id: pId});
    res.status(200).json({
      success: true,
      message: "Delete product successfully",
    })
  }catch(error){
    next(error);
  }
}
const deleteProductColor = async (req, res, next) => {
  try {
    const { cId,pId } = req.params
    const product = await Product.findOne({ _id: pId});
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    let colorQuantity=0;
    product.colors = product.colors.filter((item) => {
      if(item._id.toString() === cId){
        colorQuantity = item.quantity
      }
      return item._id.toString() !== cId
    });
    product.quantity -= colorQuantity;
    await product.save();
    res.status(200).json({
      success: true,
      message: "Delete product color successfully",
    })
  }catch(error){
    next(error);
  }
}
export { createProduct,
   createProductColor,
   getProduct,
   getAllProducts,
   updateProduct,
   updateProductColor ,
   deleteProduct,
   deleteProductColor
  };
