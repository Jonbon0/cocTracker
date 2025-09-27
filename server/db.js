import Database from 'better-sqlite3';

const db = new Database('clanTracker.db');

// Create table
db.prepare(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    members INTEGER,
    clanPoints INTEGER,
    clanLevel INTEGER,
    clanCapitalPoints INTEGER
  )
`).run();

// Insert a snapshot
export function insertSnapshot(snapshot) {
  const stmt = db.prepare(`
    INSERT INTO snapshots 
    (timestamp, members, clanPoints, clanLevel, clanCapitalPoints)
    VALUES (@timestamp, @members, @clanPoints, @clanLevel, @clanCapitalPoints)
  `);
  stmt.run(snapshot);
}

// Get all snapshots
export function getAllSnapshots() {
  const stmt = db.prepare('SELECT * FROM snapshots ORDER BY timestamp ASC');
  return stmt.all();
}
