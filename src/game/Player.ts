import Phaser from 'phaser';
import type { AvatarData } from './AvatarSelectScene';

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public health: number = 100;
  public maxHealth: number = 100;
  public speed: number = 200;
  public baseSpeed: number = 200;
  public lastShot: number = 0;
  public shootCooldown: number = 300; // milliseconds
  public shield: number = 0;
  private scene: Phaser.Scene;
  private bullets: Phaser.Physics.Arcade.Group;
  private isPlayer: boolean;
  private avatarData: AvatarData | null = null;

  // Power-up states
  private rapidFireActive: boolean = false;
  private multiShotActive: boolean = false;
  private multiShotCount: number = 1;
  private speedBoostActive: boolean = false;
  private invulnerableActive: boolean = false;
  private powerUpTimers: Phaser.Time.TimerEvent[] = [];

  // Visual effects
  private shieldSprite: Phaser.GameObjects.Arc | null = null;
  private thrusterParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private afterburnerParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private damageParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // Enhanced features
  public combo: number = 0;
  public comboTimer: number = 0;
  public comboDecayTime: number = 3000; // 3 seconds
  private lastMovement: { x: number, y: number } = { x: 0, y: 0 };
  private dashCooldown: number = 0;
  private dashDuration: number = 0;
  private isDashing: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: 'player' | 'enemy') {
    this.scene = scene;
    this.isPlayer = type === 'player';

    // Get avatar data if player
    if (this.isPlayer) {
      this.avatarData = scene.registry.get('selectedAvatar');
      if (this.avatarData) {
        this.speed = this.avatarData.speed;
        this.baseSpeed = this.avatarData.speed;
        this.health = this.avatarData.health;
        this.maxHealth = this.avatarData.health;
        this.shootCooldown = this.avatarData.fireRate;
      }
    }

    // Create sprite with enhanced fighter jet design
    if (this.isPlayer && this.avatarData) {
      // Try to use selected avatar image first
      if (scene.textures.exists(this.avatarData.id)) {
        this.sprite = scene.physics.add.sprite(x, y, this.avatarData.id);
        this.sprite.setScale(0.3); // Scaled down for better gameplay experience
      } else {
        // Fallback to created texture
        this.sprite = scene.physics.add.sprite(x, y, '');
        this.createAdvancedFighterTexture(this.avatarData.color, type);
      }
    } else {
      // Create colored sprite for enemies
      const color = this.isPlayer ? 0x00ff88 : 0xff4444;
      this.sprite = scene.physics.add.sprite(x, y, '');
      this.createAdvancedFighterTexture(color, type);
    }

    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDrag(100); // Add slight drag for more realistic movement

    // Create bullets group with enhanced properties
    this.bullets = scene.physics.add.group({
      maxSize: 50,
      createCallback: (bullet: Phaser.GameObjects.GameObject) => {
        const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
        bulletSprite.setCollideWorldBounds(false);
      }
    });

    // Create simple bullet texture for better performance
    const bulletColor = this.isPlayer ? (this.avatarData?.color || 0x00ff88) : 0xff4444;
    this.createSimpleBulletTexture(bulletColor, type);

    // Particle effects disabled for maximum performance
    // if (this.isPlayer) {
    //   this.createAdvancedParticleEffects();
    // }

    // Setup collisions
    this.setupCollisions();
  }

  private createAdvancedFighterTexture(color: number, type: string) {
    const graphics = this.scene.add.graphics();

    if (this.isPlayer && this.avatarData) {
      // Create sophisticated fighter jet based on avatar
      const avatarName = this.avatarData.id.toLowerCase();

      // Base fighter body
      graphics.fillStyle(color);
      graphics.beginPath();
      graphics.moveTo(0, -25); // nose (extended)
      graphics.lineTo(-6, -15); // left nose wing
      graphics.lineTo(-12, -8); // left main wing back
      graphics.lineTo(-18, -2); // left wing tip
      graphics.lineTo(-15, 8); // left wing front
      graphics.lineTo(-8, 15); // left rear wing
      graphics.lineTo(-4, 20); // left exhaust
      graphics.lineTo(0, 18); // center back
      graphics.lineTo(4, 20); // right exhaust
      graphics.lineTo(8, 15); // right rear wing
      graphics.lineTo(15, 8); // right wing front
      graphics.lineTo(18, -2); // right wing tip
      graphics.lineTo(12, -8); // right main wing back
      graphics.lineTo(6, -15); // right nose wing
      graphics.closePath();
      graphics.fillPath();

      // Cockpit with gradient effect
      graphics.fillStyle(0x222222);
      graphics.fillEllipse(0, -12, 8, 12);
      graphics.fillStyle(0x444444);
      graphics.fillEllipse(0, -12, 4, 8);

      // Engine intakes
      graphics.fillStyle(0x111111);
      graphics.fillCircle(-8, 0, 3);
      graphics.fillCircle(8, 0, 3);

      // Weapon hardpoints
      graphics.fillStyle(0x666666);
      graphics.fillRect(-15, -5, 4, 2);
      graphics.fillRect(11, -5, 4, 2);

      // Avatar-specific customizations
      graphics.fillStyle(0xffffff);
      if (avatarName.includes('moyaki')) {
        // Lightning pattern
        graphics.beginPath();
        graphics.moveTo(-3, -20);
        graphics.lineTo(0, -15);
        graphics.lineTo(-2, -10);
        graphics.lineTo(2, -8);
        graphics.lineTo(0, -5);
        graphics.lineTo(3, -3);
        graphics.strokePath();
        graphics.fillRect(-1, -22, 2, 8);
      } else if (avatarName.includes('molandak')) {
        // Stealth design elements
        graphics.fillStyle(0x00ff88);
        graphics.fillTriangle(0, -22, -4, -18, 4, -18);
        graphics.fillRect(-6, 2, 12, 3);
      } else if (avatarName.includes('chog')) {
        // Heavy armor plates
        graphics.fillStyle(0xffaa00);
        graphics.fillRect(-10, -3, 20, 6);
        graphics.fillRect(-6, 10, 12, 4);
        graphics.fillCircle(-12, 0, 2);
        graphics.fillCircle(12, 0, 2);
      }

      // Add glow effect
      graphics.lineStyle(2, color, 0.8);
      graphics.strokePath();

    } else {
      // Enhanced enemy design
      graphics.fillStyle(color);
      graphics.beginPath();
      graphics.moveTo(0, -18);
      graphics.lineTo(-8, -5);
      graphics.lineTo(-12, 0);
      graphics.lineTo(-8, 12);
      graphics.lineTo(0, 15);
      graphics.lineTo(8, 12);
      graphics.lineTo(12, 0);
      graphics.lineTo(8, -5);
      graphics.closePath();
      graphics.fillPath();

      // Enemy markings
      graphics.fillStyle(0xff0000);
      graphics.fillCircle(0, -8, 3);
      graphics.fillRect(-6, 0, 12, 2);
    }

    graphics.generateTexture(type + '_advanced_fighter', 50, 50);
    graphics.destroy();

    this.sprite.setTexture(type + '_advanced_fighter');
  }

  private createSimpleBulletTexture(color: number, type: string) {
    const bulletGraphics = this.scene.add.graphics();

    // Ultra-simple bullet design for maximum performance
    bulletGraphics.fillStyle(color);
    bulletGraphics.fillCircle(0, 0, 3); // Simple circle bullet

    bulletGraphics.generateTexture('bullet_' + type + '_advanced', 6, 6);
    bulletGraphics.destroy();
  }

  private createAdvancedParticleEffects() {
    // Disable all particle effects to prevent lag
    // Particle effects are causing significant performance issues

    // Set all particle emitters to null to prevent errors
    this.thrusterParticles = null;
    this.afterburnerParticles = null;
    this.damageParticles = null;
  }

  update(keys?: any, pointer?: Phaser.Input.Pointer) {
    if (!this.isPlayer) return;

    const currentTime = this.scene.time.now;

    // Update combo timer
    if (this.combo > 0) {
      this.comboTimer -= this.scene.game.loop.delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Update dash
    if (this.isDashing) {
      this.dashDuration -= this.scene.game.loop.delta;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
        this.sprite.setAlpha(1);
      }
    }

    // Dash cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown -= this.scene.game.loop.delta;
    }

    // Enhanced movement with acceleration
    let velocityX = 0;
    let velocityY = 0;
    let isMoving = false;

    const currentSpeed = this.isDashing ? this.speed * 2 : this.speed;

    if (keys?.A?.isDown) {
      velocityX = -currentSpeed;
      isMoving = true;
    } else if (keys?.D?.isDown) {
      velocityX = currentSpeed;
      isMoving = true;
    }

    if (keys?.W?.isDown) {
      velocityY = -currentSpeed;
      isMoving = true;
    } else if (keys?.S?.isDown) {
      velocityY = currentSpeed;
      isMoving = true;
    }

    // Dash ability (Shift key)
    if (keys?.SHIFT?.isDown && !this.isDashing && this.dashCooldown <= 0 && isMoving) {
      this.performDash();
    }

    // Apply movement with smooth interpolation
    const targetVelX = velocityX;
    const targetVelY = velocityY;
    const currentVelX = this.sprite.body!.velocity.x;
    const currentVelY = this.sprite.body!.velocity.y;

    const smoothing = 0.3;
    const newVelX = currentVelX + (targetVelX - currentVelX) * smoothing;
    const newVelY = currentVelY + (targetVelY - currentVelY) * smoothing;

    this.sprite.setVelocity(newVelX, newVelY);

    // Store last movement for particle effects
    this.lastMovement = { x: newVelX, y: newVelY };

    // Particle effects disabled for performance
    // this.updateParticleEffects(isMoving);

    // Smooth rotation towards mouse with banking effect
    if (pointer) {
      const targetAngle = Phaser.Math.Angle.Between(
        this.sprite.x, this.sprite.y,
        pointer.worldX, pointer.worldY
      );

      let currentAngle = this.sprite.rotation;
      let angleDiff = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);

      // Banking effect based on turn rate
      const bankingAmount = Phaser.Math.Clamp(angleDiff * 2, -0.3, 0.3);
      const finalAngle = targetAngle + bankingAmount;

      // Smooth rotation
      const rotationSpeed = 0.15;
      this.sprite.setRotation(
        currentAngle + Phaser.Math.Angle.Wrap(finalAngle - currentAngle) * rotationSpeed
      );
    }

    // Update shield visual (simplified for performance)
    this.updateAdvancedShieldVisual();

    // Update bullets with enhanced trail effects
    this.updateBullets();

    // Update invulnerability visual effect
    if (this.invulnerableActive) {
      const flickerSpeed = 0.03;
      const alpha = Math.sin(currentTime * flickerSpeed) * 0.3 + 0.7;
      this.sprite.setAlpha(alpha);
    } else if (!this.isDashing) {
      this.sprite.setAlpha(1);
    }

    // Health regeneration when not taking damage (optimized)
    if (this.health < this.maxHealth && currentTime % 10000 < 16) {
      this.health = Math.min(this.maxHealth, this.health + 1);
    }
  }

  private performDash() {
    this.isDashing = true;
    this.dashDuration = 200; // 200ms dash
    this.dashCooldown = 1000; // 1 second cooldown

    // Minimal visual effects - just alpha change
    this.sprite.setAlpha(0.6);

    // No additional visual effects to prevent lag
  }

  private updateParticleEffects(isMoving: boolean) {
    // Completely disable particle effects to prevent lag
    // All particle effects are disabled for maximum performance
    return;
  }

  private updateAdvancedShieldVisual() {
    if (this.shield > 0) {
      if (!this.shieldSprite) {
        this.shieldSprite = this.scene.add.circle(this.sprite.x, this.sprite.y, 25, 0x00aaff, 0.3);
      }

      // Simple shield update - no animations to prevent lag
      this.shieldSprite.setPosition(this.sprite.x, this.sprite.y);

    } else if (this.shieldSprite) {
      // Simple shield removal - no animations
      this.shieldSprite.destroy();
      this.shieldSprite = null;
    }
  }

  private updateBullets() {
    // Ultra-optimized bullet update - minimal processing
    const bullets = this.bullets.children.entries;

    for (let i = 0; i < bullets.length; i++) {
      const bullet = bullets[i] as Phaser.Physics.Arcade.Sprite;

      if (!bullet.active) continue;

      // Remove bullets that go off screen (simplified check)
      if (bullet.x < -100 || bullet.x > 900 || bullet.y < -100 || bullet.y > 700) {
        bullet.setActive(false);
        bullet.setVisible(false);
      }

      // Remove bullet rotation to save performance
      // bulletSprite.rotation += 0.05;
    }
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
    const currentCooldown = this.rapidFireActive ? this.shootCooldown * 0.3 : this.shootCooldown;
    if (this.scene.time.now - this.lastShot < currentCooldown) return;

    const shotsToFire = this.multiShotActive ? this.multiShotCount : 1;
    const spreadAngle = this.multiShotActive ? 0.3 : 0;

    for (let i = 0; i < shotsToFire; i++) {
      const bullet = this.bullets.get() as Phaser.Physics.Arcade.Sprite;
      if (!bullet) continue;

      const bulletTexture = this.isPlayer ? 'bullet_player_advanced' : 'bullet_enemy_advanced';
      bullet.setTexture(bulletTexture);
      bullet.setPosition(this.sprite.x, this.sprite.y);
      bullet.setActive(true);
      bullet.setVisible(true);

      // Calculate direction with spread for multishot
      let angle = Phaser.Math.Angle.Between(
        this.sprite.x, this.sprite.y,
        targetX, targetY
      );

      if (this.multiShotActive && shotsToFire > 1) {
        const spreadOffset = (i - (shotsToFire - 1) / 2) * spreadAngle;
        angle += spreadOffset;
      }

      const bulletSpeed = 500;
      bullet.setVelocity(
        Math.cos(angle) * bulletSpeed,
        Math.sin(angle) * bulletSpeed
      );

      // Disable all visual effects during shooting to prevent lag
      // Visual effects are causing performance issues

      // Add combo for rapid shooting (simplified)
      if (this.isPlayer) {
        this.combo++;
        this.comboTimer = this.comboDecayTime;
      }
    }

    this.lastShot = this.scene.time.now;

    // Disable muzzle flash completely to prevent lag
  }

  private createAdvancedBulletTrail(bullet: Phaser.Physics.Arcade.Sprite) {
    // Completely disable bullet trails to prevent lag
    // Trails are causing performance issues
    return;
  }

  private addCombo() {
    this.combo++;
    this.comboTimer = this.comboDecayTime;

    // Only show combo text for higher combos to prevent spam
    if (this.combo > 1 && this.combo % 5 === 0) {
      const comboText = this.scene.add.text(
        this.sprite.x + 20,
        this.sprite.y - 20,
        `x${this.combo}`,
        {
          fontSize: '14px',
          color: '#ffff00'
        }
      );

      this.scene.tweens.add({
        targets: comboText,
        y: comboText.y - 30,
        alpha: 0,
        duration: 600,
        onComplete: () => comboText.destroy()
      });
    }
  }

  private createMuzzleFlash() {
    // Completely disable muzzle flash to prevent lag
    // Muzzle flash effects are causing performance issues
    return;
  }

  private updateShieldVisual() {
    if (this.shield > 0) {
      if (!this.shieldSprite) {
        this.shieldSprite = this.scene.add.circle(this.sprite.x, this.sprite.y, 25, 0x00aaff, 0.3);
        this.shieldSprite.setStrokeStyle(2, 0x00aaff, 0.8);
      }
      this.shieldSprite.setPosition(this.sprite.x, this.sprite.y);

      // Pulse effect
      const pulseScale = 1 + Math.sin(this.scene.time.now * 0.01) * 0.1;
      this.shieldSprite.setScale(pulseScale);
    } else if (this.shieldSprite) {
      this.shieldSprite.destroy();
      this.shieldSprite = null;
    }
  }

  // Power-up methods
  addShield(amount: number, duration: number) {
    this.shield += amount;

    const timer = this.scene.time.delayedCall(duration, () => {
      this.shield = Math.max(0, this.shield - amount);
      if (this.shield <= 0 && this.shieldSprite) {
        this.shieldSprite.destroy();
        this.shieldSprite = null;
      }
    });

    this.powerUpTimers.push(timer);
  }

  addRapidFire(multiplier: number, duration: number) {
    this.rapidFireActive = true;

    const timer = this.scene.time.delayedCall(duration, () => {
      this.rapidFireActive = false;
    });

    this.powerUpTimers.push(timer);
  }

  addMultiShot(shotCount: number, duration: number) {
    this.multiShotActive = true;
    this.multiShotCount = shotCount;

    const timer = this.scene.time.delayedCall(duration, () => {
      this.multiShotActive = false;
      this.multiShotCount = 1;
    });

    this.powerUpTimers.push(timer);
  }

  addSpeedBoost(speedIncrease: number, duration: number) {
    if (!this.speedBoostActive) {
      this.speed += speedIncrease;
      this.speedBoostActive = true;

      const timer = this.scene.time.delayedCall(duration, () => {
        this.speed = this.baseSpeed;
        this.speedBoostActive = false;
      });

      this.powerUpTimers.push(timer);
    }
  }

  addInvulnerability(duration: number) {
    this.invulnerableActive = true;

    const timer = this.scene.time.delayedCall(duration, () => {
      this.invulnerableActive = false;
      this.sprite.setAlpha(1);
    });

    this.powerUpTimers.push(timer);
  }

  takeDamage(damage: number) {
    // Check invulnerability
    if (this.invulnerableActive) return;

    // Check shield
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, damage);
      this.shield -= shieldDamage;
      damage -= shieldDamage;

      // Enhanced shield hit effect
      if (this.shieldSprite) {
        this.shieldSprite.setAlpha(1);
        this.scene.cameras.main.flash(50, 255, 255, 255);
        this.scene.time.delayedCall(100, () => {
          if (this.shieldSprite) this.shieldSprite.setAlpha(0.3);
        });
      }
    }

    // Apply remaining damage to health
    if (damage > 0) {
      this.health -= damage;
      if (this.health < 0) this.health = 0;

      // Enhanced visual feedback
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(150, () => {
        this.sprite.clearTint();
      });

      // Screen shake for player
      if (this.isPlayer) {
        this.scene.cameras.main.shake(300, 0.02);
        this.scene.cameras.main.flash(100, 255, 255, 255);
      }

      // Damage particles disabled for performance
      // if (this.damageParticles) {
      //   this.damageParticles.setPosition(this.sprite.x, this.sprite.y);
      //   this.damageParticles.explode(8);
      // }

      // Reset combo on taking damage
      if (this.isPlayer) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }
  }

  private setupCollisions() {
    // This will be expanded when we add collision detection
    // between bullets and players
  }

  getBullets() {
    return this.bullets;
  }
}