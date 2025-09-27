import React from 'react';


export default function ClanSummary({ latest }){
const info = latest;
return (
<div className="p-4 border rounded mb-6">
<h2 className="text-xl font-semibold">{info.clan_name} ({info.clan_tag})</h2>
<div className="grid grid-cols-2 gap-2 mt-3">
<div>Level: {info.clan_level}</div>
<div>Points: {info.clan_points}</div>
<div>Members: {info.members_count}</div>
<div>War wins / losses: {info.war_wins} / {info.war_losses}</div>
</div>
</div>
);
}