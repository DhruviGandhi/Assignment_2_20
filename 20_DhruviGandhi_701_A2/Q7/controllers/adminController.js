// controllers/adminController.js
const Category = require("../models/category");
const Product = require("../models/product");


exports.getDashboard = async (req, res) => {
  try {
    const categoriesCount = await Category.countDocuments();
    const productsCount = await Product.countDocuments();
    res.render("admin/dashboard", { categoriesCount, productsCount });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// ---------------- CATEGORIES ----------------
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("parent").lean();
    res.render("admin/categories", { categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const category = new Category({
      name,
      parent: parent || null
    });
    await category.save();
    res.redirect("/admin/categories");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect("/admin/categories");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// ---------------- PRODUCTS ----------------
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category").lean();
    const categories = await Category.find().lean();
    res.render("admin/products", { products, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, image } = req.body;
    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      image
    });
    await product.save();
    res.redirect("/admin/products");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/admin/products");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
