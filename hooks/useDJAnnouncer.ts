/**
 * DJ Announcer Hook
 * 
 * React hook for integrating "The Operator" AI DJ with the application.
 * Automatically announces space weather events detected by EventDetector.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnySpaceWeatherEvent, DJScriptResponse } from '@/types/events';
import { EventDetector } from '@/lib/events/EventDetector';
import { useAudioStore } from '@/store/audioStore';

/**
 * Hook for DJ announcer functionality
 * 
 * Features:
 * - Generate AI scripts for space weather events
 * - Auto-announce new events
 * - Track announcement history
 * - Prevent duplicate announcements
 */
export function useDJAnnouncer() {
  const [currentAnnouncement, setCurrentAnnouncement] = useState<DJScriptResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [announcementHistory, setAnnouncementHistory] = useState<DJScriptResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const { spaceWeatherData } = useAudioStore();
  const eventDetectorRef = useRef<EventDetector | null>(null);
  const announcedEventsRef = useRef<Set<string>>(new Set());

  // Initialize event detector
  useEffect(() => {
    if (!eventDetectorRef.current) {
      eventDetectorRef.current = new EventDetector();
    }
  }, []);

  /**
   * Generate DJ script for an event
   * 
   * @param event - The space weather event to announce
   * @returns The generated script response or null if failed
   */
  const announce = useCallback(async (event: AnySpaceWeatherEvent): Promise<DJScriptResponse | null> => {
    // Prevent duplicate announcements
    if (announcedEventsRef.current.has(event.id)) {
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          includeContext: true,
          currentData: spaceWeatherData
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const script: DJScriptResponse = await response.json();
      
      // Mark event as announced
      announcedEventsRef.current.add(event.id);
      
      // Update state
      setCurrentAnnouncement(script);
      setAnnouncementHistory(prev => [script, ...prev].slice(0, 10)); // Keep last 10
      
      return script;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate announcement';
      console.error('🎙️ DJ Announcer error:', error);
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [spaceWeatherData]);

  /**
   * Auto-announce when new events are detected
   * Analyzes space weather data and announces significant events
   */
  useEffect(() => {
    if (!spaceWeatherData || !eventDetectorRef.current) {
      return;
    }

    try {
      // Detect events from current space weather data
      const events = eventDetectorRef.current.analyzeData(spaceWeatherData);
      
      // Announce the most severe unannounced event
      if (events.length > 0) {
        // Find most severe event that hasn't been announced
        const unannounced = events
          .filter(event => !announcedEventsRef.current.has(event.id))
          .sort((a, b) => {
            const severityOrder = ['LOW', 'MODERATE', 'HIGH', 'SEVERE', 'EXTREME'];
            return severityOrder.indexOf(b.severity) - severityOrder.indexOf(a.severity);
          });
        
        if (unannounced.length > 0) {
          const mostSevere = unannounced[0];
          announce(mostSevere);
        }
      }
    } catch (error) {
      console.error('🎙️ DJ Announcer: Error analyzing events:', error);
    }
  }, [spaceWeatherData, announce]);

  /**
   * Manually trigger an announcement for a specific event
   */
  const announceEvent = useCallback((event: AnySpaceWeatherEvent) => {
    return announce(event);
  }, [announce]);

  /**
   * Clear announcement history
   */
  const clearHistory = useCallback(() => {
    setAnnouncementHistory([]);
    announcedEventsRef.current.clear();
  }, []);

  /**
   * Get event detector instance for advanced usage
   */
  const getEventDetector = useCallback(() => {
    return eventDetectorRef.current;
  }, []);

  return {
    // Current state
    currentAnnouncement,
    announcementHistory,
    isGenerating,
    error,
    
    // Actions
    announceEvent,
    clearHistory,
    getEventDetector,
  };
}

/**
 * Hook to get just the current announcement (lightweight)
 */
export function useCurrentAnnouncement() {
  const { currentAnnouncement, isGenerating } = useDJAnnouncer();
  return { currentAnnouncement, isGenerating };
}

/**
 * Hook to get announcement history only
 */
export function useAnnouncementHistory() {
  const { announcementHistory } = useDJAnnouncer();
  return announcementHistory;
}