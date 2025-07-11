// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Serve static frontend build (dist folder)
app.use(express.static(path.join(__dirname, "dist")));

// Satellite categorization logic
function guessType(name) {
  const n = name.toLowerCase();
  if (n.includes("starlink")) return "LEO";
  if (n.includes("navstar") || n.includes("gps")) return "MEO";
  if (n.includes("insat") || n.includes("gsat")) return "GEO";
  return "LEO";
}

function guessCountry(name) {
  const n = name.toLowerCase();
  if (/(usa|starlink|navstar|gps)/.test(n)) return "USA";
  if (/(gsat|insat|cartosat|risat|resourcesat)/.test(n)) return "India";
  if (/(cosmos|sputnik|zarya)/.test(n)) return "Russia";
  if (n.includes("galileo")) return "EU";
  if (n.includes("beidou") || n.includes("tianwen") || n.includes("fengyun")) return "China";
  if (n.includes("sentinel") || n.includes("metop")) return "ESA";
  if (n.includes("himawari") || n.includes("kizuna")) return "Japan";
  return "Unknown";
}

// API route
app.get("/api/tle", async (req, res) => {
  try {
    const response = await axios.get("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle");
    const lines = response.data.trim().split("\n");
    const satellites = [];

    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break;
      const name = lines[i].trim();
      satellites.push({
        name,
        line1: lines[i + 1].trim(),
        line2: lines[i + 2].trim(),
        type: guessType(name),
        country: guessCountry(name),
      });
    }

    res.json(satellites);
  } catch (error) {
    console.error("Proxy fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch TLE data" });
  }
});

// Fallback route for SPA (Vite's index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
