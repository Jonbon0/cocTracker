import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { insertSnapshot, getAllSnapshots } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const COC_API_KEY = process.env.COC_API_KEY;
const CLAN_TAG = process.env.CLAN_TAG;
const API_URL = "https://api.clashofclans.com/v1";

if (!COC_API_KEY) throw new Error("COC_API_KEY is not set in .env");
if (!CLAN_TAG) throw new Error("CLAN_TAG is not set in .env");

async function fetchClanData() {
  try {
    const response = await fetch(`${API_URL}/clans/${encodeURIComponent(CLAN_TAG)}`, {
      headers: { Authorization: `Bearer ${COC_API_KEY}` },
    });

    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);

    const clan = await response.json();

    insertSnapshot({
      timestamp: new Date().toISOString(),
      members: clan.members,
      clanPoints: clan.clanPoints,
      clanLevel: clan.clanLevel,
      clanCapitalPoints: clan.clanCapitalPoints
    });

    console.log("✅ Snapshot saved:", {
      name: clan.name,
      members: clan.members,
      clanPoints: clan.clanPoints,
      clanLevel: clan.clanLevel,
      clanCapitalPoints: clan.clanCapitalPoints,
    });
  } catch (err) {
    console.error("Error saving snapshot:", err.message);
  }
}

// Fetch every 1 minute
setInterval(fetchClanData, 60 * 1000);
// Run immediately
fetchClanData();

app.use(express.static("public"));

app.get("/api/snapshots", async (req, res) => {
  try {
    const snapshots = getAllSnapshots();
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: "Failed to get snapshots" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
