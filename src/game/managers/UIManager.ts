import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import type { Player } from '../Player';

export class UIManager {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private powerUpText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI() {
    const { COLORS } = GAME_CONFIG;

    // Score display
    this.scoreText = this.scene.add.text(16, 16, 'Score: 0', {
      fontSize: '24px',
      color: COLORS.SCORE
    }).setDepth(100);

    // Health display
    this.healthText = this.scene.add.text(16, 50, 'Health: 100', {
      fontSize: '24px',
      color: COLORS.HEALTH
    }).setDepth(100);

    // Wave display
    this.waveText = this.scene.add.text(16, 84, 'Wave: 1', {
      fontSize: '24px',
      color: COLORS.WAVE
    }).setDepth(100);

    // Timer display
    this.timerText = this.scene.add.text(16, 118, 'Time: 60s', {
      fontSize: '24px',
      color: COLORS.TIMER
    }).setDepth(100); // Ensure timer is always visible on top

    // Lives display
    this.livesText = this.scene.add.text(16, 152, 'Lives: 3', {
      fontSize: '24px',
      color: COLORS.LIVES
    }).setDepth(100);

    // Power-up display
    const { width } = this.scene.cameras.main;
    this.powerUpText = this.scene.add.text(width / 2, 50, '', {
      fontSize: '20px',
      color: COLORS.POWER_UP
    }).setOrigin(0.5);
  }

  updateUI(player: Player, score: number, wave: number, remainingTime: number) {
    // Safety check - ensure player exists
    if (!player) {
      console.warn('⚠️ Player not available for UI update');
      return;
    }

    // Update score
    this.scoreText.setText(`Score: ${score}`);

    // Update health with shield info
    const healthText = `Health: ${player.health}${player.shield > 0 ? ` (+${player.shield})` : ''}`;
    this.healthText.setText(healthText);

    // Update wave
    this.waveText.setText(`Wave: ${wave}`);

    // Update lives
    this.livesText.setText(`Lives: ${player.lives}`);

    // Update timer with color coding
    if (remainingTime > 20) {
      this.timerText.setColor('#ffaa00');
    } else if (remainingTime > 10) {
      this.timerText.setColor('#ff6600');
    } else {
      this.timerText.setColor('#ff0000');
    }
    this.timerText.setText(`Time: ${remainingTime}s`);
  }

  showPowerUpMessage(message: string) {
    this.powerUpText.setText(message);
    this.scene.time.delayedCall(2000, () => {
      this.powerUpText.setText('');
    });
  }

  createMenuButton() {
    const { width } = this.scene.cameras.main;
    
    // Back to menu button
    this.scene.add.rectangle(width - 80, 30, 120, 40, 0x444444)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.scene.start('MenuScene');
      });

    this.scene.add.text(width - 80, 30, 'MENU', {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
}