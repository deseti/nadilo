import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { isGameRegistered, hasGameRole } from '../lib/gameRegistration';
import { registerGame } from '../lib/monadContract';
import { GameRoleRequest } from './GameRoleRequest';
import './IntegrationStatus.css';

interface IntegrationStatusProps {
  gameAddress: string;
}

export const IntegrationStatus: React.FC<IntegrationStatusProps> = ({ gameAddress }) => {
  const { user } = usePrivy();
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [canRegister, setCanRegister] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    checkIntegrationStatus();
  }, [gameAddress, user]);

  const checkIntegrationStatus = async () => {
    try {
      setLoading(true);
      
      // Check if game is registered
      const registered = await isGameRegistered(gameAddress);
      setIsRegistered(registered);

      // Check if current user can register games (has GAME_ROLE)
      if (user?.wallet?.address && !registered) {
        const hasRole = await hasGameRole(user.wallet.address);
        setCanRegister(hasRole);
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterGame = async () => {
    if (!user?.wallet?.address) {
      alert('Please connect your wallet first');
      return;
    }

    setRegistering(true);
    try {
      const result = await registerGame(
        gameAddress,
        'Nadilo - Crypto Clash',
        '', // Add your game image URL here
        window.location.origin // Use current domain as game URL
      );

      if (result.success) {
        alert('Game registered successfully!');
        setIsRegistered(true);
        setCanRegister(false);
      }
    } catch (error) {
      console.error('Error registering game:', error);
      alert('Failed to register game. You might not have permission.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="integration-status">
        <h4>🔗 Monad Games ID Integration</h4>
        <p>Checking integration status...</p>
      </div>
    );
  }

  return (
    <div className="integration-status">
      <h4>🔗 Monad Games ID Integration</h4>
      
      <div className="status-grid">
        <div className="status-item">
          <span className="label">Chain:</span>
          <span className="status success">✅ Monad Testnet</span>
        </div>
        
        <div className="status-item">
          <span className="label">Wallet:</span>
          <span className={`status ${user?.wallet?.address ? 'success' : 'warning'}`}>
            {user?.wallet?.address ? '✅ Connected' : '⚠️ Not Connected'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="label">Game Registration:</span>
          <span className={`status ${isRegistered ? 'success' : 'error'}`}>
            {isRegistered ? '✅ Registered' : '❌ Not Registered'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="label">Contract:</span>
          <span className="status success">✅ Connected</span>
        </div>
      </div>

      {!isRegistered && canRegister && (
        <div className="register-section">
          <p>You have permission to register this game in Monad Games ID.</p>
          <button 
            onClick={handleRegisterGame}
            disabled={registering}
            className="register-btn"
          >
            {registering ? 'Registering...' : 'Register Game'}
          </button>
        </div>
      )}

      {!isRegistered && !canRegister && user?.wallet?.address && (
        <div className="info-section">
          <p>⚠️ This game needs to be registered by an admin with GAME_ROLE permission.</p>
        </div>
      )}

      {/* Show GameRoleRequest component when user doesn't have GAME_ROLE */}
      {user?.wallet?.address && !canRegister && (
        <GameRoleRequest
          playerAddress={user.wallet.address}
          gameAddress={gameAddress}
          gameName="Nadilo - Crypto Clash"
        />
      )}
    </div>
  );
};
