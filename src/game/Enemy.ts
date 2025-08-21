import Phaser from 'phaser';
import { Player } from './Player';

export interface EnemyData {
  type: 'basic' | 'fast' | 'heavy' | 'sniper' | 'boss';
  health: number;
  speed: number;
  damage: number;
  fireRate: number;
  color: number;
  size: number;
  scoreValue: number;
  behavior: 'aggressive' | 'defensive' | 'patrol' | 'snipe';
}

export class Enemy {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public health: number;
  public maxHealth: number;
  public speed: number;
  public damage: number;
  public fireRate: number;
  public lastShot: number = 0;
  public scoreValue: number;
  public behavior: string;
  public type: string;
  
  private scene: Phaser.Scene;
  private bullets: Phaser.Physics.Arcade.Group;
  private patrolTarget: { x: number; y: number } | null = null;
  private healthBar!: Phaser.GameObjects.Graphics;
  private isDestroyed: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, enemyData: EnemyData) {
    this.scene = scene;
    this.health = enemyData.health;
    this.maxHealth = enemyData.health;
    this.speed = enemyData.speed;
    this.damage = enemyData.damage;
    this.fireRate = enemyData.fireRate;
    this.scoreValue = enemyData.scoreValue;
    this.behavior = enemyData.behavior;
    this.type = enemyData.type;

    // Create sprite
    this.sprite = scene.physics.add.sprite(x, y, '');
    this.createEnemyTexture(enemyData);
    this.sprite.setCollideWorldBounds(true);

    // Create bullets group
    this.bullets = scene.physics.add.group({
      maxSize: 20
    });

    // Create bullet texture
    this.createBulletTexture(enemyData.color);

    // Create health bar
    this.createHealthBar();

    // Set patrol target for patrol behavior
    if (this.behavior === 'patrol') {
      this.setNewPatrolTarget();
    }
  }

  private createEnemyTexture(enemyData: EnemyData) {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(enemyData.color);
    
    switch (enemyData.type) {
      case 'basic':
        // Simple triangle
        graphics.fillTriangle(0, -enemyData.size, -enemyData.size/2, enemyData.size/2, enemyData.size/2, enemyData.size/2);
        break;
      case 'fast':
        // Sleek arrow shape
        graphics.fillTriangle(0, -enemyData.size, -enemyData.size/3, enemyData.size/3, enemyData.size/3, enemyData.size/3);
        graphics.fillRect(-enemyData.size/6, enemyData.size/3, enemyData.size/3, enemyData.size/3);
        break;
      case 'heavy':
        // Thick hexagon
        graphics.fillRect(-enemyData.size/2, -enemyData.size/2, enemyData.size, enemyData.size);
        graphics.fillTriangle(0, -enemyData.size, -enemyData.size/3, -enemyData.size/2, enemyData.size/3, -enemyData.size/2);
        break;
      case 'sniper':
        // Long thin shape
        graphics.fillRect(-enemyData.size/4, -enemyData.size, enemyData.size/2, enemyData.size*2);
        graphics.fillCircle(0, 0, enemyData.size/3);
        break;
      case 'boss':
        // Large complex shape
        graphics.fillCircle(0, 0, enemyData.size/2);
        graphics.fillTriangle(0, -enemyData.size, -enemyData.size/2, enemyData.size/2, enemyData.size/2, enemyData.size/2);
        graphics.fillRect(-enemyData.size/3, -enemyData.size/3, enemyData.size*2/3, enemyData.size*2/3);
        break;
    }
    
    graphics.generateTexture(`enemy_${enemyData.type}`, enemyData.size*2, enemyData.size*2);
    graphics.destroy();
    
    this.sprite.setTexture(`enemy_${enemyData.type}`);
  }

  private createBulletTexture(color: number) {
    const bulletGraphics = this.scene.add.graphics();
    bulletGraphics.fillStyle(color);
    bulletGraphics.fillCircle(0, 0, 4);
    bulletGraphics.generateTexture(`bullet_${this.type}`, 8, 8);
    bulletGraphics.destroy();
  }

  private createHealthBar() {
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
  }

  private updateHealthBar() {
    this.healthBar.clear();
    
    const barWidth = 40;
    const barHeight = 6;
    const x = this.sprite.x - barWidth / 2;
    const y = this.sprite.y - 30;
    
    // Background
    this.healthBar.fillStyle(0x333333);
    this.healthBar.fillRect(x, y, barWidth, barHeight);
    
    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.6 ? 0x00ff00 : healthPercent > 0.3 ? 0xffff00 : 0xff0000;
    this.healthBar.fillStyle(healthColor);
    this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
  }

  update(target: Player) {
    if (this.isDestroyed) return;

    this.updateHealthBar();

    switch (this.behavior) {
      case 'aggressive':
        this.aggressiveBehavior(target);
        break;
      case 'defensive':
        this.defensiveBehavior(target);
        break;
      case 'patrol':
        this.patrolBehavior(target);
        break;
      case 'snipe':
        this.snipeBehavior(target);
        break;
    }

    // Update bullets
    this.bullets.children.entries.forEach((bullet) => {
      const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
      if (bulletSprite.active) {
        // Remove bullets that go off screen
        if (bulletSprite.x < 0 || bulletSprite.x > 800 || bulletSprite.y < 0 || bulletSprite.y > 600) {
          bulletSprite.setActive(false);
          bulletSprite.setVisible(false);
        }
      }
    });
  }

  private aggressiveBehavior(target: Player) {
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      target.sprite.x, target.sprite.y
    );

    // Always move towards player
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      target.sprite.x, target.sprite.y
    );
    
    this.sprite.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );
    
    this.sprite.setRotation(angle + Math.PI / 2);

    // Shoot frequently when in range
    if (distance < 250 && this.scene.time.now - this.lastShot > this.fireRate) {
      this.shoot(target.sprite.x, target.sprite.y);
    }
  }

  private defensiveBehavior(target: Player) {
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      target.sprite.x, target.sprite.y
    );

    if (distance < 150) {
      // Move away from player
      const angle = Phaser.Math.Angle.Between(
        target.sprite.x, target.sprite.y,
        this.sprite.x, this.sprite.y
      );
      
      this.sprite.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      );
    } else if (distance > 200) {
      // Move closer to player
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x, this.sprite.y,
        target.sprite.x, target.sprite.y
      );
      
      this.sprite.setVelocity(
        Math.cos(angle) * this.speed * 0.5,
        Math.sin(angle) * this.speed * 0.5
      );
    } else {
      this.sprite.setVelocity(0, 0);
    }

    // Face and shoot at player
    const shootAngle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      target.sprite.x, target.sprite.y
    );
    this.sprite.setRotation(shootAngle + Math.PI / 2);

    if (distance < 200 && this.scene.time.now - this.lastShot > this.fireRate) {
      this.shoot(target.sprite.x, target.sprite.y);
    }
  }

  private patrolBehavior(target: Player) {
    const playerDistance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      target.sprite.x, target.sprite.y
    );

    // If player is close, attack
    if (playerDistance < 200) {
      this.aggressiveBehavior(target);
      return;
    }

    // Patrol logic
    if (!this.patrolTarget) {
      this.setNewPatrolTarget();
    }

    const patrolDistance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.patrolTarget!.x, this.patrolTarget!.y
    );

    if (patrolDistance < 20) {
      this.setNewPatrolTarget();
    }

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      this.patrolTarget!.x, this.patrolTarget!.y
    );
    
    this.sprite.setVelocity(
      Math.cos(angle) * this.speed * 0.6,
      Math.sin(angle) * this.speed * 0.6
    );
    
    this.sprite.setRotation(angle + Math.PI / 2);
  }

  private snipeBehavior(target: Player) {
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      target.sprite.x, target.sprite.y
    );

    // Keep distance and snipe
    if (distance < 300) {
      // Move away to maintain sniper distance
      const angle = Phaser.Math.Angle.Between(
        target.sprite.x, target.sprite.y,
        this.sprite.x, this.sprite.y
      );
      
      this.sprite.setVelocity(
        Math.cos(angle) * this.speed * 0.8,
        Math.sin(angle) * this.speed * 0.8
      );
    } else {
      this.sprite.setVelocity(0, 0);
    }

    // Always face player
    const shootAngle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      target.sprite.x, target.sprite.y
    );
    this.sprite.setRotation(shootAngle + Math.PI / 2);

    // Precise long-range shooting
    if (this.scene.time.now - this.lastShot > this.fireRate) {
      this.shoot(target.sprite.x, target.sprite.y);
    }
  }

  private setNewPatrolTarget() {
    this.patrolTarget = {
      x: Phaser.Math.Between(50, 750),
      y: Phaser.Math.Between(50, 550)
    };
  }

  shoot(targetX: number, targetY: number) {
    const bullet = this.bullets.get() as Phaser.Physics.Arcade.Sprite;
    if (!bullet) return;

    bullet.setTexture(`bullet_${this.type}`);
    bullet.setPosition(this.sprite.x, this.sprite.y);
    bullet.setActive(true);
    bullet.setVisible(true);

    // Calculate direction with some spread for non-sniper enemies
    let angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      targetX, targetY
    );

    if (this.type !== 'sniper') {
      // Add some inaccuracy
      angle += Phaser.Math.FloatBetween(-0.2, 0.2);
    }

    const bulletSpeed = this.type === 'sniper' ? 600 : 350;
    bullet.setVelocity(
      Math.cos(angle) * bulletSpeed,
      Math.sin(angle) * bulletSpeed
    );

    this.lastShot = this.scene.time.now;
  }

  takeDamage(damage: number): boolean {
    this.health -= damage;
    if (this.health < 0) this.health = 0;

    // Visual feedback
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (!this.isDestroyed) {
        this.sprite.clearTint();
      }
    });

    // Create damage number
    const damageText = this.scene.add.text(this.sprite.x, this.sprite.y - 20, `-${damage}`, {
      fontSize: '14px',
      color: '#ff4444'
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => damageText.destroy()
    });

    if (this.health <= 0) {
      this.destroy();
      return true; // Enemy destroyed
    }

    return false; // Enemy still alive
  }

  destroy() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    // Create explosion effect
    const explosion = this.scene.add.circle(this.sprite.x, this.sprite.y, 5, 0xffaa00);
    this.scene.tweens.add({
      targets: explosion,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 300,
      onComplete: () => explosion.destroy()
    });

    // Create score popup
    const scoreText = this.scene.add.text(this.sprite.x, this.sprite.y, `+${this.scoreValue}`, {
      fontSize: '16px',
      color: '#00ff88'
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: scoreText,
      y: scoreText.y - 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => scoreText.destroy()
    });

    this.healthBar.destroy();
    this.sprite.destroy();
    this.bullets.destroy(true);
  }

  getBullets() {
    return this.bullets;
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }
}
