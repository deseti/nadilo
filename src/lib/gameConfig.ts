// Game configuration for Nadilo
export const GAME_CONFIG = {
  // Your registered game address on Monad Testnet
  GAME_ADDRESS: '0x5b84Dc548e45cC4f1498b95C000C748c1c953f64',
  
  // Game settings
  SCORE_SUBMISSION: {
    // Submit score every X points
    SCORE_THRESHOLD: 10,
    
    // Track transactions (actions that cost points/tokens)
    TRANSACTION_THRESHOLD: 1,
  },
  
  // Game metadata
  METADATA: {
    name: 'Nadilo - Crypto Clash',
    url: 'https://nadilo.vercel.app/',
    image: 'https://nadilo.vercel.app/icon.png' // You can update this with your game icon
  },
  
  // Monad Games ID configuration
  MONAD_GAMES_ID: 'cmd8euall0037le0my79qpz42',
  
  // Contract addresses
  CONTRACTS: {
    LEADERBOARD: '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4'
  }
} as const;
