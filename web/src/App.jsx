import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ClanSummary from './components/ClanSummary';
import HistoryChart from './components/HistoryChart';


export default function App(){
const [latest, setLatest] = useState(null);
const [history, setHistory] = useState([]);
const [loading, setLoading] = useState(true);


const fetchAll = async () => {
setLoading(true);
try {
const resLatest = await axios.get('/api/clan/latest');
if (resLatest.data.found) setLatest(resLatest.data.data);
const resHist = await axios.get('/api/clan/history');
setHistory(resHist.data.data.reverse());
} catch (err) {
console.error(err);
} finally {
setLoading(false);
}
};


useEffect(()=>{ fetchAll(); }, []);


return (
<div className="min-h-screen p-6 font-sans">
<div className="max-w-4xl mx-auto">
<h1 className="text-3xl font-bold mb-4">Clan Tracker</h1>
<button onClick={fetchAll} className="p-2 rounded bg-blue-600 text-white mb-4">Refresh</button>
{loading && <div>Loading...</div>}
{!loading && latest && (
<>
<ClanSummary latest={latest} />
<HistoryChart history={history} />
</>
)}
{!loading && !latest && <div>No data yet — run the poller or click Fetch Now.</div>}
</div>
</div>
);
}