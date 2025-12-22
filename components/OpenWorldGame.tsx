import React, { useRef, useEffect, useState } from 'react';

// ==================== PHYSICS & GRAVITY SYSTEM ====================
const WORLD_SIZE = 50000; // Massive open world
const CHUNK_SIZE = 2000;

type EntityType = 'PLANET' | 'STATION' | 'BLACKHOLE' | 'DERELICT' | 'CRYSTAL';

class GravityField {
    x: number;
    y: number;
    mass: number;
    radius: number;
    type: EntityType;
    discovered: boolean;
    color: string;

    constructor(x: number, y: number, mass: number, radius: number, type: EntityType = 'PLANET') {
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.radius = radius;
        this.type = type; // PLANET, STATION, BLACKHOLE
        this.discovered = false;
        this.color = type === 'BLACKHOLE' ? '#000' : '#1e40af';
    }

    applyGravity(entity: { x: number; y: number }) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        if (dist < 10) return { fx: 0, fy: 0, dist };

        const force = (this.mass * 100) / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        return { fx, fy, dist };
    }

    isInEventHorizon(x: number, y: number) {
        if (this.type !== 'BLACKHOLE') return false;
        const dist = Math.hypot(x - this.x, y - this.y);
        return dist < this.radius * 0.3;
    }
}

class Blackhole extends GravityField {
    targetX: number;
    targetY: number;
    particles: any[];

    constructor(x: number, y: number, targetX: number, targetY: number) {
        super(x, y, 5000, 400, 'BLACKHOLE');
        this.targetX = targetX;
        this.targetY = targetY;
        this.particles = [];
    }

    teleport(entity: { x: number; y: number; xv: number; yv: number }) {
        entity.x = this.targetX + (Math.random() - 0.5) * 200;
        entity.y = this.targetY + (Math.random() - 0.5) * 200;
        entity.xv *= 0.3;
        entity.yv *= 0.3;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Event horizon
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(0.5, '#1e1b4b');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Accretion disk
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        if (this.discovered) {
            ctx.fillStyle = '#a855f7';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('WORMHOLE', 0, -this.radius - 20);
        }

        ctx.restore();
    }
}

class MegaStructure extends GravityField {
    health: number;
    maxHealth: number;

    constructor(x: number, y: number, structureType: 'STATION' | 'DERELICT' | 'CRYSTAL') {
        const types = {
            STATION: { mass: 2000, radius: 600, color: '#0ea5e9' },
            DERELICT: { mass: 1500, radius: 400, color: '#ef4444' },
            CRYSTAL: { mass: 1000, radius: 300, color: '#22c55e' }
        };
        const config = types[structureType] || types.STATION;
        super(x, y, config.mass, config.radius, structureType);
        this.color = config.color;
        this.health = 1000;
        this.maxHealth = 1000;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Gravity field visualization
        ctx.strokeStyle = `${this.color}33`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
        ctx.stroke();

        // Structure itself
        ctx.fillStyle = this.discovered ? this.color : '#334155';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;

        if (this.type === 'STATION') {
            // Rotating station
            ctx.rotate(Date.now() * 0.0001);
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const x = Math.cos(angle) * this.radius;
                const y = Math.sin(angle) * this.radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        } else if (this.type === 'CRYSTAL') {
            // Crystal formation
            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.fillRect(-20, -this.radius * 0.8, 40, this.radius * 1.6);
            }
        } else if (this.type === 'DERELICT') {
            // Derelict shape
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius * 0.5, this.radius * 0.5);
            ctx.lineTo(-this.radius * 0.5, this.radius * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();

        if (this.discovered) {
            ctx.fillStyle = this.color;
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.type, 0, -this.radius - 30);
        }
    }
}

// ==================== MAP DISCOVERY SYSTEM ====================
class FogOfWar {
    exploredChunks: Set<string>;
    visibilityRadius: number;

    constructor() {
        this.exploredChunks = new Set();
        this.visibilityRadius = 1500;
    }

