/**
 * useBroadcast Hook
 * 
 * React hook for subscribing to cosmic radio broadcasts
 * Handles polling, state management, and broadcast notifications
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BroadcastMessage, BroadcastType, BroadcastPriority, BroadcastHistoryEntry } from '@/types/broadcast';

interface UseBroadcastOptions {
    /** Enable/disable polling */
    enabled?: boolean;
    /** Poll interval in ms (default: 5000) */
    pollInterval?: number;
    /** Maximum history to keep */
    maxHistory?: number;
    /** Callback when new broadcast received */
    onBroadcast?: (broadcast: BroadcastMessage) => void;
}

interface UseBroadcastReturn {
    /** Current active broadcast */
    currentBroadcast: BroadcastMessage | null;
    /** Broadcast history */
    history: BroadcastMessage[];
    /** Is actively polling */
    isConnected: boolean;
    /** Connection error */
    error: string | null;
    /** Dismiss current broadcast */
    dismissCurrent: () => void;
    /** Clear history */
    clearHistory: () => void;
    /** Manually trigger a refresh */
    refresh: () => Promise<void>;
    /** Connection stats */
    stats: {
        totalReceived: number;
        lastReceivedAt: Date | null;
        uptime: number;
    };
}

// Generate unique client ID
const generateClientId = (): string => {
    if (typeof window !== 'undefined') {
        let id = sessionStorage.getItem('broadcast_client_id');
        if (!id) {
            id = 'client_' + Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('broadcast_client_id', id);
        }
        return id;
    }
    return 'server';
};

export function useBroadcast(options: UseBroadcastOptions = {}): UseBroadcastReturn {
    const {
        enabled = true,
        pollInterval = 5000,
        maxHistory = 20,
        onBroadcast,
    } = options;

    const [currentBroadcast, setCurrentBroadcast] = useState<BroadcastMessage | null>(null);
    const [history, setHistory] = useState<BroadcastMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalReceived: 0,
        lastReceivedAt: null as Date | null,
        uptime: 0,
    });

    const clientIdRef = useRef<string>('');
    const lastPollRef = useRef<number>(0);
    const startTimeRef = useRef<number>(Date.now());
    const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const onBroadcastRef = useRef(onBroadcast);

    // Keep callback ref updated
    useEffect(() => {
        onBroadcastRef.current = onBroadcast;
    }, [onBroadcast]);

    // Initialize client ID
    useEffect(() => {
        clientIdRef.current = generateClientId();
    }, []);

    // Fetch broadcasts
    const fetchBroadcasts = useCallback(async () => {
        if (!enabled) return;

        try {
            const params = new URLSearchParams({
                clientId: clientIdRef.current,
                since: lastPollRef.current.toString(),
            });

            const response = await fetch(`/api/broadcast?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            lastPollRef.current = Date.now();

            setIsConnected(true);
            setError(null);

            if (data.broadcasts && data.broadcasts.length > 0) {
                // Process new broadcasts
                const newBroadcasts = data.broadcasts.map((b: BroadcastMessage) => ({
                    ...b,
                    timestamp: new Date(b.timestamp),
                }));

                // Update history
                setHistory(prev => {
                    const updated = [...newBroadcasts, ...prev].slice(0, maxHistory);
                    return updated;
                });

                // Set current broadcast (highest priority new one)
                const highest = newBroadcasts.reduce((max: BroadcastMessage, b: BroadcastMessage) =>
                    (b.priority || 0) > (max?.priority || 0) ? b : max
                    , newBroadcasts[0]);

                if (highest) {
                    setCurrentBroadcast(highest);

                    // Call callback
                    onBroadcastRef.current?.(highest);

                    // Auto-dismiss after TTL
                    if (highest.ttl) {
                        setTimeout(() => {
                            setCurrentBroadcast(prev =>
                                prev?.id === highest.id ? null : prev
                            );
                        }, highest.ttl);
                    }
                }

                // Update stats
                setStats(prev => ({
                    totalReceived: prev.totalReceived + newBroadcasts.length,
                    lastReceivedAt: new Date(),
                    uptime: Date.now() - startTimeRef.current,
                }));
            }

        } catch (err) {
            console.error('Broadcast fetch error:', err);
            setError(err instanceof Error ? err.message : 'Connection failed');
            setIsConnected(false);
        }
    }, [enabled, maxHistory]);

    // Polling loop
    useEffect(() => {
        if (!enabled) {
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
            }
            return;
        }

        const poll = async () => {
            await fetchBroadcasts();
            pollTimeoutRef.current = setTimeout(poll, pollInterval);
        };

        // Initial fetch
        poll();

        return () => {
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
            }
        };
    }, [enabled, pollInterval, fetchBroadcasts]);

    // Dismiss current broadcast
    const dismissCurrent = useCallback(() => {
        setCurrentBroadcast(null);
    }, []);

    // Clear history
    const clearHistory = useCallback(() => {
        setHistory([]);
        setStats(prev => ({
            ...prev,
            totalReceived: 0,
        }));
    }, []);

    // Manual refresh
    const refresh = useCallback(async () => {
        await fetchBroadcasts();
    }, [fetchBroadcasts]);

    return {
        currentBroadcast,
        history,
        isConnected,
        error,
        dismissCurrent,
        clearHistory,
        refresh,
        stats: {
            ...stats,
            uptime: Date.now() - startTimeRef.current,
        },
    };
}
