// backend/index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// API route
app.get("/api/advice", async (req, res) => {
  try {
    const response = await axios.get("https://api.adviceslip.com/advice");
    res.json(response.data.slip);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch advice" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
