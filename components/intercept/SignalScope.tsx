'use client';

import { useRef, useEffect, useState, useCallback, MutableRefObject } from 'react';
import { useSpaceWeatherData, useAudioStore } from '@/store/audioStore';

interface SignalScopeProps {
  signalLocked: boolean;
  signalQuality: number;
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>;
}

/**
 * SIGNAL SCOPE - Premium Reactive Spectrogram
 * Enhanced for high-quality video recording with telemetry HUD overlay.
 */
export function SignalScope({ signalLocked, signalQuality, canvasRef: externalCanvasRef }: SignalScopeProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const { data } = useSpaceWeatherData();
  const { audioEngine, isPlaying, isMarsMode } = useAudioStore();

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const kpIndex = data?.geomagnetic?.kp_index ?? 0;
  const isStorm = data?.geomagnetic?.storm_active ?? false;
  const windSpeed = data?.solar_wind?.speed ?? 0;

  const getScopeColor = useCallback(() => {
    if (isMarsMode) return { primary: 'rgba(200, 80, 50, 0.9)', secondary: 'rgba(180, 60, 30, 0.5)', glow: 'rgba(255, 100, 50, 0.4)' };
    if (!signalLocked) return { primary: 'rgba(100, 100, 100, 0.5)', secondary: 'rgba(60, 60, 60, 0.3)', glow: 'rgba(100, 100, 100, 0.2)' };
    if (isStorm) return { primary: 'rgba(255, 60, 0, 0.9)', secondary: 'rgba(255, 100, 0, 0.5)', glow: 'rgba(255, 60, 0, 0.5)' };
    if (kpIndex > 4) return { primary: 'rgba(255, 180, 0, 0.9)', secondary: 'rgba(255, 200, 50, 0.5)', glow: 'rgba(255, 180, 0, 0.4)' };
    return { primary: 'rgba(100, 255, 218, 0.9)', secondary: 'rgba(50, 200, 180, 0.5)', glow: 'rgba(100, 255, 218, 0.4)' };
  }, [isMarsMode, signalLocked, isStorm, kpIndex]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return;

    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.28;
    const colors = getScopeColor();

    // === BACKGROUND ===
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Radial gradient background
    const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 2.5);
    bgGradient.addColorStop(0, isMarsMode ? 'rgba(60, 20, 10, 0.4)' : 'rgba(10, 30, 40, 0.3)');
    bgGradient.addColorStop(0.5, isMarsMode ? 'rgba(30, 10, 5, 0.2)' : 'rgba(5, 15, 25, 0.2)');
    bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // === GRID SYSTEM ===
    drawEnhancedGrid(ctx, width, height, cx, cy, baseRadius, signalLocked, isMarsMode, time);

    // === SCANNING LINE ===
    if (signalLocked) {
      drawScanLine(ctx, cx, cy, baseRadius * 1.5, time, colors.glow);
    }

    // === WAVEFORM ===
    if (!signalLocked || !isPlaying) {
      drawStatic(ctx, cx, cy, baseRadius, time, signalQuality, isMarsMode);
    } else {
      const waveform = audioEngine?.getWaveformData();
      if (waveform) {
        // Outer glow ring
        drawWaveformRing(ctx, cx, cy, baseRadius * 1.2, waveform, time, colors.secondary, 1, 0.3);
        // Main waveform
        drawWaveformRing(ctx, cx, cy, baseRadius, waveform, time, colors.primary, 2.5, isMarsMode ? 0.3 : 0.5);
        // Inner echo
        drawWaveformRing(ctx, cx, cy, baseRadius * 0.6, waveform, time, colors.glow, 1, 0.2);
      }

      if (isMarsMode) {
        drawMarsDust(ctx, cx, cy, baseRadius, time);
      } else if (isStorm || kpIndex > 5) {
        drawGlitch(ctx, cx, cy, baseRadius, time, colors.primary);
      }
    }

    // === TELEMETRY HUD OVERLAY (Recorded in video) ===
    drawTelemetryHUD(ctx, width, height, {
      locked: signalLocked,
      quality: signalQuality,
      kp: kpIndex,
      wind: windSpeed,
      isMars: isMarsMode,
      isStorm: isStorm,
      time: time
    });

    // === BRANDED WATERMARK ===
    drawWatermark(ctx, width, height, isMarsMode);

  }, [dimensions, signalLocked, signalQuality, isPlaying, audioEngine, isStorm, kpIndex, isMarsMode, windSpeed, getScopeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      draw(ctx, time);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [draw]);

  return (
    <div ref={containerRef} className={`w-full h-full relative overflow-hidden ${isMarsMode ? 'bg-red-950/10' : 'bg-black'}`}>
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="block" />
    </div>
  );
}

// === HELPER FUNCTIONS ===

function drawEnhancedGrid(ctx: CanvasRenderingContext2D, w: number, h: number, cx: number, cy: number, r: number, locked: boolean, isMars: boolean, time: number) {
  const gridColor = isMars ? 'rgba(200, 80, 50, 0.1)' : 'rgba(100, 255, 218, 0.08)';
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  // Concentric circles
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (i * 0.4), 0, Math.PI * 2);
    ctx.setLineDash(i === 2 ? [] : [3, 6]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Crosshair with tick marks
  ctx.beginPath();
  ctx.moveTo(cx - r * 1.5, cy); ctx.lineTo(cx + r * 1.5, cy);
  ctx.moveTo(cx, cy - r * 1.5); ctx.lineTo(cx, cy + r * 1.5);
  ctx.stroke();

  // Tick marks
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const offset = i * (r * 0.4);
    ctx.beginPath();
    ctx.moveTo(cx + offset, cy - 5); ctx.lineTo(cx + offset, cy + 5);
    ctx.moveTo(cx - 5, cy + offset); ctx.lineTo(cx + 5, cy + offset);
    ctx.stroke();
  }

  // Corner brackets
  const bracketSize = 20;
  const margin = 15;
  ctx.strokeStyle = isMars ? 'rgba(200, 80, 50, 0.3)' : 'rgba(100, 255, 218, 0.2)';
  ctx.lineWidth = 2;
  [[margin, margin, 1, 1], [w - margin, margin, -1, 1], [margin, h - margin, 1, -1], [w - margin, h - margin, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * bracketSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * bracketSize, y);
    ctx.stroke();
  });
}

