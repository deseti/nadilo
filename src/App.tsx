import { usePrivy } from '@privy-io/react-auth';
import { Game } from './components/Game';
import { Leaderboard } from './components/Leaderboard';
import { BlockchainLeaderboard } from './components/BlockchainLeaderboard';
import { IntegrationStatus } from './components/IntegrationStatus';
import './App.css';
import { useEffect } from 'react';

function App() {
  // Main hook from Privy to access authentication status and user data
  const { ready, authenticated, login, logout, user, getAccessToken } = usePrivy();

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
      } : null
    });
  }, [ready, authenticated, user]);

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

  // Determine the player's identifier. Use wallet address, email, or user ID as fallback
  const playerID = user?.wallet?.address || user?.email?.address || user?.id || 'Anonymous';
  
  // Game address placeholder - in production, this should be your actual game contract address
  // For now, we'll use the leaderboard contract address as the game identifier
  const gameAddress = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';

  return (
    <div className="container">
      <header className="header">
        <h1>Nadilo - Crypto Clash</h1>
        {/* Show Logout button only if user is logged in */}
        {authenticated && (
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        )}
      </header>

      <main className="main-content">
        {/* If logged in, show the game. Otherwise, show the login page. */}
        {authenticated ? (
          <div className="game-wrapper">
            {/* Integration Status */}
            <IntegrationStatus gameAddress={gameAddress} />
            
            <div className="game-section">
              {/* Pass the unique playerID as a prop to the Game component */}
              <Game playerID={playerID} />
            </div>
            <div className="leaderboard-section">
              <Leaderboard playerID={playerID} />
              {/* Show blockchain leaderboard only if user has a wallet address */}
              {user?.wallet?.address && (
                <BlockchainLeaderboard 
                  playerAddress={user.wallet.address}
                  gameAddress={gameAddress}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="login-container">
            <h2>Join the Battle Arena</h2>
            <p>Sign in to start fighting and climb the leaderboard!</p>
            <button 
              className="login-button" 
              onClick={async () => {
                console.log("🚀 Starting login process...");
                try {
                  console.log("📞 Calling login()...");
                  const result = await login();
                  console.log("✅ Login result:", result);
                } catch (error) {
                  console.error("❌ Login error:", {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    name: error instanceof Error ? error.name : 'Unknown Error'
                  });
                }
              }}
            >
              Sign In with Email
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
