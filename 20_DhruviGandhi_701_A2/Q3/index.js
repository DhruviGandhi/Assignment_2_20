const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const redis = require("redis");
const RedisStore = require("connect-redis")(session);

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// ✅ redis@3 client (no .connect())
const redisClient = redis.createClient({
  host: "redis-15747.c322.us-east-1-2.ec2.redns.redis-cloud.com",
  port: 15747,
  password: "PQF2fcabO4YtNEHqWk4KsUkn0HP8Gzt7",
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: "secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000,
    },
  })
);

// Routes
app.get("/", (req, res) => {
  const welcomePath = path.join(__dirname, "views", "welcome.html");
  fs.readFile(welcomePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("Error loading welcome page");
  });

    const content = req.session.user
      ? `<p>Hello, ${req.session.user.username}</p><a href="/logout">Logout</a>`
      : `<a href="/login">Login</a>`;

    res.send(data.replace("<!--PLACEHOLDER-->", content));
  });

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "dhruvi" && password === "1234") {
    req.session.user = { username: username };
    return res.redirect("/dashboard");
  }

  res.send("<p>Invalid credentials. <a href='/login'>Try again</a></p>");
});

app.get("/dashboard", isAuthenticated, (req, res) => {
  res.send(`
    <h1>Dashboard</h1>
    <p>Welcome, ${req.session.user.username}!</p>
    <a href="/logout">Logout</a>
  `);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
