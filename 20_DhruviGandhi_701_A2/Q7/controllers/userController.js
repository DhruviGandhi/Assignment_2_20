// controllers/userController.js
const Category = require("../models/category");
const Product = require("../models/product");

// Homepage - show categories & some products
exports.getHome = async (req, res) => {
  try {
    const categories = await Category.find({ parent: null }).lean(); // only top-level
    const latestProducts = await Product.find().sort({ createdAt: -1 }).limit(8).lean();

    res.render("user/home", { categories, latestProducts });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// View products by category
exports.getCategoryProducts = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // get child categories if any
    const subCategories = await Category.find({ parent: categoryId }).lean();

    let products = [];
    if (subCategories.length > 0) {
      // get products in subcategories
      const subIds = subCategories.map(c => c._id);
      products = await Product.find({ category: { $in: subIds } }).lean();
    } else {
      // products in this category
      products = await Product.find({ category: categoryId }).lean();
    }

    const category = await Category.findById(categoryId).lean();

    res.render("user/category", { category, products, subCategories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Product detail page
exports.getProductDetail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category").lean();
    if (!product) return res.status(404).send("Product not found");

    res.render("user/product", { product });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
