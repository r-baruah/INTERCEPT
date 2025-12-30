'use client';

import { useMemo } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSpaceWeatherData } from '@/store/audioStore';
import { calculateGeoRisk, formatDelta, GeoRiskStatus as RiskStatus } from '@/lib/physics/geoRisk';

/**
 * GEO-RISK STATUS DISPLAY
 * ENHANCED: Better text visibility and contrast
 * 
 * Shows the user's real-time risk level based on their position
 * relative to the Auroral Oval boundary.
 */
export function GeoRiskStatus() {
    const { latitude, isLoading: geoLoading, error: geoError } = useGeolocation();
    const { data } = useSpaceWeatherData();

    const kpIndex = data?.geomagnetic?.kp_index ?? 0;

    const riskResult = useMemo(() => {
        if (latitude === null) return null;
        return calculateGeoRisk(latitude, kpIndex);
    }, [latitude, kpIndex]);

    if (geoLoading) {
        return (
            <div className="border border-zinc-700 bg-zinc-900/50 p-4 rounded-sm">
                <div className="font-mono text-[11px] text-zinc-400 tracking-[0.2em] mb-2">
                    GEO-RISK
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
                    <span className="font-mono text-xs text-zinc-400 animate-pulse">
                        ACQUIRING POSITION...
                    </span>
                </div>
            </div>
        );
    }

    if (!riskResult) {
        return null;
    }

    const statusColors: Record<RiskStatus, { bg: string; border: string; text: string; glow: string }> = {
        CRITICAL: {
            bg: 'bg-red-500/15',
            border: 'border-red-500/60',
            text: 'text-red-400',
            glow: 'shadow-[0_0_25px_rgba(239,68,68,0.4)]'
        },
        WARNING: {
            bg: 'bg-amber-500/15',
            border: 'border-amber-500/60',
            text: 'text-amber-400',
            glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
        },
        NOMINAL: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/40',
            text: 'text-emerald-400',
            glow: ''
        }
    };

    const colors = statusColors[riskResult.status];

    return (
        <div className={`
            border ${colors.border} ${colors.bg} p-4 rounded-sm relative overflow-hidden
            transition-all duration-500 ${colors.glow}
            ${riskResult.status === 'CRITICAL' ? 'animate-pulse' : ''}
        `}>
            {/* Accent Bar */}
            <div
                className="absolute top-0 left-0 w-1 h-full transition-colors duration-500"
                style={{ backgroundColor: riskResult.color }}
            />

            {/* Header */}
            <div className="mb-2 flex justify-between items-end">
                <span className="font-mono text-[11px] tracking-[0.2em] text-zinc-300 font-medium">
                    GEO-RISK LEVEL
                </span>
                <span className={`font-mono text-[10px] ${geoError ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {geoError ? 'ESTIMATED' : '● LIVE'}
                </span>
            </div>

            {/* Status Label */}
            <div className={`
                font-mono text-xl tracking-widest mb-3 font-bold
                ${colors.text}
            `}
                style={{
                    textShadow: riskResult.status === 'CRITICAL' ? '0 0 15px rgba(239,68,68,0.8)' :
                        riskResult.status === 'WARNING' ? '0 0 12px rgba(245,158,11,0.6)' :
                            '0 0 8px rgba(52,211,153,0.4)'
                }}
            >
                {riskResult.label}
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono border-t border-zinc-700 pt-3">
                <div>
                    <div className="text-zinc-500 mb-1">YOUR LAT</div>
                    <div className="text-white text-sm">{riskResult.magneticLat.toFixed(1)}°</div>
                </div>
                <div>
                    <div className="text-zinc-500 mb-1">OVAL EDGE</div>
                    <div className="text-white text-sm">{riskResult.auroralBoundary.toFixed(1)}°</div>
                </div>
                <div className="col-span-2 mt-1">
                    <div className="text-zinc-500 mb-1">MARGIN TO IMPACT</div>
                    <div className={`text-xl font-bold ${colors.text}`}
                        style={{
                            textShadow: riskResult.status !== 'NOMINAL' ? `0 0 10px ${riskResult.color}60` : 'none'
                        }}
                    >
                        {formatDelta(riskResult.delta)}
                    </div>
                </div>
            </div>

            {/* Visual Indicator Bar */}
            <div className="mt-3 h-2 bg-zinc-800 rounded-sm overflow-hidden">
                <div
                    className="h-full transition-all duration-500 rounded-sm"
                    style={{
                        width: `${Math.min(100, Math.max(5, (riskResult.delta + 20) / 40 * 100))}%`,
                        backgroundColor: riskResult.color,
                        boxShadow: `0 0 8px ${riskResult.color}80`
                    }}
                />
            </div>
        </div>
    );
}
