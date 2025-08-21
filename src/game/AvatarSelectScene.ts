import Phaser from 'phaser';

export interface AvatarData {
  id: string;
  name: string;
  color: number;
  speed: number;
  health: number;
  fireRate: number;
  special?: string;
}

export class AvatarSelectScene extends Phaser.Scene {
  private avatars: AvatarData[] = [
    {
      id: 'moyaki',
      name: 'Moyaki',
      color: 0x00ff88,
      speed: 280,
      health: 90,
      fireRate: 200,
      special: 'Lightning Speed'
    },
    {
      id: 'molandak', 
      name: 'Molandak',
      color: 0x4444ff,
      speed: 180,
      health: 180,
      fireRate: 500,
      special: 'Heavy Armor'
    },
    {
      id: 'chog',
      name: 'Chog',
      color: 0xff4444,
      speed: 230,
      health: 130,
      fireRate: 300,
      special: 'Balanced Power'
    }
  ];

  private selectedIndex: number = 0;
  private avatarSprites: Phaser.GameObjects.Sprite[] = [];
  private infoPanel!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'AvatarSelectScene' });
  }

  preload() {
    // Load avatar images
    this.load.image('moyaki', '/avatar/moyaki.png');
    this.load.image('molandak', '/avatar/molandak.png');
    this.load.image('chog', '/avatar/chog.png');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background with starfield effect
    this.createStarfield();

    // Title
    this.add.text(width / 2, 60, 'SELECT YOUR AVATAR', {
      fontSize: '36px',
      color: '#00ff88',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // Subtitle
    this.add.text(width / 2, 100, 'You must choose one of 3 avatars to play', {
      fontSize: '16px',
      color: '#ffff44',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Create avatar display
    this.createAvatarDisplay();

    // Create info panel
    this.createInfoPanel();

    // Navigation instructions
    this.add.text(width / 2, height - 80, 'Use A/D or Arrow Keys to select | SPACE to confirm', {
      fontSize: '16px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, height - 60, 'ESC to return to main menu', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Setup input
    this.setupInput();

    // Update display
    this.updateDisplay();
  }

  private createStarfield() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1e);

    // Add stars
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      
      this.add.circle(x, y, size, 0xffffff).setAlpha(alpha);
    }
  }

  private createAvatarDisplay() {
    const { width, height } = this.cameras.main;
    const centerY = height / 2 - 50;

    this.avatars.forEach((avatar, index) => {
      const x = width / 2 + (index - 1) * 200; // Spacing untuk 3 avatar
      const sprite = this.add.sprite(x, centerY, avatar.id);
      sprite.setScale(0.4); // Diperkecil untuk preview yang lebih baik
      this.avatarSprites.push(sprite);
      
      // Tambahkan nama avatar di bawah sprite
      this.add.text(x, centerY + 60, avatar.name, {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5);
    });
  }

  private createInfoPanel() {
    const { width, height } = this.cameras.main;
    
    this.infoPanel = this.add.container(width / 2, height / 2 + 100);
    
    // Background panel
    const panel = this.add.rectangle(0, 0, 400, 120, 0x1a1a2e, 0.8);
    panel.setStrokeStyle(2, 0x00ff88);
    this.infoPanel.add(panel);
  }

  private updateDisplay() {
    const selectedAvatar = this.avatars[this.selectedIndex];
    
    // Update avatar highlights
    this.avatarSprites.forEach((sprite, index) => {
      if (index === this.selectedIndex) {
        sprite.setScale(0.5); // Highlight selected avatar (sedikit lebih besar)
        sprite.setTint(0xffffff);
        // Add glow effect
        const glow = this.add.circle(sprite.x, sprite.y, 60, 0x00ff88, 0.3);
        this.time.delayedCall(100, () => glow.destroy());
      } else {
        sprite.setScale(0.4); // Unselected avatars remain small
        sprite.setTint(0x888888);
      }
    });

    // Clear and update info panel
    this.infoPanel.removeAll(true);
    
    // Background panel
    const panel = this.add.rectangle(0, 0, 400, 120, 0x1a1a2e, 0.8);
    panel.setStrokeStyle(2, 0x00ff88);
    this.infoPanel.add(panel);
    
    // Fighter name
    const nameText = this.add.text(0, -40, selectedAvatar.name, {
      fontSize: '20px',
      color: '#00ff88',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.infoPanel.add(nameText);
    
    // Stats
    const statsText = this.add.text(0, -10, 
      `Speed: ${selectedAvatar.speed} | Health: ${selectedAvatar.health} | Fire Rate: ${selectedAvatar.fireRate}ms`, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.infoPanel.add(statsText);
    
    // Special ability
    const specialText = this.add.text(0, 15, `Special: ${selectedAvatar.special}`, {
      fontSize: '16px',
      color: '#ffff44',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.infoPanel.add(specialText);
    
    // Confirm button
    const confirmButton = this.add.rectangle(0, 45, 150, 30, 0x00ff88)
      .setInteractive()
      .on('pointerdown', () => this.selectAvatar());
    this.infoPanel.add(confirmButton);
    
    const confirmText = this.add.text(0, 45, 'START GAME!', {
      fontSize: '16px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    this.infoPanel.add(confirmText);
  }

  private setupInput() {
    const cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,S,A,D,SPACE');

    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.updateDisplay();
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.selectedIndex = Math.min(this.avatars.length - 1, this.selectedIndex + 1);
          this.updateDisplay();
          break;
        case 'Space':
        case 'Enter':
          this.selectAvatar();
          break;
        case 'Escape':
          this.scene.start('MenuScene');
          break;
      }
    });
  }

  private selectAvatar() {
    const selectedAvatar = this.avatars[this.selectedIndex];
    
    // Store selected avatar in registry
    this.registry.set('selectedAvatar', selectedAvatar);
    
    // Add selection effect
    const selectedSprite = this.avatarSprites[this.selectedIndex];
    this.add.circle(selectedSprite.x, selectedSprite.y, 40, 0x00ff88, 0.5);
    
    // Show confirmation message
    const confirmText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 150, 
      `${selectedAvatar.name} selected! Starting game...`, {
      fontSize: '18px',
      color: '#00ff88',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // Transition to game
    this.time.delayedCall(1000, () => {
      this.scene.start('GameScene');
    });
  }
}
