function createActivityContainer() {
  const container = document.getElementById('activityContainer');
  container.innerHTML = ''; // Clear previous content

  // Create and append time filter
  const timeFilter = document.createElement('div');
  timeFilter.className = 'time-filter';
  const dayOptions = [7, 14, 30, 60];
  dayOptions.forEach(d => {
    const button = document.createElement('button');
    button.setAttribute('data-days', d);
    button.textContent = d + ' Days';
    if (d === 60) button.className = 'active';
    timeFilter.appendChild(button);
  });
  container.appendChild(timeFilter);

  // Create activity details section
  const activityDetails = document.createElement('div');
  activityDetails.className = 'activity-details';
  
  const detailsTitle = document.createElement('h3');
  detailsTitle.textContent = 'Activity Overview';
  activityDetails.appendChild(detailsTitle);

  const activityGrid = document.createElement('div');
  activityGrid.className = 'activity-grid';

  // Create activity cards
  const cards = [
    { id: 'lastSeenTime', title: 'Last Active' },
    { id: 'avgDonations', title: 'Daily Donations' },
    { id: 'warParticipation', title: 'War Stats' },
    { id: 'activityTrend', title: 'Activity Trend' }
  ];

  cards.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'activity-card';
    
    const cardTitle = document.createElement('h4');
    cardTitle.textContent = card.title;
    
    const cardContent = document.createElement('div');
    cardContent.id = card.id;
    cardContent.textContent = '-';
    
    cardDiv.appendChild(cardTitle);
    cardDiv.appendChild(cardContent);
    activityGrid.appendChild(cardDiv);
  });

  activityDetails.appendChild(activityGrid);
  container.appendChild(activityDetails);

  // Create chart containers
  const charts = [
    { id: 'activityChart', title: '📈 Daily Activity Metrics' },
    { id: 'warParticipationChart', title: '⚔️ War Participation Stats' },
    { id: 'activityTrendChart', title: '📊 Activity Trend Analysis' }
  ];

  charts.forEach(chart => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper';
    wrapper.style.height = '400px'; // Fixed height for chart containers
    
    const title = document.createElement('h3');
    title.textContent = chart.title;
    
    const canvas = document.createElement('canvas');
    canvas.id = chart.id;
    
    wrapper.appendChild(title);
    wrapper.appendChild(canvas);
    container.appendChild(wrapper);
  });

  container.style.display = 'block';
}