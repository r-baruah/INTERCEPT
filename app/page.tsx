'use client';

import { useState, useEffect } from 'react';
import { StatusPanel } from '@/components/ui/StatusPanel';
import { DJConsole } from '@/components/ui/DJConsole';
import { BroadcastPanel } from '@/components/ui/BroadcastPanel';
import { OrbitalMap } from '@/components/ui/OrbitalMap';
import { SpaceWeatherProvider } from '@/components/SpaceWeatherProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

/**
 * LiveClock Component
 * Displays current mission time with live updates
 */
function LiveClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!time) return <span className="text-xs font-mono">T+ --:--:--</span>;

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    return (
        <span className="text-xs font-mono tabular-nums">
            T+ {hours}:{minutes}:{seconds}
        </span>
    );
}

/**
 * StatusIndicator Component
 * Shows system status with accessible label
 */
function StatusIndicator({ status = 'nominal' }: { status?: 'nominal' | 'warning' | 'critical' }) {
    const colors = {
        nominal: 'text-green-500',
        warning: 'text-yellow-500',
        critical: 'text-red-500',
    };

    return (
        <span
            className={`text-xs font-mono ${colors[status]}`}
            role="status"
            aria-label={`System status: ${status}`}
        >
            {status.toUpperCase()}
        </span>
    );
}

export default function Home() {
    return (
        <SpaceWeatherProvider>
            <main
                className="min-h-screen max-h-screen bg-black text-white p-2 md:p-4 flex flex-col font-sans overflow-hidden select-none"
                role="main"
                aria-label="Cosmic Radio Dashboard"
            >

                {/* SpaceX Style Header */}
                <header
                    className="flex justify-between items-end border-b border-[#262626] pb-2 mb-4 h-12 flex-shrink-0"
                    role="banner"
                >
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold uppercase tracking-[0.2em] pl-2">
                            Cosmic Radio
                        </h1>
                        <span
                            className="text-[10px] text-zinc-600 font-mono tracking-widest border-l border-zinc-800 pl-4 py-1 hidden sm:block"
                            aria-label="Subtitle"
                        >
                            INTERSTELLAR SONIFICATION ARRAY
                        </span>
                    </div>
                    <div className="flex gap-6 pr-4" aria-label="Status indicators">
                        <div className="text-right">
                            <span className="block text-[9px] text-zinc-500 uppercase tracking-widest leading-tight">
                                Mission Time
                            </span>
                            <LiveClock />
                        </div>
                        <div className="text-right hidden sm:block">
                            <span className="block text-[9px] text-zinc-500 uppercase tracking-widest leading-tight">
                                Status
                            </span>
                            <StatusIndicator status="nominal" />
                        </div>
                    </div>
                </header>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-4 flex-1 min-h-0">

                    {/* LEFT COLUMN: Controls & Broadcast (3 cols) */}
                    <div className="lg:col-span-3 flex flex-col gap-4">

                        {/* Control Console */}
                        <section
                            className="sx-panel rounded-sm p-0 flex-shrink-0"
                            aria-labelledby="control-heading"
                        >
                            <div className="sx-panel-header">
                                <span id="control-heading" className="sx-panel-title">SYSTEM CONTROL</span>
                            </div>
                            <div className="p-4">
                                <ErrorBoundary>
                                    <DJConsole />
                                </ErrorBoundary>
                            </div>
                        </section>

                        {/* Broadcast Feed */}
                        <section
                            className="sx-panel rounded-sm flex-1 flex flex-col min-h-0"
                            aria-labelledby="feed-heading"
                        >
                            <div className="sx-panel-header">
                                <span id="feed-heading" className="sx-panel-title">LIVE FEED</span>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                                <ErrorBoundary>
                                    <BroadcastPanel />
                                </ErrorBoundary>
                            </div>
                        </section>

                    </div>

                    {/* CENTER COLUMN: Visualization (6 cols) */}
                    <div className="lg:col-span-6 flex flex-col">
                        <section
                            className="sx-panel rounded-sm w-full h-full relative border border-[#262626] bg-[#050505] flex flex-col"
                            aria-labelledby="viz-heading"
                        >

                            {/* Viz Header */}
                            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between p-4 pointer-events-none">
                                <div className="flex flex-col">
                                    <span id="viz-heading" className="text-xs font-bold font-mono text-white">ORBITAL VIEW</span>
                                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest">SOLAR SYSTEM [LOCAL]</span>
                                </div>
                                <div className="border border-white/20 px-2 py-1 bg-black/50">
                                    <span className="text-[9px] font-mono text-white">LIVE TELEMETRY</span>
                                </div>
                            </div>

                            {/* Main Visualization */}
                            <div className="flex-1 relative overflow-hidden">
                                <ErrorBoundary>
                                    <OrbitalMap />
                                </ErrorBoundary>

                                {/* Crosshair Overlay */}
                                <div className="absolute inset-0 pointer-events-none opacity-20" aria-hidden="true">
                                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50" />
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50" />
                                    <div className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 border border-white/30 rounded-full" />
                                </div>
                            </div>

                            {/* Bottom Data Overlay */}
                            <div className="h-24 border-t border-[#262626] bg-[#0a0a0a] p-4 flex justify-between items-center z-10">
                                <div className="flex gap-8">
                                    <div>
                                        <span className="sx-label block mb-1">Signal Strength</span>
                                        <div className="flex gap-0.5 items-end h-4" aria-label="Signal strength: 4 of 5 bars">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div
                                                    key={i}
                                                    className="w-1 bg-green-500"
                                                    style={{ height: `${i * 20}%`, opacity: i === 5 ? 0.5 : 1 }}
                                                    aria-hidden="true"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="sx-label block mb-1">Downlink</span>
                                        <span className="font-mono text-sm">4.5 MBps</span>
                                    </div>
                                    <div className="hidden md:block">
                                        <span className="sx-label block mb-1">Uplink</span>
                                        <span className="font-mono text-sm">1.2 KBps</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: Telemetry (3 cols) */}
                    <div className="lg:col-span-3 flex flex-col h-full min-h-0">
                        <section
                            className="sx-panel rounded-sm h-full flex flex-col"
                            aria-labelledby="telemetry-heading"
                        >
                            <span id="telemetry-heading" className="sr-only">Space Weather Telemetry</span>
                            <ErrorBoundary>
                                <StatusPanel />
                            </ErrorBoundary>
                        </section>
                    </div>

                </div>
            </main>
        </SpaceWeatherProvider>
    );
}

