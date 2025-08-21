import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene, MenuScene, AvatarSelectScene } from '../game';

// Define the props for the Game component to accept a playerID
interface GameProps {
  playerID: string;
  onScoreUpdate?: (score: number, transactions: number) => void;
}

export const Game: React.FC<GameProps> = ({ playerID, onScoreUpdate }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Prevent re-creating the game instance if it already exists
    if (!gameRef.current || phaserGameRef.current) return;

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      backgroundColor: '#0a0a1e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [MenuScene, AvatarSelectScene, GameScene]
    };

    // Create Phaser game instance
    phaserGameRef.current = new Phaser.Game(config);

    // Store the playerID and callback in game registry
    phaserGameRef.current.registry.set('playerID', playerID);
    
    if (onScoreUpdate) {
      phaserGameRef.current.registry.set('onScoreUpdate', onScoreUpdate);
    }

    // Cleanup function to destroy the game instance when the component unmounts
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [playerID]);

  return (
    <div className="game-container">
      <div ref={gameRef} className="phaser-game" />
      <div className="game-ui">
        <div className="game-info">
          <h3>Galactic Fighter Arena</h3>
          <p>Choose your fighter and survive for 60 seconds!</p>
          <ul>
            <li>⏱️ Survive for 60 seconds to win</li>
            <li>WASD: Move your fighter</li>
            <li>Mouse: Aim and fire</li>
            <li>ESC: Pause game</li>
            <li>Collect power-ups for special abilities</li>
            <li>Survive increasingly difficult waves</li>
          </ul>
        </div>
      </div>
    </div>
  );
};