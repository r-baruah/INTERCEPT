'use client';

import { useState } from 'react';
import { useAudioStore } from '@/store/audioStore';

/**
 * SOURCE SELECTOR - Signal Source Control
 * 
 * "The Red Signal" - Professional Mars Uplink UI
 * Features 'Ares Industrial' aesthetic with heavy borders and rust/red accents.
 */
export function SourceSelector() {
    const [selectedSource, setSelectedSource] = useState<'earth' | 'mars'>('earth');
    const [showProModal, setShowProModal] = useState(false);
    const [isProUnlocked, setIsProUnlocked] = useState(false);

    const { overrideSpaceWeatherData, updateAudioParams, setDemoMode, setMarsMode } = useAudioStore();

    const handleMarsClick = () => {
        if (isProUnlocked) {
            activateMarsMode();
        } else {
            setShowProModal(true);
        }
    };

    const handleEarthClick = () => {
        setSelectedSource('earth');
        // Simple reload to reconnect to live stream for now
        window.location.reload();
    };

    const activateMarsMode = () => {
        setSelectedSource('mars');
        setDemoMode(true); // Stop live polling
        setMarsMode(true); // Enable Mars theme globally

        // Inject Mars Data (Curiosity Rover Simulation)
        const now = new Date().toISOString();
        const marsData = {
            solar_wind: { speed: 240, density: 0.1, temperature: 210, timestamp: now },
            geomagnetic: { kp_index: 1, storm_active: false, storm_level: 'None', timestamp: now },
            flares: [],
            data_source: 'demo' as const,
            timestamp: now
        };

        overrideSpaceWeatherData(marsData);

        // Update Audio: Mars is quiet, cold, desolate
        updateAudioParams({
            bpm: 30, // Very slow
            distortion: 0.05, // Clean but thin
            filterFreq: 800, // Muffled
            volumeBoost: -4,
            intensity: 0.2
        });
    };

    const handleUnlock = () => {
        setIsProUnlocked(true);
        setShowProModal(false);
        activateMarsMode();
    };

    return (
        <>
            <div className={`
                relative bg-zinc-950/80 border transition-all duration-300 overflow-hidden
                ${selectedSource === 'mars'
                    ? 'border-red-900/50 shadow-[0_0_30px_rgba(153,27,27,0.1)]'
                    : 'border-zinc-800'
                }
            `}>
                {/* Header Label */}
                <div className="flex items-center justify-between px-3 py-2 bg-black/60 border-b border-zinc-800">
                    <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase">
                        Telemetry Source
                    </span>
                    {selectedSource === 'mars' && (
                        <span className="flex items-center gap-1.5 font-mono text-[9px] text-red-400 tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            OFF-WORLD
                        </span>
                    )}
                </div>

                {/* Source Grid */}
                <div className="grid grid-cols-2 p-1 gap-1">
                    {/* EARTH NODE */}
                    <button
                        onClick={handleEarthClick}
                        className={`
                            group relative flex flex-col items-center justify-center py-4 px-2
                            border transition-all duration-300
                            ${selectedSource === 'earth'
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : 'bg-transparent border-transparent hover:bg-zinc-900 hover:border-zinc-800'
                            }
                        `}
                    >
                        {/* Earth Icon */}
                        <div className={`mb-2 transition-transform duration-500 ${selectedSource === 'earth' ? 'scale-110' : 'group-hover:scale-105 opacity-50'}`}>
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="8" className="stroke-zinc-600" strokeWidth="1" strokeDasharray="2 2" />
                                <circle cx="12" cy="12" r="4" className={selectedSource === 'earth' ? "fill-emerald-500/20 stroke-emerald-400" : "fill-zinc-800 stroke-zinc-600"} strokeWidth="1.5" />
                                {selectedSource === 'earth' && (
                                    <circle cx="12" cy="12" r="10" className="stroke-emerald-500/20 animate-pulse-subtle" strokeWidth="1" />
                                )}
                            </svg>
                        </div>
                        <span className={`font-mono text-[10px] tracking-widest ${selectedSource === 'earth' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            EARTH
                        </span>
                    </button>

                    {/* MARS NODE */}
                    <button
                        onClick={handleMarsClick}
                        className={`
                            group relative flex flex-col items-center justify-center py-4 px-2
                            border transition-all duration-300
                            ${selectedSource === 'mars'
                                ? 'bg-red-950/20 border-red-500/30'
                                : 'bg-transparent border-transparent hover:bg-zinc-900 hover:border-zinc-800'
                            }
                        `}
                    >
                        {/* Lock Overlay */}
                        {!isProUnlocked && (
                            <div className="absolute top-1 right-1">
                                <svg className="w-3 h-3 text-red-500 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        )}

                        {/* Mars Icon */}
                        <div className={`mb-2 transition-transform duration-500 ${selectedSource === 'mars' ? 'scale-110' : 'group-hover:scale-105 opacity-50'}`}>
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="6" className={selectedSource === 'mars' ? "fill-red-900/40 stroke-red-500" : "fill-zinc-800 stroke-zinc-600"} strokeWidth="1.5" />
                                {selectedSource === 'mars' && (
                                    <>
                                        <path d="M4 12h16M12 4v16" className="stroke-red-900/50" strokeWidth="0.5" />
                                        <circle cx="12" cy="12" r="9" className="stroke-red-500/20 animate-pulse" strokeWidth="1" />
                                    </>
                                )}
                            </svg>
                        </div>
                        <span className={`font-mono text-[10px] tracking-widest ${selectedSource === 'mars' ? 'text-red-400' : 'text-zinc-500'}`}>
                            MARS
                        </span>
                    </button>
                </div>
            </div>

            {/* UPGRADED PRO MODAL */}
            {showProModal && (
                <ProModal onClose={() => setShowProModal(false)} onUnlock={handleUnlock} />
            )}
        </>
    );
}

/**
 * ULTRA-PREMIUM 'MARS LINK' MODAL
 */
function ProModal({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
    const [status, setStatus] = useState<'idle' | 'authorizing' | 'active'>('idle');

    const handleSubscribe = () => {
        setStatus('authorizing');
        // Simulate deep space handshake
        setTimeout(() => {
            onUnlock();
        }, 2000);
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg mx-4 group overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Background Frame */}
                {/* Top Bar */}
                <div className="h-1 w-full bg-gradient-to-r from-red-600 via-orange-600 to-red-600" />

                <div className="bg-zinc-950 border border-zinc-800 p-8 md:p-12 relative">
                    {/* Background Grid - Mars Style */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: `linear-gradient(#ff4400 1px, transparent 1px), linear-gradient(90deg, #ff4400 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
                    />

                    {/* Header Section */}
                    <div className="relative z-10 text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-red-900/50 bg-red-950/20 rounded-full mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="font-mono text-[9px] tracking-[0.3em] text-red-400 uppercase">
                                Deep Space Network
                            </span>
                        </div>

                        <h2 className="font-mono text-3xl md:text-4xl text-white tracking-wider mb-2 uppercase font-light">
                            Orbit<span className="font-bold text-red-500">Link</span>
                        </h2>
                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-zinc-700 to-transparent mx-auto mt-4 mb-4" />
                        <p className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
                            Secure Telemetry Bridge • V3.42
                        </p>
                    </div>

                    {/* Mars Preview */}
                    <div className="relative z-10 flex items-center justify-between gap-6 mb-10 p-6 border border-zinc-800 bg-zinc-900/50">
                        {/* Data Points */}
                        <div className="space-y-3">
                            <FeatureRow label="ATMOSPHERE" value="0.6 kPa" />
                            <FeatureRow label="WIND" value="240 km/h" />
                            <FeatureRow label="TEMP" value="-63°C" />
                        </div>

                        {/* Planet Visual */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-black opacity-20 blur-xl animate-pulse-subtle" />
                            <svg className="w-full h-full text-red-600" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="url(#marsGradient)" />
                                <defs>
                                    <radialGradient id="marsGradient" cx="0.3" cy="0.3" r="0.8">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="50%" stopColor="#991b1b" />
                                        <stop offset="100%" stopColor="#000000" />
                                    </radialGradient>
                                </defs>
                                {/* Scan line */}
                                <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1">
                                    <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="10s" repeatCount="indefinite" />
                                </line>
                            </svg>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleSubscribe}
                        disabled={status === 'authorizing'}
                        className={`
                            relative w-full py-5 font-mono text-xs tracking-[0.3em] uppercase group overflow-hidden transition-all duration-300
                            ${status === 'authorizing'
                                ? 'bg-zinc-800 text-zinc-400 cursor-wait'
                                : 'bg-white text-black hover:bg-red-500 hover:text-white'
                            }
                        `}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            {status === 'authorizing' ? (
                                <>
                                    <span>ESTABLISHING UPLINK</span>
                                    <span className="loading-dots">...</span>
                                </>
                            ) : (
                                <>
                                    <span>Initialize Connection</span>
                                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">$4.99/MO</span>
                                </>
                            )}
                        </span>

                        {/* Button Shine Effect */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                    </button>

                    {/* Footer Close */}
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 text-zinc-500 hover:text-white transition-colors"
                    >
                        [ CLOSE TERMINAL ]
                    </button>
                </div>

                {/* Bottom Bar */}
                <div className="h-1 w-full bg-zinc-800" />
            </div>
        </div>
    );
}

function FeatureRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 bg-red-500/50 rotate-45" />
            <div className="flex flex-col">
                <span className="font-mono text-[8px] text-zinc-500 tracking-widest">{label}</span>
                <span className="font-mono text-xs text-zinc-300 tracking-wider">{value}</span>
            </div>
        </div>
    );
}
