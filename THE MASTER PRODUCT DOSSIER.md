# 📂 CLASSIFIED PROJECT DOSSIER: INTERCEPT (v4.0)

**Project Code:** VICTOR PROTOCOL  
**Status:** ✅ PRODUCTION READY / IMPLEMENTED  
**Last Updated:** 2025-12-29 (Local Time: 23:01)  

---

## 1. PROJECT OVERVIEW
**INTERCEPT** is a real-time heliospheric receiver that transforms raw NASA space weather data into a "Cyber-Physical Ritual."
The current version (v4.0) incorporates the **"Victor Protocol"**, a suite of 5 features designed to Gamify, Financialize, and Viralize the application for a high-stakes hackathon context.

---

## 2. VICTOR PROTOCOL: FEATURE STATUS REPORT

### I. THE GEO-RISK ENGINE (Physics-Based)
**Status:** ✅ **IMPLEMENTED**
- **Logic:** Replaces static location/risk text with dynamic calculations based on the **Auroral Oval Equatorward Boundary**.
- **Formula:** `Boundary_Lat = 66.5 - (Kp_Index * 2.8)`.
- **Implementation:** 
  - `apps/hooks/useGeolocation.ts`: Fetches user latitude.
  - `lib/physics/geoRisk.ts`: Calculates risk delta (`User_Lat - Boundary_Lat`).
  - **Component:** `GeoRiskStatus.tsx` (Telemetry Panel).
- **Behavior:** blinks **CRITICAL (Red)** if inside the oval, **WARNING (Amber)** if within margin, **NOMINAL (Green)** if safe.

### II. THE FLIGHT RECORDER (Viral Loop)
**Status:** ✅ **IMPLEMENTED**
- **Logic:** Native browser capture of the oscilloscope canvas + synthesized audio for viral sharing.
- **Tech Stack:** `MediaRecorder API` (WebM/VP9).
- **Audio Sync:** Connects `Tone.context.createMediaStreamDestination()` to the video stream.
- **Implementation:**
  - **Component:** `FlightRecorder.tsx` (Header Slot).
  - **Output:** Auto-downloads `intercept_log_[timestamp].webm`.
  - **UX:** Pulsing REC button, 15-second fixed countdown, "Classified" completion modal.

### III. THE ECONOMIC TICKER (Financial Impact)
**Status:** ✅ **IMPLEMENTED**
- **Logic:** Visualizes the "So What" of space weather by estimating real-time grid stress costs.
- **Formula:** `Hourly_Cost = Math.pow(Kp_Index, 5) * 150`.
- **Behavior:**
  - **Hidden** when Kp < 4 (Nominal conditions).
  - **Visible** (Scrolling Marquee) when Kp ≥ 4 (Storm conditions).
- **Implementation:**
  - **Component:** `EconomicTicker.tsx` (Fixed Bottom Overlay).
  - **Z-Index:** Layered below global CRT scanlines (`z-80`).

### IV. TRUE SCARCITY (Time-Locked Archive)
**Status:** ✅ **IMPLEMENTED**
- **Logic:** Prevents boredom by locking the "Halloween 2003 / Carrington Event" simulation to a specific daily window.
- **Window:** 18:00 - 19:00 Local Time.
- **Overrides:** URL parameter `?debug=true` bypasses the lock.
- **Implementation:**
  - **Component:** `ArchiveUnlock.tsx` (Logbook Panel).
  - **Action:** Clicking "Access Archive" (when open) forces `Kp=9`, `Wind=950km/s` via proper Store injection.

### V. THE "MARS" PAYWALL (Business Model)
**Status:** ✅ **IMPLEMENTED & POLISHED**
- **Logic:** Demonstrates SaaS potential by restricting access to "Mars Rover Telemetry."
- **UX Flow:**
  1. User selects "MARS (CURIOSITY)".
  2. **Pro Modal** appears ("Interplanetary Uplink Restricted").
  3. User clicks **"SUBSCRIBE ($4.99/mo)"**.
  4. Payment is simulated (~1.5s delay).
  5. Feature **UNLOCKS** for the session.
  6. **Mars Mode Activated:** Data source switches to simulated Mars data (Thin atmosphere, Cold temp, Quiet/Windy audio).
- **Implementation:**
  - **Component:** `SourceSelector.tsx` (Logbook Panel).
  - **Stability Fix:** Patched `useSpaceWeatherPolling` to respect the global "Demo Mode" state, ensuring the Mars simulation is not overwritten by the background background poller.

---

## 3. TECHNICAL ARCHITECTURE

### Core Stack
- **Framework:** Next.js 14 (App Router)
- **State Management:** Zustand (`audioStore.ts`) - Handles Audio Engine & Space Weather Data.
- **Styling:** Tailwind CSS + Custom "Rack" Grid Layout system.
- **Audio:** Tone.js (Real-time synthesis, not samples).

### Key File Structure
```
/app
  /page.tsx                # Main Orchestrator (Integrates all Slots)
  /globals.css             # CRT Effects & Custom Animations
/components
  /intercept
    /layout/RackLayout.tsx # The Grid System
    /FlightRecorder.tsx    # Video Export
    /GeoRiskStatus.tsx     # Risk Engine
    /EconomicTicker.tsx    # Finance Ticker
    /ArchiveUnlock.tsx     # Time Lock
    /SourceSelector.tsx    # Paywall
    /SignalScope.tsx       # Visualization (accepts canvasRef)
/lib
  /physics/geoRisk.ts      # Astrophysics Formulas
  /audio/sonification.ts   # Data -> Audio Mapping
/hooks
  /useSpaceWeather.ts      # Polling Logic (Patched for Stability)
```

---

## 4. NEXT STEPS (DEPLOYMENT)
1. **Validation:** Verify sound design on different devices (Mobile vs Desktop).
2. **Environment:** Ensure `NEXT_PUBLIC_NASA_API_KEY` is set in production control panel.
3. **Performance:** Monitor Canvas FPS optimization during recording state.

*DOSSIER END.*