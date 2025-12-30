'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/store/audioStore';

/**
 * AudioVisualizer Component
 * 
 * Displays real-time waveform data from Tone.js audio engine.
 * Falls back to animated idle waveform when audio is not playing.
 */
export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isPlaying, isInitialized, audioEngine } = useAudioStore();
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Get real waveform data from audio engine
  const getRealWaveformData = useCallback((): Float32Array | null => {
    if (!audioEngine || !isInitialized) return null;
    try {
      return audioEngine.getWaveformData();
    } catch {
      return null;
    }
  }, [audioEngine, isInitialized]);

  // Generate idle waveform (when not playing)
  const generateIdleWaveform = useCallback((points: number, time: number): number[] => {
    const values: number[] = [];
    for (let i = 0; i < points; i++) {
      const x = i / points;
      let y = Math.sin(x * 8 + time * 0.5) * 0.05;
      y += Math.sin(x * 15 + time * 0.3) * 0.03;
      y += (Math.random() - 0.5) * 0.02;
      values.push(y);
    }
    return values;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resize with device pixel ratio for crisp rendering
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;
      timeRef.current += 0.02;
      const t = timeRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;

      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Vertical divisions
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(width * (i / 4), 0);
        ctx.lineTo(width * (i / 4), height);
        ctx.stroke();
      }

      // Get waveform data
      let values: number[];
      const points = 128;

      if (isPlaying && isInitialized) {
        // Try to get real waveform data
        const realData = getRealWaveformData();

        if (realData && realData.length > 0) {
          // Resample real data to desired number of points
          values = [];
          const step = realData.length / points;
          for (let i = 0; i < points; i++) {
            const idx = Math.floor(i * step);
            values.push(realData[idx] || 0);
          }
        } else {
          // Fallback to animated active waveform
          values = [];
          for (let i = 0; i < points; i++) {
            const x = i / points;
            let y = Math.sin(x * 12 + t * 3) * 0.3;
            y += Math.sin(x * 25 + t * 1.5) * 0.2;
            y += Math.sin(x * 6 + t * 5) * 0.15;
            y += (Math.random() - 0.5) * 0.1;
            values.push(y);
          }
        }
      } else {
        // Idle waveform
        values = generateIdleWaveform(points, t);
      }

      // Draw main waveform with glow effect when playing
      if (isPlaying) {
        // Draw glow layer first
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const sliceWidth = width / points;
        let x = 0;
        for (let i = 0; i < points; i++) {
          const y = (height / 2) + (values[i] * height * 0.8);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }

      // Draw main line
      ctx.beginPath();
      ctx.strokeStyle = isPlaying ? '#ffffff' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = isPlaying ? 1.5 : 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const sliceWidth = width / points;
      let x = 0;

      for (let i = 0; i < points; i++) {
        const y = (height / 2) + (values[i] * height * 0.8);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      // Draw secondary ghost wave when playing
      if (isPlaying) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        x = 0;

        for (let i = 0; i < points; i++) {
          const idx = (i + 10) % points;
          const y = (height / 2) + (values[idx] * height * 0.5);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }

      // Draw peak indicator when playing
      if (isPlaying) {
        const maxVal = Math.max(...values.map(Math.abs));
        if (maxVal > 0.25) {
          // Peak indicator with glow
          const indicatorColor = maxVal > 0.5 ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.7)';
          ctx.fillStyle = indicatorColor;
          ctx.shadowColor = indicatorColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(width - 10, 10, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isInitialized, getRealWaveformData, generateIdleWaveform]);

  return (
    <div
      className="w-full h-full relative bg-[#050505]"
      role="img"
      aria-label={isPlaying ? "Audio waveform visualization showing live audio signal" : "Audio waveform visualization in standby mode"}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'crisp-edges' }}
        aria-hidden="true"
      />

      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse glow-green' : 'bg-zinc-600'}`}
          aria-hidden="true"
        />
        <span className={`text-[8px] font-mono uppercase tracking-widest ${isPlaying ? 'text-green-500' : 'text-zinc-600'}`}>
          {isPlaying ? 'LIVE' : 'IDLE'}
        </span>
      </div>

      {/* Technical overlay labels */}
      <div className="absolute bottom-2 left-2 text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
        {isPlaying && isInitialized ? 'WAVEFORM FFT' : 'WAVEFORM'}
      </div>
      <div className="absolute bottom-2 right-2 text-[8px] font-mono text-zinc-600">
        {isPlaying ? '44.1kHz' : '—'}
      </div>
    </div>
  );
}