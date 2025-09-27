import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ClanSummary from './components/ClanSummary';
import HistoryChart from './components/HistoryChart';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async (abortController) => {
    setLoading(true);
    setError(null);
    try {
      const [resLatest, resHist] = await Promise.all([
        axios.get('/api/clan/latest', { signal: abortController?.signal }),
        axios.get('/api/clan/history', { signal: abortController?.signal })
      ]);
      
      if (resLatest.data.found) {
        setLatest(resLatest.data.data);
      }
      setHistory(resHist.data.data.reverse());
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error(err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const abortController = new AbortController();
    fetchAll(abortController);
    
    const interval = setInterval(() => {
      const newController = new AbortController();
      fetchAll(newController);
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, []);

  return (
    <div className="min-h-screen p-6 font-sans bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Clan Tracker</h1>
          <button 
            onClick={fetchAll} 
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 border border-red-500 rounded bg-red-50 text-red-700">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {loading && <LoadingSpinner message="Fetching clan data..." />}

        {!loading && !error && latest && (
          <ErrorBoundary>
            <ClanSummary latest={latest} />
            <HistoryChart history={history} />
          </ErrorBoundary>
        )}

        {!loading && !error && !latest && (
          <div className="p-8 text-center text-gray-600 border rounded bg-white">
            No data yet — waiting for the first snapshot.
          </div>
        )}
      </div>
    </div>
  );
}