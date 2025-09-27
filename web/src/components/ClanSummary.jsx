import React from 'react';

export default function ClanSummary({ latest }) {
  const warWinRate = latest.warWins + latest.warLosses > 0
    ? ((latest.warWins / (latest.warWins + latest.warLosses)) * 100).toFixed(1)
    : 'N/A';

  return (
    <div className="mb-8">
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-bold mb-2">{latest.clanName || 'Clan'}</h2>
        <p className="text-gray-600">Tag: {latest.clanTag || 'N/A'}</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Members</h3>
          <p className="text-2xl">{latest.members}</p>
        </div>
        <div className="p-4 border rounded hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Clan Points</h3>
          <p className="text-2xl">{latest.clanPoints?.toLocaleString()}</p>
        </div>
        <div className="p-4 border rounded hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Clan Level</h3>
          <p className="text-2xl">{latest.clanLevel}</p>
        </div>
        <div className="p-4 border rounded hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Capital Points</h3>
          <p className="text-2xl">{latest.clanCapitalPoints?.toLocaleString()}</p>
        </div>
        <div className="p-4 border rounded hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">War Record</h3>
          <p className="text-2xl">{latest.warWins}W - {latest.warLosses}L</p>
          <p className="text-sm text-gray-600">Win Rate: {warWinRate}%</p>
        </div>
        <div className="p-4 border rounded hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-2">Trophy Requirement</h3>
          <p className="text-2xl">{latest.requiredTrophies || 0}</p>
        </div>
      </div>
    </div>
  );
}