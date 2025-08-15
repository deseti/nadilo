import Phaser from 'phaser';

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public health: number = 100;
  public maxHealth: number = 100;
  public speed: number = 200;
  public lastShot: number = 0;
  public shootCooldown: number = 300; // milliseconds
  private scene: Phaser.Scene;
  private bullets: Phaser.Physics.Arcade.Group;
  private isPlayer: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, type: 'player' | 'enemy') {
    this.scene = scene;
    this.isPlayer = type === 'player';

    // Create sprite
    const color = this.isPlayer ? 0x00ff88 : 0xff4444;
    this.sprite = scene.physics.add.sprite(x, y, '');
    
    // Create a simple colored rectangle as player sprite
    const graphics = scene.add.graphics();
    graphics.fillStyle(color);
    graphics.fillRect(-15, -15, 30, 30);
    graphics.generateTexture(type, 30, 30);
    graphics.destroy();
    
    this.sprite.setTexture(type);
    this.sprite.setCollideWorldBounds(true);

    // Create bullets group
    this.bullets = scene.physics.add.group({
      maxSize: 10
    });

    // Create bullet texture
    const bulletGraphics = scene.add.graphics();
    bulletGraphics.fillStyle(color);
    bulletGraphics.fillCircle(0, 0, 3);
    bulletGraphics.generateTexture('bullet_' + type, 6, 6);
    bulletGraphics.destroy();

    // Setup collisions
    this.setupCollisions();
  }

  update(keys?: any, pointer?: Phaser.Input.Pointer) {
    if (!this.isPlayer) return;

    // Movement
    let velocityX = 0;
    let velocityY = 0;

    if (keys?.A?.isDown) {
      velocityX = -this.speed;
    } else if (keys?.D?.isDown) {
      velocityX = this.speed;
    }

    if (keys?.W?.isDown) {
      velocityY = -this.speed;
    } else if (keys?.S?.isDown) {
      velocityY = this.speed;
    }

    this.sprite.setVelocity(velocityX, velocityY);

    // Rotation towards mouse
    if (pointer) {
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x, this.sprite.y,
        pointer.worldX, pointer.worldY
      );
      this.sprite.setRotation(angle + Math.PI / 2);
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

  updateAI(target: Player) {
    if (this.isPlayer) return;

    // Simple AI: move towards player and shoot
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      target.sprite.x, target.sprite.y
    );

    if (distance > 100) {
      // Move towards player
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x, this.sprite.y,
        target.sprite.x, target.sprite.y
      );
      
      this.sprite.setVelocity(
        Math.cos(angle) * this.speed * 0.7,
        Math.sin(angle) * this.speed * 0.7
      );
      
      this.sprite.setRotation(angle + Math.PI / 2);
    } else {
      this.sprite.setVelocity(0, 0);
    }

    // Shoot at player occasionally
    if (distance < 200 && this.scene.time.now - this.lastShot > this.shootCooldown * 2) {
      this.shoot(target.sprite.x, target.sprite.y);
    }
  }

  shoot(targetX: number, targetY: number) {
    if (this.scene.time.now - this.lastShot < this.shootCooldown) return;

    const bullet = this.bullets.get() as Phaser.Physics.Arcade.Sprite;
    if (!bullet) return;

    const bulletTexture = this.isPlayer ? 'bullet_player' : 'bullet_enemy';
    bullet.setTexture(bulletTexture);
    bullet.setPosition(this.sprite.x, this.sprite.y);
    bullet.setActive(true);
    bullet.setVisible(true);

    // Calculate direction
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y,
      targetX, targetY
    );

    const bulletSpeed = 400;
    bullet.setVelocity(
      Math.cos(angle) * bulletSpeed,
      Math.sin(angle) * bulletSpeed
    );

    this.lastShot = this.scene.time.now;
  }

  takeDamage(damage: number) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;

    // Visual feedback
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint();
    });
  }

  private setupCollisions() {
    // This will be expanded when we add collision detection
    // between bullets and players
  }

  getBullets() {
    return this.bullets;
  }
}