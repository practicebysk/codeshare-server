const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const env = require("dotenv");
const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
env.config({ path: "config.env" });

const MONGO_URI = process.env.MONGO_DB; // MongoDB connection string

// --- MongoDB Connection ---
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => console.error("Connection error", err));

// --- Mongoose Schema & Model ---
// This defines the structure of the documents that will be stored in our collection.
const snippetSchema = new mongoose.Schema({
  uniId: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// The model is our primary interface to the 'snippets' collection in the database.
const Snippet = mongoose.model("Snippet", snippetSchema);

// --- API Routes ---
const { v4: uuidv4 } = require("uuid"); // npm install uuid

app.post("/api/code", async (req, res) => {
  let { code, uniId } = req.body;
  if (!code || typeof code !== "string") {
    return res
      .status(400)
      .json({ error: "Code content is required and must be a string." });
  }
  try {
    if (!uniId) {
      uniId = uuidv4();
    }
    const snippet = await Snippet.findOneAndUpdate(
      { uniId },
      { code, uniId },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ id: snippet.uniId });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while saving/updating the snippet." });
  }
});

app.get("/api/code/:id", async (req, res) => {
  try {
    const { id: uniId } = req.params;
    const snippet = await Snippet.findOne({ uniId });
    if (snippet) {
      return res.status(200).json({ code: snippet.code });
    }
    res.status(200).json({ code: "" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching the snippet." });
  }
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`CodeShare server is running on http://localhost:${PORT}`);
});
