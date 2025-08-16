import React, { useState, useEffect } from 'react';
import { updatePlayerData } from '../lib/monadContract';
import { hasGameRole, isGameRegistered } from '../lib/gameRegistration';
import './SubmitScore.css';

// Use the standard type for window.ethereum
// If you need to use request, cast as any or use the EIP-1193 type
// No need to redeclare window.ethereum, just cast when using

interface SubmitScoreProps {
  playerAddress: string;
  score: number;
  transactionCount: number;
  gameAddress?: string;
  onSubmitSuccess?: () => void;
  onSubmitError?: (error: Error) => void;
}

export const SubmitScore: React.FC<SubmitScoreProps> = ({
  playerAddress,
  score,
  transactionCount,
  gameAddress = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4', // Default game address
  onSubmitSuccess,
  onSubmitError
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [gameRegistered, setGameRegistered] = useState<boolean>(false);
  const [userHasGameRole, setUserHasGameRole] = useState<boolean>(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, [playerAddress, gameAddress]);

  const checkPermissions = async () => {
    try {
      setCheckingPermissions(true);
      
      // Check if game is registered
      const registered = await isGameRegistered(gameAddress);
      setGameRegistered(registered);
      
      // Check if current user has GAME_ROLE
      if (playerAddress) {
        const hasRole = await hasGameRole(playerAddress);
        setUserHasGameRole(hasRole);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const handleSubmitScore = async () => {
    if (!playerAddress || score <= 0) {
      alert('Invalid player address or score');
      return;
    }

    // Check if wallet is connected
    if (!window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsSubmitting(true);
    setErrorDetails('');

    try {
      // Check network
  const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' });
      if (chainId !== '0x279F') { // 10143 in hex
        throw new Error('Please switch to Monad Testnet (Chain ID: 10143)');
      }

      // Check if account is connected
  const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Please connect your wallet first');
      }

      // Check permissions before attempting
      if (!gameRegistered) {
        throw new Error('This game is not registered in Monad Games ID. Please register it first.');
      }

      if (!userHasGameRole) {
        throw new Error('Your wallet does not have GAME_ROLE permission. Only authorized game contracts/addresses can submit scores.');
      }

      console.log('Submitting score to Monad Games ID...');
      const result = await updatePlayerData(
        playerAddress,
        score,
        transactionCount
      );

      if (result.success) {
        setIsSubmitted(true);
        console.log('Score submitted successfully to Monad Games ID:', result.transactionHash);
        onSubmitSuccess?.();
      }
    } catch (error: any) {
      console.error('Failed to submit score:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to submit score to Monad Games ID. ';
      
      if (error.message?.includes('User denied')) {
        errorMessage += 'Transaction was rejected by user.';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage += 'Insufficient MON tokens for gas fee.';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage += 'Smart contract rejected the transaction. Check if you have GAME_ROLE permission.';
      } else if (error.message?.includes('AccessControlUnauthorizedAccount')) {
        errorMessage += 'Access denied: Your wallet does not have GAME_ROLE permission.';
      } else if (error.message?.includes('GAME_ROLE')) {
        errorMessage += 'You need GAME_ROLE permission to submit scores.';
      } else if (error.message?.includes('not registered')) {
        errorMessage += 'Game must be registered first.';
      } else if (error.message?.includes('network')) {
        errorMessage += 'Network connection issue.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      setErrorDetails(errorMessage);
      onSubmitError?.(error as Error);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="submit-score-container">
        <div className="success-message">
          <h3>✅ Score Submitted!</h3>
          <p>Your score has been recorded on the Monad blockchain.</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="submit-score-container">
        <div className="success-message">
          <h3>✅ Score Submitted!</h3>
          <p>Your score has been recorded on Monad Games ID.</p>
        </div>
      </div>
    );
  }

  if (checkingPermissions) {
    return (
      <div className="submit-score-container">
        <div className="loading-message">
          <h3>🔍 Checking Permissions...</h3>
          <p>Verifying game registration and GAME_ROLE permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-score-container">
      <div className="score-info">
        <h3>Submit Score to Monad Games ID</h3>
        <p>Score: {score}</p>
        <p>Transactions: {transactionCount}</p>
        <p>Player: {playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}</p>
        <p>Game: {gameAddress.slice(0, 6)}...{gameAddress.slice(-4)}</p>
      </div>

      {/* Permission Status */}
      <div className="permission-status">
        <h4>Permission Status:</h4>
        <div className="status-grid">
          <div className="status-item">
            <span className={`status ${gameRegistered ? 'success' : 'error'}`}>
              {gameRegistered ? '✅' : '❌'} Game Registered
            </span>
          </div>
          <div className="status-item">
            <span className={`status ${userHasGameRole ? 'success' : 'error'}`}>
              {userHasGameRole ? '✅' : '❌'} GAME_ROLE Permission
            </span>
          </div>
        </div>
      </div>

      {/* Error details */}
      {errorDetails && (
        <div className="error-details">
          <p style={{ color: '#ff4444', fontSize: '14px' }}>{errorDetails}</p>
        </div>
      )}

      {/* Warnings and Instructions */}
      {!gameRegistered && (
        <div className="warning-message" style={{ background: '#443', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
          <p style={{ color: '#ff9944' }}>⚠️ Game Not Registered</p>
          <p style={{ fontSize: '12px', color: '#ccc' }}>
            This game needs to be registered in Monad Games ID first. Use the "Register Game" button in the Integration Status section.
          </p>
        </div>
      )}

      {!userHasGameRole && gameRegistered && (
        <div className="warning-message" style={{ background: '#443', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
          <p style={{ color: '#ff9944' }}>⚠️ No GAME_ROLE Permission</p>
          <p style={{ fontSize: '12px', color: '#ccc' }}>
            Your wallet ({playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}) does not have GAME_ROLE permission. 
            Only authorized game contracts or developers with GAME_ROLE can submit scores to Monad Games ID.
          </p>
          <p style={{ fontSize: '12px', color: '#ccc' }}>
            Contact Monad team to get GAME_ROLE for your game.
          </p>
        </div>
      )}
      
      <button 
        className="submit-score-button"
        onClick={handleSubmitScore}
        disabled={isSubmitting || !gameRegistered || !userHasGameRole}
        style={{ 
          opacity: (!gameRegistered || !userHasGameRole) ? 0.5 : 1,
          cursor: (!gameRegistered || !userHasGameRole) ? 'not-allowed' : 'pointer'
        }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit to Monad Games ID'}
      </button>

      {(!gameRegistered || !userHasGameRole) && (
        <div className="help-info" style={{ marginTop: '10px' }}>
          <small style={{ color: '#888' }}>
            💡 To submit scores to Monad Games ID:
            <br />1. Register your game (if not registered)
            <br />2. Get GAME_ROLE permission from Monad team
            <br />3. Then you can submit scores on-chain
          </small>
        </div>
      )}
    </div>
  );
};
