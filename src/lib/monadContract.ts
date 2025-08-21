import { createPublicClient, createWalletClient, http, custom, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import MONAD_LEADERBOARD_ABI from './monadLeaderboardABI';

// Alamat smart contract Monad Games ID Leaderboard
export const MONAD_LEADERBOARD_CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';

// Chain config Monad Testnet (must match with main.tsx)
const monadTestnet = {
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
};

// Public client for reading data from contract (no wallet required)
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

// Function to create wallet client from window.ethereum (MetaMask/wallet provider)
export function createWalletClientFromProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: monadTestnet,
      transport: custom(window.ethereum as any),
    });
  }
  throw new Error('No wallet provider found');
}

// Function to create wallet client from private key (for game operations)
export function createGameWalletClient() {
  const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('VITE_WALLET_PRIVATE_KEY not found in environment variables');
  }

  if (!privateKey.startsWith('0x')) {
    throw new Error('VITE_WALLET_PRIVATE_KEY must start with 0x');
  }

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(),
    });

    console.log('🎮 Game wallet created:', account.address);
    return { walletClient, account };
  } catch (error) {
    console.error('❌ Error creating game wallet:', error);
    throw new Error('Invalid VITE_WALLET_PRIVATE_KEY format');
  }
}

// Function to read player data from smart contract
export async function getPlayerData(gameAddress: string, playerAddress: string) {
  try {
    const result = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'playerDataPerGame',
      args: [gameAddress, playerAddress],
    }) as [bigint, bigint];
    
    return {
      score: Number(result[0]),
      transactions: Number(result[1]),
    };
  } catch (error) {
    console.error('Error reading player data:', error);
    throw error;
  }
}

// Function to read total player score
export async function getTotalPlayerScore(playerAddress: string) {
  try {
    const result = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'totalScoreOfPlayer',
      args: [playerAddress],
    }) as bigint;
    
    return Number(result);
  } catch (error) {
    console.error('Error reading total player score:', error);
    throw error;
  }
}

// Function to update player data (submit score to blockchain)
export async function updatePlayerData(
  playerAddress: string, 
  scoreAmount: number, 
  transactionAmount: number
) {
  try {
    console.log('Starting score submission:', {
      playerAddress,
      scoreAmount,
      transactionAmount,
      contractAddress: MONAD_LEADERBOARD_CONTRACT_ADDRESS
    });

    const walletClient = createWalletClientFromProvider();
    const [account] = await walletClient.getAddresses();
    
    if (!account) {
      throw new Error('No wallet account found');
    }

    console.log('Wallet connected:', account);

    // Check if the player address is valid
    if (!playerAddress.startsWith('0x') || playerAddress.length !== 42) {
      throw new Error('Invalid player address format');
    }

    // Simulate the contract call first
    console.log('Simulating contract call...');
    const { request } = await publicClient.simulateContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'updatePlayerData',
      args: [playerAddress, BigInt(scoreAmount), BigInt(transactionAmount)],
      account,
    });

    console.log('Simulation successful, executing transaction...');
    const hash = await walletClient.writeContract(request);
    console.log('Transaction sent:', hash);
    
    // Tunggu transaksi selesai
    console.log('Waiting for transaction confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transaction confirmed:', receipt);
    
    return {
      success: true,
      transactionHash: hash,
      receipt,
    };
  } catch (error: any) {
    console.error('Error updating player data:', error);
    
    // Log more detailed error information
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    
    throw error;
  }
}

// Function to update player data using game wallet (private key from .env)
export async function updatePlayerDataWithGameWallet(
  playerAddress: string, 
  scoreAmount: number, 
  transactionAmount: number
) {
  try {
    console.log('🎮 Starting score submission with game wallet:', {
      playerAddress,
      scoreAmount,
      transactionAmount,
      contractAddress: MONAD_LEADERBOARD_CONTRACT_ADDRESS
    });

    // Check if the player address is valid
    if (!playerAddress.startsWith('0x') || playerAddress.length !== 42) {
      throw new Error('Invalid player address format');
    }

    // Create game wallet client from private key
    const { walletClient, account } = createGameWalletClient();
    console.log('🔑 Game wallet address:', account.address);

    // Simulate the contract call first
    console.log('🔍 Simulating contract call...');
    const { request } = await publicClient.simulateContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'updatePlayerData',
      args: [playerAddress, BigInt(scoreAmount), BigInt(transactionAmount)],
      account: account.address,
    });

    console.log('✅ Simulation successful, executing transaction...');
    const hash = await walletClient.writeContract(request);
    console.log('📤 Transaction sent:', hash);
    
    // Tunggu transaksi selesai
    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ Transaction confirmed:', receipt);
    
    return {
      success: true,
      transactionHash: hash,
      receipt,
      gameWalletAddress: account.address
    };
  } catch (error: any) {
    console.error('❌ Error updating player data with game wallet:', error);
    
    // Log more detailed error information
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    
    throw error;
  }
}

// Function to update player data using Privy embedded wallet
export async function updatePlayerDataWithPrivy(
  playerAddress: string, 
  scoreAmount: number, 
  transactionAmount: number,
  privyWallet: any // Privy wallet object
) {
  try {
    console.log('Starting score submission with Privy embedded wallet:', {
      playerAddress,
      scoreAmount,
      transactionAmount,
      contractAddress: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      walletAddress: privyWallet.address
    });

    // Check if the player address is valid
    if (!playerAddress.startsWith('0x') || playerAddress.length !== 42) {
      throw new Error('Invalid player address format');
    }

    // Create wallet client from Privy embedded wallet
    const walletClient = await privyWallet.getEthereumProvider();
    const ethereumProvider = walletClient;
    
    // Create viem wallet client
    const viemWalletClient = createWalletClient({
      chain: monadTestnet,
      transport: custom(ethereumProvider),
    });

    const account = privyWallet.address;
    console.log('Privy wallet connected:', account);

    // Simulate the contract call first
    console.log('Simulating contract call...');
    const { request } = await publicClient.simulateContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'updatePlayerData',
      args: [playerAddress, BigInt(scoreAmount), BigInt(transactionAmount)],
      account,
    });

    console.log('Simulation successful, executing transaction...');
    const hash = await viemWalletClient.writeContract({
      ...request,
      account
    });
    console.log('Transaction sent:', hash);
    
    // Tunggu transaksi selesai
    console.log('Waiting for transaction confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('Transaction confirmed:', receipt);
    
    return {
      success: true,
      transactionHash: hash,
      receipt,
    };
  } catch (error: any) {
    console.error('Error updating player data with Privy:', error);
    
    // Log more detailed error information
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    
    throw error;
  }
}

// Function to register game
export async function registerGame(
  gameAddress: string,
  gameName: string,
  gameImage: string,
  gameUrl: string
) {
  try {
    const walletClient = createWalletClientFromProvider();
    const [account] = await walletClient.getAddresses();
    
    if (!account) {
      throw new Error('No wallet account found');
    }

    const { request } = await publicClient.simulateContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'registerGame',
      args: [gameAddress, gameName, gameImage, gameUrl],
      account,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    return {
      success: true,
      transactionHash: hash,
      receipt,
    };
  } catch (error) {
    console.error('Error registering game:', error);
    throw error;
  }
}
