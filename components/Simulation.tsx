
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Ship, Laser, Particle, SingularityWave, CompanionShip, EnemyShip, Planet, MatrixNode, ResourceShard, CrystalStructure, Megastructure, SpaceDebris, PowerUpItem, InfernalBeam, GoldenHub, KamikazeEnemy, MotherShip, getGoldenValue, Blackhole } from '../services/physics';
import { GameStatus, SimulationState, WeaponType, ShipModel, MissionType } from '../types';
import { PHYSICS, COLORS, WEAPON_CONFIGS, EnemyType, SHIP_MODELS } from '../constants';
import { soundService } from '../services/sound';
import { TouchInput } from './TouchControls';

interface SimulationProps extends SimulationState {
  onStateUpdate: (state: Partial<SimulationState>) => void;
  onGameOver: () => void;
  touchInput?: TouchInput;
}

const Simulation: React.FC<SimulationProps> = ({
  status, weapon, weaponLevel, shipModel, selectedShipConfig, specialCharge, aiIntegrity, corruptionLevel,
  explorationDistance, currentMission, gameMode,
  onStateUpdate, onGameOver, calibration, touchInput
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const hitFlashRef = useRef<number>(0);

  const initialShipConfig = selectedShipConfig || SHIP_MODELS[shipModel];

  // Fondo estelar con profundidad (Paralaje)
  const stars = useMemo(() => Array.from({ length: 1500 }, () => ({
    x: Math.random() * PHYSICS.WORLD_SIZE,
    y: Math.random() * PHYSICS.WORLD_SIZE,
    size: 0.5 + Math.random() * 2,
    depth: 0.1 + Math.random() * 0.9,
    brightness: 0.2 + Math.random() * 0.8
  })), []);

  const entitiesRef = useRef<{
    ship: Ship;
    companion: CompanionShip;
    singularities: SingularityWave[];
    lasers: Laser[];
    infernalBeam: InfernalBeam | null;
    enemies: EnemyShip[];
    particles: Particle[];
    planets: Planet[];
    crystalStructures: CrystalStructure[];
    debris: SpaceDebris[];
    megastructures: Megastructure[];
    matrixNode: MatrixNode;

    resources: ResourceShard[];
    blackholes: Blackhole[];
    hubs: any[];
    camera: { x: number, y: number, zoom: number, shake: number };
    keys: Record<string, boolean>;
    lastMissionUpdate: number;

    // Object Pools
    laserPool: EntityPool<Laser>;
    particlePool: EntityPool<Particle>;
    enemyPool: EntityPool<EnemyShip>;
    shardPool: EntityPool<ResourceShard>;

    overheatTimer: number;
  }>({
    ship: new Ship(initialShipConfig),
    companion: new CompanionShip(),
    singularities: [],
    lasers: [],
    infernalBeam: null,
    enemies: [],
    particles: [],
    planets: Array.from({ length: 15 }, () => new Planet()),
    crystalStructures: Array.from({ length: 20 }, () => new CrystalStructure()),
    debris: Array.from({ length: 50 }, () => new SpaceDebris()),
    megastructures: Array.from({ length: 5 }, () => new Megastructure()),
    matrixNode: new MatrixNode(),
    resources: [],
    blackholes: [],
    hubs: [],
    camera: { x: PHYSICS.MATRIX_NODE_X, y: PHYSICS.MATRIX_NODE_Y, zoom: 0.45, shake: 0 },
    keys: {},
    lastMissionUpdate: 0,

    laserPool: new EntityPool((x, y) => new Laser(x, y, 0, '#fff', 1), 100),
    particlePool: new EntityPool((x, y) => new Particle(x, y, '#fff'), 500),
    enemyPool: new EntityPool((x, y) => new EnemyShip(x, y, EnemyType.DRONE), 50),
    shardPool: new EntityPool((x, y) => new ResourceShard(x, y), 50),

    overheatTimer: 0
  });

  const explodeEntity = useCallback((x: number, y: number, color: string, amount: number, isData: boolean = false) => {
    const { particles, particlePool } = entitiesRef.current;
    for (let i = 0; i < amount; i++) {
      const p = particlePool.get(x, y);
      p.color = color;
      p.isData = isData;
      p.life = 1.0;
      p.active = true;
      particles.push(p);
    }
    if (amount >= 30) soundService.playExplosion(amount > 45);
  }, []);

  const triggerQuantumPurge = useCallback(() => {
    const { ship, enemies } = entitiesRef.current;
    entitiesRef.current.singularities.push(new SingularityWave(ship.x, ship.y));
    soundService.playSpecial();
    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];
      if (Math.hypot(en.x - ship.x, en.y - ship.y) < 1500) {
        explodeEntity(en.x, en.y, '#fff', 40, true);
        onStateUpdate({ score: en.config.score });
        enemies.splice(i, 1);
      }
    }
    onStateUpdate({ specialCharge: -100, corruptionLevel: -30 });
    entitiesRef.current.camera.shake = 60;
  }, [explodeEntity, onStateUpdate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { entitiesRef.current.keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { entitiesRef.current.keys[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialization based on Mode
  useEffect(() => {
    const ent = entitiesRef.current;
    if (gameMode === 'OPEN_WORLD') {
      // Clear story entities
      ent.planets = [];
      ent.megastructures = [];

      // Generate Massive Open World
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 / 30) * i;
        const dist = 5000 + Math.random() * 15000;
        ent.megastructures.push(new Megastructure(
          ent.ship.x + Math.cos(angle) * dist,
          ent.ship.y + Math.sin(angle) * dist
        ));
      }
      // Generate Blackholes
      for (let i = 0; i < 5; i++) {
        const x1 = 5000 + Math.random() * 40000;
        const y1 = 5000 + Math.random() * 40000;
        const x2 = 5000 + Math.random() * 40000;
        const y2 = 5000 + Math.random() * 40000;
        ent.blackholes.push(new Blackhole(x1, y1, x2, y2));
        ent.blackholes.push(new Blackhole(x2, y2, x1, y1));
      }
    }
  }, [gameMode]);

  useEffect(() => {
    let frame: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 16.66;
      lastTime = now;

      const { ship, companion, singularities, lasers, infernalBeam, enemies, particles, planets, crystalStructures, debris, megastructures, matrixNode, resources, camera, keys, blackholes } = entitiesRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width = canvas.parentElement?.clientWidth || 0;
      const height = canvas.height = canvas.parentElement?.clientHeight || 0;

      if (status === GameStatus.PAUSED || status === GameStatus.GAME_OVER) {
        soundService.setThrust(false, shipModel);
        // Render basic scene without updating logic
        ctx.fillStyle = COLORS.VOID_DARK; ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);
        ctx.translate(-camera.x, -camera.y);
        planets.forEach(p => p.draw(ctx));
        entitiesRef.current.hubs.forEach(h => h.draw(ctx));
        matrixNode.draw(ctx);
        ship.draw(ctx);
        ctx.restore();

        ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
        ctx.fillRect(0, 0, width, height);
        frame = requestAnimationFrame(loop);
        return;
      }

      if (status === GameStatus.RUNNING) {
        // --- SYNC VISUALS ---
        ship.model = shipModel;
        ship.weaponColor = WEAPON_CONFIGS[weapon].color;
        // Sync radius/physics with visual model change if needed
        if (shipModel === ShipModel.TITAN) ship.r = 16;
        else if (shipModel === ShipModel.SPECTER) ship.r = 10;
        else ship.r = 12;

        // --- CONTROLES (CON REVERSA Y TOUCH) ---
        const config = SHIP_MODELS[shipModel];
        const thrust = config.thrust * calibration.thrustSensitivity;
        const turn = 0.08 * calibration.turnSensitivity;

        // Touch controls override keyboard when active
        const hasTouchThrust = touchInput && touchInput.thrust > 0.1;
        const isThrusting = hasTouchThrust || keys['KeyW'] || keys['ArrowUp'] || keys['KeyS'] || keys['ArrowDown'];
        soundService.setThrust(isThrusting, shipModel);

        if (hasTouchThrust) {
          // Joystick controls: angle directly from joystick, thrust proportional
          ship.angle = touchInput.angle;
          ship.xv += Math.cos(ship.angle) * thrust * touchInput.thrust;
          ship.yv -= Math.sin(ship.angle) * thrust * touchInput.thrust;
        } else {
          // Keyboard controls
          if (keys['KeyW'] || keys['ArrowUp']) {
            ship.xv += Math.cos(ship.angle) * thrust;
            ship.yv -= Math.sin(ship.angle) * thrust;
          }
          if (keys['KeyS'] || keys['ArrowDown']) {
            ship.xv -= Math.cos(ship.angle) * (thrust * 0.5); // Reversa al 50% de potencia
            ship.yv += Math.sin(ship.angle) * (thrust * 0.5);
          }
          if (keys['KeyA'] || keys['ArrowLeft']) ship.angle += turn;
          if (keys['KeyD'] || keys['ArrowRight']) ship.angle -= turn;
        }

        // --- MANEJO DE ARMAS (KEYBOARD + TOUCH) ---
        const nowMs = Date.now();
        const weap = WEAPON_CONFIGS[weapon];
        const isFiring = keys['Space'] || (touchInput && touchInput.fire);

        const { INFERNAL_RAY_CONFIG } = PHYSICS as any;
        if (entitiesRef.current.overheatTimer > 0) {
          entitiesRef.current.overheatTimer -= 16.6;
          entitiesRef.current.infernalBeam = null;
        }

        if (isFiring && entitiesRef.current.overheatTimer <= 0) {
          if (weapon === WeaponType.INFERNAL_RAY) {
            if (!entitiesRef.current.infernalBeam) {
              entitiesRef.current.infernalBeam = new InfernalBeam(ship.x, ship.y, ship.angle);
            } else {
              entitiesRef.current.infernalBeam.update(ship.x, ship.y, ship.angle);
            }

            const newTemp = Math.min(INFERNAL_RAY_CONFIG.MAX_TEMP, (onStateUpdate as any).infernalRayTemperature + INFERNAL_RAY_CONFIG.HEAT_UP_RATE);
            onStateUpdate({ infernalRayTemperature: newTemp });

            if (newTemp >= INFERNAL_RAY_CONFIG.MAX_TEMP) {
              entitiesRef.current.overheatTimer = INFERNAL_RAY_CONFIG.OVERHEAT_PENALTY;
              soundService.playDamage();
              entitiesRef.current.infernalBeam = null;
            } else {
              const beamDamage = weap.damage + (entitiesRef.current.infernalBeam.duration * 0.015);
              [...enemies, ...crystalStructures, ...debris, ...megastructures].forEach((target: any) => {
                const dx = target.x - ship.x;
                const dy = target.y - ship.y;
                const dist = Math.hypot(dx, dy);
                const angleToTarget = Math.atan2(-dy, dx);
                let angleDiff = Math.abs(angleToTarget - ship.angle);
                if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                if (dist < 1200 && angleDiff < 0.12) {
                  target.health -= beamDamage;
                  if (Math.random() > 0.8) explodeEntity(target.x, target.y, '#fff', 1, true);
                  if (target.health <= 0) {
                    if (target instanceof EnemyShip) {
                      onStateUpdate({ score: target.config.score, specialCharge: 2 });
                      enemies.splice(enemies.indexOf(target), 1);
                    }
                    explodeEntity(target.x, target.y, '#fff', 30, true);
                    camera.shake = 15;
                  }
                }
              });
            }
          } else {
            const fireRate = weap.fireRate / (1 + weaponLevel * 0.15);
            if (!ship['lastFired'] || nowMs - ship['lastFired'] > fireRate) {
              soundService.playShoot(weapon);
              const attackMult = ship.config.attackPower || 1;
              const totalDamage = (weap.damage + weaponLevel) * attackMult;

              const spawnLaser = (ang: number) => {
                const l = entitiesRef.current.laserPool.get(ship.x, ship.y);
                l.reset(ship.x, ship.y, ang, weap.color, totalDamage);
                lasers.push(l);
              };

              if (weapon === WeaponType.SHOTGUN) {
                for (let i = -2; i <= 2; i++) spawnLaser(ship.angle + (i * 0.18));
                camera.shake = 12;
              } else if (weapon === WeaponType.MACHINE_GUN) {
                spawnLaser(ship.angle + (Math.random() - 0.5) * 0.1);
                camera.shake = 2;
              } else {
                spawnLaser(ship.angle);
                camera.shake = 4;
              }
              ship['lastFired'] = nowMs;
            }
          }
        } else {
          entitiesRef.current.infernalBeam = null;
          if ((onStateUpdate as any).infernalRayTemperature > 0) {
            onStateUpdate({ infernalRayTemperature: Math.max(0, (onStateUpdate as any).infernalRayTemperature - INFERNAL_RAY_CONFIG.COOL_DOWN_RATE) });
          }
        }

        // Special Attack (Keyboard Q or Touch Special Button)
        const isSpecialPressed = keys['KeyQ'] || (touchInput && touchInput.special);
        if (isSpecialPressed && specialCharge >= 100) triggerQuantumPurge();

        ship.x += ship.xv; ship.y += ship.yv;
        ship.xv *= PHYSICS.FRICTION; ship.yv *= PHYSICS.FRICTION;

        let shipVel = Math.hypot(ship.xv, ship.yv);
        onStateUpdate({ explorationDistance: shipVel * 0.1 });

        camera.x += (ship.x - camera.x) * 0.1;
        camera.y += (ship.y - camera.y) * 0.1;

        // Open World Logic
        if (gameMode === 'OPEN_WORLD') {
          // Blackholes
          blackholes.forEach(bh => {
            // Gravity
            const dx = bh.x - ship.x, dy = bh.y - ship.y, dist = Math.hypot(dx, dy);
            if (dist > 100 && dist < 5000) {
              const f = (100000) / (dist * dist);
              ship.xv += (dx / dist) * f; ship.yv += (dy / dist) * f;
            }
            // Enhanced Warp Fold Mechanic
            if (bh.isInEventHorizon(ship.x, ship.y) && !ship['warping']) {
              ship['warping'] = true;
              soundService.playSpecial();
              onStateUpdate({ messages: ["CRITICAL: Warp Fold initiated. Re-mapping tensorial manifold..."] });

              // 1. Flush Pools (Visual & Logic)
              entitiesRef.current.enemies = [];
              entitiesRef.current.particles = [];
              entitiesRef.current.resources = [];
              entitiesRef.current.lasers = [];

              // 2. Warp Sequence (Loading Phase)
              let warpProgress = 0;
              const warpInterval = setInterval(() => {
                warpProgress += 0.05;
                camera.shake = 20 + warpProgress * 50;
                camera.zoom = 0.45 - (Math.sin(warpProgress * Math.PI) * 0.2);

                // Visual Warp doppler effect (handled in render loop via ship['warping'] state)

                if (warpProgress >= 1) {
                  clearInterval(warpInterval);

                  // 3. Compute Phase-Continuous Destination
                  const currentN = Math.floor(explorationDistance);
                  const currentO = getGoldenValue(currentN);

                  // Search for a distant K that has a similar phase O_k ≈ O_n
                  let targetK = currentN + 10000 + Math.floor(Math.random() * 50000);
                  for (let i = 0; i < 1000; i++) {
                    if (Math.abs(getGoldenValue(targetK + i) - currentO) < 0.05) {
                      targetK += i;
                      break;
                    }
                  }

                  // 4. Reload & Exit
                  ship.x = bh.targetX; ship.y = bh.targetY;
                  ship.xv = 0; ship.yv = 0;
                  onStateUpdate({
                    explorationDistance: targetK,
                    messages: [`WARP_COMPLETE: Destination K=${targetK} aligned. Phase preserved.`]
                  });

                  // Visual Shockwave on exit
                  triggerQuantumPurge();
                  setTimeout(() => { ship['warping'] = false; }, 500);
                }
              }, 100);
            }
            if (dist < 1000) bh.discovered = true;
          });

          // Megastructure Gravity
          megastructures.forEach(m => {
            const dx = m.x - ship.x, dy = m.y - ship.y, dist = Math.hypot(dx, dy);
            if (dist > 100 && dist < 2500) {
              const f = (50000) / (dist * dist);
              ship.xv += (dx / dist) * f; ship.yv += (dy / dist) * f;
            }
            if (dist < 2000 && !m.discovered) {
              m.discovered = true;
              onStateUpdate({ messages: [`DISCOVERY: ${m.type} Structure found.`] });
            }
          });
        }

        // --- MISSION CONTROLLER ---
        if (nowMs - entitiesRef.current.lastMissionUpdate > 1000) {
          entitiesRef.current.lastMissionUpdate = nowMs;
          if (currentMission && currentMission.type === MissionType.EXPLORE) {
            const progress = (explorationDistance / currentMission.goal) * 100;
            if (explorationDistance >= currentMission.goal) {
              onStateUpdate({
                messages: [`MISSION_COMPLETE: ${currentMission.title} `, "AETHER: You found a stable pocket."],
                currentMission: {
                  type: MissionType.STABILIZE_HUB,
                  title: "Hub Stabilization",
                  description: "Defend against the entropic surge near the Golden Hub.",
                  targetIndex: Math.floor(explorationDistance / 1000),
                  progress: 0,
                  goal: 5
                }
              });
              // Spawn a Golden Hub nearby
              const hubIdx = Math.floor(explorationDistance / 1000);
              entitiesRef.current.hubs.push(new GoldenHub(hubIdx));
            }
          }
        }

        if (camera.shake > 0) {
          camera.x += (Math.random() - 0.5) * camera.shake;
          camera.y += (Math.random() - 0.5) * camera.shake;
          camera.shake *= 0.92;
        }

        // --- RENDERIZADO ---
        ctx.fillStyle = COLORS.VOID_DARK; ctx.fillRect(0, 0, width, height);

        // Fondo Estelar Reactivo
        const goldenDensity = Math.abs(getGoldenValue(explorationDistance / 1000));
        stars.forEach((s, i) => {
          if (s.size < 1.0 && i % 10 > (goldenDensity * 5 + 5)) return;

          let sx = ((s.x - camera.x * s.depth) % width + width) % width;
          let sy = ((s.y - camera.y * s.depth) % height + height) % height;

          const opacity = s.brightness * (0.5 + goldenDensity * 0.5);
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

          const warpFactor = ship['warping'] ? 4.0 : (shipVel > 5 ? 1.0 : 0);
          if (warpFactor > 0) {
            const stretch = (ship['warping'] ? 400 : shipVel * 2.8) * s.depth * warpFactor;
            const ang = Math.atan2(ship.yv || 0.1, -(ship.xv || 0.1));
            ctx.strokeStyle = `rgba(135, 206, 235, ${opacity * (ship['warping'] ? 0.8 : 0.5)})`;
            ctx.lineWidth = s.size * (ship['warping'] ? 2 : 1);
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ang) * stretch, sy - Math.sin(ang) * stretch); ctx.stroke();
          } else {
            ctx.beginPath(); ctx.arc(sx, sy, s.size, 0, Math.PI * 2); ctx.fill();
          }
        });

        // Background Parallax Layers
        const layers = [
          { depth: 0.05, color: `rgba(14, 165, 233, ${0.05 + goldenDensity * 0.1})` },
          { depth: 0.15, color: `rgba(168, 85, 247, ${0.03 + goldenDensity * 0.05})` }
        ];
        layers.forEach(layer => {
          ctx.fillStyle = layer.color;
          for (let i = 0; i < 3; i++) {
            const ox = (i * 1000 - camera.x * layer.depth) % 2000;
            const oy = (i * 800 - camera.y * layer.depth) % 1600;
            ctx.beginPath();
            ctx.arc(ox + 1000, oy + 800, 400 + goldenDensity * 200, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.x, -camera.y);

        planets.forEach(p => p.draw(ctx));
        entitiesRef.current.hubs.forEach(h => h.draw(ctx));
        matrixNode.draw(ctx);
        crystalStructures.forEach(c => c.draw(ctx));
        debris.forEach(d => d.draw(ctx));
        megastructures.forEach(m => m.draw(ctx));
        blackholes.forEach(b => b.draw(ctx));

        resources.forEach((r, i) => {
          r.update(); r.draw(ctx);
          if (Math.hypot(r.x - ship.x, r.y - ship.y) < 80) {
            resources.splice(i, 1);
            const nextLevel = weaponLevel + (Math.random() > 0.7 ? 1 : 0);
            onStateUpdate({
              aiIntegrity: 4,
              corruptionLevel: -1.2,
              score: 150,
              weaponLevel: nextLevel
            });
            explodeEntity(ship.x, ship.y, '#22c55e', 10);
            soundService.playPickup();
            if (nextLevel > weaponLevel) {
              camera.shake = 30;
              explodeEntity(ship.x, ship.y, '#fff', 50, true);
            }
          }
        });

        entitiesRef.current.hubs.forEach(hub => {
          hub.treasures.forEach((t, ti) => {
            if (Math.hypot(t.x - ship.x, t.y - ship.y) < 80) {
              hub.treasures.splice(ti, 1);
              onStateUpdate({
                weaponLevel: 2,
                maxIntegrity: 20,
                score: 5000,
                messages: ["TREASURE_FOUND: Aether Core salvaged."]
              });
              explodeEntity(ship.x, ship.y, '#a855f7', 40, true);
              soundService.playPickup();
            }
          });
        });

        ship.draw(ctx);
        if (entitiesRef.current.infernalBeam) entitiesRef.current.infernalBeam.draw(ctx);
        companion.update(ship.x, ship.y, enemies, megastructures); companion.draw(ctx);

        enemies.forEach((en, i) => {
          en.update(ship.x, ship.y); en.draw(ctx);
          if (Math.hypot(en.x - ship.x, en.y - ship.y) < en.r + ship.r) {
            const damageFactor = 1 / (ship.config.defense || 1);
            onStateUpdate({
              lives: -1,
              corruptionLevel: 12 * damageFactor,
              aiIntegrity: -5 * damageFactor
            });
            enemies.splice(i, 1);
            explodeEntity(en.x, en.y, en.config.color, 35);
            soundService.playDamage();
            camera.shake = 45;
            ship.hitTimer = 60;
            hitFlashRef.current = 15;
          }
        });

        lasers.forEach((l, i) => {
          if (!l.update()) { lasers.splice(i, 1); return; }
          l.draw(ctx);

          // Colisión laser con enemigos
          enemies.forEach((en, ei) => {
            if (Math.hypot(l.x - en.x, l.y - en.y) < en.r + 15) {
              en.health -= l.damage; en.hitTimer = 5;
              explodeEntity(l.x, l.y, en.config.color, 3);
              lasers.splice(i, 1);
              if (en.health <= 0) {
                explodeEntity(en.x, en.y, en.config.color, 40, true);
                enemies.splice(ei, 1);
                onStateUpdate({ score: en.config.score, specialCharge: 3 });
                if (Math.random() > 0.65) {
                  const shard = entitiesRef.current.shardPool.get(en.x, en.y);
                  shard.reset(en.x, en.y);
                  resources.push(shard);
                }
              }
            }
          });

          // Colisión laser con estructuras
          [...crystalStructures, ...debris, ...megastructures].forEach(target => {
            if (Math.hypot(l.x - target.x, l.y - target.y) < (target as any).r + 10) {
              (target as any).health -= l.damage;
              explodeEntity(l.x, l.y, '#475569', 2);
              lasers.splice(i, 1);
            }
          });
        });

        singularities.forEach((s, i) => { if (!s.update()) { singularities.splice(i, 1); return; } s.draw(ctx); });
        particles.forEach((p, i) => { if (!p.update()) { particles.splice(i, 1); return; } p.draw(ctx); });

        // Spawning de entidades deterministas (Operador Aureo)
        const spawnDistanceIdx = Math.floor(explorationDistance / 500);
        if (entitiesRef.current.lastMissionUpdate < spawnDistanceIdx) {
          entitiesRef.current.lastMissionUpdate = spawnDistanceIdx;

          const entityType = generate_sector_order(spawnDistanceIdx);
          const ang = Math.random() * Math.PI * 2;
          const spawnDist = 2000;
          const sx = ship.x + Math.cos(ang) * spawnDist;
          const sy = ship.y + Math.sin(ang) * spawnDist;

          if (entityType === EntityType.HostileDrone) {
            const prob = getGoldenValue(spawnDistanceIdx * 1.618);
            let en;
            if (prob > 0.85) {
              en = new MotherShip(sx, sy);
              onStateUpdate({ messages: ["WARNING: MotherShip detected!"] });
            } else if (prob < -0.6) {
              en = new KamikazeEnemy(sx, sy);
            } else {
              const type = prob > 0 ? EnemyType.SCOUT : EnemyType.INTERCEPTOR;
              en = entitiesRef.current.enemyPool.get(sx, sy);
              en.reset(sx, sy, type);
            }
            enemies.push(en);
          } else if (entityType === EntityType.AetherCrystal) {
            const shard = entitiesRef.current.shardPool.get(sx, sy);
            shard.reset(sx, sy);
            resources.push(shard);
          }
        }

        // Logic for motherships
        enemies.forEach(en => {
          if (en instanceof MotherShip && en.canSpawn()) {
            const ang = Math.random() * Math.PI * 2;
            enemies.push(new EnemyShip(en.x + Math.cos(ang) * 100, en.y + Math.sin(ang) * 100, EnemyType.SCOUT));
          }
        });

        // Cubic Tensorial Manifold Visual (Warp Overlay)
        if (ship['warping']) {
          ctx.save();
          ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
          ctx.lineWidth = 2;
          const gridSize = 100;
          for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
              const noise = Math.sin(x * 0.01 + nowMs * 0.005) * 10;
              ctx.strokeRect(x + noise, y + noise, gridSize - 10, gridSize - 10);
            }
          }
          ctx.restore();
        }

        ctx.restore();

        // --- RADAR RENDERING ---
        if (radarCanvasRef.current) {
          const rctx = radarCanvasRef.current.getContext('2d');
          if (rctx) {
            const rSize = radarCanvasRef.current.width;
            const rCenter = rSize / 2;
            const rRange = 4000; // Radar detection range

            rctx.fillStyle = 'rgba(0, 10, 20, 0.8)';
            rctx.fillRect(0, 0, rSize, rSize);

            // Draw grid
            rctx.strokeStyle = 'rgba(14, 165, 233, 0.1)';
            rctx.lineWidth = 1;
            rctx.beginPath();
            rctx.arc(rCenter, rCenter, rCenter * 0.5, 0, Math.PI * 2);
            rctx.arc(rCenter, rCenter, rCenter, 0, Math.PI * 2);
            rctx.stroke();

            rctx.moveTo(0, rCenter); rctx.lineTo(rSize, rCenter);
            rctx.moveTo(rCenter, 0); rctx.lineTo(rCenter, rSize);
            rctx.stroke();

            // Draw entities
            const drawDot = (ex: number, ey: number, color: string, size: number = 2) => {
              const dx = (ex - ship.x) / rRange * rCenter;
              const dy = (ey - ship.y) / rRange * rCenter;
              if (Math.hypot(dx, dy) < rCenter) {
                rctx.fillStyle = color;
                rctx.fillRect(rCenter + dx - size / 2, rCenter + dy - size / 2, size, size);
              }
            };

            enemies.forEach(en => drawDot(en.x, en.y, '#f43f5e', 3));
            resources.forEach(res => drawDot(res.x, res.y, '#22c55e', 2));

            // Draw ship (center)
            rctx.fillStyle = '#fff';
            rctx.beginPath();
            rctx.arc(rCenter, rCenter, 2, 0, Math.PI * 2);
            rctx.fill();
          }
        }

        // Render hit flash
        if (hitFlashRef.current > 0) {
          ctx.fillStyle = `rgba(244, 63, 94, ${hitFlashRef.current / 30})`;
          ctx.fillRect(0, 0, width, height);
          hitFlashRef.current--;
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [status, corruptionLevel, weapon, weaponLevel, shipModel, calibration, onStateUpdate, explodeEntity, triggerQuantumPurge, specialCharge, stars]);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-6 right-32 z-40 bg-black/80 border border-sky-500/20 p-1 rounded-sm shadow-2xl">
        <div className="text-[8px] mono text-sky-500/50 mb-1 uppercase text-center font-bold tracking-tighter">Tactical_Radar_Link</div>
        <canvas ref={radarCanvasRef} width={120} height={120} className="block" />
        <div className="text-[7px] mono text-sky-500/30 mt-1 text-center font-bold tracking-widest uppercase">Range: 4.0k</div>
      </div>

      {currentMission && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 w-80 bg-black/60 backdrop-blur-md border-l-4 border-amber-500 p-3 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <div className="text-[10px] text-amber-500/70 mono uppercase tracking-widest mb-1">Active_Objective // Mission_{currentMission.type}</div>
          <div className="text-sm font-bold text-white mb-1 uppercase italic tracking-tight">{currentMission.title}</div>
          <div className="text-[11px] text-amber-200/60 leading-tight mb-2 font-medium">{currentMission.description}</div>
          <div className="w-full bg-amber-500/10 h-1.5 rounded-full overflow-hidden relative">
            <div
              className="bg-amber-500 h-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (explorationDistance / currentMission.goal) * 100)}% ` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold mix-blend-difference">
              {Math.floor(explorationDistance)} / {currentMission.goal} LY
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulation;
