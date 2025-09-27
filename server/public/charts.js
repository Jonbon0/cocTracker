async function fetchSnapshots() {
  const res = await fetch('/api/clan');
  return res.json();
}

async function updateCharts() {
  const data = await fetchSnapshots();

  const timestamps = [new Date(data.timestamp).toLocaleDateString()];
  const members = [data.members_count];
  const xp = [data.clan_xp];
  const trophies = [data.total_trophies];

  // Clear previous charts
  if (window.membersChart) window.membersChart.destroy();
  if (window.xpChart) window.xpChart.destroy();
  if (window.trophiesChart) window.trophiesChart.destroy();

  const ctxMembers = document.getElementById('membersChart').getContext('2d');
  window.membersChart = new Chart(ctxMembers, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [{ label: 'Members', data: members, borderColor: 'blue', fill: false }]
    }
  });

  const ctxXp = document.getElementById('xpChart').getContext('2d');
  window.xpChart = new Chart(ctxXp, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [{ label: 'Clan XP', data: xp, borderColor: 'green', fill: false }]
    }
  });

  const ctxTrophies = document.getElementById('trophiesChart').getContext('2d');
  window.trophiesChart = new Chart(ctxTrophies, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [{ label: 'Total Trophies', data: trophies, borderColor: 'orange', fill: false }]
    }
  });
}

// Update every 1 minute
updateCharts();
setInterval(updateCharts, 60000);
