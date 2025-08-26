// controllers/cartController.js
const Product = require("../models/product");

// Helper function: initialize cart
function initCart(req) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  return req.session.cart;
}

// View cart
exports.getCart = (req, res) => {
  const cart = initCart(req);
  res.render("user/cart", { cart });
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).lean();

    if (!product) return res.status(404).send("Product not found");

    const cart = initCart(req);

    // Check if already in cart
    const existingItem = cart.find(item => item.product._id.toString() === productId);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cart.push({ product, qty: 1 });
    }

    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Remove item from cart
exports.removeFromCart = (req, res) => {
  const productId = req.params.id;
  let cart = initCart(req);

  cart = cart.filter(item => item.product._id.toString() !== productId);
  req.session.cart = cart;

  res.redirect("/cart");
};

// Update quantity
exports.updateQty = (req, res) => {
  const { id } = req.params;
  const { qty } = req.body;
  const cart = initCart(req);

  const item = cart.find(item => item.product._id.toString() === id);
  if (item) {
    item.qty = parseInt(qty) > 0 ? parseInt(qty) : 1;
  }

  res.redirect("/cart");
};
