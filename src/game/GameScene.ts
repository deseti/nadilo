import Phaser from 'phaser';
import { Player } from './Player';
import { Token } from './Token';
// Import the LeaderboardService to communicate with our backend
import { LeaderboardService } from '../services/leaderboard';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies: Player[] = [];
    private tokens: Token[] = [];
    private wasdKeys!: any;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private healthText!: Phaser.GameObjects.Text;

    // *** NEW ***: Add properties to track game duration and state
    private startTime: number = 0;
    private isGameOver: boolean = false;

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Reset game state on create
        this.score = 0;
        this.isGameOver = false;
        this.enemies = [];
        this.tokens = [];

        // *** NEW ***: Record the start time of the game session
        this.startTime = this.time.now;

        const { width, height } = this.cameras.main;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f23);

        // Create arena boundaries
        this.createArena();

        // Create player
        this.player = new Player(this, width / 2, height / 2, 'player');

        // Create some AI enemies
        this.createEnemies();

        // Create tokens scattered around the arena
        this.createTokens();

        // Setup collisions
        this.setupCollisions();

        // Setup input
        this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D');

        // Setup mouse input for aiming and shooting
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Prevent shooting if the game is over
            if (!this.isGameOver) {
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
    }

    update() {
        // Stop updates if game is over
        if (this.isGameOver) return;

        // Update player
        this.player.update(this.wasdKeys, this.input.activePointer);

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.updateAI(this.player);
        });

        // Update UI
        this.scoreText.setText(`Score: ${this.score}`);
        this.healthText.setText(`Health: ${this.player.health}`);

        // Check game over condition
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    private createArena() {
        const { width, height } = this.cameras.main;
        const wallThickness = 20;
        const wallColor = 0x333333;
        this.add.rectangle(width / 2, wallThickness / 2, width, wallThickness, wallColor);
        this.add.rectangle(width / 2, height - wallThickness / 2, width, wallThickness, wallColor);
        this.add.rectangle(wallThickness / 2, height / 2, wallThickness, height, wallColor);
        this.add.rectangle(width - wallThickness / 2, height / 2, wallThickness, height, wallColor);
        this.physics.world.setBounds(wallThickness, wallThickness, width - wallThickness * 2, height - wallThickness * 2);
    }

    private createEnemies() {
        const enemy1 = new Player(this, 150, 150, 'enemy');
        const enemy2 = new Player(this, 650, 450, 'enemy');
        this.enemies.push(enemy1, enemy2);
    }

    private createTokens() {
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 550);
            const token = new Token(this, x, y);
            this.tokens.push(token);
        }
    }

    public addScore(points: number) {
        this.score += points;
    }

    private setupCollisions() {
        this.enemies.forEach(enemy => {
            this.physics.add.overlap(this.player.getBullets(), enemy.sprite, (bullet, enemySprite) => {
                const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
                bulletSprite.setActive(false).setVisible(false);
                enemy.takeDamage(25);
                this.addScore(50);
                if (enemy.health <= 0) {
                    (enemySprite as Phaser.Physics.Arcade.Sprite).destroy();
                    this.enemies = this.enemies.filter(e => e !== enemy);
                    this.addScore(200);
                }
            });
            this.physics.add.overlap(enemy.getBullets(), this.player.sprite, (bullet) => {
                const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
                bulletSprite.setActive(false).setVisible(false);
                this.player.takeDamage(20);
            });
        });
        this.tokens.forEach(token => {
            this.physics.add.overlap(this.player.sprite, token.sprite, () => {
                token.collect(this.player);
                this.tokens = this.tokens.filter(t => t !== token);
            });
        });
    }

    // *** MODIFIED ***: gameOver function now handles score submission
    private gameOver() {
        // Set flag to prevent this function from running multiple times
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.physics.pause();

        // --- UI for Game Over screen ---
        this.add.rectangle(400, 300, 400, 200, 0x000000, 0.8).setDepth(1);
        this.add.text(400, 250, 'GAME OVER', { fontSize: '32px', color: '#ff4444' }).setOrigin(0.5).setDepth(1);
        this.add.text(400, 300, `Final Score: ${this.score}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5).setDepth(1);

        const statusText = this.add.text(400, 350, 'Submitting score...', { fontSize: '18px', color: '#cccccc' }).setOrigin(0.5).setDepth(1);

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
                    const backButton = this.add.rectangle(400, 420, 150, 40, 0x00ff88).setInteractive().setDepth(1);
                    backButton.on('pointerdown', () => this.scene.start('MenuScene'));
                    this.add.text(400, 420, 'MAIN MENU', { fontSize: '18px', color: '#000000' }).setOrigin(0.5).setDepth(1);
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
            const backButton = this.add.rectangle(400, 420, 150, 40, 0x00ff88).setInteractive().setDepth(1);
            backButton.on('pointerdown', () => this.scene.start('MenuScene'));
            this.add.text(400, 420, 'MAIN MENU', { fontSize: '18px', color: '#000000' }).setOrigin(0.5).setDepth(1);
        }
    }
}