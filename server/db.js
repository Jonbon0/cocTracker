import Database from "better-sqlite3";

const db = new Database("clanTracker.db");

// Create table if it doesn’t exist
db.prepare(
  `CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    members INTEGER,
    clanPoints INTEGER,
    clanLevel INTEGER,
    clanVersusPoints INTEGER,
    clanCapitalPoints INTEGER
  )`
).run();

export function insertSnapshot(snapshot) {
  const stmt = db.prepare(
    `INSERT INTO snapshots (timestamp, members, clanPoints, clanLevel, clanVersusPoints, clanCapitalPoints)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    snapshot.timestamp,
    snapshot.members,
    snapshot.clanPoints,
    snapshot.clanLevel,
    snapshot.clanVersusPoints,
    snapshot.clanCapitalPoints
  );
}

export function getAllSnapshots() {
  const stmt = db.prepare(`SELECT * FROM snapshots ORDER BY timestamp ASC`);
  return stmt.all();
}
