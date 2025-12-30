/**
 * EventDetector Class
 * 
 * Detects significant space weather events for AI DJ announcements (Task 5).
 * Monitors M/X-class flares and Kp ≥ 5 geomagnetic storms.
 */

import { SpaceWeatherData, SolarFlare } from '@/types/nasa';
import {
  SpaceWeatherEventType,
  EventSeverity,
  AnySpaceWeatherEvent,
  MajorFlareEvent,
  GeomagneticStormEvent,
  SolarWindEvent,
  CompoundEvent,
  EventDetectionConfig,
  DEFAULT_EVENT_CONFIG,
  EventListener,
  EventHistoryEntry,
} from '@/types/events';
// Simple UUID generator (no external dependency)
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
import { 
  solarWindSpeedToBPM, 
  kpIndexToDistortion, 
  flareClassToVolumeBoost 
} from '@/lib/audio/sonification';

/**
 * EventDetector - Monitors space weather data and detects significant events
 * 
 * Features:
 * - Detects M/X-class solar flares
 * - Detects geomagnetic storms (Kp ≥ 5)
 * - Detects high solar wind events
 * - Supports compound event detection
 * - Event history tracking
 * - Event listener callbacks
 */
export class EventDetector {
  private config: EventDetectionConfig;
  private listeners: Set<EventListener> = new Set();
  private eventHistory: EventHistoryEntry[] = [];
  private previousData: SpaceWeatherData | null = null;
  private detectedFlareIds: Set<string> = new Set();

  constructor(config: Partial<EventDetectionConfig> = {}) {
    this.config = { ...DEFAULT_EVENT_CONFIG, ...config };
    console.log('EventDetector initialized with config:', this.config);
  }

  /**
   * Analyze space weather data and detect events
   * 
   * @param data - Current space weather data
   * @returns Array of detected events (if any)
   */
  analyzeData(data: SpaceWeatherData): AnySpaceWeatherEvent[] {
    const events: AnySpaceWeatherEvent[] = [];

    // Detect major solar flares
    const flareEvents = this.detectMajorFlares(data);
    events.push(...flareEvents);

    // Detect geomagnetic storms
    const stormEvent = this.detectGeomagneticStorm(data);
    if (stormEvent) events.push(stormEvent);

    // Detect high solar wind
    const windEvent = this.detectHighSolarWind(data);
    if (windEvent) events.push(windEvent);

    // Detect compound events
    if (this.config.detectCompoundEvents && events.length > 1) {
      const compoundEvent = this.createCompoundEvent(events, data);
      events.push(compoundEvent);
    }

    // Store events in history and notify listeners
    events.forEach(event => {
      this.addToHistory(event);
      this.notifyListeners(event);
    });

    // Update previous data for next comparison
    this.previousData = data;

    return events;
  }

  /**
   * Detect M-class or X-class solar flares
   */
  private detectMajorFlares(data: SpaceWeatherData): MajorFlareEvent[] {
    const events: MajorFlareEvent[] = [];

    for (const flare of data.flares) {
      // Check if we've already detected this flare
      if (this.detectedFlareIds.has(flare.id)) {
        continue;
      }

      // Check if flare class is in detection list
      if (this.config.flareClassesToDetect.includes(flare.classType as 'M' | 'X')) {
        const event = this.createFlareEvent(flare, data);
        events.push(event);
        
        // Mark as detected
        this.detectedFlareIds.add(flare.id);
      }
    }

    return events;
  }

  /**
   * Create a major flare event
   */
  private createFlareEvent(flare: SolarFlare, data: SpaceWeatherData): MajorFlareEvent {
    const audioBoost = flareClassToVolumeBoost(flare.flareClass);
    
    let severity: EventSeverity;
    if (flare.classType === 'X') {
      severity = flare.magnitude >= 5 ? EventSeverity.EXTREME : EventSeverity.SEVERE;
    } else {
      severity = flare.magnitude >= 5 ? EventSeverity.HIGH : EventSeverity.MODERATE;
    }

    return {
      id: uuidv4(),
      type: SpaceWeatherEventType.MAJOR_FLARE,
      severity,
      detectedAt: new Date(),
      description: `${flare.classType}${flare.magnitude} solar flare detected from ${flare.sourceRegion}`,
      data,
      flare,
      audioBoost,
      announced: false,
    };
  }

