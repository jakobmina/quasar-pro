
import { PHYSICS, COLORS, EnemyType } from '../constants';
import { PowerUpType, MissionType, ShipModel } from '../types';

const PHI = (1 + Math.sqrt(5)) / 2;

export function getGoldenValue(n: number): number {
  return Math.cos(Math.PI * n) * Math.cos(Math.PI * PHI * n);
}

function drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, health: number, maxHealth: number, color: string) {
  if (health >= maxHealth || health <= 0) return;
  ctx.save();
  ctx.translate(x, y - r - 15);
  const width = r * 1.5;
  const height = 4;
  const progress = Math.max(0, health / maxHealth);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(-width / 2, 0, width, height);
  ctx.fillStyle = health < maxHealth * 0.3 ? '#ef4444' : color;
  ctx.fillRect(-width / 2, 0, width * progress, height);
  ctx.restore();
}

export class InfernalBeam {
  x: number; y: number; angle: number; duration: number = 0;
  maxDist: number = 1200; active: boolean = true;
  constructor(x: number, y: number, angle: number) {
    this.x = x; this.y = y; this.angle = angle;
  }
  update(x: number, y: number, angle: number) {
    this.x = x; this.y = y; this.angle = angle;
    this.duration += 1;
  }
  draw(ctx: CanvasRenderingContext2D) {
    const width = 2 + Math.min(40, this.duration * 0.5);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-this.angle);
    const grad = ctx.createLinearGradient(0, 0, this.maxDist, 0);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, '#f43f5e');
    grad.addColorStop(1, 'transparent');
    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.shadowBlur = width;
    ctx.shadowColor = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.maxDist, 0);
    ctx.stroke();

    // Core white beam
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = width * 0.3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(this.maxDist, 0); ctx.stroke();
    ctx.restore();
  }
}

