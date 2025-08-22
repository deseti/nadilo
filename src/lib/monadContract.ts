import { createPublicClient, createWalletClient, http, custom } from 'viem';
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
  // Try server-side environment variable first (for API calls), then client-side (for development)
  const privateKey = process.env.VITE_WALLET_PRIVATE_KEY || import.meta.env.VITE_WALLET_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('VITE_WALLET_PRIVATE_KEY not found in environment variables. Please check your .env file or Vercel environment variables.');
  }

  if (!privateKey.startsWith('0x')) {
    throw new Error('VITE_WALLET_PRIVATE_KEY must start with 0x');
  }

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    // Try different RPC endpoints for better compatibility
    const rpcUrls = [
      'https://testnet-rpc.monad.xyz',
      'https://rpc.monad.xyz', // Alternative RPC
    ];

    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(rpcUrls[0], {
        timeout: 30000, // 30 second timeout
        retryCount: 3,
        retryDelay: 1000,
      }),
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

    // Try alternative approach using raw transaction
    return await submitScoreWithRawTransaction(playerAddress, scoreAmount, transactionAmount);

  } catch (error) {
    console.error('❌ Error updating player data with game wallet:', error);
    const errorObj = error as any;
    if (errorObj?.cause) {
      console.error('Error cause:', errorObj.cause);
    }
    if (errorObj?.details) {
      console.error('Error details:', errorObj.details);
    }

    throw error;
  }
}

// Alternative method using raw transaction for better Monad compatibility
async function submitScoreWithRawTransaction(
  playerAddress: string,
  scoreAmount: number,
  transactionAmount: number
) {
  try {
    console.log('🔄 Trying raw transaction approach...');

    // Create game wallet client from private key
    const { walletClient, account } = createGameWalletClient();
    console.log('🔑 Game wallet address:', account.address);

    // Encode the function call data manually
    const { encodeFunctionData } = await import('viem');

    const data = encodeFunctionData({
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'updatePlayerData',
      args: [playerAddress, BigInt(scoreAmount), BigInt(transactionAmount)],
    });

    console.log('📝 Encoded function data:', data);

    // Get current gas price and nonce
    const gasPrice = await publicClient.getGasPrice();
    const nonce = await publicClient.getTransactionCount({ address: account.address });

    console.log('⛽ Gas price:', gasPrice, 'Nonce:', nonce);

    // Create transaction with minimal parameters
    const transaction = {
      to: MONAD_LEADERBOARD_CONTRACT_ADDRESS as `0x${string}`,
      data,
      gas: 300000n, // Fixed gas limit
      gasPrice: gasPrice * 2n, // Double the gas price for faster confirmation
      nonce,
      value: 0n,
    };

    console.log('📤 Sending raw transaction:', transaction);

    // Send transaction
    const hash = await walletClient.sendTransaction(transaction);
    console.log('📤 Transaction sent:', hash);

    // Wait for transaction confirmation
    console.log('⏳ Waiting for transaction confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('✅ Transaction confirmed:', receipt);

    return {
      success: true,
      transactionHash: hash,
      receipt,
      gameWalletAddress: account.address
    };

  } catch (error) {
    console.error('❌ Raw transaction failed:', error);

    // Log more detailed error information
    const errorObj = error as any;
    if (errorObj?.cause) {
      console.error('Error cause:', errorObj.cause);
    }
    if (errorObj?.details) {
      console.error('Error details:', errorObj.details);
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
