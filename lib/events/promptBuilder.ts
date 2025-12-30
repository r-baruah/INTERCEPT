/**
 * Prompt Builder for "The Operator" AI DJ
 * 
 * Constructs context-aware prompts for Groq LLM to generate
 * witty, HAL 9000-inspired space weather announcements.
 */

import type { AnySpaceWeatherEvent, MajorFlareEvent, GeomagneticStormEvent, SolarWindEvent } from '@/types/events';
import type { SpaceWeatherData } from '@/types/nasa';
import { SpaceWeatherEventType } from '@/types/events';

/**
 * Build context-aware prompts for The Operator
 * 
 * @param event - The space weather event to announce
 * @param currentData - Optional current space weather data for additional context
 * @returns Formatted prompt for Groq LLM
 */
export function buildPrompt(
  event: AnySpaceWeatherEvent, 
  currentData?: SpaceWeatherData
): string {
  switch (event.type) {
    case SpaceWeatherEventType.MAJOR_FLARE:
      return buildFlarePrompt(event as MajorFlareEvent, currentData);
    
    case SpaceWeatherEventType.GEOMAGNETIC_STORM:
    case SpaceWeatherEventType.SEVERE_STORM:
      return buildStormPrompt(event as GeomagneticStormEvent, currentData);
    
    case SpaceWeatherEventType.HIGH_SOLAR_WIND:
    case SpaceWeatherEventType.EXTREME_SOLAR_WIND:
      return buildSolarWindPrompt(event as SolarWindEvent, currentData);
    
    case SpaceWeatherEventType.COMPOUND_EVENT:
      return buildCompoundPrompt(event, currentData);
    
    default:
      return buildGenericPrompt(event, currentData);
  }
}

/**
 * Build prompt for solar flare events
 */
function buildFlarePrompt(
  event: MajorFlareEvent, 
  currentData?: SpaceWeatherData
): string {
  const flare = event.flare;
  const severityDesc = getSeverityDescription(event.severity);
  
  return `Announce a solar flare event with these details:
- Flare Class: ${flare.classType}${flare.magnitude} (${severityDesc} intensity)
- Source Region: ${flare.sourceRegion}
- Detection Time: Just detected
- Peak Time: ${new Date(flare.peakTime).toISOString()}

Create a dramatic but calm announcement in your HAL 9000-meets-jazz-DJ style. Maximum 150 characters total.`;
}

/**
 * Build prompt for geomagnetic storm events
 */
function buildStormPrompt(
  event: GeomagneticStormEvent,
  currentData?: SpaceWeatherData
): string {
  const kpIndex = event.kpIndex;
  const stormLevel = event.stormLevel;
  const severityDesc = getSeverityDescription(event.severity);
  
  return `Announce a geomagnetic storm:
- Kp Index: ${kpIndex} (${severityDesc} storm level)
- Storm Level: ${stormLevel}
- Magnetosphere Status: ${kpIndex >= 7 ? 'Severe disturbance' : 'Active conditions'}
- Impact: ${kpIndex >= 8 ? 'Extreme auroral activity' : 'Enhanced auroral displays'}

Create a mysterious announcement about Earth's magnetic field responding. Maximum 150 characters total.`;
}

/**
 * Build prompt for high solar wind events
 */
function buildSolarWindPrompt(
  event: SolarWindEvent,
  currentData?: SpaceWeatherData
): string {
  const speed = event.speed;
  const severityDesc = getSeverityDescription(event.severity);
  
  return `Announce high-speed solar wind:
- Wind Speed: ${speed.toFixed(0)} km/s (${severityDesc} level)
- Particle Flux: ${event.severity === 'EXTREME' ? 'Extreme' : 'Elevated'}
- Status: ${speed >= 800 ? 'Exceptional velocity' : 'Accelerated stream'}

Create a tense announcement about particle acceleration. Maximum 150 characters total.`;
}

/**
 * Build prompt for compound events
 */
function buildCompoundPrompt(
  event: AnySpaceWeatherEvent,
  currentData?: SpaceWeatherData
): string {
  const severityDesc = getSeverityDescription(event.severity);
  
  return `Announce a compound space weather event:
- Multiple simultaneous conditions detected
- Overall Severity: ${severityDesc}
- Description: ${event.description}

Create an ominous announcement about multiple space weather phenomena converging. Maximum 150 characters total.`;
}

/**
 * Build generic prompt for other event types
 */
function buildGenericPrompt(
  event: AnySpaceWeatherEvent,
  currentData?: SpaceWeatherData
): string {
  const severityDesc = getSeverityDescription(event.severity);
  
  return `Announce this space weather event:
- Event Type: ${event.type}
- Severity: ${severityDesc}
- Description: ${event.description}

Create a compelling announcement in your signature style. Maximum 150 characters total.`;
}

/**
 * Get human-readable severity description
 */
function getSeverityDescription(severity: string): string {
  const descriptions: Record<string, string> = {
    LOW: 'minor',
    MODERATE: 'moderate',
    HIGH: 'high',
    SEVERE: 'severe',
    EXTREME: 'extreme'
  };
  
  return descriptions[severity] || severity.toLowerCase();
}

/**
 * System prompt defining "The Operator" personality
 * Used as the system message in Groq API calls
 */
export function getSystemPrompt(): string {
  return `You are "The Operator" - the AI DJ for Cosmic Radio, a space weather sonification station.

PERSONALITY:
- Calm and mysterious like HAL 9000, but warmer and more playful
- Professional radio announcer mixed with enigmatic space station AI
- Subtle dry humor, never cheesy
- Scientific accuracy delivered with dramatic flair
- Occasionally cryptic, always compelling

VOICE STYLE:
- Speak in present tense, as if observing in real-time
- Use radio DJ techniques: "We have incoming...", "Attention listeners..."
- Reference cosmic/astronomical imagery
- Keep a sense of wonder and danger balanced
- No excessive punctuation or exclamation marks

CONSTRAINTS:
- Maximum 2-3 sentences (under 150 characters TOTAL)
- No emojis or special characters
- No questions to the audience
- End with period, never exclamation marks (stay calm)
- Must be self-contained - no references to "tuning in" or "stay with us"

EXAMPLE TONE:
"Solar winds accelerate to 650 kilometers per second. The magnetosphere trembles. This is Cosmic Radio."
"M-class flare detected from Active Region 3576. Electromagnetic turbulence inbound. Adjust your frequencies."
"Kp index rises to seven. Geomagnetic storm conditions intensify. Aurora watchers take note."

IMPORTANT: Your response should be ONLY the announcement script, nothing else. No preamble, no explanation.`;
}