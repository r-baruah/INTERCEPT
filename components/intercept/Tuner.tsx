'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { getAudioEngine } from '@/lib/audio/AudioEngine';

interface TunerProps {
    onSignalLock: (locked: boolean, quality: number) => void;
    interferenceLevel: number;
}

const TARGET_FREQUENCY = 1420.405;
const FREQUENCY_RANGE = { min: 1400, max: 1440 };
const LOCK_TOLERANCE = 1.5;
const MOMENTUM_DECAY = 0.92;
const KNOB_MASS = 0.15;

/**
 * The Tuner - Rack Mount Version
 * Compact, grounded control strip.
 * FIXED: Stable layout with consistent text sizing to prevent content shift
 */
export function Tuner({ onSignalLock, interferenceLevel }: TunerProps) {
    const [frequency, setFrequency] = useState(1410);
    const [isDragging, setIsDragging] = useState(false);
    const [signalStrength, setSignalStrength] = useState(0);

    const targetFreqRef = useRef(1410);
    const velocityRef = useRef(0);
    const driftOffsetRef = useRef(0);
    const driftTimeRef = useRef(0);
    const tunerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>(0);

    const { audioEngine, isPlaying, initializeAudioEngine, togglePlayback } = useAudioStore();

    // Physics Loop
    useEffect(() => {
        let lastTime = performance.now();

        const updatePhysics = () => {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            // Drift Logic
            driftTimeRef.current += dt * (0.1 + (interferenceLevel * 0.5));
            const maxDrift = 0.2 + (interferenceLevel * 3.0);
            const noise = Math.sin(driftTimeRef.current) + (Math.sin(driftTimeRef.current * 2.1) * 0.5);
            const targetDrift = noise * maxDrift * 0.5;
            driftOffsetRef.current += (targetDrift - driftOffsetRef.current) * 0.05;
            const effectiveTargetFreq = TARGET_FREQUENCY + driftOffsetRef.current;

            // Knob Physics
            const dist = targetFreqRef.current - frequency;
            const force = dist * (1 - KNOB_MASS);
            velocityRef.current = (velocityRef.current + force) * MOMENTUM_DECAY;

            const distToSignal = Math.abs(frequency - effectiveTargetFreq);
            if (distToSignal < LOCK_TOLERANCE * 2) {
                velocityRef.current *= 0.85;
            }

            let nextFreq = frequency + velocityRef.current;
            nextFreq = Math.max(FREQUENCY_RANGE.min, Math.min(FREQUENCY_RANGE.max, nextFreq));

            if (Math.abs(nextFreq - frequency) > 0.001 || Math.abs(driftOffsetRef.current) > 0.001) {
                setFrequency(nextFreq);
                const velocityFactor = Math.min(1, Math.abs(velocityRef.current) * 5);
                const quality = calculateQuality(nextFreq, effectiveTargetFreq);

                if (audioEngine) {
                    const baseStatic = 1 - quality;
                    const movementStatic = velocityFactor * 0.3;
                    const interferenceStatic = interferenceLevel * 0.2;
                    const totalTuningNoise = Math.min(1, baseStatic + movementStatic + interferenceStatic);
                    audioEngine.setTuning(1 - totalTuningNoise);
                }
            }
            animationFrameRef.current = requestAnimationFrame(updatePhysics);
        };
        animationFrameRef.current = requestAnimationFrame(updatePhysics);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [frequency, audioEngine, interferenceLevel]);

    const calculateQuality = (currentFreq: number, targetFreq: number) => {
        const distance = Math.abs(currentFreq - targetFreq);
        if (distance <= LOCK_TOLERANCE) {
            const x = distance / LOCK_TOLERANCE;
            return 1 - (x * x);
        }
        return 0;
    };

    useEffect(() => {
        const effectiveTarget = TARGET_FREQUENCY + driftOffsetRef.current;
        const quality = calculateQuality(frequency, effectiveTarget);
        setSignalStrength(quality);
        onSignalLock(quality > 0.85, quality);
    }, [frequency, onSignalLock]);

    // Interaction Handlers
    const handleDragStart = async (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        if (!audioEngine) await initializeAudioEngine();
        const engine = getAudioEngine();
        engine?.startTuning();
        engine?.setTuning(signalStrength);
    };

    const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !tunerRef.current) return;
        const rect = tunerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const x = (clientX - rect.left) / rect.width;
        const clampedX = Math.max(0, Math.min(1, x));
        const targetFreq = FREQUENCY_RANGE.min + (clampedX * (FREQUENCY_RANGE.max - FREQUENCY_RANGE.min));
        targetFreqRef.current = targetFreq;
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setTimeout(() => audioEngine?.stopTuning(), 500);
    }, [audioEngine]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDrag);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDrag);
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDrag);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDrag);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDrag, handleDragEnd]);

    const isLocked = signalStrength > 0.85;
    const frequencyPosition = (frequency - FREQUENCY_RANGE.min) / (FREQUENCY_RANGE.max - FREQUENCY_RANGE.min);

    return (
        <div className="w-full p-4 md:p-6 bg-zinc-900/50 relative select-none">

            {/* FIXED HEIGHT container to prevent layout shift */}
            <div className="flex items-center justify-between mb-4 h-16">
                <div className="flex flex-col justify-center">
                    <div className="font-mono text-[10px] text-zinc-400 tracking-widest uppercase mb-1">
                        Frequency
                    </div>
                    {/* FIXED: Keep consistent text-4xl size, use color/glow for lock state */}
                    <div className={`
                        font-mono text-3xl md:text-4xl tracking-wider transition-all duration-300
                        ${isLocked
                            ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]'
                            : 'text-zinc-400'
                        }
                    `}>
                        {frequency.toFixed(3)}
                        <span className={`text-sm ml-1 ${isLocked ? 'text-zinc-300' : 'text-zinc-500'}`}>MHz</span>
                    </div>
                </div>

                <button
                    onClick={togglePlayback}
                    disabled={!isLocked}
                    className={`
                        px-4 md:px-6 py-2.5 border font-mono text-xs tracking-widest transition-all duration-300
                        ${isLocked
                            ? isPlaying
                                ? 'bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                            : 'border-zinc-700 text-zinc-500 cursor-not-allowed'
                        }
                    `}
                >
                    {isPlaying ? 'TERMINATE' : 'INITIATE'}
                </button>
            </div>

            {/* Tuner Strip */}
            <div
                ref={tunerRef}
                className="relative h-14 bg-black border border-zinc-700 cursor-ew-resize overflow-hidden group rounded-sm"
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
            >
                {/* Frequency Labels */}
                <div className="absolute inset-x-0 top-1 flex justify-between px-2 pointer-events-none">
                    <span className="font-mono text-[9px] text-zinc-500">1400</span>
                    <span className="font-mono text-[9px] text-emerald-500/70">1420.405</span>
                    <span className="font-mono text-[9px] text-zinc-500">1440</span>
                </div>

                {/* RULER - enhanced visibility */}
                <div className="absolute inset-0 top-4 opacity-60 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_97%,#555_98%,transparent_100%)] bg-[length:5%_100%]" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_48%,#333_49%,transparent_100%)] bg-[length:1%_100%]" />
                </div>

                {/* Target Zone - Hydrogen Line */}
                <div
                    className={`absolute top-4 bottom-0 w-12 z-0 transition-all duration-500
                        ${isLocked
                            ? 'bg-emerald-500/20 border-l-2 border-r-2 border-emerald-500/50'
                            : 'bg-white/5 border-l border-r border-white/10'
                        }
                    `}
                    style={{
                        left: `${((TARGET_FREQUENCY + driftOffsetRef.current - FREQUENCY_RANGE.min) / (FREQUENCY_RANGE.max - FREQUENCY_RANGE.min)) * 100}%`,
                        transform: 'translateX(-50%)',
                    }}
                />

                {/* CURSOR / NEEDLE - enhanced visibility */}
                <div
                    className={`absolute top-4 bottom-0 w-0.5 z-10 transition-shadow duration-300
                        ${isLocked
                            ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1),0_0_30px_rgba(52,211,153,0.5)]'
                            : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                        }
                    `}
                    style={{ left: `${frequencyPosition * 100}%` }}
                />
            </div>

            {/* Signal Quality Bar - enhanced visibility */}
            <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-zinc-800 overflow-hidden rounded-sm">
                    <div
                        className={`h-full transition-all duration-150 rounded-sm ${isLocked
                                ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                                : 'bg-amber-500'
                            }`}
                        style={{ width: `${signalStrength * 100}%` }}
                    />
                </div>
                <span className={`font-mono text-xs w-12 text-right ${isLocked ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {(signalStrength * 100).toFixed(0)}%
                </span>
            </div>

            {/* Status text - enhanced visibility */}
            <div className="mt-2 text-center">
                <span className={`font-mono text-[10px] tracking-widest uppercase ${isLocked
                        ? 'text-emerald-400'
                        : 'text-amber-400 animate-pulse'
                    }`}>
                    {isLocked ? '● HYDROGEN LINE LOCKED' : '○ SCANNING FOR 21CM EMISSION'}
                </span>
            </div>
        </div>
    );
}