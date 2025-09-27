import Database from 'better-sqlite3';
const db = new Database('./clan_tracker.db');

// migrations
db.exec(`
CREATE TABLE IF NOT EXISTS clan_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  clan_tag TEXT,
  clan_name TEXT,
  clan_level INTEGER,
  clan_points INTEGER,
  required_trophies INTEGER,
  members_count INTEGER,
  war_wins INTEGER,
  war_losses INTEGER,
  json_blob TEXT
);
`);

export default {
  insertSnapshot: (snapshot) => {
    const stmt = db.prepare(`INSERT INTO clan_snapshots
      (timestamp, clan_tag, clan_name, clan_level, clan_points, required_trophies, members_count, war_wins, war_losses, json_blob)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    return stmt.run(
      snapshot.timestamp,
      snapshot.clanTag,
      snapshot.clanName,
      snapshot.clanLevel,
      snapshot.clanPoints,
      snapshot.requiredTrophies,
      snapshot.membersCount,
      snapshot.warWins,
      snapshot.warLosses,
      JSON.stringify(snapshot.raw)
    );
  },
  getLatestSnapshot: (clanTag) => {
    return db.prepare(`SELECT * FROM clan_snapshots WHERE clan_tag = ? ORDER BY timestamp DESC LIMIT 1`).get(clanTag);
  },
  getSnapshots: (clanTag, limit = 200) => {
    return db.prepare(`SELECT * FROM clan_snapshots WHERE clan_tag = ? ORDER BY timestamp DESC LIMIT ?`).all(clanTag, limit);
  }
};
