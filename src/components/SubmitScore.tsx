import React, { useState } from 'react';
import { updatePlayerData } from '../lib/monadContract';
import './SubmitScore.css';

interface SubmitScoreProps {
  playerAddress: string;
  score: number;
  transactionCount: number;
  onSubmitSuccess?: () => void;
  onSubmitError?: (error: Error) => void;
}

export const SubmitScore: React.FC<SubmitScoreProps> = ({
  playerAddress,
  score,
  transactionCount,
  onSubmitSuccess,
  onSubmitError
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitScore = async () => {
    if (!playerAddress || score <= 0) {
      alert('Invalid player address or score');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updatePlayerData(
        playerAddress,
        score,
        transactionCount
      );

      if (result.success) {
        setIsSubmitted(true);
        console.log('Score submitted successfully:', result.transactionHash);
        onSubmitSuccess?.();
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      onSubmitError?.(error as Error);
      alert('Failed to submit score to blockchain. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="submit-score-container">
        <div className="success-message">
          <h3>✅ Score Submitted!</h3>
          <p>Your score has been recorded on the Monad blockchain.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-score-container">
      <div className="score-info">
        <h3>Submit Score to Blockchain</h3>
        <p>Score: {score}</p>
        <p>Transactions: {transactionCount}</p>
        <p>Player: {playerAddress}</p>
      </div>
      
      <button 
        className="submit-score-button"
        onClick={handleSubmitScore}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit to Monad Blockchain'}
      </button>
    </div>
  );
};
