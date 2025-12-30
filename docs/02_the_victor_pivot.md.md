# THE VICTOR PROTOCOL (Refactoring for Impact)

## Feedback Analysis
Critique: Project is a "Toy". No "So What?" factor.
Pivot Goal: Financialize the data. Make it scary.

## The "Victor" Feature Set
1. [x] **Geo-Risk Engine:**
   - Move from hardcoded Lat > 50 to NOAA Auroral Oval formula.
   - Formula: 66.5 - (Kp * 2.8).

2. [x] **Economic Ticker:**
   - Map Kp Index to $$$ loss.
   - Why? Investors love big numbers.

3. [x] **Viral Export:**
   - Abandon WAV download.
   - Implement `canvas.captureStream()` for .webm video export.

4. [x] **Scarcity:**
   - Implement Time-Lock on the "Carrington Event" (18:00 Local).
   - 