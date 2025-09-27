import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { insertSnapshot, getAllSnapshots, fillDataGaps } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from public directory
app.use(express.static('public'));

// API Endpoints
app.get('/api/clan/latest', (req, res) => {
  try {
    const snapshots = getAllSnapshots();
    if (snapshots.length === 0) {
      res.json({ found: false });
      return;
    }
    res.json({ 
      found: true, 
      data: snapshots[snapshots.length - 1] 
    });
  } catch (err) {
    console.error('Error fetching latest snapshot:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/clan/history', (req, res) => {
  try {
    const snapshots = getAllSnapshots();
    // Sort by timestamp in descending order
    // 7 days * 24 hours * 60 minutes = 10080 minutes (1 week of minute-by-minute data)
    const sortedSnapshots = snapshots
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10080);
    res.json({ data: sortedSnapshots });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
      clanCapitalPoints: clan.clanCapitalPoints,
      warWins: clan.warWins,
      warLosses: clan.warLosses,
      requiredTrophies: clan.requiredTrophies,
      clanName: clan.name,
      clanTag: clan.tag
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

// Fetch every minute
const POLL_INTERVAL = 60 * 1000; // 1 minute
setInterval(fetchClanData, POLL_INTERVAL);
// Add initial data backfill on startup
async function backfillInitialData() {
  const snapshots = getAllSnapshots();
  if (snapshots.length === 0) {
    console.log("🔄 No existing data found, fetching initial data...");
    await fetchClanData();
  }
  fillDataGaps();
}

// Run immediately and start polling
backfillInitialData();
fetchClanData();

// Add endpoint for the HTML frontend
app.get("/api/snapshots", async (req, res) => {
  try {
    const snapshots = getAllSnapshots();
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ error: "Failed to get snapshots" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
