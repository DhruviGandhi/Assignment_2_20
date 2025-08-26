// index.js
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");

const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();

// ----------------- Middleware -----------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "shopping_cart_secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// ----------------- Routes -----------------
app.use("/admin", adminRoutes);
app.use("/", userRoutes);
app.use("/cart", cartRoutes);

// ----------------- Database + Server -----------------
mongoose
  .connect("mongodb://127.0.0.1:27017/shopping_cart", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));
  })
  .catch((err) => console.error(err));
