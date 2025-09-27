require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 4000;
const apiKey = process.env.COC_API_KEY;
const clanTag = process.env.CLAN_TAG;


if (!apiKey) {
console.error('COC_API_KEY missing in environment');
process.exit(1);
}
if (!clanTag) {
console.error('CLAN_TAG missing in environment');
process.exit(1);
}


const coc = makeCoc({ apiKey });


app.get('/api/clan/latest', async (req, res) => {
try {
const latest = db.getLatestSnapshot(clanTag);
if (!latest) return res.json({ found: false });
const parsed = { ...latest, json_blob: JSON.parse(latest.json_blob) };
res.json({ found: true, data: parsed });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'server error' });
}
});


app.get('/api/clan/history', async (req, res) => {
try {
const rows = db.getSnapshots(clanTag, 500);
res.json({ data: rows.map(r => ({ ...r, json_blob: JSON.parse(r.json_blob) })) });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'server error' });
}
});


app.get('/api/fetch-now', async (req, res) => {
try {
const clan = await coc.getClan(clanTag);
const snapshot = {
timestamp: Date.now(),
clanTag: clan.tag,
clanName: clan.name,
clanLevel: clan.clanLevel || clan.clanLevel,
clanPoints: clan.clanPoints || clan.clanPoints,
requiredTrophies: clan.requiredTrophies || 0,
membersCount: clan.memberList ? clan.memberList.length : clan.memberCount || 0,
warWins: (clan.warWins || 0),
warLosses: (clan.warLosses || 0),
raw: clan
};


db.insertSnapshot(snapshot);
res.json({ ok: true, snapshotInserted: true });
} catch (err) {
console.error(err.response ? err.response.data : err.message);
res.status(500).json({ error: 'fetch failed' });
}
});


app.listen(PORT, () => {
console.log(`Server listening on ${PORT}`);
// start poller
poller.start({ coc, clanTag, db });
});