/**
 * NASA Space Weather Data Type Definitions
 * Types for DONKI API integration and space weather data structures
 */

/**
 * Solar Flare data from NASA DONKI
 */
export interface SolarFlare {
  id: string;
  flareClass: string;           // "C5.2", "M3.1", "X1.5"
  classType: 'C' | 'M' | 'X';   // Parsed class letter
  magnitude: number;             // Numeric magnitude
  timestamp: string;             // ISO format
  sourceRegion: string;
  peakTime: string;
}

/**
 * Geomagnetic storm data
 */
export interface GeomagneticData {
  kp_index: number;              // 0-9 scale
  storm_active: boolean;         // kp >= 5
  storm_level: string;           // "None", "Minor", "Moderate", "Strong", "Severe"
  timestamp: string;
}

/**
 * Solar wind data
 */
export interface SolarWind {
  speed: number;                 // km/s (300-800 typical)
  density: number;               // particles/cm³
  temperature: number;           // Kelvin
  timestamp: string;
}

/**
 * Complete space weather data payload
 */
export interface SpaceWeatherData {
  timestamp: string;             // Data fetch time
  solar_wind: SolarWind;
  geomagnetic: GeomagneticData;
  flares: SolarFlare[];          // Last 24 hours
  data_source: 'live' | 'cached' | 'demo';
}

/**
 * NASA DONKI API response types
 */
export interface NASAFlareResponse {
  flrID: string;
  instruments: Array<{
    displayName: string;
  }>;
  beginTime: string;
  peakTime: string;
  endTime: string;
  classType: string;
  sourceLocation: string;
  activeRegionNum: number | null;
  linkedEvents: Array<{
    activityID: string;
  }> | null;
  link: string;
}

export interface NASAGSTResponse {
  gstID: string;
  startTime: string;
  allKpIndex: Array<{
    observedTime: string;
    kpIndex: number;
    source: string;
  }>;
  linkedEvents: Array<{
    activityID: string;
  }> | null;
  link: string;
}