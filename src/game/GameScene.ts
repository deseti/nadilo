import Phaser from 'phaser';
import { Player } from './Player';
import { Token } from './Token';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies: Player[] = [];
    private tokens: Token[] = [];
    private wasdKeys!: any;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private healthText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f23);

        // Create arena boundaries
        this.createArena();

        // Create player
        this.player = new Player(this, width / 2, height / 2, 'player');

        // Create some AI enemies for now (will be replaced with real players later)
        this.createEnemies();

        // Create tokens scattered around the arena
        this.createTokens();

        // Setup collisions
        this.setupCollisions();

        // Setup input
        this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D');

        // Setup mouse input for aiming and shooting
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.player.shoot(pointer.worldX, pointer.worldY);
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
        // Update player
        this.player.update(this.wasdKeys, this.input.activePointer);

        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.updateAI(this.player);
        });

        // Update UI
        this.scoreText.setText(`Score: ${this.score}`);
        this.healthText.setText(`Health: ${this.player.health}`);

        // Check game over
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    private createArena() {
        const { width, height } = this.cameras.main;

        // Arena walls
        const wallThickness = 20;
        const wallColor = 0x333333;

        // Top wall
        this.add.rectangle(width / 2, wallThickness / 2, width, wallThickness, wallColor);
        // Bottom wall
        this.add.rectangle(width / 2, height - wallThickness / 2, width, wallThickness, wallColor);
        // Left wall
        this.add.rectangle(wallThickness / 2, height / 2, wallThickness, height, wallColor);
        // Right wall
        this.add.rectangle(width - wallThickness / 2, height / 2, wallThickness, height, wallColor);

        // Create physics boundaries
        this.physics.world.setBounds(wallThickness, wallThickness,
            width - wallThickness * 2, height - wallThickness * 2);
    }

    private createEnemies() {
        // Create 2 AI enemies for now
        const enemy1 = new Player(this, 150, 150, 'enemy');
        const enemy2 = new Player(this, 650, 450, 'enemy');

        this.enemies.push(enemy1, enemy2);
    }

    private createTokens() {
        // Create random tokens around the arena
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
        // Player bullets vs enemies
        this.enemies.forEach(enemy => {
            this.physics.add.overlap(
                this.player.getBullets(),
                enemy.sprite,
                (bullet, enemySprite) => {
                    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
                    bulletSprite.setActive(false);
                    bulletSprite.setVisible(false);
                    enemy.takeDamage(25);
                    this.addScore(50);

                    if (enemy.health <= 0) {
                        enemySprite.destroy();
                        this.enemies = this.enemies.filter(e => e !== enemy);
                        this.addScore(200);
                    }
                }
            );

            // Enemy bullets vs player
            this.physics.add.overlap(
                enemy.getBullets(),
                this.player.sprite,
                (bullet) => {
                    const bulletSprite = bullet as Phaser.Physics.Arcade.Sprite;
                    bulletSprite.setActive(false);
                    bulletSprite.setVisible(false);
                    this.player.takeDamage(20);
                }
            );
        });

        // Player vs tokens
        this.tokens.forEach(token => {
            this.physics.add.overlap(
                this.player.sprite,
                token.sprite,
                () => {
                    token.collect(this.player);
                    this.tokens = this.tokens.filter(t => t !== token);
                }
            );
        });
    }

    private gameOver() {
        this.add.rectangle(400, 300, 400, 200, 0x000000, 0.8);
        this.add.text(400, 250, 'GAME OVER', {
            fontSize: '32px',
            color: '#ff4444'
        }).setOrigin(0.5);

        this.add.text(400, 300, `Final Score: ${this.score}`, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.rectangle(400, 350, 150, 40, 0x00ff88)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.restart();
            });

        this.add.text(400, 350, 'RESTART', {
            fontSize: '18px',
            color: '#000000'
        }).setOrigin(0.5);

        this.physics.pause();
    }
}