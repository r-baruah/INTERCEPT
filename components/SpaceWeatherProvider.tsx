'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/store/audioStore';

const POLL_INTERVAL = 30000; // 30 seconds (matches server caching)

export function SpaceWeatherProvider({ children }: { children: React.ReactNode }) {
    const { updateSpaceWeatherData, setLoading, setError } = useAudioStore();
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/space-weather');

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }

            const data = await response.json();
            updateSpaceWeatherData(data);
            setLoading(false);
        } catch (error) {
            console.error('Space weather fetch error:', error);
            setError(error instanceof Error ? error.message : 'Connection failed');
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();

        // Setup polling
        pollTimerRef.current = setInterval(fetchData, POLL_INTERVAL);

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
            }
        };
    }, []);

    return <>{children}</>;
}
