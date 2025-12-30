/**
 * Musical scales for Cosmic Radio
 * Deep space ambient sound palette for space weather sonification
 * Enhanced v2.0 - More haunting and cinematic
 */

// A Minor Pentatonic - Haunting, mysterious (primary scale)
export const A_MINOR_PENTATONIC = ['A2', 'C3', 'D3', 'E3', 'G3'];

// Higher octave for melodic elements
export const A_MINOR_PENTATONIC_HIGH = ['A4', 'C5', 'D5', 'E5', 'G5'];

// Mid-range for arpeggios
export const A_MINOR_PENTATONIC_MID = ['A3', 'C4', 'D4', 'E4', 'G4'];

// Legacy C Minor scales (for compatibility)
export const C_MINOR_PENTATONIC = ['C2', 'Eb2', 'F2', 'G2', 'Bb2'];
export const C_MINOR_PENTATONIC_HIGH = ['C4', 'Eb4', 'F4', 'G4', 'Bb4'];
export const C_MINOR_PENTATONIC_MID = ['C3', 'Eb3', 'F3', 'G3', 'Bb3'];

// Celestial shimmer notes (high register sparkles)
export const CELESTIAL_SHIMMER = ['E5', 'G5', 'A5', 'C6', 'D6', 'E6'];

// Deep bass drones
export const BASS_DRONES = ['A1', 'D1', 'E1', 'G1'];

/**
 * Get a random note from a scale
 */
export function getRandomNote(scale: string[]): string {
  return scale[Math.floor(Math.random() * scale.length)];
}

/**
 * Get note by index (wraps around)
 */
export function getNoteByIndex(scale: string[], index: number): string {
  return scale[index % scale.length];
}

/**
 * Get a random note with velocity
 */
export function getRandomNoteWithVelocity(scale: string[]): { note: string; velocity: number } {
  return {
    note: scale[Math.floor(Math.random() * scale.length)],
    velocity: 0.3 + Math.random() * 0.5
  };
}
