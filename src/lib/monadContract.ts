import { createPublicClient, createWalletClient, http, custom, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import MONAD_LEADERBOARD_ABI from './monadLeaderboardABI';

// Alamat smart contract Monad Games ID Leaderboard
export const MONAD_LEADERBOARD_CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';

// Chain config Monad Testnet (harus sama dengan di main.tsx)
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

// Public client untuk membaca data dari contract (tidak perlu wallet)
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

// Fungsi untuk membuat wallet client dari window.ethereum (MetaMask/wallet provider)
export function createWalletClientFromProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: monadTestnet,
      transport: custom(window.ethereum as any),
    });
  }
  throw new Error('No wallet provider found');
}

// Fungsi untuk membaca data player dari smart contract
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

// Fungsi untuk membaca total skor player
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

// Fungsi untuk update data player (submit skor ke blockchain)
export async function updatePlayerData(
  playerAddress: string, 
  scoreAmount: number, 
  transactionAmount: number
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
      functionName: 'updatePlayerData',
      args: [playerAddress, BigInt(scoreAmount), BigInt(transactionAmount)],
      account,
    });

    const hash = await walletClient.writeContract(request);
    
    // Tunggu transaksi selesai
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    return {
      success: true,
      transactionHash: hash,
      receipt,
    };
  } catch (error) {
    console.error('Error updating player data:', error);
    throw error;
  }
}

// Fungsi untuk register game (hanya untuk admin/developer)
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