function drawScanLine(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, time: number, color: string) {
  const angle = (time * 0.001) % (Math.PI * 2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  ctx.stroke();

  // Sweep trail
  const gradient = ctx.createConicGradient(angle - 0.5, cx, cy);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(0.1, color);
  gradient.addColorStop(0.2, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWaveformRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, waveform: Float32Array, time: number, color: string, lineWidth: number, ampScale: number) {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = lineWidth * 4;
  ctx.shadowColor = color;

  const bufferSize = Math.floor(waveform.length * 0.5);
  for (let i = 0; i <= bufferSize; i++) {
    const angle = (i / bufferSize) * Math.PI * 2;
    const amplitude = waveform[i % waveform.length];
    const radius = r + (amplitude * r * ampScale);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawStatic(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, time: number, quality: number, isMars: boolean) {
  const particles = isMars ? 40 : 60;
  ctx.fillStyle = isMars ? 'rgba(200, 80, 50, 0.4)' : 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < particles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = r * 0.5 + Math.random() * r;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (Math.random() > quality * 0.8) {
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

function drawMarsDust(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, time: number) {
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + (time * 0.00002);
    const radius = r * 0.4 + Math.sin(time * 0.0008 + i * 0.5) * 30 + i * 3;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const alpha = 0.15 + Math.sin(time * 0.001 + i) * 0.1;
    ctx.fillStyle = `rgba(180, 60, 30, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGlitch(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, time: number, color: string) {
  if (Math.random() > 0.7) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    const offset = Math.sin(time * 0.05) * 5;
    ctx.strokeRect(cx - r + offset, cy - r * 0.1, r * 2, r * 0.2);
    ctx.restore();
  }
}

interface TelemetryData {
  locked: boolean;
  quality: number;
  kp: number;
  wind: number;
  isMars: boolean;
  isStorm: boolean;
  time: number;
}

function drawTelemetryHUD(ctx: CanvasRenderingContext2D, w: number, h: number, data: TelemetryData) {
  const textColor = data.isMars ? 'rgba(200, 100, 80, 0.9)' : 'rgba(100, 255, 218, 0.9)';
  const mutedColor = data.isMars ? 'rgba(150, 80, 60, 0.6)' : 'rgba(100, 200, 180, 0.5)';
  const warningColor = 'rgba(255, 180, 0, 0.9)';
  const criticalColor = 'rgba(255, 60, 60, 0.9)';

  ctx.save();
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textBaseline = 'top';

  // Top-Left: Status
  ctx.fillStyle = mutedColor;
  ctx.fillText('STATUS', 20, 18);
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillStyle = data.locked ? textColor : 'rgba(255, 180, 0, 0.8)';
  ctx.fillText(data.locked ? (data.isMars ? 'MARS LINK ACTIVE' : 'SIGNAL LOCKED') : 'ACQUIRING...', 20, 32);

  // Top-Right: Timestamp
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = mutedColor;
  const now = new Date();
  ctx.fillText(now.toLocaleTimeString() + ' UTC', w - 20, 18);
  ctx.fillText(now.toLocaleDateString(), w - 20, 32);

  // Bottom-Left: Telemetry Data
  ctx.textAlign = 'left';
  const bottomY = h - 60;

  // Wind Speed
  ctx.fillStyle = mutedColor;
  ctx.fillText(data.isMars ? 'ATMOS' : 'WIND', 20, bottomY);
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillStyle = data.wind > 600 ? criticalColor : data.wind > 450 ? warningColor : textColor;
  ctx.fillText(`${data.wind.toFixed(0)}`, 20, bottomY + 14);
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = mutedColor;
  ctx.fillText(data.isMars ? 'm/s' : 'km/s', 75, bottomY + 18);

  // Kp Index
  ctx.fillText(data.isMars ? 'RAD' : 'Kp', 120, bottomY);
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillStyle = data.kp >= 6 ? criticalColor : data.kp >= 4 ? warningColor : textColor;
  ctx.fillText(data.isMars ? '2.5' : data.kp.toFixed(1), 120, bottomY + 14);

  // Signal Quality Bar
  if (data.locked) {
    const barX = 180;
    const barW = 80;
    const barH = 6;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(barX, bottomY + 20, barW, barH);
    ctx.fillStyle = textColor;
    ctx.fillRect(barX, bottomY + 20, barW * data.quality, barH);
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = mutedColor;
    ctx.fillText('SIG QUALITY', barX, bottomY);
  }

  // Bottom-Right: Storm Warning
  if (data.isStorm && !data.isMars) {
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = criticalColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = criticalColor;
    const pulse = Math.sin(data.time * 0.005) > 0;
    if (pulse) ctx.fillText('⚠ GEOMAGNETIC STORM ACTIVE', w - 20, bottomY + 18);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, isMars: boolean) {
  ctx.save();
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = isMars ? 'rgba(200, 80, 50, 0.15)' : 'rgba(100, 255, 218, 0.12)';
  ctx.fillText('INTERCEPT v3.0', w - 20, h - 8);
  ctx.restore();
}
