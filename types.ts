
export interface Vector {
  x: number;
  y: number;
}

export enum GameStatus {
  INITIAL = 'INITIAL',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD'
}

export enum MissionType {
  EXPLORE = 'EXPLORE',
  ELIMINATE_MOTHERSHIP = 'ELIMINATE_MOTHERSHIP',
  RESCUE_AETHER = 'RESCUE_AETHER',
  STABILIZE_HUB = 'STABILIZE_HUB'
}

export enum WeaponType {
  LASER = 'LASER',
  SHOTGUN = 'SHOTGUN',
  MACHINE_GUN = 'MACHINE_GUN',
  INFERNAL_RAY = 'INFERNAL_RAY'
}

export enum ShipModel {
  INTERCEPTOR = 'INTERCEPTOR',
  TITAN = 'TITAN',
  SPECTER = 'SPECTER',
  VORTEX = 'VORTEX',
  EXPLORER = 'EXPLORER',
  TANK = 'TANK',
  MOTHERSHIP = 'MOTHERSHIP'
}

export interface ShipConfig {
  id: string;
  model: ShipModel;
  name?: string;
  color: string;
  thrust: number;
  healthBonus: number;
  defense: number;
  attackPower: number;
  isCustom?: boolean;
}

export enum PowerUpType {
  WEAPON_UPGRADE = 'WEAPON_UPGRADE',
  EXTRA_LIFE = 'EXTRA_LIFE',
  SHIELD_REGEN = 'SHIELD_REGEN',
  CARGO_EXPANSION = 'CARGO_EXPANSION',
  QUANTUM_CORE = 'QUANTUM_CORE'
}

export interface CalibrationSettings {
  thrustSensitivity: number;
  turnSensitivity: number;
  gravitationalForce: number;
  speedFactor: number;
}

export interface SimulationState {
  score: number;
  lives: number;
  status: GameStatus;
  difficulty: Difficulty;
  weapon: WeaponType;
  shipModel: ShipModel;
  selectedShipConfig?: ShipConfig;
  weaponLevel: number;
  droneLevel: number;
  upgradePoints: number;
  aiIntegrity: number;
  maxIntegrity: number;
  corruptionLevel: number;
  specialCharge: number;
  calibration: CalibrationSettings;
  messages: string[];
  explorationDistance: number;
  currentMission?: {
    type: MissionType;
    title: string;
    description: string;
    targetIndex: number;
    progress: number;
    goal: number;
  };
  username?: string;
  infernalRayTemperature: number;
  gameMode: 'STORY' | 'OPEN_WORLD';
}
