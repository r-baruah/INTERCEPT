/**
 * Sonification Algorithms
 * 
 * Transforms NASA space weather data into audio parameters using scientifically-informed
 * mapping functions. Each function implements a specific data-to-audio transformation.
 */

import { SpaceWeatherData } from '@/types/nasa';

/**
 * Maps solar wind speed to beats per minute (BPM)
 * Formula: Linear interpolation from 300-800 km/s → 60-140 BPM
 * 
 * @param speed - Solar wind speed in km/s (typical range: 300-800)
 * @returns BPM value between 60-140
 * 
 * @example
 * ```ts
 * solarWindSpeedToBPM(550) // Returns ~100 BPM
 * ```
 */
export function solarWindSpeedToBPM(speed: number): number {
  const MIN_SPEED = 300;
  const MAX_SPEED = 800;
  const MIN_BPM = 60;
  const MAX_BPM = 140;

  // Clamp speed to valid range
  const clampedSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));

  // Linear interpolation
  const normalized = (clampedSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
  return MIN_BPM + normalized * (MAX_BPM - MIN_BPM);
}

/**
 * Maps Kp index to distortion amount using exponential curve
 * Formula: Exponential mapping from 0-9 → 0-0.8
 * 
 * @param kpIndex - Kp geomagnetic index (0-9 scale)
 * @returns Distortion amount between 0-0.8
 * 
 * @example
 * ```ts
 * kpIndexToDistortion(5) // Returns ~0.4 (moderate distortion)
 * kpIndexToDistortion(9) // Returns 0.8 (maximum distortion)
 * ```
 */
export function kpIndexToDistortion(kpIndex: number): number {
  const MIN_KP = 0;
  const MAX_KP = 9;
  const MIN_DISTORTION = 0;
  const MAX_DISTORTION = 0.8;

  // Clamp Kp index
  const clampedKp = Math.max(MIN_KP, Math.min(MAX_KP, kpIndex));

  // Exponential curve (x^2 for smooth crescendo)
  const normalized = clampedKp / MAX_KP;
  const exponential = Math.pow(normalized, 2);

  return MIN_DISTORTION + exponential * (MAX_DISTORTION - MIN_DISTORTION);
}

/**
 * Maps solar wind density to filter cutoff frequency
 * Formula: Linear interpolation from 0-50 particles/cm³ → 400-2000 Hz
 * 
 * @param density - Solar wind density in particles/cm³ (typical range: 0-50)
 * @returns Filter frequency in Hz between 400-2000
 * 
 * @example
 * ```ts
 * solarWindDensityToFilterFreq(25) // Returns ~1200 Hz
 * ```
 */
export function solarWindDensityToFilterFreq(density: number): number {
  const MIN_DENSITY = 0;
  const MAX_DENSITY = 50;
  const MIN_FREQ = 400;
  const MAX_FREQ = 2000;

  // Clamp density
  const clampedDensity = Math.max(MIN_DENSITY, Math.min(MAX_DENSITY, density));

  // Linear interpolation
  const normalized = clampedDensity / MAX_DENSITY;
  return MIN_FREQ + normalized * (MAX_FREQ - MIN_FREQ);
}

/**
 * Maps solar flare class to volume boost in decibels
 * Formula: Discrete mapping based on flare classification
 * 
 * @param flareClass - Flare classification string (e.g., "X2.1", "M5.5", "C1.2")
 * @returns Volume boost in dB (C: +3, M: +6, X: +12, default: 0)
 * 
 * @example
 * ```ts
 * flareClassToVolumeBoost("X2.1") // Returns 12
 * flareClassToVolumeBoost("M5.5") // Returns 6
 * flareClassToVolumeBoost("C1.2") // Returns 3
 * ```
 */
export function flareClassToVolumeBoost(flareClass: string): number {
  if (!flareClass || flareClass.length === 0) {
    return 0;
  }

  const classLetter = flareClass.charAt(0).toUpperCase();

  switch (classLetter) {
    case 'X':
      return 12; // Major flare
    case 'M':
      return 6;  // Moderate flare
    case 'C':
      return 3;  // Minor flare
    case 'B':
    case 'A':
      return 0;  // Minimal flares (no boost)
    default:
      return 0;
  }
}

