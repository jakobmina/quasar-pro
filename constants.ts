
import { Difficulty, WeaponType, PowerUpType, ShipModel, ShipConfig } from './types';

export enum EnemyType {
  SCOUT = 'SCOUT',
  INTERCEPTOR = 'INTERCEPTOR',
  KAMIKAZE = 'KAMIKAZE',
  MOTHERSHIP = 'MOTHERSHIP'
}

export const SHIP_MODELS: Record<ShipModel, ShipConfig> = {
  [ShipModel.INTERCEPTOR]: { model: ShipModel.INTERCEPTOR, color: '#0ea5e9', thrust: 0.4, healthBonus: 0 },
  [ShipModel.TITAN]: { model: ShipModel.TITAN, color: '#10b981', thrust: 0.25, healthBonus: 50 },
  [ShipModel.SPECTER]: { model: ShipModel.SPECTER, color: '#a855f7', thrust: 0.55, healthBonus: -20 },
  [ShipModel.VORTEX]: { model: ShipModel.VORTEX, color: '#f59e0b', thrust: 0.35, healthBonus: 0 }
};

export const PHYSICS = {
  SHIP_TURN_SPEED: 0.08,
  SHIP_THRUST_LIMIT: 0.22,
  FRICTION: 0.985,
  WORLD_SIZE: 12000,
  INITIAL_LIVES: 5,
  MATRIX_NODE_X: 6000,
  MATRIX_NODE_Y: 6000,
  DEFAULT_ZOOM: 0.45,
  ENEMY_CONFIGS: {
    [EnemyType.SCOUT]: { speed: 3.5, health: 1, score: 250, color: '#94a3b8', r: 10 },
    [EnemyType.INTERCEPTOR]: { speed: 5.0, health: 3, score: 800, color: '#38bdf8', r: 15 },
    [EnemyType.KAMIKAZE]: { speed: 8.5, health: 1, score: 1200, color: '#facc15', r: 12 },
    [EnemyType.MOTHERSHIP]: { speed: 0.8, health: 80, score: 10000, color: '#f43f5e', r: 65 }
  },
  POWERUP_CONFIGS: {
    [PowerUpType.QUANTUM_CORE]: { color: '#a855f7', label: 'Q_CORE' }
  }
};

export const COLORS = {
  QUANTUM_BLUE: '#0ea5e9',
  VOID_DARK: '#020617',
  MATRIX_NODE: '#0ea5e9'
};

export const WEAPON_CONFIGS = {
  [WeaponType.LASER]: { color: '#0ea5e9', fireRate: 250, damage: 2, name: "Neural Laser" },
  [WeaponType.SHOTGUN]: { color: '#f43f5e', fireRate: 600, damage: 1.5, name: "Synapse Scatter" },
  [WeaponType.MACHINE_GUN]: { color: '#facc15', fireRate: 80, damage: 0.6, name: "Data Streamer" },
  [WeaponType.INFERNAL_RAY]: { color: '#fff', fireRate: 0, damage: 0.1, name: "Infernal Beam" }
};