export class Planet {
  x: number; y: number; r: number; color: string;
  constructor() {
    this.x = Math.random() * PHYSICS.WORLD_SIZE;
    this.y = Math.random() * PHYSICS.WORLD_SIZE;
    this.r = 300 + Math.random() * 600;
    this.color = ['#1e293b', '#0f172a', '#1e1b4b'][Math.floor(Math.random() * 3)];
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.translate(this.x, this.y);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r);
    grad.addColorStop(0, this.color); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

export class MatrixNode {
  x: number = PHYSICS.MATRIX_NODE_X;
  y: number = PHYSICS.MATRIX_NODE_Y;
  r: number = 600;
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.strokeStyle = COLORS.MATRIX_NODE;
    ctx.setLineDash([20, 20]);
    ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

export class Particle {
  x: number; y: number; xv: number; yv: number; life: number; color: string; decay: number; isData: boolean;
  constructor(x: number, y: number, color: string, atomize: boolean = false, isData: boolean = false) {
    this.x = x; this.y = y; this.color = color; this.isData = isData;
    const ang = Math.random() * Math.PI * 2;
    const speed = atomize ? 2 + Math.random() * 10 : 1 + Math.random() * 5;
    this.xv = Math.cos(ang) * speed; this.yv = Math.sin(ang) * speed;
    this.life = 1.0; this.decay = 0.02 + Math.random() * 0.03;
  }
  update() { this.x += this.xv; this.y += this.yv; this.life -= this.decay; return this.life > 0; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.globalAlpha = this.life; ctx.fillStyle = this.color;
    if (this.isData) {
      ctx.font = '8px monospace'; ctx.fillText(Math.random() > 0.5 ? '1' : '0', this.x, this.y);
    } else {
      ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

export class EnemyShip {
  x: number; y: number; r: number; angle: number; health: number; maxHealth: number;
  type: EnemyType; config: any; xv: number = 0; yv: number = 0; hitTimer: number = 0;
  constructor(x: number, y: number, type: EnemyType) {
    this.x = x; this.y = y; this.type = type; this.config = PHYSICS.ENEMY_CONFIGS[type];
    this.r = this.config.r; this.angle = Math.random() * Math.PI * 2;
    this.health = this.config.health; this.maxHealth = this.config.health;
  }
  update(px: number, py: number) {
    const dx = px - this.x; const dy = py - this.y;
    this.angle = Math.atan2(-dy, dx);
    this.xv = Math.cos(this.angle) * this.config.speed;
    this.yv = -Math.sin(this.angle) * this.config.speed;
    this.x += this.xv; this.y += this.yv;
    if (this.hitTimer > 0) this.hitTimer--;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(-this.angle);
    ctx.strokeStyle = this.hitTimer > 0 ? '#fff' : this.config.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(this.r * 2, 0); ctx.lineTo(-this.r, -this.r); ctx.lineTo(-this.r * 0.5, 0); ctx.lineTo(-this.r, this.r); ctx.closePath(); ctx.stroke();
    ctx.restore();
    drawHealthBar(ctx, this.x, this.y, this.r, this.health, this.maxHealth, this.config.color);
  }
}

export class KamikazeEnemy extends EnemyShip {
  constructor(x: number, y: number) {
    super(x, y, EnemyType.KAMIKAZE);
  }
  update(px: number, py: number) {
    super.update(px, py);
    // Oversteer slightly for erratic movement
    this.angle += Math.sin(Date.now() * 0.01) * 0.2;
  }
}

export class MotherShip extends EnemyShip {
  lastSpawn: number = 0;
  constructor(x: number, y: number) {
    super(x, y, EnemyType.MOTHERSHIP);
  }
  update(px: number, py: number) {
    super.update(px, py);
  }
  canSpawn() {
    const now = Date.now();
    if (now - this.lastSpawn > 4000) {
      this.lastSpawn = now;
      return true;
    }
    return false;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(-this.angle);
    ctx.strokeStyle = this.hitTimer > 0 ? '#fff' : this.config.color; ctx.lineWidth = 4;
    // Massive hexagonal fortress shape
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i;
      const x = Math.cos(a) * this.r;
      const y = Math.sin(a) * this.r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
    // Inner core
    ctx.beginPath(); ctx.arc(0, 0, this.r * 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    drawHealthBar(ctx, this.x, this.y, this.r, this.health, this.maxHealth, this.config.color);
  }
}

export class Ship {
  x: number; y: number; r: number = 12; angle: number = Math.PI / 2; xv: number = 0; yv: number = 0;
  color: string = '#0ea5e9'; hitTimer: number = 0;
  model: ShipModel;
  weaponColor: string;

  constructor(model: ShipModel = ShipModel.INTERCEPTOR, color: string = '#0ea5e9') {
    this.x = PHYSICS.WORLD_SIZE / 2; this.y = PHYSICS.WORLD_SIZE / 2;
    this.model = model;
    this.color = color;
    this.weaponColor = color;

    // Model specific attribute adjustments
    if (model === ShipModel.TITAN) this.r = 16;
    if (model === ShipModel.SPECTER) this.r = 10;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.hitTimer > 0) {
      this.hitTimer--;
      if (Math.floor(Date.now() / 50) % 2 === 0) return;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-this.angle);

    // Dynamic Weapon Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.weaponColor;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;

    switch (this.model) {
      case ShipModel.TITAN:
        // Heavy Hexagonal Tank
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          const r = i % 2 === 0 ? this.r : this.r * 0.8;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
        // Inner Shield Core
        ctx.fillStyle = `rgba(${parseInt(this.weaponColor.slice(1, 3), 16)}, ${parseInt(this.weaponColor.slice(3, 5), 16)}, ${parseInt(this.weaponColor.slice(5, 7), 16)}, 0.3)`;
        ctx.fill();
        // Turret indicator
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(this.r * 1.5, 0); ctx.stroke();
        break;

      case ShipModel.SPECTER:
        // Steering Stealth Needle
        ctx.beginPath();
        ctx.moveTo(this.r * 2.5, 0);
        ctx.lineTo(-this.r * 1.5, -this.r * 0.8);
        ctx.lineTo(-this.r * 0.5, 0);
        ctx.lineTo(-this.r * 1.5, this.r * 0.8);
        ctx.closePath();
        ctx.stroke();
        // Engine Glows
        ctx.fillStyle = this.weaponColor;
        ctx.beginPath(); ctx.arc(-this.r, -this.r * 0.4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-this.r, this.r * 0.4, 2, 0, Math.PI * 2); ctx.fill();
        break;

      case ShipModel.VORTEX:
        // Rotating Rings
        const rot = Date.now() * 0.005;
        // Outer Ring
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.stroke();
        // Inner Rotating Geometry
        ctx.save();
        ctx.rotate(rot);
        ctx.strokeStyle = this.weaponColor;
        ctx.beginPath(); ctx.moveTo(this.r, 0); ctx.lineTo(-this.r, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, this.r); ctx.lineTo(0, -this.r); ctx.stroke();
        ctx.restore();
        // Core
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        break;

      case ShipModel.INTERCEPTOR:
      default:
        // Classic Agile Fighter
        ctx.beginPath();
        ctx.moveTo(this.r * 2.5, 0);
        ctx.lineTo(-this.r, -this.r);
        ctx.lineTo(-this.r * 0.5, 0);
        ctx.lineTo(-this.r, this.r);
        ctx.closePath();
        ctx.stroke();
        // Weapon hardpoint visuals
        ctx.fillStyle = this.weaponColor;
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        break;
    }

    ctx.restore();
  }
}

export class Laser {
  x: number; y: number; xv: number; yv: number; color: string; damage: number; life: number = 1.0;
  constructor(x: number, y: number, angle: number, color: string, damage: number) {
    this.x = x; this.y = y; this.color = color; this.damage = damage;
    const speed = 25;
    this.xv = Math.cos(angle) * speed; this.yv = -Math.sin(angle) * speed;
  }
  update() { this.x += this.xv; this.y += this.yv; this.life -= 0.02; return this.life > 0; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.strokeStyle = this.color; ctx.lineWidth = 3; ctx.globalAlpha = this.life;
    ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x - this.xv * 0.3, this.y - this.yv * 0.3); ctx.stroke();
    ctx.restore();
  }
}

export class SingularityWave {
  x: number; y: number; r: number = 0; life: number = 1.0;
  constructor(x: number, y: number) { this.x = x; this.y = y; }
  update() { this.r += 35; this.life -= 0.015; return this.life > 0; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 15; ctx.globalAlpha = this.life;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

export class SpaceDebris {
  x: number; y: number; r: number = 30; health: number = 20; maxHealth: number = 20;
  constructor() { this.x = Math.random() * 12000; this.y = Math.random() * 12000; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.strokeStyle = '#475569'; ctx.strokeRect(this.x - 15, this.y - 15, 30, 30); ctx.restore();
    drawHealthBar(ctx, this.x, this.y, this.r, this.health, this.maxHealth, '#475569');
  }
}

export class ResourceShard {
  x: number; y: number; xv: number; yv: number;
  constructor(x: number, y: number) { this.x = x; this.y = y; this.xv = (Math.random() - 0.5) * 12; this.yv = (Math.random() - 0.5) * 12; }
  update() { this.x += this.xv; this.y += this.yv; this.xv *= 0.96; this.yv *= 0.96; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Date.now() * 0.01);
    ctx.fillStyle = '#22c55e';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#22c55e';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }
}

export class Megastructure {
  x: number; y: number; r: number = 200; health: number = 500;
  constructor() { this.x = Math.random() * 12000; this.y = Math.random() * 12000; }
  draw(ctx: CanvasRenderingContext2D) { ctx.strokeStyle = '#1e293b'; ctx.strokeRect(this.x - 200, this.y - 200, 400, 400); drawHealthBar(ctx, this.x, this.y, this.r, this.health, 500, '#1e293b'); }
}

export class CrystalStructure {
  x: number; y: number; r: number = 80; health: number = 100;
  constructor() { this.x = Math.random() * 12000; this.y = Math.random() * 12000; }
  draw(ctx: CanvasRenderingContext2D) { ctx.strokeStyle = '#22c55e'; ctx.strokeRect(this.x - 80, this.y - 80, 160, 160); drawHealthBar(ctx, this.x, this.y, this.r, this.health, 100, '#22c55e'); }
}

export class CompanionShip {
  x: number; y: number;
  update(px: number, py: number) {
    this.x = px + Math.cos(Date.now() * 0.002) * 120;
    this.y = py + Math.sin(Date.now() * 0.002) * 120;
  }
  draw(ctx: CanvasRenderingContext2D) { ctx.strokeStyle = '#10b981'; ctx.strokeRect(this.x - 5, this.y - 5, 10, 10); }
}

export class PowerUpItem {
  x: number; y: number; type: PowerUpType; r: number = 15;
  constructor(x: number, y: number, type: PowerUpType) { this.x = x; this.y = y; this.type = type; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '10px monospace';
    ctx.fillStyle = '#a855f7';
    ctx.textAlign = 'center';
    ctx.fillText(this.type.charAt(0), 0, 4);
    ctx.restore();
  }
}

export class GoldenHub {
  x: number; y: number; index: number; r: number = 1000;
  treasures: PowerUpItem[] = [];
  lifeParticles: Particle[] = [];

  constructor(n: number) {
    this.index = n;
    const val = getGoldenValue(n);
    // Use n and val to determine "pseudorandom" fixed coordinates
    this.x = (Math.sin(n) * 0.5 + 0.5) * PHYSICS.WORLD_SIZE;
    this.y = (Math.cos(n * PHI) * 0.5 + 0.5) * PHYSICS.WORLD_SIZE;

    // Spawn some treasures
    for (let i = 0; i < 3; i++) {
      const tx = this.x + (Math.random() - 0.5) * 400;
      const ty = this.y + (Math.random() - 0.5) * 400;
      this.treasures.push(new PowerUpItem(tx, ty, PowerUpType.QUANTUM_CORE));
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Aesthetic quasiperiodic ring
    const val = getGoldenValue(this.index);
    ctx.strokeStyle = `rgba(234, 179, 8, ${0.2 + val * 0.3})`;
    ctx.lineWidth = 5;
    ctx.setLineDash([30, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, this.r * (0.8 + val * 0.2), 0, Math.PI * 2);
    ctx.stroke();

    // Life energy
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    this.treasures.forEach(t => t.draw(ctx));
  }
}
