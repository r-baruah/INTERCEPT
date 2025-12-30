/**
 * Audio Store - Zustand Global State Management
 * 
 * Centralized state management for Cosmic Radio application.
 * Manages audio engine state, space weather data, and event detection.
 */

import { create } from 'zustand';
import { SpaceWeatherData } from '@/types/nasa';
import { AudioEngine } from '@/lib/audio/AudioEngine';

export interface AudioParameters {
  bpm: number;
  distortion: number;
  filterFreq: number;
  volumeBoost: number;
  intensity: number;
}

export interface AudioState {
  // Audio Engine
  audioEngine: AudioEngine | null;
  isPlaying: boolean;
  isInitialized: boolean;
  
  // Space Weather Data
  spaceWeatherData: SpaceWeatherData | null;
  lastUpdate: Date | null;
  isLoading: boolean;
  error: string | null;
  
  // Audio Parameters (derived from space weather)
  audioParams: AudioParameters | null;
  
  // Mode
  isDemoMode: boolean;
  
  // Actions
  initializeAudioEngine: () => Promise<void>;
  setAudioEngine: (engine: AudioEngine) => void;
  togglePlayback: () => Promise<void>;
  updateSpaceWeatherData: (data: SpaceWeatherData) => void;
  updateAudioParams: (params: AudioParameters) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDemoMode: (enabled: boolean) => void;
  reset: () => void;
}

const initialState = {
  audioEngine: null,
  isPlaying: false,
  isInitialized: false,
  spaceWeatherData: null,
  lastUpdate: null,
  isLoading: false,
  error: null,
  audioParams: null,
  isDemoMode: false,
};

export const useAudioStore = create<AudioState>((set, get) => ({
  ...initialState,

  /**
   * Initialize the AudioEngine instance
   * Must be called before any audio operations
   */
  initializeAudioEngine: async () => {
    try {
      const { audioEngine, isInitialized } = get();
      
      if (isInitialized && audioEngine) {
        console.log('AudioEngine already initialized');
        return;
      }

      const engine = AudioEngine.getInstance();
      await engine.initialize();
      
      set({
        audioEngine: engine,
        isInitialized: true,
        error: null,
      });

      console.log('AudioEngine initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize audio engine';
      console.error('AudioEngine initialization error:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Set the audio engine instance
   * Used when engine is created externally
   */
  setAudioEngine: (engine: AudioEngine) => {
    set({
      audioEngine: engine,
      isInitialized: true,
      error: null,
    });
  },

  /**
   * Toggle audio playback (play/pause)
   */
  togglePlayback: async () => {
    const { audioEngine, isPlaying, isInitialized } = get();

    if (!audioEngine || !isInitialized) {
      console.error('AudioEngine not initialized');
      set({ error: 'AudioEngine not initialized' });
      return;
    }

    try {
      if (isPlaying) {
        audioEngine.stop();
        set({ isPlaying: false });
        console.log('Playback stopped');
      } else {
        audioEngine.play();
        set({ isPlaying: true, error: null });
        console.log('Playback started');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Playback error';
      console.error('Playback toggle error:', error);
      set({ error: errorMessage });
    }
  },

  /**
   * Update space weather data and timestamp
   */
  updateSpaceWeatherData: (data: SpaceWeatherData) => {
    set({
      spaceWeatherData: data,
      lastUpdate: new Date(),
      error: null,
    });
    console.log('Space weather data updated:', data.timestamp);
  },

  /**
   * Update audio parameters (from sonification)
   */
  updateAudioParams: (params: AudioParameters) => {
    set({ audioParams: params });
    
    const { audioEngine, isInitialized } = get();
    
    // Apply parameters to audio engine if available
    if (audioEngine && isInitialized) {
      try {
        // Use AudioEngine's updateParameters method
        audioEngine.updateParameters({
          bpm: params.bpm,
          distortion: params.distortion,
          filterFrequency: params.filterFreq,
          volume: params.volumeBoost, // Volume boost in dB
        });
        
        console.log('Audio parameters applied:', params);
      } catch (error) {
        console.error('Failed to apply audio parameters:', error);
      }
    }
  },

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  /**
   * Set error message
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Toggle demo mode
   */
  setDemoMode: (enabled: boolean) => {
    set({ isDemoMode: enabled });
    console.log(`Demo mode ${enabled ? 'enabled' : 'disabled'}`);
  },

  /**
   * Reset store to initial state
   * Note: Does not destroy audio engine (must be done separately)
   */
  reset: () => {
    const { audioEngine } = get();
    
    // Stop playback if active
    if (audioEngine) {
      try {
        audioEngine.stop();
      } catch (error) {
        console.error('Error stopping audio during reset:', error);
      }
    }
    
    set({
      ...initialState,
      audioEngine: get().audioEngine, // Preserve engine instance
      isInitialized: get().isInitialized,
    });
    
    console.log('Store reset to initial state');
  },
}));

/**
 * Hook to get current audio status
 */
export const useAudioStatus = () => {
  return useAudioStore((state) => ({
    isPlaying: state.isPlaying,
    isInitialized: state.isInitialized,
    error: state.error,
  }));
};

/**
 * Hook to get current space weather data
 */
export const useSpaceWeatherData = () => {
  return useAudioStore((state) => ({
    data: state.spaceWeatherData,
    lastUpdate: state.lastUpdate,
    isLoading: state.isLoading,
    error: state.error,
  }));
};

/**
 * Hook to get current audio parameters
 */
export const useAudioParams = () => {
  return useAudioStore((state) => state.audioParams);
};