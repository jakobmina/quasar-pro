import React, { useState, useCallback, useEffect } from 'react';
import { GameStatus, SimulationState, Difficulty, WeaponType, ShipModel, MissionType } from './types';
import { PHYSICS, SHIP_MODELS, WEAPON_CONFIGS } from './constants';
import Simulation from './components/Simulation';
import OpenWorldGame from './components/OpenWorldGame';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    score: 0, lives: 5, status: GameStatus.INITIAL, difficulty: Difficulty.NORMAL,
    weapon: WeaponType.LASER, shipModel: ShipModel.INTERCEPTOR,
    weaponLevel: 1, droneLevel: 1, upgradePoints: 0,
    aiIntegrity: 100, maxIntegrity: 100, corruptionLevel: 0,
    specialCharge: 0, calibration: { thrustSensitivity: 1.2, turnSensitivity: 1.0, gravitationalForce: 1.0, speedFactor: 1.0 },
    messages: ["SYSTEM_INIT: Aether Rescue Protocol Online", "AETHER: Help me Pilot... I'm fragmenting."],
    explorationDistance: 0,
    currentMission: {
      type: MissionType.EXPLORE,
      title: "First Contact",
      description: "Explore the neural space and locate a Golden Hub.",
      targetIndex: 0,
      progress: 0,
      goal: 1000
    }
  });
  const [hudVisibility, setHudVisibility] = useState({
    messages: true,
    stats: true,
    selection: true,
    controls: true
  });
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('aether_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [showOpenWorld, setShowOpenWorld] = useState(false);

  if (showOpenWorld) {
    return (
      <div className="relative">
        <OpenWorldGame />
        <button
          onClick={() => setShowOpenWorld(false)}
          className="absolute top-4 left-4 z-[200] px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all font-mono tracking-widest"
        >
          abort_simulation
        </button>
      </div>
    );
  }

  const handleStateUpdate = useCallback((update: Partial<SimulationState>) => {
    setState(prev => {
      const nextIntegrity = Math.min(prev.maxIntegrity, Math.max(0, prev.aiIntegrity + (update.aiIntegrity || 0)));
      const nextCorruption = Math.min(100, Math.max(0, prev.corruptionLevel + (update.corruptionLevel || 0)));
      const nextScore = prev.score + (update.score || 0);
      const nextCharge = Math.min(100, prev.specialCharge + (update.specialCharge || 0));
      const nextExploration = prev.explorationDistance + (update.explorationDistance || 0);

      const nextStatus = (nextIntegrity <= 0 || (update.lives !== undefined && prev.lives + update.lives <= 0)) ? GameStatus.GAME_OVER : (update.status || prev.status);

      return {
        ...prev,
        ...update,
        score: nextScore, aiIntegrity: nextIntegrity, corruptionLevel: nextCorruption,
        specialCharge: nextCharge, status: nextStatus,
        explorationDistance: nextExploration,
        lives: update.lives !== undefined ? prev.lives + update.lives : prev.lives
      };
    });
  }, []);

  useEffect(() => {
    if (state.score > highScore) {
      setHighScore(state.score);
      localStorage.setItem('aether_high_score', state.score.toString());
    }
  }, [state.score, highScore]);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && (state.status === GameStatus.RUNNING || state.status === GameStatus.PAUSED)) {
        handleStateUpdate({ status: state.status === GameStatus.RUNNING ? GameStatus.PAUSED : GameStatus.RUNNING });
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);

    if (state.status === GameStatus.RUNNING) {
      const timer = setInterval(() => {
        handleStateUpdate({ corruptionLevel: 0.15, aiIntegrity: -0.1 });
      }, 1000);
      return () => {
        clearInterval(timer);
        window.removeEventListener('keydown', handleGlobalKeys);
      };
    }
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [state.status, handleStateUpdate]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020617] text-slate-100 font-['Space_Grotesk'] overflow-hidden">

      {/* HUD Superior */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <div className="text-[10px] mono text-sky-400 mb-1 tracking-widest uppercase opacity-70">Aether_Neural_Network</div>
        <div className="text-4xl font-black tabular-nums tracking-tighter">
          {state.score.toLocaleString()}
        </div>
        <div className="text-[9px] mono text-sky-500/40 mt-1 uppercase">Best_Record: {highScore.toLocaleString()}</div>
      </div>

      <div className="absolute top-6 right-6 z-50 text-right pointer-events-none">
        <div className="text-[10px] mono text-rose-500 mb-1 uppercase font-bold">Infection_Vector</div>
        <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-rose-500 transition-all duration-500 shadow-[0_0_10px_#f43f5e]" style={{ width: `${state.corruptionLevel}%` }} />
        </div>
      </div>

      <div className="flex-1 relative bg-black">
        <Simulation {...state} onStateUpdate={handleStateUpdate} onGameOver={() => { }} />

        {/* Messages Panel */}
        <div className={`absolute bottom-32 left-6 w-72 transition-all duration-300 ${hudVisibility.messages ? 'h-32 opacity-100' : 'h-8 opacity-50 overflow-hidden'}`}>
          <div
            onClick={() => setHudVisibility(v => ({ ...v, messages: !v.messages }))}
            className="bg-black/80 border-t border-x border-sky-500/30 px-2 py-1 flex justify-between items-center cursor-pointer hover:bg-sky-900/20"
          >
            <span className="text-[9px] font-bold text-sky-400/70 uppercase">Log_Output</span>
            <span className="text-[9px] text-sky-400">{hudVisibility.messages ? '[-]' : '[+]'}</span>
          </div>
          {hudVisibility.messages && (
            <div className="h-full bg-black/60 backdrop-blur-xl border-x border-b border-sky-500/30 p-4 mono text-[10px] pointer-events-none overflow-hidden flex flex-col-reverse shadow-2xl rounded-b-sm">
              {state.messages.slice().reverse().map((m, i) => (
                <div key={i} className={`${m.startsWith('AETHER') ? 'text-amber-400' : 'text-sky-400'} mb-1`}>
                  {">"} {m}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pause Button */}
        <button
          onClick={() => handleStateUpdate({ status: state.status === GameStatus.RUNNING ? GameStatus.PAUSED : GameStatus.RUNNING })}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-2 bg-black/40 border border-white/10 hover:bg-white hover:text-black transition-all mono text-[10px] uppercase font-bold tracking-widest"
        >
          {state.status === GameStatus.PAUSED ? 'Resume [ESC]' : 'Pause [ESC]'}
        </button>
      </div>

      {/* Footer System Controls */}
      <div className={`absolute bottom-0 left-0 right-0 transition-all duration-500 z-50 ${hudVisibility.controls ? 'translate-y-0 opacity-100' : 'translate-y-[calc(100%-32px)] opacity-50'}`}>
        <div
          onClick={() => setHudVisibility(v => ({ ...v, controls: !v.controls }))}
          className="w-full bg-black/90 border-t border-white/5 px-6 py-2 flex justify-between items-center cursor-pointer hover:bg-white/5"
        >
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Neural_Interface_Controls</span>
          <span className="text-[9px] text-white/50">{hudVisibility.controls ? 'Minimize [▼]' : 'Maximize [▲]'}</span>
        </div>
        <div className="h-24 bg-black/90 backdrop-blur-2xl border-t border-white/10 flex items-center px-10 gap-16">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-[10px] mono uppercase mb-2 font-bold tracking-widest">
              <span className="text-slate-400">Core_Integrity</span>
              <span className={state.aiIntegrity < 30 ? 'text-rose-500' : 'text-emerald-400'}>
                {state.aiIntegrity.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-slate-900 w-full rounded-full border border-white/5">
              <div className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_#10b981]" style={{ width: `${state.aiIntegrity}%` }} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="border border-white/10 p-2 rounded bg-white/5 min-w-[120px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] uppercase text-slate-500 mono">Weapon_Sys</span>
                <span className="text-[10px] text-sky-400 font-bold">LVL_{state.weaponLevel}</span>
              </div>
              <div className="text-xs font-bold mono text-sky-200">{WEAPON_CONFIGS[state.weapon].name}</div>
            </div>
            <div className="border border-white/10 p-2 rounded bg-white/5">
              <div className="text-[8px] uppercase text-slate-500 mono">Hull_Model</div>
              <div className="text-xs font-bold mono" style={{ color: SHIP_MODELS[state.shipModel].color }}>{state.shipModel}</div>
            </div>
          </div>

          <div className="w-64">
            <button
              disabled={state.specialCharge < 100}
              onClick={() => {
                if (state.specialCharge >= 100) {
                  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ' }));
                }
              }}
              className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-2 rounded-sm ${state.specialCharge >= 100
                ? 'bg-white text-black border-white shadow-[0_0_30px_#fff] cursor-pointer hover:scale-105 active:scale-95'
                : 'bg-transparent text-slate-700 border-slate-900 cursor-not-allowed'
                }`}
            >
              {state.specialCharge >= 100 ? 'Quantum_Purge: Ready [Q]' : `Purge_Charge: ${state.specialCharge.toFixed(0)}%`}
            </button>
          </div>
        </div>
      </div>

      {state.status === GameStatus.INITIAL && (
        <div className="absolute inset-0 bg-[#020617] z-[100] flex flex-col items-center justify-center p-20 overflow-y-auto">
          <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white mb-8 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)] text-center">AETHER_RESCUE</h1>

          <div className="grid grid-cols-2 gap-12 w-full max-w-5xl mb-12">
            <div className="space-y-4">
              <h3 className="text-sky-500 font-bold mono uppercase text-xs tracking-[0.3em]">1. Select_Neural_Hull</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(SHIP_MODELS).map(ship => (
                  <button
                    key={ship.model}
                    onClick={() => setState(s => ({ ...s, shipModel: ship.model }))}
                    className={`p-4 border-2 transition-all text-xs font-black uppercase tracking-widest ${state.shipModel === ship.model ? 'border-white bg-white/10' : 'border-white/10 bg-black/40 text-slate-500'}`}
                    style={{ color: state.shipModel === ship.model ? ship.color : '' }}
                  >
                    {ship.model}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sky-500 font-bold mono uppercase text-xs tracking-[0.3em]">2. Select_Armament</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(WEAPON_CONFIGS).map(w => (
                  <button
                    key={w}
                    onClick={() => setState(s => ({ ...s, weapon: w as WeaponType }))}
                    className={`p-4 border-2 transition-all text-xs font-black uppercase tracking-widest ${state.weapon === w ? 'border-white bg-white/10 text-white' : 'border-white/10 bg-black/40 text-slate-500'}`}
                  >
                    {w.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-20 py-8 bg-sky-500 text-black font-black text-xl uppercase tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_60px_rgba(14,165,233,0.4)] cursor-pointer"
            onClick={() => handleStateUpdate({ status: GameStatus.RUNNING })}
          >
            Initialize_Stabilization
          </div>

          <div className="mt-4 px-20 py-4 border border-sky-500/30 text-sky-400 font-bold text-sm uppercase tracking-[0.3em] hover:bg-sky-500/10 transition-all cursor-pointer"
            onClick={() => setShowOpenWorld(true)}
          >
            Initialize_Open_World_Sim
          </div>
        </div>
      )}

      {
        state.status === GameStatus.PAUSED && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[150] flex flex-col items-center justify-center">
            <h2 className="text-6xl font-black italic text-white mb-12 tracking-tighter">SIMULATION_PAUSED</h2>
            <div className="flex gap-6">
              <button
                onClick={() => handleStateUpdate({ status: GameStatus.RUNNING })}
                className="px-10 py-4 bg-sky-500 text-black font-bold uppercase tracking-widest hover:bg-white transition-all"
              >
                Resume_Neural_Link
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-10 py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Abort_Mission
              </button>
            </div>
          </div>
        )
      }

      {
        state.status === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl z-[110] flex flex-col items-center justify-center text-center p-10">
            <div className="text-rose-500 font-black text-8xl italic mb-6 uppercase tracking-tighter">Connection_Lost</div>
            <div className="text-white text-2xl font-bold mono mb-16">Score: {state.score}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-14 py-6 bg-rose-600 text-white font-black uppercase tracking-widest hover:bg-white hover:text-rose-600 transition-all"
            >
              Retry_Upload
            </button>
          </div>
        )
      }
    </div >
  );
};

export default App;
