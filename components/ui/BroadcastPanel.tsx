'use client';

import { useState, useEffect, useRef } from 'react';
import { BroadcastMessage, BroadcastType, BroadcastPriority, BroadcastTone } from '@/types/broadcast';
import { getRandomDemoBroadcast, getInitialBroadcasts } from '@/lib/broadcast/demoBroadcasts';

interface BroadcastPanelProps {
    showHistory?: boolean;
    maxHistoryDisplay?: number;
    compact?: boolean;
    /** Enable demo mode with simulated broadcasts */
    demoMode?: boolean;
}

export function BroadcastPanel({
    showHistory = true,
    maxHistoryDisplay = 5,
    compact = false,
    demoMode = true  // Enable by default for now
}: BroadcastPanelProps) {
    const [currentBroadcast, setCurrentBroadcast] = useState<BroadcastMessage | null>(null);
    const [history, setHistory] = useState<BroadcastMessage[]>([]);
    const [isConnected, setIsConnected] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messageCount, setMessageCount] = useState(0);

    const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Show a broadcast
    const showBroadcast = (broadcast: BroadcastMessage) => {
        setCurrentBroadcast(broadcast);
        setHistory(prev => [broadcast, ...prev].slice(0, 20));
        setMessageCount(prev => prev + 1);

        // Audio Triggers
        if (typeof window !== 'undefined') {
            import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                const engine = getAudioEngine();
                const state = engine.getState();

                if (state.isInitialized) {
                    // 1. Play Alert Sound & FX
                    if (broadcast.priority >= BroadcastPriority.URGENT) {
                        engine.triggerAlert('danger');
                        engine.createExplosion(); // Boom!
                    } else if (broadcast.priority >= BroadcastPriority.HIGH) {
                        engine.triggerAlert('warning');
                        if (broadcast.tone === BroadcastTone.DANGER) {
                            engine.createStatic(1.0); // Static interference
                        }
                    } else {
                        engine.triggerAlert('info');
                    }

                    // 2. Text to Speech (if enabled or audio preferred)
                    if (broadcast.hasAudio || broadcast.priority >= BroadcastPriority.HIGH) {
                        // Wait for alert to finish slightly
                        setTimeout(() => {
                            engine.speak(broadcast.content);
                        }, 500);
                    }
                }
            });
        }

        // Clear any existing dismiss timeout
        if (dismissTimeoutRef.current) {
            clearTimeout(dismissTimeoutRef.current);
        }

        // Auto-dismiss after TTL
        dismissTimeoutRef.current = setTimeout(() => {
            setCurrentBroadcast(prev => prev?.id === broadcast.id ? null : prev);
        }, broadcast.ttl || 10000);
    };

    // Initialize with demo/AI broadcasts
    useEffect(() => {
        if (demoMode) {
            // Load initial history
            const initial = getInitialBroadcasts(3);
            setHistory(initial);
            setMessageCount(initial.length);

            // Generate periodic AI broadcasts
            const generateAIBroadcast = async () => {
                try {
                    // Randomly decide context
                    const contexts = [
                        'Solar wind fluctuating',
                        'Interstellar background noise increasing',
                        'Void silence detected',
                        'Unknown artifact in signal',
                        'Cosmic ray bits flipped'
                    ];
                    const context = contexts[Math.floor(Math.random() * contexts.length)];

                    const res = await fetch('/api/broadcast/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            context,
                            type: 'AMBIENT_UPDATE'
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const broadcast: BroadcastMessage = {
                            id: 'ai-' + Date.now(),
                            type: BroadcastType.DJ_ANNOUNCEMENT,
                            priority: BroadcastPriority.HIGH,
                            tone: BroadcastTone.CINEMATIC,
                            headline: 'AI TELEMETRY OBSERVATION',
                            content: data.content,
                            timestamp: new Date(),
                            ttl: 12000,
                            icon: '🤖',
                            hasAudio: true, // This will trigger ElevenLabs
                        };
                        showBroadcast(broadcast);
                    }
                } catch (e) {
                    console.error("AI Broadcast generation failed", e);
                    // Fallback
                    showBroadcast(getRandomDemoBroadcast());
                }
            };

            // Start loop
            demoIntervalRef.current = setInterval(generateAIBroadcast, 60000); // Every 60s (reduced from 20s to be less annoying)
        }

        return () => {
            if (demoIntervalRef.current) {
                clearInterval(demoIntervalRef.current);
            }
            if (dismissTimeoutRef.current) {
                clearTimeout(dismissTimeoutRef.current);
            }
        };
    }, [demoMode]);

    const dismissCurrent = () => {
        setCurrentBroadcast(null);
        if (dismissTimeoutRef.current) {
            clearTimeout(dismissTimeoutRef.current);
        }
    };

    // Get tone indicator color
    const getToneColor = (tone: BroadcastTone) => {
        switch (tone) {
            case BroadcastTone.POSITIVE: return 'bg-green-500';
            case BroadcastTone.WARNING: return 'bg-yellow-500';
            case BroadcastTone.DANGER: return 'bg-red-500';
            case BroadcastTone.CINEMATIC: return 'bg-white';
            default: return 'bg-blue-500';
        }
    };

    const getPriorityLabel = (priority: BroadcastPriority) => {
        switch (priority) {
            case BroadcastPriority.CRITICAL: return 'CRITICAL';
            case BroadcastPriority.URGENT: return 'URGENT';
            case BroadcastPriority.HIGH: return 'HIGH';
            default: return null;
        }
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const timeSinceMessage = (date: Date) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    return (
        <div className={`flex flex-col gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>

            {/* Status Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#1a1a1a] mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                        {isConnected ? 'RECEIVING' : 'OFFLINE'}
                    </span>
                </div>
                <span className="text-[9px] text-zinc-600 font-mono">{messageCount} MSG</span>
            </div>

            {/* Active Broadcast */}
            {currentBroadcast ? (
                <div
                    className="relative bg-[#0a0a0a] border-l-2 pl-3 py-3 pr-3 animate-[slideIn_0.3s_ease-out]"
                    style={{ borderLeftColor: getToneColor(currentBroadcast.tone).replace('bg-', '') === 'white' ? 'white' : undefined }}
                >
                    {/* Colored indicator bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${getToneColor(currentBroadcast.tone)}`} />

                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">{currentBroadcast.icon}</span>
                            <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest">
                                {currentBroadcast.type.replace('_', ' ')}
                            </span>
                            {getPriorityLabel(currentBroadcast.priority) && (
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold tracking-wider ${currentBroadcast.priority >= BroadcastPriority.URGENT
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {getPriorityLabel(currentBroadcast.priority)}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={dismissCurrent}
                            className="text-zinc-600 hover:text-white transition-colors text-xs p-1"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <h4 className="text-white font-bold text-sm mb-1 tracking-tight">
                        {currentBroadcast.headline}
                    </h4>
                    <p className="text-zinc-400 font-mono text-xs leading-relaxed">
                        {currentBroadcast.content}
                    </p>

                    {/* Footer */}
                    <div className="mt-3 flex justify-between items-center text-[9px] text-zinc-600 font-mono">
                        <span>{formatTime(new Date(currentBroadcast.timestamp))}</span>
                        <span className="animate-pulse">●</span>
                    </div>
                </div>
            ) : (
                <div className="py-6 text-center border border-dashed border-[#222] bg-[#050505] rounded">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-zinc-700 text-lg">📡</span>
                        <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                            Monitoring Frequencies
                        </span>
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-zinc-700 rounded-full animate-pulse" />
                            <span className="w-1 h-1 bg-zinc-700 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1 h-1 bg-zinc-700 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* History Section */}
            {showHistory && history.length > 0 && (
                <div className="mt-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full text-left py-2 text-[9px] text-zinc-500 font-mono uppercase tracking-widest hover:text-white transition-colors flex items-center justify-between"
                    >
                        <span>Transmission Log ({history.length})</span>
                        <span className="text-zinc-600">{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    {isExpanded && (
                        <div className="space-y-px max-h-48 overflow-y-auto">
                            {history.slice(0, maxHistoryDisplay).map((msg, idx) => (
                                <div
                                    key={msg.id || idx}
                                    className="bg-[#080808] p-2 flex justify-between items-center hover:bg-[#0f0f0f] transition-colors border-l border-transparent hover:border-zinc-700"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">{msg.icon}</span>
                                        <span className="text-zinc-400 text-xs truncate max-w-[150px]">
                                            {msg.headline}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-zinc-700 font-mono">
                                        {timeSinceMessage(new Date(msg.timestamp))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
        </div>
    );
}
