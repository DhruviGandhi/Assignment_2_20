// routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

// View cart
router.get("/", cartController.getCart);

// Add product to cart
router.get("/add/:id", cartController.addToCart);

// Remove product from cart
router.get("/remove/:id", cartController.removeFromCart);

// Update quantity
router.post("/update/:id", cartController.updateQty);

module.exports = router;
