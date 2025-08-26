const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    store: new FileStore({}),
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.session.username) {
    return next();
  }
  res.redirect("/login");
}

// Routes
app.get("/", (req, res) => {
  const welcomePath = path.join(__dirname, "views", "welcome.html");
  fs.readFile(welcomePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Error loading welcome page");

    let content;
    if (req.session.username) {
      content = `<p>Hello, ${req.session.username.username}</p><a href="/logout">Logout</a>`;
    } else {
      content = `<a href="/login">Login</a>`;
    }

    const html = data.replace("<!--PLACEHOLDER-->", content);
    res.send(html);
  });
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

  app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username==="dhruvi" && password==="1234") {
      req.session.username ={ username:username};
      
      return res.redirect("/dashboard");
    }

    res.send("<p>Invalid credentials. <a href='/login'>Try again</a></p>");
  });

app.get("/dashboard", isAuthenticated, (req, res) => {
  res.send(`
    <h1>Dashboard</h1>
    <p>Welcome, ${req.session.username.username}!</p>
    <a href="/logout">Logout</a>
  `);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
