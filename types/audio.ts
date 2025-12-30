/**
 * Type definitions for Cosmic Radio audio system
 */

export interface AudioEngineState {
  isInitialized: boolean;
  isPlaying: boolean;
  volume: number;           // dB (-60 to 0)
  bpm: number;              // 60-140
  distortion: number;       // 0-0.8
  filterFrequency: number;  // Hz
}

export interface AudioParameters {
  bpm?: number;
  distortion?: number;
  filterFrequency?: number;
  filterFreq?: number; // Alias for compatibility
  volume?: number;
  volumeBoost?: number;
  intensity?: number; // 0-1 scale for mix density
  bassNote?: string;
  shimmerNote?: string;
}

export interface SynthConfig {
  harmonicity: number;
  modulationIndex: number;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export interface AudioAnalyzerData {
  waveform: Float32Array;
  spectrum: Float32Array;
}