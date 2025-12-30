'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpaceWeatherData, useAudioStore } from '@/store/audioStore';

interface LogEntry {
    id: string;
    type: 'flare' | 'storm' | 'wind_surge' | 'system';
    title: string;
    timestamp: Date;
    data: Record<string, unknown>;
    witnessed: boolean;
}

/**
 * The Logbook - Rack Mount Version
 * ENHANCED: Better text visibility and contrast
 */
export function Logbook() {
    const { data } = useSpaceWeatherData();
    const { isPlaying } = useAudioStore();
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const recordedEventsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!isPlaying) return;

        // Initial System Log
        if (!recordedEventsRef.current.has('sys_init')) {
            addEntry({
                id: 'sys_init',
                type: 'system',
                title: 'SYSTEM INITIALIZED',
                timestamp: new Date(),
                data: {},
                witnessed: true
            });
            recordedEventsRef.current.add('sys_init');
        }

        if (!data) return;

        // Flares
        data.flares.forEach(flare => {
            if ((flare.classType === 'M' || flare.classType === 'X') && !recordedEventsRef.current.has(flare.id)) {
                addEntry({
                    id: flare.id,
                    type: 'flare',
                    title: `${flare.flareClass} SOLAR FLARE`,
                    timestamp: new Date(),
                    data: { class: flare.flareClass },
                    witnessed: true
                });
                recordedEventsRef.current.add(flare.id);
            }
        });

        // Storms
        if (data.geomagnetic.storm_active && data.geomagnetic.kp_index >= 5) {
            const stormId = `storm_${data.geomagnetic.kp_index}_${new Date().toDateString()}`;
            if (!recordedEventsRef.current.has(stormId)) {
                addEntry({
                    id: stormId,
                    type: 'storm',
                    title: `GEOMAGNETIC STORM (Kp${data.geomagnetic.kp_index})`,
                    timestamp: new Date(),
                    data: { kp: data.geomagnetic.kp_index },
                    witnessed: true
                });
                recordedEventsRef.current.add(stormId);
            }
        }
    }, [data, isPlaying]);

    const addEntry = (entry: LogEntry) => {
        setEntries(prev => [entry, ...prev].slice(0, 50));
    };

    return (
        <div className="flex flex-col h-full border border-zinc-700 rounded-sm bg-zinc-900/30 overflow-hidden">
            {/* Header */}
            <div className="bg-zinc-900/80 p-3 border-b border-zinc-700 flex justify-between items-center flex-shrink-0">
                <span className="font-mono text-[11px] tracking-[0.2em] text-zinc-300 font-medium">EVENT LOG</span>
                <span className="font-mono text-[10px] text-zinc-500">{entries.length} LOGGED</span>
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
                {entries.length === 0 ? (
                    <div className="p-6 text-center">
                        <div className="w-3 h-3 border border-zinc-600 border-t-zinc-400 rounded-full animate-spin mx-auto mb-3" />
                        <div className="font-mono text-[11px] text-zinc-500 tracking-widest">
                            AWAITING EVENTS...
                        </div>
                        <div className="font-mono text-[9px] text-zinc-600 mt-1">
                            Initiate link to begin
                        </div>
                    </div>
                ) : (
                    entries.map(entry => (
                        <div
                            key={entry.id}
                            className={`
                                bg-black/50 border p-3 rounded-sm transition-all duration-200
                                hover:bg-zinc-800/30
                                ${getTypeBorder(entry.type)}
                            `}
                        >
                            {/* Type Icon + Title */}
                            <div className="flex items-start gap-2 mb-1">
                                <span className={`text-sm ${getTypeColor(entry.type)}`}>
                                    {getTypeIcon(entry.type)}
                                </span>
                                <span className={`font-mono text-[11px] tracking-wide font-medium ${getTypeColor(entry.type)}`}>
                                    {entry.title}
                                </span>
                            </div>

                            {/* Timestamp */}
                            <div className="font-mono text-[10px] text-zinc-500 pl-5">
                                {entry.timestamp.toLocaleTimeString()} UTC
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function getTypeColor(type: LogEntry['type']) {
    switch (type) {
        case 'flare': return 'text-amber-400';
        case 'storm': return 'text-red-400';
        case 'wind_surge': return 'text-cyan-400';
        case 'system': return 'text-zinc-400';
        default: return 'text-white';
    }
}

function getTypeBorder(type: LogEntry['type']) {
    switch (type) {
        case 'flare': return 'border-amber-500/30';
        case 'storm': return 'border-red-500/30';
        case 'wind_surge': return 'border-cyan-500/30';
        case 'system': return 'border-zinc-700';
        default: return 'border-zinc-700';
    }
}

function getTypeIcon(type: LogEntry['type']) {
    switch (type) {
        case 'flare': return '☀';
        case 'storm': return '⚡';
        case 'wind_surge': return '💨';
        case 'system': return '◉';
        default: return '○';
    }
}