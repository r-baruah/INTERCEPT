'use client';

import { useEffect, useState } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { EventDetector } from '@/lib/events/EventDetector';
import { AnySpaceWeatherEvent } from '@/types/events';

export function EventFeed() {
  const { spaceWeatherData } = useAudioStore();
  const [eventDetector] = useState(() => new EventDetector());
  const [recentEvents, setRecentEvents] = useState<AnySpaceWeatherEvent[]>([]);
  
  // Monitor space weather data for events
  useEffect(() => {
    if (spaceWeatherData) {
      const events = eventDetector.analyzeData(spaceWeatherData);
      if (events.length > 0) {
        setRecentEvents(prev => [...events, ...prev].slice(0, 5));
      }
    }
  }, [spaceWeatherData, eventDetector]);
  
  if (recentEvents.length === 0) {
    return (
      <div className="bg-black/70 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-mono text-gray-400 mb-4 flex items-center gap-2">
          <span>📡</span>
          Event Feed
        </h3>
        <div className="text-center text-gray-500 font-mono text-sm py-8">
          No significant events detected yet...
        </div>
      </div>
    );
  }
  
  const getEventColor = (severity: string) => {
    switch (severity) {
      case 'EXTREME':
        return 'border-red-500 bg-red-900/20';
      case 'SEVERE':
        return 'border-orange-500 bg-orange-900/20';
      case 'MODERATE':
      case 'HIGH':
        return 'border-yellow-500 bg-yellow-900/20';
      default:
        return 'border-green-500 bg-green-900/20';
    }
  };
  
  const getEventIcon = (type: string) => {
    if (type.includes('FLARE')) return '☀️';
    if (type.includes('STORM')) return '⚡';
    if (type.includes('WIND')) return '💨';
    return '📊';
  };
  
  return (
    <div className="bg-black/70 border-2 border-purple-500/50 rounded-lg p-6 crt-glow">
      <h3 className="text-purple-400 font-mono text-xl uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>📡</span>
        Event Feed
      </h3>
      <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-black/50">
        {recentEvents.map((event) => (
          <div
            key={event.id}
            className={`rounded-lg p-3 border-l-4 ${getEventColor(event.severity)} transition-all hover:scale-[1.02]`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getEventIcon(event.type)}</span>
                <div className="font-semibold text-white font-mono text-sm uppercase">
                  {event.type.replace(/_/g, ' ')}
                </div>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                {event.detectedAt.toLocaleTimeString()}
              </div>
            </div>
            <div className="text-sm text-gray-300 font-mono leading-relaxed">
              {event.description}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                event.severity === 'EXTREME' ? 'bg-red-500/20 text-red-400' :
                event.severity === 'SEVERE' ? 'bg-orange-500/20 text-orange-400' :
                event.severity === 'HIGH' || event.severity === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {event.severity}
              </span>
              {event.severity !== 'LOW' && (
                <span className="text-xs text-gray-500 font-mono">
                  • Sonification adjusted
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}