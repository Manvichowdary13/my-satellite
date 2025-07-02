/* eslint-disable no-undef */
// spaceTrackProxy.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let cookie = null;

// Login to Space-Track and cache cookie
async function spaceTrackLogin() {
  const resp = await fetch("https://www.space-track.org/ajaxauth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      identity: process.env.SPACETRACK_USER,
      password: process.env.SPACETRACK_PASS,
    }),
  });

  if (!resp.ok) {
    throw new Error("Failed to login to Space-Track");
  }

  cookie = resp.headers.get("set-cookie");
  console.log("✅ Space-Track login successful.");
}

// Fetch satcat info from Space-Track
async function fetchSatcat(ids) {
  const baseURL = "https://www.space-track.org/basicspacedata/query/class/satcat/";
  const filter = `NORAD_CAT_ID in (${ids.join(",")})`;
  const url = `${baseURL}filter/${encodeURIComponent(filter)}/orderby/NORAD_CAT_ID/format/json`;

  const resp = await fetch(url, {
    headers: { cookie },
  });

  console.log("➡️ Space-Track request URL:", url);
  console.log("➡️ Status:", resp.status, resp.statusText);

  if (resp.status === 401) {
    console.warn("⚠️ Unauthorized. Trying login again...");
    await spaceTrackLogin(); // Retry login
    return fetchSatcat(ids); // Retry fetch
  }

  if (!resp.ok) {
    const text = await resp.text(); // Read the actual error message
    console.error("❌ Space-Track response:", text);
    throw new Error("Space-Track fetch failed");
  }

  return resp.json();
}


app.get("/api/satcat", async (req, res) => {
  const ids = (req.query.ids || "")
    .split(",")
    .map((n) => parseInt(n, 10))
    .filter(Boolean);

  if (!ids.length) {
    return res.status(400).json({ error: "Query ?ids=123,456 required" });
  }

  try {
    const data = await fetchSatcat(ids);
    res.json(data);
  } catch (err) {
    console.error("❌ Space-Track error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  try {
    await spaceTrackLogin();
    console.log(`🚀 Space-Track proxy running at http://localhost:${PORT}`);
  } catch (err) {
    console.error("❌ Space-Track login failed:", err.message);
  }
});
