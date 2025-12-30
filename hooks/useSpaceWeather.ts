/**
 * useSpaceWeather Hook
 * 
 * Manages automated polling of space weather data every 60 seconds.
 * Integrates with Zustand store and applies sonification algorithms.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { mapSpaceWeatherToAudio } from '@/lib/audio/sonification';
import { SpaceWeatherData } from '@/types/nasa';

// Hardcoded fallback to ensure UI never sticks
const FALLBACK_DATA: SpaceWeatherData = {
  timestamp: new Date().toISOString(),
  solar_wind: { speed: 450, density: 5.5, temperature: 100000, timestamp: new Date().toISOString() },
  geomagnetic: { kp_index: 3, storm_active: false, storm_level: "None", timestamp: new Date().toISOString() },
  flares: [],
  data_source: 'demo'
};

export interface UseSpaceWeatherOptions {
  /**
   * Polling interval in milliseconds (default: 60000 = 60 seconds)
   */
  pollInterval?: number;

  /**
   * Whether to start polling automatically (default: true)
   */
  autoStart?: boolean;

  /**
   * Use demo mode instead of live data (default: false)
   */
  demoMode?: boolean;

  /**
   * Callback when data is successfully fetched
   */
  onDataUpdate?: (data: SpaceWeatherData) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Hook to automatically poll space weather data and update audio parameters
 */
export function useSpaceWeatherPolling(options: UseSpaceWeatherOptions = {}) {
  const {
    pollInterval = 60000, // 60 seconds
    autoStart = true,
    demoMode = false,
    onDataUpdate,
    onError,
  } = options;

  // Zustand store actions and state
  const {
    spaceWeatherData,
    isLoading,
    error,
    isDemoMode, // Get current mode
    updateSpaceWeatherData,
    updateAudioParams,
    setLoading,
    setError,
    setDemoMode,
  } = useAudioStore();

  // ... refs ...
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  /**
   * Fetch space weather data from API
   */
  const fetchData = useCallback(async () => {
    // If we are in specific demo mode (Mars, Carrington, etc) set by other components, 
    // we pause polling to avoid overwriting their injected data.
    // Unless the hook itself was instantiated with demoMode=true (legacy behavior)
    if (isDemoMode && !demoMode) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = (demoMode || isDemoMode)
        ? '/api/space-weather?demo=true'
        : '/api/space-weather';

      // Client-side timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Revert to API
        const data: SpaceWeatherData = await response.json();

        // Even if unmounted, we log. But only update state if mounted (mostly)
        // CRITICAL FIX: Always update store, even if unmounted. Store is global.
        updateSpaceWeatherData(data);
        updateAudioParams(mapSpaceWeatherToAudio(data));
        retryCountRef.current = 0;

        if (isMountedRef.current) {
          onDataUpdate?.(data);
        }

      } catch (fetchErr) {
        clearTimeout(timeoutId);
        throw fetchErr;
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('[useSpaceWeatherPolling] Failed to fetch:', error);

      // Retry Logic & Fallback
      retryCountRef.current++;

      if (retryCountRef.current >= MAX_RETRIES) {
        console.warn('[useSpaceWeatherPolling] Max retries reached. Using CLIENT FALLBACK.');

        // CLIENT-SIDE FALLBACK (Bypassing API)
        if (isMountedRef.current) {
          updateSpaceWeatherData(FALLBACK_DATA);
          updateAudioParams(mapSpaceWeatherToAudio(FALLBACK_DATA));
          setError(null);
          setDemoMode(true);
          retryCountRef.current = 0;
        }
      } else {
        if (isMountedRef.current) {
          setError(`Signal Lost. Retrying... (${retryCountRef.current}/${MAX_RETRIES})`);
        }
      }
    } finally {
      // ALWAYS clear loading, even if unmounted. 
      // Since store is global, we must reset the flag to prevent other components from seeing stuck loading state.
      setLoading(false);
    }
  }, [
    demoMode,
    updateSpaceWeatherData,
    updateAudioParams,
    setLoading,
    setError,
    onDataUpdate,
    onError,
    setDemoMode,
    isDemoMode // Added dependency
  ]);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    fetchData();

    intervalRef.current = setInterval(() => {
      fetchData();
    }, pollInterval);
  }, [fetchData, pollInterval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Manually trigger a fetch
   */
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Removed useEffect that forced setDemoMode(demoMode) to allow global store to manage simulation state.
  // External components (SourceSelector, ArchiveUnlock) now control entering/exiting demo mode.

  // Auto-start polling on mount
  useEffect(() => {
    if (autoStart) {
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [autoStart, startPolling, stopPolling]);

  return {
    data: spaceWeatherData,
    isLoading,
    error,
    refetch,
    startPolling,
    stopPolling,
    retryCount: retryCountRef.current,
  };
}

/**
 * Simple hook to just get the current space weather data
 */
export function useSpaceWeatherData() {
  const { spaceWeatherData, isLoading, error } = useAudioStore();

  return {
    data: spaceWeatherData,
    isLoading,
    error,
  };
}
