import React, { useRef, useEffect, useCallback, useState } from 'react';

export interface TouchInput {
    angle: number;
    thrust: number;
    fire: boolean;
    special: boolean;
}

interface TouchControlsProps {
    onInputChange: (input: TouchInput) => void;
    enabled: boolean;
}

const TouchControls: React.FC<TouchControlsProps> = ({ onInputChange, enabled }) => {
    const joystickRef = useRef<HTMLDivElement>(null);
    const [joystickActive, setJoystickActive] = useState(false);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [fireActive, setFireActive] = useState(false);
    const [specialActive, setSpecialActive] = useState(false);

    const joystickCenter = useRef({ x: 0, y: 0 });
    const joystickRadius = 50;

    // Update input state
    useEffect(() => {
        if (!enabled) return;

        const thrust = Math.min(1, Math.hypot(joystickPos.x, joystickPos.y) / joystickRadius);
        const angle = thrust > 0.1 ? Math.atan2(-joystickPos.y, joystickPos.x) : 0;

        onInputChange({
            angle,
            thrust,
            fire: fireActive,
            special: specialActive
        });
    }, [joystickPos, fireActive, specialActive, enabled, onInputChange]);

    // Joystick touch handlers
    const handleJoystickStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joystickRef.current?.getBoundingClientRect();
        if (rect) {
            joystickCenter.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            setJoystickActive(true);

            const dx = touch.clientX - joystickCenter.current.x;
            const dy = touch.clientY - joystickCenter.current.y;
            const dist = Math.min(joystickRadius, Math.hypot(dx, dy));
            const angle = Math.atan2(dy, dx);
            setJoystickPos({
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist
            });
        }
    }, []);

    const handleJoystickMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        if (!joystickActive) return;

        const touch = e.touches[0];
        const dx = touch.clientX - joystickCenter.current.x;
        const dy = touch.clientY - joystickCenter.current.y;
        const dist = Math.min(joystickRadius, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);

        setJoystickPos({
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist
        });
    }, [joystickActive]);

    const handleJoystickEnd = useCallback(() => {
        setJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
    }, []);

    if (!enabled) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            {/* Virtual Joystick - Left Side */}
            <div
                ref={joystickRef}
                className="absolute bottom-20 left-8 w-32 h-32 pointer-events-auto"
                onTouchStart={handleJoystickStart}
                onTouchMove={handleJoystickMove}
                onTouchEnd={handleJoystickEnd}
                onTouchCancel={handleJoystickEnd}
                style={{ touchAction: 'none' }}
            >
                {/* Joystick Base */}
                <div
                    className="absolute inset-0 rounded-full border-2 border-sky-500/40 bg-black/30 backdrop-blur-sm"
                    style={{
                        boxShadow: joystickActive
                            ? '0 0 30px rgba(14, 165, 233, 0.4), inset 0 0 20px rgba(14, 165, 233, 0.2)'
                            : '0 0 15px rgba(14, 165, 233, 0.2)'
                    }}
                />

                {/* Joystick Knob */}
                <div
                    className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg transition-transform duration-75"
                    style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
                        boxShadow: joystickActive
                            ? '0 0 25px rgba(14, 165, 233, 0.8), inset 0 -2px 4px rgba(0,0,0,0.3)'
                            : '0 0 10px rgba(14, 165, 233, 0.4), inset 0 -2px 4px rgba(0,0,0,0.3)'
                    }}
                >
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-sky-300/50 to-transparent" />
                </div>

                {/* Direction Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-[8px] text-sky-500/50 font-mono uppercase tracking-widest">
                        NAV
                    </div>
                </div>
            </div>

            {/* Fire Button - Right Bottom */}
            <div
                className="absolute bottom-16 right-8 w-24 h-24 pointer-events-auto"
                onTouchStart={(e) => { e.preventDefault(); setFireActive(true); }}
                onTouchEnd={() => setFireActive(false)}
                onTouchCancel={() => setFireActive(false)}
                style={{ touchAction: 'none' }}
            >
                <div
                    className={`absolute inset-0 rounded-full border-2 transition-all duration-100 ${fireActive
                            ? 'border-rose-400 bg-rose-500/40 scale-95'
                            : 'border-rose-500/50 bg-rose-500/20'
                        }`}
                    style={{
                        boxShadow: fireActive
                            ? '0 0 40px rgba(244, 63, 94, 0.6), inset 0 0 30px rgba(244, 63, 94, 0.3)'
                            : '0 0 20px rgba(244, 63, 94, 0.3)'
                    }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-rose-400 font-bold text-lg tracking-wide">
                            FIRE
                        </div>
                    </div>
                </div>
            </div>

            {/* Special Attack Button - Right Top */}
            <div
                className="absolute bottom-44 right-12 w-16 h-16 pointer-events-auto"
                onTouchStart={(e) => { e.preventDefault(); setSpecialActive(true); }}
                onTouchEnd={() => setSpecialActive(false)}
                onTouchCancel={() => setSpecialActive(false)}
                style={{ touchAction: 'none' }}
            >
                <div
                    className={`absolute inset-0 rounded-full border-2 transition-all duration-100 ${specialActive
                            ? 'border-purple-400 bg-purple-500/40 scale-95'
                            : 'border-purple-500/50 bg-purple-500/20'
                        }`}
                    style={{
                        boxShadow: specialActive
                            ? '0 0 30px rgba(168, 85, 247, 0.6), inset 0 0 20px rgba(168, 85, 247, 0.3)'
                            : '0 0 15px rgba(168, 85, 247, 0.2)'
                    }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-purple-400 font-bold text-xs">
                            Q
                        </div>
                    </div>
                </div>
            </div>

            {/* Touch Hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-white/30 font-mono">
                TOUCH CONTROLS ACTIVE
            </div>
        </div>
    );
};

export default TouchControls;
