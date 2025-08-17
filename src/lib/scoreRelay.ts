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
      console.log('Attempting to submit score to Monad Games ID...');
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
   * Submit score specifically to Monad Games ID blockchain
   */
  private static async submitToBlockchain(
    playerAddress: string,
    gameAddress: string,
    score: number
  ): Promise<boolean> {
    try {
      // Check if user has GAME_ROLE permission
      const hasPermission = await this.checkGameRole(playerAddress);
      if (!hasPermission) {
        throw new Error('GAME_ROLE_MISSING');
      }

      // Create wallet client
      const walletClient = createWalletClientFromProvider();
      const [account] = await walletClient.getAddresses();
      
      if (!account) {
        throw new Error('No wallet account found');
      }

      // Submit score to blockchain
      const { request } = await publicClient.simulateContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'updatePlayerData',
        args: [playerAddress, BigInt(score), BigInt(1)], // score, 1 transaction
        account,
      });

      const hash = await walletClient.writeContract(request);
      console.log('Transaction hash:', hash);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return receipt.status === 'success';
    } catch (error) {
      console.error('Blockchain submission error:', error);
      throw error;
    }
  }

  /**
   * Check if player has GAME_ROLE permission
   */
  private static async checkGameRole(playerAddress: string): Promise<boolean> {
    try {
      const gameRole = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'GAME_ROLE',
      }) as string;

      const hasRole = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'hasRole',
        args: [gameRole, playerAddress],
      }) as boolean;

      return hasRole;
    } catch (error) {
      console.error('Error checking GAME_ROLE:', error);
      return false;
    }
  }

  /**
   * Get player's score from blockchain
   */
  static async getPlayerScoreFromBlockchain(
    gameAddress: string, 
    playerAddress: string
  ): Promise<number | null> {
    try {
      const score = await publicClient.readContract({
        address: MONAD_LEADERBOARD_CONTRACT_ADDRESS,
        abi: MONAD_LEADERBOARD_ABI,
        functionName: 'getPlayerScore',
        args: [gameAddress, playerAddress],
      }) as bigint;

      return Number(score);
    } catch (error) {
      console.error('Error getting player score from blockchain:', error);
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
      if (error.includes('GAME_ROLE_MISSING')) {
        return 'No GAME_ROLE permission. Contact Monad team to get permission.';
      }
    }

    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        return 'Transaction was cancelled by user';
      }
      if (error.message.includes('insufficient funds')) {
        return 'Insufficient MON tokens for gas fees';
      }
      if (error.message.includes('GAME_ROLE')) {
        return 'No GAME_ROLE permission. Contact Monad team to get permission.';
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
