/**
 * Heliospheric Sonification Algorithms v2.0
 * 
 * Transforms NASA space weather telemetry into audio parameters
 * optimized for the 4-layer Heliospheric Audio Engine.
 * 
 * Layer Mapping:
 * - Solar Wind Speed → Drone LFO Rate (breathing)
 * - Solar Wind Density → Drone Filter Cutoff (clarity)
 * - Kp Index → BitCrusher + Tape Warble (interference)
 * - Signal Lock → Atmosphere Noise Volume (lo-fi texture)
 * - Flare Class → Volume Boost (dramatic swells)
 */

import { SpaceWeatherData } from '@/types/nasa';

/**
 * Normalize a value from one range to another
 */
function normalize(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const clamped = Math.max(inMin, Math.min(inMax, value));
  const normalized = (clamped - inMin) / (inMax - inMin);
  return outMin + normalized * (outMax - outMin);
}

/**
 * Maps solar wind speed to drone LFO rate
 * 
 * Slow wind (300 km/s): Drone breathes slowly like ocean waves (0.05 Hz)
 * Fast wind (800 km/s): Drone pulses rapidly like helicopter tension (2.0 Hz)
 * 
 * NOTE: We pass this as 'bpm' to the AudioEngine, which interprets it as wind speed
 * 
 * @param speed - Solar wind speed in km/s (typical: 300-800)
 * @returns Value to pass to AudioEngine (the raw speed for internal mapping)
 */
export function solarWindSpeedToLFORate(speed: number): number {
  // Return the raw speed - AudioEngine will map it to LFO rate internally
  return Math.max(300, Math.min(800, speed));
}

/**
 * Maps solar wind density to filter cutoff frequency
 * 
 * Low density (0): Sound is muffled, dark, underwater (300 Hz)
 * High density (50): Filter opens up, bright and buzzing (3000 Hz)
 * 
 * @param density - Solar wind density in particles/cm³ (typical: 0-50)
 * @returns Filter frequency in Hz (300-3000)
 */
export function solarWindDensityToFilterFreq(density: number): number {
  return normalize(density, 0, 50, 300, 3000);
}

/**
 * Maps Kp index directly to normalized interference value
 * 
 * The AudioEngine handles the actual BitCrusher/Warble logic:
 * - Kp 0-3: Clean (no interference)
 * - Kp 4-6: Tape warble (vintage sampler)
 * - Kp 7-9: Digital shredding (4-bit destruction)
 * 
 * @param kpIndex - Kp geomagnetic index (0-9 scale)
 * @returns Normalized Kp value (0-1) for AudioEngine
 */
export function kpIndexToInterference(kpIndex: number): number {
  const clamped = Math.max(0, Math.min(9, kpIndex));

  // Use exponential curve for more dramatic high-end
  const normalized = clamped / 9;
  return Math.pow(normalized, 1.5) * 0.9; // Max 0.9 to leave headroom
}

/**
 * Legacy function name for compatibility
 * @deprecated Use kpIndexToInterference instead
 */
export function kpIndexToDistortion(kpIndex: number): number {
  return kpIndexToInterference(kpIndex);
}

/**
 * Maps solar flare class to volume boost in decibels
 * 
 * A/B: No boost (background flares)
 * C: +3dB (minor enhancement)
 * M: +6dB (moderate swell)
 * X: +12dB (dramatic crescendo)
 * 
 * @param flareClass - Flare classification string (e.g., "X2.1")
 * @returns Volume boost in dB
 */
export function flareClassToVolumeBoost(flareClass: string): number {
  if (!flareClass || flareClass.length === 0) return 0;

  const classLetter = flareClass.charAt(0).toUpperCase();

  switch (classLetter) {
    case 'X': return 12;
    case 'M': return 6;
    case 'C': return 3;
    case 'B':
    case 'A':
    default: return 0;
  }
}

/**
 * Extracts numeric magnitude from flare class
 * @param flareClass - e.g., "X2.1" → 2.1
 */
export function getFlareClassMagnitude(flareClass: string): number {
  if (!flareClass || flareClass.length < 2) return 0;
  const magnitude = parseFloat(flareClass.substring(1));
  return isNaN(magnitude) ? 0 : magnitude;
}

