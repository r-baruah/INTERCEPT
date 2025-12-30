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
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, isLoading, error, refetch } = useSpaceWeatherPolling({
 *     pollInterval: 60000,
 *     demoMode: false
 *   });
 * 
 *   return <div>Kp Index: {data?.geomagnetic.kp_index}</div>;
 * }
 * ```
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
    updateSpaceWeatherData,
    updateAudioParams,
    setLoading,
    setError,
    setDemoMode,
  } = useAudioStore();

  // Refs for cleanup and preventing stale closures
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  /**
   * Fetch space weather data from API
   */
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = demoMode 
        ? '/api/space-weather?demo=true' 
        : '/api/space-weather';

      console.log(`Fetching space weather data from ${url}...`);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SpaceWeatherData = await response.json();

      if (!isMountedRef.current) return;

      // Update store with new data
      updateSpaceWeatherData(data);

      // Calculate audio parameters from space weather data
      const audioParams = mapSpaceWeatherToAudio(data);
      updateAudioParams(audioParams);

      // Reset retry counter on success
      retryCountRef.current = 0;

      // Call success callback
      onDataUpdate?.(data);

      console.log('Space weather data fetched successfully:', {
        timestamp: data.timestamp,
        source: data.data_source,
        solarWind: data.solar_wind.speed,
        kpIndex: data.geomagnetic.kp_index,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Failed to fetch space weather data:', error);

      if (!isMountedRef.current) return;

      // Implement retry logic
      retryCountRef.current++;
      
      if (retryCountRef.current >= MAX_RETRIES) {
        setError(`Failed to fetch data after ${MAX_RETRIES} attempts: ${error.message}`);
        onError?.(error);
        // Stop polling on max retries
        stopPolling();
      } else {
        setError(`Fetch error (attempt ${retryCountRef.current}/${MAX_RETRIES}): ${error.message}`);
        console.log(`Retrying... (${retryCountRef.current}/${MAX_RETRIES})`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    demoMode,
    updateSpaceWeatherData,
    updateAudioParams,
    setLoading,
    setError,
    onDataUpdate,
    onError,
  ]);

  /**
   * Start polling
   */
  const startPolling = useCallback(() => {
    // Clear existing interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Fetch immediately
    fetchData();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchData();
    }, pollInterval);

    console.log(`Polling started with ${pollInterval}ms interval`);
  }, [fetchData, pollInterval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Polling stopped');
    }
  }, []);

  /**
   * Manually trigger a fetch (doesn't reset polling timer)
   */
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Set demo mode in store
  useEffect(() => {
    setDemoMode(demoMode);
  }, [demoMode, setDemoMode]);

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
    /** Current space weather data */
    data: spaceWeatherData,
    
    /** Whether data is currently being fetched */
    isLoading,
    
    /** Error message if fetch failed */
    error,
    
    /** Manually trigger a data fetch */
    refetch,
    
    /** Start polling (if stopped) */
    startPolling,
    
    /** Stop polling */
    stopPolling,
    
    /** Current retry count */
    retryCount: retryCountRef.current,
  };
}

/**
 * Simple hook to just get the current space weather data
 * without polling functionality
 */
export function useSpaceWeatherData() {
  const { spaceWeatherData, isLoading, error } = useAudioStore();

  return {
    data: spaceWeatherData,
    isLoading,
    error,
  };
}