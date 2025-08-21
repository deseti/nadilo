import { GAME_CONFIG } from './GameConfig';

export interface EnemyTypeConfig {
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

export class EnemyTypeFactory {
  static createBasicEnemy(wave: number = 1): EnemyTypeConfig {
    return {
      type: 'basic',
      health: 50 + wave * 10,
      speed: 100 + wave * 5,
      damage: 15 + wave * 2,
      fireRate: Math.max(500, 1500 - wave * 50),
      color: 0xff4444,
      size: GAME_CONFIG.ENEMY.SIZES.BASIC,
      scoreValue: 100,
      behavior: 'aggressive'
    };
  }

  static createFastEnemy(wave: number = 1): EnemyTypeConfig {
    return {
      type: 'fast',
      health: 30 + wave * 5,
      speed: 150 + wave * 8,
      damage: 10 + wave,
      fireRate: Math.max(400, 1000 - wave * 30),
      color: 0xffaa00,
      size: GAME_CONFIG.ENEMY.SIZES.FAST,
      scoreValue: 150,
      behavior: 'patrol'
    };
  }

  static createHeavyEnemy(wave: number = 1): EnemyTypeConfig {
    return {
      type: 'heavy',
      health: 100 + wave * 20,
      speed: 60 + wave * 3,
      damage: 25 + wave * 3,
      fireRate: Math.max(800, 2000 - wave * 60),
      color: 0x8844ff,
      size: GAME_CONFIG.ENEMY.SIZES.HEAVY,
      scoreValue: 200,
      behavior: 'defensive'
    };
  }

  static createSniperEnemy(wave: number = 1): EnemyTypeConfig {
    return {
      type: 'sniper',
      health: 40 + wave * 8,
      speed: 80 + wave * 4,
      damage: 30 + wave * 4,
      fireRate: Math.max(1000, 2500 - wave * 80),
      color: 0x44ffaa,
      size: GAME_CONFIG.ENEMY.SIZES.SNIPER,
      scoreValue: 250,
      behavior: 'snipe'
    };
  }

  static getRandomEnemyType(wave: number): EnemyTypeConfig {
    const rand = Math.random();
    
    if (wave === 1) {
      return this.createBasicEnemy(wave);
    }
    
    if (rand < 0.4) {
      return this.createBasicEnemy(wave);
    } else if (rand < 0.7) {
      return this.createFastEnemy(wave);
    } else if (rand < 0.9) {
      return this.createHeavyEnemy(wave);
    } else {
      return this.createSniperEnemy(wave);
    }
  }
}