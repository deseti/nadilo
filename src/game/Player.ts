import Phaser from 'phaser';
import type { AvatarData } from './AvatarSelectScene';

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public health: number = 100;
  public maxHealth: number = 100;
  public lives: number = 3; // Add lives system
  public maxLives: number = 3;
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
  
  // Health bar visual elements
  private healthBarBg: Phaser.GameObjects.Rectangle | null = null;
  private healthBarFill: Phaser.GameObjects.Rectangle | null = null;
  private livesDisplay: Phaser.GameObjects.Text | null = null;

  // Enhanced features
  public combo: number = 0;
  public comboTimer: number = 0;
  public comboDecayTime: number = 3000; // 3 seconds
  private lastMovement: { x: number, y: number } = { x: 0, y: 0 };
  private dashCooldown: number = 0;
  private dashDuration: number = 0;
  private isDashing: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, avatarId: string) {
    this.scene = scene;
    this.isPlayer = true; // Always player in this context

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

    // Create sprite with selected avatar
    if (this.avatarData && scene.textures.exists(avatarId)) {
      this.sprite = scene.physics.add.sprite(x, y, avatarId);
      this.sprite.setScale(0.25); // Appropriate size for gameplay
    } else {
      // Fallback to created texture
      this.sprite = scene.physics.add.sprite(x, y, '');
      const color = this.avatarData?.color || 0x00ff88;
      this.createAdvancedFighterTexture(color, 'player');
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
    const bulletColor = this.avatarData?.color || 0x00ff88;
    this.createSimpleBulletTexture(bulletColor, 'player');

    // Particle effects disabled for maximum performance
    // if (this.isPlayer) {
    //   this.createAdvancedParticleEffects();
    // }

    // Setup collisions
    this.setupCollisions();
    
    // Create health bar for player
    if (this.isPlayer) {
      this.createHealthBar();
    }
  }

  private createAdvancedFighterTexture(color: number, type: string) {
    const graphics = this.scene.add.graphics();

    if (this.isPlayer && this.avatarData) {
      // Create smaller, simpler fighter jet for better performance
      const avatarName = this.avatarData.id.toLowerCase();

      // Smaller base fighter body
      graphics.fillStyle(color);
      graphics.beginPath();
      graphics.moveTo(0, -15); // nose (smaller)
      graphics.lineTo(-4, -8); // left nose wing
      graphics.lineTo(-8, -4); // left main wing back
      graphics.lineTo(-10, 0); // left wing tip
      graphics.lineTo(-8, 4); // left wing front
      graphics.lineTo(-4, 8); // left rear wing
      graphics.lineTo(-2, 12); // left exhaust
      graphics.lineTo(0, 10); // center back
      graphics.lineTo(2, 12); // right exhaust
      graphics.lineTo(4, 8); // right rear wing
      graphics.lineTo(8, 4); // right wing front
      graphics.lineTo(10, 0); // right wing tip
      graphics.lineTo(8, -4); // right main wing back
      graphics.lineTo(4, -8); // right nose wing
      graphics.closePath();
      graphics.fillPath();

      // Smaller cockpit
      graphics.fillStyle(0x222222);
      graphics.fillEllipse(0, -6, 4, 6);
      graphics.fillStyle(0x444444);
      graphics.fillEllipse(0, -6, 2, 4);

      // Smaller engine intakes
      graphics.fillStyle(0x111111);
      graphics.fillCircle(-4, 0, 1.5);
      graphics.fillCircle(4, 0, 1.5);

      // Simplified avatar-specific customizations
      graphics.fillStyle(0xffffff);
      if (avatarName.includes('moyaki')) {
        // Simple lightning mark
        graphics.fillRect(-1, -12, 2, 4);
      } else if (avatarName.includes('molandak')) {
        // Simple stealth mark
        graphics.fillStyle(0x00ff88);
        graphics.fillTriangle(0, -12, -2, -8, 2, -8);
      } else if (avatarName.includes('chog')) {
        // Simple armor mark
        graphics.fillStyle(0xffaa00);
        graphics.fillRect(-4, -2, 8, 2);
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

    graphics.generateTexture(type + '_advanced_fighter', 30, 30);
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

    // Update health bar
    this.updateHealthBar();

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

    // Reduce damage for better gameplay balance
    let actualDamage = Math.max(1, Math.floor(damage * 0.3)); // Reduce damage to 30%

    // Check shield
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, actualDamage);
      this.shield -= shieldDamage;
      actualDamage -= shieldDamage;

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
    if (actualDamage > 0) {
      this.health -= actualDamage;
      if (this.health < 0) this.health = 0;

      // Enhanced visual feedback
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(150, () => {
        this.sprite.clearTint();
      });

      // Screen shake for player (reduced intensity)
      if (this.isPlayer) {
        this.scene.cameras.main.shake(200, 0.01);
      }

      // Check if health is depleted
      if (this.health <= 0) {
        this.loseLife();
      }

      // Reset combo on taking damage
      if (this.isPlayer) {
        this.combo = 0;
        this.comboTimer = 0;
      }
    }
  }

  private loseLife() {
    if (this.lives > 0) {
      this.lives--;
      
      // Restore health when losing a life
      this.health = this.maxHealth;
      
      // Add temporary invulnerability
      this.addInvulnerability(2000); // 2 seconds of invulnerability
      
      // Visual feedback for life lost
      this.scene.cameras.main.flash(200, 255, 0, 0); // Red flash
      
      console.log(`Life lost! Lives remaining: ${this.lives}`);
    }
  }

  public isDead(): boolean {
    return this.lives <= 0 && this.health <= 0;
  }

  public destroy() {
    // Clean up health bar elements
    if (this.healthBarBg) {
      this.healthBarBg.destroy();
      this.healthBarBg = null;
    }
    if (this.healthBarFill) {
      this.healthBarFill.destroy();
      this.healthBarFill = null;
    }
    if (this.livesDisplay) {
      this.livesDisplay.destroy();
      this.livesDisplay = null;
    }
    
    // Clean up shield
    if (this.shieldSprite) {
      this.shieldSprite.destroy();
      this.shieldSprite = null;
    }
    
    // Clean up power-up timers
    this.powerUpTimers.forEach(timer => {
      if (timer) timer.destroy();
    });
    this.powerUpTimers = [];
  }

  private createHealthBar() {
    const barWidth = 60;
    const barHeight = 8;
    const barX = this.sprite.x;
    const barY = this.sprite.y - 35;

    // Health bar background
    this.healthBarBg = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x444444);
    this.healthBarBg.setDepth(10);

    // Health bar fill
    this.healthBarFill = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x00ff00);
    this.healthBarFill.setDepth(11);

    // Lives display
    this.livesDisplay = this.scene.add.text(barX, barY - 15, `♥ ${this.lives}`, {
      fontSize: '12px',
      color: '#ff4444'
    }).setOrigin(0.5).setDepth(12);
  }

  private updateHealthBar() {
    if (!this.healthBarBg || !this.healthBarFill || !this.livesDisplay) return;

    // Update position to follow player
    const barX = this.sprite.x;
    const barY = this.sprite.y - 35;

    this.healthBarBg.setPosition(barX, barY);
    this.healthBarFill.setPosition(barX, barY);
    this.livesDisplay.setPosition(barX, barY - 15);

    // Update health bar fill
    const healthPercent = this.health / this.maxHealth;
    const barWidth = 60;
    this.healthBarFill.setSize(barWidth * healthPercent, 8);

    // Change color based on health
    if (healthPercent > 0.6) {
      this.healthBarFill.setFillStyle(0x00ff00); // Green
    } else if (healthPercent > 0.3) {
      this.healthBarFill.setFillStyle(0xffaa00); // Orange
    } else {
      this.healthBarFill.setFillStyle(0xff0000); // Red
    }

    // Update lives display
    this.livesDisplay.setText(`♥ ${this.lives}`);

    // Hide health bar if player is dead
    if (this.isDead()) {
      this.healthBarBg.setVisible(false);
      this.healthBarFill.setVisible(false);
      this.livesDisplay.setVisible(false);
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