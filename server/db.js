import Database from 'better-sqlite3';

const db = new Database('clanTracker.db');

// Create table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    members INTEGER,
    clanPoints INTEGER,
    clanLevel INTEGER,
    clanCapitalPoints INTEGER,
    warWins INTEGER,
    warLosses INTEGER,
    requiredTrophies INTEGER,
    clanName TEXT,
    clanTag TEXT
  )
`).run();

// Insert a snapshot
export function insertSnapshot(snapshot) {
  const stmt = db.prepare(`
    INSERT INTO snapshots 
    (timestamp, members, clanPoints, clanLevel, clanCapitalPoints, warWins, warLosses, requiredTrophies, clanName, clanTag)
    VALUES (@timestamp, @members, @clanPoints, @clanLevel, @clanCapitalPoints, @warWins, @warLosses, @requiredTrophies, @clanName, @clanTag)
  `);
  const params = {
    ...snapshot,
    warWins: snapshot.warWins || 0,
    warLosses: snapshot.warLosses || 0,
    requiredTrophies: snapshot.requiredTrophies || 0,
    clanName: snapshot.clanName || '',
    clanTag: snapshot.clanTag || ''
  };
  stmt.run(params);
}

// Get all snapshots
export function getAllSnapshots() {
  const stmt = db.prepare('SELECT * FROM snapshots ORDER BY timestamp ASC');
  return stmt.all();
}

// Delete old snapshots (keep last 30 days, but ensure we have at least 7 days)
export function cleanupOldSnapshots() {
  // First, check if we have enough recent data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentCount = db.prepare('SELECT COUNT(*) as count FROM snapshots WHERE timestamp >= ?').get(sevenDaysAgo.toISOString()).count;
  
  // Only cleanup if we have enough recent data
  if (recentCount >= 1000) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stmt = db.prepare('DELETE FROM snapshots WHERE timestamp < ?');
    return stmt.run(thirtyDaysAgo.toISOString());
  }
  return { changes: 0 };
}

// Get snapshots within a time range
export function getSnapshotsInRange(startDate, endDate) {
  const stmt = db.prepare('SELECT * FROM snapshots WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp ASC');
  return stmt.all(startDate.toISOString(), endDate.toISOString());
}

// Fill gaps in data with interpolated values
export function fillDataGaps() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const snapshots = getSnapshotsInRange(oneWeekAgo, new Date());
  if (snapshots.length < 2) return;

  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1];
    const current = snapshots[i];
    const prevTime = new Date(prev.timestamp);
    const currentTime = new Date(current.timestamp);
    const diffMinutes = (currentTime - prevTime) / (1000 * 60);

    // If gap is more than 5 minutes, add interpolated points
    if (diffMinutes > 5) {
      const pointsToAdd = Math.floor(diffMinutes / 5) - 1;
      for (let j = 1; j <= pointsToAdd; j++) {
        const interpolatedTime = new Date(prevTime.getTime() + j * 5 * 60 * 1000);
        const progress = j / (pointsToAdd + 1);
        
        insertSnapshot({
          timestamp: interpolatedTime.toISOString(),
          members: Math.round(prev.members + (current.members - prev.members) * progress),
          clanPoints: Math.round(prev.clanPoints + (current.clanPoints - prev.clanPoints) * progress),
          clanLevel: prev.clanLevel,  // Don't interpolate discrete values
          clanCapitalPoints: Math.round(prev.clanCapitalPoints + (current.clanCapitalPoints - prev.clanCapitalPoints) * progress),
          warWins: prev.warWins,      // Don't interpolate discrete values
          warLosses: prev.warLosses,  // Don't interpolate discrete values
          requiredTrophies: prev.requiredTrophies,
          clanName: prev.clanName,
          clanTag: prev.clanTag
        });
      }
    }
  }
}

// Run cleanup once per day
setInterval(cleanupOldSnapshots, 24 * 60 * 60 * 1000);

// Run gap filling every hour
setInterval(fillDataGaps, 60 * 60 * 1000);
