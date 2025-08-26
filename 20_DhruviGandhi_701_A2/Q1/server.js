const express = require("express");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
const fs = require("fs");

const app = express();

// Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Storage config for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Multer upload handler
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPG/PNG images allowed"));
    }
  },
});

// Routes
app.get("/", (req, res) => {
  res.render("form", { errors: [], old: {} });
});

app.post(
  "/submit",
  upload.fields([{ name: "profilePic", maxCount: 1 }, { name: "otherPics", maxCount: 5 }]),
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 chars"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("gender").notEmpty().withMessage("Select a gender"),
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Delete uploaded files if validation fails
      if (req.files) {
        Object.values(req.files).flat().forEach((file) => {
          fs.unlinkSync(file.path);
        });
      }
      return res.render("form", {
        errors: errors.array(),
        old: req.body,
      });
    }

    // Prepare data
    const data = {
      username: req.body.username,
      email: req.body.email,
      gender: req.body.gender,
      hobbies: req.body.hobbies,
      profilePic: req.files["profilePic"] ? req.files["profilePic"][0].filename : null,
      otherPics: req.files["otherPics"] ? req.files["otherPics"].map(f => f.filename) : [],
    };

    // Save formatted table to HTML file for download
    const tableHTML = `
      <html>
      <head><title>User Data</title></head>
      <body>
      <h2>User Data</h2>
      <table border="1" cellpadding="10">
        <tr><th>Username</th><td>${data.username}</td></tr>
        <tr><th>Email</th><td>${data.email}</td></tr>
        <tr><th>Gender</th><td>${data.gender}</td></tr>
        <tr><th>Hobbies</th><td>${Array.isArray(data.hobbies) ? data.hobbies.join(", ") : data.hobbies || ""}</td></tr>
        <tr><th>Profile Pic</th><td><img src="uploads/${data.profilePic}" width="100"></td></tr>
        <tr><th>Other Pics</th><td>${data.otherPics
          .map(f => `<img src="uploads/${f}" width="100">`)
          .join(" ")}</td></tr>
      </table>
      </body>
      </html>
    `;

    fs.writeFileSync("uploads/result.html", tableHTML);

    res.render("result", { data });
  }
);

// File download route
app.get("/download/:filename", (req, res) => {
    const file = path.join(__dirname, "uploads", req.params.filename);
    res.download(file, req.params.filename, (err) => {
      if (err) {
        res.status(404).send("File not found");
      }
    });
  });

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
