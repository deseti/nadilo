import { usePrivy, type CrossAppAccountWithMetadata } from '@privy-io/react-auth';
import { Game } from './components/Game';
import { Leaderboard } from './components/Leaderboard';
import { AddressEditor } from './components/AddressEditor';
import { UpdatePlayerData } from './components/UpdatePlayerData';
import { autoSubmitScore } from './lib/autoScoreSubmit';
import './App.css';
import { useEffect, useState } from 'react';
import { hasGameRole } from './lib/gameRegistration';

function App() {
  // Main hook from Privy to access authentication status and user data
  const { ready, authenticated, login, logout, user, getAccessToken } = usePrivy();
  
  // State for Monad Games ID integration
  const [monadWalletAddress, setMonadWalletAddress] = useState<string>('');
  const [monadUsername, setMonadUsername] = useState<string>('');
  const [hasUsername, setHasUsername] = useState<boolean>(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState<boolean>(false);
  const [userHasGameRole, setUserHasGameRole] = useState<boolean>(false);
  
  // State for address editing
  const [effectivePlayerAddress, setEffectivePlayerAddress] = useState<string>('');
  
  // State for navigation tabs
  const [activeTab, setActiveTab] = useState<'game' | 'admin'>('game');

  // Check for Monad Games ID cross-app account and username
  useEffect(() => {
    const checkMonadGamesID = async () => {
      if (authenticated && user && ready) {
        console.log("🔍 Checking for Monad Games ID integration...");
        console.log("🔧 Cross App ID:", import.meta.env.VITE_MONAD_GAMES_ID);
        
        // Check if user has linkedAccounts
        if (user.linkedAccounts.length > 0) {
          console.log("📋 User has linked accounts:", user.linkedAccounts.length);
          
          // Debug: log all linked accounts
          user.linkedAccounts.forEach((account, index) => {
            console.log(`📋 Account ${index}:`, {
              type: account.type,
              providerAppId: account.type === 'cross_app' ? (account as any).providerApp?.id : 'N/A'
            });
          });
          
          // Get the cross app account created using Monad Games ID
          const crossAppAccount: CrossAppAccountWithMetadata = user.linkedAccounts.filter(
            account => account.type === "cross_app" && 
            account.providerApp.id === import.meta.env.VITE_MONAD_GAMES_ID
          )[0] as CrossAppAccountWithMetadata;

          if (crossAppAccount) {
            console.log("✅ Found Monad Games ID cross-app account:", crossAppAccount);
            
            // The first embedded wallet created using Monad Games ID, is the wallet address
            if (crossAppAccount.embeddedWallets.length > 0) {
              const walletAddress = crossAppAccount.embeddedWallets[0].address;
              setMonadWalletAddress(walletAddress);
              console.log("🔑 Monad Games ID wallet address:", walletAddress);
              
              // Check username and game role
              await checkUsername(walletAddress);
              await checkGameRole(walletAddress);
            } else {
              console.log("⚠️ No embedded wallets found in cross-app account");
            }
          } else {
            console.log("⚠️ No Monad Games ID cross-app account found");
            console.log("🔍 Looking for Cross App ID:", import.meta.env.VITE_MONAD_GAMES_ID);
          }
        } else {
          console.log("⚠️ User has no linked accounts");
        }
      }
    };

    checkMonadGamesID();
  }, [authenticated, user, ready]);

  // Function to check username from Monad Games ID API
  const checkUsername = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    setIsCheckingUsername(true);
    try {
      console.log("🔍 Checking username for wallet:", walletAddress);
      const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
      const data = await response.json();
      
      console.log("📊 Username check response:", data);
      
      if (data.hasUsername && data.user) {
        setHasUsername(true);
        setMonadUsername(data.user.username);
        console.log("✅ Username found:", data.user.username);
      } else {
        setHasUsername(false);
        setMonadUsername('');
        console.log("⚠️ No username registered for wallet:", walletAddress);
        console.log("💡 Player should register at: https://monad-games-id-site.vercel.app/");
      }
    } catch (error) {
      console.error("❌ Error checking username:", error);
      setHasUsername(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };

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
      monadUsername: monadUsername,
      hasUsername: hasUsername
    });
  }, [ready, authenticated, user, monadWalletAddress, monadUsername, hasUsername]);

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
    const playerName = monadUsername || user?.email?.address || 'Anonymous';
    
    if (address && score > 0) {
      console.log('🎯 Game finished! Auto-submitting score:', {
        address,
        playerName,
        score,
        transactions
      });
      
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

  // Determine the player's identifier. Use effective address if set, otherwise prioritize Monad Games ID wallet, then regular wallet, email, or user ID
  const defaultAddress = monadWalletAddress || user?.wallet?.address || '';
  const playerID = effectivePlayerAddress || defaultAddress || user?.email?.address || user?.id || 'Anonymous';
  const displayName = monadUsername || user?.email?.address || user?.id || 'Anonymous';
  
  // Game address - using your actual registered game address
  const gameAddress = '0x2315bF06E7334dEdFeAA899240b64678dC4b92d1';
  const leaderboardContract = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';

  return (
    <div className="container">
      <header className="header">
        <h1>Renaz - Crypto Clash</h1>
        {authenticated && (
          <div className="user-info">
            {/* Show Monad Games ID status */}
            {monadWalletAddress ? (
              <div className="monad-status">
                {isCheckingUsername ? (
                  <span>🔍 Checking username...</span>
                ) : hasUsername ? (
                  <span>🎮 {monadUsername} (Monad Games ID)</span>
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
                  Dashboard configuration required for cross-app integration
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
            
            {/* Navigation tabs */}
            <div className="tabs-container">
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === 'game' ? 'active' : ''}`}
                  onClick={() => setActiveTab('game')}
                >
                  🎮 Game & Leaderboard
                </button>
                <button 
                  className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                >
                  ⚙️ Admin Panel
                </button>
              </div>
            </div>

            {/* Tab content */}
            {activeTab === 'game' && (
              <>
                <div className="game-section">
                  {/* Pass the unique playerID as a prop to the Game component */}
                  <Game 
                    playerID={playerID} 
                    onScoreUpdate={handleScoreUpdate}
                  />
                </div>
                <div className="leaderboard-section">
                  <Leaderboard playerID={playerID} />
                </div>
              </>
            )}

            {activeTab === 'admin' && (
              <div className="admin-section">
                <div className="admin-grid">
                  <div className="admin-card">
                    <UpdatePlayerData
                      defaultGameAddress={gameAddress}
                      monadWalletAddress={monadWalletAddress}
                      onUpdateSuccess={() => {
                        console.log('✅ Player data updated successfully');
                        // Optionally refresh leaderboard or show success message
                      }}
                      onUpdateError={(error) => {
                        console.error('❌ Failed to update player data:', error);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
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
                    const result = await login();
                    console.log("✅ Monad Games ID login result:", result);
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
            
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: 'rgba(255, 191, 36, 0.1)', 
              border: '1px solid rgba(255, 191, 36, 0.3)', 
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fbbf24'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>🔧 Developer Note:</p>
              <p style={{ margin: '0 0 8px 0' }}>
                For Monad Games ID integration to work, you need to configure cross-app settings in your Privy Dashboard:
              </p>
              <ol style={{ margin: '0', paddingLeft: '16px' }}>
                <li>Go to your Privy Dashboard</li>
                <li>Navigate to Cross-app or Global Wallets settings</li>
                <li>Add Monad Games ID as a provider with ID: <code>cmd8euall0037le0my79qpz42</code></li>
                <li>Enable cross-app wallet sharing</li>
              </ol>
            </div>
            
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: 'rgba(255, 193, 7, 0.1)', 
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ffc107'
            }}>
              <strong>⚠️ Cross-App Integration Notice:</strong><br/>
              For full Monad Games ID integration, cross-app authentication needs to be configured in the Privy dashboard. 
              Currently, each app creates separate embedded wallets. 
              Contact Privy support to enable cross-app wallet sharing between your app and Monad Games ID.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
