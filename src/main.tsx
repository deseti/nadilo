import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PrivyProvider } from '@privy-io/react-auth';
import { defineChain } from 'viem';

// 1. Define the Monad Testnet chain manually with correct RPC from official docs
const monadTestnet = defineChain({
  id: 10143, // Correct Monad Testnet Chain ID
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'], // Official RPC from docs
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Monad Testnet Explorer', 
      url: 'https://testnet.monadexplorer.com' // Official explorer from docs
    },
  },
  testnet: true,
});

console.log("Monad Testnet configured:", {
  id: monadTestnet.id,
  name: monadTestnet.name,
  rpc: monadTestnet.rpcUrls.default.http[0]
});

// 2. Get your own Privy App ID from environment variables
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

console.log("Environment check:", {
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  hasPrivyId: !!privyAppId,
  privyIdLength: privyAppId?.length || 0
});

if (!privyAppId) {
  console.error("VITE_PRIVY_APP_ID is not set! Please check your .env file");
  console.error("Available env vars:", Object.keys(import.meta.env));
  throw new Error("VITE_PRIVY_APP_ID is not set in your .env file!");
}

console.log("Privy App ID configured:", privyAppId.slice(0, 8) + "...");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <PrivyProvider
    appId={privyAppId}
    config={{
      // ONLY use Monad Testnet - no other chains allowed
      defaultChain: monadTestnet,
      supportedChains: [monadTestnet], // Only Monad Testnet allowed
      
      // Customize Privy's appearance and behavior
      appearance: {
        theme: 'dark',
        accentColor: '#676FFF',
      },
      
      // Configure login methods - INI YANG PALING PENTING untuk Monad Games ID integration
      loginMethodsAndOrder: {
        // Don't forget to enable Monad Games ID support in:
        // Global Wallet > Integrations > Monad Games ID (click on the slide to enable)
        primary: ["privy:cmd8euall0037le0my79qpz42"], // This is the Cross App ID, DO NOT CHANGE THIS
      },
      
      // Configure embedded wallets
      embeddedWallets: {
        createOnLogin: 'users-without-wallets',
      },
      
      // Configure external wallets
      externalWallets: {
        coinbaseWallet: {
          connectionOptions: 'smartWalletOnly'
        }
      },
      
      // Disable WalletConnect to prevent duplicate init
      walletConnectCloudProjectId: undefined,
    }}
  >
    <App />
  </PrivyProvider>,
);
