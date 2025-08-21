import Phaser from 'phaser';
import { Player } from './Player';

export interface PowerUpData {
  type: 'health' | 'shield' | 'rapidfire' | 'multishot' | 'speed' | 'nuke' | 'invulnerable';
  duration?: number;
  value: number;
  color: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export class PowerUp {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  public data: PowerUpData;
  private glowEffect!: Phaser.GameObjects.Shape;
  private isCollected: boolean = false;

  private static powerUpTypes: PowerUpData[] = [
    // Common
    { type: 'health', value: 30, color: 0xff4444, rarity: 'common' },
    { type: 'speed', value: 100, duration: 5000, color: 0x4444ff, rarity: 'common' },
    
    // Rare
    { type: 'rapidfire', value: 0.5, duration: 8000, color: 0xffaa00, rarity: 'rare' },
    { type: 'shield', value: 50, duration: 10000, color: 0x00aaff, rarity: 'rare' },
    
    // Epic
    { type: 'multishot', value: 3, duration: 12000, color: 0xaa44ff, rarity: 'epic' },
    { type: 'nuke', value: 1, color: 0xff00ff, rarity: 'epic' },
    
    // Legendary
    { type: 'invulnerable', value: 1, duration: 5000, color: 0xffd700, rarity: 'legendary' }
  ];

  constructor(scene: Phaser.Scene, x: number, y: number, specificType?: string) {
    this.scene = scene;
    
    // Choose power-up type based on rarity
    if (specificType) {
      this.data = PowerUp.powerUpTypes.find(p => p.type === specificType)!;
    } else {
      this.data = this.getRandomPowerUp();
    }

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, '');
    this.createPowerUpTexture();
    this.sprite.setCollideWorldBounds(true);

    // Create glow effect
    this.createGlowEffect();

    // Add animations
    this.addAnimations();
  }

  private getRandomPowerUp(): PowerUpData {
    const rand = Math.random();
    
    // Rarity chances: Common 50%, Rare 30%, Epic 15%, Legendary 5%
    if (rand < 0.5) {
      return Phaser.Utils.Array.GetRandom(PowerUp.powerUpTypes.filter(p => p.rarity === 'common'));
    } else if (rand < 0.8) {
      return Phaser.Utils.Array.GetRandom(PowerUp.powerUpTypes.filter(p => p.rarity === 'rare'));
    } else if (rand < 0.95) {
      return Phaser.Utils.Array.GetRandom(PowerUp.powerUpTypes.filter(p => p.rarity === 'epic'));
    } else {
      return Phaser.Utils.Array.GetRandom(PowerUp.powerUpTypes.filter(p => p.rarity === 'legendary'));
    }
  }

  private createPowerUpTexture() {
    const graphics = this.scene.add.graphics();
    const size = this.getRaritySize();
    
    // Base shape based on type
    graphics.fillStyle(this.data.color);
    
    switch (this.data.type) {
      case 'health':
        // Red cross
        graphics.fillRect(-size/2, -size/8, size, size/4);
        graphics.fillRect(-size/8, -size/2, size/4, size);
        break;
        
      case 'shield':
        // Shield shape
        graphics.fillCircle(0, 0, size/2);
        graphics.fillTriangle(0, -size/2, -size/3, size/3, size/3, size/3);
        break;
        
      case 'rapidfire':
        // Triple arrows
        for (let i = -1; i <= 1; i++) {
          graphics.fillTriangle(i * size/4, -size/2, i * size/4 - size/6, size/2, i * size/4 + size/6, size/2);
        }
        break;
        
      case 'multishot':
        // Star burst
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6;
          const x1 = Math.cos(angle) * size/3;
          const y1 = Math.sin(angle) * size/3;
          const x2 = Math.cos(angle + Math.PI/6) * size/6;
          const y2 = Math.sin(angle + Math.PI/6) * size/6;
          const x3 = Math.cos(angle - Math.PI/6) * size/6;
          const y3 = Math.sin(angle - Math.PI/6) * size/6;
          graphics.fillTriangle(x1, y1, x2, y2, x3, y3);
        }
        break;
        
      case 'speed':
        // Lightning bolt
        graphics.fillTriangle(-size/3, size/2, 0, -size/2, size/6, 0);
        graphics.fillTriangle(-size/6, 0, size/3, -size/2, size/3, size/2);
        break;
        
      case 'nuke':
        // Atomic symbol
        graphics.fillCircle(0, 0, size/8);
        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3;
          graphics.fillEllipse(Math.cos(angle) * size/3, Math.sin(angle) * size/3, size/6, size/12, angle);
        }
        break;
        
