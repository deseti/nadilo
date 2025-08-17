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
    // Normalize address to checksummed format
    const normalizedAddress = userAddress.toLowerCase();
    console.log('🔍 Checking GAME_ROLE for address:', userAddress);
    console.log('🔧 Normalized address:', normalizedAddress);
    
    // Get GAME_ROLE bytes32 value
    const gameRole = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'GAME_ROLE',
    }) as string;
    
    console.log('🎭 GAME_ROLE hash:', gameRole);

    // Check if user has the role (try both original and normalized address)
    let hasRole = false;
    
    try {
      hasRole = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'hasRole',
        args: [gameRole, userAddress],
      }) as boolean;
      
      console.log('✅ hasRole result for original address', userAddress, ':', hasRole);
    } catch (error) {
      console.warn('⚠️ Error checking with original address, trying normalized...');
    }
    
    // If original failed or returned false, try with normalized address
    if (!hasRole) {
      try {
        hasRole = await publicClient.readContract({
          address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
          abi: MONAD_LEADERBOARD_ABI,
          functionName: 'hasRole',
          args: [gameRole, normalizedAddress],
        }) as boolean;
        
        console.log('✅ hasRole result for normalized address', normalizedAddress, ':', hasRole);
      } catch (error) {
        console.warn('⚠️ Error checking with normalized address as well');
      }
    }

    return hasRole;
  } catch (error) {
    console.error('❌ Error checking game role:', error);
    return false;
  }
}
