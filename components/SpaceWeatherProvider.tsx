'use client';

import { useSpaceWeatherPolling } from '@/hooks/useSpaceWeather';

const POLL_INTERVAL = 30000; // 30 seconds

export function SpaceWeatherProvider({ children }: { children: React.ReactNode }) {
    // useSpaceWeatherPolling handles fetching, store updates, and sonification mapping
    // Note: Auto-polling disabled here to let HUD control the fetch cycle and avoid double-fetching
    useSpaceWeatherPolling({
        pollInterval: POLL_INTERVAL,
        autoStart: false 
    });

    return <>{children}</>;
}
