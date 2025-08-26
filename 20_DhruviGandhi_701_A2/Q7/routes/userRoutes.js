// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Homepage
router.get("/", userController.getHome);

// Category products
router.get("/category/:id", userController.getCategoryProducts);

// Product detail
router.get("/product/:id", userController.getProductDetail);

module.exports = router;
