// services/embeddingService.js
const axios = require("axios");
const EMBEDDING_API = process.env.EMBEDDING_API_URL || "http://localhost:8000";

async function getEmbedding(text) {
  try {
    const res = await axios.post(`${EMBEDDING_API}/embedding`, { texts: [text] });
    return res.data.embeddings[0]; // first embedding
  } catch (err) {
    console.error("Error fetching embedding:", err.message);
    throw err;
  }
}

module.exports = { getEmbedding };