      case 'invulnerable':
        // Diamond
        graphics.fillTriangle(0, -size/2, -size/2, 0, 0, size/2);
        graphics.fillTriangle(0, -size/2, size/2, 0, 0, size/2);
        break;
    }
    
    // Add rarity border
    this.addRarityBorder(graphics, size);
    
    graphics.generateTexture(`powerup_${this.data.type}_${this.data.rarity}`, size*2, size*2);
    graphics.destroy();
    
    this.sprite.setTexture(`powerup_${this.data.type}_${this.data.rarity}`);
  }

  private getRaritySize(): number {
    switch (this.data.rarity) {
      case 'common': return 16;
      case 'rare': return 20;
      case 'epic': return 24;
      case 'legendary': return 28;
      default: return 16;
    }
  }

  private addRarityBorder(graphics: Phaser.GameObjects.Graphics, size: number) {
    const borderColor = this.getRarityBorderColor();
    graphics.lineStyle(2, borderColor);
    graphics.strokeCircle(0, 0, size/2 + 4);
    
    if (this.data.rarity === 'legendary') {
      // Extra sparkle border for legendary
      graphics.lineStyle(1, 0xffffff);
      graphics.strokeCircle(0, 0, size/2 + 6);
    }
  }

  private getRarityBorderColor(): number {
    switch (this.data.rarity) {
      case 'common': return 0x888888;
      case 'rare': return 0x0088ff;
      case 'epic': return 0x8800ff;
      case 'legendary': return 0xffd700;
      default: return 0x888888;
    }
  }

  private createGlowEffect() {
    const glowSize = this.getRaritySize() + 10;
    const glowColor = this.getRarityBorderColor();
    const glowAlpha = this.data.rarity === 'legendary' ? 0.6 : 0.3;
    
    this.glowEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, glowSize, glowColor, glowAlpha);
    this.glowEffect.setBlendMode(Phaser.BlendModes.ADD);
  }

  private addAnimations() {
    // Floating animation
    this.scene.tweens.add({
      targets: [this.sprite, this.glowEffect],
      y: this.sprite.y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Rotation animation
    this.scene.tweens.add({
      targets: this.sprite,
      rotation: Math.PI * 2,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });

    // Glow pulse
    this.scene.tweens.add({
      targets: this.glowEffect,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: this.data.rarity === 'legendary' ? 0.8 : 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Legendary sparkle effect
    if (this.data.rarity === 'legendary') {
      this.scene.time.addEvent({
        delay: 300,
        callback: this.createSparkle,
        callbackScope: this,
        loop: true
      });
    }
  }

  private createSparkle() {
    if (this.isCollected) return;
    
    const sparkle = this.scene.add.circle(
      this.sprite.x + Phaser.Math.Between(-20, 20),
      this.sprite.y + Phaser.Math.Between(-20, 20),
      2,
      0xffffff
    );
    
    this.scene.tweens.add({
      targets: sparkle,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 800,
      onComplete: () => sparkle.destroy()
    });
  }

  collect(player: Player): string {
    if (this.isCollected) return '';
    this.isCollected = true;

    // Create collection effect
    const collectEffect = this.scene.add.circle(this.sprite.x, this.sprite.y, 30, this.data.color, 0.7);
    this.scene.tweens.add({
      targets: collectEffect,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 500,
      onComplete: () => collectEffect.destroy()
    });

    // Apply power-up effect
    let message = '';
    
    switch (this.data.type) {
      case 'health':
        player.health = Math.min(player.maxHealth, player.health + this.data.value);
        message = `+${this.data.value} Health!`;
        break;
        
      case 'shield':
        player.addShield(this.data.value, this.data.duration!);
        message = `Shield +${this.data.value}!`;
        break;
        
      case 'rapidfire':
        player.addRapidFire(this.data.value, this.data.duration!);
        message = 'Rapid Fire!';
        break;
        
      case 'multishot':
        player.addMultiShot(this.data.value, this.data.duration!);
        message = `${this.data.value}x Multi Shot!`;
        break;
        
      case 'speed':
        player.addSpeedBoost(this.data.value, this.data.duration!);
        message = 'Speed Boost!';
        break;
        
      case 'nuke':
        // This will be handled by the game scene
        message = 'NUCLEAR BLAST!';
        break;
        
      case 'invulnerable':
        player.addInvulnerability(this.data.duration!);
        message = 'INVULNERABLE!';
        break;
    }

    // Add score (rarity dependent)
    const scoreBonus = this.getRarityScore();
    if (this.scene && 'addScore' in this.scene) {
      (this.scene as any).addScore(scoreBonus);
    }

    // Clean up
    this.destroy();
    
    return message;
  }

  private getRarityScore(): number {
    switch (this.data.rarity) {
      case 'common': return 25;
      case 'rare': return 50;
      case 'epic': return 100;
      case 'legendary': return 250;
      default: return 25;
    }
  }

  destroy() {
    this.glowEffect.destroy();
    this.sprite.destroy();
  }

  // Static method for game scene to handle nuke effect
  static handleNukeEffect(scene: Phaser.Scene, enemies: any[], player: any) {
    // Create massive explosion effect
    const { width, height } = scene.cameras.main;
    const explosion = scene.add.circle(width/2, height/2, 50, 0xffff00, 0.8);
    
    scene.tweens.add({
      targets: explosion,
      scaleX: 15,
      scaleY: 15,
      alpha: 0,
      duration: 1000,
      onComplete: () => explosion.destroy()
    });

    // Damage all enemies
    enemies.forEach(enemy => {
      if (enemy && enemy.takeDamage) {
        enemy.takeDamage(500); // Massive damage
      }
    });

    // Screen shake
    scene.cameras.main.shake(500, 0.02);
    
    // Add massive score bonus
    if (scene && 'addScore' in scene) {
      (scene as any).addScore(1000);
    }
  }
}
