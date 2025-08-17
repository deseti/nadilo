import { ScoreRelay } from './scoreRelay';

// Interface for score submission
interface ScoreSubmission {
  playerAddress: string;
  playerName: string;
  gameAddress: string;
  score: number;
  transactions: number;
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
      
      // Use ScoreRelay to submit score
      const result = await ScoreRelay.submitScore(
        submission.playerAddress,
        submission.playerName,
        submission.gameAddress,
        submission.score,
        30 // Default game duration in seconds
      );
      
      if (result.success) {
        console.log('✅ Score submitted successfully:', {
          score: submission.score,
          localSuccess: result.localSuccess,
          blockchainSuccess: result.blockchainSuccess
        });
      } else {
        console.warn('⚠️ Score submission partially failed:', result.error);
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
