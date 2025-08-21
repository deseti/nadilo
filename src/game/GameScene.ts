import Phaser from 'phaser';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { PowerUp } from './PowerUp';
// Import the LeaderboardService to communicate with our backend
import { LeaderboardService } from '../services/leaderboard';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private powerUps: PowerUp[] = [];
    private wasdKeys!: any;
    private score: number = 0;
    private wave: number = 1;
    private enemiesRemaining: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private healthText!: Phaser.GameObjects.Text;
    private waveText!: Phaser.GameObjects.Text;
    private powerUpText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;

    // Game state
    private startTime: number = 0;
    private isGameOver: boolean = false;
    private isPaused: boolean = false;

    // Timer system
    private gameTimeLimit: number = 60; // 60 seconds
    private remainingTime: number = 60;
    private gameTimer!: Phaser.Time.TimerEvent;

    // Wave system
    private waveStartDelay: number = 3000;
    private enemySpawnTimer!: Phaser.Time.TimerEvent;

    // Background elements
    private stars: Phaser.GameObjects.Graphics[] = [];
    private starSpeed: number = 1;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load avatar images in case they haven't been loaded yet
        if (!this.textures.exists('moyaki')) {
            this.load.image('moyaki', '/avatar/moyaki.png');
        }
        if (!this.textures.exists('molandak')) {
            this.load.image('molandak', '/avatar/molandak.png');
        }
        if (!this.textures.exists('chog')) {
            this.load.image('chog', '/avatar/chog.png');
        }
    }

    create() {
        // Check if avatar is selected - must select avatar first
        const selectedAvatar = this.registry.get('selectedAvatar');
        if (!selectedAvatar) {
            // If no avatar selected, return to avatar selection
            this.scene.start('AvatarSelectScene');
            return;
        }

        // Reset game state on create
        this.score = 0;
        this.wave = 1;
        this.enemiesRemaining = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.enemies = [];
        this.powerUps = [];
        this.remainingTime = this.gameTimeLimit;

        // Record the start time of the game session
        this.startTime = this.time.now;

        // Start the game timer
        this.startGameTimer();

        const { width, height } = this.cameras.main;

        // Create animated starfield background
        this.createStarfield();

        // Create arena boundaries
        this.createArena();

        // Create player
        this.player = new Player(this, width / 2, height / 2, 'player');

        // Setup collisions
        this.setupCollisions();

        // Setup input
        this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D,SPACE,ESC');

        // Setup mouse input for aiming and shooting
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Prevent shooting if the game is over or paused
            if (!this.isGameOver && !this.isPaused) {
                this.player.shoot(pointer.worldX, pointer.worldY);
            }
        });

        // UI Elements
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            color: '#00ff88'
        });

        this.healthText = this.add.text(16, 50, 'Health: 100', {
            fontSize: '24px',
            color: '#ff4444'
        });

        this.waveText = this.add.text(16, 84, 'Wave: 1', {
            fontSize: '24px',
            color: '#4444ff'
        });

        this.timerText = this.add.text(16, 118, 'Time: 60s', {
            fontSize: '24px',
            color: '#ffaa00'
        });

        this.powerUpText = this.add.text(width / 2, 50, '', {
            fontSize: '20px',
            color: '#ffff44'
        }).setOrigin(0.5);

        // Back to menu button
        this.add.rectangle(width - 80, 30, 120, 40, 0x444444)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('MenuScene');
            });

        this.add.text(width - 80, 30, 'MENU', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Start first wave
        this.startWave();
    }

    private createStarfield() {
        const { width, height } = this.cameras.main;
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1e);

        // Create animated stars
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            const star = this.add.graphics();
            star.fillStyle(0xffffff, alpha);
            star.fillCircle(x, y, size);
            this.stars.push(star);

            // Add twinkling effect
            this.tweens.add({
                targets: star,
                alpha: { from: alpha, to: alpha * 0.3 },
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    update() {
        // Stop updates if game is over
        if (this.isGameOver) return;

        // Handle pause
        if (this.wasdKeys.ESC.isDown) {
            this.togglePause();
        }

        if (this.isPaused) return;

        // Update starfield
        this.updateStarfield();

        // Update player
        this.player.update(this.wasdKeys, this.input.activePointer);

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.player);
        });

        // Update power-ups
        this.powerUps.forEach(powerUp => {
            // PowerUps don't need update currently, but this is here for future extensions
        });

        // Update UI
        this.updateUI();

        // Check wave completion
        if (this.enemies.length === 0 && this.enemiesRemaining === 0) {
            this.completeWave();
        }

        // Check game over condition
        if (this.player.health <= 0) {
            this.gameOver('health');
        }

        // Check if time is up
        if (this.remainingTime <= 0 && !this.isGameOver) {
            this.gameOver('time');
        }
    }

    private updateStarfield() {
        this.stars.forEach(star => {
            star.y += this.starSpeed;
            if (star.y > 600) {
                star.y = 0;
                star.x = Phaser.Math.Between(0, 800);
            }
        });
    }

    private updateUI() {
        this.scoreText.setText(`Score: ${this.score}`);
        this.healthText.setText(`Health: ${this.player.health}${this.player.shield > 0 ? ` (+${this.player.shield})` : ''}`);
        this.waveText.setText(`Wave: ${this.wave}`);

        // Update timer display with color coding
        if (this.remainingTime > 20) {
            this.timerText.setColor('#ffaa00');
        } else if (this.remainingTime > 10) {
            this.timerText.setColor('#ff6600');
        } else {
            this.timerText.setColor('#ff0000');
        }
        this.timerText.setText(`Time: ${this.remainingTime}s`);
    }

    private togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.pause();
            // Pause the game timer
            if (this.gameTimer) {
                this.gameTimer.paused = true;
            }
            this.add.text(400, 300, 'PAUSED\nPress ESC to continue', {
                fontSize: '32px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5).setDepth(100);
        } else {
            this.physics.resume();
            // Resume the game timer
            if (this.gameTimer) {
                this.gameTimer.paused = false;
            }
            // Remove pause text (you might want to keep a reference to it)
        }
    }

    private startWave() {
        this.waveText.setText(`WAVE ${this.wave} STARTING...`);

        // Calculate wave difficulty
        const baseEnemies = 3;
        const additionalEnemies = Math.floor(this.wave * 1.5);
        const totalEnemies = baseEnemies + additionalEnemies;

        this.enemiesRemaining = totalEnemies;

        // Start spawning enemies after delay
        this.time.delayedCall(this.waveStartDelay, () => {
            this.spawnWaveEnemies();
        });

        // Spawn power-ups occasionally
        if (this.wave % 2 === 0) {
            this.spawnPowerUp();
        }
    }

    private spawnWaveEnemies() {
        const enemiesToSpawn = Math.min(5, this.enemiesRemaining);

        for (let i = 0; i < enemiesToSpawn; i++) {
            this.time.delayedCall(i * 1000, () => {
                this.spawnRandomEnemy();
                this.enemiesRemaining--;
            });
        }

        // Continue spawning if there are more enemies
        if (this.enemiesRemaining > 0) {
            this.time.delayedCall(enemiesToSpawn * 1000 + 3000, () => {
                this.spawnWaveEnemies();
            });
        }
    }

    private spawnRandomEnemy() {
        const { width, height } = this.cameras.main;

        // Choose random spawn position at edge of screen
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch (side) {
            case 0: // Top
                x = Phaser.Math.Between(50, width - 50);
                y = 30;
                break;
            case 1: // Right
                x = width - 30;
                y = Phaser.Math.Between(50, height - 50);
                break;
            case 2: // Bottom
                x = Phaser.Math.Between(50, width - 50);
                y = height - 30;
                break;
            case 3: // Left
                x = 30;
                y = Phaser.Math.Between(50, height - 50);
                break;
            default:
                x = 100;
                y = 100;
        }

        // Choose enemy type based on wave
        const enemyType = this.chooseEnemyType();
        const enemy = new Enemy(this, x, y, enemyType);
        this.enemies.push(enemy);

        // Setup collisions for new enemy
        this.setupEnemyCollisions(enemy);
    }

    private chooseEnemyType() {
        const rand = Math.random();
        const waveMultiplier = Math.min(this.wave / 10, 1);

        if (this.wave === 1) {
            return {
                type: 'basic' as const,
                health: 50,
                speed: 100,
                damage: 15,
                fireRate: 1500,
                color: 0xff4444,
                size: 15,
                scoreValue: 100,
                behavior: 'aggressive' as const
            };
        }

        if (rand < 0.4) {
            return {
                type: 'basic' as const,
                health: 50 + this.wave * 10,
                speed: 100 + this.wave * 5,
                damage: 15 + this.wave * 2,
                fireRate: 1500 - this.wave * 50,
                color: 0xff4444,
                size: 15,
                scoreValue: 100,
                behavior: 'aggressive' as const
            };
        } else if (rand < 0.7) {
            return {
                type: 'fast' as const,
                health: 30 + this.wave * 5,
                speed: 150 + this.wave * 8,
                damage: 10 + this.wave,
                fireRate: 1000 - this.wave * 30,
                color: 0xffaa00,
                size: 12,
                scoreValue: 150,
                behavior: 'patrol' as const
            };
        } else if (rand < 0.9) {
            return {
                type: 'heavy' as const,
                health: 100 + this.wave * 20,
                speed: 60 + this.wave * 3,
                damage: 25 + this.wave * 3,
                fireRate: 2000 - this.wave * 60,
                color: 0x8844ff,
                size: 20,
                scoreValue: 200,
                behavior: 'defensive' as const
            };
        } else {
            return {
                type: 'sniper' as const,
                health: 40 + this.wave * 8,
                speed: 80 + this.wave * 4,
                damage: 30 + this.wave * 4,
                fireRate: 2500 - this.wave * 80,
                color: 0x44ffaa,
                size: 14,
                scoreValue: 250,
                behavior: 'snipe' as const
            };
        }
    }

    private spawnPowerUp() {
        const { width, height } = this.cameras.main;
        const x = Phaser.Math.Between(100, width - 100);
        const y = Phaser.Math.Between(100, height - 100);

        const powerUp = new PowerUp(this, x, y);
        this.powerUps.push(powerUp);

        // Setup collision with player
        this.physics.add.overlap(this.player.sprite, powerUp.sprite, () => {
            const message = powerUp.collect(this.player);
            if (message) {
                this.showPowerUpMessage(message);

                // Handle special power-ups
                if (message.includes('NUCLEAR')) {
                    PowerUp.handleNukeEffect(this, this.enemies, this.player);
                }
            }
            this.powerUps = this.powerUps.filter(p => p !== powerUp);
        });
    }

    private showPowerUpMessage(message: string) {
        this.powerUpText.setText(message);
        this.time.delayedCall(2000, () => {
            this.powerUpText.setText('');
        });
    }

    private completeWave() {
        this.wave++;
        this.addScore(500 * this.wave); // Wave completion bonus

        // Show wave complete message
        const { width, height } = this.cameras.main;
        const waveCompleteText = this.add.text(width / 2, height / 2, `WAVE ${this.wave - 1} COMPLETE!`, {
            fontSize: '32px',
            color: '#00ff88'
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            waveCompleteText.destroy();
            this.startWave();
        });
    }

    private createArena() {
        const { width, height } = this.cameras.main;
        const wallThickness = 20;
        const wallColor = 0x333333;

        // Create arena walls with glow effect
        const topWall = this.add.rectangle(width / 2, wallThickness / 2, width, wallThickness, wallColor);
        const bottomWall = this.add.rectangle(width / 2, height - wallThickness / 2, width, wallThickness, wallColor);
        const leftWall = this.add.rectangle(wallThickness / 2, height / 2, wallThickness, height, wallColor);
        const rightWall = this.add.rectangle(width - wallThickness / 2, height / 2, wallThickness, height, wallColor);

        // Add glow effect to walls
        [topWall, bottomWall, leftWall, rightWall].forEach(wall => {
            wall.setStrokeStyle(2, 0x00ff88, 0.8);
        });

        this.physics.world.setBounds(wallThickness, wallThickness, width - wallThickness * 2, height - wallThickness * 2);
    }

    public addScore(points: number) {
        this.score += points;

        // Disable floating score text to prevent lag
        // Floating text animations cause performance issues during combat
    }

    private setupCollisions() {
        // Player bullets vs enemies
        this.enemies.forEach(enemy => {
            this.setupEnemyCollisions(enemy);
        });
    }

    private setupEnemyCollisions(enemy: Enemy) {
        // Player bullets hit enemy - optimized collision
        this.physics.add.overlap(this.player.getBullets(), enemy.sprite, (bullet, enemySprite) => {
            const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
            
            // Prevent multiple collisions from same bullet
            if (!bulletSprite.active) return;
            
            bulletSprite.setActive(false);
            bulletSprite.setVisible(false);

            const destroyed = enemy.takeDamage(25);
            this.addScore(50);

            if (destroyed) {
                // Optimized enemy removal
                const index = this.enemies.indexOf(enemy);
                if (index > -1) {
                    this.enemies.splice(index, 1);
                }
                this.addScore(enemy.scoreValue);
            }
        });

        // Enemy bullets hit player
        this.physics.add.overlap(enemy.getBullets(), this.player.sprite, (bullet) => {
            const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
            bulletSprite.setActive(false).setVisible(false);
            this.player.takeDamage(enemy.damage);
        });

        // Enemy collision with player (ramming damage)
        this.physics.add.overlap(enemy.sprite, this.player.sprite, () => {
            this.player.takeDamage(10);
            enemy.takeDamage(20);
        });
    }

    private startGameTimer() {
        // Create a timer that counts down every second
        this.gameTimer = this.time.addEvent({
            delay: 1000, // 1 second
            callback: () => {
                this.remainingTime--;

                // Add warning effects when time is running low
                if (this.remainingTime <= 10 && this.remainingTime > 0) {
                    // Flash the timer text
                    this.tweens.add({
                        targets: this.timerText,
                        scaleX: 1.2,
                        scaleY: 1.2,
                        duration: 100,
                        yoyo: true,
                        ease: 'Power2'
                    });

                    // Play warning sound effect (if you have audio)
                    // this.sound.play('warning');
                }

                if (this.remainingTime <= 0) {
                    this.gameTimer.destroy();
                }
            },
            repeat: this.gameTimeLimit - 1 // Repeat for the duration of the game
        });
    }

    // *** MODIFIED ***: gameOver function now handles score submission and different end conditions
    private gameOver(reason: 'health' | 'time' = 'health') {
        // Set flag to prevent this function from running multiple times
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.physics.pause();

        // Stop the timer if it's still running
        if (this.gameTimer) {
            this.gameTimer.destroy();
        }

        // --- UI for Game Over screen ---
        this.add.rectangle(400, 300, 400, 250, 0x000000, 0.8).setDepth(1);

        // Different messages based on how the game ended
        const gameOverTitle = reason === 'time' ? 'TIME\'S UP!' : 'GAME OVER';
        const titleColor = reason === 'time' ? '#ffaa00' : '#ff4444';

        this.add.text(400, 230, gameOverTitle, { fontSize: '32px', color: titleColor }).setOrigin(0.5).setDepth(1);

        if (reason === 'time') {
            this.add.text(400, 270, 'You survived the full 60 seconds!', { fontSize: '18px', color: '#00ff88' }).setOrigin(0.5).setDepth(1);
            // Bonus points for surviving the full time
            this.addScore(1000);
        } else {
            this.add.text(400, 270, 'Your fighter was destroyed!', { fontSize: '18px', color: '#ff6666' }).setOrigin(0.5).setDepth(1);
        }

        this.add.text(400, 300, `Final Score: ${this.score}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setDepth(1);
        this.add.text(400, 325, `Waves Completed: ${this.wave - 1}`, { fontSize: '18px', color: '#cccccc' }).setOrigin(0.5).setDepth(1);

        const statusText = this.add.text(400, 360, 'Submitting score...', { fontSize: '18px', color: '#cccccc' }).setOrigin(0.5).setDepth(1);

        // --- Score Submission Logic ---
        // Retrieve the playerID and score callback from the game's registry
        const playerID = this.registry.get('playerID');
        const onScoreUpdate = this.registry.get('onScoreUpdate');

        // Calculate the game duration in seconds
        const gameDuration = Math.floor((this.time.now - this.startTime) / 1000);

        if (playerID) {
            // Submit to local database (existing logic)
            LeaderboardService.submitScore(playerID, this.score, gameDuration)
                .then(success => {
                    if (success) {
                        statusText.setText('Score Submitted to Local DB!').setColor('#00ff88');
                    } else {
                        statusText.setText('Local DB Submission Failed.').setColor('#ff4444');
                    }
                })
                .catch(() => {
                    statusText.setText('Error submitting to local DB.').setColor('#ff4444');
                })
                .finally(() => {
                    // Add a button to go back to the menu after submission attempt
                    const backButton = this.add.rectangle(400, 450, 150, 40, 0x00ff88).setInteractive().setDepth(1);
                    backButton.on('pointerdown', () => this.scene.start('MenuScene'));
                    this.add.text(400, 450, 'MAIN MENU', { fontSize: '18px', color: '#000000' }).setOrigin(0.5).setDepth(1);
                });

            // Call React callback for blockchain submission
            if (onScoreUpdate && typeof onScoreUpdate === 'function') {
                console.log('🚀 Calling React callback for auto blockchain submission...');
                setTimeout(() => {
                    onScoreUpdate(this.score, 1); // score, 1 transaction
                    statusText.setText('Auto-submitting to blockchain...').setColor('#676FFF');
                }, 1000);
            }
        } else {
            // Handle case where playerID is not found (e.g., for testing)
            statusText.setText('Could not find Player ID.').setColor('#ff4444');
            const backButton = this.add.rectangle(400, 450, 150, 40, 0x00ff88).setInteractive().setDepth(1);
            backButton.on('pointerdown', () => this.scene.start('MenuScene'));
            this.add.text(400, 450, 'MAIN MENU', { fontSize: '18px', color: '#000000' }).setOrigin(0.5).setDepth(1);
        }
    }
}