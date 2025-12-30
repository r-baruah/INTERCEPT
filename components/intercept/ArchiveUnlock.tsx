'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { mapSpaceWeatherToAudio } from '@/lib/audio/sonification';

/**
 * TIME-LOCKED ARCHIVE
 * 
 * "True Scarcity" - The Carrington Event mode is only available 
 * during a specific daily window.,
 * 
 * DESIGN: 'Data Vault' Aesthetic - Heavy industrial lock mechanism.
 */
export function ArchiveUnlock() {
    const [currentHour, setCurrentHour] = useState(new Date().getHours());
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [isActivated, setIsActivated] = useState(false);

    const { overrideSpaceWeatherData, updateAudioParams, setDemoMode } = useAudioStore();

    // Check for debug override and update time
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('debug') === 'true') {
            setIsDebugMode(true);
        }

        const interval = setInterval(() => {
            setCurrentHour(new Date().getHours());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Window logic: Open between 18:00 and 19:00
    const isWindowOpen = useMemo(() => {
        return isDebugMode || (currentHour >= 18 && currentHour < 19);
    }, [currentHour, isDebugMode]);

    // Calculate time until next window
    const timeUntilOpen = useMemo(() => {
        if (isWindowOpen) return null;

        const now = new Date();
        const target = new Date();
        target.setHours(18, 0, 0, 0);

        if (now.getHours() >= 19) {
            target.setDate(target.getDate() + 1);
        }

        const diff = target.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return { hours, minutes };
    }, [isWindowOpen, currentHour]);

    const activateHalloweenEvent = () => {
        if (!isWindowOpen) return;

        const now = new Date().toISOString();

        // Halloween 2003 Event Data - Extreme solar storm
        const halloweenData = {
            solar_wind: { speed: 1850, density: 35.0, temperature: 1000000, timestamp: now },
            geomagnetic: { kp_index: 9, storm_active: true, storm_level: 'Extreme', timestamp: now },
            flares: [{
                id: `halloween_${Date.now()}`,
                beginTime: now,
                peakTime: now,
                endTime: now,
                flareClass: 'X28',
                classType: 'X' as const,
                magnitude: 28,
                timestamp: now,
                sourceRegion: 'AR10486'
            }],
            data_source: 'demo' as const,
            timestamp: now
        };

        setDemoMode(true);
        overrideSpaceWeatherData(halloweenData);

        const params = mapSpaceWeatherToAudio(halloweenData);
        updateAudioParams(params);

        setIsActivated(true);
    };

    return (
        <div className={`
            relative group overflow-hidden transition-all duration-500 rounded-sm border
            ${isWindowOpen
                ? isActivated
                    ? 'bg-amber-950/20 border-red-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                    : 'bg-zinc-950 border-amber-500/30'
                : 'bg-zinc-950 border-zinc-800'
            }
        `}>
            {/* Background Hazard Stripes (Only active when event is running) */}
            {isActivated && (
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, #f59e0b 10px, #f59e0b 20px)' }}
                />
            )}

            <div className="p-3 relative z-10">
                {/* Header / Lock Status */}
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                        <div className={`
                            w-1.5 h-1.5 rounded-sm
                            ${isWindowOpen ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]' : 'bg-red-900'}
                        `} />
                        <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase">
                            Vault 10-24
                        </span>
                    </div>
                    {/* Lock Icon */}
                    {isWindowOpen ? (
                        <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    )}
                </div>

                {/* Content */}
                {isWindowOpen ? (
                    isActivated ? (
                        <div className="text-center py-2 animate-pulse-subtle">
                            <div className="font-mono text-xl text-red-500 tracking-widest font-bold mb-1">
                                WARNING
                            </div>
                            <div className="font-mono text-[9px] text-amber-500 tracking-wide uppercase">
                                Historical Re-enactment Active
                            </div>
                            <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                                2003 "HALLOWEEN" STORM
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <div className="font-mono text-xs text-amber-100/90 tracking-wider mb-1">
                                    ARCHIVE UNLOCKED
                                </div>
                                <div className="font-mono text-[9px] text-zinc-500 leading-relaxed">
                                    Access granted to historical signal database.
                                    <br />
                                    Subject: 2003 Extreme Event.
                                </div>
                            </div>

                            <button
                                onClick={activateHalloweenEvent}
                                className="w-full flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all duration-300 group"
                            >
                                <span className="font-mono text-[9px] text-amber-400 tracking-widest uppercase">
                                    Inj. Tape #409
                                </span>
                                <svg className="w-3 h-3 text-amber-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-zinc-700">
                        {/* Time Dial Visual */}
                        <div className="relative w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center mb-2">
                            <div className="absolute inset-0 border border-t-zinc-600 rounded-full animate-spin duration-[10s] opacity-20" />
                            <span className="font-mono text-[10px]">{timeUntilOpen ? `${timeUntilOpen.hours}H` : '--'}</span>
                        </div>
                        <div className="font-mono text-[9px] tracking-widest opacity-60">
                            TIME LOCK ACTIVE
                        </div>
                    </div>
                )}
            </div>

            {/* Decorative Corner */}
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${isWindowOpen ? 'border-amber-500/50' : 'border-zinc-700'}`} />
        </div>
    );
}
