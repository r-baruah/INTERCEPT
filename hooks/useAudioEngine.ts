'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAudioEngine } from '@/lib/audio/AudioEngine';
import type { AudioEngineState, AudioParameters } from '@/types/audio';

/**
 * React hook for Cosmic Radio audio engine
 * Provides easy integration with React components
 * 
 * Usage:
 * ```tsx
 * const { state, initialize, play, pause } = useAudioEngine();
 * 
 * <button onClick={initialize}>Initialize Audio</button>
 * <button onClick={play}>Play</button>
 * ```
 */
export function useAudioEngine() {
  const [state, setState] = useState<AudioEngineState>({
    isInitialized: false,
    isPlaying: false,
    volume: -12,
    bpm: 80,
    distortion: 0.2,
    filterFrequency: 800
  });

  const [error, setError] = useState<string | null>(null);

  const audioEngine = getAudioEngine();

  /**
   * Initialize audio context
   * Must be called from user interaction (button click)
   */
  const initialize = useCallback(async () => {
    try {
      setError(null);
      await audioEngine.initialize();
      setState(audioEngine.getState());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize audio';
      console.error('useAudioEngine: Initialization failed:', err);
      setError(errorMessage);
    }
  }, [audioEngine]);

  /**
   * Start audio playback
   */
  const play = useCallback(() => {
    try {
      setError(null);
      audioEngine.play();
      setState(audioEngine.getState());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play audio';
      console.error('useAudioEngine: Play failed:', err);
      setError(errorMessage);
    }
  }, [audioEngine]);

  /**
   * Pause audio playback (uses stop since AudioEngine doesn't have pause)
   */
  const pause = useCallback(() => {
    try {
      setError(null);
      audioEngine.stop();
      setState(audioEngine.getState());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause audio';
      console.error('useAudioEngine: Pause failed:', err);
      setError(errorMessage);
    }
  }, [audioEngine]);

  /**
   * Stop audio playback completely
   */
  const stop = useCallback(() => {
    try {
      setError(null);
      audioEngine.stop();
      setState(audioEngine.getState());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop audio';
      console.error('useAudioEngine: Stop failed:', err);
      setError(errorMessage);
    }
  }, [audioEngine]);

  /**
   * Update audio parameters
   */
  const updateParameters = useCallback((params: AudioParameters) => {
    try {
      setError(null);
      audioEngine.updateParameters(params);
      setState(audioEngine.getState());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update parameters';
      console.error('useAudioEngine: Update parameters failed:', err);
      setError(errorMessage);
    }
  }, [audioEngine]);

  /**
   * Get analyzer for visualizations
   */
  const getAnalyzer = useCallback(() => {
    return audioEngine.getAnalyzer();
  }, [audioEngine]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      try {
        audioEngine.stop();
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    };
  }, [audioEngine]);

  return {
    state,
    error,
    initialize,
    play,
    pause,
    stop,
    updateParameters,
    getAnalyzer,
    audioEngine
  };
}