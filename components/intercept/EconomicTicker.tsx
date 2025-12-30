'use client';

import { useMemo } from 'react';
import { useSpaceWeatherData } from '@/store/audioStore';
import { calculateEconomicImpact, formatCurrency } from '@/lib/physics/geoRisk';

/**
 * ECONOMIC DAMAGE TICKER
 * ENHANCED: Better visibility with increased z-index and brighter text
 * 
 * Shows scrolling ticker when Kp >= 4 with estimated hourly infrastructure costs.
 */
export function EconomicTicker() {
    const { data } = useSpaceWeatherData();

    const kpIndex = data?.geomagnetic?.kp_index ?? 0;
    const isStormActive = data?.geomagnetic?.storm_active ?? false;

    const economicImpact = useMemo(() => {
        return calculateEconomicImpact(kpIndex);
    }, [kpIndex]);

    // Don't render if impact is negligible (Kp < 4)
    if (economicImpact === null) {
        return null;
    }

    const formattedCost = formatCurrency(economicImpact);
    const severityLevel = kpIndex >= 7 ? 'CRITICAL' : kpIndex >= 5 ? 'SEVERE' : 'ELEVATED';

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] overflow-hidden bg-black border-t border-red-500/60">
            {/* Scrolling Marquee Container */}
            <div className="relative flex items-center h-10">
                {/* Static Warning Badge */}
                <div className="absolute left-0 z-10 h-full flex items-center px-4 bg-gradient-to-r from-black via-black/95 to-transparent min-w-[200px]">
                    <div className={`
                        flex items-center gap-2 font-mono text-[11px] tracking-widest font-medium
                        ${kpIndex >= 7 ? 'text-red-400' : 'text-amber-400'}
                    `}>
                        <span className={`w-2 h-2 rounded-full bg-current ${kpIndex >= 7 ? 'animate-pulse' : ''}`} />
                        <span className="drop-shadow-[0_0_5px_currentColor]">GRID STRESS: {severityLevel}</span>
                    </div>
                </div>

                {/* Marquee Content */}
                <div className="animate-marquee whitespace-nowrap flex items-center pl-[220px]">
                    <TickerContent cost={formattedCost} kp={kpIndex} isStorm={isStormActive} />
                    <span className="mx-16 text-zinc-600">◆</span>
                    <TickerContent cost={formattedCost} kp={kpIndex} isStorm={isStormActive} />
                    <span className="mx-16 text-zinc-600">◆</span>
                    <TickerContent cost={formattedCost} kp={kpIndex} isStorm={isStormActive} />
                </div>

                {/* Fade overlay on right */}
                <div className="absolute right-0 h-full w-20 bg-gradient-to-l from-black to-transparent" />
            </div>

            {/* Inline Keyframe Animation */}
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                }
            `}</style>
        </div>
    );
}

function TickerContent({ cost, kp, isStorm }: { cost: string; kp: number; isStorm: boolean }) {
    return (
        <span className="flex items-center gap-10 font-mono text-xs tracking-wide">
            <span className="text-red-400 font-bold">
                ESTIMATED IMPACT: <span className="text-white">{cost}/HR</span>
            </span>
            <span className="text-zinc-400">
                Kp <span className="text-white">{kp.toFixed(1)}</span> | {isStorm
                    ? <span className="text-red-400">STORM ACTIVE</span>
                    : <span className="text-amber-400">ELEVATED</span>
                }
            </span>
            <span className="text-amber-400/80">
                AIRLINE RE-ROUTING • SATELLITE DRAG • GRID FLUCTUATIONS
            </span>
        </span>
    );
}