    explore(x: number, y: number) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                this.exploredChunks.add(`${chunkX + dx},${chunkY + dy}`);
            }
        }
    }

    isExplored(x: number, y: number) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        return this.exploredChunks.has(`${chunkX},${chunkY}`);
    }

    drawMinimap(ctx: CanvasRenderingContext2D, playerX: number, playerY: number, entities: GravityField[], camera: any) {
        const size = 200;
        const scale = size / (WORLD_SIZE * 0.3);

        ctx.save();
        ctx.translate(10, 10);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, size, size);

        // Explored areas
        this.exploredChunks.forEach(key => {
            const [cx, cy] = key.split(',').map(Number);
            const screenX = ((cx * CHUNK_SIZE) - playerX + WORLD_SIZE * 0.15) * scale;
            const screenY = ((cy * CHUNK_SIZE) - playerY + WORLD_SIZE * 0.15) * scale;

            if (screenX >= 0 && screenX <= size && screenY >= 0 && screenY <= size) {
                ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
                ctx.fillRect(screenX, screenY, CHUNK_SIZE * scale, CHUNK_SIZE * scale);
            }
        });

        // Draw discovered entities
        entities.forEach(entity => {
            if (!entity.discovered) return;

            const screenX = ((entity.x - playerX + WORLD_SIZE * 0.15) * scale);
            const screenY = ((entity.y - playerY + WORLD_SIZE * 0.15) * scale);

            if (screenX >= 0 && screenX <= size && screenY >= 0 && screenY <= size) {
                ctx.fillStyle = entity.color || '#fff';
                ctx.beginPath();
                ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Player
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ==================== INTELLIGENT COMPANION AI ====================
class CompanionAI {
    x: number;
    y: number;
    xv: number;
    yv: number;
    mode: 'FOLLOW' | 'DEFEND' | 'SCOUT' | 'ATTACK';
    target: any;
    orbitDistance: number;
    orbitAngle: number;
    scanRadius: number;
    alertLevel: number;
    messages: { text: string; time: number }[];
    lastMessageTime: number;

    constructor() {
        this.x = 0;
        this.y = 0;
        this.xv = 0;
        this.yv = 0;
        this.mode = 'FOLLOW'; // FOLLOW, DEFEND, SCOUT, ATTACK
        this.target = null;
        this.orbitDistance = 150;
        this.orbitAngle = 0;
        this.scanRadius = 800;
        this.alertLevel = 0;
        this.messages = [];
        this.lastMessageTime = 0;
    }

    think(player: any, enemies: any[], structures: MegaStructure[]) {
        // Threat assessment
        const nearestEnemy = this.findNearest(player, enemies);
        const nearestStructure = this.findNearest(player, structures);

        if (nearestEnemy && nearestEnemy.dist < 600) {
            this.mode = 'DEFEND';
            this.target = nearestEnemy.entity;
            this.alertLevel = Math.min(100, this.alertLevel + 2);
            this.say("THREAT DETECTED - ENGAGING");
        } else if (nearestStructure && nearestStructure.dist < 1000 && !nearestStructure.entity.discovered) {
            this.mode = 'SCOUT';
            this.target = nearestStructure.entity;
            this.alertLevel = Math.max(0, this.alertLevel - 1);
            this.say("ANOMALY DETECTED - INVESTIGATING");
        } else {
            this.mode = 'FOLLOW';
            this.target = null;
            this.alertLevel = Math.max(0, this.alertLevel - 1);
        }
    }

    findNearest(player: any, entities: any[]) {
        let nearest = null;
        let minDist = Infinity;

        entities.forEach(entity => {
            const dist = Math.hypot(entity.x - player.x, entity.y - player.y);
            if (dist < minDist && dist < this.scanRadius) {
                minDist = dist;
                nearest = { entity, dist };
            }
        });

        return nearest;
    }

    say(message: string) {
        const now = Date.now();
        if (now - this.lastMessageTime < 3000) return;
        this.lastMessageTime = now;
        this.messages.push({ text: message, time: now });
        if (this.messages.length > 3) this.messages.shift();
    }

    update(player: any, enemies: any[], structures: MegaStructure[]) {
        this.think(player, enemies, structures);

        let targetX = player.x;
        let targetY = player.y;

        switch (this.mode) {
            case 'FOLLOW':
                this.orbitAngle += 0.02;
                targetX = player.x + Math.cos(this.orbitAngle) * this.orbitDistance;
                targetY = player.y + Math.sin(this.orbitAngle) * this.orbitDistance;
                break;

            case 'DEFEND':
                if (this.target) {
                    const angleToThreat = Math.atan2(this.target.y - player.y, this.target.x - player.x);
                    targetX = player.x + Math.cos(angleToThreat + Math.PI) * 100;
                    targetY = player.y + Math.sin(angleToThreat + Math.PI) * 100;
                }
                break;

            case 'SCOUT':
                if (this.target) {
                    const dx = this.target.x - player.x;
                    const dy = this.target.y - player.y;
                    const dist = Math.hypot(dx, dy);
                    targetX = player.x + (dx / dist) * 300;
                    targetY = player.y + (dy / dist) * 300;
                }
                break;

            case 'ATTACK':
                if (this.target) {
                    targetX = this.target.x;
                    targetY = this.target.y;
                }
                break;
        }

        // Smooth movement
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        this.xv += dx * 0.01;
        this.yv += dy * 0.01;
        this.xv *= 0.9;
        this.yv *= 0.9;
        this.x += this.xv;
        this.y += this.yv;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Companion body
        const color = this.mode === 'DEFEND' ? '#ef4444' :
            this.mode === 'SCOUT' ? '#eab308' : '#10b981';

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        // Adaptive shape based on mode
        ctx.beginPath();
        if (this.mode === 'DEFEND') {
            // Shield shape
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const r = 10 + (i % 2) * 5;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        } else if (this.mode === 'SCOUT') {
            // Scanner shape
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.moveTo(15, 0);
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
        } else {
            // Standard hexagon
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                const x = Math.cos(angle) * 10;
                const y = Math.sin(angle) * 10;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();

        // Core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Alert indicator
        if (this.alertLevel > 30) {
            ctx.save();
            ctx.translate(this.x, this.y - 20);
            ctx.fillStyle = `rgba(239, 68, 68, ${this.alertLevel / 100})`;
            ctx.fillText('!', 0, 0);
            ctx.restore();
        }
    }
}

// ==================== MAIN GAME COMPONENT ====================
const OpenWorldGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState({
        player: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, xv: 0, yv: 0, angle: 0, r: 15 },
        camera: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, zoom: 0.5 },
        discovered: 0,
        totalStructures: 0
    });

    const worldRef = useRef<{
        structures: MegaStructure[];
        blackholes: Blackhole[];
        companion: CompanionAI;
        fogOfWar: FogOfWar;
        keys: Record<string, boolean>;
    }>({
        structures: [],
        blackholes: [],
        companion: new CompanionAI(),
        fogOfWar: new FogOfWar(),
        keys: {}
    });

    // Initialize world
    useEffect(() => {
        const world = worldRef.current;

        if (world.structures.length === 0) {
            // Generate mega structures
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 / 30) * i;
                const distance = 5000 + Math.random() * 15000;
                const x = WORLD_SIZE / 2 + Math.cos(angle) * distance;
                const y = WORLD_SIZE / 2 + Math.sin(angle) * distance;
                const types: ('STATION' | 'DERELICT' | 'CRYSTAL')[] = ['STATION', 'DERELICT', 'CRYSTAL'];
                const type = types[Math.floor(Math.random() * types.length)];
                world.structures.push(new MegaStructure(x, y, type));
            }

            // Generate blackholes (portals)
            for (let i = 0; i < 5; i++) {
                const x1 = 5000 + Math.random() * (WORLD_SIZE - 10000);
                const y1 = 5000 + Math.random() * (WORLD_SIZE - 10000);
                const x2 = 5000 + Math.random() * (WORLD_SIZE - 10000);
                const y2 = 5000 + Math.random() * (WORLD_SIZE - 10000);
                world.blackholes.push(new Blackhole(x1, y1, x2, y2));
                world.blackholes.push(new Blackhole(x2, y2, x1, y1));
            }

            setGameState(prev => ({ ...prev, totalStructures: world.structures.length }));
        }
    }, []);

    // Game loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const world = worldRef.current;
        let animationId: number;

        const gameLoop = () => {
            const { player, camera } = gameState;
            const { keys, structures, blackholes, companion, fogOfWar } = world;

            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }

            // Controls
            const thrust = 0.4;
            const turn = 0.08;

            if (keys['KeyW'] || keys['ArrowUp']) {
                player.xv += Math.cos(player.angle) * thrust;
                player.yv -= Math.sin(player.angle) * thrust;
            }
            if (keys['KeyS'] || keys['ArrowDown']) {
                player.xv -= Math.cos(player.angle) * thrust * 0.5;
                player.yv += Math.sin(player.angle) * thrust * 0.5;
            }
            if (keys['KeyA'] || keys['ArrowLeft']) player.angle += turn;
            if (keys['KeyD'] || keys['ArrowRight']) player.angle -= turn;

            // Apply gravity from all structures
            structures.forEach(structure => {
                const gravity = structure.applyGravity(player);
                player.xv += gravity.fx * 0.01;
                player.yv += gravity.fy * 0.01;

                // Discovery
                if (gravity.dist < structure.radius * 3 && !structure.discovered) {
                    structure.discovered = true;
                    setGameState(prev => ({ ...prev, discovered: prev.discovered + 1 }));
                }
            });

            // Blackhole teleportation
            blackholes.forEach(bh => {
                if (bh.isInEventHorizon(player.x, player.y)) {
                    bh.teleport(player);
                    companion.say("WORMHOLE TRAVERSAL COMPLETE");
                }

                if (Math.hypot(player.x - bh.x, player.y - bh.y) < bh.radius * 2) {
                    bh.discovered = true;
                }
            });

            // Friction
            player.xv *= 0.99;
            player.yv *= 0.99;
            player.x += player.xv;
            player.y += player.yv;

            // Bounds
            player.x = Math.max(0, Math.min(WORLD_SIZE, player.x));
            player.y = Math.max(0, Math.min(WORLD_SIZE, player.y));

            // Update companion
            companion.update(player, [], structures);

            // Update fog of war
            fogOfWar.explore(player.x, player.y);

            // Camera follow
            camera.x += (player.x - camera.x) * 0.1;
            camera.y += (player.y - camera.y) * 0.1;

            // Render
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(camera.zoom, camera.zoom);
            ctx.translate(-camera.x, -camera.y);

            // Stars
            for (let i = 0; i < 200; i++) {
                const x = (i * 1234.5678) % WORLD_SIZE;
                const y = (i * 8765.4321) % WORLD_SIZE;
                if (fogOfWar.isExplored(x, y)) {
                    ctx.fillStyle = '#ffffff33';
                    ctx.fillRect(x, y, 2, 2);
                }
            }

            // Draw blackholes
            blackholes.forEach(bh => {
                if (fogOfWar.isExplored(bh.x, bh.y)) {
                    bh.draw(ctx);
                }
            });

            // Draw structures
            structures.forEach(structure => {
                if (fogOfWar.isExplored(structure.x, structure.y)) {
                    structure.draw(ctx);
                }
            });

            // Draw companion
            companion.draw(ctx);

            // Draw player
            ctx.save();
            ctx.translate(player.x, player.y);
            ctx.rotate(player.angle + Math.PI / 2); // Adjust rotation by 90 deg due to visual matching
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0ea5e9';
            ctx.beginPath();
            ctx.moveTo(0, -player.r * 2);
            ctx.lineTo(player.r, player.r);
            ctx.lineTo(0, player.r * 0.5);
            ctx.lineTo(-player.r, player.r);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();

            ctx.restore();

            // Draw minimap
            fogOfWar.drawMinimap(ctx, player.x, player.y, [...structures, ...blackholes], camera);

            // Companion messages
            ctx.fillStyle = '#10b981';
            ctx.font = '12px monospace';
            companion.messages.forEach((msg, i) => {
                const age = Date.now() - msg.time;
                const alpha = Math.max(0, 1 - age / 3000);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillText(`COMPANION: ${msg.text}`, 220, 30 + i * 20);
                ctx.restore();
            });

            setGameState({ player, camera, discovered: gameState.discovered, totalStructures: gameState.totalStructures });
            animationId = requestAnimationFrame(gameLoop);
        };

        const handleKeyDown = (e: KeyboardEvent) => { world.keys[e.code] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { world.keys[e.code] = false; };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        animationId = requestAnimationFrame(gameLoop);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState]);

    return (
        <div className="w-full h-screen bg-slate-950 relative overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full" />

            {/* HUD */}
            <div className="absolute top-6 right-6 bg-black/80 border border-cyan-500/30 p-4 rounded font-mono text-xs">
                <div className="text-cyan-400 mb-2">EXPLORATION STATUS</div>
                <div className="text-white">Discovered: {gameState.discovered}/{gameState.totalStructures}</div>
                <div className="text-white">Position: [{Math.floor(gameState.player.x)}, {Math.floor(gameState.player.y)}]</div>
                <div className="text-white mt-2">Velocity: {Math.hypot(gameState.player.xv, gameState.player.yv).toFixed(1)}</div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 border border-cyan-500/30 px-6 py-3 rounded font-mono text-xs text-white">
                <span className="text-cyan-400">CONTROLS:</span> WASD/Arrows = Navigate | Gravity pulls you toward structures | Find all anomalies
            </div>
        </div>
    );
};

export default OpenWorldGame;
