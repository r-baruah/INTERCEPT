'use client';

import { useState, useEffect } from 'react';
import { Rack } from './components/Rack';

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

    if (!time) return <span className=\
text-xs
font-mono\>T+ --:--:--</span>;

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    return (
        <span className=\text-xs
font-mono
tabular-nums\>
            T+ {hours}:{minutes}:{seconds}
        </span>
    );
}

export default function App() {
    return (
        <main className=\min-h-screen
bg-black
text-white
p-4\>
            <header className=\mb-8\>
                <h1 className=\text-2xl
font-bold\>Cosmic Radio</h1>
                <p className=\text-zinc-400\>Interstellar Sonification Array</p>
                <LiveClock />
            </header>
            
            <Rack />
            
            {/* TODO: Build UI */}
            <div className=\mt-8
p-4
border
border-zinc-800
rounded\>
                <h2 className=\text-lg
font-mono
mb-2\>TODO: Build UI</h2>
                <p className=\text-zinc-400
text-sm\>
                    Advanced components will be implemented here
                </p>
            </div>
        </main>
    );
}
