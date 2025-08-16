import { publicClient, MONAD_LEADERBOARD_CONTRACT_ADDRESS } from './monadContract';
import MONAD_LEADERBOARD_ABI from './monadLeaderboardABI';

// Function to check if a game is registered in the leaderboard contract
export async function isGameRegistered(gameAddress: string): Promise<boolean> {
  try {
    const gameData = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'games',
      args: [gameAddress],
    }) as [string, string, string, string];

    // If game is registered, the name should not be empty
    return gameData[2] !== '';
  } catch (error) {
    console.error('Error checking game registration:', error);
    return false;
  }
}

// Function to get game information from the contract
export async function getGameInfo(gameAddress: string) {
  try {
    const gameData = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'games',
      args: [gameAddress],
    }) as [string, string, string, string];

    return {
      address: gameData[0],
      image: gameData[1],
      name: gameData[2],
      url: gameData[3],
    };
  } catch (error) {
    console.error('Error getting game info:', error);
    throw error;
  }
}

// Check if current user has GAME_ROLE (for registering games)
export async function hasGameRole(userAddress: string): Promise<boolean> {
  try {
    // Get GAME_ROLE bytes32 value
    const gameRole = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'GAME_ROLE',
    }) as string;

    // Check if user has the role
    const hasRole = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'hasRole',
      args: [gameRole, userAddress],
    }) as boolean;

    return hasRole;
  } catch (error) {
    console.error('Error checking game role:', error);
    return false;
  }
}
