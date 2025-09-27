const cron = require('node-cron');


module.exports = {
start: ({ coc, clanTag, db }) => {
const minutes = parseInt(process.env.POLL_INTERVAL_MINUTES || '10', 10);
// run every N minutes
const rule = `*/${minutes} * * * *`;
console.log('Starting poller with:', rule);
cron.schedule(rule, async () => {
try {
console.log('Poller: fetching clan data...');
const clan = await coc.getClan(clanTag);
const snapshot = {
timestamp: Date.now(),
clanTag: clan.tag,
clanName: clan.name,
clanLevel: clan.clanLevel,
clanPoints: clan.clanPoints,
requiredTrophies: clan.requiredTrophies || 0,
membersCount: clan.memberList ? clan.memberList.length : clan.memberCount || 0,
warWins: clan.warWins || 0,
warLosses: clan.warLosses || 0,
raw: clan
};
db.insertSnapshot(snapshot);
console.log('Poller: snapshot saved.');
} catch (err) {
console.error('Poller error:', err.response ? err.response.data : err.message);
}
});
}
};