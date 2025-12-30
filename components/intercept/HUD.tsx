'use client';

import { useSpaceWeatherPolling } from '@/hooks/useSpaceWeather';
import { useAudioStore } from '@/store/audioStore';

interface HUDProps {
    signalLocked: boolean;
    signalQuality: number;
}

/**
 * The HUD - Data Overlay
 * Now supports Mars Mode with distinct red/rust visuals.
 */
export function HUD({ signalLocked, signalQuality }: HUDProps) {
    const { data, isLoading, error, refetch } = useSpaceWeatherPolling({ autoStart: true });
    const { isMarsMode } = useAudioStore();

    // Mars theme colors
    const themeColors = isMarsMode ? {
        accent: 'text-red-400',
        accentBg: 'bg-red-950/20',
        accentBorder: 'border-red-900/50',
        glow: 'drop-shadow-[0_0_8px_rgba(200,80,50,0.3)]',
        muted: 'text-red-700',
        label: 'text-red-300/80',
    } : {
        accent: 'text-emerald-400',
        accentBg: 'bg-emerald-500/10',
        accentBorder: 'border-emerald-500/30',
        glow: 'drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]',
        muted: 'text-zinc-500',
        label: 'text-zinc-300',
    };

    if (!signalLocked) {
        return (
            <div className={`h-full flex flex-col items-center justify-center border p-6 rounded-sm ${isMarsMode ? 'border-red-900/30 bg-red-950/10' : 'border-zinc-700 bg-zinc-900/30'}`}>
                <div className={`w-3 h-3 border-2 rounded-full animate-spin mb-4 ${isMarsMode ? 'border-red-700 border-t-red-500' : 'border-zinc-500 border-t-zinc-300'}`} />
                <div className={`font-mono text-xs tracking-widest text-center ${isMarsMode ? 'text-red-400' : 'text-zinc-400'}`}>
                    AWAITING SIGNAL LOCK
                </div>
                <div className={`font-mono text-[10px] mt-2 ${themeColors.muted}`}>
                    {isMarsMode ? 'Deep Space Network' : 'Tune to 1420.405 MHz'}
                </div>
            </div>
        );
    }

    // Explicit Error State
    if (error && !data) {
        return (
            <div className="h-full flex flex-col items-center justify-center border border-red-700/50 bg-red-900/20 p-6 rounded-sm">
                <div className="font-mono text-red-400 text-xs tracking-widest mb-2">TELEMETRY ERROR</div>
                <div className="font-mono text-[11px] text-red-300 text-center mb-4">{error}</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 border border-red-500/50 text-red-300 font-mono text-[10px] hover:bg-red-500/20 transition-colors"
                    >
                        RETRY
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 border border-red-500/50 text-red-300 font-mono text-[10px] hover:bg-red-500/20 transition-colors"
                    >
                        REBOOT
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading && !data) {
        return (
            <div className={`h-full flex flex-col items-center justify-center border p-6 rounded-sm ${themeColors.accentBorder}`}>
                <div className={`w-8 h-8 border-2 rounded-full animate-spin mb-4 ${isMarsMode ? 'border-red-800 border-t-red-500' : 'border-emerald-500/50 border-t-emerald-400'}`} />
                <div className={`font-mono text-[11px] tracking-widest animate-pulse ${themeColors.accent}`}>
                    {isMarsMode ? 'MARS LINK SYNC...' : 'SYNCING TELEMETRY...'}
                </div>
            </div>
        );
    }

    const solarWind = data?.solar_wind || { speed: 0, density: 0, temperature: 0 };
    const geomagnetic = data?.geomagnetic || { kp_index: 0, storm_active: false };

    // --- THREAT LEVEL LOGIC (Mars has different thresholds) ---
    const getWindStatus = (speed: number) => {
        if (isMarsMode) {
            // Mars: Lower wind speeds are considered normal
            if (speed > 200) return { text: 'DUST STORM RISK', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
            return { text: 'CALM', color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-900/30' };
        }
        if (speed > 600) return { text: 'STORM VELOCITY', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
        if (speed > 450) return { text: 'ELEVATED', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
        return { text: 'NOMINAL', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    };
    const windStatus = getWindStatus(solarWind.speed);

    const getKpStatus = (kp: number) => {
        if (isMarsMode) {
            // Mars has no global magnetic field
            return { text: 'NO MAGNETOSPHERE', color: 'text-red-500/80', bg: 'bg-red-950/20', border: 'border-red-900/30' };
        }
        if (kp >= 6) return { text: 'BLACKOUT RISK', color: 'text-red-400 animate-pulse', bg: 'bg-red-500/10', border: 'border-red-500/30' };
        if (kp >= 4) return { text: 'RADIO FADE', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
        return { text: 'STABLE', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    };
    const kpStatus = getKpStatus(geomagnetic.kp_index);

    return (
        <div className="flex flex-col gap-4 w-full">

            {/* MODULE 1: SOLAR WIND / ATMOSPHERE */}
            <div className={`border ${windStatus.border} ${windStatus.bg} p-4 rounded-sm relative overflow-hidden transition-colors`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${windStatus.color.includes('red') ? 'bg-red-500' : windStatus.color.includes('amber') ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                <div className="mb-2 flex justify-between items-end">
                    <span className={`font-mono text-[11px] tracking-[0.2em] font-medium ${themeColors.label}`}>
                        {isMarsMode ? 'ATMOSPHERE' : 'SOLAR WIND'}
                    </span>
                    <span className={`font-mono text-[10px] ${themeColors.muted}`}>
                        {isMarsMode ? 'MEDA SENSOR' : 'DSCOVR L1'}
                    </span>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                    <span className={`font-mono text-4xl tracking-tight ${isMarsMode ? 'text-red-100' : 'text-white'} ${themeColors.glow}`}>
                        {solarWind.speed.toFixed(0)}
                    </span>
                    <span className={`font-mono text-sm ${isMarsMode ? 'text-red-400/60' : 'text-zinc-400'}`}>
                        {isMarsMode ? 'm/s' : 'km/s'}
                    </span>
                </div>

                <div className={`font-mono text-[11px] tracking-wider border-t pt-2 ${isMarsMode ? 'border-red-900/30' : 'border-zinc-700'} ${windStatus.color}`}>
                    {windStatus.text}
                </div>
            </div>

            {/* MODULE 2: GEOMAGNETIC / RADIATION */}
            <div className={`border ${kpStatus.border} ${kpStatus.bg} p-4 rounded-sm relative overflow-hidden transition-colors`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${kpStatus.color.includes('red') ? 'bg-red-500' : kpStatus.color.includes('amber') ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                <div className="mb-2 flex justify-between items-end">
                    <span className={`font-mono text-[11px] tracking-[0.2em] font-medium ${themeColors.label}`}>
                        {isMarsMode ? 'RADIATION' : 'GEOMAGNETIC'}
                    </span>
                    <span className={`font-mono text-[10px] ${themeColors.muted}`}>
                        {isMarsMode ? 'RAD SENSOR' : 'NOAA SWPC'}
                    </span>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                    <span className={`font-mono text-4xl tracking-tight ${isMarsMode ? 'text-red-100' : (geomagnetic.kp_index >= 5 ? 'text-amber-300' : 'text-white')} ${themeColors.glow}`}>
                        {isMarsMode ? '~2.5' : geomagnetic.kp_index.toFixed(1)}
                    </span>
                    <span className={`font-mono text-sm ${isMarsMode ? 'text-red-400/60' : 'text-zinc-400'}`}>
                        {isMarsMode ? 'mSv/day' : 'Kp'}
                    </span>
                </div>

                {/* Scale Bar */}
                <div className={`w-full h-2 rounded-sm mb-2 overflow-hidden ${isMarsMode ? 'bg-red-950' : 'bg-zinc-800'}`}>
                    <div
                        className={`h-full transition-all duration-500 ${isMarsMode ? 'bg-red-600' :
                            (geomagnetic.kp_index >= 7 ? 'bg-red-500' :
                                geomagnetic.kp_index >= 5 ? 'bg-amber-500' :
                                    geomagnetic.kp_index >= 4 ? 'bg-yellow-500' :
                                        'bg-emerald-500')
                            }`}
                        style={{ width: isMarsMode ? '30%' : `${(geomagnetic.kp_index / 9) * 100}%` }}
                    />
                </div>

                <div className={`font-mono text-[11px] tracking-wider ${kpStatus.color}`}>
                    {kpStatus.text}
                </div>
            </div>

            {/* MODULE 3: DENSITY & TEMP (Compact) */}
            <div className="grid grid-cols-2 gap-3">
                <div className={`border p-3 rounded-sm ${isMarsMode ? 'border-red-900/30 bg-red-950/20' : 'border-zinc-700 bg-zinc-900/50'}`}>
                    <div className={`font-mono text-[10px] mb-1 ${isMarsMode ? 'text-red-400/60' : 'text-zinc-400'}`}>
                        {isMarsMode ? 'PRESSURE' : 'DENSITY'}
                    </div>
                    <div className={`font-mono text-xl ${isMarsMode ? 'text-red-100' : 'text-white'}`}>
                        {isMarsMode ? '610' : (solarWind.density?.toFixed(1) ?? '--')}
                    </div>
                    <div className={`font-mono text-[9px] ${themeColors.muted}`}>
                        {isMarsMode ? 'Pa' : 'p/cm³'}
                    </div>
                </div>
                <div className={`border p-3 rounded-sm ${isMarsMode ? 'border-red-900/30 bg-red-950/20' : 'border-zinc-700 bg-zinc-900/50'}`}>
                    <div className={`font-mono text-[10px] mb-1 ${isMarsMode ? 'text-red-400/60' : 'text-zinc-400'}`}>TEMP</div>
                    <div className={`font-mono text-xl ${isMarsMode ? 'text-red-100' : 'text-white'}`}>
                        {isMarsMode ? '-63' : (solarWind.temperature ? (solarWind.temperature / 1000).toFixed(0) : '--')}
                        {!isMarsMode && 'k'}
                    </div>
                    <div className={`font-mono text-[9px] ${themeColors.muted}`}>
                        {isMarsMode ? '°C' : 'Kelvin'}
                    </div>
                </div>
            </div>

            {/* SYSTEM CLOCK */}
            <div className={`pt-3 text-center border-t ${isMarsMode ? 'border-red-900/30' : 'border-zinc-800'}`}>
                <div className={`font-mono text-[10px] tracking-wider ${themeColors.muted}`}>
                    {isMarsMode ? 'MARS SOL TIME' : 'LAST SYNC'}: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '--:--:--'}
                </div>
            </div>
        </div>
    );
}