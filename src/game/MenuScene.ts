import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, height / 2 - 100, 'CRYPTO CLASH', {
      fontSize: '48px',
      color: '#00ff88',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2 - 40, 'Battle Arena', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Start button
    const startButton = this.add.rectangle(width / 2, height / 2 + 50, 200, 60, 0x00ff88)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('GameScene');
      })
      .on('pointerover', () => {
        startButton.setFillStyle(0x00cc66);
      })
      .on('pointerout', () => {
        startButton.setFillStyle(0x00ff88);
      });

    this.add.text(width / 2, height / 2 + 50, 'START BATTLE', {
      fontSize: '20px',
      color: '#000000',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width / 2, height / 2 + 150, 'WASD: Move | Mouse: Aim | Click: Attack', {
      fontSize: '16px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
  }
}