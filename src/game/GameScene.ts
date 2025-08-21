import Phaser from 'phaser';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { PowerUp } from './PowerUp';
import { LeaderboardService } from '../services/leaderboard';
import { GAME_CONFIG } from './config/GameConfig';
import { UIManager } from './managers/UIManager';
import { WaveManager } from './managers/WaveManager';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private powerUps: PowerUp[] = [];
    private wasdKeys!: any;
    private score: number = 0;

    // Managers
    private uiManager!: UIManager;
    private waveManager!: WaveManager;

    // Game state
    private startTime: number = 0;
    private isGameOver: boolean = false;
    private isPaused: boolean = false;
    private isWaveCompleting: boolean = false;

    // Wave system
    private enemies: Enemy[] = [];
    private enemiesRemaining: number = 0;
    private wave: number = 1;
    private waveStartDelay: number = GAME_CONFIG.TIMING.WAVE_START_DELAY;

    // UI elements
    private waveText!: Phaser.GameObjects.Text;
    private powerUpText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;

    // Timer system
    private gameTimeLimit: number = GAME_CONFIG.TIMING.GAME_DURATION;
    private remainingTime: number = GAME_CONFIG.TIMING.GAME_DURATION;
    private gameTimer!: Phaser.Time.TimerEvent;

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
        this.isGameOver = false;
        this.isPaused = false;
        this.isWaveCompleting = false;
        this.powerUps = [];
        this.enemies = [];
        this.enemiesRemaining = 0;
        this.wave = 1;
        this.remainingTime = this.gameTimeLimit;

        // Initialize managers
        this.uiManager = new UIManager(this);
        this.waveManager = new WaveManager(this);

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

        // Initialize UI text elements
        this.waveText = this.add.text(width / 2, height / 2, '', {
            fontSize: '32px',
            color: '#00ff88'
        }).setOrigin(0.5).setVisible(false);

        this.powerUpText = this.add.text(width / 2, 100, '', {
            fontSize: '24px',
            color: '#ffaa00'
        }).setOrigin(0.5);

        this.timerText = this.add.text(width - 20, 20, '', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(1, 0);

        // Create UI using UIManager
        this.uiManager.createMenuButton();

        // Start first wave
        this.wave = 1;
        this.waveManager.startWave(1);
    }

    private createStarfield() {
        const { width, height } = this.cameras.main;
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1e);

        // Create fewer stars for better performance
        for (let i = 0; i < 50; i++) { // Reduced from 150 to 50
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 2); // Smaller stars
            const alpha = Phaser.Math.FloatBetween(0.5, 1);

            const star = this.add.graphics();
            star.fillStyle(0xffffff, alpha);
            star.fillCircle(x, y, size);
            this.stars.push(star);

            // Disable twinkling effect to improve performance
            // Twinkling animations cause lag
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

        // Update starfield (reduced frequency)
        if (this.time.now % 3 === 0) { // Update every 3rd frame
            this.updateStarfield();
        }

        // Update player
        this.player.update(this.wasdKeys, this.input.activePointer);

        // Update enemies (optimized)
        const enemies = this.waveManager.getEnemies();
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].update(this.player);
        }

        // Manual collision detection (more efficient than Phaser's overlap)
        if (this.time.now % 3 === 0) { // Check collisions every 3rd frame
            this.checkCollisions();
        }

        // Update power-ups (simplified)
        // PowerUps don't need frequent updates

        // Update UI (reduced frequency)
        if (this.time.now % 5 === 0) { // Update every 5th frame
            this.updateUI();
        }

        // Check wave completion (much less frequent)
        if (this.time.now % 60 === 0) { // Check every 60th frame (once per second at 60fps)
            if (this.waveManager.isWaveComplete()) {
                this.completeWave();
            }
        }

        // Check game over condition - now using lives system
        if (this.player.isDead()) {
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
        this.uiManager.updateUI(
            this.player,
            this.score,
            this.waveManager.getCurrentWave(),
            this.remainingTime
        );
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



    // This method is now handled by WaveManager
    // Keeping for compatibility but functionality moved to WaveManager



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
                    PowerUp.handleNukeEffect(this, this.waveManager.getEnemies(), this.player);
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
        // Prevent multiple calls
        if (this.isWaveCompleting) return;
        this.isWaveCompleting = true;

        const currentWave = this.waveManager.getCurrentWave();
        this.addScore(500 * currentWave); // Wave completion bonus

        // Show simple wave complete message without animations
        const { width, height } = this.cameras.main;
        const waveCompleteText = this.add.text(width / 2, height / 2, `WAVE ${currentWave} COMPLETE!`, {
            fontSize: '32px',
            color: '#00ff88'
        }).setOrigin(0.5).setDepth(100);

        // Quick transition to next wave
        this.time.delayedCall(1000, () => { // Reduced from 2000 to 1000
            waveCompleteText.destroy();
            this.isWaveCompleting = false;
            this.waveManager.startWave(currentWave + 1);
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
        // Setup global collision groups instead of individual enemy collisions
        // This is more efficient than setting up collision for each enemy individually
        
        // We'll handle collisions in the update loop instead
        // to avoid creating too many collision objects
    }

    public setupEnemyCollisions(enemy: Enemy) {
        // Simplified collision setup - just add to collision groups
        // Actual collision detection is handled in checkCollisions method
    }

    private checkCollisions() {
        const enemies = this.waveManager.getEnemies();
        const playerBullets = this.player.getBullets().children.entries;
        const playerSprite = this.player.sprite;

        // Check player bullets vs enemies
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy.sprite.active) continue;

            // Check player bullets hitting enemy
            for (let j = 0; j < playerBullets.length; j++) {
                const bullet = playerBullets[j] as Phaser.Physics.Arcade.Sprite;
                if (!bullet.active) continue;

                if (this.checkDistance(bullet, enemy.sprite, 20)) {
                    bullet.setActive(false).setVisible(false);
                    const destroyed = enemy.takeDamage(25);
                    this.addScore(50);

                    if (destroyed) {
                        this.waveManager.removeEnemy(enemy);
                        this.addScore(enemy.scoreValue);
                        break; // Enemy destroyed, no need to check more bullets
                    }
                }
            }

            // Check enemy bullets hitting player
            const enemyBullets = enemy.getBullets().children.entries;
            for (let k = 0; k < enemyBullets.length; k++) {
                const bullet = enemyBullets[k] as Phaser.Physics.Arcade.Sprite;
                if (!bullet.active) continue;

                if (this.checkDistance(bullet, playerSprite, 25)) {
                    bullet.setActive(false).setVisible(false);
                    this.player.takeDamage(enemy.damage);
                }
            }

            // Check enemy ramming player
            if (this.checkDistance(enemy.sprite, playerSprite, 30)) {
                const currentTime = this.time.now;
                if (!enemy.lastRamDamage || currentTime - enemy.lastRamDamage > 1000) {
                    this.player.takeDamage(5);
                    enemy.takeDamage(20);
                    enemy.lastRamDamage = currentTime;
                }
            }
        }
    }

    private checkDistance(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject, maxDistance: number): boolean {
        const dx = (obj1 as any).x - (obj2 as any).x;
        const dy = (obj1 as any).y - (obj2 as any).y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < maxDistance;
    }

    private startGameTimer() {
        // Create a timer that counts down every second
        this.gameTimer = this.time.addEvent({
            delay: 1000, // 1 second
            callback: () => {
                this.remainingTime--;

                // Simplified warning effects to prevent lag
                if (this.remainingTime <= 10 && this.remainingTime > 0) {
                    // Simple color change instead of animation
                    this.timerText.setColor('#ff0000');
                } else {
                    this.timerText.setColor('#ffffff');
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
        this.add.text(400, 325, `Waves Completed: ${this.waveManager.getCurrentWave() - 1}`, { fontSize: '18px', color: '#cccccc' }).setOrigin(0.5).setDepth(1);

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