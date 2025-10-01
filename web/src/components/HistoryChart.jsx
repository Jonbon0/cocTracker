import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const METRICS = {
  clanPoints: { name: 'Clan Points', color: '#8884d8', scale: 'right' },
  clanCapitalPoints: { name: 'Capital Points', color: '#82ca9d', scale: 'right' },
  members: { name: 'Members', color: '#ffc658', scale: 'left' },
  clanLevel: { name: 'Clan Level', color: '#ff7300', scale: 'left' }
};

export default function HistoryChart({ history }) {
  const [activeMetrics, setActiveMetrics] = useState(Object.keys(METRICS));
  
  const data = useMemo(() => {
    if (!history || !Array.isArray(history)) return [];
    
    return history.map(r => {
      if (!r || !r.timestamp) return null;
      
      const date = new Date(r.timestamp);
      const now = new Date();
      const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
      const relativeTime = diffHours > 24 
        ? `${Math.floor(diffHours / 24)}d ${diffHours % 24}h ago`
        : `${diffHours}h ${Math.floor((now - date) / (1000 * 60)) % 60}m ago`;

      return {
        timestamp: formatDate(r.timestamp),
        relativeTime,
        ...r
      };
    }).filter(Boolean);
  }, [history]);

  const toggleMetric = (metric) => {
    setActiveMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Metrics Over Time</h3>
        <div className="flex gap-2">
          {Object.entries(METRICS).map(([key, { name, color }]) => (
            <button
              key={key}
              onClick={() => toggleMetric(key)}
              className={
                activeMetrics.includes(key)
                  ? "px-2 py-1 text-sm rounded bg-gray-700 text-white transition-all"
                  : "px-2 py-1 text-sm rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              }
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: 'Members & Level', angle: -90, position: 'insideLeft' }}
            />
            
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: 'Points', angle: 90, position: 'insideRight' }}
            />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px'
              }}
              formatter={(value, name, props) => {
                if (value == null) return ['N/A', name];
                const entry = data[props.payload.index];
                const metricName = METRICS[name]?.name || name;
                return [
                  value.toLocaleString(),
                  `${metricName} (${entry?.relativeTime || 'unknown time'})`
                ];
              }}
            />
            <Legend />
            
            {Object.entries(METRICS).map(([key, { color, scale }]) => 
              activeMetrics.includes(key) && (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  yAxisId={scale === 'right' ? 'right' : 'left'}
                  connectNulls
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}