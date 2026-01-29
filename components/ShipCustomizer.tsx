
import React, { useState, useMemo } from 'react';
import { ShipConfig, ShipModel } from '../types';
import { SHIP_MODELS } from '../constants';

interface ShipCustomizerProps {
    onSave: (config: ShipConfig) => void;
    onCancel: () => void;
    initialConfig?: ShipConfig;
}

const ShipCustomizer: React.FC<ShipCustomizerProps> = ({ onSave, onCancel, initialConfig }) => {
    const [model, setModel] = useState<ShipModel>(initialConfig?.model || ShipModel.INTERCEPTOR);
    const [color, setColor] = useState(initialConfig?.color || '#0ea5e9');
    const [thrust, setThrust] = useState(initialConfig?.thrust || 0.4);
    const [healthBonus, setHealthBonus] = useState(initialConfig?.healthBonus || 0);
    const [name, setName] = useState(initialConfig?.name || 'New Custom Ship');

    const previewConfig = useMemo(() => ({
        id: initialConfig?.id || `custom_${Date.now()}`,
        model,
        color,
        thrust,
        healthBonus,
        name,
        isCustom: true
    }), [model, color, thrust, healthBonus, name, initialConfig]);

    const colors = [
        { name: 'Quantum Blue', value: '#0ea5e9' },
        { name: 'Emerald Flux', value: '#10b981' },
        { name: 'Void Purple', value: '#a855f7' },
        { name: 'Solar Amber', value: '#f59e0b' },
        { name: 'Infernal Rose', value: '#f43f5e' },
        { name: 'Ghost White', value: '#f8fafc' }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[200] flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(14,165,233,0.15)] flex flex-col md:flex-row h-[80vh]">

                {/* Left: Preview Section */}
                <div className="flex-1 bg-black/40 relative flex flex-center items-center justify-center border-r border-white/5">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    <div className="relative z-10 text-center">
                        <div className="mb-8 text-[10px] mono text-sky-400 tracking-[0.5em] uppercase">Neural_Hull_Preview</div>
                        <div className="w-64 h-64 flex items-center justify-center border border-white/5 rounded-full bg-white/5 shadow-inner">
                            {/* This is a placeholder for a real render, but since we can't easily import the Canvas logic here without refactoring, we'll use a CSS-based representation */}
                            <div
                                className="w-16 h-16 transition-all duration-500 shadow-[0_0_40px_var(--glow)]"
                                style={{
                                    backgroundColor: color,
                                    clipPath: model === ShipModel.TITAN ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' :
                                        model === ShipModel.SPECTER ? 'polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%)' :
                                            model === ShipModel.VORTEX ? 'circle(50%)' :
                                                'polygon(50% 0%, 100% 100%, 50% 70%, 0% 100%)',
                                    '--glow': color
                                } as any}
                            />
                        </div>
                        <div className="mt-8">
                            <h2 className="text-2xl font-black tracking-tighter text-white uppercase">{name}</h2>
                            <p className="text-[10px] mono text-slate-500 uppercase">{model} CLASS HULL</p>
                        </div>
                    </div>
                </div>

                {/* Right: Controls Section */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col">
                    <h1 className="text-3xl font-black italic text-white mb-8 tracking-tighter">SHIP_CUSTOMIZER_v1.0</h1>

                    <div className="space-y-8 flex-1">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] mono text-sky-500 font-bold uppercase tracking-widest">Identification_Tag</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 p-3 rounded text-white font-bold tracking-tight focus:border-sky-500 outline-none transition-colors"
                            />
                        </div>

                        {/* Hull Model Selection */}
                        <div className="space-y-4">
                            <label className="text-[10px] mono text-sky-500 font-bold uppercase tracking-widest">Neural_Architecture</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(ShipModel).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setModel(m)}
                                        className={`p-3 border transition-all text-[10px] font-black uppercase tracking-widest rounded-sm ${model === m ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-slate-500 hover:border-white/30'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Palette */}
                        <div className="space-y-4">
                            <label className="text-[10px] mono text-sky-500 font-bold uppercase tracking-widest">Plasma_Resonance_Color</label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setColor(c.value)}
                                        title={c.name}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${color === c.value ? 'scale-110 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        style={{ backgroundColor: c.value }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Attributes Sliders */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] mono uppercase">
                                    <span className="text-slate-400">Thrust_Force</span>
                                    <span className="text-sky-400">{(thrust * 100).toFixed(0)}%</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="0.8" step="0.05"
                                    value={thrust} onChange={(e) => setThrust(parseFloat(e.target.value))}
                                    className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-full appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] mono uppercase">
                                    <span className="text-slate-400">Structural_Reinforcement</span>
                                    <span className="text-emerald-400">+{healthBonus} HP</span>
                                </div>
                                <input
                                    type="range" min="0" max="100" step="10"
                                    value={healthBonus} onChange={(e) => setHealthBonus(parseInt(e.target.value))}
                                    className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-12 flex gap-4 pt-8 border-t border-white/5">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border border-white/10 text-white hover:bg-white/5 transition-all"
                        >
                            Abort_Changes
                        </button>
                        <button
                            onClick={() => onSave(previewConfig)}
                            className="flex-[2] py-4 bg-sky-500 text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-[0_0_40px_rgba(14,165,233,0.3)]"
                        >
                            Initialize_Hull_Synthesis
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShipCustomizer;
