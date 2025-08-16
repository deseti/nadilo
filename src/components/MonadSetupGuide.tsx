import React, { useState } from 'react';
import { MonadGamesIDSetup } from '../lib/monadSetup';

interface MonadSetupGuideProps {
  gameAddress: string;
  playerAddress: string;
  gameRegistered: boolean;
  hasGameRole: boolean;
}

export const MonadSetupGuide: React.FC<MonadSetupGuideProps> = ({
  gameAddress,
  playerAddress,
  gameRegistered,
  hasGameRole
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  
  const steps = MonadGamesIDSetup.getSetupSteps(
    gameAddress,
    playerAddress,
    gameRegistered,
    hasGameRole
  );
  
  const contractInfo = MonadGamesIDSetup.getContractInfo();
  const nextAction = MonadGamesIDSetup.getNextAction(gameRegistered, hasGameRole);
  const instructions = MonadGamesIDSetup.getGameRoleInstructions(playerAddress, gameAddress);

  return (
    <div className="monad-setup-guide" style={{
      background: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0'
    }}>
      <h3 style={{ color: '#676FFF', marginBottom: '15px' }}>
        🎮 Monad Games ID Setup Guide
      </h3>

      {/* Current Status */}
      <div className="current-status" style={{ marginBottom: '20px' }}>
        <h4>Current Status:</h4>
        <p style={{ 
          color: MonadGamesIDSetup.canSubmitScores(gameRegistered, hasGameRole) ? '#00ff88' : '#ff9944',
          fontWeight: 'bold'
        }}>
          {nextAction}
        </p>
      </div>

      {/* Setup Steps */}
      <div className="setup-steps">
        <h4>Setup Progress:</h4>
        {steps.map((step) => (
          <div key={step.step} className="step-item" style={{
            display: 'flex',
            alignItems: 'center',
            margin: '10px 0',
            padding: '10px',
            background: step.completed ? '#1a4a1a' : '#4a1a1a',
            borderRadius: '5px',
            opacity: step.required ? 1 : 0.7
          }}>
            <span style={{ 
              color: step.completed ? '#00ff88' : '#ff4444',
              marginRight: '10px',
              fontSize: '18px'
            }}>
              {step.completed ? '✅' : '❌'}
            </span>
            <div>
              <strong>{step.step}. {step.title}</strong>
              {step.required && <span style={{ color: '#ff9944', fontSize: '12px' }}> (Required)</span>}
              <br />
              <small style={{ color: '#ccc' }}>{step.description}</small>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions for GAME_ROLE */}
      {!hasGameRole && (
        <div className="game-role-section" style={{ marginTop: '20px' }}>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            style={{
              background: '#676FFF',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            {showInstructions ? 'Hide' : 'Show'} GAME_ROLE Instructions
          </button>

          {showInstructions && (
            <div className="instructions" style={{
              background: '#2a2a3e',
              padding: '15px',
              borderRadius: '5px',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-line'
            }}>
              {instructions}
            </div>
          )}
        </div>
      )}

      {/* Contract Information */}
      <div className="contract-info" style={{ marginTop: '20px' }}>
        <h4>Contract Information:</h4>
        <div style={{ fontSize: '12px', color: '#ccc' }}>
          <p><strong>Leaderboard Contract:</strong> {contractInfo.leaderboardContract}</p>
          <p><strong>Network:</strong> {contractInfo.network} (Chain ID: {contractInfo.chainId})</p>
          <p><strong>RPC URL:</strong> {contractInfo.rpcUrl}</p>
          <p><strong>Explorer:</strong> <a href={`${contractInfo.explorer}/address/${contractInfo.leaderboardContract}`} target="_blank" rel="noopener noreferrer" style={{ color: '#676FFF' }}>View Contract</a></p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions" style={{ marginTop: '20px' }}>
        <h4>Quick Actions:</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a 
            href={contractInfo.faucet} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: '#444',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '12px'
            }}
          >
            🚰 Get MON Tokens
          </a>
          <a 
            href={contractInfo.docs} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: '#444',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '12px'
            }}
          >
            📚 Documentation
          </a>
          <a 
            href={contractInfo.discord} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              background: '#5865F2',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '12px'
            }}
          >
            💬 Discord Support
          </a>
        </div>
      </div>
    </div>
  );
};
