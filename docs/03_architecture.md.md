# SYSTEM ARCHITECTURE

## Data Flow
[NASA API] -> [Zustand Store (60s Polling)] -> [UI Components]

## Audio Engine (Tone.js)
- Layer 1: Drone (Pitch mapped to Solar Wind Speed).
- Layer 2: Glitch (Bitcrusher mapped to Kp Index).
- Layer 3: Voice (Side-chained "Operator" alerts).

## Visual Pipeline
1. Fetch Telemetry.
2. Update React State.
3. Render Canvas Oscilloscope (60fps).
4. Capture Stream -> MediaRecorder -> Download.
