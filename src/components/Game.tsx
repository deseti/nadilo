import { useEffect, useRef, useState } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Mobile controls state
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Prevent re-creating the game instance if it already exists
    if (!gameRef.current || phaserGameRef.current) return;

    // Calculate responsive game size
    const getGameSize = () => {
      if (isMobile) {
        const maxWidth = Math.min(window.innerWidth - 40, 400);
        const maxHeight = Math.min(window.innerHeight - 300, 300);
        return { width: maxWidth, height: maxHeight };
      }
      return { width: 800, height: 600 };
    };

    const gameSize = getGameSize();

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: gameSize.width,
      height: gameSize.height,
      parent: gameRef.current,
      backgroundColor: '#0a0a1e',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameSize.width,
        height: gameSize.height
      },
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
    phaserGameRef.current.registry.set('isMobile', isMobile);
    
    if (onScoreUpdate) {
      phaserGameRef.current.registry.set('onScoreUpdate', onScoreUpdate);
    }

    // Listen for game scene changes
    phaserGameRef.current.events.on('ready', () => {
      phaserGameRef.current?.events.on('scene-start', (scene: any) => {
        if (scene.scene.key === 'GameScene') {
          setGameStarted(true);
        } else {
          setGameStarted(false);
        }
      });
    });

    // Cleanup function to destroy the game instance when the component unmounts
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [playerID, isMobile]);

  // Mobile joystick handlers
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setJoystickActive(true);
    updateJoystickPosition(e);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickActive) return;
    e.preventDefault();
    updateJoystickPosition(e);
  };

  const handleJoystickEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    
    // Reset knob position
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }
    
    // Send stop movement to game
    if (phaserGameRef.current) {
      phaserGameRef.current.registry.set('mobileInput', { x: 0, y: 0, active: false });
    }
  };

  const updateJoystickPosition = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickRef.current || !knobRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 20;

    let normalizedX = deltaX / maxDistance;
    let normalizedY = deltaY / maxDistance;

    if (distance > maxDistance) {
      normalizedX = (deltaX / distance) * (maxDistance / maxDistance);
      normalizedY = (deltaY / distance) * (maxDistance / maxDistance);
    }

    // Update knob position
    const knobX = Math.max(-maxDistance, Math.min(maxDistance, deltaX));
    const knobY = Math.max(-maxDistance, Math.min(maxDistance, deltaY));
    knobRef.current.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    // Send input to game
    const inputData = {
      x: Math.max(-1, Math.min(1, normalizedX)),
      y: Math.max(-1, Math.min(1, normalizedY)),
      active: true
    };
    
    setJoystickPosition(inputData);
    
    if (phaserGameRef.current) {
      phaserGameRef.current.registry.set('mobileInput', inputData);
    }
  };

  // Mobile button handlers
  const handleShoot = () => {
    if (phaserGameRef.current) {
      phaserGameRef.current.registry.set('mobileShoot', true);
      setTimeout(() => {
        if (phaserGameRef.current) {
          phaserGameRef.current.registry.set('mobileShoot', false);
        }
      }, 100);
    }
  };

  const handleDash = () => {
    if (phaserGameRef.current) {
      phaserGameRef.current.registry.set('mobileDash', true);
      setTimeout(() => {
        if (phaserGameRef.current) {
          phaserGameRef.current.registry.set('mobileDash', false);
        }
      }, 100);
    }
  };

  return (
    <div className="game-container">
      <div ref={gameRef} className="phaser-game" />
      <div className="game-ui">
        <div className="game-info">
          <h3>Galactic Fighter Arena</h3>
          <p>Choose your fighter and survive for 60 seconds!</p>
          <ul>
            <li>⏱️ Survive for 60 seconds to win</li>
            <li>❤️ You have 3 lives - health regenerates when you lose a life</li>
            {isMobile ? (
              <>
                <li>🕹️ Use virtual joystick to move</li>
                <li>🔴 Tap red button to shoot</li>
                <li>⚡ Tap dash button for speed boost</li>
              </>
            ) : (
              <>
                <li>WASD: Move your fighter</li>
                <li>Mouse: Aim and fire</li>
                <li>SHIFT: Dash ability (while moving)</li>
                <li>ESC: Pause game</li>
              </>
            )}
            <li>Collect power-ups for special abilities</li>
            <li>Survive increasingly difficult waves</li>
          </ul>
        </div>
      </div>
      
      {/* Mobile Controls */}
      {isMobile && (
        <div className={`mobile-controls ${gameStarted ? 'active' : ''}`}>
          {/* Virtual Joystick */}
          <div
            ref={joystickRef}
            className="virtual-joystick"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onMouseDown={handleJoystickStart}
            onMouseMove={handleJoystickMove}
            onMouseUp={handleJoystickEnd}
            onMouseLeave={handleJoystickEnd}
          >
            <div ref={knobRef} className="joystick-knob"></div>
          </div>
          
          {/* Action Buttons */}
          <div className="mobile-buttons">
            <button
              className="mobile-btn shoot"
              onTouchStart={handleShoot}
              onMouseDown={handleShoot}
            >
              🔥
            </button>
            <button
              className="mobile-btn dash"
              onTouchStart={handleDash}
              onMouseDown={handleDash}
            >
              ⚡
            </button>
          </div>
        </div>
      )}
    </div>
  );
};