'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SpaceWeatherProvider } from '@/components/SpaceWeatherProvider';
import { RackLayout } from '@/components/intercept/layout/RackLayout';
import {
    SignalScope,
    Tuner,
    HUD,
    Sentry,
    Logbook,
    SimulationPanel,
    // Victor Protocol Components
    GeoRiskStatus,
    EconomicTicker,
    ArchiveUnlock,
    SourceSelector
} from '@/components/intercept';
import { FlightRecorder } from '@/components/intercept/FlightRecorder';
import { BootSequence } from '@/components/intercept/BootSequence';
import { useSpaceWeatherData, useAudioStore } from '@/store/audioStore';

/**
 * INTERCEPT - Real-Time Heliospheric Receiver
 * Version 3.0 - "THE VICTOR PROTOCOL"
 * 
 * "The universe is speaking. Are you listening?"
 */
export default function Home() {
    return (
        <SpaceWeatherProvider>
            <InterceptTerminal />
        </SpaceWeatherProvider>
    );
}

function InterceptTerminal() {
    const { data } = useSpaceWeatherData();
    const { audioEngine, initializeAudioEngine } = useAudioStore();

    // RITUAL STATES
    // 'cold' -> 'booting' -> 'standby' (tuning) -> 'locked'
    const [systemState, setSystemState] = useState<'cold' | 'booting' | 'standby' | 'locked'>('cold');
    const [hasBooted, setHasBooted] = useState(false);

    const [signalLocked, setSignalLocked] = useState(false);
    const [signalQuality, setSignalQuality] = useState(0);

    // Ref for Flight Recorder canvas capture
    const scopeCanvasRef = useRef<HTMLCanvasElement>(null);

    // Calculate interference level from D-RAP/space weather
    const interferenceLevel = calculateInterference(data);

    // ------------------------------------------------------------------------
    // RITUAL: Power On Sequence
    // ------------------------------------------------------------------------
    const handleInitialize = async () => {
        setSystemState('booting');

        // 1. Init Audio
        if (!audioEngine) await initializeAudioEngine();

        // 2. Play Boot Static (handled by Tuner/Engine logic mostly, but we can prime it here)
        // Ideally, BootSequence component handles the visual timing.
    };

    const handleBootComplete = () => {
        setHasBooted(true);
        setSystemState('standby');
        // Initial static burst
        audioEngine?.startTuning();
        audioEngine?.setTuning(0);
        setTimeout(() => audioEngine?.stopTuning(), 500);
    };

    const handleSignalLock = useCallback((locked: boolean, quality: number) => {
        setSignalLocked(locked);
        setSignalQuality(quality);
        if (locked && quality > 0.85) {
            setSystemState('locked');
        } else {
            setSystemState('standby');
        }
    }, []);

    return (
        <main className="min-h-screen bg-black text-white overflow-hidden select-none relative font-mono">

            {/* 1. STATE: COLD (Connect Button) */}
            {systemState === 'cold' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
                    <button
                        onClick={handleInitialize}
                        className="group relative px-12 py-6 overflow-hidden border border-zinc-800 hover:border-emerald-500 transition-colors duration-500"
                    >
                        <span className="relative z-10 font-mono text-xs tracking-[0.4em] uppercase group-hover:text-emerald-400 transition-colors duration-300">
                            Initialize Receiver
                        </span>
                        <div className="absolute inset-0 bg-emerald-900/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />

                        {/* Decorative Corners */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500 group-hover:border-emerald-500 transition-colors" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500 group-hover:border-emerald-500 transition-colors" />
                    </button>

                    <div className="absolute bottom-10 text-zinc-700 text-[10px] tracking-widest">
                        EST. 2025 • HELIOSPHERIC MONITORING DIVISION
                    </div>
                </div>
            )}

            {/* 2. STATE: BOOTING (BIOS Sequence) */}
            {systemState === 'booting' && (
                <BootSequence onComplete={handleBootComplete} />
            )}

            {/* MAIN INTERFACE (Revealed after boot) */}
            {hasBooted && (
                <RackLayout
                    headerSlot={
                        <div className="w-full flex justify-between items-center">
                            <div className="flex flex-col">
                                <h1 className="font-mono text-sm md:text-base tracking-[0.5em] text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                    Intercept
                                </h1>
                                <span className="text-[10px] text-zinc-400 tracking-wider">v3.0.0 - HELIOSPHERIC RECEIVER</span>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Flight Recorder Button */}
                                <FlightRecorder canvasRef={scopeCanvasRef} />

                                <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-700 rounded-sm bg-zinc-900/50">
                                    <div className={`w-2 h-2 rounded-full ${signalLocked
                                        ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]'
                                        : 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`}
                                    />
                                    <span className={`text-[10px] tracking-widest uppercase ${signalLocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {signalLocked ? 'LOCKED' : 'SCANNING'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    }
                    telemetrySlot={
                        <div className="flex flex-col gap-4">
                            {/* Original HUD */}
                            <HUD
                                signalLocked={signalLocked}
                                signalQuality={signalQuality}
                            />

                            {/* Victor Protocol: GEO-RISK STATUS */}
                            {signalLocked && <GeoRiskStatus />}
                        </div>
                    }
                    scopeSlot={
                        <SignalScope
                            signalLocked={signalLocked}
                            signalQuality={signalQuality}
                            canvasRef={scopeCanvasRef}
                        />
                    }
                    footerSlot={
                        <Tuner
                            onSignalLock={handleSignalLock}
                            interferenceLevel={interferenceLevel}
                        />
                    }
                    logSlot={
                        <div className="flex flex-col gap-4 h-full">
                            {/* Victor Protocol: Source Selector with Mars Paywall */}
                            <SourceSelector />

                            {/* Victor Protocol: Time-Locked Archive */}
                            <ArchiveUnlock />

                            {/* Original Logbook */}
                            <div className="flex-1 min-h-0">
                                <Logbook />
                            </div>
                        </div>
                    }
                />
            )}

            {/* OVERLAYS */}
            <Sentry />
            <SimulationPanel />

            {/* Victor Protocol: Economic Damage Ticker */}
            {hasBooted && <EconomicTicker />}

            {/* Global CRT Scanline Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]" />
            <div className="fixed inset-0 pointer-events-none z-[91] shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" /> {/* Vignette */}
        </main>
    );
}

function calculateInterference(data: any): number {
    if (!data) return 0.2;
    const kpFactor = (data.geomagnetic?.kp_index ?? 0) / 9;
    const windFactor = Math.max(0, (data.solar_wind?.speed ?? 400) - 400) / 400;
    return Math.min(1, (kpFactor * 0.6) + (windFactor * 0.4));
}