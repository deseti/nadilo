import React, { useState, useEffect } from 'react';
import { getPlayerData, getTotalPlayerScore } from '../lib/monadContract';
import { isGameRegistered, getGameInfo, hasGameRole } from '../lib/gameRegistration';
import { SubmitScore } from './SubmitScore';
import { MonadSetupGuide } from './MonadSetupGuide';
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
  const [userHasGameRole, setUserHasGameRole] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitScore, setShowSubmitScore] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    console.log('🔄 BlockchainLeaderboard: Address changed, reloading data...', {
      playerAddress,
      gameAddress
    });
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
      
      console.log('📊 Loading blockchain data for:', {
        playerAddress,
        gameAddress
      });

      // Check if game is registered first
      const registered = await isGameRegistered(gameAddress);
      setIsRegistered(registered);
      console.log('🎮 Game registration status:', registered);

      // Check if user has GAME_ROLE
      const hasRole = await hasGameRole(playerAddress);
      setUserHasGameRole(hasRole);
      console.log('🎭 GAME_ROLE status for', playerAddress, ':', hasRole);

      if (registered) {
        // Get game information
        const gameData = await getGameInfo(gameAddress);
        setGameInfo(gameData);
        console.log('📋 Game info:', gameData);

        // Load player data for this specific game
        const playerGameData = await getPlayerData(gameAddress, playerAddress);
        console.log('👤 Player game data:', playerGameData);
        
        // Load total score across all games
        const total = await getTotalPlayerScore(playerAddress);
        console.log('🏆 Total score:', total);

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
      <h3>⛓️ Monad Games ID Stats</h3>
      
      {!isRegistered && !loading && (
        <div className="warning-message">
          <p>⚠️ Game not registered in Monad Games ID</p>
          <p>Contact the developer to register this game</p>
        </div>
      )}

      {!userHasGameRole && !loading && isRegistered && (
        <div className="warning-message">
          <p>⚠️ No GAME_ROLE permission</p>
          <p>Need GAME_ROLE to submit scores to Monad Games ID</p>
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

        <div className="stat-item">
          <span className="label">GAME_ROLE:</span>
          <span className={`status ${userHasGameRole ? 'success' : 'error'}`}>
            {userHasGameRole ? '✅ Yes' : '❌ No'}
          </span>
        </div>
      </div>

      <div className="actions">
        <button onClick={loadPlayerData} className="refresh-btn">
          Refresh
        </button>
        
        <button 
          onClick={() => setShowSubmitScore(!showSubmitScore)} 
          className="submit-btn"
          disabled={!isRegistered || !userHasGameRole}
          style={{
            opacity: (!isRegistered || !userHasGameRole) ? 0.5 : 1
          }}
        >
          {showSubmitScore ? 'Hide Submit' : 'Submit Score'}
        </button>

        <button 
          onClick={() => setShowSetupGuide(!showSetupGuide)} 
          className="setup-btn"
          style={{
            background: '#676FFF',
            color: 'white'
          }}
        >
          {showSetupGuide ? 'Hide' : 'Show'} Setup Guide
        </button>
      </div>

      {showSetupGuide && (
        <MonadSetupGuide
          gameAddress={gameAddress}
          playerAddress={playerAddress}
          gameRegistered={isRegistered}
          hasGameRole={userHasGameRole}
        />
      )}

      {showSubmitScore && (
        <SubmitScore
          playerAddress={playerAddress}
          gameAddress={gameAddress}
          score={Math.max(100, Math.floor(Math.random() * 1000))} // Demo score with some variation
          transactionCount={1}
          onSubmitSuccess={handleSubmitSuccess}
          onSubmitError={handleSubmitError}
        />
      )}
    </div>
  );
};
