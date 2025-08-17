import React, { useState, useEffect } from 'react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { updatePlayerData, getPlayerData } from '../lib/monadContract';
import './UpdatePlayerData.css';

interface UpdatePlayerDataProps {
  onUpdateSuccess?: () => void;
  onUpdateError?: (error: Error) => void;
  defaultGameAddress?: string;
}

export const UpdatePlayerData: React.FC<UpdatePlayerDataProps> = ({
  onUpdateSuccess,
  onUpdateError,
  defaultGameAddress = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4'
}) => {
  // Form state
  const [gameAddress, setGameAddress] = useState(defaultGameAddress);
  const [playerAddress, setPlayerAddress] = useState('');
  const [scoreAmount, setScoreAmount] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPlayerData, setCurrentPlayerData] = useState<{score: number, transactions: number} | null>(null);

  // Privy hooks
  const { wallets } = useWallets();
  const { connectWallet, linkWallet } = usePrivy();
  const { authenticated, ready } = usePrivy();

  const connectedWallet = wallets.find(wallet => wallet.connectorType !== 'embedded');
  const walletAddress = connectedWallet?.address;

  // Load current player data when addresses change
  useEffect(() => {
    if (gameAddress && playerAddress) {
      loadCurrentPlayerData();
    }
  }, [gameAddress, playerAddress]);

  const loadCurrentPlayerData = async () => {
    if (!gameAddress || !playerAddress) return;

    try {
      const data = await getPlayerData(gameAddress, playerAddress);
      setCurrentPlayerData(data);
    } catch (error) {
      console.error('Error loading player data:', error);
      setCurrentPlayerData(null);
    }
  };

  const validateForm = () => {
    if (!gameAddress.trim()) {
      throw new Error('Game address is required');
    }
    if (!playerAddress.trim()) {
      throw new Error('Player address is required');
    }
    if (!scoreAmount.trim() || parseInt(scoreAmount) < 0) {
      throw new Error('Score amount must be a positive number');
    }
    if (!transactionAmount.trim() || parseInt(transactionAmount) < 0) {
      throw new Error('Transaction amount must be a positive number');
    }
    if (!gameAddress.startsWith('0x') || gameAddress.length !== 42) {
      throw new Error('Invalid game address format');
    }
    if (!playerAddress.startsWith('0x') || playerAddress.length !== 42) {
      throw new Error('Invalid player address format');
    }
  };

  const handleConnectWallet = async () => {
    try {
      console.log('🔗 Attempting to connect wallet...');
      
      // Try different methods to connect wallet
      if (linkWallet) {
        console.log('🔗 Using linkWallet...');
        await linkWallet();
      } else {
        console.log('🔗 Trying direct MetaMask connection...');
        // Direct MetaMask connection
        if (window.ethereum) {
          try {
            const accounts = await (window.ethereum as any).request({ 
              method: 'eth_requestAccounts' 
            });
            console.log('✅ Connected accounts:', accounts);
            
            // Switch to Monad Testnet if needed
            try {
              await (window.ethereum as any).request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x279F' }], // 10143 in hex
              });
            } catch (switchError: any) {
              // If chain doesn't exist, try to add it
              if (switchError.code === 4902) {
                await (window.ethereum as any).request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x279F',
                    chainName: 'Monad Testnet',
                    nativeCurrency: {
                      name: 'MON',
                      symbol: 'MON',
                      decimals: 18,
                    },
                    rpcUrls: ['https://testnet-rpc.monad.xyz'],
                    blockExplorerUrls: ['https://testnet.monadexplorer.com'],
                  }],
                });
              }
            }
            
            // Reload page to detect new wallet
            setTimeout(() => window.location.reload(), 1000);
          } catch (ethError) {
            console.error('❌ MetaMask connection error:', ethError);
            throw ethError;
          }
        } else {
          throw new Error('No wallet provider found. Please install MetaMask or another wallet.');
        }
      }
    } catch (error: any) {
      console.error('❌ Error connecting wallet:', error);
      let errorMsg = 'Failed to connect wallet. ';
      if (error.message?.includes('User rejected')) {
        errorMsg += 'Connection was rejected by user.';
      } else if (error.message?.includes('No wallet provider')) {
        errorMsg += 'Please install MetaMask or another Web3 wallet.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }
      alert(errorMsg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      validateForm();
      
      setIsSubmitting(true);
      setErrorMessage('');
      setIsSuccess(false);

      console.log('Updating player data...', {
        gameAddress,
        playerAddress,
        scoreAmount,
        transactionAmount
      });

      const result = await updatePlayerData(
        playerAddress,
        parseInt(scoreAmount),
        parseInt(transactionAmount)
      );

      if (result.success) {
        setIsSuccess(true);
        console.log('Player data updated successfully:', result.transactionHash);
        
        // Reload current player data to show updated values
        await loadCurrentPlayerData();
        
        // Clear form
        setScoreAmount('');
        setTransactionAmount('');
        
        onUpdateSuccess?.();
      }

    } catch (error: any) {
      console.error('Failed to update player data:', error);
      
      let errorMsg = 'Failed to update player data. ';
      
      if (error.message?.includes('User denied')) {
        errorMsg += 'Transaction was rejected by user.';
      } else if (error.message?.includes('insufficient funds')) {
        errorMsg += 'Insufficient MON tokens for gas fee.';
      } else if (error.message?.includes('execution reverted')) {
        errorMsg += 'Smart contract rejected the transaction.';
      } else if (error.message?.includes('AccessControlUnauthorizedAccount')) {
        errorMsg += 'Access denied: Your wallet does not have GAME_ROLE permission.';
      } else if (error.message?.includes('GAME_ROLE')) {
        errorMsg += 'You need GAME_ROLE permission to update player data.';
      } else if (error.message?.includes('not registered')) {
        errorMsg += 'Game must be registered first.';
      } else if (error.message?.includes('network')) {
        errorMsg += 'Network connection issue. Please check your connection to Monad Testnet.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }
      
      setErrorMessage(errorMsg);
      onUpdateError?.(error as Error);

    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setGameAddress(defaultGameAddress);
    setPlayerAddress(walletAddress || '');
    setScoreAmount('');
    setTransactionAmount('');
    setIsSuccess(false);
    setErrorMessage('');
  };

  return (
    <div className="update-player-data-container">
      <div className="update-player-data-header">
        <h2>Update Player Data</h2>
        <p>Submit player score and transaction data to Monad Games ID Leaderboard</p>
      </div>

      {/* Wallet Connection */}
      <div className="wallet-section">
        {!authenticated || !walletAddress ? (
          <div className="wallet-connect">
            <p>Connect your wallet to interact with the Monad contract</p>
            <button 
              onClick={handleConnectWallet}
              className="connect-wallet-btn"
              disabled={!ready}
            >
              {!ready ? 'Loading...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div className="wallet-connected">
            <p>✅ Wallet Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
          </div>
        )}
      </div>

      {authenticated && walletAddress && (
        <>
          {/* Current Player Data */}
          {currentPlayerData && (
            <div className="current-data-section">
              <h3>Current Player Data</h3>
              <div className="current-data-grid">
                <div className="data-item">
                  <span className="label">Current Score:</span>
                  <span className="value">{currentPlayerData.score}</span>
                </div>
                <div className="data-item">
                  <span className="label">Current Transactions:</span>
                  <span className="value">{currentPlayerData.transactions}</span>
                </div>
              </div>
            </div>
          )}

          {/* Update Form */}
          <form onSubmit={handleSubmit} className="update-form">
            <div className="form-group">
              <label htmlFor="gameAddress">Game Address:</label>
              <input
                id="gameAddress"
                type="text"
                value={gameAddress}
                onChange={(e) => setGameAddress(e.target.value)}
                placeholder="0x..."
                required
              />
              <small>The address of the registered game contract</small>
            </div>

            <div className="form-group">
              <label htmlFor="playerAddress">Player Address:</label>
              <div className="input-with-button">
                <input
                  id="playerAddress"
                  type="text"
                  value={playerAddress}
                  onChange={(e) => setPlayerAddress(e.target.value)}
                  placeholder="0x..."
                  required
                />
                {walletAddress && (
                  <button
                    type="button"
                    onClick={() => setPlayerAddress(walletAddress)}
                    className="use-wallet-btn"
                    title="Use connected wallet address"
                  >
                    Use My Wallet
                  </button>
                )}
              </div>
              <small>The player's wallet address (can be any valid address)</small>
            </div>

            <div className="form-group">
              <label htmlFor="scoreAmount">Score Amount:</label>
              <input
                id="scoreAmount"
                type="number"
                min="0"
                value={scoreAmount}
                onChange={(e) => setScoreAmount(e.target.value)}
                placeholder="0"
                required
              />
              <small>The score amount to add for this player</small>
            </div>

            <div className="form-group">
              <label htmlFor="transactionAmount">Transaction Amount:</label>
              <input
                id="transactionAmount"
                type="number"
                min="0"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="0"
                required
              />
              <small>The number of transactions to add for this player</small>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="error-message">
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="success-message">
                <p>✅ Player data updated successfully!</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="button-group">
              <button
                type="submit"
                disabled={isSubmitting || !authenticated || !walletAddress}
                className="submit-btn"
              >
                {isSubmitting ? 'Updating...' : 'Update Player Data'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="reset-btn"
              >
                Reset Form
              </button>
            </div>
          </form>

          {/* Contract Info */}
          <div className="contract-info">
            <h3>Contract Information</h3>
            <p>
              <strong>Contract Address:</strong> 
              <a 
                href={`https://testnet.monadexplorer.com/address/0xceCBFF203C8B6044F52CE23D914A1bfD997541A4`}
                target="_blank"
                rel="noopener noreferrer"
              >
                0xceCBFF203C8B6044F52CE23D914A1bfD997541A4
              </a>
            </p>
            <p><strong>Network:</strong> Monad Testnet (Chain ID: 10143)</p>
          </div>
        </>
      )}
    </div>
  );
};
