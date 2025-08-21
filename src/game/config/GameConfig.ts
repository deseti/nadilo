// Game configuration constants
export const GAME_CONFIG = {
  // Screen dimensions
  SCREEN: {
    WIDTH: 800,
    HEIGHT: 600
  },

  // Game timing
  TIMING: {
    GAME_DURATION: 60, // seconds
    WAVE_START_DELAY: 3000, // milliseconds
    INVULNERABILITY_DURATION: 2000 // milliseconds after losing life
  },

  // Player configuration
  PLAYER: {
    DEFAULT_HEALTH: 100,
    DEFAULT_LIVES: 3,
    DEFAULT_SPEED: 200,
    DEFAULT_FIRE_RATE: 300,
    SCALE: 0.25 // Avatar scale
  },

  // Enemy configuration
  ENEMY: {
    SIZES: {
      BASIC: 25,
      FAST: 20,
      HEAVY: 30,
      SNIPER: 22
    },
    BASE_ENEMIES_PER_WAVE: 3,
    WAVE_MULTIPLIER: 1.5
  },

  // Scoring
  SCORING: {
    ENEMY_HIT: 50,
    WAVE_COMPLETION_BASE: 500,
    SURVIVAL_BONUS: 1000
  },

  // UI Colors
  COLORS: {
    SCORE: '#00ff88',
    HEALTH: '#ff4444',
    WAVE: '#4444ff',
    TIMER: '#ffaa00',
    LIVES: '#ff8844',
    POWER_UP: '#ffff44'
  }
};