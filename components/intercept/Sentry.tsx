'use client';

import { useEffect, useRef, useState } from 'react';
import { useSpaceWeatherData, useAudioStore } from '@/store/audioStore';
import { useBroadcast } from '@/hooks/useBroadcast';

interface SentryMessage {
    id: string;
    text: string;
    priority: 'info' | 'warning' | 'critical';
    timestamp: Date;
}

/**
 * The Sentry - Notification System
 * Floating overlay for critical alerts.
 */
export function Sentry() {
    const { data } = useSpaceWeatherData();
    const { audioEngine, isPlaying } = useAudioStore();
    const [messages, setMessages] = useState<SentryMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState<SentryMessage | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // ... (Logic remains largely the same, just refined triggers) ...

    // Announce function
    const announce = (text: string, priority: SentryMessage['priority'] = 'info') => {
        const message: SentryMessage = {
            id: Date.now().toString(),
            text,
            priority,
            timestamp: new Date(),
        };
        setCurrentMessage(message);
        setIsVisible(true);
        setMessages(prev => [message, ...prev].slice(0, 5));

        if (audioEngine && isPlaying) {
            audioEngine.speak(text);
            if (priority === 'critical') audioEngine.triggerAlert('danger');
            else if (priority === 'warning') audioEngine.triggerAlert('warning');
        }

        setTimeout(() => setIsVisible(false), 6000);
    };

    const hasAnnouncedLockRef = useRef(false);
    const lastAnnouncedEventRef = useRef<string | null>(null);

    useEffect(() => {
        if (isPlaying && !hasAnnouncedLockRef.current) {
            // Slight delay to let the music swell first
            setTimeout(() => announce('Signal acquired. Telemetry live.', 'info'), 1500);
            hasAnnouncedLockRef.current = true;
        }
        if (!isPlaying) hasAnnouncedLockRef.current = false;
    }, [isPlaying]);

    // Monitor for Extreme Space Weather Events
    useEffect(() => {
        if (!data || !isPlaying) return;

        const { geomagnetic, flares } = data;
        const currentEventId = flares.length > 0 ? flares[0].id : `storm_${geomagnetic.kp_index}`;
        
        // Prevent duplicate announcements
        if (lastAnnouncedEventRef.current === currentEventId) return;

        // Check for X-Class Flares or Extreme Storms
        const isXClass = flares.some(f => f.classType === 'X');
        const isExtremeStorm = geomagnetic.storm_level === 'Extreme' || geomagnetic.kp_index >= 9;

        if (isXClass || isExtremeStorm) {
            const alertText = isXClass 
                ? "ALERT: X-CLASS FLARE DETECTED // SIGNAL DEGRADATION IMMINENT"
                : "ALERT: EXTREME GEOMAGNETIC STORM DETECTED // CRITICAL FAILURE IMMINENT";
            
            announce(alertText, 'critical');
            
            // Specific Audio Announcement for the Simulation Scenario
            if (audioEngine) {
                 audioEngine.speak("WARNING. GEOMAGNETIC STORM LEVEL G5 DETECTED. IONOSPHERE COMPROMISED.");
            }

            lastAnnouncedEventRef.current = currentEventId;
        }

    }, [data, audioEngine, isPlaying]);

    // Broadcast Hook
    useBroadcast({
        enabled: isPlaying,
        onBroadcast: (msg) => {
            // Filter out generic weather updates to avoid mismatch with live Rack data
            // Sentry is for narrative events and critical alerts only.
            if (msg.type === 'WEATHER_UPDATE') return;

            let p: SentryMessage['priority'] = 'info';
            if (msg.priority >= 4) p = 'critical';
            else if (msg.priority >= 3) p = 'warning';

            let text = msg.headline;
            if (msg.type === 'DJ_ANNOUNCEMENT') text = `Incoming: ${msg.content}`;
            else if (msg.content) text = `${msg.headline}: ${msg.content}`;

            announce(text, p);
        }
    });

    if (!currentMessage) return null;

    return (
        <div
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
                }`}
        >
            <div className={`
                px-8 py-4 backdrop-blur-sm border rounded-sm shadow-2xl
                flex items-center gap-4 min-w-[320px] justify-center
                transition-colors duration-300
                ${currentMessage.priority === 'critical' ? 'bg-black/90 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.2)]' :
                    currentMessage.priority === 'warning' ? 'bg-black/90 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' :
                        'bg-black/90 border-zinc-700'}
             `}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${currentMessage.priority === 'critical' ? 'bg-red-500' :
                        currentMessage.priority === 'warning' ? 'bg-amber-500' : 'bg-white'
                    }`} />

                <div className="flex flex-col text-center">
                    <span className="font-mono text-[9px] tracking-[0.2em] text-zinc-400 uppercase mb-1">
                        SENTRY ALERT
                    </span>
                    <span className={`font-mono text-xs tracking-wider uppercase ${currentMessage.priority === 'critical' ? 'text-red-400' :
                            currentMessage.priority === 'warning' ? 'text-amber-400' : 'text-zinc-200'
                        }`}>
                        {currentMessage.text}
                    </span>
                </div>
            </div>
        </div>
    );
}