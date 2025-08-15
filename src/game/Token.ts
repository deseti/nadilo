import Phaser from 'phaser';
import { Player } from './Player';

export class Token {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private scene: Phaser.Scene;
  public value: number;
  public type: 'health' | 'speed' | 'damage' | 'coin';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    
    // Random token type
    const types: ('health' | 'speed' | 'damage' | 'coin')[] = ['health', 'speed', 'damage', 'coin'];
    this.type = types[Math.floor(Math.random() * types.length)];
    
    // Set value based on type
    switch (this.type) {
      case 'health':
        this.value = 25;
        break;
      case 'speed':
        this.value = 50; // speed boost duration in ms
        break;
      case 'damage':
        this.value = 2; // damage multiplier
        break;
      case 'coin':
        this.value = 10; // score points
        break;
    }

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, '');
    
    // Create token texture based on type
    this.createTokenTexture();
    
    this.sprite.setCollideWorldBounds(true);
    
    // Add floating animation
    scene.tweens.add({
      targets: this.sprite,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add rotation animation
    scene.tweens.add({
      targets: this.sprite,
      rotation: Math.PI * 2,
      duration: 2000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  private createTokenTexture() {
    const graphics = this.scene.add.graphics();
    
    switch (this.type) {
      case 'health':
        // Red cross
        graphics.fillStyle(0xff4444);
        graphics.fillRect(-8, -2, 16, 4);
        graphics.fillRect(-2, -8, 4, 16);
        break;
      case 'speed':
        // Blue lightning bolt
        graphics.fillStyle(0x4444ff);
        graphics.fillTriangle(-8, 8, 0, -8, 4, 0);
        graphics.fillTriangle(-4, 0, 8, -8, 8, 8);
        break;
      case 'damage':
        // Orange sword
        graphics.fillStyle(0xff8844);
        graphics.fillRect(-2, -8, 4, 12);
        graphics.fillRect(-6, 4, 12, 4);
        break;
      case 'coin':
        // Yellow coin
        graphics.fillStyle(0xffff44);
        graphics.fillCircle(0, 0, 8);
        graphics.fillStyle(0xffdd00);
        graphics.fillCircle(0, 0, 6);
        break;
    }
    
    graphics.generateTexture(`token_${this.type}`, 16, 16);
    graphics.destroy();
    
    this.sprite.setTexture(`token_${this.type}`);
  }

  collect(player: Player) {
    // Apply token effect to player
    switch (this.type) {
      case 'health':
        player.health = Math.min(player.maxHealth, player.health + this.value);
        break;
      case 'speed':
        // Temporary speed boost (would need to implement timer)
        player.speed += 50;
        this.scene.time.delayedCall(3000, () => {
          player.speed -= 50;
        });
        break;
      case 'damage':
        // Temporary damage boost (would need to implement in shooting)
        break;
      case 'coin':
        // Add score (assuming scene has addScore method)
        if (this.scene && 'addScore' in this.scene) {
          (this.scene as any).addScore(this.value);
        }
        break;
    }

    // Remove token
    this.sprite.destroy();
  }
}