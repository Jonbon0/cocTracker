import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { insertSnapshot, getAllSnapshots } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const COC_API_KEY = process.env.COC_API_KEY;
const CLAN_TAG = process.env.CLAN_TAG; // now coming from .env

if (!COC_API_KEY) {
  throw new Error("COC_API_KEY is not set in .env");
}

if (!CLAN_TAG) {
  throw new Error("CLAN_TAG is not set in .env");
}

async function fetchClanData() {
  try {
    const response = await fetch(
      `https://api.clashofclans.com/v1/clans/${encodeURIComponent(CLAN_TAG)}`,
      {
        headers: {
          Authorization: `Bearer ${COC_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Save snapshot
    await insertSnapshot({
      timestamp: new Date().toISOString(),
      members: data.members,
      clanPoints: data.clanPoints,
      clanLevel: data.clanLevel,
      clanVersusPoints: data.clanVersusPoints,
      clanCapitalPoints: data.clanCapitalPoints,
    });

    console.log("Snapshot saved:", data.name, "Members:", data.members);
  } catch (err) {
    console.error("Error saving snapshot:", err.message);
  }
}

// Fetch every 1 minute
setInterval(fetchClanData, 60 * 1000);

// Run immediately on startup
fetchClanData();

app.use(express.static("public"));

app.get("/api/snapshots", async (req, res) => {
  try {
    const snapshots = await getAllSnapshots();
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: "Failed to get snapshots" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
