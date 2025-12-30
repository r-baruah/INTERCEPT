'use client';

import { ReactNode } from 'react';
import { useSpaceWeatherData } from '@/store/audioStore';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Main Layout Component
 * 
 * Provides the structural framework for the Intercept Terminal.
 * Handles the absolute positioning of the HUD, Sentry, and other overlay elements,
 * ensuring they sit correctly above the visual core (SignalScope).
 */
export function MainLayout({ children }: MainLayoutProps) {
  const { data } = useSpaceWeatherData();
  const kpIndex = data?.geomagnetic?.kp_index ?? 0;
  const isStorm = data?.geomagnetic?.storm_active ?? false;
  
  // Dynamic CRT Intensity
  // Kp < 5: 0.1 (10%)
  // Kp >= 5: Scales up to 0.25 (25%)
  const scanlineOpacity = isStorm || kpIndex >= 7 ? 0.25 : 0.1;
  const isCritical = kpIndex >= 8;

  return (
    <div className={`
      relative w-full h-full min-h-screen overflow-hidden bg-black text-white selection:bg-white selection:text-black
      ${isCritical ? 'animate-shake' : ''}
    `}>
      {/* Global CSS rumble for Critical state */}
      <style jsx global>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-shake {
          animation: shake 0.5s infinite;
        }
        
        /* Global Red Shift during Storm */
        ${isCritical ? `
          :root {
            --color-nominal: #ef4444 !important;
            --color-signal-locked: #ef4444 !important;
            --color-text-primary: #fca5a5 !important;
            --color-text-secondary: #ef4444 !important;
            --color-text-muted: #7f1d1d !important;
          }
          /* Force red borders on key containers */
          .border-zinc-800 { border-color: rgba(239, 68, 68, 0.5) !important; }
          .border-emerald-500 { border-color: #ef4444 !important; }
          .text-emerald-500 { color: #ef4444 !important; }
          .bg-emerald-500 { background-color: #ef4444 !important; }
        ` : ''}
      `}</style>

      {children}
      
      {/* Global CRT Scanline Overlay - Always on top */}
      <div 
        className="fixed inset-0 pointer-events-none z-[100] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"
        style={{ opacity: scanlineOpacity, transition: 'opacity 1s ease-out' }} 
      />
      
      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[90] bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}