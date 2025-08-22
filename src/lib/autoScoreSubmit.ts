// Interface for score submission
interface ScoreSubmission {
  playerAddress: string;
  playerName: string;
  gameAddress: string;
  score: number;
  transactions: number;
}

// Interface for API response
interface ApiResponse {
  success: boolean;
  transactionHash?: string;
  gameWalletAddress?: string;
  error?: string;
  details?: string;
}

// Queue to store pending score submissions
let scoreQueue: ScoreSubmission[] = [];
let isSubmitting = false;

// Auto submit score to blockchain with retry logic
export async function autoSubmitScore(
  playerAddress: string,
  playerName: string,
  gameAddress: string,
  score: number,
  transactions: number = 1
): Promise<boolean> {
  try {
    console.log('🚀 Auto submitting score to blockchain:', {
      playerAddress,
      playerName,
      gameAddress,
      score,
      transactions
    });

    // Add to queue
    const submission: ScoreSubmission = {
      playerAddress,
      playerName,
      gameAddress,
      score,
      transactions
    };

    scoreQueue.push(submission);
    
    // Process queue if not already processing
    if (!isSubmitting) {
      await processScoreQueue();
    }

    return true;
  } catch (error) {
    console.error('❌ Auto submit failed:', error);
    return false;
  }
}

// Process the score submission queue
async function processScoreQueue() {
  if (isSubmitting || scoreQueue.length === 0) return;
  
  isSubmitting = true;
  
  while (scoreQueue.length > 0) {
    const submission = scoreQueue.shift();
    if (!submission) continue;

    try {
      console.log('📊 Processing score submission:', submission);
      
      // Submit score directly to blockchain using game wallet
      const result = await submitScoreDirectly(
        submission.playerAddress,
        submission.score,
        submission.transactions
      );
      
      console.log('📊 Score submission result:', {
        playerAddress: submission.playerAddress,
        gameAddress: submission.gameAddress,
        score: submission.score,
        success: result.success,
        transactionHash: result.transactionHash,
        error: result.error
      });
      
      if (result.success) {
        console.log('✅ Score submitted successfully to blockchain:', {
          score: submission.score,
          transactionHash: result.transactionHash,
          gameWalletAddress: result.gameWalletAddress
        });
      } else {
        console.warn('⚠️ Score submission failed:', result.error);
      }
      
      // Wait a bit between submissions to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('❌ Failed to submit score:', error);
      
      // For certain errors, we might want to retry
      if (error instanceof Error && error.message.includes('network')) {
        // Put it back in queue for retry
        scoreQueue.unshift(submission);
        console.log('🔄 Network error, will retry later');
        break;
      }
    }
  }
  
  isSubmitting = false;
}

// Function to check if auto submit is available for a player
export async function canAutoSubmit(playerAddress: string): Promise<boolean> {
  try {
    // Check if player has necessary permissions
    // You can add more checks here if needed
    return !!playerAddress && playerAddress.length === 42;
  } catch (error) {
    console.error('Error checking auto submit availability:', error);
    return false;
  }
}

// Get queue status
export function getQueueStatus() {
  return {
    pending: scoreQueue.length,
    isSubmitting
  };
}

// Submit score directly to blockchain using game wallet
async function submitScoreDirectly(
  playerAddress: string,
  score: number,
  transactions: number
): Promise<ApiResponse> {
  try {
    console.log('🔐 Submitting score directly to blockchain:', {
      playerAddress,
      score,
      transactions
    });

    // Import the blockchain function
    const { updatePlayerDataWithGameWallet } = await import('./monadContract');

    // Submit directly to blockchain
    const result = await updatePlayerDataWithGameWallet(
      playerAddress,
      score,
      transactions
    );

    console.log('✅ Direct blockchain submission result:', result);

    return {
      success: result.success,
      transactionHash: result.transactionHash,
      gameWalletAddress: result.gameWalletAddress
    };

  } catch (error: any) {
    console.error('❌ Direct blockchain submission failed:', error);
    
    // Handle specific error types
    let errorMessage = error.message || 'Failed to submit score to blockchain';
    
    if (errorMessage.includes('VITE_WALLET_PRIVATE_KEY')) {
      errorMessage = 'Game wallet not configured. Check VITE_WALLET_PRIVATE_KEY in environment.';
    } else if (errorMessage.includes('insufficient funds')) {
      errorMessage = 'Game wallet needs MON tokens for gas fees.';
    } else if (errorMessage.includes('Invalid player address')) {
      errorMessage = 'Invalid player address format.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}