  /**
   * Detect geomagnetic storms (Kp >= 5)
   */
  private detectGeomagneticStorm(data: SpaceWeatherData): GeomagneticStormEvent | null {
    const kpIndex = data.geomagnetic.kp_index;

    // Check if storm is active
    if (kpIndex < this.config.minKpForStorm) {
      return null;
    }

    // Determine event type and severity
    let type: SpaceWeatherEventType;
    let severity: EventSeverity;

    if (kpIndex >= this.config.minKpForSevereStorm) {
      type = SpaceWeatherEventType.SEVERE_STORM;
      severity = kpIndex >= 8 ? EventSeverity.EXTREME : EventSeverity.SEVERE;
    } else {
      type = SpaceWeatherEventType.GEOMAGNETIC_STORM;
      severity = kpIndex >= 6 ? EventSeverity.HIGH : EventSeverity.MODERATE;
    }

    const distortionAmount = kpIndexToDistortion(kpIndex);

    return {
      id: uuidv4(),
      type,
      severity,
      detectedAt: new Date(),
      description: `${data.geomagnetic.storm_level} geomagnetic storm (Kp=${kpIndex})`,
      data,
      kpIndex,
      stormLevel: data.geomagnetic.storm_level,
      distortionAmount,
      announced: false,
    };
  }

  /**
   * Detect high solar wind events
   */
  private detectHighSolarWind(data: SpaceWeatherData): SolarWindEvent | null {
    const speed = data.solar_wind.speed;

    if (speed < this.config.minSpeedForHighWind) {
      return null;
    }

    // Determine event type and severity
    let type: SpaceWeatherEventType;
    let severity: EventSeverity;

    if (speed >= this.config.minSpeedForExtremeWind) {
      type = SpaceWeatherEventType.EXTREME_SOLAR_WIND;
      severity = speed >= 800 ? EventSeverity.EXTREME : EventSeverity.SEVERE;
    } else {
      type = SpaceWeatherEventType.HIGH_SOLAR_WIND;
      severity = speed >= 650 ? EventSeverity.HIGH : EventSeverity.MODERATE;
    }

    const suggestedBPM = solarWindSpeedToBPM(speed);

    return {
      id: uuidv4(),
      type,
      severity,
      detectedAt: new Date(),
      description: `High solar wind speed detected (${speed.toFixed(0)} km/s)`,
      data,
      speed,
      suggestedBPM,
      announced: false,
    };
  }

  /**
   * Create a compound event from multiple simultaneous events
   */
  private createCompoundEvent(
    subEvents: AnySpaceWeatherEvent[],
    data: SpaceWeatherData
  ): CompoundEvent {
    // Calculate combined intensity
    const severityWeights = {
      [EventSeverity.LOW]: 0.2,
      [EventSeverity.MODERATE]: 0.4,
      [EventSeverity.HIGH]: 0.6,
      [EventSeverity.SEVERE]: 0.8,
      [EventSeverity.EXTREME]: 1.0,
    };

    const intensity = Math.min(
      1,
      subEvents.reduce((sum, event) => sum + severityWeights[event.severity], 0) / subEvents.length
    );

    // Determine overall severity
    const maxSeverity = subEvents.reduce((max, event) => {
      const weights = Object.values(EventSeverity);
      const currentIndex = weights.indexOf(event.severity);
      const maxIndex = weights.indexOf(max);
      return currentIndex > maxIndex ? event.severity : max;
    }, EventSeverity.LOW);

    const eventTypes = subEvents.map(e => e.type).join(', ');

    return {
      id: uuidv4(),
      type: SpaceWeatherEventType.COMPOUND_EVENT,
      severity: maxSeverity,
      detectedAt: new Date(),
      description: `Multiple space weather events detected: ${eventTypes}`,
      data,
      subEvents,
      intensity,
      announced: false,
    };
  }

  /**
   * Add event listener
   */
  addEventListener(listener: EventListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: EventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of a new event
   */
  private notifyListeners(event: AnySpaceWeatherEvent): void {
    console.log('Event detected:', event.type, event.description);
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Add event to history
   */
  private addToHistory(event: AnySpaceWeatherEvent): void {
    this.eventHistory.push({
      event,
      timestamp: new Date(),
      wasAnnounced: event.announced || false,
    });

    // Keep history size manageable (last 100 events)
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-100);
    }
  }

  /**
   * Get event history
   */
  getHistory(): EventHistoryEntry[] {
    return [...this.eventHistory];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SpaceWeatherEventType): EventHistoryEntry[] {
    return this.eventHistory.filter(entry => entry.event.type === type);
  }

  /**
   * Get recent events (last N events)
   */
  getRecentEvents(count: number = 10): EventHistoryEntry[] {
    return this.eventHistory.slice(-count);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.detectedFlareIds.clear();
    console.log('Event history cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EventDetectionConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('EventDetector config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): EventDetectionConfig {
    return { ...this.config };
  }
}