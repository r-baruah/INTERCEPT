📄 IMPLEMENTATION BRIEF: "PROJECT INTERCEPT" REFACTOR
Priority: IMMEDIATE
Goal: Maximize Contextual Intelligence for Non-Expert Judges.
1. UI REFACTOR: "THE RACK" LAYOUT
Objective: Replace floating overlays with a grounded, grid-based instrumentation panel.
 * Structure: CSS Grid. Three distinct vertical columns (Telemetry | Scope/Tuner | Log/Status).
 * Style: Faint, thin border lines (10% opacity) separating modules. "Server Rack" aesthetic.
 * CRT Overlay: Global pointer-events: none container with scanlines and slight chromatic aberration at the edges.
2. DATA VISUALIZATION: "THREAT LEVEL" LOGIC
Objective: Translate raw numbers into human safety margins.
A. Solar Wind Speed (The Engine)
 * Display: SPEED: [Value] km/s
 * Context Line (New):
   * Value < 400: NOMINAL (Color: #00FF00 Green)
   * Value 400 - 600: ELEVATED (Color: #FFBF00 Amber)
   * Value > 600: STORM VELOCITY (Color: #FF0000 Red + Blink)
B. K-Index (The Shield)
 * Display: Kp: [Value]
 * Context Line (New - The "So What?"):
   * Value < 4: IONOSPHERE STABLE (Green)
   * Value 4 - 6: RADIO INTERFERENCE (Amber)
   * Value > 6: BLACKOUT WARNING (Red + Glitch Effect)
3. FEATURE: SIMULATION MODE (The Demo Maker)
Objective: A "God Mode" toggle to force the app into a specific state for recording the demo video.
 * Hidden Trigger: Keyboard shortcut (e.g., Ctrl + Shift + S) or a hidden button.
 * State Override:
   * solarWindSpeed -> 850 km/s (Triggers Red Alert).
   * kIndex -> 8.0 (Triggers Extreme Storm Visuals).
   * isFlareActive -> True (Triggers AI Sentry Voice).
4. ONBOARDING: THE "BIOS" BOOT SEQUENCE
Objective: Teach the judge what the metrics mean while the app loads.
 * Animation: Typewriter effect text on a black screen before the main UI appears.
 * Copy:
   * > INITIALIZING TELEMETRY LINK...
   * > CALIBRATING D-RAP SENSORS (RADIO PROPAGATION)...
   * > SYNCHRONIZING SOLAR WIND AUDIO OSCILLATORS...
   * > CONNECTION ESTABLISHED.