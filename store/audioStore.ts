/**
 * Audio Store - Zustand Global State Management v2.0
 * 
 * Centralized state management for the Heliospheric Audio Engine.
 * Manages audio engine state, space weather data, and telemetry-to-audio flow.
 */

import { create } from 'zustand';
import { SpaceWeatherData } from '@/types/nasa';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { mapSpaceWeatherToAudio, calculateDangerLevel, getDangerLabel } from '@/lib/audio/sonification';

export interface AudioParameters {
  bpm: number;           // Solar wind speed (passed to LFO rate internally)
  distortion: number;    // Kp-based interference (0-1)
  filterFreq: number;    // Density-based filter cutoff
  volumeBoost: number;   // Flare volume boost (dB)
  intensity: number;     // Overall intensity (0-1)
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

  // Danger Level (0-4)
  dangerLevel: number;
  dangerLabel: string;

  // Mode
  isDemoMode: boolean;
  isMarsMode: boolean; // True when viewing Mars telemetry

  // Signal Lock State (from Tuner)
  signalLock: number; // 0 = unlocked, 1 = locked

  // Actions
  initializeAudioEngine: () => Promise<void>;
  setAudioEngine: (engine: AudioEngine) => void;
  togglePlayback: () => Promise<void>;
  updateSpaceWeatherData: (data: SpaceWeatherData) => void;
  overrideSpaceWeatherData: (data: SpaceWeatherData) => void;
  updateAudioParams: (params: AudioParameters) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDemoMode: (enabled: boolean) => void;
  setSignalLock: (quality: number) => void;
  setKpIndex: (kpIndex: number) => void;
  setWindSpeed: (speed: number) => void;
  setMarsMode: (enabled: boolean) => void;
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
  dangerLevel: 0,
  dangerLabel: 'NOMINAL',
  isDemoMode: false,
  isMarsMode: false,
  signalLock: 0,
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

      console.log('✅ AudioStore: Heliospheric Audio Engine initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize audio engine';
      console.error('AudioEngine initialization error:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  /**
   * Set the audio engine instance (external creation)
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
        console.log('⏹️ Playback stopped');
      } else {
        audioEngine.play();
        set({ isPlaying: true, error: null });
        console.log('▶️ Playback started');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Playback error';
      console.error('Playback toggle error:', error);
      set({ error: errorMessage });
    }
  },

  /**
   * Update space weather data (from API polling)
   * Automatically derives audio parameters
   */
  updateSpaceWeatherData: (data: SpaceWeatherData) => {
    const audioParams = mapSpaceWeatherToAudio(data);
    const dangerLevel = calculateDangerLevel(data);
    const dangerLabel = getDangerLabel(dangerLevel);

    set({
      spaceWeatherData: data,
      lastUpdate: new Date(),
      error: null,
      audioParams: {
        bpm: audioParams.bpm,
        distortion: audioParams.distortion,
        filterFreq: audioParams.filterFrequency,
        volumeBoost: audioParams.volumeBoost,
        intensity: audioParams.intensity,
      },
      dangerLevel,
      dangerLabel,
    });

    // Apply to audio engine
    const { audioEngine, isInitialized, isPlaying } = get();
    if (audioEngine && isInitialized && isPlaying) {
      audioEngine.updateParameters({
        bpm: audioParams.bpm,
        distortion: audioParams.distortion,
        filterFrequency: audioParams.filterFrequency,
        volumeBoost: audioParams.volumeBoost,
        intensity: audioParams.intensity,
      });
    }

    console.log(`📡 Telemetry updated: Wind=${data.solar_wind.speed}km/s, Kp=${data.geomagnetic.kp_index}, Danger=${dangerLabel}`);
  },

