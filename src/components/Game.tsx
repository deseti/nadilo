import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import { MenuScene } from '../game/MenuScene';

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
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [MenuScene, GameScene]
    };

    // Create Phaser game instance
    phaserGameRef.current = new Phaser.Game(config);

    // *** KEY CHANGE ***
    // Use the game's registry to store the playerID.
    // This makes the playerID accessible from any scene within the game.
    phaserGameRef.current.registry.set('playerID', playerID);
    
    // Store the score callback in game registry
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
    // Add playerID to the dependency array to re-initialize if it changes (optional but good practice)
  }, [playerID]);

  return (
    <div className="game-container">
      <div ref={gameRef} className="phaser-game" />
      <div className="game-ui">
        <div className="game-info">
          <h3>Crypto Clash</h3>
          <p>Use WASD to move, Mouse to aim & click to attack!</p>
        </div>
      </div>
    </div>
  );
};