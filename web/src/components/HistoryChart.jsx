import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';


export default function HistoryChart({ history }){
// prepare data: timestamp -> clan_points
const data = history.map(r => ({
t: new Date(r.timestamp).toLocaleString(),
points: r.clan_points
}));


return (
<div className="p-4 border rounded">
<h3 className="font-semibold mb-2">Points over time</h3>
<div style={{ width: '100%', height: 300 }}>
<ResponsiveContainer>
<LineChart data={data}>
<XAxis dataKey="t"/>
<YAxis/>
<Tooltip/>
<Line type="monotone" dataKey="points" stroke="#8884d8" strokeWidth={2} dot={false} />
</LineChart>
</ResponsiveContainer>
</div>
</div>
);
}