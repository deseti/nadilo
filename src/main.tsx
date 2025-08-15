import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PrivyProvider } from '@privy-io/react-auth';
import { defineChain } from 'viem';

// 1. Define the Monad Testnet chain manually
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
});

// 2. Securely access the App ID from environment variables
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

if (!privyAppId) {
  throw new Error("VITE_PRIVY_APP_ID is not set in your .env file!");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Define the network that Privy will connect to
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet], 
        
        // Customize Privy's appearance and behavior
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          logo: '', // Optional: Add your game logo URL here
        },
        // **THIS IS THE CHANGE:** Only allow email login
        loginMethods: ['email'],
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
);
