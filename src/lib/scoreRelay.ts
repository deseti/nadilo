import { createWalletClientFromProvider, publicClient, MONAD_LEADERBOARD_CONTRACT_ADDRESS } from './monadContract';
import MONAD_LEADERBOARD_ABI from './monadLeaderboardABI';
import { LeaderboardService } from '../services/leaderboard';

export interface ScoreSubmissionResult {
  success: boolean;
  localSuccess: boolean;
  blockchainSuccess: boolean;
  transactionHash?: string;
  error?: string;
}

export class ScoreRelay {
  /**
   * Submit score to both local database and Monad Games ID blockchain
   */
  static async submitScore(
    playerAddress: string,
    playerName: string,
    gameAddress: string,
    score: number,
    gameDuration: number
  ): Promise<ScoreSubmissionResult> {
    const result: ScoreSubmissionResult = {
      success: false,
      localSuccess: false,
      blockchainSuccess: false,
    };

    try {
      // 1. Submit to local Supabase database first (always try this)
      console.log('Submitting score to local database...');
      result.localSuccess = await LeaderboardService.submitScore(
        playerName, 
        score, 
        gameDuration
      );

      // 2. Try to submit to Monad Games ID blockchain
      console.log('Attempting to submit score to Monad Games ID...', {
        playerAddress,
        gameAddress,
        score,
        leaderboardContract: MONAD_LEADERBOARD_CONTRACT_ADDRESS
      });
      
      try {
        result.blockchainSuccess = await this.submitToBlockchain(
          playerAddress,
          gameAddress,
          score
        );
        
        if (result.blockchainSuccess) {
          console.log('✅ Score submitted to blockchain successfully!');
        }
      } catch (blockchainError) {
        console.warn('⚠️ Blockchain submission failed:', blockchainError);
        result.error = this.getErrorMessage(blockchainError);
        
        // Log detailed error for debugging
        if (blockchainError instanceof Error) {
          if (blockchainError.message.includes('GAME_ROLE')) {
            console.error('❌ GAME_ROLE permission missing for address:', playerAddress);
          } else if (blockchainError.message.includes('game not found')) {
            console.error('❌ Game not registered:', gameAddress);
          }
        }
      }

      // Consider overall success if at least local submission worked
      result.success = result.localSuccess;

      return result;
    } catch (error) {
      console.error('Score submission failed:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Submit score specifically to Monad Games ID blockchain using game wallet
   */
  private static async submitToBlockchain(
    playerAddress: string,
    gameAddress: string,
    score: number
  ): Promise<boolean> {
    try {
      console.log('🎮 Submitting score using game wallet (has GAME_ROLE)...');
      
      // Import the game wallet function
      const { updatePlayerDataWithGameWallet } = await import('./monadContract');
      
      // Submit score using game wallet (which has GAME_ROLE permission)
      const result = await updatePlayerDataWithGameWallet(
        playerAddress,
        score,
        1 // transaction count
      );

      console.log('✅ Score submitted successfully:', {
        transactionHash: result.transactionHash,
        gameWalletAddress: result.gameWalletAddress,
        playerAddress,
        score
      });

      return result.success;
    } catch (error) {
      console.error('❌ Blockchain submission error:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('VITE_WALLET_PRIVATE_KEY')) {
          throw new Error('GAME_WALLET_NOT_CONFIGURED: Private key not found in environment');
        } else if (error.message.includes('Invalid player address')) {
          throw new Error('INVALID_PLAYER_ADDRESS: Player address format is invalid');
        } else if (error.message.includes('insufficient funds')) {
          throw new Error('INSUFFICIENT_FUNDS: Game wallet needs MON tokens for gas');
        }
      }
      
      throw error;
    }
  }

  /**
   * Check if game wallet has GAME_ROLE permission
   */
  private static async checkGameWalletRole(): Promise<boolean> {
    try {
      const { createGameWalletClient } = await import('./monadContract');
      const { account } = createGameWalletClient();
      
      const gameRole = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'GAME_ROLE',
      }) as string;

      const hasRole = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'hasRole',
        args: [gameRole, account.address],
      }) as boolean;

