// Global chart instances
window.charts = {};

function initializeCharts() {
  // Register required components
  Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
}

function processData(rawData) {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    console.warn('No data provided to process');
    return [];
  }
  
  console.log('Processing raw data:', rawData);
  
  // Sort data by timestamp
  const sortedData = [...rawData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Group by day using a Map
  const dailyData = new Map();
  
  sortedData.forEach(entry => {
    const date = new Date(entry.timestamp);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, { 
        timestamp: date.toISOString(),
        donations: parseInt(entry.donations) || 0,
        attackWins: parseInt(entry.attackWins) || 0,
        warStars: parseInt(entry.warStars) || 0
      });
    } else {
      // Update with max values if multiple entries exist for the same day
      const existing = dailyData.get(dateKey);
      dailyData.set(dateKey, {
        ...existing,
        donations: Math.max(parseInt(entry.donations) || 0, existing.donations),
        attackWins: Math.max(parseInt(entry.attackWins) || 0, existing.attackWins),
        warStars: Math.max(parseInt(entry.warStars) || 0, existing.warStars)
      });
    }
  });
  
  // Convert to array and sort by date
  const processedData = Array.from(dailyData.values())
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
  console.log('Processed data:', processedData);
  return processedData;
}

function renderAllCharts(rawData) {
  try {
    console.log('Starting chart rendering with raw data:', rawData);
    
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      console.error('Invalid or empty data provided to renderAllCharts');
      return;
    }

    // Clear any existing charts
    Object.values(window.charts).forEach(chart => {
      if (chart) {
        try {
          chart.destroy();
        } catch (e) {
          console.error('Error destroying chart:', e);
        }
      }
    });
    window.charts = {};
    
    // Process and aggregate data by day
    const data = processData(rawData);
    console.log('Processed data for charts:', data);
    
    if (data.length < 2) {
      console.warn('Insufficient data points for rendering charts');
      return;
    }
    
    // Calculate daily activity metrics
    const activityData = [];
    for (let i = 1; i < data.length; i++) {
      const curr = data[i];
      const prev = data[i-1];
      
      activityData.push({
        date: new Date(curr.timestamp),
        donations: Math.max(0, curr.donations - prev.donations),
        attacks: Math.max(0, curr.attackWins - prev.attackWins),
        warStars: Math.max(0, curr.warStars - prev.warStars)
      });
    }
    
    console.log('Calculated activity data:', activityData);

    // Render activity chart
    const activityCanvas = document.getElementById('activityChart');
    if (!activityCanvas) {
      console.error('Activity chart canvas not found');
      return;
    }
    
    const activityCtx = activityCanvas.getContext('2d');
    window.charts.activity = new Chart(activityCtx, {
      type: 'bar',
      data: {
        labels: activityData.map(d => d.date),
        datasets: [
          {
            label: 'Daily Donations',
            data: activityData.map(d => d.donations),
            backgroundColor: 'rgba(0, 123, 255, 0.7)',
            borderColor: '#007bff',
            borderWidth: 1,
            yAxisID: 'donations'
          },
          {
            label: 'Daily Attacks',
            data: activityData.map(d => d.attacks),
            backgroundColor: 'rgba(40, 167, 69, 0.7)',
            borderColor: '#28a745',
            borderWidth: 1,
            yAxisID: 'attacks'
          },
          {
            label: 'Daily War Stars',
            data: activityData.map(d => d.warStars),
            backgroundColor: 'rgba(255, 193, 7, 0.7)',
            borderColor: '#ffc107',
            borderWidth: 1,
            yAxisID: 'stars'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true, 
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM D'
              }
            }
          },
          donations: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Daily Donations'
            },
            min: 0
          },
          attacks: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Daily Attacks'
            },
            min: 0
          },
          stars: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'War Stars'
            },
            min: 0
          }
        }
      }
    });

    // War Participation Chart
    const warCanvas = document.getElementById('warParticipationChart');
    if (!warCanvas) {
      console.error('War participation chart canvas not found');
      return;
    }
    
    const warCtx = warCanvas.getContext('2d');
    const cumulativeWarStats = data.map((d, i) => ({
      date: new Date(d.timestamp),
      stars: d.warStars,
      attacks: d.attackWins,
      participation: ((i > 0 ? data[i-1].warStars : 0) !== d.warStars) ? 1 : 0
    }));

    window.charts.warParticipation = new Chart(warCtx, {
      type: 'line',
      data: {
        labels: cumulativeWarStats.map(d => d.date),
        datasets: [
          {
            label: 'Total War Stars',
            data: cumulativeWarStats.map(d => d.stars),
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'War Participation',
            data: cumulativeWarStats.map(d => d.participation),
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            fill: true,
            tension: 0.4,
            hidden: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM D'
              }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Total War Stars'
            }
          }
        }
      }
    });

    // Activity Trend Chart
    const trendCanvas = document.getElementById('activityTrendChart');
    if (!trendCanvas) {
      console.error('Activity trend chart canvas not found');
      return;
    }
    
    const trendCtx = trendCanvas.getContext('2d');
    const windowSize = 7;
    const movingAverages = [];

    for (let i = windowSize - 1; i < activityData.length; i++) {
      const window = activityData.slice(i - windowSize + 1, i + 1);
      movingAverages.push({
        date: activityData[i].date,
        donations: window.reduce((sum, d) => sum + d.donations, 0) / windowSize,
        attacks: window.reduce((sum, d) => sum + d.attacks, 0) / windowSize,
        warStars: window.reduce((sum, d) => sum + d.warStars, 0) / windowSize
      });
    }

    window.charts.activityTrend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: movingAverages.map(d => d.date),
        datasets: [
          {
            label: '7-day Avg Donations',
            data: movingAverages.map(d => d.donations),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: '7-day Avg Attacks',
            data: movingAverages.map(d => d.attacks),
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: '7-day Avg War Stars',
            data: movingAverages.map(d => d.warStars),
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM D'
              }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Activity (7-day Average)'
            }
          }
        }
      }
    });

    console.log('All charts rendered successfully');
  } catch (error) {
    console.error('Error rendering charts:', error);
    ['activityChart', 'warParticipationChart', 'activityTrendChart'].forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  }
}