/**
 * Calculate overall intensity (0-1 scale)
 * Used for mixing decisions in AudioEngine
 */
export function calculateIntensity(data: SpaceWeatherData): number {
  const windContribution = normalize(data.solar_wind.speed, 300, 800, 0, 1) * 0.25;
  const kpContribution = (data.geomagnetic.kp_index / 9) * 0.4;
  const densityContribution = normalize(data.solar_wind.density, 0, 50, 0, 1) * 0.2;

  // Flare bonus
  const latestFlare = data.flares.length > 0 ? data.flares[0] : null;
  const flareBonus = latestFlare ? (flareClassToVolumeBoost(latestFlare.flareClass) / 12) * 0.15 : 0;

  return Math.min(1, windContribution + kpContribution + densityContribution + flareBonus);
}

/**
 * MAIN SONIFICATION FUNCTION
 * 
 * Comprehensive mapping from space weather data to audio parameters
 * optimized for the Heliospheric Audio Engine v4.0
 * 
 * @param data - Space weather data from NASA API
 * @returns Audio parameters for AudioEngine.updateParameters()
 */
export function mapSpaceWeatherToAudio(data: SpaceWeatherData) {
  // Layer 1: Drone parameters
  const windSpeed = solarWindSpeedToLFORate(data.solar_wind.speed);
  const filterFreq = solarWindDensityToFilterFreq(data.solar_wind.density);

  // Layer 3: Interference parameters
  const interference = kpIndexToInterference(data.geomagnetic.kp_index);

  // Flare effects
  const latestFlare = data.flares.length > 0 ? data.flares[0] : null;
  const volumeBoost = latestFlare ? flareClassToVolumeBoost(latestFlare.flareClass) : 0;

  // Overall intensity
  const intensity = calculateIntensity(data);

  return {
    // AudioEngine expects 'bpm' but we're passing wind speed
    // (it internally converts to LFO rate)
    bpm: windSpeed,

    // Kp interference (distortion param interpreted as Kp-based effect)
    distortion: interference,

    // Drone filter cutoff
    filterFrequency: filterFreq,
    filterFreq: filterFreq, // Alias

    // Flare volume boost
    volumeBoost,

    // Overall intensity for mixing
    intensity,

    // Raw telemetry values for UI/debugging
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
 * Calculate a "danger level" for UI indicators
 * Based primarily on Kp index with flare modifiers
 * 
 * @returns 0 = Safe, 1 = Elevated, 2 = High, 3 = Severe, 4 = Extreme
 */
export function calculateDangerLevel(data: SpaceWeatherData): number {
  const kp = data.geomagnetic.kp_index;
  const latestFlare = data.flares.length > 0 ? data.flares[0] : null;
  const flareClass = latestFlare?.flareClass?.charAt(0) || '';

  let level = 0;

  // Base level from Kp
  if (kp >= 8) level = 4;      // Extreme (G4+ storm)
  else if (kp >= 6) level = 3; // Severe (G2-G3)
  else if (kp >= 5) level = 2; // High (G1)
  else if (kp >= 4) level = 1; // Elevated
  else level = 0;              // Safe

  // Flare can bump up by 1
  if (flareClass === 'X' && level < 4) level++;
  if (flareClass === 'M' && level < 3) level = Math.max(level, 2);

  return level;
}

/**
 * Get human-readable danger label
 */
export function getDangerLabel(level: number): string {
  const labels = ['NOMINAL', 'ELEVATED', 'HIGH', 'SEVERE', 'EXTREME'];
  return labels[Math.max(0, Math.min(4, level))];
}

/**
 * Validates if space weather data is within expected ranges
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
 * Useful for crossfading between different states
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
    filterFrequency: lerp(from.filterFrequency, to.filterFrequency),
    filterFreq: lerp(from.filterFreq, to.filterFreq),
    volumeBoost: lerp(from.volumeBoost, to.volumeBoost),
    intensity: lerp(from.intensity, to.intensity),
    raw: to.raw,
  };
}

// Legacy export for backwards compatibility
export function solarWindSpeedToBPM(speed: number): number {
  return solarWindSpeedToLFORate(speed);
}