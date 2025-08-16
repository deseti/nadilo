import { useState, useEffect } from 'react';
import { LeaderboardService } from '../services/leaderboard';
import type { LeaderboardEntry } from '../lib/supabase';

interface LeaderboardProps {
  playerID: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ playerID }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await LeaderboardService.getTopScores(10);
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const success = await LeaderboardService.submitScore(playerID, 999, 60);
      if (success) {
        alert('Test score submitted successfully!');
        loadLeaderboard();
      } else {
        alert('Failed to submit test score');
      }
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  if (loading) {
    return (
      <div className="leaderboard">
        <h3>🏆 Leaderboard</h3>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <h3>🏆 Leaderboard</h3>
        <p style={{ color: '#ff4444' }}>{error}</p>
        <button onClick={loadLeaderboard} className="retry-btn">
          Retry
        </button>
        <button onClick={testConnection} className="test-btn">
          Test Connection
        </button>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h3>🏆 Leaderboard</h3>
      <button onClick={testConnection} className="test-btn">
        Test Submit Score
      </button>
      <button onClick={loadLeaderboard} className="refresh-btn">
        Refresh
      </button>
      
      {leaderboard.length === 0 ? (
        <p>No scores yet. Be the first!</p>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((entry, index) => (
            <div 
              key={entry.id} 
              className={`leaderboard-entry ${entry.player_name === playerID ? 'current-player' : ''}`}
            >
              <span className="rank">#{index + 1}</span>
              <span className="name">{entry.player_name}</span>
              <span className="score">{entry.score}</span>
              <span className="best">BEST</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};