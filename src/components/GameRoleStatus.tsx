import React, { useState } from 'react';

interface GameRoleRequestProps {
  playerAddress?: string;
  gameAddress: string;
  gameName?: string;
  onScoreSubmit?: (score: number, transactions: number) => void;
}

export const GameRoleStatus: React.FC<GameRoleRequestProps> = ({
  playerAddress = '',
  gameAddress,
  gameName = 'Nadilo - Crypto Clash',
  onScoreSubmit
}) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);

  const contractInfo = {
    supportEmail: 'development@monad.xyz',
    gamesIdDocs: 'https://monad-foundation.notion.site/How-to-integrate-Monad-Games-ID-24e6367594f2802b8dd1ef3fbf3d136a',
    discord: 'https://discord.gg/monad'
  };

  const emailTemplate = `Subject: GAME_ROLE Request for ${gameName} - Monad Games ID Integration

Hello Monad Team,

I'm developing "${gameName}" and would like to integrate with Monad Games ID to submit player scores to the blockchain.

Game Details:
- Name: ${gameName}
- Type: Token collection arena game
- Demo: ${window.location.origin}
- Contract Address: ${gameAddress}
- Developer Wallet: ${playerAddress || 'Not specified'}
- Description: An interactive token collection game where players compete for high scores

I have implemented the Monad Games ID integration in my game and need GAME_ROLE permission to submit player scores to your leaderboard contract.

Please grant GAME_ROLE permission to my wallet address: ${playerAddress || 'Please specify wallet address'}

The game is ready for testing at: ${window.location.origin}

Thank you for your time and support!

Best regards,
Game Developer`;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'email') {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      } else {
        setTemplateCopied(true);
        setTimeout(() => setTemplateCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openEmailClient = () => {
    const subject = encodeURIComponent(`GAME_ROLE Request for ${gameName} - Monad Games ID Integration`);
    const body = encodeURIComponent(emailTemplate);
    const mailtoUrl = `mailto:${contractInfo.supportEmail}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl);
  };

  return (
    <div className="game-role-request" style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      border: '1px solid #676FFF',
      borderRadius: '12px',
      padding: '25px',
      margin: '20px 0',
      boxShadow: '0 4px 15px rgba(103, 111, 255, 0.1)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ 
          color: '#676FFF', 
          marginBottom: '10px',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          🚀 Request GAME_ROLE Permission
        </h3>
        <p style={{ color: '#bbb', fontSize: '14px' }}>
          Follow these steps to get permission to submit scores to Monad Games ID
        </p>
      </div>

      {/* Current Status */}
      <div className="status-alert" style={{
        background: 'linear-gradient(90deg, #ff9944, #ff6b44)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <strong>⚠️ GAME_ROLE Required</strong>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
          Your wallet needs GAME_ROLE permission to submit scores to Monad blockchain
        </p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions" style={{ marginBottom: '25px' }}>
        <h4 style={{ color: '#fff', marginBottom: '15px' }}>Quick Actions:</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={openEmailClient}
            style={{
              background: 'linear-gradient(135deg, #676FFF, #5A67D8)',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            📧 Send Email Request
          </button>

          <button
            onClick={() => copyToClipboard(contractInfo.supportEmail, 'email')}
            style={{
              background: emailCopied ? '#00ff88' : '#444',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {emailCopied ? '✅ Copied!' : '📋 Copy Email'}
          </button>

          <a
            href={contractInfo.discord}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#5865F2',
              color: 'white',
              textDecoration: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            💬 Discord Support
          </a>

          <a
            href={contractInfo.gamesIdDocs}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#444',
              color: 'white',
              textDecoration: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📚 Documentation
          </a>
        </div>
      </div>

      {/* Email Template */}
      <div className="email-template" style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h4 style={{ color: '#fff', margin: 0 }}>Email Template:</h4>
          <button
            onClick={() => copyToClipboard(emailTemplate, 'template')}
            style={{
              background: templateCopied ? '#00ff88' : '#676FFF',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {templateCopied ? '✅ Copied!' : '📋 Copy Template'}
          </button>
        </div>
        
        <div style={{
          background: '#0a0a0a',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #333',
          fontSize: '12px',
          lineHeight: '1.6',
          color: '#ddd',
          whiteSpace: 'pre-line',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {emailTemplate}
        </div>
      </div>

      {/* Information */}
      <div className="game-info" style={{
        background: '#1a1a3a',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h4 style={{ color: '#676FFF', marginBottom: '10px' }}>Your Game Information:</h4>
        <div style={{ fontSize: '13px', color: '#ccc' }}>
          <p><strong>Game:</strong> {gameName}</p>
          <p><strong>Contract:</strong> {gameAddress}</p>
          <p><strong>Developer:</strong> {playerAddress}</p>
          <p><strong>Demo URL:</strong> {window.location.origin}</p>
          <p><strong>Support Email:</strong> {contractInfo.supportEmail}</p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="next-steps" style={{ marginTop: '20px' }}>
        <h4 style={{ color: '#fff', marginBottom: '10px' }}>What happens next?</h4>
        <ol style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>
          <li>Send the email request to Monad team</li>
          <li>Monad team reviews your game (1-3 business days)</li>
          <li>GAME_ROLE permission is granted to your wallet</li>
          <li>Refresh this page to verify the permission</li>
          <li>You can then submit scores to the blockchain! 🎉</li>
        </ol>
      </div>
    </div>
  );
};