  /**
   * Override space weather data (Simulation Mode)
   * Immediately applies to audio engine
   */
  overrideSpaceWeatherData: (data: SpaceWeatherData) => {
    const audioParams = mapSpaceWeatherToAudio(data);
    const dangerLevel = calculateDangerLevel(data);
    const dangerLabel = getDangerLabel(dangerLevel);

    set({
      spaceWeatherData: data,
      lastUpdate: new Date(),
      error: null,
      audioParams: {
        bpm: audioParams.bpm,
        distortion: audioParams.distortion,
        filterFreq: audioParams.filterFrequency,
        volumeBoost: audioParams.volumeBoost,
        intensity: audioParams.intensity,
      },
      dangerLevel,
      dangerLabel,
    });

    // FORCE apply to audio engine (even during simulation)
    const { audioEngine, isInitialized } = get();
    if (audioEngine && isInitialized) {
      audioEngine.updateParameters({
        bpm: audioParams.bpm,
        distortion: audioParams.distortion,
        filterFrequency: audioParams.filterFrequency,
        volumeBoost: audioParams.volumeBoost,
        intensity: audioParams.intensity,
      });
    }

    console.log(`🔧 SIMULATION: Wind=${data.solar_wind.speed}km/s, Kp=${data.geomagnetic.kp_index}, Danger=${dangerLabel}`);
  },

  /**
   * Update audio parameters directly
   */
  updateAudioParams: (params: AudioParameters) => {
    set({ audioParams: params });

    const { audioEngine, isInitialized } = get();

    if (audioEngine && isInitialized) {
      try {
        audioEngine.updateParameters({
          bpm: params.bpm,
          distortion: params.distortion,
          filterFrequency: params.filterFreq,
          volumeBoost: params.volumeBoost,
          intensity: params.intensity,
        });

        console.log('🎛️ Audio parameters applied:', params);
      } catch (error) {
        console.error('Failed to apply audio parameters:', error);
      }
    }
  },

  /**
   * Set signal lock quality (from Tuner)
   * Controls atmosphere noise volume
   */
  setSignalLock: (quality: number) => {
    set({ signalLock: quality });

    const { audioEngine, isInitialized } = get();
    if (audioEngine && isInitialized) {
      audioEngine.setSignalLock(quality);
    }
  },

  /**
   * Direct Kp index update (for Simulation Panel)
   * Immediately applies interference effects
   */
  setKpIndex: (kpIndex: number) => {
    const { audioEngine, isInitialized, spaceWeatherData } = get();

    if (audioEngine && isInitialized) {
      audioEngine.setKpIndex(kpIndex);

      // Update danger level
      if (spaceWeatherData) {
        const updatedData = {
          ...spaceWeatherData,
          geomagnetic: { ...spaceWeatherData.geomagnetic, kp_index: kpIndex }
        };
        const dangerLevel = calculateDangerLevel(updatedData);
        set({ dangerLevel, dangerLabel: getDangerLabel(dangerLevel) });
      }
    }
  },

  /**
   * Direct wind speed update (for Simulation Panel)
   * Immediately adjusts LFO rate
   */
  setWindSpeed: (speed: number) => {
    const { audioEngine, isInitialized } = get();

    if (audioEngine && isInitialized) {
      audioEngine.setWindSpeed(speed);
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
    console.log(`🎮 Demo mode ${enabled ? 'enabled' : 'disabled'}`);
  },

  /**
   * Toggle Mars mode (for theme changes)
   */
  setMarsMode: (enabled: boolean) => {
    set({ isMarsMode: enabled });
    console.log(`🔴 Mars mode ${enabled ? 'enabled' : 'disabled'}`);
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    const { audioEngine } = get();

    if (audioEngine) {
      try {
        audioEngine.stop();
      } catch (error) {
        console.error('Error stopping audio during reset:', error);
      }
    }

    set({
      ...initialState,
      audioEngine: get().audioEngine,
      isInitialized: get().isInitialized,
    });

    console.log('🔄 Store reset to initial state');
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
    dangerLevel: state.dangerLevel,
    dangerLabel: state.dangerLabel,
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
    dangerLevel: state.dangerLevel,
    dangerLabel: state.dangerLabel,
  }));
};

/**
 * Hook to get current audio parameters
 */
export const useAudioParams = () => {
  return useAudioStore((state) => state.audioParams);
};

/**
 * Hook to get signal lock state
 */
export const useSignalLock = () => {
  return useAudioStore((state) => state.signalLock);
};