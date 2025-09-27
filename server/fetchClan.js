// fetchClan.js
import 'dotenv/config';
import fetch from 'node-fetch';

const API_KEY = process.env.COC_API_KEY;
const CLAN_TAG = process.env.CLAN_TAG;

if (!API_KEY) {
  console.error('Error: COC_API_KEY not set in .env');
  process.exit(1);
}

if (!CLAN_TAG) {
  console.error('Error: CLAN_TAG not set in .env');
  process.exit(1);
}

export async function fetchClan(clanTag = CLAN_TAG) {
  try {
    const encodedTag = encodeURIComponent(clanTag);
    const res = await fetch(`https://api.clashofclans.com/v1/clans/${encodedTag}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error ${res.status}: ${res.statusText}\n${text}`);
    }

    const data = await res.json();

    // Return a structured snapshot
    return {
      timestamp: Date.now(),
      clanTag: data.tag,
      clanName: data.name,
      clanLevel: data.clanLevel,
      clanPoints: data.clanPoints,
      requiredTrophies: data.requiredTrophies,
      membersCount: data.members.length,
      warWins: data.warWins,
      warLosses: data.warLosses,
      raw: data
    };
  } catch (err) {
    console.error('Error fetching clan:', err.message);
    return null;
  }
}

// Quick test if running directly
if (process.argv[1].endsWith('fetchClan.js')) {
  fetchClan().then(snapshot => {
    if (snapshot) {
      console.log('Clan snapshot fetched successfully:');
      console.log(snapshot);
    }
  });
}