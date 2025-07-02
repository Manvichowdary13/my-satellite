/* eslint-disable no-undef */
// satcatProxy.js
import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let token = null;

// Authenticate and get token
async function authenticate() {
  try {
    const response = await axios.post("https://www.space-track.org/ajaxauth/login", {
      identity: process.env.SATCAT_CLIENT_ID,
      password: process.env.SATCAT_CLIENT_SECRET,
    });
    token = response.data.token;
    console.log("✅ Satcat login successful");
  } catch (error) {
    console.error("❌ Failed to authenticate with Satcat API", error.message);
  }
}

// Fetch satellite data by NORAD IDs
async function fetchSatellites(ids) {
  if (!token) await authenticate();

  const url = `https://www.space-track.org/basicspacedata/query/class/satcat/filter/NORAD_CAT_ID in (${ids.join(",")})/format/json`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error("❌ Satcat fetch failed:", err.message);
    throw new Error("Satcat fetch failed");
  }
}

// Route
app.get("/api/satcat", async (req, res) => {
  const ids = (req.query.ids || "")
    .split(",")
    .map((n) => parseInt(n, 10))
    .filter(Boolean);

  if (!ids.length) {
    return res.status(400).json({ error: "Query ?ids=123,456 required" });
  }

  try {
    const data = await fetchSatellites(ids);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
  await authenticate();
  console.log(`🚀 Satcat proxy running at http://localhost:${PORT}`);
});
