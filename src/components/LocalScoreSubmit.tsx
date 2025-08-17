import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LocalScoreSubmitProps {
  playerAddress: string;
  score: number;
  transactionCount: number;
  onSubmitSuccess?: () => void;
}

export const LocalScoreSubmit: React.FC<LocalScoreSubmitProps> = ({
  playerAddress,
  score,
  transactionCount,
  onSubmitSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitToSupabase = async () => {
    setIsSubmitting(true);
    try {
      // Check if player exists
      const { data: existingPlayer } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_name', playerAddress)
        .single();

      if (existingPlayer) {
        // Update existing player
        const newTotalGames = existingPlayer.total_games + 1;
        const newTotalScore = existingPlayer.total_score + score;
        const newBestScore = Math.max(existingPlayer.best_score, score);
        const newAverageScore = newTotalScore / newTotalGames;

        const { error } = await supabase
          .from('player_stats')
          .update({
            total_games: newTotalGames,
            total_score: newTotalScore,
            best_score: newBestScore,
            average_score: newAverageScore
          })
          .eq('player_name', playerAddress);

        if (error) throw error;
      } else {
        // Create new player
        const { error } = await supabase
          .from('player_stats')
          .insert({
            player_name: playerAddress,
            total_games: 1,
            total_score: score,
            best_score: score,
            average_score: score
          });

        if (error) throw error;
      }

      setIsSubmitted(true);
      onSubmitSuccess?.();
      console.log('Score submitted to local database successfully');
    } catch (error) {
      console.error('Error submitting to local database:', error);
      alert('Failed to submit score to local database');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="local-submit-container" style={{
        background: 'linear-gradient(135deg, #1a4a1a, #2a5a2a)',
        border: '1px solid #00ff88',
        borderRadius: '10px',
        padding: '20px',
        margin: '10px 0',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#00ff88', marginBottom: '10px' }}>✅ Score Saved Locally!</h3>
        <p style={{ color: '#ccc', fontSize: '14px' }}>
          Your score has been recorded in the local database.<br />
          Once you get GAME_ROLE permission, scores will be submitted to Monad blockchain.
        </p>
      </div>
    );
  }

  return (
    <div className="local-submit-container" style={{
      background: 'linear-gradient(135deg, #1a1a3a, #2a2a4a)',
      border: '1px solid #676FFF',
      borderRadius: '10px',
      padding: '20px',
      margin: '10px 0'
    }}>
      <h3 style={{ color: '#676FFF', marginBottom: '15px' }}>💾 Local Score Submission</h3>
      
      <div className="score-info" style={{ marginBottom: '15px' }}>
        <p style={{ color: '#ccc', fontSize: '14px' }}>
          <strong>Score:</strong> {score} points<br />
          <strong>Transactions:</strong> {transactionCount}<br />
          <strong>Player:</strong> {playerAddress.slice(0, 8)}...{playerAddress.slice(-6)}
        </p>
      </div>

      <div className="info-box" style={{
        background: '#2a2a2a',
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px'
      }}>
        <p style={{ color: '#ff9944', fontSize: '13px', margin: '0 0 8px 0' }}>
          <strong>🔄 Temporary Solution</strong>
        </p>
        <p style={{ color: '#ccc', fontSize: '12px', lineHeight: '1.4' }}>
          While waiting for GAME_ROLE permission, scores are saved locally in Supabase. 
          Once you get blockchain permission, all scores will be submitted to Monad Games ID automatically.
        </p>
      </div>

      <button
        onClick={handleSubmitToSupabase}
        disabled={isSubmitting}
        style={{
          background: isSubmitting ? '#444' : 'linear-gradient(135deg, #676FFF, #5A67D8)',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          width: '100%',
          transition: 'all 0.3s'
        }}
      >
        {isSubmitting ? '💾 Saving...' : '💾 Save Score Locally'}
      </button>

      <p style={{ 
        color: '#888', 
        fontSize: '11px', 
        marginTop: '10px',
        textAlign: 'center'
      }}>
        This will save your score to the local leaderboard until blockchain integration is ready
      </p>
    </div>
  );
};
