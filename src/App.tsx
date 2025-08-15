import { usePrivy } from '@privy-io/react-auth';
import { Game } from './components/Game';
import './App.css';

function App() {
  // Main hook from Privy to access authentication status
  const { ready, authenticated, login, logout } = usePrivy();

  // Show loading message while Privy is initializing
  if (!ready) {
    return <div className="container"><h1>Loading...</h1></div>;
  }

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
        {/* If logged in, show game content. If not, show login page. */}
        {authenticated ? (
          <div className="game-wrapper">
            <Game />
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
