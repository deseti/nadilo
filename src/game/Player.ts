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
        this.sprite.setScale(0.6); // Slightly larger for better visibility
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

    // Create enhanced bullet texture
    const bulletColor = this.isPlayer ? (this.avatarData?.color || 0x00ff88) : 0xff4444;
    this.createAdvancedBulletTexture(bulletColor, type);

    // Create enhanced particle effects for player
    if (this.isPlayer) {
      this.createAdvancedParticleEffects();
    }

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

  private createAdvancedBulletTexture(color: number, type: string) {
    const bulletGraphics = this.scene.add.graphics();
    
    if (this.isPlayer) {
      // Enhanced energy bolt with glow
      bulletGraphics.fillStyle(color);
      bulletGraphics.fillEllipse(0, 0, 4, 12);
      
      // Inner core
      bulletGraphics.fillStyle(0xffffff);
      bulletGraphics.fillEllipse(0, 0, 2, 8);
      
      // Outer glow
      bulletGraphics.fillStyle(color, 0.3);
      bulletGraphics.fillEllipse(0, 0, 8, 16);
      
      // Energy particles
      for (let i = 0; i < 3; i++) {
        bulletGraphics.fillStyle(0xffffff, 0.6);
        bulletGraphics.fillCircle(
          Phaser.Math.Between(-2, 2), 
          Phaser.Math.Between(-4, 4), 
          1
        );
      }
    } else {
      // Enemy plasma bolt
      bulletGraphics.fillStyle(color);
      bulletGraphics.fillCircle(0, 0, 4);
      
      // Trailing effect
      bulletGraphics.fillStyle(color, 0.6);
      bulletGraphics.fillEllipse(0, 2, 3, 6);
      
      // Core
      bulletGraphics.fillStyle(0xff8888);
      bulletGraphics.fillCircle(0, 0, 2);
    }
    
    bulletGraphics.generateTexture('bullet_' + type + '_advanced', 16, 20);
    bulletGraphics.destroy();
  }

  private createAdvancedParticleEffects() {
    // Create enhanced particle textures
    const thrusterGraphics = this.scene.add.graphics();
    thrusterGraphics.fillStyle(0x00aaff);
    thrusterGraphics.fillCircle(0, 0, 3);
    thrusterGraphics.generateTexture('thruster_particle_advanced', 6, 6);
    thrusterGraphics.destroy();

    const afterburnerGraphics = this.scene.add.graphics();
    afterburnerGraphics.fillStyle(0xff6600);
    afterburnerGraphics.fillCircle(0, 0, 2);
    afterburnerGraphics.generateTexture('afterburner_particle', 4, 4);
    afterburnerGraphics.destroy();

    const damageGraphics = this.scene.add.graphics();
    damageGraphics.fillStyle(0xff0000);
    damageGraphics.fillCircle(0, 0, 2);
    damageGraphics.generateTexture('damage_particle', 4, 4);
    damageGraphics.destroy();

    // Enhanced thruster particles
    this.thrusterParticles = this.scene.add.particles(0, 0, 'thruster_particle_advanced', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.8, end: 0 },
      lifespan: 300,
      alpha: { start: 0.9, end: 0 },
      tint: [0x00aaff, 0x0088ff, 0x0066ff, 0x88ddff],
      emitting: false,
      frequency: 20
    });

    // Afterburner effect for speed boost
    this.afterburnerParticles = this.scene.add.particles(0, 0, 'afterburner_particle', {
      speed: { min: 50, max: 120 },
      scale: { start: 1.2, end: 0 },
      lifespan: 400,
      alpha: { start: 1, end: 0 },
      tint: [0xff6600, 0xff8800, 0xffaa00, 0xff4400],
      emitting: false,
      frequency: 15
    });

    // Damage particles
    this.damageParticles = this.scene.add.particles(0, 0, 'damage_particle', {
      speed: { min: 20, max: 60 },
      scale: { start: 0.6, end: 0 },
      lifespan: 500,
      alpha: { start: 0.8, end: 0 },
      tint: [0xff0000, 0xff4444, 0xff8888],
      emitting: false,
      quantity: 5
    });
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

    // Enhanced particle effects
    this.updateParticleEffects(isMoving);

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

    // Update shield visual with enhanced effects
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

    // Health regeneration when not taking damage (optional feature)
    if (this.health < this.maxHealth && currentTime % 5000 < 16) {
      this.health = Math.min(this.maxHealth, this.health + 1);
    }
  }

  private performDash() {
    this.isDashing = true;
    this.dashDuration = 200; // 200ms dash
    this.dashCooldown = 1000; // 1 second cooldown
    
    // Visual effects
    this.sprite.setAlpha(0.6);
    
    // Create dash trail effect
    const dashTrail = this.scene.add.graphics();
    dashTrail.lineStyle(4, this.avatarData?.color || 0x00ff88, 0.8);
    
    const startX = this.sprite.x;
    const startY = this.sprite.y;
    
    // Create trailing effect
    this.scene.time.addEvent({
      delay: 20,
      repeat: 10,
      callback: () => {
        if (dashTrail && dashTrail.active) {
          dashTrail.lineBetween(startX, startY, this.sprite.x, this.sprite.y);
        }
      }
    });
    
    // Remove trail after dash
    this.scene.time.delayedCall(300, () => {
      if (dashTrail) dashTrail.destroy();
    });
    
    // Screen effect
    this.scene.cameras.main.flash(100, 255, 255, 255, false, 0.1);
  }

  private updateParticleEffects(isMoving: boolean) {
    const thrusterOffset = 20;
    const angle = this.sprite.rotation - Math.PI / 2;
    
    if (this.thrusterParticles) {
      const thrusterX = this.sprite.x - Math.cos(angle) * thrusterOffset;
      const thrusterY = this.sprite.y - Math.sin(angle) * thrusterOffset;
      
      this.thrusterParticles.setPosition(thrusterX, thrusterY);
      this.thrusterParticles.emitting = isMoving;
      
      if (isMoving) {
        const particleAngle = (this.sprite.rotation + Math.PI) * (180 / Math.PI);
        this.thrusterParticles.setConfig({
          angle: { min: particleAngle - 15, max: particleAngle + 15 }
        });
      }
    }

    if (this.afterburnerParticles) {
      const afterburnerX = this.sprite.x - Math.cos(angle) * (thrusterOffset + 5);
      const afterburnerY = this.sprite.y - Math.sin(angle) * (thrusterOffset + 5);
      
      this.afterburnerParticles.setPosition(afterburnerX, afterburnerY);
      this.afterburnerParticles.emitting = this.speedBoostActive && isMoving;
      
      if (this.speedBoostActive && isMoving) {
        const particleAngle = (this.sprite.rotation + Math.PI) * (180 / Math.PI);
        this.afterburnerParticles.setConfig({
          angle: { min: particleAngle - 20, max: particleAngle + 20 }
        });
      }
    }
  }

  private updateAdvancedShieldVisual() {
    if (this.shield > 0) {
      if (!this.shieldSprite) {
        this.shieldSprite = this.scene.add.circle(this.sprite.x, this.sprite.y, 30, 0x00aaff, 0.2);
        this.shieldSprite.setStrokeStyle(3, 0x00aaff, 0.9);
      }
      
      this.shieldSprite.setPosition(this.sprite.x, this.sprite.y);
      
      // Enhanced pulse effect with shield strength indication
      const shieldStrength = this.shield / 100; // Assuming max shield is 100
      const pulseScale = 1 + Math.sin(this.scene.time.now * 0.008) * (0.1 + shieldStrength * 0.1);
      const pulseAlpha = 0.2 + Math.sin(this.scene.time.now * 0.006) * 0.1;
      
      this.shieldSprite.setScale(pulseScale);
      this.shieldSprite.setAlpha(pulseAlpha);
      
      // Change color based on shield strength
      const shieldColor = shieldStrength > 0.7 ? 0x00aaff : 
                         shieldStrength > 0.3 ? 0xffaa00 : 0xff4444;
      this.shieldSprite.setStrokeStyle(3, shieldColor, 0.9);
      
    } else if (this.shieldSprite) {
      // Shield breaking effect
      this.scene.tweens.add({
        targets: this.shieldSprite,
        alpha: 0,
        scale: 2,
        duration: 300,
        onComplete: () => {
          if (this.shieldSprite) {
            this.shieldSprite.destroy();
            this.shieldSprite = null;
          }
        }
      });
    }
  }

  private updateBullets() {
    this.bullets.children.entries.forEach((bullet) => {
      const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
      if (bulletSprite.active) {
        // Remove bullets that go off screen
        const margin = 50;
        if (bulletSprite.x < -margin || bulletSprite.x > 800 + margin || 
            bulletSprite.y < -margin || bulletSprite.y > 600 + margin) {
          bulletSprite.setActive(false);
          bulletSprite.setVisible(false);
        }
        
        // Add slight rotation to bullets for visual effect
        bulletSprite.rotation += 0.1;
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

      // Add bullet trail effect for player
      if (this.isPlayer) {
        this.createAdvancedBulletTrail(bullet);
      }

      // Add combo for rapid shooting
      if (this.isPlayer) {
        this.addCombo();
      }
    }

    this.lastShot = this.scene.time.now;

    // Enhanced muzzle flash effect
    this.createMuzzleFlash();
  }

  private createAdvancedBulletTrail(bullet: Phaser.Physics.Arcade.Sprite) {
    const trail = this.scene.add.graphics();
    const trailColor = this.avatarData?.color || 0x00ff88;
    
    const updateTrail = () => {
      if (!bullet.active) {
        trail.destroy();
        return;
      }
      
      trail.clear();
      
      // Multiple trail segments for enhanced effect
      const velocity = bullet.body!.velocity;
      const trailLength = 6;
      
      for (let j = 0; j < trailLength; j++) {
        const alpha = (trailLength - j) / trailLength * 0.8;
        const width = (trailLength - j) / trailLength * 3;
        
        trail.lineStyle(width, trailColor, alpha);
        
        const offsetX = -velocity.x * (j + 1) * 0.02;
        const offsetY = -velocity.y * (j + 1) * 0.02;
        
        trail.lineBetween(
          bullet.x + offsetX, 
          bullet.y + offsetY, 
          bullet.x + offsetX * 0.5, 
          bullet.y + offsetY * 0.5
        );
      }
    };

    this.scene.time.addEvent({
      delay: 16,
      callback: updateTrail,
      repeat: 50
    });
  }

  private addCombo() {
    this.combo++;
    this.comboTimer = this.comboDecayTime;
    
    // Visual feedback for combo
    if (this.combo > 1) {
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
        duration: 800,
        onComplete: () => comboText.destroy()
      });
    }
  }

  private createMuzzleFlash() {
    const muzzleFlash = this.scene.add.graphics();
    const flashColor = this.avatarData?.color || 0x00ff88;
    
    // Create muzzle flash at gun barrel position
    const angle = this.sprite.rotation - Math.PI / 2;
    const barrelLength = 25;
    const flashX = this.sprite.x + Math.cos(angle) * barrelLength;
    const flashY = this.sprite.y + Math.sin(angle) * barrelLength;
    
    muzzleFlash.fillStyle(flashColor, 0.8);
    muzzleFlash.fillCircle(flashX, flashY, 8);
    
    muzzleFlash.fillStyle(0xffffff, 0.6);
    muzzleFlash.fillCircle(flashX, flashY, 4);
    
    // Animate muzzle flash
    this.scene.tweens.add({
      targets: muzzleFlash,
      alpha: 0,
      scale: 2,
      duration: 100,
      onComplete: () => muzzleFlash.destroy()
    });
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
        this.scene.cameras.main.flash(50);
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
        this.scene.cameras.main.flash(100);
      }

      // Damage particles
      if (this.damageParticles) {
        this.damageParticles.setPosition(this.sprite.x, this.sprite.y);
        this.damageParticles.explode(8);
      }

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