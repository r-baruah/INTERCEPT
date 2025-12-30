'use client';

import { useCallback, useEffect, useState } from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { useAudioStore } from '@/store/audioStore';

/**
 * DJConsole Component
 * 
 * Main audio control interface with:
 * - System initialization
 * - Playback controls with keyboard shortcuts
 * - Real-time parameter display
 * - Audio visualization
 */
export function DJConsole() {
  const {
    isPlaying,
    isInitialized,
    audioParams,
    initializeAudioEngine,
    togglePlayback,
    updateAudioParams,
    error,
  } = useAudioStore();

  const [isInitializing, setIsInitializing] = useState(false);

  // Handle initialization with loading state  
  const handleInitialize = useCallback(async () => {
    setIsInitializing(true);
    try {
      await initializeAudioEngine();
    } catch (err) {
      console.error('Failed to initialize audio:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [initializeAudioEngine]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Space bar to toggle playback (only if initialized)
      if (e.code === 'Space' && isInitialized) {
        e.preventDefault();
        togglePlayback();
      }

      // 'I' to initialize
      if (e.code === 'KeyI' && !isInitialized && !isInitializing) {
        e.preventDefault();
        handleInitialize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInitialized, isInitializing, togglePlayback, handleInitialize]);

  return (
    <div
      className="flex flex-col gap-4 h-full"
      role="region"
      aria-label="Audio Control Console"
    >

      {/* Signal Visualizer */}
      <div
        className="sx-panel relative overflow-hidden h-40 flex flex-col"
        aria-label="Audio waveform display"
      >
        <div className="absolute top-2 left-3 z-10">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Signal Processing</span>
        </div>
        <div className="flex-1 opacity-80">
          <AudioVisualizer />
        </div>
        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 border border-[#1a1a1a] m-1 pointer-events-none" aria-hidden="true" />

        {/* Status Overlay */}
        <div className="absolute bottom-2 right-3 z-10 flex gap-2">
          <div className={`text-[9px] font-mono uppercase ${isPlaying ? 'text-green-500' : 'text-zinc-600'}`}>
            {isPlaying ? 'RUNNING' : 'STANDBY'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="sx-panel p-4">
        <div className="flex gap-3 mb-6">
          {!isInitialized ? (
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="flex-1 sx-button-outline"
              aria-label="Initialize audio system. Press I key as shortcut."
              aria-busy={isInitializing}
            >
              {isInitializing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden="true" />
                  Initializing...
                </span>
              ) : (
                'Initialize System'
              )}
            </button>
          ) : (
            <div className="flex flex-1 gap-2">
              <button
                onClick={togglePlayback}
                className={`flex-1 ${isPlaying ? 'sx-button-danger' : 'sx-button'}`}
                aria-label={isPlaying ? 'Stop audio transmission. Press Space key as shortcut.' : 'Start audio transmission. Press Space key as shortcut.'}
                aria-pressed={isPlaying}
              >
                {isPlaying ? 'Terminate Stream' : 'Begin Transmission'}
              </button>

              <button
                onClick={() => {
                  if (!isInitialized) return;

                  // Trigger dramatic effects
                  import('@/lib/audio/AudioEngine').then(({ getAudioEngine }) => {
                    const engine = getAudioEngine();
                    engine.triggerAlert('danger');
                    engine.createExplosion();
                    setTimeout(() => engine.createStatic(1), 500);
                  });

                  // Update Store & Engine (Store update propagates to Engine)
                  updateAudioParams({
                    bpm: 120,
                    distortion: 0.8,
                    filterFreq: 500,
                    volumeBoost: 0,
                    intensity: 0.9
                  });
                }}
                className="px-3 py-2 bg-yellow-900/30 border border-yellow-700/50 text-yellow-500 rounded text-[10px] font-mono hover:bg-yellow-900/50 transition-colors uppercase tracking-wider"
                title="Simulate X-Class Flare Event"
              >
                🔥 SIM
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="mb-4 p-2 border border-red-500/30 bg-red-950/20 rounded text-xs text-red-400 font-mono"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Parameter Readouts */}
        {audioParams ? (
          <div
            className="grid grid-cols-2 gap-px bg-[#1a1a1a] border border-[#1a1a1a]"
            role="region"
            aria-label="Audio parameters"
          >
            {[
              { label: 'BPM', value: audioParams.bpm.toFixed(0), unit: '' },
              { label: 'Harmonic Distortion', value: (audioParams.distortion * 100).toFixed(0), unit: '%' },
              { label: 'Filter Freq', value: audioParams.filterFreq.toFixed(0), unit: ' Hz' },
              { label: 'Modulation', value: (audioParams.intensity * 100).toFixed(0), unit: '%' },
            ].map((param, i) => (
              <div key={i} className="bg-[#0a0a0a] p-3 flex flex-col">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{param.label}</span>
                <span className="text-sm font-mono text-white" aria-label={`${param.label}: ${param.value}${param.unit}`}>
                  {param.value}{param.unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center bg-[#050505] border border-[#1a1a1a]">
            <span className="text-[10px] text-zinc-700 font-mono uppercase">System Offline</span>
          </div>
        )}
      </div>

      {/* Network Status - Dynamic */}
      <div
        className="mt-auto flex justify-between px-1"
        role="status"
        aria-label="System network status"
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-zinc-600'}`}
            aria-hidden="true"
          />
          <span className="text-[9px] text-zinc-500 font-mono uppercase">
            Audio Eng: {isInitialized ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-white'}`}
            aria-hidden="true"
          />
          <span className="text-[9px] text-zinc-500 font-mono uppercase">
            Buffer: {isPlaying ? 'Streaming' : '100%'}
          </span>
        </div>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="text-[8px] text-zinc-700 text-center font-mono mt-1" aria-hidden="true">
        {isInitialized ? 'SPACE to toggle' : 'Press I to init'}
      </div>
    </div>
  );
}