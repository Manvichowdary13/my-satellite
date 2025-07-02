// server.js
import express from "express";
import axios from "axios";
axios.defaults.adapter = "http"; // 👈 DNS workaround for Node <18

import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());

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
  if (n.includes("beidou")) return "China";
  if (n.includes("tianwen") || n.includes("fengyun")) return "China";
  if (n.includes("sentinel") || n.includes("metop")) return "ESA";
  if (n.includes("himawari") || n.includes("kizuna")) return "Japan";
  return "Unknown";
}

// Proxy route to fetch TLE from CelesTrak
app.get("/api/tle", async (req, res) => {
  try {
    const response = await axios.get(
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
    );

    const lines = response.data.trim().split("\n");
    const satellites = [];

    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break;
      const name = lines[i].trim();

      // 🔍 Debug log
      console.log("Satellite:", name, "→ Type:", guessType(name));
      console.log("Satellite:", name, "→ Country:", guessCountry(name));

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

app.listen(PORT, () => {
  console.log(`🚀 TLE Proxy running on http://localhost:${PORT}`);
});
