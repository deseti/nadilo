import React, { useState, useEffect } from 'react';
import { getPlayerData, getTotalPlayerScore } from '../lib/monadContract';
import { isGameRegistered, getGameInfo } from '../lib/gameRegistration';
import { SubmitScore } from './SubmitScore';
import './BlockchainLeaderboard.css';

interface BlockchainLeaderboardProps {
  playerAddress: string;
  gameAddress: string;
}

interface PlayerData {
  address: string;
  score: number;
  transactions: number;
}

interface GameInfo {
  address: string;
  image: string;
  name: string;
  url: string;
}

export const BlockchainLeaderboard: React.FC<BlockchainLeaderboardProps> = ({
  playerAddress,
  gameAddress
}) => {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitScore, setShowSubmitScore] = useState(false);

  useEffect(() => {
    loadPlayerData();
  }, [playerAddress, gameAddress]);

  const loadPlayerData = async () => {
    if (!playerAddress || !gameAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if game is registered first
      const registered = await isGameRegistered(gameAddress);
      setIsRegistered(registered);

      if (registered) {
        // Get game information
        const gameData = await getGameInfo(gameAddress);
        setGameInfo(gameData);

        // Load player data for this specific game
        const playerGameData = await getPlayerData(gameAddress, playerAddress);
        
        // Load total score across all games
        const total = await getTotalPlayerScore(playerAddress);

        setPlayerData({
          address: playerAddress,
          score: playerGameData.score,
          transactions: playerGameData.transactions,
        });
        
        setTotalScore(total);
      } else {
        setError('This game is not registered in the Monad Games ID system');
      }
    } catch (err) {
      console.error('Error loading blockchain data:', err);
      setError('Failed to load data from Monad blockchain');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSuccess = () => {
    setShowSubmitScore(false);
    // Reload data after successful submission
    setTimeout(() => {
      loadPlayerData();
    }, 2000); // Wait a bit for blockchain to update
  };

  const handleSubmitError = (error: Error) => {
    console.error('Submit error:', error);
  };

  if (loading) {
    return (
      <div className="blockchain-leaderboard">
        <h3>⛓️ Blockchain Stats</h3>
        <p>Loading from Monad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blockchain-leaderboard">
        <h3>⛓️ Blockchain Stats</h3>
        <p style={{ color: '#ff4444' }}>{error}</p>
        <button onClick={loadPlayerData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="blockchain-leaderboard">
      <h3>⛓️ Blockchain Stats</h3>
      
      {!isRegistered && !loading && (
        <div className="warning-message">
          <p>⚠️ Game not registered in Monad Games ID</p>
          <p>Contact the developer to register this game</p>
        </div>
      )}

      {gameInfo && (
        <div className="game-info">
          <p><strong>Game:</strong> {gameInfo.name}</p>
        </div>
      )}
      
      <div className="player-stats">
        <div className="stat-item">
          <span className="label">Game Score:</span>
          <span className="value">{playerData?.score || 0}</span>
        </div>
        
        <div className="stat-item">
          <span className="label">Game Transactions:</span>
          <span className="value">{playerData?.transactions || 0}</span>
        </div>
        
        <div className="stat-item">
          <span className="label">Total Score:</span>
          <span className="value">{totalScore}</span>
        </div>
        
        <div className="stat-item">
          <span className="label">Player:</span>
          <span className="address">{playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}</span>
        </div>
      </div>

      <div className="actions">
        <button onClick={loadPlayerData} className="refresh-btn">
          Refresh
        </button>
        
        <button 
          onClick={() => setShowSubmitScore(!showSubmitScore)} 
          className="submit-btn"
        >
          {showSubmitScore ? 'Hide Submit' : 'Submit Score'}
        </button>
      </div>

      {showSubmitScore && (
        <SubmitScore
          playerAddress={playerAddress}
          score={100} // Demo score - in real game, get from game state
          transactionCount={1}
          onSubmitSuccess={handleSubmitSuccess}
          onSubmitError={handleSubmitError}
        />
      )}
    </div>
  );
};
