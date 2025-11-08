import Database from 'better-sqlite3';

const db = new Database('clanTracker.db');

// Create snapshots table if it doesn't exist
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

// Create players table
db.prepare(`
  CREATE TABLE IF NOT EXISTS players (
    playerTag TEXT PRIMARY KEY,
    playerName TEXT,
    lastSeen TEXT,
    lastActive TEXT,
    townHallLevel INTEGER,
    activityScore INTEGER DEFAULT 0,
    warParticipation INTEGER DEFAULT 0
  )
`).run();

// Create player war stats table
db.prepare(`
  CREATE TABLE IF NOT EXISTS player_war_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playerTag TEXT,
    timestamp TEXT,
    warStars INTEGER,
    attackWins INTEGER,
    defenseWins INTEGER,
    donations INTEGER,
    donationsReceived INTEGER,
    FOREIGN KEY (playerTag) REFERENCES players(playerTag)
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

// Upsert player info
export function upsertPlayer(player) {
  console.log('Upserting player with role:', player.clanRole); // Debug log
  const stmt = db.prepare(`
    INSERT INTO players (playerTag, playerName, lastSeen, lastActive, townHallLevel, activityScore, clanRole)
    VALUES (@playerTag, @playerName, @lastSeen, @lastActive, @townHallLevel, @activityScore, @clanRole)
    ON CONFLICT(playerTag) DO UPDATE SET
      playerName = @playerName,
      lastSeen = @lastSeen,
      lastActive = @lastActive,
      townHallLevel = @townHallLevel,
      activityScore = @activityScore,
      clanRole = @clanRole
  `);
  
  // Calculate activity score (0-100)
  const activityScore = Math.min(100, Math.floor(
    (player.donations / 100) + // Points for donations
    (player.attackWins * 2) +  // Points for attacks
    (player.warStars * 3)      // Points for war stars
  ));
  
  stmt.run({
    playerTag: player.tag,
    playerName: player.name,
    lastSeen: new Date().toISOString(),
    lastActive: player.lastSeen || new Date().toISOString(),
    townHallLevel: player.townHallLevel || 0,
    activityScore: activityScore,
    clanRole: player.clanRole || 'member'
  });
}

// Insert player war stats
export function insertPlayerWarStats(playerTag, stats) {
  const stmt = db.prepare(`
    INSERT INTO player_war_stats 
    (playerTag, timestamp, warStars, attackWins, defenseWins, donations, donationsReceived)
    VALUES (@playerTag, @timestamp, @warStars, @attackWins, @defenseWins, @donations, @donationsReceived)
  `);
  stmt.run({
    playerTag,
    timestamp: new Date().toISOString(),
    warStars: stats.warStars || 0,
    attackWins: stats.attackWins || 0,
    defenseWins: stats.defenseWins || 0,
    donations: stats.donations || 0,
    donationsReceived: stats.donationsReceived || 0
  });
}

// Get all players
export function getAllPlayers() {
  const stmt = db.prepare('SELECT * FROM players ORDER BY playerName ASC');
  return stmt.all();
}

// Get single player info
export function getPlayer(playerTag) {
  const stmt = db.prepare('SELECT * FROM players WHERE playerTag = ?');
  return stmt.get(playerTag);
}

// Get player war stats history
export function getPlayerWarStats(playerTag, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const stmt = db.prepare(`
    SELECT * FROM player_war_stats 
    WHERE playerTag = ? AND timestamp >= ?
    ORDER BY timestamp ASC
  `);
  return stmt.all(playerTag, cutoffDate.toISOString());
}

// Get all snapshots
export function getAllSnapshots() {
  const stmt = db.prepare('SELECT * FROM snapshots ORDER BY timestamp ASC');
  return stmt.all();
}

// Delete old snapshots (keep last 30 days, but ensure we have at least 7 days)
export function cleanupOldSnapshots() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentCount = db.prepare('SELECT COUNT(*) as count FROM snapshots WHERE timestamp >= ?').get(sevenDaysAgo.toISOString()).count;
  
  if (recentCount >= 1000) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stmt = db.prepare('DELETE FROM snapshots WHERE timestamp < ?');
    return stmt.run(thirtyDaysAgo.toISOString());
  }
  return { changes: 0 };
}

// Cleanup old player war stats (keep last 60 days)
export function cleanupOldPlayerStats() {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const stmt = db.prepare('DELETE FROM player_war_stats WHERE timestamp < ?');
  return stmt.run(sixtyDaysAgo.toISOString());
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

    if (diffMinutes > 5) {
      const pointsToAdd = Math.floor(diffMinutes / 5) - 1;
      for (let j = 1; j <= pointsToAdd; j++) {
        const interpolatedTime = new Date(prevTime.getTime() + j * 5 * 60 * 1000);
        const progress = j / (pointsToAdd + 1);
        
        insertSnapshot({
          timestamp: interpolatedTime.toISOString(),
          members: Math.round(prev.members + (current.members - prev.members) * progress),
          clanPoints: Math.round(prev.clanPoints + (current.clanPoints - prev.clanPoints) * progress),
          clanLevel: prev.clanLevel,
          clanCapitalPoints: Math.round(prev.clanCapitalPoints + (current.clanCapitalPoints - prev.clanCapitalPoints) * progress),
          warWins: prev.warWins,
          warLosses: prev.warLosses,
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
setInterval(cleanupOldPlayerStats, 24 * 60 * 60 * 1000);

// Run gap filling every hour
setInterval(fillDataGaps, 60 * 60 * 1000);