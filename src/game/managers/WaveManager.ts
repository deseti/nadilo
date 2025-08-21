import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { EnemyTypeFactory } from '../config/EnemyTypes';
import { Enemy } from '../Enemy';

export class WaveManager {
  private scene: any; // GameScene reference
  private currentWave: number = 1;
  private enemiesRemaining: number = 0;
  private enemies: Enemy[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  startWave(waveNumber: number): void {
    this.currentWave = waveNumber;
    
    // Show wave start message
    const { width, height } = this.scene.cameras.main;
    const waveText = this.scene.add.text(width / 2, height / 2, `WAVE ${waveNumber} STARTING...`, {
      fontSize: '32px',
      color: '#00ff88'
    }).setOrigin(0.5);

    // Remove wave text after delay
    this.scene.time.delayedCall(2000, () => {
      waveText.destroy();
    });

    // Calculate enemies for this wave
    const baseEnemies = GAME_CONFIG.ENEMY.BASE_ENEMIES_PER_WAVE;
    const additionalEnemies = Math.floor(waveNumber * GAME_CONFIG.ENEMY.WAVE_MULTIPLIER);
    const totalEnemies = baseEnemies + additionalEnemies;
    
    this.enemiesRemaining = totalEnemies;

    // Start spawning enemies after delay
    this.scene.time.delayedCall(GAME_CONFIG.TIMING.WAVE_START_DELAY, () => {
      this.spawnWaveEnemies();
    });
  }

  private spawnWaveEnemies(): void {
    const enemiesToSpawn = Math.min(5, this.enemiesRemaining);
    
    for (let i = 0; i < enemiesToSpawn; i++) {
      this.scene.time.delayedCall(i * 1000, () => {
        this.spawnRandomEnemy();
        this.enemiesRemaining--;
      });
    }

    // Continue spawning if there are more enemies
    if (this.enemiesRemaining > 0) {
      this.scene.time.delayedCall(enemiesToSpawn * 1000 + 3000, () => {
        this.spawnWaveEnemies();
      });
    }
  }

  private spawnRandomEnemy(): Enemy {
    const { width, height } = this.scene.cameras.main;
    
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

    // Create enemy with random type
    const enemyType = EnemyTypeFactory.getRandomEnemyType(this.currentWave);
    const enemy = new Enemy(this.scene, x, y, enemyType);
    this.enemies.push(enemy);
    
    // Setup collisions if the scene has the method
    if (this.scene.setupEnemyCollisions) {
      this.scene.setupEnemyCollisions(enemy);
    }
    
    // Return enemy for collision setup
    return enemy;
  }

  isWaveComplete(): boolean {
    return this.enemies.length === 0 && this.enemiesRemaining === 0;
  }

  removeEnemy(enemy: Enemy): void {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getLastSpawnedEnemy(): Enemy | null {
    return this.enemies[this.enemies.length - 1] || null;
  }
}