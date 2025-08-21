import { usePrivy, type CrossAppAccountWithMetadata } from '@privy-io/react-auth';
import { Game } from './components/Game';

import { AddressEditor } from './components/AddressEditor';
import { AddressSync } from './components/AddressSync';
import { MonadAddressVerification } from './components/MonadAddressVerification';
import { autoSubmitScore } from './lib/autoScoreSubmit';
import { useMonadGamesUser } from './hooks/useMonadGamesUser';
import './App.css';
import { useEffect, useState } from 'react';
import { hasGameRole } from './lib/gameRegistration';

function App() {
  // Main hook from Privy to access authentication status and user data
  const { ready, authenticated, login, logout, user } = usePrivy();
  
  // State for Monad Games ID integration
  const [monadWalletAddress, setMonadWalletAddress] = useState<string>('');
  const [userHasGameRole, setUserHasGameRole] = useState<boolean>(false);
  
  // State for address editing and sync
  const [effectivePlayerAddress, setEffectivePlayerAddress] = useState<string>('');
  const [syncedMonadAddress, setSyncedMonadAddress] = useState<string>('');

  // Use the custom hook for Monad Games ID user data
  const { 
    user: monadUser, 
    hasUsername, 
    isLoading: isLoadingUser, 
    error: userError 
  } = useMonadGamesUser(monadWalletAddress);

  // Check for Monad Games ID cross-app account
  useEffect(() => {
    const checkMonadGamesID = async () => {
      if (authenticated && user && ready) {
        console.log("🔍 Checking Monad Games ID integration...");
        
        // Check if user has linkedAccounts
        if (user.linkedAccounts.length > 0) {
          // Get the cross app account created using Monad Games ID
          const crossAppAccount: CrossAppAccountWithMetadata = user.linkedAccounts.filter(
            account => account.type === "cross_app" && 
            account.providerApp.id === "cmd8euall0037le0my79qpz42"
          )[0] as CrossAppAccountWithMetadata;

          // The first embedded wallet created using Monad Games ID, is the wallet address
          if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
            const walletAddress = crossAppAccount.embeddedWallets[0].address;
            console.log("✅ Monad Games ID Wallet found:", walletAddress);
            setMonadWalletAddress(walletAddress);

            // Check game role after getting wallet address
            await checkGameRole(walletAddress);
          }
        } else {
          console.log("⚠️ You need to link your Monad Games ID account to continue.");
          console.log("💡 Please login with Monad Games ID first at: https://monad-games-id-site.vercel.app/");
        }
      }
    };

    checkMonadGamesID();
  }, [authenticated, user, ready]);

  // Function to check game role permission
  const checkGameRole = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    try {
      console.log("🔍 Checking GAME_ROLE for wallet:", walletAddress);
      const hasRole = await hasGameRole(walletAddress);
      setUserHasGameRole(hasRole);
      console.log("🎮 GAME_ROLE status:", hasRole ? "✅ GRANTED" : "❌ NOT GRANTED");
    } catch (error) {
      console.error("❌ Error checking game role:", error);
      setUserHasGameRole(false);
    }
  };

  // Debug logging with useEffect to avoid too many logs
  useEffect(() => {
    console.log("🔍 App State Change:", {
      ready,
      authenticated,
      user: user ? {
        id: user.id,
        email: user.email?.address,
        wallet: user.wallet?.address,
        linkedAccounts: user.linkedAccounts?.length
      } : null,
      monadWallet: monadWalletAddress,
      monadUser: monadUser ? {
        username: monadUser.username,
        id: monadUser.id
      } : null,
      hasUsername: hasUsername
    });
  }, [ready, authenticated, user, monadWalletAddress, monadUser, hasUsername]);

  // Refresh game role status when wallet address changes
  useEffect(() => {
    if (monadWalletAddress) {
      console.log("🔄 Refreshing game role status...");
      checkGameRole(monadWalletAddress);
    }
  }, [monadWalletAddress]);

  // Show loading message while Privy is initializing
  if (!ready) {
    console.log("⏳ Privy not ready yet...");
    return (
      <div className="container">
        <h1>Loading Privy...</h1>
        <p>Initializing authentication...</p>
      </div>
    );
  }

  // Function to handle score updates from the game
  const handleScoreUpdate = async (score: number, transactions: number) => {
    const address = effectivePlayerAddress || monadWalletAddress || user?.wallet?.address;
    const playerName = monadUser?.username || user?.email?.address || 'Anonymous';
    
    if (address && score > 0) {
      console.log('🎯 Game finished! Auto-submitting score:', {
        address,
        playerName,
        score,
        transactions,
        gameAddress,
        leaderboardContract
      });
      
      // Debug Monad integration before submitting
      console.log('🔍 Debugging Monad integration...');
      const debugResult = await import('./utils/debugMonadIntegration').then(module => 
        module.debugMonadIntegration(address, gameAddress)
      );
      
      if (!debugResult.canSubmit) {
        console.warn('⚠️ Cannot submit to blockchain, but will save locally');
        
        let alertMessage = '⚠️ Score Submission Status:\n\n';
        alertMessage += `✅ Local Database: Will be saved\n`;
        alertMessage += `${debugResult.hasGameRole ? '✅' : '❌'} Game Wallet GAME_ROLE: ${debugResult.hasGameRole ? 'YES' : 'NO'}\n`;
        alertMessage += `${debugResult.gameRegistered ? '✅' : '❌'} Game Registration: ${debugResult.gameRegistered ? 'YES' : 'NO'}\n`;
        alertMessage += `${debugResult.canSubmit ? '✅' : '❌'} Blockchain Submission: ${debugResult.canSubmit ? 'YES' : 'NO'}\n\n`;
        
        if (debugResult.gameWalletAddress && debugResult.gameWalletAddress !== 'Not configured') {
          alertMessage += `🎮 Game Wallet: ${debugResult.gameWalletAddress}\n`;
          alertMessage += `👤 Player Wallet: ${address}\n\n`;
        }
        
        if (!debugResult.hasGameRole) {
          alertMessage += '📝 Issue: Game wallet not configured or missing GAME_ROLE\n';
          alertMessage += '💡 Solution: Check VITE_WALLET_PRIVATE_KEY in .env file\n\n';
        }
        
        alertMessage += 'Your score will still be saved locally and visible in the game!';
        alert(alertMessage);
      } else {
        console.log('✅ All checks passed, submitting to blockchain...');
      }
      
      // Auto submit to blockchain and local database
      await autoSubmitScore(
        address,
        playerName,
        leaderboardContract,
        score,
        transactions
      );
      
      // Refresh blockchain leaderboard after submission
      setTimeout(() => {
        window.location.reload(); // Simple way to refresh all data
      }, 3000);
    }
  };

  // Determine the player's identifier
  const defaultAddress = monadWalletAddress || user?.wallet?.address || '';
  const playerID = effectivePlayerAddress || defaultAddress || user?.email?.address || user?.id || 'Anonymous';
  const displayName = monadUser?.username || user?.email?.address || user?.id || 'Anonymous';
  
  // Game address - using your actual registered game address
  const gameAddress = '0x5b84Dc548e45cC4f1498b95C000C748c1c953f64';
  const leaderboardContract = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';

  return (
    <div className="container">
      <header className="header">
        <h1>Nadilo - Crypto Clash</h1>
        {authenticated && (
          <div className="user-info">
            {/* Show Monad Games ID status */}
            {monadWalletAddress ? (
              <div className="monad-status">
                {isLoadingUser ? (
                  <span>🔍 Checking username...</span>
                ) : hasUsername && monadUser ? (
                  <span>🎮 {monadUser.username} (Monad Games ID)</span>
                ) : (
                  <div>
                    <span>⚠️ Monad Games ID connected but no username</span>
                    <a 
                      href="https://monad-games-id-site.vercel.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        marginLeft: '10px', 
                        color: '#676FFF',
                        textDecoration: 'underline'
                      }}
                    >
                      Register Username
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="monad-status">
                <span>⚠️ No Monad Games ID linked</span>
                <small style={{ display: 'block', color: '#888', fontSize: '10px', marginTop: '4px' }}>
                  Cross-app authentication needed
                </small>
              </div>
            )}
            <span className="player-id">Player: {displayName}</span>
            <button className="logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="main-content">
        {/* If logged in, show the game. Otherwise, show the login page. */}
        {authenticated ? (
          <div className="game-wrapper">
            {/* Address Editor - Allow users to customize their address */}
            {user?.email?.address && (
              <AddressEditor
                userEmail={user.email.address}
                currentAddress={defaultAddress}
                onAddressChange={(newAddress) => {
                  setEffectivePlayerAddress(newAddress);
                  console.log('🔧 Address changed to:', newAddress);
                }}
                isMonadGamesConnected={!!monadWalletAddress}
              />
            )}

            {/* Address Sync Component */}
            {user?.email?.address && (
              <AddressSync
                currentAddress={effectivePlayerAddress || defaultAddress}
                onAddressSync={(monadAddress) => {
                  setSyncedMonadAddress(monadAddress);
                  setEffectivePlayerAddress(monadAddress);
                  console.log('🔗 Synced with Monad address:', monadAddress);
                }}
              />
            )}

            {/* Monad Address Verification */}
            {(effectivePlayerAddress || syncedMonadAddress) && (
              <MonadAddressVerification
                address={effectivePlayerAddress || syncedMonadAddress || defaultAddress}
                onVerificationResult={(result) => {
                  console.log('🔍 Verification result:', result);
                }}
              />
            )}
            
            {/* Development Tools */}
            {process.env.NODE_ENV === 'development' && (effectivePlayerAddress || monadWalletAddress) && (
              <div style={{ 
                background: '#1a1a1a', 
                border: '1px solid #333', 
                borderRadius: '8px', 
                padding: '15px', 
                margin: '10px 0',
                fontSize: '12px'
              }}>
                <h4 style={{ color: '#676FFF', margin: '0 0 10px 0' }}>🧪 Development Tools</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      const address = effectivePlayerAddress || monadWalletAddress;
                      if (address) {
                        const { debugMonadIntegration } = await import('./utils/debugMonadIntegration');
                        await debugMonadIntegration(address, gameAddress);
                      }
                    }}
                    style={{
                      background: '#333',
                      border: '1px solid #555',
                      color: '#fff',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    🔍 Debug Integration
                  </button>
                  <button
                    onClick={async () => {
                      const address = effectivePlayerAddress || monadWalletAddress;
                      if (address) {
                        const { testWithCurrentGame } = await import('./utils/testScoreSubmission');
                        const result = await testWithCurrentGame(address, 1000);
                        alert(result.success ? 
                          `✅ Test successful!\nNew Score: ${result.newScore}\nTotal Score: ${result.totalScore}` :
                          `❌ Test failed: ${result.error}`
                        );
                      }
                    }}
                    style={{
                      background: '#676FFF',
                      border: '1px solid #676FFF',
                      color: '#fff',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    🧪 Test Score Submit
                  </button>
                </div>
                <p style={{ margin: '8px 0 0 0', color: '#888', fontSize: '10px' }}>
                  Wallet: {effectivePlayerAddress || monadWalletAddress} | Game: {gameAddress}
                </p>
              </div>
            )}

            {/* Game and Leaderboard */}
            <div className="game-section">
              {/* Pass the unique playerID as a prop to the Game component */}
              <Game 
                playerID={playerID} 
                onScoreUpdate={handleScoreUpdate}
              />
            </div>

          </div>
        ) : (
          <div className="login-container">
            <h2>Join the Battle Arena</h2>
            <p>Sign in with Monad Games ID to start fighting and climb the leaderboard!</p>
            
            <div className="login-options">
              <button 
                className="login-button monad-login" 
                onClick={async () => {
                  console.log("🚀 Starting Monad Games ID login...");
                  try {
                    await login();
                  } catch (error) {
                    console.error("❌ Monad Games ID login error:", error);
                  }
                }}
                style={{
                  background: '#676FFF',
                  border: '2px solid #676FFF',
                  marginBottom: '10px'
                }}
              >
                🎮 Sign In with Monad Games ID
              </button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#888', marginTop: '15px' }}>
              New to Monad Games ID? <a href="https://monad-games-id-site.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#676FFF' }}>Register here</a>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
