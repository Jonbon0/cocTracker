// index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { fetchClan } from './fetchClan.js';
import db from './db.js'; // Make sure db.js exports insertSnapshot, getLatestSnapshot, getSnapshots

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

const CLAN_TAG = process.env.CLAN_TAG;

if (!CLAN_TAG) {
  console.error('Error: CLAN_TAG not set in .env');
  process.exit(1);
}

// Fetch and store clan snapshot
async function updateClanData() {
  const snapshot = await fetchClan(CLAN_TAG);
  if (snapshot) {
    db.insertSnapshot(snapshot);
    console.log(
      `Snapshot saved: ${snapshot.clanName} (${new Date(snapshot.timestamp).toLocaleTimeString()})`
    );
  }
}

// Schedule automatic fetch every 1 minute
cron.schedule('*/1 * * * *', () => {
  console.log('Fetching clan data...');
  updateClanData();
});

// API route to get latest snapshot
app.get('/api/latest', (req, res) => {
  const data = db.getLatestSnapshot(CLAN_TAG);
  if (!data) return res.status(404).json({ error: 'No data found' });
  res.json(data);
});

// API route to get multiple snapshots for charts
app.get('/api/snapshots', (req, res) => {
  const data = db.getSnapshots(CLAN_TAG);
  res.json(data);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  updateClanData(); // Initial fetch immediately on startup
});
