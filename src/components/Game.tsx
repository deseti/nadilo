import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import { MenuScene } from '../game/MenuScene';

interface GameProps {
  onScoreUpdate?: (score: number) => void;
}

export const Game: React.FC<GameProps> = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) return;

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
          gravity: { x: 0, y: 0 }, // Top-down view, no gravity
          debug: false
        }
      },
      scene: [MenuScene, GameScene]
    };

    // Create Phaser game instance
    phaserGameRef.current = new Phaser.Game(config);

    // Cleanup function
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

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