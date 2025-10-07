import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { 
  insertSnapshot, 
  getAllSnapshots, 
  fillDataGaps,
  upsertPlayer,
  insertPlayerWarStats,
  getAllPlayers,
  getPlayerWarStats
} from "./db.js";

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
    const sortedSnapshots = snapshots
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10080);
    res.json({ data: sortedSnapshots });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Player endpoints
app.get('/api/players', (req, res) => {
  try {
    const players = getAllPlayers();
    res.json({ data: players });
  } catch (err) {
    console.error('Error fetching players:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/players/:playerTag/stats', (req, res) => {
  try {
    const playerTag = decodeURIComponent(req.params.playerTag);
    const days = parseInt(req.query.days) || 30;
    const stats = getPlayerWarStats(playerTag, days);
    res.json({ data: stats });
  } catch (err) {
    console.error('Error fetching player stats:', err);
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

async function fetchPlayerStats() {
  try {
    // Get clan members list
    const response = await fetch(`${API_URL}/clans/${encodeURIComponent(CLAN_TAG)}/members`, {
      headers: { Authorization: `Bearer ${COC_API_KEY}` },
    });

    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);

    const data = await response.json();
    const members = data.items || [];

    console.log(`📊 Fetching stats for ${members.length} players...`);

    // Fetch detailed stats for each player
    for (const member of members) {
      try {
        const playerResponse = await fetch(`${API_URL}/players/${encodeURIComponent(member.tag)}`, {
          headers: { Authorization: `Bearer ${COC_API_KEY}` },
        });

        if (!playerResponse.ok) {
          console.error(`Failed to fetch player ${member.name}: ${playerResponse.status}`);
          continue;
        }

        const player = await playerResponse.json();

        // Upsert player info
        upsertPlayer({
          tag: player.tag,
          name: player.name,
          townHallLevel: player.townHallLevel
        });

        // Insert war stats
        insertPlayerWarStats(player.tag, {
          warStars: player.warStars,
          attackWins: player.attackWins,
          defenseWins: player.defenseWins,
          donations: player.donations,
          donationsReceived: player.donationsReceived
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Error fetching player ${member.name}:`, err.message);
      }
    }

    console.log("✅ Player stats updated");
  } catch (err) {
    console.error("Error fetching player stats:", err.message);
  }
}

// Fetch clan data every minute
const POLL_INTERVAL = 60 * 1000; // 1 minute
setInterval(fetchClanData, POLL_INTERVAL);

// Fetch player stats every 5 minutes (to avoid rate limiting)
const PLAYER_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(fetchPlayerStats, PLAYER_POLL_INTERVAL);

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
fetchPlayerStats();

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