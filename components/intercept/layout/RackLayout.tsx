'use client';

import { ReactNode } from 'react';

interface RackLayoutProps {
    telemetrySlot: ReactNode;
    scopeSlot: ReactNode;
    logSlot: ReactNode;
    headerSlot: ReactNode;
    footerSlot: ReactNode;
}

/**
 * RackLayout - INTERCEPT Main Grid
 * FIXED: Stable layout with fixed heights to prevent content shift
 */
export function RackLayout({
    telemetrySlot,
    scopeSlot,
    logSlot,
    headerSlot,
    footerSlot
}: RackLayoutProps) {
    return (
        <div className="w-full h-screen flex flex-col bg-black relative overflow-hidden">

            {/* HEADER - Fixed Height */}
            <header className="h-14 md:h-16 flex-shrink-0 border-b border-zinc-800 flex items-center px-4 md:px-6 bg-black/80 backdrop-blur-sm z-20">
                {headerSlot}
            </header>

            {/* MAIN CONTENT - Fills remaining space */}
            <main className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-3 md:p-4 overflow-hidden">

                {/* Left Column: Telemetry (3 cols on desktop) */}
                <aside className="hidden md:flex md:col-span-3 flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 relative">
                    {/* Rack Mounting Visual */}
                    <div className="absolute top-0 bottom-0 left-0 w-1 flex flex-col justify-between py-2 opacity-30">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className="w-1 h-1 bg-zinc-500 rounded-full" />
                        ))}
                    </div>
                    <div className="pl-3">
                        {telemetrySlot}
                    </div>
                </aside>

                {/* Center Column: Scope & Tuner (6 cols on desktop) */}
                <section className="col-span-1 md:col-span-6 flex flex-col min-h-0 border border-zinc-800 rounded-sm bg-zinc-950/50 overflow-hidden">
                    {/* Scope - Takes available space */}
                    <div className="flex-1 min-h-0 relative">
                        {scopeSlot}
                    </div>
                    {/* Footer/Tuner - Fixed auto height */}
                    <div className="flex-shrink-0 border-t border-zinc-800">
                        {footerSlot}
                    </div>
                </section>

                {/* Right Column: Logs (3 cols on desktop) */}
                <aside className="hidden md:flex md:col-span-3 flex-col gap-3 overflow-y-auto custom-scrollbar pl-2 relative">
                    {/* Rack Mounting Visual */}
                    <div className="absolute top-0 bottom-0 right-0 w-1 flex flex-col justify-between py-2 opacity-30">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className="w-1 h-1 bg-zinc-500 rounded-full" />
                        ))}
                    </div>
                    <div className="pr-3">
                        {logSlot}
                    </div>
                </aside>
            </main>

            {/* Global Noise Overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-30 opacity-[0.015]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    mixBlendMode: 'overlay'
                }}
            />
        </div>
    );
}