/**
 * Extracts numeric magnitude from flare class string
 * 
 * @param flareClass - Flare classification string (e.g., "X2.1")
 * @returns Numeric magnitude (e.g., 2.1) or 0 if invalid
 * 
 * @example
 * ```ts
 * getFlareClassMagnitude("X2.1") // Returns 2.1
 * getFlareClassMagnitude("M5.5") // Returns 5.5
 * ```
 */
export function getFlareClassMagnitude(flareClass: string): number {
  if (!flareClass || flareClass.length < 2) {
    return 0;
  }

  const magnitudeStr = flareClass.substring(1);
  const magnitude = parseFloat(magnitudeStr);

  return isNaN(magnitude) ? 0 : magnitude;
}

/**
 * Comprehensive sonification mapping from space weather data to audio parameters
 * Combines all individual mapping functions into a single transformation
 * 
 * @param data - Space weather data from NASA API
 * @returns Object containing all audio parameters
 * 
 * @example
 * ```ts
 * const audioParams = mapSpaceWeatherToAudio(spaceWeatherData);
 * audioEngine.setTempo(audioParams.bpm);
 * audioEngine.setDistortion(audioParams.distortion);
 * ```
 */
export function mapSpaceWeatherToAudio(data: SpaceWeatherData) {
  const bpm = solarWindSpeedToBPM(data.solar_wind.speed);
  const distortion = kpIndexToDistortion(data.geomagnetic.kp_index);
  const filterFreq = solarWindDensityToFilterFreq(data.solar_wind.density);
  
  // Get most recent flare class (if any)
  const latestFlare = data.flares.length > 0 ? data.flares[0] : null;
  const volumeBoost = latestFlare ? flareClassToVolumeBoost(latestFlare.flareClass) : 0;

  // Calculate intensity (0-1 scale) for general audio processing
  const intensity = Math.min(1, (
    (data.solar_wind.speed / 800) * 0.3 +
    (data.geomagnetic.kp_index / 9) * 0.4 +
    (data.solar_wind.density / 50) * 0.3
  ));

  return {
    bpm,
    distortion,
    filterFreq,
    volumeBoost,
    intensity,
    // Raw values for reference
    raw: {
      solarWindSpeed: data.solar_wind.speed,
      kpIndex: data.geomagnetic.kp_index,
      density: data.solar_wind.density,
      flareClass: latestFlare?.flareClass || 'None',
      flareMagnitude: latestFlare ? getFlareClassMagnitude(latestFlare.flareClass) : 0,
    },
  };
}

/**
 * Validates if space weather data is within expected ranges
 * Useful for detecting anomalies or data quality issues
 * 
 * @param data - Space weather data to validate
 * @returns Object with validation results
 */
export function validateSpaceWeatherData(data: SpaceWeatherData): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (data.solar_wind.speed < 200 || data.solar_wind.speed > 1000) {
    warnings.push(`Solar wind speed ${data.solar_wind.speed} km/s is outside typical range (200-1000)`);
  }

  if (data.geomagnetic.kp_index < 0 || data.geomagnetic.kp_index > 9) {
    warnings.push(`Kp index ${data.geomagnetic.kp_index} is outside valid range (0-9)`);
  }

  if (data.solar_wind.density < 0 || data.solar_wind.density > 100) {
    warnings.push(`Solar wind density ${data.solar_wind.density} particles/cm³ is outside typical range (0-100)`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

/**
 * Smoothly interpolates between two audio parameter sets
 * Useful for transitioning between different space weather states
 * 
 * @param from - Starting audio parameters
 * @param to - Target audio parameters
 * @param alpha - Interpolation factor (0-1)
 * @returns Interpolated audio parameters
 */
export function interpolateAudioParams(
  from: ReturnType<typeof mapSpaceWeatherToAudio>,
  to: ReturnType<typeof mapSpaceWeatherToAudio>,
  alpha: number
): ReturnType<typeof mapSpaceWeatherToAudio> {
  const t = Math.max(0, Math.min(1, alpha));

  const lerp = (a: number, b: number) => a + (b - a) * t;

  return {
    bpm: lerp(from.bpm, to.bpm),
    distortion: lerp(from.distortion, to.distortion),
    filterFreq: lerp(from.filterFreq, to.filterFreq),
    volumeBoost: lerp(from.volumeBoost, to.volumeBoost),
    intensity: lerp(from.intensity, to.intensity),
    raw: to.raw, // Use target raw values
  };
}