      console.log(`🎮 Game wallet ${account.address} has GAME_ROLE:`, hasRole);
      return hasRole;
    } catch (error) {
      console.error('Error checking game wallet GAME_ROLE:', error);
      return false;
    }
  }

  /**
   * Get player's score from blockchain using playerDataPerGame
   */
  static async getPlayerScoreFromBlockchain(
    gameAddress: string, 
    playerAddress: string
  ): Promise<{ score: number; transactions: number } | null> {
    try {
      const playerData = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'playerDataPerGame',
        args: [gameAddress, playerAddress],
      }) as [bigint, bigint]; // [score, transactions]

      return {
        score: Number(playerData[0]),
        transactions: Number(playerData[1])
      };
    } catch (error) {
      console.error('Error getting player data from blockchain:', error);
      return null;
    }
  }

  /**
   * Get player's total score across all games
   */
  static async getPlayerTotalScore(playerAddress: string): Promise<number | null> {
    try {
      const totalScore = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'totalScoreOfPlayer',
        args: [playerAddress],
      }) as bigint;

      return Number(totalScore);
    } catch (error) {
      console.error('Error getting player total score from blockchain:', error);
      return null;
    }
  }

  /**
   * Get leaderboard from blockchain for specific game
   */
  static async getBlockchainLeaderboard(gameAddress: string): Promise<any[]> {
    try {
      // This would need to be implemented based on the actual contract methods
      // For now, return empty array as placeholder
      console.log('Getting blockchain leaderboard for game:', gameAddress);
      return [];
    } catch (error) {
      console.error('Error getting blockchain leaderboard:', error);
      return [];
    }
  }

  /**
   * Sync local database with blockchain data
   */
  static async syncWithBlockchain(gameAddress: string): Promise<void> {
    try {
      console.log('Syncing local database with blockchain data...');
      // Implementation would depend on contract's leaderboard query methods
      // For now, this is a placeholder
    } catch (error) {
      console.error('Error syncing with blockchain:', error);
    }
  }

  /**
   * Get human-readable error message
   */
  private static getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      if (error.includes('GAME_WALLET_NOT_CONFIGURED')) {
        return 'Game wallet not configured. Check VITE_WALLET_PRIVATE_KEY in environment.';
      }
      if (error.includes('INSUFFICIENT_FUNDS')) {
        return 'Game wallet needs MON tokens for gas fees.';
      }
      if (error.includes('INVALID_PLAYER_ADDRESS')) {
        return 'Invalid player address format.';
      }
    }

    if (error instanceof Error) {
      if (error.message.includes('GAME_WALLET_NOT_CONFIGURED')) {
        return 'Game wallet not configured. Check VITE_WALLET_PRIVATE_KEY in environment.';
      }
      if (error.message.includes('INSUFFICIENT_FUNDS')) {
        return 'Game wallet needs MON tokens for gas fees.';
      }
      if (error.message.includes('INVALID_PLAYER_ADDRESS')) {
        return 'Invalid player address format.';
      }
      if (error.message.includes('insufficient funds')) {
        return 'Game wallet needs MON tokens for gas fees.';
      }
      if (error.message.includes('Invalid VITE_WALLET_PRIVATE_KEY')) {
        return 'Invalid private key format in environment.';
      }
    }

    return 'Failed to submit to blockchain. Score saved locally.';
  }

  /**
   * Create a score submission request for later processing
   * (useful when GAME_ROLE is pending)
   */
  static async createPendingSubmission(
    playerAddress: string,
    playerName: string,
    gameAddress: string,
    score: number,
    gameDuration: number
  ): Promise<void> {
    try {
      // Store in local database with a "pending blockchain submission" flag
      // This could be implemented as a separate table or additional column
      console.log('Creating pending submission for future blockchain sync...');
      
      // For now, just submit to local database
      await LeaderboardService.submitScore(playerName, score, gameDuration);
    } catch (error) {
      console.error('Error creating pending submission:', error);
    }
  }
}
