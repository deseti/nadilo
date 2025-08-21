// Test script untuk manual score submission ke Monad Games ID
import { createWalletClientFromProvider, publicClient, MONAD_LEADERBOARD_CONTRACT_ADDRESS } from '../lib/monadContract';
import MONAD_LEADERBOARD_ABI from '../lib/monadLeaderboardABI';

export async function testScoreSubmission(
  playerAddress: string,
  gameAddress: string,
  score: number,
  transactions: number = 1
) {
  console.log('🧪 TESTING SCORE SUBMISSION');
  console.log('============================');
  console.log('Player:', playerAddress);
  console.log('Game:', gameAddress);
  console.log('Score:', score);
  console.log('Transactions:', transactions);
  console.log('Contract:', MONAD_LEADERBOARD_CONTRACT_ADDRESS);

  try {
    // 1. Check prerequisites
    console.log('\n1. Checking prerequisites...');
    
    // Check game wallet GAME_ROLE
    const { createGameWalletClient } = await import('../lib/monadContract');
    const { account: gameWalletAccount } = createGameWalletClient();
    
    const gameRole = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'GAME_ROLE',
    }) as string;

    const hasRole = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'hasRole',
      args: [gameRole, gameWalletAccount.address],
    }) as boolean;

    console.log('Game wallet address:', gameWalletAccount.address);
    console.log('GAME_ROLE permission:', hasRole ? '✅ YES' : '❌ NO');

    if (!hasRole) {
      throw new Error('GAME_ROLE_MISSING: Game wallet does not have GAME_ROLE permission');
    }

    // Check game registration
    const gameData = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'games',
      args: [gameAddress],
    }) as [string, string, string, string];

    const isRegistered = gameData[2] !== '';
    console.log('Game registered:', isRegistered ? '✅ YES' : '❌ NO');

    if (!isRegistered) {
      throw new Error('GAME_NOT_REGISTERED: Game is not registered in the system');
    }

    console.log('Game info:', {
      name: gameData[2],
      image: gameData[1],
      url: gameData[3]
    });

    // 2. Get current player data
    console.log('\n2. Getting current player data...');
    const currentData = await publicClient.readContract({
      address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
      abi: MONAD_LEADERBOARD_ABI,
      functionName: 'playerDataPerGame',
      args: [gameAddress, playerAddress],
    }) as [bigint, bigint];

    console.log('Current player data:', {
      score: Number(currentData[0]),
      transactions: Number(currentData[1])
    });

    // 3. Execute transaction using game wallet
    console.log('\n3. Executing transaction with game wallet...');
    const { updatePlayerDataWithGameWallet } = await import('../lib/monadContract');
    
    const result = await updatePlayerDataWithGameWallet(
      playerAddress,
      score,
      transactions
    );

    console.log('✅ Transaction successful!');
    console.log('Transaction hash:', result.transactionHash);
    console.log('Game wallet used:', result.gameWalletAddress);

    if (result.success) {
      console.log('✅ Score submitted successfully!');
      
      // 4. Verify the update
      console.log('\n4. Verifying update...');
      const updatedData = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'playerDataPerGame',
        args: [gameAddress, playerAddress],
      }) as [bigint, bigint];

      console.log('Updated player data:', {
        score: Number(updatedData[0]),
        transactions: Number(updatedData[1])
      });

      const totalScore = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'totalScoreOfPlayer',
        args: [playerAddress],
      }) as bigint;

      console.log('Total score across all games:', Number(totalScore));

      return {
        success: true,
        transactionHash: result.transactionHash,
        newScore: Number(updatedData[0]),
        newTransactions: Number(updatedData[1]),
        totalScore: Number(totalScore),
        gameWalletAddress: result.gameWalletAddress
      };
    } else {
      throw new Error('TRANSACTION_FAILED: Transaction was not successful');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('GAME_ROLE_MISSING')) {
        console.log('💡 Solution: Request GAME_ROLE permission from Monad team');
      } else if (error.message.includes('GAME_NOT_REGISTERED')) {
        console.log('💡 Solution: Register your game in Monad Games ID system');
      } else if (error.message.includes('User rejected')) {
        console.log('💡 Solution: Accept the transaction in your wallet');
      } else if (error.message.includes('insufficient funds')) {
        console.log('💡 Solution: Add more MON tokens for gas fees');
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to test with current game data
export async function testWithCurrentGame(playerAddress: string, score: number) {
  const gameAddress = '0x5b84Dc548e45cC4f1498b95C000C748c1c953f64'; // Your Nadilo game address
  return testScoreSubmission(playerAddress, gameAddress, score, 1);
}