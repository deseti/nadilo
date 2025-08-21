import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // Create background elements
    this.createBackgroundElements();
  }

  create() {
    const { width, height } = this.cameras.main;

    // Animated starfield background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1e);
    this.createStarfield();

    // Title with glow effect
    const title = this.add.text(width / 2, height / 2 - 120, 'GALACTIC', {
      fontSize: '56px',
      color: '#00ff88',
      fontFamily: 'Arial, sans-serif',
      stroke: '#ffffff',
      strokeThickness: 2
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 - 60, 'FIGHTER ARENA', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Add title animation
    this.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Start Game button - must select avatar first
    const startButton = this.add.rectangle(width / 2, height / 2 + 20, 250, 60, 0x00ff88)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('AvatarSelectScene');
      })
      .on('pointerover', () => {
        startButton.setFillStyle(0x00cc66);
        startButton.setScale(1.05);
      })
      .on('pointerout', () => {
        startButton.setFillStyle(0x00ff88);
        startButton.setScale(1);
      });

    this.add.text(width / 2, height / 2 + 20, 'START GAME', {
      fontSize: '20px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width / 2, height / 2 + 180, 'WASD: Move | Mouse: Aim & Fire | ESC: Pause', {
      fontSize: '16px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Game features
    this.add.text(width / 2, height / 2 + 210, '• Choose Your Fighter • Collect Power-ups • Survive Waves •', {
      fontSize: '14px',
      color: '#ffff44',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Add floating fighter preview
    this.createFighterPreview();
  }

  private createBackgroundElements() {
    // This will be called in preload to set up any textures needed
  }

  private createStarfield() {
    const { width, height } = this.cameras.main;
    
    // Create animated stars
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      
      const star = this.add.circle(x, y, size, 0xffffff, alpha);

      // Add twinkling effect
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.3 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Slow movement
      this.tweens.add({
        targets: star,
        y: star.y + height,
        duration: Phaser.Math.Between(10000, 20000),
        repeat: -1,
        onRepeat: () => {
          star.y = -10;
          star.x = Phaser.Math.Between(0, width);
        }
      });
    }
  }

  private createFighterPreview() {
    const { width, height } = this.cameras.main;
    
    // Create a simple fighter preview
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00ff88);
    
    // Create fighter jet shape
    graphics.beginPath();
    graphics.moveTo(0, -15);
    graphics.lineTo(-6, -3);
    graphics.lineTo(-12, 0);
    graphics.lineTo(-6, 8);
    graphics.lineTo(-2, 12);
    graphics.lineTo(0, 10);
    graphics.lineTo(2, 12);
    graphics.lineTo(6, 8);
    graphics.lineTo(12, 0);
    graphics.lineTo(6, -3);
    graphics.closePath();
    graphics.fillPath();
    
    // Add cockpit
    graphics.fillStyle(0x333333);
    graphics.fillCircle(0, -6, 2);
    
    graphics.setPosition(width - 150, height / 2 - 50);
    
    // Add floating animation
    this.tweens.add({
      targets: graphics,
      y: graphics.y - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add rotation animation
    this.tweens.add({
      targets: graphics,
      rotation: Math.PI * 2,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });
  }
}