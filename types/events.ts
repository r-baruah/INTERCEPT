/**
 * Event Detection Types
 * 
 * Types for detecting and handling significant space weather events
 * Used by EventDetector and AI DJ system (Task 5)
 */

import { SpaceWeatherData, SolarFlare } from './nasa';

/**
 * Types of detectable space weather events
 */
export enum SpaceWeatherEventType {
  /** M-class or X-class solar flare detected */
  MAJOR_FLARE = 'MAJOR_FLARE',
  
  /** Geomagnetic storm with Kp >= 5 */
  GEOMAGNETIC_STORM = 'GEOMAGNETIC_STORM',
  
  /** Severe geomagnetic storm with Kp >= 7 */
  SEVERE_STORM = 'SEVERE_STORM',
  
  /** High solar wind speed (>600 km/s) */
  HIGH_SOLAR_WIND = 'HIGH_SOLAR_WIND',
  
  /** Extremely high solar wind speed (>700 km/s) */
  EXTREME_SOLAR_WIND = 'EXTREME_SOLAR_WIND',
  
  /** Combination of multiple simultaneous events */
  COMPOUND_EVENT = 'COMPOUND_EVENT',
}

/**
 * Severity levels for space weather events
 */
export enum EventSeverity {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  SEVERE = 'SEVERE',
  EXTREME = 'EXTREME',
}

/**
 * Base interface for all space weather events
 */
export interface SpaceWeatherEvent {
  /** Unique event identifier */
  id: string;
  
  /** Type of event */
  type: SpaceWeatherEventType;
  
  /** Severity level */
  severity: EventSeverity;
  
  /** When the event was detected */
  detectedAt: Date;
  
  /** Human-readable description */
  description: string;
  
  /** Associated space weather data snapshot */
  data: SpaceWeatherData;
  
  /** Whether this event has been announced (for AI DJ) */
  announced?: boolean;
}

/**
 * Major solar flare event (M or X class)
 */
export interface MajorFlareEvent extends SpaceWeatherEvent {
  type: SpaceWeatherEventType.MAJOR_FLARE;
  
  /** The flare that triggered this event */
  flare: SolarFlare;
  
  /** Audio boost to apply (in dB) */
  audioBoost: number;
}

/**
 * Geomagnetic storm event (Kp >= 5)
 */
export interface GeomagneticStormEvent extends SpaceWeatherEvent {
  type: SpaceWeatherEventType.GEOMAGNETIC_STORM | SpaceWeatherEventType.SEVERE_STORM;
  
  /** Current Kp index */
  kpIndex: number;
  
  /** Storm level description */
  stormLevel: string;
  
  /** Suggested distortion amount */
  distortionAmount: number;
}

/**
 * High solar wind event
 */
export interface SolarWindEvent extends SpaceWeatherEvent {
  type: SpaceWeatherEventType.HIGH_SOLAR_WIND | SpaceWeatherEventType.EXTREME_SOLAR_WIND;
  
  /** Current solar wind speed (km/s) */
  speed: number;
  
  /** Suggested BPM */
  suggestedBPM: number;
}

/**
 * Compound event (multiple simultaneous conditions)
 */
export interface CompoundEvent extends SpaceWeatherEvent {
  type: SpaceWeatherEventType.COMPOUND_EVENT;
  
  /** Contributing events */
  subEvents: SpaceWeatherEvent[];
  
  /** Combined intensity factor (0-1) */
  intensity: number;
}

/**
 * Union type of all possible events
 */
export type AnySpaceWeatherEvent = 
  | MajorFlareEvent 
  | GeomagneticStormEvent 
  | SolarWindEvent 
  | CompoundEvent;

/**
 * Event detection configuration
 */
export interface EventDetectionConfig {
  /** Minimum Kp index to trigger geomagnetic storm event (default: 5) */
  minKpForStorm: number;
  
  /** Minimum Kp index to trigger severe storm event (default: 7) */
  minKpForSevereStorm: number;
  
  /** Minimum solar wind speed for high wind event in km/s (default: 600) */
  minSpeedForHighWind: number;
  
  /** Minimum solar wind speed for extreme wind event in km/s (default: 700) */
  minSpeedForExtremeWind: number;
  
  /** Flare classes to detect (default: ['M', 'X']) */
  flareClassesToDetect: ('M' | 'X')[];
  
  /** Enable compound event detection (default: true) */
  detectCompoundEvents: boolean;
}

/**
 * Default event detection configuration
 */
export const DEFAULT_EVENT_CONFIG: EventDetectionConfig = {
  minKpForStorm: 5,
  minKpForSevereStorm: 7,
  minSpeedForHighWind: 600,
  minSpeedForExtremeWind: 700,
  flareClassesToDetect: ['M', 'X'],
  detectCompoundEvents: true,
};

/**
 * Event listener callback type
 */
export type EventListener = (event: AnySpaceWeatherEvent) => void;

/**
 * Event history entry for tracking detected events
 */
export interface EventHistoryEntry {
  event: AnySpaceWeatherEvent;
  timestamp: Date;
  wasAnnounced: boolean;
}

/**
 * DJ Script Request - sent to Groq API endpoint
 */
export interface DJScriptRequest {
  event: AnySpaceWeatherEvent;
  includeContext?: boolean;  // Include current conditions
  currentData?: SpaceWeatherData;
}

/**
 * DJ Script Response - returned from Groq API endpoint
 */
export interface DJScriptResponse {
  script: string;
  event_id: string;
  timestamp: string;
  character_count: number;
  cached?: boolean;
  fallback?: boolean;
  error?: string;
}