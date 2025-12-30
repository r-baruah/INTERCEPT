'use client';

import { useState, useEffect } from 'react';

interface BootSequenceProps {
    onComplete: () => void;
}

const BOOT_LOGS = [
    { text: 'INITIALIZING INTERCEPT KERNEL v2.5.0...', delay: 200 },
    { text: 'LOADING PHYSICS ENGINE (TONE.JS)... OK', delay: 800 },
    { text: 'CONNECTING TO NASA DISCOVR SATELLITE...', delay: 1500 },
    { text: 'ESTABLISHING HANDSHAKE WITH NOAA SWPC...', delay: 2200 },
    { text: 'CALIBRATING AUDIO OSCILLATORS...', delay: 2800 },
    { text: 'SYNCHRONIZING SOLAR WIND DATA STREAM...', delay: 3500 },
    { text: 'SYSTEM READY. AWAITING USER INPUT.', delay: 4500 },
];

export function BootSequence({ onComplete }: BootSequenceProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex >= BOOT_LOGS.length) {
            const timer = setTimeout(onComplete, 1000);
            return () => clearTimeout(timer);
        }

        const currentLog = BOOT_LOGS[currentIndex];
        const timer = setTimeout(() => {
            setLogs(prev => [...prev, currentLog.text]);
            setCurrentIndex(prev => prev + 1);
        }, currentLog.delay - (currentIndex > 0 ? BOOT_LOGS[currentIndex - 1].delay : 0));

        return () => clearTimeout(timer);
    }, [currentIndex, onComplete]);

    return (
        <div className="fixed inset-0 z-[60] bg-black font-mono text-xs md:text-sm text-green-500 p-8 md:p-12 overflow-hidden selection:bg-green-500 selection:text-black">
            <div className="max-w-2xl mx-auto h-full flex flex-col justify-end pb-20">
                {logs.map((log, i) => (
                    <div key={i} className="mb-2 tracking-wider">
                        <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                        {log}
                    </div>
                ))}
                <div className="animate-pulse mt-2">_</div>
            </div>
            
            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] opacity-20" />
        </div>
    );
}
