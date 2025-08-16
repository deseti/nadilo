import { usePrivy } from '@privy-io/react-auth';
import { Game } from './components/Game';
import { Leaderboard } from './components/Leaderboard';
import './App.css';

function App() {
  // Main hook from Privy to access authentication status and user data
  const { ready, authenticated, login, logout, user } = usePrivy();

  // Show loading message while Privy is initializing
  if (!ready) {
    return <div className="container"><h1>Loading...</h1></div>;
  }

  // Determine the player's identifier. Use wallet address, email, or user ID as fallback
  const playerID = user?.wallet?.address || user?.email?.address || user?.id || 'Anonymous';

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
            <div className="game-section">
              {/* Pass the unique playerID as a prop to the Game component */}
              <Game playerID={playerID} />
            </div>
            <div className="leaderboard-section">
              <Leaderboard playerID={playerID} />
            </div>
          </div>
        ) : (
          <div className="login-container">
            <h2>Join the Battle Arena</h2>
            <p>Sign in to start fighting and climb the leaderboard!</p>
            <button className="login-button" onClick={login}>
              Sign In
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
